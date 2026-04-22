#!/usr/bin/env python3
"""
=============================================================================
HYBRID STOCKPILE PIPELINE  —  hybrid.py
=============================================================================

Combines automated physics+SAM3 detection with interactive correction.

PHASE 0 — Ground prep  (auto, based on available inputs)
    --dtm   provided  → load DTM directly (best accuracy)
    --laz   provided  → build DTM from LAZ ground points via laspy
    neither           → TIN ring interpolation (fallback)

PHASE 1 — Auto pipeline  (skipped if --ortho-only)
    Physics detection (slope/watershed) → SAM3 → volume → draw results

PHASE 2 — Interactive correction  (always runs)
    OpenCV window shows auto-detected piles already drawn.
    LEFT  CLICK  → add missed pile  (click anywhere on pile)
    RIGHT CLICK  → delete pile under cursor
    U key        → undo last addition
    Q / Esc      → save all outputs and exit

RUN (DSM + Ortho):
    /home/emna/miniconda3/envs/geo/bin/python3 interactive/hybrid.py \
        --dsm   "new files/crop2_dsm.tif" \
        --ortho "new files/crop2_ortho.tif" \
        --output-dir stockpile_output_hybrid

RUN (Ortho only — no volume, visual segmentation):
    /home/emna/miniconda3/envs/geo/bin/python3 interactive/hybrid.py \
        --ortho "new files/crop2_ortho.tif" \
        --output-dir stockpile_output_hybrid

RUN (With DTM for best volume accuracy):
    /home/emna/miniconda3/envs/geo/bin/python3 interactive/hybrid.py \
        --dsm   "new files/crop2_dsm.tif" \
        --ortho "new files/crop2_ortho.tif" \
        --dtm   "new files/crop2_dtm.tif" \
        --output-dir stockpile_output_hybrid

RUN (With LAZ — auto DTM):
    /home/emna/miniconda3/envs/geo/bin/python3 interactive/hybrid.py \
        --dsm   "new files/crop2_dsm.tif" \
        --ortho "new files/crop2_ortho.tif" \
        --laz   "new files/pointcloud.laz" \
        --output-dir stockpile_output_hybrid
=============================================================================
"""

from __future__ import annotations
import os, sys, warnings, logging
from pathlib import Path

import numpy as np
import cv2
import rasterio
import rasterio.enums
import rasterio.features
import geopandas as gpd
import pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.patches import Patch
import datetime

from rasterio.transform import Affine
from scipy.ndimage import (
    minimum_filter, uniform_filter, binary_fill_holes,
    binary_dilation, label as nd_label,
)
from scipy.interpolate import LinearNDInterpolator, NearestNDInterpolator, griddata
from skimage.measure import regionprops
from skimage.morphology import disk, binary_opening as sk_binary_opening, remove_small_objects
from skimage.segmentation import watershed, expand_labels
from skimage.feature import peak_local_max
from shapely.geometry import shape, MultiPolygon

warnings.filterwarnings("ignore")
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# Palette for interactive overlay colours
COLORS = [
    (0,   100, 255), (0,   210, 120), (255, 180,   0),
    (60,   20, 220), (200,  60, 255), (0,   220, 220),
    (255,  80,  80), (80,  255,  80), (255, 255,   0),
    (160,  32, 240), (0,   180, 255), (255, 128,   0),
]


# =============================================================================
# HELPERS
# =============================================================================

def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def norm8(arr, lo_pct=1, hi_pct=99):
    valid = arr[~np.isnan(arr)]
    if len(valid) == 0:
        return np.zeros_like(arr, dtype=np.uint8)
    lo = np.percentile(valid, lo_pct)
    hi = np.percentile(valid, hi_pct)
    out = np.clip((arr - lo) / (hi - lo + 1e-9), 0, 1) * 255
    return np.nan_to_num(out, nan=0).astype(np.uint8)


# =============================================================================
# PHASE 0 — GROUND PREPARATION
# =============================================================================

def laz_to_dtm(laz_path: str, dsm: np.ndarray, dsm_tf: Affine) -> np.ndarray:
    """
    Build a DTM from a LAZ point cloud using laspy.
    Strategy: keep lowest 10th-percentile points per grid cell → rasterize.
    Returns DTM array same shape as DSM.
    """
    import laspy
    log.info(f"  [LAZ→DTM] Reading {laz_path}...")
    las   = laspy.read(laz_path)
    x_pts = np.array(las.x, dtype=np.float64)
    y_pts = np.array(las.y, dtype=np.float64)
    z_pts = np.array(las.z, dtype=np.float32)

    h, w  = dsm.shape
    res   = abs(dsm_tf.a)

    # Convert geo coords → DSM pixel indices
    inv_tf = ~dsm_tf
    col_f  = (x_pts - dsm_tf.c) / dsm_tf.a
    row_f  = (y_pts - dsm_tf.f) / dsm_tf.e
    col_i  = np.clip(col_f.astype(int), 0, w - 1)
    row_i  = np.clip(row_f.astype(int), 0, h - 1)

    # Per-cell minimum elevation (ground approximation)
    dtm = np.full((h, w), np.nan, dtype=np.float32)
    cell_pts: dict = {}
    for r, c, z in zip(row_i, col_i, z_pts):
        key = (r, c)
        if key not in cell_pts or z < cell_pts[key]:
            cell_pts[key] = float(z)

    rs = np.array([k[0] for k in cell_pts])
    cs = np.array([k[1] for k in cell_pts])
    zs = np.array([cell_pts[k] for k in cell_pts], dtype=np.float32)
    dtm[rs, cs] = zs

    # Fill holes with nearest-neighbour interpolation
    valid_mask = ~np.isnan(dtm)
    if valid_mask.sum() > 10:
        from scipy.ndimage import distance_transform_edt
        idx = distance_transform_edt(~valid_mask, return_distances=False, return_indices=True)
        dtm = dtm[tuple(idx)]

    # Smooth to suppress point noise
    dtm = uniform_filter(dtm, size=max(3, int(round(2.0 / res))))
    log.info(f"  [LAZ→DTM] DTM built: min={np.nanmin(dtm):.1f}m  max={np.nanmax(dtm):.1f}m")
    return dtm


# =============================================================================
# STEP 1 — PHYSICS DETECTION  (from slope_test.py)
# =============================================================================

class StockpileDetector:
    def __init__(self, dsm_path, target_res=0.15, mode="auto", dtm_path=None):
        self.dsm_path    = Path(dsm_path)
        self.dtm_path    = Path(dtm_path) if dtm_path else None
        self.target_res  = float(target_res)
        self.mode        = mode
        self.elevation   = None
        self.ndsm        = None
        self.slope_map   = None
        self.core_labels = None
        self.final_labels = None
        self.grid_size   = None
        self.transform   = None
        self.params      = {}

    def run(self):
        self._load()
        self._auto_tune()
        self._ground_removal()
        self._slope()
        self._core_mask()
        self._watershed_split()
        self._toe_expansion()
        log.info(f"  [Physics] {len(np.unique(self.final_labels)) - 1} pile candidates")

    def _load(self):
        with rasterio.open(self.dsm_path) as src:
            native = abs(src.transform.a)
            factor = max(1, int(round(self.target_res / native)))
            oh = int(round(src.height / factor))
            ow = int(round(src.width  / factor))
            self.elevation = src.read(
                1, out_shape=(oh, ow),
                resampling=rasterio.enums.Resampling.bilinear,
            ).astype(np.float32)
            if src.nodata is not None:
                self.elevation[self.elevation == src.nodata] = np.nan
            self.grid_size = native * factor
            sx = src.width  / ow
            sy = src.height / oh
            self.transform = src.transform * Affine.scale(sx, sy)

        for ext in (".png", ".tif", ".tiff"):
            mask_path = self.dsm_path.parent / f"ignore_mask{ext}"
            if mask_path.exists():
                ignore = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
                if ignore is not None:
                    h, w = self.elevation.shape
                    ignore = cv2.resize(ignore, (w, h), interpolation=cv2.INTER_NEAREST)
                    self.elevation[ignore < 128] = np.nan
                    log.info(f"  [Physics] Ignore mask applied: {mask_path.name}")
                break

    def _auto_tune(self):
        h, w = self.elevation.shape
        tile_w = min(h, w) * self.grid_size
        mode = self.mode
        if mode == "auto":
            mode = "small" if tile_w < 250 else "industrial"

        if mode == "small":
            defaults = dict(
                core_min_slope=10.0, core_max_slope=70.0, core_min_height=0.25,
                toe_min_slope=2.0,   toe_min_height=0.10,
                buffer_distance_m=1.0, min_area_m2=2.0,
                machine_width_m=1.0,   peak_min_distance_m=2.0,
            )
        else:  # industrial
            defaults = dict(
                core_min_slope=10.0, core_max_slope=65.0, core_min_height=0.5,
                toe_min_slope=3.0,   toe_min_height=0.2,
                buffer_distance_m=3.0, min_area_m2=20.0,
                machine_width_m=3.0,   peak_min_distance_m=7.0,
            )

        self.params = defaults
        self.params["mode_used"] = mode
        gw = clamp(0.25 * tile_w, 10.0, 40.0)
        self.params["ground_win_m"] = gw
        log.info(f"  [Physics] mode={mode}  tile={tile_w:.0f}m  grid={self.grid_size:.3f}m  "
                 f"ground_win={gw:.1f}m  core_min_h={defaults['core_min_height']}m  "
                 f"core_min_slope={defaults['core_min_slope']}°")

    def _ground_removal(self):
        elev = self.elevation
        nan_mask = np.isnan(elev)

        # If a DTM is available, use it directly — perfect ground removal
        if self.dtm_path and self.dtm_path.exists():
            with rasterio.open(self.dtm_path) as src:
                h_e, w_e = elev.shape
                dtm = src.read(
                    1, out_shape=(h_e, w_e),
                    resampling=rasterio.enums.Resampling.bilinear,
                ).astype(np.float32)
                dtm_nd = src.nodata
                if dtm_nd is not None:
                    dtm[dtm == dtm_nd] = np.nan
            ndsm = elev - dtm
            ndsm[nan_mask] = 0
            self.ndsm = np.maximum(ndsm, 0).astype(np.float32)
            log.info("  [Ground] Used DTM for nDSM")
            return

        filled = np.where(nan_mask, np.nanmedian(elev), elev).astype(np.float32)
        h, ww = elev.shape
        max_w = max(3, int(0.40 * min(h, ww)))
        w = min(max_w, max(3, int(round(self.params["ground_win_m"] / self.grid_size))))
        if w % 2 == 0:
            w += 1
        if w < max(3, int(round(self.params["ground_win_m"] / self.grid_size))):
            log.info(f"  [Ground] window clamped: {self.params['ground_win_m']:.1f}m → "
                     f"{w}px={w*self.grid_size:.2f}m (image too small)")
        rough  = minimum_filter(filled, size=w)
        smooth = uniform_filter(rough,  size=w)
        ndsm   = elev - smooth
        ndsm[nan_mask] = 0
        self.ndsm = np.maximum(ndsm, 0).astype(np.float32)

    def _slope(self):
        dy, dx = np.gradient(self.elevation, self.grid_size)
        s = np.degrees(np.arctan(np.sqrt(dy * dy + dx * dx)))
        s[np.isnan(s)] = 0
        self.slope_map = s.astype(np.float32)

    def _core_mask(self):
        p = self.params
        core = (
            (self.slope_map > p["core_min_slope"]) &
            (self.slope_map < p["core_max_slope"]) &
            (self.ndsm      > p["core_min_height"])
        )
        rad  = max(1, int(round(p["machine_width_m"] / 2.0 / self.grid_size)))
        core = sk_binary_opening(core, footprint=disk(rad))
        core = binary_fill_holes(core)
        min_px = max(10, int(round(p["min_area_m2"] / self.grid_size ** 2)))
        self.core_mask = remove_small_objects(core.astype(bool), min_size=min_px)

    def _watershed_split(self):
        p    = self.params
        dist = self.ndsm.copy(); dist[~self.core_mask] = 0
        md   = max(1, int(round(p["peak_min_distance_m"] / self.grid_size)))
        peaks = peak_local_max(dist, min_distance=md, labels=self.core_mask)
        markers = np.zeros_like(dist, dtype=np.int32)
        for i, (rr, cc) in enumerate(peaks):
            markers[rr, cc] = i + 1
        labels = watershed(-dist, markers, mask=self.core_mask)
        self.core_labels = np.zeros_like(labels, dtype=np.int32)
        for reg in regionprops(labels):
            sl = self.slope_map[labels == reg.label]
            if sl.size == 0:
                continue
            if float(np.percentile(sl, 95)) > p["core_max_slope"]:
                continue
            if float(np.mean(sl)) < 8.0:
                continue
            self.core_labels[labels == reg.label] = reg.label

    def _toe_expansion(self):
        p   = self.params
        exp = max(1, int(round(p["buffer_distance_m"] / self.grid_size)))
        expanded  = expand_labels(self.core_labels, distance=exp)
        valid_toe = (
            (self.ndsm      > p["toe_min_height"]) &
            (self.slope_map > p["toe_min_slope"])  &
            (self.slope_map < p["core_max_slope"])
        )
        final = self.core_labels.copy()
        toe   = (expanded > 0) & (self.core_labels == 0) & valid_toe
        final[toe] = expanded[toe]
        self.final_labels = final.astype(np.int32)

    def get_geo_bboxes(self, pad_m=3.0):
        tf     = self.transform
        bboxes = []
        for reg in regionprops(self.final_labels):
            if reg.label == 0:
                continue
            r0, c0, r1, c1 = reg.bbox
            corners = [tf * (c, r) for c in (c0, c1) for r in (r0, r1)]
            gx = [pt[0] for pt in corners]
            gy = [pt[1] for pt in corners]
            bbox = (min(gx) - pad_m, min(gy) - pad_m,
                    max(gx) + pad_m, max(gy) + pad_m)
            mask = self.final_labels == reg.label
            ndsm_in = self.ndsm.copy(); ndsm_in[~mask] = 0
            pr, pc = np.unravel_index(np.argmax(ndsm_in), ndsm_in.shape)
            peak_gx, peak_gy = tf * (pc, pr)
            bboxes.append((bbox, (peak_gx, peak_gy)))
        return bboxes


