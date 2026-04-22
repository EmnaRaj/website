"""
Interactive Stockpile Volume Tool — run_5.py
============================================
Uses fine-tuned SAM mask decoder (trained on Zeebrugge pile perimeters).
Works on ANY dataset — box-drag to detect, automatic volume calculation.

Usage:
  python3 interactive/run_5.py \
      --ortho  "files/odm_orthophoto/odm_orthophoto.tif" \
      --dsm    "files/odm_dem/dsm.tif" \
      --decoder "interactive/sam_piles_decoder.pth"

  # Or without fine-tuned decoder (falls back to vanilla SAM):
  python3 interactive/run_5.py \
      --ortho  "files/odm_orthophoto/odm_orthophoto.tif" \
      --dsm    "files/odm_dem/dsm.tif"

Controls:
  Left-drag  = draw box → detect pile → compute volume
  R          = undo last result
  S          = save JSON
  Q / Esc    = save & quit
"""

import argparse, json, os, sys
import cv2
import numpy as np
import rasterio
import rasterio.enums
import rasterio.features
import rasterio.windows
import torch
from shapely.geometry import mapping, shape

_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(_DIR, "results_run5.json")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── globals ───────────────────────────────────────────────────────────────────
_ortho_path = _dsm_path = _decoder_path = None
_preview_img = _sam_rgb = None
_preview_scale = _sam_scale = 1.0
_geo_tf = None
_img_w = _img_h = 0

_sam_geo = None
_sam_ready = False
_box_start = _box_drawing = None
_box_drawing = False

results  = []
overlay  = None

COLORS = [
    (0, 100, 255), (0, 210, 120), (255, 180, 0),
    (60, 20, 220), (200, 60, 255), (0, 220, 220),
    (0, 180, 255), (255, 100, 0), (100, 255, 80),
]


# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────
def _build_preview(max_dim=1400):
    global _preview_img, _preview_scale, overlay, _geo_tf, _img_w, _img_h
    global _sam_rgb, _sam_scale
    print("[Setup] Loading orthophoto…", flush=True)
    with rasterio.open(_ortho_path) as src:
        _geo_tf, _img_w, _img_h = src.transform, src.width, src.height
        h, w = src.height, src.width
        sc_read = min(1.0, 4096 / max(h, w))
        out_h = max(1, int(h * sc_read))
        out_w = max(1, int(w * sc_read))
        arr = src.read(out_shape=(src.count, out_h, out_w),
                       resampling=rasterio.enums.Resampling.bilinear)

    rgb = np.moveaxis(arr[:3], 0, -1) if arr.shape[0] >= 3 else np.dstack([arr[0]] * 3)
    if rgb.dtype != np.uint8:
        lo, hi = rgb.min(), rgb.max()
        rgb = ((rgb.astype(np.float32) - lo) / max(hi - lo, 1) * 255).astype(np.uint8)

    rh, rw = rgb.shape[:2]
    sc_prev = max_dim / max(rh, rw) if max(rh, rw) > max_dim else 1.0
    _preview_scale = 1.0 / (sc_read * sc_prev)

    rgb_prev = cv2.resize(rgb, (int(rw * sc_prev), int(rh * sc_prev))) if sc_prev < 1 else rgb.copy()
    _preview_img = cv2.cvtColor(rgb_prev, cv2.COLOR_RGB2BGR)
    overlay = _preview_img.copy()

    sc_sam = min(1.0, 1024 / max(h, w))
    _sam_scale = 1.0 / sc_sam
    _sam_rgb = cv2.resize(rgb, (max(1, int(w * sc_sam)), max(1, int(h * sc_sam)))) if sc_sam < 1 else rgb.copy()

    print(f"[Setup] Ortho {w}×{h} → window {_preview_img.shape[1]}×{_preview_img.shape[0]}"
          f"  1px={_preview_scale:.3f}m", flush=True)


