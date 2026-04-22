"""
Interactive Stockpile Volume Tool — run_4.py
============================================
Two input modes:
  (a) --perims DXF/GeoJSON/SHP  →  click to select pre-surveyed perimeters
  (b) no --perims                →  SAM3 box-drag to detect piles on the fly

Volume algorithm (3-step, handles both open-air and walled bays):
  1. Read DSM inside polygon
  2. Detect floor:
       • bz_range ≤ 1m (open-air): interpolate boundary Z as tilted plane
       • bz_range > 1m (walled):   find slab level = plateau just above wall toe
         = mode of interior DSM in range [bnd_z_low_p90, bnd_z_low_p90 + 2m]
  3. Volume = Σ max(DSM − floor, 0) × px_area

Usage:
  # Perimeter mode (no SAM needed)
  python3 interactive/run_4.py \
      --ortho "zee_files/Zeebrugge Stocks.Ii.tif" \
      --dsm   "zee_files/ELEVATION.tif" \
      --perims "zee_files/pile perimeters.dxf"

  # SAM mode (box-drag detection)
  python3 interactive/run_4.py \
      --ortho "zee_files/Zeebrugge Stocks.Ii.tif" \
      --dsm   "zee_files/ELEVATION.tif"

Controls (perimeter mode):
  Left-click = compute pile / click again to deselect
  A          = compute ALL piles
  R          = reset
  S          = save JSON
  Q / Esc    = save & quit

Controls (SAM box mode):
  Left-drag  = draw box → SAM segments → volume computed
  R          = undo last
  Q / Esc    = save & quit
"""

import argparse, json, os, sys
import cv2
import numpy as np
import rasterio
import rasterio.enums
import rasterio.features
import rasterio.mask
import rasterio.windows
from shapely.geometry import Polygon, mapping, shape

_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(_DIR, "results_run4.json")

# ── globals ───────────────────────────────────────────────────────────────────
_ortho_path = _dsm_path = None
_preview_img = _sam_rgb = None
_preview_scale = _sam_scale = 1.0
_geo_tf = None
_img_w = _img_h = 0

_perims  = []   # Shapely Polygons
_perim_z = []   # (bnd_x, bnd_y, bnd_z) or None per perimeter

_sam3       = None
_sam_ready  = False
_mode       = "perims"   # "perims" or "box"
_box_start  = None
_box_drawing = False

results  = {}   # idx → result dict (perims mode) or list (box mode)
_results_list = []   # for box mode
overlay  = None

COLORS = [
    (0, 100, 255), (0, 210, 120), (255, 180, 0),
    (60, 20, 220), (200, 60, 255), (0, 220, 220),
    (0, 180, 255), (255, 100, 0), (100, 255, 80),
]
IDLE_COLOR = (180, 180, 180)


# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────
def _build_preview(max_dim=1400):
    global _preview_img, _preview_scale, overlay, _geo_tf, _img_w, _img_h
    global _sam_rgb, _sam_scale
    print("[Preview] Loading orthophoto…", flush=True)
    with rasterio.open(_ortho_path) as src:
        _geo_tf, _img_w, _img_h = src.transform, src.width, src.height
        h, w = src.height, src.width
        sc_read = min(1.0, 4096 / max(h, w))
        out_h, out_w = max(1, int(h * sc_read)), max(1, int(w * sc_read))
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

    # SAM image (max 1024 px, from original full-res)
    sc_sam = min(1.0, 1024 / max(h, w))
    _sam_scale = 1.0 / sc_sam
    _sam_rgb = cv2.resize(rgb, (max(1, int(w * sc_sam)), max(1, int(h * sc_sam)))) if sc_sam < 1 else rgb.copy()

    print(f"[Preview] {w}×{h} → window {_preview_img.shape[1]}×{_preview_img.shape[0]}"
          f"  1px={_preview_scale:.3f}m", flush=True)