# =============================================================================
# STEP 2 — SAM3
# =============================================================================

def build_sam_composite(rgb_dsm: np.ndarray, max_dim=1024):
    oh, ow = rgb_dsm.shape[:2]
    sc     = min(1.0, max_dim / max(oh, ow))
    sh, sw = max(1, int(oh * sc)), max(1, int(ow * sc))
    clahe  = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    small  = cv2.resize(rgb_dsm, (sw, sh), interpolation=cv2.INTER_AREA)
    comp   = np.zeros((sh, sw, 3), dtype=np.uint8)
    for c in range(3):
        comp[:, :, c] = clahe.apply(small[:, :, c])
    log.info(f"  SAM composite: {ow}×{oh} → {sw}×{sh}  scale={sc:.4f}")
    return comp, 1.0 / sc   # returns (composite, sam_scale)


def init_sam3(composite: np.ndarray):
    log.info("  [SAM3] Loading model...")
    from samgeo.samgeo3 import SamGeo3
    sam3 = SamGeo3(backend="meta", enable_inst_interactivity=True, load_from_HF=True)
    log.info("  [SAM3] Setting image...")
    sam3.set_image(composite)
    log.info("  [SAM3] Ready.")
    return sam3


def run_sam3_on_peaks(sam3, bboxes_geo, dsm_h, dsm_w, dsm_tf,
                      ndsm=None, ndsm_floor=0.25):
    inv_dsm_tf = ~dsm_tf
    sam_h = int(sam3.image_height)
    sam_w = int(sam3.image_width)
    dr = dsm_h / sam_h
    dc = dsm_w / sam_w
    px_area = abs(dsm_tf.a * dsm_tf.e)

    def _postprocess(mask_u, spx, spy):
        mask_f = cv2.resize(mask_u, (dsm_w, dsm_h), interpolation=cv2.INTER_NEAREST)
        labeled_cc, n_cc = nd_label(mask_f)
        if n_cc > 1:
            pr = int(clamp(spy * dr, 0, dsm_h - 1))
            pc = int(clamp(spx * dc, 0, dsm_w - 1))
            peak_cc = labeled_cc[pr, pc]
            if peak_cc > 0:
                mask_f = (labeled_cc == peak_cc).astype(np.uint8)
        if ndsm is not None:
            valid  = ndsm >= ndsm_floor
            mask_f = (mask_f.astype(bool) & valid).astype(np.uint8)
        return mask_f

    results = []
    for i, ((gx0, gy0, gx1, gy1), (peak_gx, peak_gy)) in enumerate(bboxes_geo):
        c0_d, r0_d = inv_dsm_tf * (gx0, gy0)
        c1_d, r1_d = inv_dsm_tf * (gx1, gy1)
        sx0 = max(0,         int(min(c0_d, c1_d) / dc))
        sy0 = max(0,         int(min(r0_d, r1_d) / dr))
        sx1 = min(sam_w - 1, int(max(c0_d, c1_d) / dc))
        sy1 = min(sam_h - 1, int(max(r0_d, r1_d) / dr))
        pc_d, pr_d = inv_dsm_tf * (peak_gx, peak_gy)
        spx = int(clamp(pc_d / dc, 0, sam_w - 1))
        spy = int(clamp(pr_d / dr, 0, sam_h - 1))
        geo_w = abs(gx1 - gx0)
        geo_h = abs(gy1 - gy0)
        phys_area_m2 = geo_w * geo_h
        log.info(f"  Cand {i+1}/{len(bboxes_geo)}: {geo_w:.1f}×{geo_h:.1f}m  peak=({spx},{spy})")
        try:
            masks, scores, _ = sam3.predict_inst(
                point_coords=np.array([[spx, spy]]),
                point_labels=np.array([1]),
                multimask_output=True,
            )
            best   = int(np.argmax(scores))
            score  = float(scores[best])
            mask_f = _postprocess(masks[best].astype(np.uint8), spx, spy)
            area_m2 = int(mask_f.sum()) * px_area
            prompt_used = "point"

            # Box fallback: trigger when under-segmented OR low confidence
            needs_box = (area_m2 < 0.20 * phys_area_m2) or (score < 0.50)
            if needs_box and sx1 > sx0 + 2 and sy1 > sy0 + 2:
                log.info(f"    under-seg/low-conf {area_m2:.0f}m² score={score:.3f} → retry box")
                masks_b, scores_b, _ = sam3.predict_inst(
                    box=np.array([sx0, sy0, sx1, sy1])[None, :],
                    multimask_output=True,
                )
                best_b   = int(np.argmax(scores_b))
                score_b  = float(scores_b[best_b])
                mask_fb  = _postprocess(masks_b[best_b].astype(np.uint8), spx, spy)
                area_b   = int(mask_fb.sum()) * px_area
                if area_b > area_m2 * 1.2:
                    mask_f, score, area_m2, prompt_used = mask_fb, score_b, area_b, "box"

            log.info(f"    [{prompt_used}] score={score:.3f}  area≈{area_m2:,.0f} m²")
            prompt_bbox_px = (
                int(min(r0_d, r1_d)), int(min(c0_d, c1_d)),
                int(max(r0_d, r1_d)), int(max(c0_d, c1_d)),
            )
            results.append((i + 1, mask_f.astype(bool), score, prompt_bbox_px))
        except Exception as e:
            log.warning(f"    SAM3 error: {e}")

    log.info(f"  SAM3 done: {len(results)} masks")
    return results


# =============================================================================
# STEP 3 — VOLUME  (TIN ring or DTM)
# =============================================================================

def compute_volume(dsm, pile_mask, tf, ground_buf_m=3.0, dtm=None):
    px_area = abs(tf.a * tf.e)
    p_rows, p_cols = np.where(pile_mask)

    if dtm is not None:
        ground_vals = dtm[p_rows, p_cols]
        nan_m = np.isnan(ground_vals)
        if nan_m.any() and not nan_m.all():
            nn = NearestNDInterpolator(
                list(zip(p_cols[~nan_m], p_rows[~nan_m])), ground_vals[~nan_m])
            ground_vals[nan_m] = nn(p_cols[nan_m], p_rows[nan_m])
        elif nan_m.all():
            ground_vals = np.full(len(p_rows), float(np.nanmedian(dsm)))
    else:
        ground_buf_px = max(1, int(round(ground_buf_m / abs(tf.a))))
        ring = binary_dilation(pile_mask, iterations=ground_buf_px) & ~pile_mask & ~np.isnan(dsm)
        r_rows, r_cols = np.where(ring)
        if len(r_rows) < 4:
            # No external ring (pile fills the entire valid raster).
            # Fall back to the mask's own outer edge (2px erosion band) as ground ref.
            from scipy.ndimage import binary_erosion as _erode
            outer_edge = pile_mask & ~_erode(pile_mask, iterations=2)
            r_rows, r_cols = np.where(outer_edge & ~np.isnan(dsm))
        if len(r_rows) >= 4:
            elev = dsm[r_rows, r_cols]
            try:
                interp = LinearNDInterpolator(list(zip(r_cols, r_rows)), elev)
                ground_vals = interp(p_cols, p_rows)
                nan_m = np.isnan(ground_vals)
                if nan_m.any():
                    nn = NearestNDInterpolator(list(zip(r_cols, r_rows)), elev)
                    ground_vals[nan_m] = nn(p_cols[nan_m], p_rows[nan_m])
                if np.all(np.isnan(ground_vals)):
                    raise ValueError("all NaN")
            except Exception:
                ground_vals = np.full(len(p_rows), float(np.nanmedian(dsm[r_rows, r_cols])))
        else:
            # Last resort: median of the mask boundary pixels
            boundary = pile_mask.copy().astype(np.uint8)
            boundary_vals = dsm[pile_mask & ~np.isnan(dsm)]
            ground_vals = np.full(len(p_rows), float(np.nanpercentile(boundary_vals, 10))
                                  if len(boundary_vals) else float(np.nanmedian(dsm)))

    h_arr = np.zeros_like(dsm, dtype=np.float32)
    raw   = np.nan_to_num(dsm[p_rows, p_cols], nan=0.0) - ground_vals
    h_arr[p_rows, p_cols] = np.clip(raw, 0, None)
    valid_mask = pile_mask & ~np.isnan(dsm)
    valid  = h_arr[valid_mask]
    vol    = float(np.sum(valid) * px_area)
    mean_h = float(np.mean(valid)) if len(valid) else 0.0
    max_h  = float(np.max(valid))  if len(valid) else 0.0
    foot   = float(valid_mask.sum() * px_area)
    return vol, mean_h, max_h, foot, h_arr


# =============================================================================
# SHAPE FILTERS  (identical to slope_test.py)
# =============================================================================

def polygon_compactness(poly):
    return (4 * np.pi * poly.area) / (poly.length ** 2 + 1e-9)

def polygon_aspect_ratio(poly):
    coords = list(poly.minimum_rotated_rectangle.exterior.coords)
    d1 = ((coords[1][0]-coords[0][0])**2 + (coords[1][1]-coords[0][1])**2)**0.5
    d2 = ((coords[2][0]-coords[1][0])**2 + (coords[2][1]-coords[1][1])**2)**0.5
    return max(d1, d2) / (min(d1, d2) + 1e-9)

def polygon_solidity(poly):
    return poly.area / (poly.convex_hull.area + 1e-9)

def mask_to_polygon(mask, tf):
    shapes = list(rasterio.features.shapes(
        mask.astype(np.uint8), mask=mask.astype(np.uint8), transform=tf))
    polys = [shape(s) for s, v in shapes if v == 1 and shape(s).is_valid]
    if not polys:
        return None
    poly = max(polys, key=lambda p: p.area)
    # Smooth jagged pixel-resolution outline with Douglas-Peucker simplification
    # tolerance = 1.5× pixel size keeps shape accurate while removing staircase edges
    tol = abs(tf.a) * 1.5
    simplified = poly.simplify(tol, preserve_topology=True)
    return simplified if simplified.is_valid and not simplified.is_empty else poly


def union_polygons(polys):
    """
    Combine a list of shapely polygons into one geometry for storage as a single pile.

    Strategy: NEVER use unary_union — it merges touching/nearby polygons into one
    exterior ring, losing the gaps between disconnected piles.
    Instead, always wrap as a MultiPolygon so each sub-pile keeps its own boundary.
    Volume is computed from the raster union separately; this geometry is only used
    for display and GeoPackage output.
    """
    from shapely.geometry import MultiPolygon as MP, Polygon

    # Flatten: if any input is already a MultiPolygon, expand its sub-geoms
    flat = []
    for p in polys:
        if p is None or p.is_empty:
            continue
        if p.geom_type == 'MultiPolygon':
            flat.extend(p.geoms)
        elif p.geom_type == 'Polygon':
            flat.append(p)
        else:
            # GeometryCollection — extract Polygons only
            flat.extend(g for g in p.geoms if g.geom_type == 'Polygon')

    if not flat:
        return None

    if len(flat) == 1:
        return flat[0]

    # Return as MultiPolygon — preserves each pile's boundary with gaps intact
    return MP(flat)

def apply_shape_filters(mask, vol, mean_h, max_h, foot, poly,
                        rgb_full, tf, cfg, pid_label="?",
                        filter_veg=False, filter_grey=False):
    """
    Run all post-SAM filters. Returns (pass: bool, reason: str).
    cfg is a dict with filter thresholds.
    """
    noise_floor = cfg.get("noise_floor", max(0.005, abs(tf.a * tf.e) * 4))
    if vol < noise_floor:
        return False, f"vol={vol:.3f}m³ noise floor"
    if foot < cfg["min_footprint_m2"]:
        return False, f"tiny foot={foot:.0f}m²"
    if mean_h < cfg["min_mean_height"]:
        return False, f"flat mean_h={mean_h:.3f}m"
    if max_h > cfg["max_pile_height"]:
        return False, f"max_h={max_h:.2f}m > ceiling"
    # Flat-roof guard: piles are conical → max/mean ≥ 2.0; only apply to taller features
    # Skip for small piles (max_h < 1.0m) — they can have low relief and still be valid
    if max_h > 1.0 and mean_h > 0.2 and (max_h / mean_h) < 2.0:
        return False, f"flat-roof ratio={max_h/mean_h:.2f}"
    if max_h > 0.5 and (foot / (max_h ** 2)) > 100:
        return False, f"bin/silo foot/h²={foot/max_h**2:.0f}"
    if max_h > 8.0 and (foot / max_h) < 15.0:
        return False, f"tower foot/h={foot/max_h:.1f}"
    if poly is None:
        return False, "no polygon"
    comp = polygon_compactness(poly)
    ar   = polygon_aspect_ratio(poly)
    sol  = polygon_solidity(poly)
    if comp < cfg["min_compactness"]:
        return False, f"compactness={comp:.3f}"
    if ar > cfg["max_aspect_ratio"]:
        return False, f"aspect_ratio={ar:.1f}"
    if sol < cfg["min_solidity"]:
        return False, f"solidity={sol:.3f}"
    # Machine/equipment guard: high solidity + rectangular + uniform grey
    # Require footprint > 2 m² and flat top (max/mean < 2.0) to avoid
    # flagging small real piles whose nDSM-trimmed mask is naturally convex
    if sol > 0.88 and ar < 2.5 and comp > 0.60 and foot > 2.0 and (max_h / max(mean_h, 0.01)) < 2.0:
        return False, f"rectangular structure sol={sol:.2f} ar={ar:.2f}"
    # Building/shed guard: flat-topped structure with large footprint
    # Buildings have nearly uniform elevation (max/mean close to 1), unlike conical piles
    if mean_h > 1.0 and (max_h / mean_h) < 1.6 and foot > 200:
        return False, f"flat structure h_ratio={max_h/mean_h:.2f} foot={foot:.0f}m²"
    # ── Color-based filters (HSV) ──────────────────────────────────────────
    hsv = cv2.cvtColor(rgb_full, cv2.COLOR_RGB2HSV)
    hue, sat, val = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    # WATER FILTER — always on: detect blue/cyan surfaces (ponds, basins)
    # Require high saturation (>= 60) AND moderate brightness (>= 50) to avoid
    # false-triggering on dark coal/aggregate which is grey/black, not blue.
    if mask.any():
        water_mask = (hue >= 85) & (hue <= 135) & (sat >= 60) & (val >= 50)
        water_frac = float(water_mask[mask].mean())
        if water_frac > 0.40:
            return False, f"water surface {water_frac:.0%}"

    # Vegetation guard — off by default; enable with --filter-veg
    if filter_veg and mask.any():
        veg_frac = float(((hue >= 35) & (hue <= 85) & (sat >= 55))[mask].mean())
        if veg_frac > cfg["max_veg_frac"]:
            return False, f"vegetation {veg_frac:.0%}"
    # Grey-metal guard — off by default; enable with --filter-grey
    if filter_grey and mask.any():
        grey_frac = float((sat[mask] < 25).mean())
        if grey_frac > 0.60:
            return False, f"grey surface {grey_frac:.0%}"
    return True, "ok"


