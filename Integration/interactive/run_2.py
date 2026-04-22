"""
Interactive Stockpile Volume Tool — INDUSTRIAL GOLD EDITION
===========================================================
Fixes "Walled Bay" underestimation by projecting the floor
from the bay entrance (lowest points) underneath the pile.

Fixes applied on top of original:
  - Peak-redirect: side click → re-runs SAM from DSM summit (same result as top click)
  - False-positive rejection: flat ground clicks are ignored
  - Undo redraw: R key correctly redraws all remaining polygons
"""

import argparse
import json
import os
import sys
import cv2
import numpy as np
import rasterio
import rasterio.enums
import rasterio.features
import rasterio.mask
import rasterio.windows
from scipy.interpolate import griddata
from scipy.ndimage import minimum_filter, uniform_filter
from shapely.geometry import mapping, shape

# ── paths ────────────────────────────────────────────────────────────────────
_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(_DIR, "results.json")

# ── state ────────────────────────────────────────────────────────────────────
_sam3, _preview_img, _geo_tf = None, None, None
_img_w, _img_h = 0, 0
_sam_rgb, _sam_scale, _sam_ready = None, 1.0, False
_ortho_path, _dsm_path, _dtm_path = None, None, None
_mode = "point" # point or box
_box_start = None
_box_drawing = False

results, overlay = [], None

COLORS = [
    (0, 100, 255), (0, 210, 120), (255, 180, 0),
    (60, 20, 220), (200, 60, 255), (0, 220, 220),
]

# ─────────────────────────────────────────────────────────────────────────────
# SAM3 Loader
# ─────────────────────────────────────────────────────────────────────────────
def _load_sam3():
    global _sam3, _sam_ready
    print("[SAM3] Loading model…", flush=True)
    from samgeo.samgeo3 import SamGeo3
    _sam3 = SamGeo3(backend="meta", enable_inst_interactivity=True, load_from_HF=True)
    _sam3.set_image(_sam_rgb)
    _sam_ready = True
    print("[SAM3] Ready.", flush=True)

def _build_preview(max_dim=1400):
    global _preview_img, _preview_scale, overlay, _geo_tf, _img_w, _img_h, _sam_rgb, _sam_scale
    print("[Preview] Loading orthophoto…", flush=True)
    with rasterio.open(_ortho_path) as src:
        _geo_tf, _img_w, _img_h = src.transform, src.width, src.height
        h, w = src.height, src.width
        # Downsample on read for huge orthos (e.g. 40k×40k) to avoid OOM
        sc_read = min(1.0, 4096 / max(h, w))
        out_h = max(1, int(h * sc_read))
        out_w = max(1, int(w * sc_read))
        arr = src.read(out_shape=(src.count, out_h, out_w),
                       resampling=rasterio.enums.Resampling.bilinear)

    # Handle alpha/bands
    if arr.shape[0] >= 3: rgb = np.moveaxis(arr[:3], 0, -1)
    else: rgb = np.dstack([arr[0]]*3)

    # Normalize to uint8
    if rgb.dtype != np.uint8:
        lo, hi = rgb.min(), rgb.max()
        rgb = ((rgb.astype(np.float32) - lo) / max(hi - lo, 1) * 255).astype(np.uint8)

    rh, rw = rgb.shape[:2]

    # Screen Preview Scale (relative to original full-res pixel coords)
    sc_prev = max_dim / max(rh, rw) if max(rh, rw) > max_dim else 1.0
    # _preview_scale converts preview-window px → original full-res px
    _preview_scale = 1.0 / (sc_read * sc_prev)
    rgb_prev = cv2.resize(rgb, (int(rw * sc_prev), int(rh * sc_prev))) if sc_prev < 1 else rgb.copy()
    _preview_img = cv2.cvtColor(rgb_prev, cv2.COLOR_RGB2BGR)
    overlay = _preview_img.copy()

    # SAM image (max 1024 px, relative to original)
    sc_sam_total = 1024 / max(h, w) if max(h, w) > 1024 else 1.0
    sam_h = max(1, int(h * sc_sam_total))
    sam_w = max(1, int(w * sc_sam_total))
    # _sam_scale converts original full-res px → SAM px  (so sam_px = orig_px * sc_sam_total)
    _sam_scale = 1.0 / sc_sam_total
    _sam_rgb = cv2.resize(rgb, (sam_w, sam_h))
    print(f"[Preview] ortho={w}x{h}  preview={_preview_img.shape[1]}x{_preview_img.shape[0]}"
          f"  SAM={sam_w}x{sam_h}  preview_scale={_preview_scale:.2f}", flush=True)