def _load_perimeters(path):
    global _perims, _perim_z
    import geopandas as gpd
    print(f"[Perims] Loading {path}…", flush=True)
    gdf = gpd.read_file(path)
    with rasterio.open(_ortho_path) as src:
        rcrs = src.crs
    if gdf.crs is not None and gdf.crs != rcrs:
        gdf = gdf.to_crs(rcrs)

    def _extract(geom):
        raw = list(geom.coords)
        if len(raw) < 3:
            return None
        has_z = len(raw[0]) >= 3
        xy = [(c[0], c[1]) for c in raw]
        if xy[0] != xy[-1]:
            xy.append(xy[0])
            if has_z: raw.append(raw[0])
        poly = Polygon(xy)
        if not poly.is_valid or poly.area <= 0:
            return None
        if has_z:
            return poly, (np.array([c[0] for c in raw]),
                          np.array([c[1] for c in raw]),
                          np.array([c[2] for c in raw], dtype=np.float64))
        return poly, None

    polys, zdata = [], []
    for geom in gdf.geometry:
        if geom is None or geom.is_empty:
            continue
        if geom.geom_type in ("LineString", "LinearRing"):
            r = _extract(geom)
            if r:
                polys.append(r[0]); zdata.append(r[1])
        elif geom.geom_type == "MultiLineString":
            for ls in geom.geoms:
                r = _extract(ls)
                if r:
                    polys.append(r[0]); zdata.append(r[1])
        elif geom.geom_type == "Polygon":
            polys.append(geom); zdata.append(None)
        elif geom.geom_type == "MultiPolygon":
            for g in geom.geoms:
                polys.append(g); zdata.append(None)

    _perims, _perim_z = polys, zdata
    nz = sum(1 for z in zdata if z is not None)
    print(f"[Perims] {len(polys)} polygon(s), {nz} with surveyed Z", flush=True)