# =============================================================================
# OUTPUT HELPERS
# =============================================================================

def save_debug_image(pid, rgb, mask, h_map, vol, max_h, out_dir):
    rows, cols = np.where(mask)
    if not len(rows):
        return
    pad = 30
    r0 = max(0, rows.min()-pad);  r1 = min(rgb.shape[0], rows.max()+pad)
    c0 = max(0, cols.min()-pad);  c1 = min(rgb.shape[1], cols.max()+pad)
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    fig.patch.set_facecolor("#0d1117")
    for ax in axes:
        ax.set_facecolor("#0d1117"); ax.axis("off")
    axes[0].imshow(rgb[r0:r1, c0:c1])
    axes[0].set_title(f"Pile {pid} — RGB", color="#e6edf3", fontsize=11)
    ov = rgb[r0:r1, c0:c1].copy()
    ov[mask[r0:r1, c0:c1]] = [255, 140, 0]
    axes[1].imshow(ov)
    axes[1].set_title("SAM Boundary", color="#e6edf3", fontsize=11)
    hc = h_map[r0:r1, c0:c1].astype(float)
    hc[~mask[r0:r1, c0:c1]] = np.nan
    im = axes[2].imshow(hc, cmap="plasma")
    plt.colorbar(im, ax=axes[2], label="m", shrink=0.75)
    vol_str = f"Vol:{vol:.0f}m³" if vol > 0 else "Visual only"
    axes[2].set_title(f"{vol_str}  Hmax:{max_h:.2f}m", color="#e6edf3", fontsize=10)
    plt.tight_layout(pad=0.5)
    d = Path(out_dir) / "debug"; d.mkdir(exist_ok=True)
    plt.savefig(d / f"pile_{pid:03d}.png", dpi=120, bbox_inches="tight", facecolor="#0d1117")
    plt.close()


def save_outputs(results, polygons, crs, out_dir, dsm_path=None, h_comb=None,
                 dsm=None, tf=None, rgb_full=None):
    out_dir = Path(out_dir)
    gdf = gpd.GeoDataFrame(results, geometry=polygons, crs=crs)
    gdf.to_file(str(out_dir / "stockpiles.gpkg"),    driver="GPKG")
    gdf.to_file(str(out_dir / "stockpiles.geojson"), driver="GeoJSON")
    pd.DataFrame(results).to_csv(str(out_dir / "stockpiles_report.csv"), index=False)

    # Height raster (only if DSM available)
    if h_comb is not None and dsm_path is not None:
        with rasterio.open(dsm_path) as src:
            prof = src.profile.copy()
        prof.update(dtype="float32", count=1, nodata=-9999.0)
        with rasterio.open(str(out_dir / "height_above_ground.tif"), "w", **prof) as dst:
            dst.write(np.where(h_comb > 0, h_comb, -9999.0).astype(np.float32), 1)

    # Overview PNG
    if rgb_full is not None and tf is not None:
        cmap = plt.cm.get_cmap("plasma", max(len(results), 1))
        fig, ax = plt.subplots(figsize=(14, 10))
        fig.patch.set_facecolor("#0d1117"); ax.set_facecolor("#0d1117")
        ax.imshow(rgb_full)
        for i, (row, poly) in enumerate(zip(results, polygons)):
            geoms = list(poly.geoms) if isinstance(poly, MultiPolygon) else [poly]
            for g in geoms:
                xs, ys = g.exterior.xy
                px = [(x - tf.c) / tf.a for x in xs]
                py = [(y - tf.f) / tf.e for y in ys]
                ax.fill(px, py, alpha=0.35, color=cmap(i))
                ax.plot(px, py, lw=1.5, color=cmap(i))
            cpx = (row["centroid_x"] - tf.c) / tf.a
            cpy = (row["centroid_y"] - tf.f) / tf.e
            vol_lbl = f"{row['volume_m3']:.0f} m³" if row["volume_m3"] > 0 else "visual"
            ax.text(cpx, cpy, f"#{row['pile_id']}\n{vol_lbl}",
                    color="white", fontsize=8, ha="center", va="center",
                    bbox=dict(boxstyle="round,pad=0.2", facecolor="#000000bb", edgecolor="none"))
        tv = sum(r["volume_m3"] for r in results)
        tt = sum(r["estimated_tonnes"] for r in results)
        ax.set_title(f"Hybrid Pipeline  |  {len(results)} piles  |  "
                     f"Total: {tv:,.1f} m³  (~{tt:,.0f} t)",
                     color="#e6edf3", fontsize=12, pad=12)
        ax.axis("off"); plt.tight_layout()
        plt.savefig(str(out_dir / "stockpiles_overview.png"), dpi=150,
                    bbox_inches="tight", facecolor="#0d1117")
        plt.close()

    log.info(f"  Saved {len(results)} piles → {out_dir}")


# =============================================================================
# PHASE 2 — INTERACTIVE WINDOW
# =============================================================================