# ─────────────────────────────────────────────────────────────────────────────
# Peak-redirect: re-run SAM from DSM summit (fixes side-click giving wrong mask)
# ─────────────────────────────────────────────────────────────────────────────
def _find_peak_and_rerun(initial_mask):
    """Dilate initial mask, find DSM peak inside it, re-run SAM from that peak."""
    kernel   = np.ones((15, 15), np.uint8)
    expanded = cv2.dilate(initial_mask, kernel, iterations=1)
    ys, xs   = np.where(expanded > 0)
    if len(xs) == 0:
        return initial_mask
    x0_o, y0_o = int(xs.min()), int(ys.min())
    x1_o, y1_o = int(xs.max()), int(ys.max())
    try:
        with rasterio.open(_dsm_path) as src:
            gx0, gy0 = _geo_tf * (x0_o, y0_o)
            gx1, gy1 = _geo_tf * (x1_o, y1_o)
            window   = src.window(min(gx0,gx1), min(gy0,gy1), max(gx0,gx1), max(gy0,gy1))
            dsm_crop = src.read(1, window=window)
            win_tf   = src.window_transform(window)
    except Exception as e:
        print(f"[Peak] DSM read error: {e}", flush=True)
        return initial_mask
    if dsm_crop.size == 0:
        return initial_mask
    ch, cw = dsm_crop.shape
    sl = expanded[y0_o:y1_o+1, x0_o:x1_o+1]
    if sl.shape[0] == 0 or sl.shape[1] == 0:
        return initial_mask
    mc = cv2.resize(sl, (cw, ch), interpolation=cv2.INTER_NEAREST)
    dm = np.where((mc > 0) & (dsm_crop > -1000), dsm_crop.astype(np.float32), -np.inf)
    if np.all(dm == -np.inf):
        return initial_mask
    pr, pc  = np.unravel_index(np.argmax(dm), dm.shape)
    pgx     = win_tf.c + pc * win_tf.a
    pgy     = win_tf.f + pr * win_tf.e
    inv_tf  = ~_geo_tf
    poc, por = inv_tf * (pgx, pgy)
    psx = max(0, min(int(poc / _sam_scale), _sam_rgb.shape[1] - 1))
    psy = max(0, min(int(por / _sam_scale), _sam_rgb.shape[0] - 1))
    print(f"[Peak] Re-running SAM from summit at SAM px ({psx},{psy})", flush=True)
    try:
        masks, scores, _ = _sam3.predict_inst(
            point_coords=np.array([[psx, psy]]),
            point_labels=np.array([1]),
            multimask_output=True,
        )
        return cv2.resize(masks[np.argmax(scores)].astype(np.uint8),
                          (_img_w, _img_h), interpolation=cv2.INTER_NEAREST)
    except Exception as e:
        print(f"[Peak] SAM re-run failed: {e}", flush=True)
        return initial_mask


# ─────────────────────────────────────────────────────────────────────────────
# Volume Calculation — Rolling-Min nDSM + Ring Anchor
# ─────────────────────────────────────────────────────────────────────────────

def _read_dsm_patch(geo_poly, pad_m=20.0):
    """
    Read a padded DSM patch around geo_poly from the full DSM.
    Returns (dsm_patch, patch_transform, res).
    """
    with rasterio.open(_dsm_path) as src:
        res = abs(src.res[0])
        minx, miny, maxx, maxy = geo_poly.bounds
        # pad around the polygon so the rolling window has enough context
        px0, py0 = minx - pad_m, miny - pad_m
        px1, py1 = maxx + pad_m, maxy + pad_m
        window = src.window(px0, py0, px1, py1)
        window = window.intersection(rasterio.windows.Window(0, 0, src.width, src.height))
        dsm_patch = src.read(1, window=window).astype(np.float32)
        patch_tf = src.window_transform(window)
    nodata_mask = (dsm_patch < -9000) | np.isnan(dsm_patch)
    dsm_patch[nodata_mask] = np.nan
    return dsm_patch, patch_tf, res