def _load_sam3():
    global _sam3, _sam_ready
    print("[SAM3] Loading model…", flush=True)
    from samgeo.samgeo3 import SamGeo3
    _sam3 = SamGeo3(backend="meta", enable_inst_interactivity=True, load_from_HF=True)
    _sam3.set_image(_sam_rgb)
    _sam_ready = True
    print("[SAM3] Ready.", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# Volume calculation
# ─────────────────────────────────────────────────────────────────────────────
def _calc_volume(geo_poly, perim_z=None):
    """
    Returns (vol_m3, area_m2, max_h_m).

    Floor detection strategy:
      A) perim_z available AND bz_range ≤ 1m  → interpolate boundary Z (open-air)
      B) perim_z available AND bz_range > 1m  → walled bay:
           boundary LOW cluster = yard outside wall  (bz < bz_low_p90)
           slab level = mode of interior DSM in range [bz_low_p90 .. bz_low_p90+2m]
      C) no perim_z  → tight ring outside polygon → IQR-clean → tilted plane
    """
    from scipy.interpolate import LinearNDInterpolator, NearestNDInterpolator

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
        except ImportError:
            from shapely.vectorized import contains as _vc
            in_p = _vc(geo_poly, gx_all, gy_all)

        z_i = patch[in_p];  x_i = gx_all[in_p];  y_i = gy_all[in_p]
        ok  = ~np.isnan(z_i)
        z_i, x_i, y_i = z_i[ok], x_i[ok], y_i[ok]
        if len(z_i) == 0:
            return 0.0, area_m2, 0.0

        # ── Case A & B: DXF boundary Z available ─────────────────────────────
        if perim_z is not None:
            bnd_x, bnd_y, bnd_z = perim_z
            bz_range = bnd_z.max() - bnd_z.min()

            if bz_range <= 1.0:
                # ── A: open-air pile ─────────────────────────────────────────
                # Use boundary Z directly (p10–p90 to drop survey spikes)
                q1, q3 = np.percentile(bnd_z, 10), np.percentile(bnd_z, 90)
                keep = (bnd_z >= q1) & (bnd_z <= q3)
                bx_c, by_c, bz_c = bnd_x[keep], bnd_y[keep], bnd_z[keep]
                interp = LinearNDInterpolator(list(zip(bx_c, by_c)), bz_c)
                ground = interp(x_i, y_i)
                nans = np.isnan(ground)
                if nans.any():
                    nn = NearestNDInterpolator(list(zip(bx_c, by_c)), bz_c)
                    ground[nans] = nn(x_i[nans], y_i[nans])
                method = "DXF-Z(open-air)"
                z_info = f"bnd_z={bnd_z.min():.2f}-{bnd_z.max():.2f}m floor≈{bz_c.mean():.2f}m"

            else:
                # ── B: walled bay ─────────────────────────────────────────────
                # Step 1: isolate the yard / outside-wall cluster = lowest bnd_z values.
                #   They form a tight group → find where the gap begins above them.
                bz_sorted = np.sort(bnd_z)
                gaps      = np.diff(bz_sorted)
                # The boundary between "yard" and "slab/wall" is the first gap ≥ 0.10 m
                # (can be small) that appears in the lower 50% of the Z range.
                z_lower_half = bnd_z.min() + 0.5 * bz_range
                first_gap_idx = None
                for gi in range(len(gaps)):
                    if bz_sorted[gi] > z_lower_half:
                        break
                    if gaps[gi] >= 0.10:
                        first_gap_idx = gi
                        break
                if first_gap_idx is not None:
                    yard_max = bz_sorted[first_gap_idx]
                else:
                    # No clear gap → use lower 40% as yard
                    yard_max = np.percentile(bnd_z, 40)

                # Step 2: slab level = lowest plateau of interior DSM above yard_max.
                # A "plateau" = mode in a 10 cm histogram bin in range [yard_max, yard_max+2m].
                slab_lo = yard_max
                slab_hi = yard_max + 2.0
                z_slab_candidates = z_i[(z_i >= slab_lo) & (z_i <= slab_hi)]

                if len(z_slab_candidates) >= 5:
                    # Histogram at 5 cm resolution → find the most populated bin
                    n_bins = max(5, int((slab_hi - slab_lo) / 0.05))
                    counts, edges = np.histogram(z_slab_candidates, bins=n_bins)
                    # The slab is the lowest dense bin (> 1% of interior pixels)
                    dense_thresh = max(3, 0.01 * len(z_i))
                    dense_bins = np.where(counts >= dense_thresh)[0]
                    if len(dense_bins) > 0:
                        bin_centers = 0.5 * (edges[:-1] + edges[1:])
                        floor_z = float(bin_centers[dense_bins[0]])
                    else:
                        floor_z = float(np.percentile(z_slab_candidates, 10))
                else:
                    # Fallback: p15 of all interior pixels
                    floor_z = float(np.percentile(z_i, 15))

                ground = np.full(len(z_i), floor_z)
                method = "DXF-Z(walled-bay)"
                z_info = (f"bnd_z={bnd_z.min():.2f}-{bnd_z.max():.2f}m "
                          f"yard≤{yard_max:.2f}m  slab={floor_z:.2f}m")

        # ── Case C: no boundary Z → tight-ring tilted plane ──────────────────
        else:
            ring_geom = geo_poly.buffer(pad).difference(geo_poly.buffer(max(0.5, 2 * res)))
            try:
                from shapely import contains_xy as _cxy
                in_r = _cxy(ring_geom, gx_all, gy_all)
            except ImportError:
                from shapely.vectorized import contains as _vc
                in_r = _vc(ring_geom, gx_all, gy_all)
            z_r = patch[in_r]; x_r = gx_all[in_r]; y_r = gy_all[in_r]
            ok_r = ~np.isnan(z_r)
            z_r, x_r, y_r = z_r[ok_r], x_r[ok_r], y_r[ok_r]
            if len(z_r) < 10:
                return 0.0, area_m2, 0.0
            q1, q3 = np.percentile(z_r, 25), np.percentile(z_r, 75)
            iqr = q3 - q1
            keep = (z_r >= q1 - 1.5 * iqr) & (z_r <= q3 + 1.5 * iqr)
            z_r, x_r, y_r = z_r[keep], x_r[keep], y_r[keep]
            A = np.column_stack([x_r, y_r, np.ones(len(x_r))])
            a_p, b_p, c_p, *_ = np.linalg.lstsq(A, z_r, rcond=None)[0]
            ground = a_p * x_i + b_p * y_i + c_p
            method = "Ring-Plane"
            z_info = f"ring_mean={z_r.mean():.3f}m"

        # ── Integrate nDSM ────────────────────────────────────────────────────
        ndsm  = np.maximum(z_i - ground, 0.0)
        vol   = float(np.sum(ndsm) * px_area)
        max_h = float(np.max(ndsm)) if len(ndsm) > 0 else 0.0
        print(f"  [{method}] {z_info}  Vol={vol:.3f}m³  MaxH={max_h:.3f}m  Area={area_m2:.0f}m²",
              flush=True)
        return vol, area_m2, max_h

    except Exception as e:
        import traceback; traceback.print_exc()
        return 0.0, area_m2, 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Draw helpers
# ─────────────────────────────────────────────────────────────────────────────
def _geo_to_px(gx, gy):
    inv = ~_geo_tf
    c, r = inv * (gx, gy)
    return int(c / _preview_scale), int(r / _preview_scale)


def _px_to_geo(px, py):
    gx, gy = _geo_tf * (px * _preview_scale, py * _preview_scale)
    return gx, gy


def _draw_poly(poly, color, thickness=2, label=None):
    boundary = poly.boundary
    rings = list(boundary.geoms) if boundary.geom_type == "MultiLineString" else [boundary]
    for ring in rings:
        pts = np.array([_geo_to_px(c[0], c[1]) for c in ring.coords], dtype=np.int32)
        cv2.polylines(overlay, [pts.reshape(-1, 1, 2)], True, color, thickness, cv2.LINE_AA)
    if label:
        cx, cy = _geo_to_px(poly.centroid.x, poly.centroid.y)
        cv2.putText(overlay, label, (cx - 25, cy), cv2.FONT_HERSHEY_SIMPLEX,
                    0.55, (255, 255, 255), 2, cv2.LINE_AA)


def _refresh():
    overlay[:] = _preview_img.copy()
    if _mode == "perims":
        for i, poly in enumerate(_perims):
            if i in results:
                color = COLORS[results[i]["color_idx"] % len(COLORS)]
                _draw_poly(poly, color, 2, f"{results[i]['vol']:.0f}m3")
            else:
                _draw_poly(poly, IDLE_COLOR, 1)
    else:
        for i, r in enumerate(_results_list):
            poly  = shape(r["geometry"])
            color = COLORS[i % len(COLORS)]
            _draw_poly(poly, color, 2, f"{r['vol']:.0f}m3")
    cv2.imshow("Stockpile Tool", overlay)


# ─────────────────────────────────────────────────────────────────────────────
# Perimeter mode: mouse click
# ─────────────────────────────────────────────────────────────────────────────
def _on_mouse_perims(event, x, y, flags, param):
    if event != cv2.EVENT_LBUTTONDOWN:
        return
    from shapely.geometry import Point
    pt = Point(_px_to_geo(x, y))

    hit = next((i for i, p in enumerate(_perims) if p.contains(pt)), None)
    if hit is None:
        dists = sorted(enumerate(_perims), key=lambda ip: ip[1].centroid.distance(pt))
        if dists:
            nearest_idx, nearest_poly = dists[0]
            dist_m = nearest_poly.centroid.distance(pt)
            if dist_m / (abs(_geo_tf.a) * _preview_scale) < 60:
                hit = nearest_idx

    if hit is None:
        return

    if hit in results:
        del results[hit]
        print(f"[Deselect] Pile #{hit}", flush=True)
        _refresh()
    else:
        _process_perim(hit)


def _process_perim(idx):
    poly = _perims[idx]
    print(f"\n[Pile #{idx}] area={poly.area:.0f}m²", flush=True)
    vol, area, max_h = _calc_volume(poly, _perim_z[idx])
    results[idx] = {
        "id": idx, "vol": round(vol, 3), "area": round(area, 2),
        "max_h": round(max_h, 3), "color_idx": len(results),
        "geometry": mapping(poly),
    }
    print(f"  → Vol={vol:.3f}m³  MaxH={max_h:.3f}m", flush=True)
    _refresh()


# ─────────────────────────────────────────────────────────────────────────────
# SAM box mode: mouse events
# ─────────────────────────────────────────────────────────────────────────────
def _on_mouse_box(event, x, y, flags, param):
    global _box_start, _box_drawing
    if not _sam_ready:
        return
    if event == cv2.EVENT_LBUTTONDOWN:
        _box_start = (x, y); _box_drawing = True
    elif event == cv2.EVENT_MOUSEMOVE and _box_drawing:
        tmp = overlay.copy()
        cv2.rectangle(tmp, _box_start, (x, y), (0, 255, 0), 2)
        cv2.imshow("Stockpile Tool", tmp)
    elif event == cv2.EVENT_LBUTTONUP and _box_drawing:
        _box_drawing = False
        x0, y0 = _box_start
        if abs(x - x0) < 5 or abs(y - y0) < 5:
            return
        # Convert preview → SAM coords
        def to_sam(px, py):
            return (int(px * _preview_scale / _sam_scale),
                    int(py * _preview_scale / _sam_scale))
        sx0, sy0 = to_sam(min(x0, x), min(y0, y))
        sx1, sy1 = to_sam(max(x0, x), max(y0, y))
        box = np.array([sx0, sy0, sx1, sy1])
        print(f"\n[Box] SAM box {box}", flush=True)
        masks, scores, _ = _sam3.predict_inst(box=box[None, :], multimask_output=True)
        mask_u8 = cv2.resize(masks[np.argmax(scores)].astype(np.uint8),
                             (_img_w, _img_h), interpolation=cv2.INTER_NEAREST)
        # Convex hull to fill scoop holes
        cnts, _ = cv2.findContours(mask_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
            filled = np.zeros_like(mask_u8)
            cv2.fillConvexPoly(filled, hull, 1)
            mask_u8 = filled
        polys = [shape(g) for g, v in
                 rasterio.features.shapes(mask_u8, mask=mask_u8, transform=_geo_tf) if v > 0]
        if not polys:
            print("[SAM] No polygon found.", flush=True); return
        geo_poly = max(polys, key=lambda p: p.area)
        vol, area, max_h = _calc_volume(geo_poly)
        _results_list.append({
            "id": len(_results_list) + 1,
            "vol": round(vol, 3), "area": round(area, 2),
            "max_h": round(max_h, 3), "geometry": mapping(geo_poly),
        })
        _refresh()


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def _save():
    data = list(results.values()) if _mode == "perims" else _results_list
    with open(OUTPUT_JSON, "w") as f:
        json.dump(data, f, indent=2)
    print(f"[Save] {len(data)} result(s) → {OUTPUT_JSON}", flush=True)


def main():
    global _ortho_path, _dsm_path, _mode
    parser = argparse.ArgumentParser()
    parser.add_argument("--ortho",  required=True)
    parser.add_argument("--dsm",    required=True)
    parser.add_argument("--perims", default=None)
    args = parser.parse_args()

    _ortho_path = args.ortho
    _dsm_path   = args.dsm

    _build_preview()

    if args.perims:
        _mode = "perims"
        _load_perimeters(args.perims)
        if not _perims:
            print("[Error] No perimeters loaded.", flush=True); sys.exit(1)
        _refresh()
        cv2.namedWindow("Stockpile Tool", cv2.WINDOW_NORMAL)
        cv2.setMouseCallback("Stockpile Tool", _on_mouse_perims)
        cv2.imshow("Stockpile Tool", overlay)
        print(f"\nREADY (perimeter mode) — {len(_perims)} pile(s)", flush=True)
        print("  Click = compute/deselect  |  A = all  |  R = reset  |  S = save  |  Q = quit")
        while True:
            k = cv2.waitKey(50) & 0xFF
            if k in (ord('q'), 27): break
            elif k == ord('a'):
                for i in range(len(_perims)):
                    if i not in results: _process_perim(i)
                _refresh()
            elif k == ord('r'):
                results.clear(); _refresh(); print("[Reset]", flush=True)
            elif k == ord('s'):
                _save()
    else:
        _mode = "box"
        _load_sam3()
        _refresh()
        cv2.namedWindow("Stockpile Tool", cv2.WINDOW_NORMAL)
        cv2.setMouseCallback("Stockpile Tool", _on_mouse_box)
        cv2.imshow("Stockpile Tool", overlay)
        print("\nREADY (SAM box mode) — drag a box around each pile", flush=True)
        print("  Drag = segment  |  R = undo  |  Q = quit")
        while True:
            k = cv2.waitKey(50) & 0xFF
            if k in (ord('q'), 27): break
            elif k == ord('r') and _results_list:
                _results_list.pop(); _refresh(); print("[Undo]", flush=True)

    _save()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