class InteractiveSession:
    """
    OpenCV interactive window for adding/deleting piles.
    Uses the already-loaded SAM3 model — no reload needed.
    """

    PREVIEW_MAX = 1400   # max display dimension

    def __init__(self, sam3, dsm, dsm_tf, rgb_full, ndsm_full,
                 results, polygons, cfg, out_dir,
                 dtm=None, has_dsm=True):
        self.sam3       = sam3
        self.dsm        = dsm          # full-res DSM array (or None)
        self.dsm_tf     = dsm_tf       # geo transform
        self.rgb_full   = rgb_full     # H×W×3 uint8, DSM-aligned
        self.ndsm_full  = ndsm_full    # H×W float32 (or None)
        self.results    = results      # list of dicts (shared, mutated)
        self.polygons   = polygons     # list of shapely polys (shared, mutated)
        self.cfg        = cfg
        self.out_dir    = out_dir
        self.dtm        = dtm
        self.has_dsm    = has_dsm

        self.img_h, self.img_w = rgb_full.shape[:2]
        # Scale to fit within PREVIEW_MAX but also upscale tiny rasters to MIN_PREVIEW
        MIN_PREVIEW = 600
        sc = min(1.0, self.PREVIEW_MAX / max(self.img_h, self.img_w))
        sc = max(sc, MIN_PREVIEW / max(self.img_h, self.img_w))  # upscale if tiny
        self.preview_scale = 1.0 / sc   # orig_px = preview_px * preview_scale
        prev_w = int(self.img_w * sc)
        prev_h = int(self.img_h * sc)
        interp = cv2.INTER_AREA if sc < 1.0 else cv2.INTER_CUBIC
        bgr = cv2.cvtColor(rgb_full, cv2.COLOR_RGB2BGR)
        small = cv2.resize(bgr, (prev_w, prev_h), interpolation=interp)
        # Detect nodata (black background) vs real pixels
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        valid_mask = gray > 5
        # Light CLAHE to boost local contrast while keeping natural colors
        if valid_mask.any():
            lab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB)
            clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            small = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        # Clean background: dark grey instead of pure black
        small[~valid_mask] = [40, 40, 40]
        self.preview_base = small
        # sam_scale: sam_px = orig_px / sam_scale
        self.sam_h = int(sam3.image_height)
        self.sam_w = int(sam3.image_width)
        self.sam_scale_x = self.img_w / self.sam_w
        self.sam_scale_y = self.img_h / self.sam_h

        self.overlay = self.preview_base.copy()
        self._tagged_pile_idx = None   # index of pile tagged for merge (C key)
        self._tag_mode = False         # when True, next left-click tags instead of adding
        self._box_mode = False         # B key: next left-drag merges piles inside box
        self._box_start = None         # (x, y) preview px where drag started
        self._box_cur   = None         # (x, y) current drag position
        self._draw_all_piles()

    # ── coordinate helpers ────────────────────────────────────────────────────

    def _prev_to_sam(self, px, py):
        """Preview pixel → SAM pixel."""
        orig_x = px * self.preview_scale
        orig_y = py * self.preview_scale
        return int(orig_x / self.sam_scale_x), int(orig_y / self.sam_scale_y)

    def _orig_to_geo(self, col, row):
        return self.dsm_tf * (col, row)

    def _geo_to_prev(self, gx, gy):
        inv = ~self.dsm_tf
        col, row = inv * (gx, gy)
        return int(col / self.preview_scale), int(row / self.preview_scale)

    # ── drawing ───────────────────────────────────────────────────────────────

    def _draw_all_piles(self):
        self.overlay = self.preview_base.copy()
        inv = ~self.dsm_tf

        def _geo_ring_to_pts(ring):
            pts = []
            for gx, gy in ring.coords:
                col, r = inv * (gx, gy)
                pts.append([int(col / self.preview_scale),
                            int(r   / self.preview_scale)])
            return np.array(pts, dtype=np.int32).reshape(-1, 1, 2)

        for i, (row, poly) in enumerate(zip(self.results, self.polygons)):
            color = COLORS[i % len(COLORS)]
            from shapely.geometry import GeometryCollection
            if isinstance(poly, MultiPolygon):
                geoms = list(poly.geoms)
            elif isinstance(poly, GeometryCollection):
                geoms = [g for g in poly.geoms if g.geom_type == 'Polygon']
            else:
                geoms = [poly]

            fill_layer = self.overlay.copy()
            border_pts_list = []

            for g in geoms:
                # Build list of rings: exterior first, then interiors (holes)
                all_rings = [_geo_ring_to_pts(g.exterior)]
                for interior in g.interiors:
                    all_rings.append(_geo_ring_to_pts(interior))

                # fillPoly with all rings uses even-odd rule: holes are punched out
                cv2.fillPoly(fill_layer, [r for r in all_rings], color)
                # Punch holes back to transparent by filling them with original bg
                for hole_pts in all_rings[1:]:
                    cv2.fillPoly(fill_layer, [hole_pts], (0, 0, 0))
                    # Restore original background pixels inside hole
                    hole_mask = np.zeros(fill_layer.shape[:2], dtype=np.uint8)
                    cv2.fillPoly(hole_mask, [hole_pts], 255)
                    fill_layer[hole_mask > 0] = self.overlay[hole_mask > 0]

                border_pts_list.extend(all_rings)

            cv2.addWeighted(fill_layer, 0.20, self.overlay, 0.80, 0, self.overlay)

            # Bright border on top (full opacity); thick white border if tagged
            border_color = (255, 255, 255) if i == self._tagged_pile_idx else color
            border_thickness = 4 if i == self._tagged_pile_idx else 2
            for pts_np in border_pts_list:
                cv2.polylines(self.overlay, [pts_np], True, border_color, border_thickness)

            # Label with dark shadow for readability
            cx, cy = poly.centroid.x, poly.centroid.y
            lx, ly = self._geo_to_prev(cx, cy)
            v = row["volume_m3"]
            vol_fmt = f"{v:.4f}" if v < 1 else f"{v:.2f}" if v < 10 else f"{v:.1f}" if v < 100 else f"{v:.0f}"
            vol_lbl = f"#{row['pile_id']} {vol_fmt}m3" if v > 0 else f"#{row['pile_id']} visual"
            cv2.putText(self.overlay, vol_lbl, (lx + 1, ly + 1),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 2, cv2.LINE_AA)
            cv2.putText(self.overlay, vol_lbl, (lx, ly),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    def _draw_status(self):
        img = self.overlay.copy()
        n   = len(self.results)
        tv  = sum(r["volume_m3"] for r in self.results)
        tv_fmt = f"{tv:.4f}" if tv < 1 else f"{tv:.2f}" if tv < 10 else f"{tv:.1f}" if tv < 100 else f"{tv:,.0f}"
        if self._box_mode:
            mode_hint = "  >>> BOX-MERGE MODE: left-drag to draw box over piles <<<"
        elif self._tag_mode:
            mode_hint = "  >>> TAG MODE: click a pile to tag it, then press M <<<"
        elif self._tagged_pile_idx is not None:
            mode_hint = f"  [TAGGED:#{self.results[self._tagged_pile_idx]['pile_id']} → press M to merge with last]"
        else:
            mode_hint = ""
        txt = f"Piles:{n}  Total:{tv_fmt}m3  |  L=add  R=del  B=box-merge  E=+2m  S=-1m  M=merge-last2  U=undo  Q=save{mode_hint}"
        cv2.rectangle(img, (0, 0), (img.shape[1], 26), (20, 20, 20), -1)
        cv2.putText(img, txt, (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (200, 200, 200), 1, cv2.LINE_AA)
        return img

    # ── SAM peak-redirect (from run.py logic) ─────────────────────────────────

    def _find_peak_and_rerun(self, initial_mask_orig):
        """
        Given initial SAM mask at orig resolution:
        1. Find DSM peak strictly inside the initial mask (no dilation)
        2. Re-run SAM from that peak, pick highest-score mask containing the peak
        3. Accept only if result is >= 50% size of initial; else keep initial
        Returns final mask at orig resolution (uint8).
        """
        if self.dsm is None:
            return initial_mask_orig

        # Dilate the initial mask (like run.py 15×15 kernel) so the DSM peak search
        # covers the full pile even when SAM only captured the bright peak region.
        dil_px = max(5, int(round(1.0 / abs(self.dsm_tf.a))))   # ~1m in pixels
        kernel = np.ones((dil_px * 2 + 1, dil_px * 2 + 1), np.uint8)
        search_mask = cv2.dilate(initial_mask_orig, kernel, iterations=1)

        ys, xs = np.where(search_mask > 0)
        if len(xs) == 0:
            return initial_mask_orig

        x0_o, y0_o = int(xs.min()), int(ys.min())
        x1_o, y1_o = int(xs.max()), int(ys.max())
        # Clamp to image bounds
        x0_o = max(0, x0_o); y0_o = max(0, y0_o)
        x1_o = min(self.img_w - 1, x1_o); y1_o = min(self.img_h - 1, y1_o)

        dsm_crop  = self.dsm[y0_o:y1_o + 1, x0_o:x1_o + 1]
        mask_crop = search_mask[y0_o:y1_o + 1, x0_o:x1_o + 1]
        if dsm_crop.size == 0:
            return initial_mask_orig

        dsm_masked = np.where(
            (mask_crop > 0) & np.isfinite(dsm_crop),
            dsm_crop.astype(np.float32), -np.inf
        )
        if np.all(dsm_masked == -np.inf):
            return initial_mask_orig

        peak_row_crop, peak_col_crop = np.unravel_index(
            np.argmax(dsm_masked), dsm_masked.shape
        )
        orig_col = x0_o + peak_col_crop
        orig_row = y0_o + peak_row_crop

        # Orig coords → SAM pixel (always read live dims)
        cur_sam_w = int(self.sam3.image_width)
        cur_sam_h = int(self.sam3.image_height)
        sam_x = int(clamp(orig_col / (self.img_w / cur_sam_w), 0, cur_sam_w - 1))
        sam_y = int(clamp(orig_row / (self.img_h / cur_sam_h), 0, cur_sam_h - 1))

        log.info(f"  [Peak] summit orig=({orig_col},{orig_row}) → SAM=({sam_x},{sam_y})")
        try:
            masks, scores, _ = self.sam3.predict_inst(
                point_coords=np.array([[sam_x, sam_y]]),
                point_labels=np.array([1]),
                multimask_output=True,
            )
            # Pick highest-score mask that contains the peak pixel
            best = None
            best_score = -1.0
            peak_r = clamp(orig_row, 0, self.img_h - 1)
            peak_c = clamp(orig_col, 0, self.img_w - 1)
            for m, sc in zip(masks, scores):
                m_full = cv2.resize(m.astype(np.uint8),
                                    (self.img_w, self.img_h), interpolation=cv2.INTER_NEAREST)
                if m_full[peak_r, peak_c] and float(sc) > best_score:
                    best_score = float(sc)
                    best = m_full

            if best is None:
                # Fallback: take highest-score mask regardless of peak containment
                for m, sc in zip(masks, scores):
                    m_full = cv2.resize(m.astype(np.uint8),
                                        (self.img_w, self.img_h), interpolation=cv2.INTER_NEAREST)
                    if float(sc) > best_score:
                        best_score = float(sc)
                        best = m_full
            if best is None:
                log.info("  [Peak] No mask at all — keeping initial")
                return initial_mask_orig

            # Reject if re-run result is less than 20% of initial (relaxed from 50%
            # so small-raster piles that span most of the image are still accepted)
            if int(best.sum()) < int(initial_mask_orig.sum()) * 0.20:
                log.info(f"  [Peak] Re-run too small ({best.sum()} vs {initial_mask_orig.sum()} px) — keeping initial")
                return initial_mask_orig

            log.info(f"  [Peak] Accepted: score={best_score:.3f}  px={best.sum()}")
            return best
        except Exception as e:
            log.warning(f"  [Peak] SAM re-run failed: {e}")
            return initial_mask_orig

    # ── add pile from click ───────────────────────────────────────────────────

    def _add_pile_from_click(self, px, py):
        sam_x, sam_y = self._prev_to_sam(px, py)
        sam_x = clamp(sam_x, 0, self.sam_w - 1)
        sam_y = clamp(sam_y, 0, self.sam_h - 1)
        log.info(f"  [Click] preview=({px},{py}) → SAM=({sam_x},{sam_y})")

        try:
            masks, scores, _ = self.sam3.predict_inst(
                point_coords=np.array([[sam_x, sam_y]]),
                point_labels=np.array([1]),
                multimask_output=True,
            )
            initial_mask = cv2.resize(
                masks[np.argmax(scores)].astype(np.uint8),
                (self.img_w, self.img_h), interpolation=cv2.INTER_NEAREST,
            )
        except Exception as e:
            log.warning(f"  [Click] SAM failed: {e}"); return

        # Re-run from DSM peak for better full-pile coverage
        final_mask = self._find_peak_and_rerun(initial_mask)

        # DO NOT apply nDSM floor to manually-clicked piles.
        # run.py never does it — the ring-TIN volume handles ground naturally.
        # Applying it clips the pile toe and shrinks the mask (causes 0.05 vs 0.13m3).
        # Only remove clear background (NaN DSM pixels = outside survey area).
        if self.dsm is not None:
            outside = np.isnan(self.dsm)
            final_mask = (final_mask.astype(bool) & ~outside).astype(np.uint8)

        # Tighten boundary: small opening removes single-pixel fringe bleeds
        # Skip on small rasters (< 300px) — would erase real pile pixels
        if final_mask.any() and self.img_w >= 300 and self.img_h >= 300:
            final_mask = sk_binary_opening(
                final_mask.astype(bool), footprint=disk(2)
            ).astype(np.uint8)

        # CC-prune: keep only component containing click
        labeled_cc, n_cc = nd_label(final_mask)
        if n_cc > 1:
            orig_c = int(px * self.preview_scale)
            orig_r = int(py * self.preview_scale)
            orig_c = clamp(orig_c, 0, self.img_w - 1)
            orig_r = clamp(orig_r, 0, self.img_h - 1)
            click_cc = labeled_cc[orig_r, orig_c]
            if click_cc > 0:
                final_mask = (labeled_cc == click_cc).astype(np.uint8)

        mask_bool = final_mask.astype(bool)
        if not mask_bool.any():
            log.warning("  [Click] Empty mask after filtering"); return

        # ── mis-click guard ───────────────────────────────────────────────────
        # Key insight: check relief AT THE CLICK POINT, not just the mask max.
        # A giant mask may contain a real pile elsewhere, but the click was on
        # flat ground — that's a mis-click.
        if self.dsm is not None and mask_bool.any():
            from scipy.ndimage import maximum_filter as _maxf, minimum_filter as _minf
            _res        = abs(self.dsm_tf.a)
            _win        = max(3, int(round(0.50 / _res)) | 1)   # ~0.5m window
            _local_rel  = _maxf(np.where(np.isfinite(self.dsm), self.dsm, -np.inf), _win) \
                        - _minf(np.where(np.isfinite(self.dsm), self.dsm, np.inf),  _win)
            _local_rel  = np.where(np.isfinite(self.dsm), _local_rel, 0.0)
            _valid_px   = int(np.isfinite(self.dsm).sum())
            _mask_px    = int(mask_bool.sum())
            _coverage   = _mask_px / max(_valid_px, 1)

            # Relief and nDSM at the CLICK POINT (not mask max)
            _click_r = clamp(int(py * self.preview_scale), 0, self.img_h - 1)
            _click_c = clamp(int(px * self.preview_scale), 0, self.img_w - 1)
            _click_rel = float(_local_rel[_click_r, _click_c])
            _click_ndsm = 0.0
            if self.ndsm_full is not None:
                _click_ndsm = float(self.ndsm_full[_click_r, _click_c])

            # Also check mask-wide peak for the overall check
            _peak_rel  = float(np.nanmax(_local_rel[mask_bool])) if _mask_px else 0.0
            _ndsm_peak = 0.0
            if self.ndsm_full is not None:
                _mask_ndsm = self.ndsm_full[mask_bool]
                _ndsm_peak = float(np.nanmax(_mask_ndsm)) if _mask_ndsm.size else 0.0

            log.info(f"  [Guard] click_rel={_click_rel:.3f}m  click_ndsm={_click_ndsm:.3f}m  "
                     f"mask_peak_rel={_peak_rel:.3f}m  mask_ndsm={_ndsm_peak:.3f}m  "
                     f"coverage={_coverage:.0%}")

            # Reject: click point is on flat ground (no relief, no height)
            if _click_rel < 0.03 and _click_ndsm < 0.05:
                log.warning(f"  [Click] Flat ground at click — rel={_click_rel:.3f}m  "
                            f"nDSM={_click_ndsm:.3f}m, ignoring")
                return
            # Reject: giant background blob (mask > 50% of image)
            if _coverage > 0.50:
                log.warning(f"  [Click] Background blob — mask covers {_coverage:.0%} of raster, ignoring")
                return
            # Reject: no meaningful height anywhere in mask
            if _ndsm_peak < 0.05 and _peak_rel < 0.05:
                log.warning(f"  [Click] No pile — nDSM peak={_ndsm_peak:.3f}m  "
                            f"relief={_peak_rel:.3f}m, ignoring")
                return

        # nDSM trim — cut flat-yard pixels that SAM over-expands into.
        # Gate = 20% of the pile's own nDSM peak (min 5 cm).  The pile toe
        # sits at 30–50% of peak so it is never clipped; flat yard at ~0 m
        # is removed.  Skip if pile relief is too small (<5 cm) or trim would
        # destroy more than half the mask.
        if self.ndsm_full is not None and mask_bool.any():
            mask_ndsm  = self.ndsm_full[mask_bool]
            ndsm_peak  = float(np.nanmax(mask_ndsm)) if mask_ndsm.size else 0.0
            if ndsm_peak > 0.05:
                gate    = max(0.05, ndsm_peak * 0.20)
                trimmed = mask_bool & (self.ndsm_full >= gate)
                if trimmed.sum() >= mask_bool.sum() * 0.50:
                    removed = int(mask_bool.sum() - trimmed.sum())
                    log.info(f"  [Click] nDSM trim: gate={gate:.3f}m  "
                             f"removed {removed}px flat-yard fringe")
                    mask_bool = trimmed

        # Volume — dual method with adaptive blending.
        # TIN ring overestimates (ground ring too low), DTM underestimates
        # (ODM classifies pile surface as ground). When both are credible,
        # averaging cancels the bias. When DTM/TIN ratio < 0.30, the DTM
        # failed to classify the pile → trust TIN only.
        if self.has_dsm and self.dsm is not None:
            res = abs(self.dsm_tf.a)
            click_buf_m = max(res * 3, self.cfg["ground_buf_m"])
            # Method 1: TIN ring interpolation
            vol_tin, mean_h_tin, max_h_tin, foot, h_r = compute_volume(
                self.dsm, mask_bool, self.dsm_tf,
                ground_buf_m=click_buf_m, dtm=None,
            )
            # Method 2: DTM subtraction (if available)
            if self.dtm is not None:
                vol_dtm, mean_h_dtm, max_h_dtm, _, h_r_dtm = compute_volume(
                    self.dsm, mask_bool, self.dsm_tf,
                    ground_buf_m=click_buf_m, dtm=self.dtm,
                )
                ratio = vol_dtm / (vol_tin + 1e-9)
                if ratio >= 0.30:
                    vol    = (vol_tin + vol_dtm) / 2.0
                    mean_h = (mean_h_tin + mean_h_dtm) / 2.0
                    max_h  = (max_h_tin + max_h_dtm) / 2.0
                    h_r    = (h_r + h_r_dtm) / 2.0
                    log.info(f"  [Volume] TIN={vol_tin:.4f}  DTM={vol_dtm:.4f}  ratio={ratio:.2f}  → avg={vol:.4f}m³")
                else:
                    vol, mean_h, max_h = vol_tin, mean_h_tin, max_h_tin
                    log.info(f"  [Volume] TIN={vol_tin:.4f}  DTM={vol_dtm:.4f}  ratio={ratio:.2f}  → TIN only (DTM unreliable)")
            else:
                vol, mean_h, max_h = vol_tin, mean_h_tin, max_h_tin
        else:
            foot  = float(mask_bool.sum() * abs(self.dsm_tf.a * self.dsm_tf.e))
            vol   = 0.0
            mean_h = 0.0
            max_h  = 0.0
            h_r   = np.zeros((self.img_h, self.img_w), dtype=np.float32)

        poly = mask_to_polygon(mask_bool, self.dsm_tf)
        if poly is None:
            log.warning("  [Click] Could not vectorize mask"); return

        # Shape filters (relaxed for manual clicks — user knows what they're clicking)
        ok, reason = apply_shape_filters(
            mask_bool, vol, mean_h, max_h, foot, poly,
            self.rgb_full, self.dsm_tf, self.cfg,
            filter_veg=self.cfg.get("filter_veg", False),
            filter_grey=self.cfg.get("filter_grey", False),
        )
        if not ok:
            # Hard reject ONLY for water — user can't click water into a pile
            if "water" in reason:
                log.warning(f"  [Click] Rejected: {reason} — not a pile, ignoring")
                return
            # Everything else: user clicked it, trust them — just warn
            log.warning(f"  [Click] Filter warning: {reason} — adding anyway (manual click)")

        pid = (max(r["pile_id"] for r in self.results) + 1) if self.results else 1
        unc = self.cfg["uncertainty"] / 100.0
        rr, cc = np.where(mask_bool)
        cx = self.dsm_tf.c + float(np.mean(cc)) * self.dsm_tf.a
        cy = self.dsm_tf.f + float(np.mean(rr)) * self.dsm_tf.e

        vol_decimals = 4 if vol < 1.0 else 2
        self.results.append({
            "pile_id":          pid,
            "volume_m3":        round(vol, vol_decimals),
            "volume_m3_low":    round(vol * (1 - unc), vol_decimals),
            "volume_m3_high":   round(vol * (1 + unc), vol_decimals),
            "uncertainty_pct":  self.cfg["uncertainty"],
            "mean_height_m":    round(mean_h, 3),
            "max_height_m":     round(max_h, 3),
            "footprint_m2":     round(foot, 2),
            "estimated_tonnes": round(vol * self.cfg["density"], 1),
            "density_t_m3":     self.cfg["density"],
            "centroid_x":       round(cx, 3),
            "centroid_y":       round(cy, 3),
            "compactness":      round(polygon_compactness(poly), 3),
            "aspect_ratio":     round(polygon_aspect_ratio(poly), 2),
            "solidity":         round(polygon_solidity(poly), 3),
            "sam_score":        -1.0,   # manual
            "source":           "manual",
        })
        self.polygons.append(poly)
        save_debug_image(pid, self.rgb_full, mask_bool, h_r, vol, max_h, self.out_dir)

        vol_fmt = f"{vol:.4f}" if vol < 1 else f"{vol:.2f}" if vol < 10 else f"{vol:.1f}" if vol < 100 else f"{vol:,.0f}"
        log.info(f"  [Click] ✓ Pile #{pid} added: vol={vol_fmt}m³  foot={foot:.1f}m²")
        self._draw_all_piles()

    # ── delete pile from right-click ──────────────────────────────────────────

    def _delete_pile_at_click(self, px, py):
        gx, gy = self._orig_to_geo(px * self.preview_scale, py * self.preview_scale)
        from shapely.geometry import Point
        pt = Point(gx, gy)
        for i, poly in enumerate(self.polygons):
            if poly.contains(pt):
                pid = self.results[i]["pile_id"]
                self.results.pop(i)
                self.polygons.pop(i)
                self._tagged_pile_idx = None   # indices shifted; reset tag
                log.info(f"  [Delete] Pile #{pid} removed")
                self._draw_all_piles()
                return
        log.info("  [Delete] No pile at click position")

    # ── tag pile for merge (C key) ────────────────────────────────────────────

    def _tag_pile_at_click(self, px, py):
        """Tag the pile under the cursor as merge target (C key). Click again to untag."""
        gx, gy = self._orig_to_geo(px * self.preview_scale, py * self.preview_scale)
        from shapely.geometry import Point
        pt = Point(gx, gy)
        for i, poly in enumerate(self.polygons):
            if poly.contains(pt):
                pid = self.results[i]["pile_id"]
                if self._tagged_pile_idx == i:
                    self._tagged_pile_idx = None
                    log.info(f"  [Tag] Pile #{pid} untagged")
                else:
                    self._tagged_pile_idx = i
                    log.info(f"  [Tag] Pile #{pid} tagged — press M to merge with last pile")
                self._draw_all_piles()
                return
        log.info("  [Tag] No pile at click position")

    # ── expand / shrink last pile ─────────────────────────────────────────────

    def _expand_last_pile(self, expand_m=2.0):
        """
        Grow (expand_m > 0) or shrink (expand_m < 0) the last pile's boundary.
        E key → +2 m,  S key → −1 m.
        """
        if not self.results:
            log.warning("  [Expand] No piles"); return

        from rasterio.features import geometry_mask
        from shapely.geometry import mapping
        from scipy.ndimage import binary_erosion

        last_poly = self.polygons[-1]
        last_row  = self.results[-1]
        pid       = last_row["pile_id"]

        mask_bool = geometry_mask(
            [mapping(last_poly)], transform=self.dsm_tf,
            out_shape=(self.img_h, self.img_w), invert=True,
        )

        res = abs(self.dsm_tf.a)
        px  = max(1, int(round(abs(expand_m) / res)))

        if expand_m > 0:
            new_mask = binary_dilation(mask_bool, iterations=px)
            if self.ndsm_full is not None:
                valid    = self.ndsm_full >= (self.cfg["ndsm_floor"] * 0.30)
                new_mask = new_mask & (mask_bool | valid)
        else:
            new_mask = binary_erosion(mask_bool, iterations=px)

        if not new_mask.any():
            log.warning("  [Expand] Result empty — keeping original"); return

        if self.has_dsm and self.dsm is not None:
            vol, mean_h, max_h, foot, h_r = compute_volume(
                self.dsm, new_mask, self.dsm_tf,
                ground_buf_m=self.cfg["ground_buf_m"], dtm=self.dtm,
            )
        else:
            foot = float(new_mask.sum() * abs(self.dsm_tf.a * self.dsm_tf.e))
            vol = mean_h = max_h = 0.0
            h_r = np.zeros((self.img_h, self.img_w), dtype=np.float32)

        new_poly = mask_to_polygon(new_mask, self.dsm_tf)
        if new_poly is None:
            log.warning("  [Expand] Could not vectorize — keeping original"); return

        unc = self.cfg["uncertainty"] / 100.0
        rr, cc = np.where(new_mask)
        cx = self.dsm_tf.c + float(np.mean(cc)) * self.dsm_tf.a
        cy = self.dsm_tf.f + float(np.mean(rr)) * self.dsm_tf.e
        _vd = 4 if vol < 1.0 else 2

        self.results[-1].update({
            "volume_m3":        round(vol, _vd),
            "volume_m3_low":    round(vol * (1 - unc), _vd),
            "volume_m3_high":   round(vol * (1 + unc), _vd),
            "mean_height_m":    round(mean_h, 3),
            "max_height_m":     round(max_h, 3),
            "footprint_m2":     round(foot, 2),
            "estimated_tonnes": round(vol * self.cfg["density"], 1),
            "centroid_x":       round(cx, 3),
            "centroid_y":       round(cy, 3),
        })
        self.polygons[-1] = new_poly
        save_debug_image(pid, self.rgb_full, new_mask, h_r, vol, max_h, self.out_dir)

        direction = "expanded" if expand_m > 0 else "shrunk"
        log.info(f"  [Expand] #{pid} {direction} {abs(expand_m):.1f}m → {vol:.1f}m³  foot={foot:.0f}m²")
        self._draw_all_piles()

    # ── merge last two piles ──────────────────────────────────────────────────

    def _merge_last_two_piles(self):
        """
        Union the last two piles into one (M key).
        If a pile is tagged (C key), merge that pile with the last pile.
        If no tag, merge the last two added piles.
        """
        if len(self.results) < 2:
            log.warning("  [Merge] Need ≥ 2 piles"); return

        from rasterio.features import geometry_mask
        from shapely.geometry import mapping

        last_idx = len(self.results) - 1
        if self._tagged_pile_idx is not None and self._tagged_pile_idx != last_idx:
            idx_a = self._tagged_pile_idx
            idx_b = last_idx
        else:
            idx_a = last_idx - 1
            idx_b = last_idx

        poly_a = self.polygons[idx_a];  poly_b = self.polygons[idx_b]
        pid_a  = self.results[idx_a]["pile_id"]
        pid_b  = self.results[idx_b]["pile_id"]

        # Raster masks for each sub-pile
        mask_a = geometry_mask([mapping(poly_a)], transform=self.dsm_tf,
                               out_shape=(self.img_h, self.img_w), invert=True)
        mask_b = geometry_mask([mapping(poly_b)], transform=self.dsm_tf,
                               out_shape=(self.img_h, self.img_w), invert=True)
        union_mask = mask_a | mask_b

        # Re-segment: box + multi-point SAM3, convex-hull fallback
        log.info("  [Merge] Re-segmenting with SAM3 box+multipoint...")
        reseg  = self._resegment_from_combined_mask(union_mask, sub_masks=[mask_a, mask_b])
        merged = reseg.astype(bool) if reseg.any() else union_mask

        new_poly = mask_to_polygon(merged, self.dsm_tf)
        if new_poly is None:
            new_poly = union_polygons([poly_a, poly_b])
        if new_poly is None:
            log.warning("  [Merge] Could not build polygon"); return

        if self.has_dsm and self.dsm is not None:
            vol, mean_h, max_h, foot, h_r = compute_volume(
                self.dsm, merged, self.dsm_tf,
                ground_buf_m=self.cfg["ground_buf_m"], dtm=self.dtm,
            )
        else:
            foot = float(merged.sum() * abs(self.dsm_tf.a * self.dsm_tf.e))
            vol = mean_h = max_h = 0.0
            h_r = np.zeros((self.img_h, self.img_w), dtype=np.float32)

        # Remove higher index first to avoid shifting lower index
        for idx in sorted([idx_a, idx_b], reverse=True):
            self.results.pop(idx)
            self.polygons.pop(idx)
        self._tagged_pile_idx = None

        unc = self.cfg["uncertainty"] / 100.0
        rr, cc = np.where(merged)
        cx = self.dsm_tf.c + float(np.mean(cc)) * self.dsm_tf.a
        cy = self.dsm_tf.f + float(np.mean(rr)) * self.dsm_tf.e
        _vd = 4 if vol < 1.0 else 2

        self.results.append({
            "pile_id":          pid_a,
            "volume_m3":        round(vol, _vd),
            "volume_m3_low":    round(vol * (1 - unc), _vd),
            "volume_m3_high":   round(vol * (1 + unc), _vd),
            "uncertainty_pct":  self.cfg["uncertainty"],
            "mean_height_m":    round(mean_h, 3),
            "max_height_m":     round(max_h, 3),
            "footprint_m2":     round(foot, 2),
            "estimated_tonnes": round(vol * self.cfg["density"], 1),
            "density_t_m3":     self.cfg["density"],
            "centroid_x":       round(cx, 3),
            "centroid_y":       round(cy, 3),
            "compactness":      round(polygon_compactness(new_poly), 3),
            "aspect_ratio":     round(polygon_aspect_ratio(new_poly), 2),
            "solidity":         round(polygon_solidity(new_poly), 3),
            "sam_score":        -1.0,
            "source":           "manual-merged",
        })
        self.polygons.append(new_poly)
        save_debug_image(pid_a, self.rgb_full, merged, h_r, vol, max_h, self.out_dir)
        log.info(f"  [Merge] #{pid_a}+#{pid_b} → #{pid_a}: {vol:.1f}m³  foot={foot:.0f}m²")
        self._draw_all_piles()

    # ── merge piles inside drawn box ─────────────────────────────────────────

    def _merge_piles_in_box(self, px0, py0, px1, py1):
        """
        Find all piles whose centroid or polygon intersects the box drawn in
        preview coordinates, then union them into one pile.
        """
        from shapely.geometry import box as shp_box, mapping
        from rasterio.features import geometry_mask

        # Convert preview px → geo coordinates
        gx0, gy0 = self._orig_to_geo(min(px0, px1) * self.preview_scale,
                                      min(py0, py1) * self.preview_scale)
        gx1, gy1 = self._orig_to_geo(max(px0, px1) * self.preview_scale,
                                      max(py0, py1) * self.preview_scale)
        sel_box = shp_box(min(gx0, gx1), min(gy0, gy1), max(gx0, gx1), max(gy0, gy1))

        # Find piles that intersect the box
        hit_indices = [i for i, poly in enumerate(self.polygons)
                       if poly.intersects(sel_box)]

        if len(hit_indices) == 0:
            log.info("  [BoxMerge] No piles inside box"); return
        if len(hit_indices) == 1:
            log.info(f"  [BoxMerge] Only 1 pile in box — nothing to merge"); return

        log.info(f"  [BoxMerge] Merging {len(hit_indices)} piles: "
                 f"{[self.results[i]['pile_id'] for i in hit_indices]}")

        pid_a = self.results[hit_indices[0]]["pile_id"]

        # Raster mask per sub-pile
        sub_masks  = []
        union_mask = np.zeros((self.img_h, self.img_w), dtype=bool)
        for i in hit_indices:
            m = geometry_mask([mapping(self.polygons[i])], transform=self.dsm_tf,
                              out_shape=(self.img_h, self.img_w), invert=True)
            sub_masks.append(m)
            union_mask |= m

        # Re-segment: box + multi-point SAM3, convex-hull fallback
        log.info(f"  [BoxMerge] Re-segmenting {len(hit_indices)} piles with SAM3 box+multipoint...")
        reseg  = self._resegment_from_combined_mask(union_mask, sub_masks=sub_masks)
        merged = reseg.astype(bool) if reseg.any() else union_mask

        new_poly = mask_to_polygon(merged, self.dsm_tf)
        if new_poly is None:
            new_poly = union_polygons([self.polygons[i] for i in hit_indices])
        if new_poly is None:
            log.warning("  [BoxMerge] Could not build polygon"); return

        if self.has_dsm and self.dsm is not None:
            vol, mean_h, max_h, foot, h_r = compute_volume(
                self.dsm, merged, self.dsm_tf,
                ground_buf_m=self.cfg["ground_buf_m"], dtm=self.dtm,
            )
        else:
            foot = float(merged.sum() * abs(self.dsm_tf.a * self.dsm_tf.e))
            vol = mean_h = max_h = 0.0
            h_r = np.zeros((self.img_h, self.img_w), dtype=np.float32)

        # Remove hit piles (highest index first)
        for i in sorted(hit_indices, reverse=True):
            self.results.pop(i)
            self.polygons.pop(i)
        self._tagged_pile_idx = None

        unc = self.cfg["uncertainty"] / 100.0
        rr, cc = np.where(merged)
        cx = self.dsm_tf.c + float(np.mean(cc)) * self.dsm_tf.a
        cy = self.dsm_tf.f + float(np.mean(rr)) * self.dsm_tf.e
        _vd = 4 if vol < 1.0 else 2

        self.results.append({
            "pile_id":          pid_a,
            "volume_m3":        round(vol, _vd),
            "volume_m3_low":    round(vol * (1 - unc), _vd),
            "volume_m3_high":   round(vol * (1 + unc), _vd),
            "uncertainty_pct":  self.cfg["uncertainty"],
            "mean_height_m":    round(mean_h, 3),
            "max_height_m":     round(max_h, 3),
            "footprint_m2":     round(foot, 2),
            "estimated_tonnes": round(vol * self.cfg["density"], 1),
            "density_t_m3":     self.cfg["density"],
            "centroid_x":       round(cx, 3),
            "centroid_y":       round(cy, 3),
            "compactness":      round(polygon_compactness(new_poly), 3),
            "aspect_ratio":     round(polygon_aspect_ratio(new_poly), 2),
            "solidity":         round(polygon_solidity(new_poly), 3),
            "sam_score":        -1.0,
            "source":           "box-merged",
        })
        self.polygons.append(new_poly)
        save_debug_image(pid_a, self.rgb_full, merged, h_r, vol, max_h, self.out_dir)
        log.info(f"  [BoxMerge] → #{pid_a}: {vol:.1f}m³  foot={foot:.0f}m²")
        self._draw_all_piles()

    # ── re-segmentation after merge (box + multi-point + hull fallback) ──────

    def _resegment_from_combined_mask(self, combined_mask_bool, sub_masks=None):
        """
        Re-segment a merged pile area using SAM3 box+multi-point prompting.
        Falls back to convex-hull fill when SAM3 coverage < 60%.

        Args:
            combined_mask_bool: bool array, union of all merged pile masks
            sub_masks: list of bool arrays, one per sub-pile (for per-pile DSM peaks)
        Returns:
            uint8 mask at orig resolution
        """
        from scipy.ndimage import label as _label
        from scipy.spatial import ConvexHull

        h, w = self.img_h, self.img_w
        cur_sam_w = int(self.sam3.image_width)
        cur_sam_h = int(self.sam3.image_height)

        def orig_to_sam(col, row):
            sx = int(clamp(col / (w / cur_sam_w), 0, cur_sam_w - 1))
            sy = int(clamp(row / (h / cur_sam_h), 0, cur_sam_h - 1))
            return sx, sy

        union_px = int(combined_mask_bool.sum())
        if union_px == 0:
            return combined_mask_bool.astype(np.uint8)

        rows_u, cols_u = np.where(combined_mask_bool)

        # 1. One foreground point per sub-pile at its DSM peak
        fg_pts = []
        sources = sub_masks if sub_masks else \
                  [combined_mask_bool == i
                   for i in range(1, _label(combined_mask_bool)[1] + 1)]

        for src in sources:
            if not np.any(src):
                continue
            if self.dsm is not None:
                dsm_m = np.where(src & np.isfinite(self.dsm),
                                 self.dsm.astype(np.float32), -np.inf)
                if not np.all(dsm_m == -np.inf):
                    pr, pc = np.unravel_index(np.argmax(dsm_m), dsm_m.shape)
                else:
                    rr, cc = np.where(src)
                    pr, pc = int(np.mean(rr)), int(np.mean(cc))
            else:
                rr, cc = np.where(src)
                pr, pc = int(np.mean(rr)), int(np.mean(cc))
            fg_pts.append(list(orig_to_sam(pc, pr)))

        if not fg_pts:
            pr, pc = int(np.mean(rows_u)), int(np.mean(cols_u))
            fg_pts.append(list(orig_to_sam(pc, pr)))

        # 2. Bounding box with 3% padding
        r0, r1 = int(rows_u.min()), int(rows_u.max())
        c0, c1 = int(cols_u.min()), int(cols_u.max())
        pr_ = max(2, int((r1 - r0) * 0.03))
        pc_ = max(2, int((c1 - c0) * 0.03))
        bx0, by0 = orig_to_sam(c0 - pc_, r0 - pr_)
        bx1, by1 = orig_to_sam(c1 + pc_, r1 + pr_)
        bx0, by0 = max(0, bx0), max(0, by0)
        bx1 = min(cur_sam_w - 1, bx1)
        by1 = min(cur_sam_h - 1, by1)

        log.info(f"  [Reseg] box=({bx0},{by0},{bx1},{by1})  fg_pts={len(fg_pts)}")

        best_mask  = None
        best_cover = 0.0

        # 3. Strategy A — SAM3 box + multi-point
        try:
            pt_arr  = np.array(fg_pts, dtype=np.float32)
            lbl_arr = np.ones(len(fg_pts), dtype=np.int32)
            box_arr = np.array([[bx0, by0, bx1, by1]], dtype=np.float32)

            masks, scores, _ = self.sam3.predict_inst(
                point_coords=pt_arr,
                point_labels=lbl_arr,
                box=box_arr,
                multimask_output=True,
            )
            for m, sc in zip(masks, scores):
                m_full = cv2.resize(m.astype(np.uint8), (w, h),
                                    interpolation=cv2.INTER_NEAREST).astype(bool)
                cov  = float((m_full & combined_mask_bool).sum()) / (union_px + 1e-9)
                sz_r = float(m_full.sum()) / (union_px + 1e-9)
                comp = cov * float(sc) * (1.0 if sz_r <= 3.0 else 0.3)
                if comp > best_cover:
                    best_cover = comp
                    best_mask  = m_full
            log.info(f"  [Reseg] Strategy A coverage={best_cover:.0%}")
        except Exception as e:
            log.warning(f"  [Reseg] Strategy A failed: {e}")

        # 4. Strategy B — convex-hull fill (fallback when coverage < 60%)
        if best_mask is None or best_cover < 0.60:
            log.info("  [Reseg] Strategy B: convex-hull fill")
            try:
                pts = np.column_stack((cols_u, rows_u))
                if len(pts) >= 3:
                    hull     = ConvexHull(pts)
                    hull_pts = pts[hull.vertices]
                    hull_img = np.zeros((h, w), dtype=np.uint8)
                    cv2.fillPoly(hull_img,
                                 [hull_pts.astype(np.int32).reshape(-1, 1, 2)], 1)
                    hull_bool = hull_img.astype(bool)
                    # Clip to elevated pixels (50% threshold keeps saddle between peaks)
                    if self.ndsm_full is not None:
                        valid_e   = self.ndsm_full >= (self.cfg["ndsm_floor"] * 0.5)
                        hull_bool = hull_bool & (combined_mask_bool | valid_e)
                    hcov = float((hull_bool & combined_mask_bool).sum()) / (union_px + 1e-9)
                    if hcov > best_cover:
                        best_mask  = hull_bool
                        best_cover = hcov
                        log.info(f"  [Reseg] Convex hull accepted coverage={hcov:.0%}")
            except Exception as e:
                log.warning(f"  [Reseg] Convex hull failed: {e}")

        # 5. Ultimate fallback
        if best_mask is None or not best_mask.any():
            log.warning("  [Reseg] All strategies failed — keeping raster union")
            return combined_mask_bool.astype(np.uint8)

        # 6. nDSM floor relaxed to 50% so saddles between peaks are kept
        if self.ndsm_full is not None:
            valid     = self.ndsm_full >= (self.cfg["ndsm_floor"] * 0.5)
            best_mask = best_mask & (combined_mask_bool | valid)

        # 7. Morphological clean-up
        if best_mask.any():
            best_mask = sk_binary_opening(best_mask, footprint=disk(2))

        if not best_mask.any():
            log.warning("  [Reseg] Empty after filtering — keeping union mask")
            return combined_mask_bool.astype(np.uint8)

        final_cov = float((best_mask & combined_mask_bool).sum()) / (union_px + 1e-9)
        log.info(f"  [Reseg] Final px={best_mask.sum()}  coverage={final_cov:.0%}")
        return best_mask.astype(np.uint8)

    # ── main loop ─────────────────────────────────────────────────────────────

    def run(self):
        WIN = "Hybrid Stockpile Tool"
        cv2.namedWindow(WIN, cv2.WINDOW_NORMAL | cv2.WINDOW_KEEPRATIO)
        cv2.resizeWindow(WIN, min(1400, self.overlay.shape[1]),
                              min(900,  self.overlay.shape[0]))

        def on_mouse(event, x, y, flags, param):
            if event == cv2.EVENT_LBUTTONDOWN:
                if self._box_mode:
                    self._box_start = (x, y)
                    self._box_cur   = (x, y)
                elif self._tag_mode:
                    self._tag_pile_at_click(x, y)
                    self._tag_mode = False
                else:
                    self._add_pile_from_click(x, y)
                cv2.imshow(WIN, self._draw_status())

            elif event == cv2.EVENT_MOUSEMOVE:
                if self._box_mode and self._box_start is not None:
                    self._box_cur = (x, y)
                    # Draw rubber-band rectangle on a fresh copy
                    tmp = self._draw_status()
                    x0, y0 = self._box_start
                    cv2.rectangle(tmp, (x0, y0), (x, y), (0, 255, 255), 2)
                    cv2.imshow(WIN, tmp)

            elif event == cv2.EVENT_LBUTTONUP:
                if self._box_mode and self._box_start is not None:
                    x0, y0 = self._box_start
                    x1, y1 = x, y
                    self._box_start = None
                    self._box_cur   = None
                    self._box_mode  = False
                    if abs(x1 - x0) > 5 and abs(y1 - y0) > 5:
                        self._merge_piles_in_box(x0, y0, x1, y1)
                    else:
                        log.info("  [BoxMerge] Box too small — cancelled")
                    cv2.imshow(WIN, self._draw_status())

            elif event == cv2.EVENT_RBUTTONDOWN:
                self._delete_pile_at_click(x, y)
                cv2.imshow(WIN, self._draw_status())

        cv2.setMouseCallback(WIN, on_mouse)
        cv2.imshow(WIN, self._draw_status())
        log.info("  [Interactive] Window open — L=add  R=del  B=box-merge  E=+2m  S=-1m  M=merge-last2  U=undo  Q=save")

        while True:
            key = cv2.waitKey(50) & 0xFF
            if key in (ord('q'), ord('Q'), 27):
                break
            elif key in (ord('u'), ord('U')):
                if self.results:
                    pid = self.results[-1]["pile_id"]
                    self.results.pop(); self.polygons.pop()
                    self._tagged_pile_idx = None
                    log.info(f"  [Undo] Pile #{pid} removed")
                    self._draw_all_piles()
                    cv2.imshow(WIN, self._draw_status())
            elif key in (ord('b'), ord('B')):
                self._box_mode  = True
                self._box_start = None
                self._box_cur   = None
                log.info("  [BoxMerge] Draw a box over the piles to merge (left-drag)")
                cv2.imshow(WIN, self._draw_status())
            elif key in (ord('c'), ord('C')):
                self._tag_mode = True
                log.info("  [Tag] Click on a pile to tag it, then press M")
                cv2.imshow(WIN, self._draw_status())
            elif key in (ord('e'), ord('E')):
                self._expand_last_pile(expand_m=2.0)
                cv2.imshow(WIN, self._draw_status())
            elif key in (ord('s'), ord('S')):
                self._expand_last_pile(expand_m=-1.0)
                cv2.imshow(WIN, self._draw_status())
            elif key in (ord('m'), ord('M')):
                self._merge_last_two_piles()
                cv2.imshow(WIN, self._draw_status())

        cv2.destroyAllWindows()
        log.info("  [Interactive] Session closed.")


# =============================================================================
# PDF REPORT
# =============================================================================

def generate_pdf_report(results, polygons, rgb_full, tf, out_dir,
                        overview_png=None, material="Aggregate",
                        density=1.60, site_name="Stockpile Site"):
    """
    Generate a clean white professional PDF report.
      Page 1 : cover — site overview map + summary table
      Pages 2+: one page per pile — ortho crop + segmentation overlay + stats table
    """
    if not results:
        return

    out_dir = Path(out_dir)
    pdf_path = out_dir / "stockpile_report.pdf"

    # Clean palette — distinct but not garish
    COLORS_RGB = [
        (0.13, 0.47, 0.71), (0.17, 0.63, 0.17), (0.84, 0.15, 0.16),
        (1.00, 0.50, 0.05), (0.58, 0.40, 0.74), (0.55, 0.34, 0.29),
        (0.89, 0.47, 0.76), (0.50, 0.50, 0.50), (0.74, 0.74, 0.13),
        (0.09, 0.75, 0.81),
    ]

    # Design tokens
    C_ACCENT   = "#1a56a0"   # header bar blue
    C_HDR_TXT  = "white"
    C_TBL_HEAD = "#1a56a0"   # table header bg
    C_ALT      = "#f0f4f8"   # alternating row bg
    C_WHITE    = "white"
    C_TOTAL    = "#e8f0fb"   # total row bg
    C_BORDER   = "#c8d4e0"   # table grid
    C_BODY     = "#1a1a1a"   # body text

    inv   = ~tf
    res   = abs(tf.a)
    img_h, img_w = rgb_full.shape[:2]
    PAD_FRAC = 0.35

    # ── helpers ──────────────────────────────────────────────────────────

    def _get_pile_crop(poly, mask_bool=None):
        from shapely.geometry import MultiPolygon as MP
        geoms = list(poly.geoms) if isinstance(poly, MP) else [poly]
        all_pts = []
        for g in geoms:
            for gx, gy in g.exterior.coords:
                c, r = inv * (gx, gy)
                all_pts.append((int(c), int(r)))
        if not all_pts:
            return None, None, None, None
        cols = [p[0] for p in all_pts]; rows = [p[1] for p in all_pts]
        c0, c1 = max(0, min(cols)), min(img_w - 1, max(cols))
        r0, r1 = max(0, min(rows)), min(img_h - 1, max(rows))
        pw, ph = c1 - c0, r1 - r0
        pad_c = max(10, int(pw * PAD_FRAC)); pad_r = max(10, int(ph * PAD_FRAC))
        c0 = max(0, c0 - pad_c); c1 = min(img_w - 1, c1 + pad_c)
        r0 = max(0, r0 - pad_r); r1 = min(img_h - 1, r1 + pad_r)
        rgb_crop  = rgb_full[r0:r1+1, c0:c1+1]
        mask_crop = mask_bool[r0:r1+1, c0:c1+1] if mask_bool is not None else None
        return rgb_crop, mask_crop, slice(c0, c1+1), slice(r0, r1+1)

    def _mask_from_poly(poly):
        from rasterio.features import geometry_mask
        from shapely.geometry import mapping
        return geometry_mask(
            [mapping(poly)], transform=tf,
            out_shape=(img_h, img_w), invert=True)

    def _overlay_image(rgb_crop, mask_crop, color_rgb):
        """Semi-transparent fill + clean 2 px border."""
        base = cv2.cvtColor(rgb_crop, cv2.COLOR_RGB2BGR).astype(np.float32)
        col_bgr = (color_rgb[2]*255, color_rgb[1]*255, color_rgb[0]*255)
        if mask_crop is not None and mask_crop.any():
            fill = base.copy()
            fill[mask_crop] = col_bgr
            base = cv2.addWeighted(fill, 0.28, base, 0.72, 0)
            contours, _ = cv2.findContours(
                mask_crop.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(base, contours, -1,
                             (int(col_bgr[0]), int(col_bgr[1]), int(col_bgr[2])), 2)
        return cv2.cvtColor(base.astype(np.uint8), cv2.COLOR_BGR2RGB)

    def _fmt_vol(v):
        if v < 1:   return f"{v:.4f}"
        if v < 10:  return f"{v:.2f}"
        if v < 100: return f"{v:.1f}"
        return f"{v:,.0f}"

    def _scale_bar_m(crop_w_px):
        real_w_m = crop_w_px * res
        best = real_w_m * 0.20
        for nice in [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200]:
            if nice <= real_w_m * 0.30:
                best = nice
        return best

    def _style_table(tbl, col_labels, rows_data, has_total=False):
        """Apply clean white table styling."""
        tbl.auto_set_font_size(False)
        tbl.set_fontsize(8.5)
        ncols = len(col_labels)
        nrows = len(rows_data)
        # Header
        for j in range(ncols):
            cell = tbl[(0, j)]
            cell.set_facecolor(C_TBL_HEAD)
            cell.set_text_props(color=C_HDR_TXT, fontweight="bold")
            cell.set_edgecolor(C_TBL_HEAD)
        # Data rows
        for i in range(1, nrows + 1):
            is_total = has_total and (i == nrows)
            for j in range(ncols):
                cell = tbl[(i, j)]
                if is_total:
                    cell.set_facecolor(C_TOTAL)
                    cell.set_text_props(color=C_ACCENT, fontweight="bold")
                else:
                    cell.set_facecolor(C_ALT if i % 2 == 0 else C_WHITE)
                    cell.set_text_props(color=C_BODY)
                cell.set_edgecolor(C_BORDER)

    def _add_header_bar(fig, title_left, title_right=""):
        """Full-width accent bar at top of page."""
        ax = fig.add_axes([0.0, 0.918, 1.0, 0.082])
        ax.set_facecolor(C_ACCENT); ax.axis("off")
        ax.text(0.016, 0.52, title_left,
                ha="left", va="center", fontsize=13, fontweight="bold",
                color=C_HDR_TXT, transform=ax.transAxes)
        if title_right:
            ax.text(0.984, 0.52, title_right,
                    ha="right", va="center", fontsize=9,
                    color="#b8d4f0", transform=ax.transAxes)
        return ax

    def _add_footer(fig, page_num, total_pages):
        ax = fig.add_axes([0.0, 0.0, 1.0, 0.028])
        ax.set_facecolor("#f5f7fa"); ax.axis("off")
        ax.axhline(1.0, color=C_BORDER, lw=0.8)
        ax.text(0.016, 0.5, f"Generated {datetime.date.today().strftime('%d %B %Y')}  |  {site_name}",
                ha="left", va="center", fontsize=7, color="#666666",
                transform=ax.transAxes)
        ax.text(0.984, 0.5, f"Page {page_num} of {total_pages}",
                ha="right", va="center", fontsize=7, color="#666666",
                transform=ax.transAxes)

    total_pages = 1 + len(results)

    with PdfPages(str(pdf_path)) as pdf:
        # ── COVER PAGE ────────────────────────────────────────────────────
        fig = plt.figure(figsize=(11.69, 8.27))
        fig.patch.set_facecolor("white")

        _add_header_bar(
            fig,
            "STOCKPILE SURVEY REPORT",
            f"{site_name}  |  {datetime.date.today().strftime('%d %B %Y')}"
        )
        _add_footer(fig, 1, total_pages)

        # Overview image (left 58%)
        ov_ax = fig.add_axes([0.015, 0.05, 0.565, 0.855])
        if overview_png and Path(overview_png).exists():
            from matplotlib.image import imread as mpl_imread
            ov_img = mpl_imread(str(overview_png))
            ov_ax.imshow(ov_img, aspect="auto")
        else:
            ov_ax.imshow(rgb_full, aspect="auto")
            CMAP_N = max(len(results), 1)
            for i, (row, poly) in enumerate(zip(results, polygons)):
                col = COLORS_RGB[i % len(COLORS_RGB)]
                geoms = list(poly.geoms) if isinstance(poly, MultiPolygon) else [poly]
                for g in geoms:
                    xs, ys = g.exterior.xy
                    px_c = [(x - tf.c) / tf.a for x in xs]
                    px_r = [(y - tf.f) / tf.e for y in ys]
                    ov_ax.fill(px_c, px_r, alpha=0.25, color=col, linewidth=0)
                    ov_ax.plot(px_c, px_r, lw=1.2, color=col)
                cpx = (row["centroid_x"] - tf.c) / tf.a
                cpy = (row["centroid_y"] - tf.f) / tf.e
                ov_ax.text(cpx, cpy, f"#{row['pile_id']}",
                           color="white", fontsize=7, ha="center", va="center",
                           fontweight="bold",
                           bbox=dict(boxstyle="round,pad=0.18",
                                     facecolor=COLORS_RGB[i % len(COLORS_RGB)],
                                     edgecolor="none", alpha=0.85))
        ov_ax.set_title("Site Overview", fontsize=10, color=C_BODY,
                        fontweight="bold", pad=5)
        # thin border around image
        for spine in ov_ax.spines.values():
            spine.set_edgecolor(C_BORDER); spine.set_linewidth(0.8)
        ov_ax.set_xticks([]); ov_ax.set_yticks([])

        # Summary table (right ~37%)
        tbl_ax = fig.add_axes([0.605, 0.05, 0.38, 0.855])
        tbl_ax.set_facecolor("white"); tbl_ax.axis("off")
        tbl_ax.text(0.5, 0.99, "Summary", ha="center", va="top",
                    fontsize=11, fontweight="bold", color=C_BODY,
                    transform=tbl_ax.transAxes)

        total_vol  = sum(r["volume_m3"]        for r in results)
        total_t    = sum(r["estimated_tonnes"]  for r in results)
        total_area = sum(r["footprint_m2"]      for r in results)

        col_labels = ["Pile", "Volume (m³)", "Area (m²)", "Height (m)", "Tonnes"]
        rows_data  = []
        for row in results:
            rows_data.append([
                f"#{row['pile_id']}",
                _fmt_vol(row["volume_m3"]),
                f"{row['footprint_m2']:.0f}",
                f"{row['max_height_m']:.2f}",
                f"{row['estimated_tonnes']:.0f}",
            ])
        rows_data.append([
            "TOTAL", _fmt_vol(total_vol),
            f"{total_area:.0f}", "—", f"{total_t:.0f}",
        ])

        tbl = tbl_ax.table(
            cellText=rows_data, colLabels=col_labels,
            cellLoc="center", loc="upper center",
            bbox=[0.0, 0.0, 1.0, 0.94],
        )
        _style_table(tbl, col_labels, rows_data, has_total=True)

        pdf.savefig(fig, facecolor="white")
        plt.close(fig)

        # ── PER-PILE PAGES ────────────────────────────────────────────────
        for i, (row, poly) in enumerate(zip(results, polygons)):
            color_rgb = COLORS_RGB[i % len(COLORS_RGB)]
            pid       = row["pile_id"]
            src_lbl   = row.get("source", "auto").capitalize()

            try:
                mask_bool = _mask_from_poly(poly)
            except Exception:
                mask_bool = None

            rgb_crop, mask_crop, cslice, rslice = _get_pile_crop(poly, mask_bool)
            if rgb_crop is None or rgb_crop.size == 0:
                continue

            overlay_crop = _overlay_image(rgb_crop, mask_crop, color_rgb)

            fig = plt.figure(figsize=(11.69, 8.27))
            fig.patch.set_facecolor("white")

            _add_header_bar(
                fig,
                f"Stockpile  #{pid}  —  {site_name}",
                f"Source: {src_lbl}"
            )
            _add_footer(fig, i + 2, total_pages)

            # Left: clean ortho
            l_ax = fig.add_axes([0.015, 0.055, 0.435, 0.848])
            l_ax.imshow(rgb_crop, aspect="auto")
            l_ax.set_title("Orthophoto", fontsize=10, color=C_BODY,
                           fontweight="bold", pad=5)
            for spine in l_ax.spines.values():
                spine.set_edgecolor(C_BORDER); spine.set_linewidth(0.8)
            l_ax.set_xticks([]); l_ax.set_yticks([])

            # Scale bar (dark on light bg)
            bar_m   = _scale_bar_m(rgb_crop.shape[1])
            bar_frac = (bar_m / res) / rgb_crop.shape[1]
            bx0, by = 0.05, 0.06
            l_ax.annotate("", xy=(bx0 + bar_frac, by), xytext=(bx0, by),
                           xycoords="axes fraction",
                           arrowprops=dict(arrowstyle="-", color="white", lw=2.5))
            l_ax.text(bx0 + bar_frac / 2, by + 0.035,
                      f"{bar_m:.0f} m" if bar_m >= 1 else f"{bar_m*100:.0f} cm",
                      transform=l_ax.transAxes, color="white", fontsize=8,
                      ha="center", va="bottom",
                      bbox=dict(facecolor="#00000066", edgecolor="none",
                                boxstyle="round,pad=0.15"))

            # Right: segmentation overlay
            r_ax = fig.add_axes([0.465, 0.055, 0.435, 0.848])
            r_ax.imshow(overlay_crop, aspect="auto")
            r_ax.set_title("Detected Extent", fontsize=10, color=C_BODY,
                           fontweight="bold", pad=5)
            for spine in r_ax.spines.values():
                spine.set_edgecolor(C_BORDER); spine.set_linewidth(0.8)
            r_ax.set_xticks([]); r_ax.set_yticks([])
            r_ax.legend(
                handles=[Patch(facecolor=color_rgb, alpha=0.55, label=material)],
                loc="lower right", fontsize=8,
                framealpha=0.92, facecolor="white", edgecolor=C_BORDER,
                labelcolor=C_BODY,
            )

            # Stats table — sits below both images
            vol      = row["volume_m3"]
            tonnes   = row["estimated_tonnes"]
            unc_pct  = row.get("uncertainty_pct", 5)
            vol_low  = row.get("volume_m3_low",  vol * (1 - unc_pct / 100))
            vol_high = row.get("volume_m3_high", vol * (1 + unc_pct / 100))

            stat_labels = ["Material", "Volume (m³)", "Volume range",
                           "Tonnage (t)", "Area (m²)",
                           "Max height (m)", "Mean height (m)",
                           "Density (t/m³)", "Source"]
            stat_values = [
                material,
                f"{_fmt_vol(vol)}",
                f"{_fmt_vol(vol_low)} – {_fmt_vol(vol_high)}",
                f"{tonnes:.0f}",
                f"{row['footprint_m2']:.0f}",
                f"{row['max_height_m']:.2f}",
                f"{row['mean_height_m']:.2f}",
                f"{row['density_t_m3']:.2f}",
                src_lbl,
            ]
            if row.get("sam_score", -1) >= 0:
                stat_labels.append("SAM confidence")
                stat_values.append(f"{row['sam_score']:.3f}")

            stat_rows = [[lbl, val] for lbl, val in zip(stat_labels, stat_values)]

            st_ax = fig.add_axes([0.015, 0.013, 0.885, 0.035])
            st_ax.axis("off")
            # Render as a single-row horizontal table under the images
            horiz_labels = stat_labels
            horiz_values = stat_values
            # Two-row compact table: labels on top, values below
            two_row = [horiz_labels, horiz_values]
            ht = st_ax.table(
                cellText=two_row,
                cellLoc="center", loc="center",
                bbox=[0.0, 0.0, 1.0, 1.0],
            )
            ht.auto_set_font_size(False)
            ht.set_fontsize(7.0)
            ncols_h = len(horiz_labels)
            for j in range(ncols_h):
                # label row (row 0)
                c0 = ht[(0, j)]
                c0.set_facecolor(C_TBL_HEAD)
                c0.set_text_props(color=C_HDR_TXT, fontweight="bold")
                c0.set_edgecolor(C_TBL_HEAD)
                # value row (row 1)
                c1 = ht[(1, j)]
                c1.set_facecolor(C_ALT if j % 2 == 0 else C_WHITE)
                c1.set_text_props(color=C_BODY)
                c1.set_edgecolor(C_BORDER)

            pdf.savefig(fig, facecolor="white")
            plt.close(fig)

    log.info(f"  PDF report saved → {pdf_path}")
    return str(pdf_path)


# =============================================================================
# MAIN PIPELINE
# =============================================================================

def run_pipeline(args):
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    log.info("=" * 65)
    log.info("  HYBRID STOCKPILE PIPELINE")
    log.info("=" * 65)

    has_dsm = bool(args.dsm and os.path.exists(args.dsm))
    mode_str = "DSM+Ortho" if has_dsm else "Ortho-only"
    log.info(f"  Mode: {mode_str}")

    # ── CRS safety check ───────────────────────────────────────────────
    if has_dsm:
        with rasterio.open(args.dsm) as _src:
            _crs = _src.crs
        if _crs and not _crs.is_projected:
            raise SystemExit(
                f"\n[ERROR] DSM CRS is geographic ({_crs.to_string()}).\n"
                "All distances and volumes are computed in metres.\n"
                "Please reproject your data to a projected CRS (e.g. UTM zone for your area):\n"
                "  gdalwarp -t_srs EPSG:32632 input.tif reprojected.tif\n"
                "Then re-run with the reprojected file."
            )

    # cfg will be finalised after DSM is loaded (mode-aware)
    cfg = dict(
        min_footprint_m2 = 15.0,
        min_mean_height  = 0.15,
        max_pile_height  = 20.0,
        min_compactness  = 0.10,
        max_aspect_ratio = 3.5,
        min_solidity     = 0.65,
        max_veg_frac     = 0.25,
        ground_buf_m     = 3.0,
        ndsm_floor       = 0.30,
        noise_floor      = 0.5,
        density          = args.density,
        uncertainty      = args.uncertainty,
        filter_veg       = args.filter_veg,
        filter_grey      = args.filter_grey,
    )

    # ── 1. LOAD DSM ────────────────────────────────────────────────────
    if has_dsm:
        log.info("\n[1] Loading DSM...")
        with rasterio.open(args.dsm) as src:
            dsm   = src.read(1).astype(np.float32)
            tf    = src.transform
            crs   = src.crs
            res   = abs(tf.a)
            nd    = src.nodata
            if nd is not None:
                dsm[dsm == nd] = np.nan
            dsm_h, dsm_w = dsm.shape
        log.info(f"  DSM: {dsm_w}×{dsm_h}  res={res:.4f}m  CRS={crs}")

        # ── Adapt cfg to site scale (small vs industrial) ──────────────
        tile_w_m = min(dsm_h, dsm_w) * res
        detected_mode = args.mode if args.mode != "auto" else ("small" if tile_w_m < 250 else "industrial")
        px_area = res * res
        if detected_mode == "small":
            cfg.update(
                min_footprint_m2 = max(0.5,  px_area * 10),   # ≥10 pixels
                min_mean_height  = 0.05,
                ground_buf_m     = max(0.3,  min(1.0, tile_w_m * 0.05)),
                ndsm_floor       = 0.10,
                noise_floor      = max(0.005, px_area * 4),   # 4 pixels at site res
            )
            log.info(f"  [cfg] small mode — ndsm_floor=0.10m  min_foot={cfg['min_footprint_m2']:.2f}m²  "
                     f"ground_buf={cfg['ground_buf_m']:.2f}m  noise_floor={cfg['noise_floor']:.4f}m³")
        else:
            log.info(f"  [cfg] industrial mode — ndsm_floor=0.30m  min_foot={cfg['min_footprint_m2']:.1f}m²")
    else:
        dsm = tf = crs = res = None
        dsm_h = dsm_w = 0

    # ── 2. GROUND PREP ─────────────────────────────────────────────────
    dtm = None
    # Auto-detect dtm.tif next to dsm.tif (e.g. odm_dem/dtm.tif)
    _auto_dtm = ""
    if has_dsm and not (args.dtm and os.path.exists(args.dtm)):
        _candidate = str(Path(args.dsm).parent / "dtm.tif")
        if os.path.exists(_candidate):
            _auto_dtm = _candidate
            log.info(f"\n[2] Auto-detected DTM: {_candidate}")

    dtm_path = args.dtm if (args.dtm and os.path.exists(args.dtm)) else _auto_dtm
    if dtm_path:
        log.info("\n[2] Loading DTM...")
        with rasterio.open(dtm_path) as src:
            dtm = src.read(1, out_shape=(dsm_h, dsm_w),
                           resampling=rasterio.enums.Resampling.bilinear).astype(np.float32)
            dtm_nd = src.nodata
            if dtm_nd is not None:
                dtm[dtm == dtm_nd] = np.nan
        log.info("  DTM loaded → exact ground subtraction")
    elif args.laz and os.path.exists(args.laz) and has_dsm:
        log.info("\n[2] Building DTM from LAZ...")
        dtm = laz_to_dtm(args.laz, dsm, tf)
    elif has_dsm:
        log.info("\n[2] No DTM/LAZ → TIN ring interpolation")

    # ── 3. LOAD ORTHO ──────────────────────────────────────────────────
    log.info("\n[3] Loading orthophoto...")
    if has_dsm:
        out_h, out_w = dsm_h, dsm_w
        ortho_tf = tf
    else:
        with rasterio.open(args.ortho) as src:
            out_h, out_w = src.height, src.width
            ortho_tf = src.transform
            crs = src.crs
            res = abs(src.transform.a)
            tf  = ortho_tf

    with rasterio.open(args.ortho) as src:
        bands = min(src.count, 3)
        rgb_full = src.read(
            list(range(1, bands + 1)),
            out_shape=(bands, out_h, out_w),
            resampling=rasterio.enums.Resampling.bilinear,
        ).astype(np.float32)
    if rgb_full.shape[0] == 1:
        rgb_full = np.repeat(rgb_full, 3, axis=0)
    rgb_full = np.moveaxis(rgb_full[:3], 0, -1)
    lo, hi   = np.percentile(rgb_full, 2), np.percentile(rgb_full, 98)
    rgb_full = np.clip((rgb_full - lo) / (hi - lo + 1e-9) * 255, 0, 255).astype(np.uint8)
    log.info(f"  Ortho loaded: {out_w}×{out_h}")

    # ── 4. SAM3 INIT ───────────────────────────────────────────────────
    log.info("\n[4] Initialising SAM3...")
    composite, _ = build_sam_composite(rgb_full, max_dim=1024)
    sam3 = init_sam3(composite)

    # ── 5. PHASE 1 — AUTO DETECTION ───────────────────────────────────
    results, polygons = [], []
    h_comb = np.zeros((out_h, out_w), dtype=np.float32) if has_dsm else None
    ndsm_full = None

    # Pre-compute nDSM for interactive session (needed even if Phase 1 finds nothing)
    if has_dsm and dtm is not None:
        ndsm_full = np.maximum(dsm - dtm, 0).astype(np.float32)
        log.info("  [nDSM] Computed from DTM for interactive session")

        # Adapt thresholds to actual scene nDSM range
        # If the whole scene has low relief (e.g. files1 max=0.09m),
        # the fixed ndsm_floor=0.10m would wipe every manually clicked mask.
        ndsm_scene_max = float(np.nanmax(ndsm_full)) if ndsm_full.size else 0.0
        if ndsm_scene_max > 0 and ndsm_scene_max < cfg["ndsm_floor"]:
            old_floor = cfg["ndsm_floor"]
            cfg["ndsm_floor"]      = max(0.005, ndsm_scene_max * 0.25)
            cfg["min_mean_height"] = max(0.005, ndsm_scene_max * 0.10)
            cfg["noise_floor"]     = max(0.0005, cfg["noise_floor"] * (ndsm_scene_max / old_floor))
            log.info(f"  [cfg] Scene nDSM max={ndsm_scene_max:.3f}m < floor → "
                     f"adapted ndsm_floor={cfg['ndsm_floor']:.3f}m  "
                     f"min_mean_height={cfg['min_mean_height']:.3f}m")

    if has_dsm and not args.ortho_only:
        log.info("\n[5] Phase 1 — Auto physics + SAM3 detection...")
        detector = StockpileDetector(args.dsm, target_res=args.target_res, mode=args.mode,
                                     dtm_path=dtm_path if dtm_path else None)
        detector.run()
        bboxes_geo = detector.get_geo_bboxes(pad_m=args.sam_pad)
        log.info(f"  → {len(bboxes_geo)} candidates")

        # Use detector's nDSM (DTM-based if DTM was passed) for SAM mask filtering
        ndsm_full = cv2.resize(detector.ndsm, (dsm_w, dsm_h), interpolation=cv2.INTER_LINEAR)

        raw_masks = run_sam3_on_peaks(
            sam3, bboxes_geo, dsm_h, dsm_w, tf,
            ndsm=ndsm_full, ndsm_floor=cfg["ndsm_floor"],
        )

        # Score + NMS filters
        raw_masks = [(l, m, s, p) for l, m, s, p in raw_masks if s >= args.min_sam_score]
        raw_masks.sort(key=lambda x: x[1].sum(), reverse=True)  # largest first
        kept = []
        for cand in raw_masks:
            _, m_c, _, _ = cand
            dup = False
            for _, m_k, _, _ in kept:
                inter = int((m_c & m_k).sum())
                union = int((m_c | m_k).sum())
                smaller = min(int(m_c.sum()), int(m_k.sum()))
                # Tighter containment: if smaller mask is >35% inside bigger → dup
                if inter / (union + 1e-9) > 0.25 or inter / (smaller + 1e-9) > 0.35:
                    dup = True; break
            if not dup:
                kept.append(cand)
        log.info(f"  After NMS: {len(kept)} masks")

        unc = cfg["uncertainty"] / 100.0
        for idx, (_, mask, sam_sc, prompt_bbox_px) in enumerate(kept):
            pid = idx + 1
            # Morphological smoothing
            ds_f = max(1, int(0.25 / res))
            mask_ds = mask[::ds_f, ::ds_f] if ds_f > 1 else mask
            sr = max(3, int(round(2.5 / (res * ds_f))))
            mask_ds = sk_binary_opening(mask_ds.astype(bool), footprint=disk(sr))
            if not mask_ds.any():
                continue
            if ds_f > 1:
                mask = cv2.resize(mask_ds.astype(np.uint8),
                                  (mask.shape[1], mask.shape[0]),
                                  interpolation=cv2.INTER_NEAREST).astype(bool)
            else:
                mask = mask_ds

            # Fill-ratio guard
            pr0, pc0, pr1, pc1 = prompt_bbox_px
            fill_ratio = mask.sum() / max((pr1-pr0)*(pc1-pc0), 1)
            if fill_ratio > 0.80:
                log.info(f"  #{pid}: REJECT fill={fill_ratio:.2f}"); continue

            vol, mean_h, max_h, foot, h_r = compute_volume(
                dsm, mask, tf, ground_buf_m=cfg["ground_buf_m"], dtm=dtm)

            poly = mask_to_polygon(mask, tf)
            ok, reason = apply_shape_filters(
                mask, vol, mean_h, max_h, foot, poly, rgb_full, tf, cfg,
                filter_veg=cfg.get("filter_veg", False),
                filter_grey=cfg.get("filter_grey", False),
            )
            if not ok:
                log.info(f"  #{pid}: REJECT {reason}"); continue

            h_comb = np.maximum(h_comb, h_r)
            rr, cc = np.where(mask)
            cx = tf.c + float(np.mean(cc)) * tf.a
            cy = tf.f + float(np.mean(rr)) * tf.e

            _vd = 4 if vol < 1.0 else 2
            results.append({
                "pile_id": pid, "volume_m3": round(vol, _vd),
                "volume_m3_low": round(vol*(1-unc), _vd),
                "volume_m3_high": round(vol*(1+unc), _vd),
                "uncertainty_pct": cfg["uncertainty"],
                "mean_height_m": round(mean_h, 3), "max_height_m": round(max_h, 3),
                "footprint_m2": round(foot, 2),
                "estimated_tonnes": round(vol * cfg["density"], 1),
                "density_t_m3": cfg["density"],
                "centroid_x": round(cx, 3), "centroid_y": round(cy, 3),
                "compactness": round(polygon_compactness(poly), 3),
                "aspect_ratio": round(polygon_aspect_ratio(poly), 2),
                "solidity": round(polygon_solidity(poly), 3),
                "sam_score": round(sam_sc, 3), "source": "auto",
            })
            polygons.append(poly)
            log.info(f"  ✓ #{pid}: {vol:.1f}m³  H={max_h:.2f}m  A={foot:.0f}m²  score={sam_sc:.3f}")
            save_debug_image(pid, rgb_full, mask, h_r, vol, max_h, str(out_dir))

        log.info(f"\n  Phase 1 complete: {len(results)} piles detected")
    else:
        log.info("\n[5] Phase 1 skipped (ortho-only mode)")

    # ── 6. PHASE 2 — INTERACTIVE ───────────────────────────────────────
    if args.headless:
        log.info("\n[6] Headless mode — skipping interactive session")
    else:
        log.info("\n[6] Phase 2 — Interactive correction...")
        log.info("  Controls: LEFT-CLICK=add pile  RIGHT-CLICK=delete  U=undo  Q=save+exit")
        session = InteractiveSession(
            sam3=sam3, dsm=dsm, dsm_tf=tf,
            rgb_full=rgb_full, ndsm_full=ndsm_full,
            results=results, polygons=polygons,
            cfg=cfg, out_dir=str(out_dir),
            dtm=dtm, has_dsm=has_dsm,
        )
        session.run()

    # ── 7. SAVE ────────────────────────────────────────────────────────
    if not results:
        log.warning("No piles to save.")
        return

    log.info("\n[7] Saving outputs...")
    save_outputs(
        results, polygons, crs, out_dir,
        dsm_path=args.dsm if has_dsm else None,
        h_comb=h_comb, dsm=dsm, tf=tf, rgb_full=rgb_full,
    )

    generate_pdf_report(
        results, polygons, rgb_full, tf, out_dir,
        overview_png=str(out_dir / "stockpiles_overview.png"),
        material=args.material,
        density=args.density,
        site_name=Path(args.ortho).stem if args.ortho else "Stockpile Site",
    )

    tv = sum(r["volume_m3"] for r in results)
    tt = sum(r["estimated_tonnes"] for r in results)
    log.info("\n" + "=" * 65)
    log.info("  COMPLETE")
    log.info(f"  Piles : {len(results)}")
    log.info(f"  Volume: {tv:,.1f} m³   Mass: {tt:,.0f} t")
    log.info(f"  Output: {out_dir.resolve()}")
    log.info("=" * 65)


# =============================================================================
# CLI
# =============================================================================

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Hybrid stockpile pipeline — auto + interactive")

    # I/O
    p.add_argument("--dsm",          default="",   help="DSM GeoTIFF (optional)")
    p.add_argument("--ortho",        required=True, help="Orthophoto GeoTIFF")
    p.add_argument("--dtm",          default="",   help="DTM GeoTIFF (optional, best accuracy)")
    p.add_argument("--laz",          default="",   help="LAZ point cloud (optional, builds DTM)")
    p.add_argument("--output-dir",   default="stockpile_output_hybrid")
    p.add_argument("--ortho-only",   action="store_true",
                   help="Skip auto phase, go straight to interactive (even if DSM provided)")
    p.add_argument("--headless",     action="store_true",
                   help="Skip interactive window entirely — auto-only, suitable for servers/CI")
    p.add_argument("--material",     default="Aggregate",
                   help="Material name for PDF report (e.g. 'Coal', 'Sand', 'Limestone')")
    p.add_argument("--filter-veg",   action="store_true",
                   help="Reject detections that are mostly green vegetation (off by default)")
    p.add_argument("--filter-grey",  action="store_true",
                   help="Reject detections that are mostly grey/metallic surface (off by default)")

    # Physics
    p.add_argument("--target-res",   type=float, default=0.15)
    p.add_argument("--mode",         default="auto",
                   choices=["auto", "small", "industrial"])

    # SAM3
    p.add_argument("--sam-pad",      type=float, default=3.0)
    p.add_argument("--min-sam-score", type=float, default=0.30)

    # Volume
    p.add_argument("--density",      type=float, default=1.60)
    p.add_argument("--uncertainty",  type=float, default=5.0)

    args = p.parse_args()
    run_pipeline(args)