def _rolling_min_ground(dsm_patch, res, win_m=None):
    """
    Compute ground model using adaptive rolling minimum (same as stockpile_dtect.py).
    win_m: ground window in metres (default: adaptive from patch size).
    Returns ground_patch (same shape as dsm_patch).
    """
    h, w = dsm_patch.shape
    tile_width_m = min(h, w) * res

    if win_m is None:
        # Adaptive: 25% of tile width, clamped 8–40 m
        win_m = float(np.clip(0.25 * tile_width_m, 8.0, 40.0))

    win_px = max(3, int(round(win_m / res)))
    if win_px % 2 == 0:
        win_px += 1

    # Fill NaN with median for filter stability
    med = float(np.nanmedian(dsm_patch))
    filled = np.where(np.isnan(dsm_patch), med, dsm_patch)

    rough  = minimum_filter(filled, size=win_px)
    ground = uniform_filter(rough,  size=win_px)
    return ground.astype(np.float32), win_m


def _sample_ring_z(geo_poly, inner_m, outer_m):
    """
    Sample DSM elevations in the annular band [inner_m, outer_m] outside geo_poly.
    Returns array of z values (may be empty).
    """
    with rasterio.open(_dsm_path) as src:
        res = abs(src.res[0])
        ring_inner = geo_poly.buffer(inner_m)
        ring_outer = geo_poly.buffer(outer_m)
        ring_band  = ring_outer.difference(ring_inner)
        n_pts = max(120, int(ring_outer.boundary.length / max(res, 0.01)))
        pts = [ring_outer.boundary.interpolate(i / n_pts, normalized=True)
               for i in range(n_pts)]
        rz = []
        for p in pts:
            if not ring_band.covers(p):
                continue
            r, c = src.index(p.x, p.y)
            if 0 <= r < src.height and 0 <= c < src.width:
                v = float(src.read(1, window=((r, r+1), (c, c+1)))[0, 0])
                if v > -9000 and not np.isnan(v):
                    rz.append(v)
    return np.array(rz)