def _load_sam(decoder_path=None):
    global _sam_geo, _sam_ready
    from samgeo.samgeo3 import SamGeo3
    print("[SAM3] Loading model (enable_inst_interactivity=True) …", flush=True)
    _sam_geo = SamGeo3(backend="meta", enable_inst_interactivity=True,
                       load_from_HF=True)

    if decoder_path and os.path.exists(decoder_path):
        print(f"[SAM3] Loading fine-tuned decoder: {decoder_path}", flush=True)
        inner   = _sam_geo.model.inst_interactive_predictor.model
        state   = torch.load(decoder_path, map_location="cpu")
        inner.sam_mask_decoder.load_state_dict(state)
        print("[SAM3] Fine-tuned decoder loaded ✓", flush=True)
    elif decoder_path:
        print(f"[SAM3] Decoder not found ({decoder_path}) — using vanilla SAM3", flush=True)

    _sam_geo.set_image(_sam_rgb)
    _sam_ready = True
    print("[SAM3] Ready.", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# Volume calculation (same robust approach as run_4.py)
# ─────────────────────────────────────────────────────────────────────────────
def _calc_volume(geo_poly):
    """
    Floor = tight ring outside polygon → IQR-clean → least-squares tilted plane.
    For open-air piles this is accurate.  No perim_z available here (SAM mode).
    """
    area_m2 = geo_poly.area
    try:
        with rasterio.open(_dsm_path) as src:
            res     = abs(src.res[0])
            px_area = res * res
            pad     = max(5.0, 20 * res)
            b       = geo_poly.buffer(pad).bounds
            win     = src.window(b[0], b[1], b[2], b[3]).intersection(
                          rasterio.windows.Window(0, 0, src.width, src.height))
            patch   = src.read(1, window=win).astype(np.float64)
            tf      = src.window_transform(win)

        patch[(patch < -9000) | np.isnan(patch)] = np.nan

        ph, pw = patch.shape
        ri, ci = np.meshgrid(np.arange(ph), np.arange(pw), indexing='ij')
        gx_all = tf.c + ci * tf.a
        gy_all = tf.f + ri * tf.e

        try:
            from shapely import contains_xy as _cxy
            in_p = _cxy(geo_poly, gx_all, gy_all)
            ring_geom = geo_poly.buffer(pad).difference(geo_poly.buffer(max(0.5, 2*res)))
            in_r = _cxy(ring_geom, gx_all, gy_all)
        except ImportError:
            from shapely.vectorized import contains as _vc
            in_p = _vc(geo_poly, gx_all, gy_all)
            ring_geom = geo_poly.buffer(pad).difference(geo_poly.buffer(max(0.5, 2*res)))
            in_r = _vc(ring_geom, gx_all, gy_all)

        # Interior pixels
        z_i = patch[in_p]; x_i = gx_all[in_p]; y_i = gy_all[in_p]
        ok  = ~np.isnan(z_i)
        z_i, x_i, y_i = z_i[ok], x_i[ok], y_i[ok]
        if len(z_i) == 0: return 0.0, area_m2, 0.0

        # Ring pixels → tilted ground plane
        z_r = patch[in_r]; x_r = gx_all[in_r]; y_r = gy_all[in_r]
        ok_r = ~np.isnan(z_r)
        z_r, x_r, y_r = z_r[ok_r], x_r[ok_r], y_r[ok_r]
        if len(z_r) < 10:
            # Fallback: flat floor at p5 of interior
            floor = np.full(len(z_i), float(np.percentile(z_i, 5)))
        else:
            q1, q3 = np.percentile(z_r, 25), np.percentile(z_r, 75)
            iqr = q3 - q1
            keep = (z_r >= q1 - 1.5*iqr) & (z_r <= q3 + 1.5*iqr)
            z_r, x_r, y_r = z_r[keep], x_r[keep], y_r[keep]
            A = np.column_stack([x_r, y_r, np.ones(len(x_r))])
            params, *_ = np.linalg.lstsq(A, z_r, rcond=None)
            a_p, b_p, c_p = params
            floor = a_p * x_i + b_p * y_i + c_p

        ndsm  = np.maximum(z_i - floor, 0.0)
        vol   = float(np.sum(ndsm) * px_area)
        max_h = float(np.max(ndsm))
        print(f"  [Vol] ring_mean={z_r.mean():.2f}m  Vol={vol:.3f}m³  MaxH={max_h:.3f}m"
              f"  Area={area_m2:.0f}m²", flush=True)
        return vol, area_m2, max_h

    except Exception as e:
        import traceback; traceback.print_exc()
        return 0.0, area_m2, 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Draw
# ─────────────────────────────────────────────────────────────────────────────
def _geo_to_px(gx, gy):
    inv = ~_geo_tf
    c, r = inv * (gx, gy)
    return int(c / _preview_scale), int(r / _preview_scale)


def _draw_result(r, color):
    poly = shape(r["geometry"])
    boundary = poly.boundary
    rings = list(boundary.geoms) if boundary.geom_type == "MultiLineString" else [boundary]
    for ring in rings:
        pts = np.array([_geo_to_px(c[0], c[1]) for c in ring.coords], dtype=np.int32)
        cv2.polylines(overlay, [pts.reshape(-1,1,2)], True, color, 2, cv2.LINE_AA)
    cx, cy = _geo_to_px(poly.centroid.x, poly.centroid.y)
    cv2.putText(overlay, f"{r['vol']:.0f}m3", (cx - 25, cy),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)


def _refresh():
    overlay[:] = _preview_img.copy()
    for i, r in enumerate(results):
        _draw_result(r, COLORS[i % len(COLORS)])
    cv2.imshow("Stockpile Tool", overlay)


# ─────────────────────────────────────────────────────────────────────────────
# Mouse
# ─────────────────────────────────────────────────────────────────────────────
def _on_mouse(event, x, y, flags, param):
    global _box_start, _box_drawing
    if not _sam_ready: return

    if event == cv2.EVENT_LBUTTONDOWN:
        _box_start = (x, y); _box_drawing = True

    elif event == cv2.EVENT_MOUSEMOVE and _box_drawing:
        tmp = overlay.copy()
        cv2.rectangle(tmp, _box_start, (x, y), (0, 255, 0), 2)
        cv2.imshow("Stockpile Tool", tmp)

    elif event == cv2.EVENT_LBUTTONUP and _box_drawing:
        _box_drawing = False
        x0, y0 = _box_start
        if abs(x - x0) < 5 or abs(y - y0) < 5: return

        # Convert preview → SAM pixel coords
        def to_sam(px, py):
            return (int(px * _preview_scale / _sam_scale),
                    int(py * _preview_scale / _sam_scale))
        sx0, sy0 = to_sam(min(x0, x), min(y0, y))
        sx1, sy1 = to_sam(max(x0, x), max(y0, y))
        box_arr = np.array([[sx0, sy0, sx1, sy1]])
        print(f"\n[Box] SAM predict box={box_arr[0].tolist()}", flush=True)

        masks, scores, _ = _sam_geo.predict_inst(
            box=box_arr[0], multimask_output=True)
        mask_u8 = masks[np.argmax(scores)].astype(np.uint8)
        mask_full = cv2.resize(mask_u8, (_img_w, _img_h), interpolation=cv2.INTER_NEAREST)

        # Convex hull to fill any scoop / concave artefacts
        cnts, _ = cv2.findContours(mask_full, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
            filled = np.zeros_like(mask_full)
            cv2.fillConvexPoly(filled, hull, 1)
            mask_full = filled

        polys = [shape(g) for g, v in
                 rasterio.features.shapes(mask_full, mask=mask_full, transform=_geo_tf) if v > 0]
        if not polys:
            print("[SAM] No polygon found.", flush=True); return
        geo_poly = max(polys, key=lambda p: p.area)
        print(f"[SAM] Polygon area={geo_poly.area:.1f}m²", flush=True)

        vol, area, max_h = _calc_volume(geo_poly)
        results.append({
            "id":     len(results) + 1,
            "vol":    round(vol, 3),
            "area":   round(area, 2),
            "max_h":  round(max_h, 3),
            "geometry": mapping(geo_poly),
        })
        _refresh()


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def _save():
    with open(OUTPUT_JSON, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[Save] {len(results)} result(s) → {OUTPUT_JSON}", flush=True)


def main():
    global _ortho_path, _dsm_path, _decoder_path
    parser = argparse.ArgumentParser()
    parser.add_argument("--ortho",   required=True, help="Orthophoto GeoTIFF")
    parser.add_argument("--dsm",     required=True, help="DSM GeoTIFF")
    parser.add_argument("--decoder", default=None,  help="Fine-tuned decoder .pth (optional)")
    args = parser.parse_args()

    _ortho_path   = args.ortho
    _dsm_path     = args.dsm
    _decoder_path = args.decoder

    _build_preview()
    _load_sam(decoder_path=_decoder_path)

    cv2.namedWindow("Stockpile Tool", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Stockpile Tool", _on_mouse)
    cv2.imshow("Stockpile Tool", overlay)

    decoder_label = "fine-tuned" if (_decoder_path and os.path.exists(_decoder_path or "")) else "vanilla SAM"
    print(f"\nREADY [{decoder_label}] — drag box around each pile", flush=True)
    print("  Drag = detect + volume  |  R = undo  |  S = save  |  Q = quit")

    while True:
        k = cv2.waitKey(50) & 0xFF
        if k in (ord('q'), 27): break
        elif k == ord('r') and results:
            results.pop(); _refresh(); print("[Undo]", flush=True)
        elif k == ord('s'):
            _save()

    _save()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