def _calc_volume(geo_poly):
    """
    UPDATED VOLUME ALGORITHM (Entrance-Priority):
    1. Samples Z values exactly along the polygon boundary.
    2. Identifies if it's a walled bay (High variance on boundary).
    3. If Walled Bay: Defines floor as the median of the LOWEST 10% of boundary points (The Entrance).
    4. If Open Pile: Uses the standard rolling-min ground model.
    """
    area_m2 = geo_poly.area

    try:
        with rasterio.open(_dsm_path) as src:
            res = abs(src.res[0])
            px_area = res * res
            
            # 1. Read DSM Patch
            pad_m = 10.0
            dsm_patch, patch_tf, res = _read_dsm_patch(geo_poly, pad_m=pad_m)
            
            # 2. Get Pixel Mask
            ph, pw = dsm_patch.shape
            rows_idx, cols_idx = np.meshgrid(np.arange(ph), np.arange(pw), indexing='ij')
            geo_x = patch_tf.c + cols_idx * patch_tf.a
            geo_y = patch_tf.f + rows_idx * patch_tf.e

            try:
                from shapely import contains_xy
                inside = contains_xy(geo_poly, geo_x, geo_y)
            except ImportError:
                from shapely.vectorized import contains as _sv_contains
                inside = _sv_contains(geo_poly, geo_x, geo_y)

            dsm_inside = dsm_patch[inside]
            valid_mask = (dsm_inside > -9000) & (~np.isnan(dsm_inside))
            dsm_vals   = dsm_inside[valid_mask]
            
            if len(dsm_vals) == 0:
                return 0.0, 0.0, 0.0, area_m2, 0.0, 0.0

            # ---------------------------------------------------------
            # NEW LOGIC: Boundary Sampling
            # ---------------------------------------------------------
            # Interpolate points along the polygon perimeter
            boundary_zs = []
            perimeter_len = geo_poly.length
            # Sample every ~30cm along the border
            num_samples = max(20, int(perimeter_len / 0.3)) 
            
            for i in range(num_samples):
                pt = geo_poly.boundary.interpolate(i / num_samples, normalized=True)
                r, c = src.index(pt.x, pt.y)
                # Safe read with bounds check
                if 0 <= r < src.height and 0 <= c < src.width:
                    # Read 1 pixel window
                    w_data = src.read(1, window=((r, r+1), (c, c+1)))
                    z = float(w_data[0,0])
                    if z > -9000 and not np.isnan(z):
                        boundary_zs.append(z)
            
            boundary_zs = np.array(boundary_zs)
            
            mode = "Standard"
            floor_z = 0.0
            calc_method = "rolling" # 'rolling' or 'flat'

            if len(boundary_zs) > 10:
                # Calculate variance of the border height
                p05 = np.percentile(boundary_zs, 5)
                p95 = np.percentile(boundary_zs, 95)
                b_range = p95 - p05
                
                # If border varies by > 1.0m, it's likely touching walls or slopes
                if b_range > 1.0:
                    # WALLED BAY DETECTED
                    # The floor is the "Entrance", which is the lowest cluster of points.
                    # We take the median of the bottom 10% of boundary values.
                    # This rejects the high walls and finds the ground at the opening.
                    floor_z = np.median(boundary_zs[boundary_zs <= np.percentile(boundary_zs, 15)])
                    mode = "Walled Bay (Entrance Detect)"
                    calc_method = "flat"
                    print(f"[Vol] Walled Bay Detected. Wall-to-Floor Range: {b_range:.2f}m. Floor set to {floor_z:.2f}m", flush=True)
                else:
                    # OPEN PILE (Flat ground around it)
                    # Use the median of the entire boundary as the anchor
                    # But actually, rolling min is better for open piles.
                    mode = "Open Pile"
                    calc_method = "rolling"

            # ---------------------------------------------------------
            # CALCULATE VOLUME
            # ---------------------------------------------------------
            final_vol = 0.0
            
            if calc_method == "flat":
                # Simple subtraction from our calculated Floor Z
                # (Used for Bays to prevent 'digging' into the floor)
                heights = dsm_vals - floor_z
                heights = np.maximum(heights, 0) # Clip negatives
                final_vol = np.sum(heights) * px_area
                max_h = np.max(heights) if len(heights) > 0 else 0
                
            else:
                # Rolling Min (Original logic for open terrain)
                ground_patch, win_m = _rolling_min_ground(dsm_patch, res)
                ground_inside = ground_patch[inside][valid_mask]
                
                heights = dsm_vals - ground_inside
                heights = np.maximum(heights, 0)
                final_vol = np.sum(heights) * px_area
                max_h = np.max(heights) if len(heights) > 0 else 0

            print(f"[Result] {mode} | Vol={final_vol:.3f} m³ | MaxH={max_h:.3f} m | Area={area_m2:.0f} m²", flush=True)
            return final_vol, final_vol, final_vol, area_m2, max_h, 0.0

    except Exception as e:
        print(f"[Error] _calc_volume: {e}", flush=True)
        import traceback; traceback.print_exc()
        return 0.0, 0.0, 0.0, area_m2, 0.0, 0.0

# ─────────────────────────────────────────────────────────────────────────────
# Helpers & UI
# ─────────────────────────────────────────────────────────────────────────────
def _draw_result(geo_poly, vol, idx):
    """Draw polygon outline + volume label onto overlay (used by process AND undo)."""
    inv_tf = ~_geo_tf
    color  = COLORS[idx % len(COLORS)]
    bounds = (geo_poly.boundary.geoms[0].coords
              if geo_poly.boundary.geom_type == 'MultiLineString'
              else geo_poly.boundary.coords)
    pts = [[int((inv_tf * (gx, gy))[0] / _preview_scale),
            int((inv_tf * (gx, gy))[1] / _preview_scale)] for gx, gy in bounds]
    cv2.polylines(overlay, [np.array(pts, dtype=np.int32)], True, color, 2)
    cx, cy = inv_tf * (geo_poly.centroid.x, geo_poly.centroid.y)
    cv2.putText(overlay, f"{vol:.0f}m3",
                (int(cx / _preview_scale), int(cy / _preview_scale)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)


def _process_mask(mask_u8):
    polys = [shape(g) for g, v in rasterio.features.shapes(mask_u8, mask=mask_u8, transform=_geo_tf) if v > 0]
    if not polys:
        print("[SAM] No polygon.", flush=True)
        return
    geo_poly = max(polys, key=lambda p: p.area)

    vol, _, _, area, max_h, _ = _calc_volume(geo_poly)

    # Reject flat ground / noise
    shape_ratio = max_h / max(area ** 0.5, 0.1)
    if max_h < 0.10 or vol < 0.03 or shape_ratio < 0.02:
        print(f"[Reject] MaxH={max_h:.3f}m  Vol={vol:.3f}m³  "
              f"ratio={shape_ratio:.3f} — not a stockpile.", flush=True)
        return

    idx = len(results) + 1
    results.append({"id": idx, "geometry": mapping(geo_poly), "area": round(area, 2), "vol": round(vol, 3)})
    _draw_result(geo_poly, vol, idx)
    cv2.imshow("Stockpile Tool", overlay)

def _on_mouse(event, x, y, flags, param):
    global _mode, _box_start, _box_drawing
    
    if not _sam_ready: return

    # POINT MODE
    if _mode == "point" and event == cv2.EVENT_LBUTTONDOWN:
        print(f"\n[Click] Point ({x},{y})", flush=True)
        ox, oy = int(x*_preview_scale), int(y*_preview_scale)
        masks, scores, _ = _sam3.predict_inst(
            point_coords=np.array([[int(ox/_sam_scale), int(oy/_sam_scale)]]),
            point_labels=np.array([1]), multimask_output=True)
        init_mask = cv2.resize(masks[np.argmax(scores)].astype(np.uint8), (_img_w, _img_h), interpolation=cv2.INTER_NEAREST)
        # Re-run from DSM summit → side click gives same result as top click
        mask = _find_peak_and_rerun(init_mask)
        _process_mask(mask)

    # BOX MODE
    elif _mode == "box":
        if event == cv2.EVENT_LBUTTONDOWN:
            _box_start = (x, y); _box_drawing = True
        elif event == cv2.EVENT_MOUSEMOVE and _box_drawing:
            tmp = overlay.copy()
            cv2.rectangle(tmp, _box_start, (x, y), (0,255,0), 2)
            cv2.imshow("Stockpile Tool", tmp)
        elif event == cv2.EVENT_LBUTTONUP and _box_drawing:
            _box_drawing = False
            x0, y0 = _box_start
            if abs(x-x0) < 5: return
            print(f"\n[Box] ({x0},{y0}) -> ({x},{y})", flush=True)
            
            # Convert to SAM coords
            ox0, oy0 = int(x0*_preview_scale/_sam_scale), int(y0*_preview_scale/_sam_scale)
            ox1, oy1 = int(x*_preview_scale/_sam_scale), int(y*_preview_scale/_sam_scale)
            box = np.array([min(ox0,ox1), min(oy0,oy1), max(ox0,ox1), max(oy0,oy1)])
            
            masks, scores, _ = _sam3.predict_inst(box=box[None, :], multimask_output=True)
            mask = cv2.resize(masks[np.argmax(scores)].astype(np.uint8), (_img_w, _img_h), interpolation=cv2.INTER_NEAREST)
            _process_mask(mask)

def main():
    global _ortho_path, _dsm_path, _dtm_path, _mode
    parser = argparse.ArgumentParser()
    parser.add_argument("--ortho", required=True)
    parser.add_argument("--dsm", required=True)
    parser.add_argument("--dtm", default=None)
    args = parser.parse_args()
    _ortho_path, _dsm_path, _dtm_path = args.ortho, args.dsm, args.dtm
    
    _build_preview()
    _load_sam3()
    cv2.namedWindow("Stockpile Tool", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Stockpile Tool", _on_mouse)
    cv2.imshow("Stockpile Tool", overlay)
    
    print("\nREADY. Controls:")
    print("  B = Box Mode (RECOMMENDED for Bays)")
    print("  P = Point Mode (auto-finds summit)")
    print("  R = Undo last")
    print("  Q = Save & Quit")
    
    while True:
        k = cv2.waitKey(50) & 0xFF
        if k in (ord('q'), 27): break
        if k == ord('b'): _mode = "box"; print("[Mode] BOX", flush=True)
        if k == ord('p'): _mode = "point"; print("[Mode] POINT", flush=True)
        if k == ord('r') and results:
            results.pop()
            overlay[:] = _preview_img.copy()
            for i, r in enumerate(results):
                _draw_result(shape(r["geometry"]), r["vol"], i + 1)
            cv2.imshow("Stockpile Tool", overlay)
            print(f"[Undo] {len(results)} pile(s) remaining.", flush=True)
            
    with open(OUTPUT_JSON, "w") as f: json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()