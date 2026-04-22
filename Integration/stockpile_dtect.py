#!/usr/bin/env python3
"""
UNIVERSAL STOCKPILE PIPELINE (ROBUST + MEMORY SAFE + ADAPTIVE)
-------------------------------------------------------------
Designed to work on:
- very large mine-site DSMs (tens of thousands of pixels) without OOM kills
- small tiles with small stockpiles (few meters) without missing them

Key ideas
1) Adaptive ground-removal window (depends on tile size, capped)
2) Two-scale auto-tuning (small-pile mode vs industrial mode)
3) Slope-oracle core detection + controlled toe expansion
4) Slope map diagnostics (dark=flat, bright=steep)
5) Memory-safe plotting (downsample for visualization only)
6) CSV output

Outputs (saved next to DSM):
- 2d_analysis.png
- slope_debug.png
- results.csv

Usage
-----
python stockpile_pipeline.py --dsm dsm.tif --ortho odm_orthophoto.tif
python stockpile_pipeline.py --dsm dsm_small.tif --ortho ortho_small.tif --mode small
python stockpile_pipeline.py --dsm dsm.tif --ortho ortho.tif --target-res 0.20

Notes
-----
- Volumes are computed from nDSM (DSM minus estimated ground).
- If you want best absolute accuracy, provide a true DTM instead of estimating ground.
"""

import argparse
import csv
import numpy as np
import rasterio
from rasterio.transform import Affine
from scipy.ndimage import minimum_filter, uniform_filter, binary_fill_holes
from skimage.measure import regionprops
from skimage.morphology import disk, binary_opening, remove_small_objects
from skimage.segmentation import watershed, expand_labels
from skimage.feature import peak_local_max
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import warnings

warnings.filterwarnings("ignore")


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


class UniversalStockpilePipeline:
    def __init__(
        self,
        dsm_path,
        ortho_path=None,
        # performance
        target_res=0.15,
        plot_max_dim=2500,
        # operating mode: "auto", "small", "industrial"
        mode="auto",
        # optional override thresholds (set None to use mode defaults)
        core_min_slope=None,
        core_max_slope=None,
        core_min_height=None,
        toe_min_slope=None,
        toe_min_height=None,
        buffer_distance_m=None,
        min_area_m2=None,
        machine_width_m=None,
        # ground model window controls
        ground_win_m=None,       # if None => adaptive
        ground_win_min_m=10.0,
        ground_win_max_m=40.0,
        ground_win_frac=0.25,    # fraction of tile width
    ):
        self.dsm_path = Path(dsm_path)
        self.ortho_path = Path(ortho_path) if ortho_path else None

        self.target_res = float(target_res)
        self.plot_max_dim = int(plot_max_dim)
        self.mode = mode

        # Threshold overrides
        self._override = dict(
            core_min_slope=core_min_slope,
            core_max_slope=core_max_slope,
            core_min_height=core_min_height,
            toe_min_slope=toe_min_slope,
            toe_min_height=toe_min_height,
            buffer_distance_m=buffer_distance_m,
            min_area_m2=min_area_m2,
            machine_width_m=machine_width_m,
        )

        # Ground window settings
        self.ground_win_m = ground_win_m
        self.ground_win_min_m = float(ground_win_min_m)
        self.ground_win_max_m = float(ground_win_max_m)
        self.ground_win_frac = float(ground_win_frac)

        # Data holders
        self.elevation = None
        self.ndsm = None
        self.slope_map = None
        self.core_mask = None
        self.core_labels = None
        self.final_labels = None
        self.grid_size = None
        self.transform = None
        self.crs = None
        self.ortho = None

        self.params = {}
        self.results = []
        self.rejected = []

    # -------------------------
    # Main entry
    # -------------------------
    def run(self):
        print(f"Processing: {self.dsm_path.name}")
        self.load_data()
        self.auto_tune_params()
        self.remove_ground()
        self.calculate_slope()
        self.generate_core_mask()
        self.classify_and_split_cores()
        self.expand_to_toe()
        self.measure()
        self.save_csv()
        self.plot_diagnostics()
        return self.results

    # -------------------------
    # IO
    # -------------------------
    def load_data(self):
        print("  [1/8] Loading DSM (downsampled)...")
        with rasterio.open(self.dsm_path) as src:
            native_res = abs(src.transform.a)
            factor = int(round(self.target_res / native_res))
            if factor < 1:
                factor = 1

            out_h = int(round(src.height / factor))
            out_w = int(round(src.width / factor))

            self.elevation = src.read(
                1,
                out_shape=(out_h, out_w),
                resampling=rasterio.enums.Resampling.bilinear
            ).astype(np.float32)

            if src.nodata is not None:
                self.elevation[self.elevation == src.nodata] = np.nan

            self.grid_size = native_res * factor

            # Scale transform to match output grid
            scale_x = src.width / out_w
            scale_y = src.height / out_h
            self.transform = src.transform * Affine.scale(scale_x, scale_y)
            self.crs = src.crs

        # Ortho (optional)
        if self.ortho_path and self.ortho_path.exists():
            print("       Loading Ortho (resampled to DSM)...")
            with rasterio.open(self.ortho_path) as osrc:
                ortho = osrc.read(
                    out_shape=(osrc.count, self.elevation.shape[0], self.elevation.shape[1]),
                    resampling=rasterio.enums.Resampling.bilinear
                )
                ortho = np.moveaxis(ortho[:3], 0, -1)
                if ortho.max() > 1:
                    ortho = ortho / 255.0
                self.ortho = ortho
        else:
            self.ortho = None

    # -------------------------
    # Auto tuning (small vs industrial)
    # -------------------------
    def auto_tune_params(self):
        print("  [2/8] Auto-tuning parameters...")
        h, w = self.elevation.shape
        tile_width_m = min(h, w) * self.grid_size

        # decide mode
        mode = self.mode
        if mode == "auto":
            # heuristic: if tile is small (< 250m), allow small piles
            mode = "small" if tile_width_m < 250 else "industrial"

        # default parameter presets
        if mode == "small":
            defaults = dict(
                core_min_slope=10.0,
                core_max_slope=70.0,     # allow slightly steeper because small DSM noise can spike slope
                core_min_height=0.25,
                toe_min_slope=2.0,
                toe_min_height=0.10,
                buffer_distance_m=1.0,
                min_area_m2=2.0,
                machine_width_m=1.0,
                peak_min_distance_m=2.0,  # split peaks closer for small piles
            )
        else:  # industrial
            defaults = dict(
                core_min_slope=15.0,
                core_max_slope=65.0,
                core_min_height=0.8,
                toe_min_slope=4.0,
                toe_min_height=0.4,
                buffer_distance_m=3.0,
                min_area_m2=50.0,
                machine_width_m=3.0,
                peak_min_distance_m=10.0,
            )

        # apply overrides if provided
        for k, v in defaults.items():
            ov = self._override.get(k, None)
            self.params[k] = v if ov is None else float(ov)

        self.params["mode_used"] = mode
        self.params["tile_width_m"] = float(tile_width_m)

        # ground window choice
        if self.ground_win_m is not None:
            gw = float(self.ground_win_m)
        else:
            gw = self.ground_win_frac * tile_width_m
            gw = clamp(gw, self.ground_win_min_m, self.ground_win_max_m)

        self.params["ground_win_m"] = float(gw)

        print(f"       mode_used={mode} tile_width≈{tile_width_m:.1f}m grid={self.grid_size:.3f}m/px")
        print(f"       ground_win_m={gw:.1f}  core_min_h={self.params['core_min_height']}  core_min_slope={self.params['core_min_slope']}")

    # -------------------------
    # Ground removal
    # -------------------------
    def remove_ground(self):
        print("  [3/8] Ground removal (adaptive rolling window)...")
        elev = self.elevation
        mask_nan = np.isnan(elev)
        med = np.nanmedian(elev)
        filled = np.where(mask_nan, med, elev).astype(np.float32, copy=False)

        w_m = self.params["ground_win_m"]
        w_size = max(3, int(round(w_m / self.grid_size)))

        # to keep filters stable, keep w_size odd
        if w_size % 2 == 0:
            w_size += 1

        rough = minimum_filter(filled, size=w_size)
        smooth = uniform_filter(rough, size=w_size)

        ndsm = elev - smooth
        ndsm[mask_nan] = 0
        self.ndsm = np.maximum(ndsm, 0).astype(np.float32, copy=False)

        del filled, rough, smooth, ndsm

    # -------------------------
    # Slope
    # -------------------------
    def calculate_slope(self):
        print("  [4/8] Slope calculation...")
        dy, dx = np.gradient(self.elevation, self.grid_size)
        rise_run = np.sqrt(dy * dy + dx * dx)
        slope = np.degrees(np.arctan(rise_run))
        slope[np.isnan(slope)] = 0
        self.slope_map = slope.astype(np.float32, copy=False)
        del dy, dx, rise_run, slope

    # -------------------------
    # Core mask
    # -------------------------
    def generate_core_mask(self):
        print("  [5/8] Core detection (slope-oracle + height)...")
        p = self.params
        core = (
            (self.slope_map > p["core_min_slope"]) &
            (self.slope_map < p["core_max_slope"]) &
            (self.ndsm > p["core_min_height"])
        )

        rad_px = int(round((p["machine_width_m"] / 2.0) / self.grid_size))
        rad_px = max(1, rad_px)
        core = binary_opening(core, footprint=disk(rad_px))
        core = binary_fill_holes(core)

        min_pixels = int(round(p["min_area_m2"] / (self.grid_size ** 2)))
        min_pixels = max(10, min_pixels)
        self.core_mask = remove_small_objects(core.astype(bool), min_size=min_pixels)

    # -------------------------
    # Watershed split + core validation
    # -------------------------
    def classify_and_split_cores(self):
        print("  [6/8] Splitting touching piles (watershed) + rejecting structures...")
        p = self.params

        dist = self.ndsm.copy()
        dist[~self.core_mask] = 0

        min_dist_px = max(1, int(round(p["peak_min_distance_m"] / self.grid_size)))
        peaks = peak_local_max(dist, min_distance=min_dist_px, labels=self.core_mask)

        markers = np.zeros_like(dist, dtype=np.int32)
        for i, (rr, cc) in enumerate(peaks):
            markers[rr, cc] = i + 1

        labels = watershed(-dist, markers, mask=self.core_mask)

        self.core_labels = np.zeros_like(labels, dtype=np.int32)

        for reg in regionprops(labels):
            obj = labels == reg.label
            slopes = self.slope_map[obj]
            if slopes.size == 0:
                continue

            p95 = float(np.percentile(slopes, 95))
            mean_s = float(np.mean(slopes))

            # reject vertical/structure-like components
            if p95 > p["core_max_slope"]:
                self.rejected.append((reg.label, "vertical_walls", p95, mean_s))
                continue

            # reject too-flat regions (voids, pads)
            if mean_s < 8.0:
                self.rejected.append((reg.label, "too_flat", p95, mean_s))
                continue

            self.core_labels[obj] = reg.label

        del dist, markers, labels, peaks

    # -------------------------
    # Controlled toe expansion
    # -------------------------
    def expand_to_toe(self):
        print("  [7/8] Toe capture (controlled expand + toe gates)...")
        p = self.params
        exp_px = max(1, int(round(p["buffer_distance_m"] / self.grid_size)))
        expanded = expand_labels(self.core_labels, distance=exp_px)

        valid_toe = (
            (self.ndsm > p["toe_min_height"]) &
            (self.slope_map > p["toe_min_slope"]) &
            (self.slope_map < p["core_max_slope"])
        )

        final = self.core_labels.copy()
        toe_pixels = (expanded > 0) & (self.core_labels == 0) & valid_toe
        final[toe_pixels] = expanded[toe_pixels]
        self.final_labels = final.astype(np.int32, copy=False)

        del expanded, valid_toe, toe_pixels, final

    # -------------------------
    # Measurements
    # -------------------------
    def measure(self):
        print("  [8/8] Measuring volumes...")
        self.results = []
        ids = np.unique(self.final_labels)
        ids = ids[ids != 0]

        for i in ids:
            m = self.final_labels == i
            if m.sum() == 0:
                continue
            z = self.ndsm[m]
            vol = float(np.sum(z) * (self.grid_size ** 2))
            area = float(m.sum() * (self.grid_size ** 2))
            max_h = float(np.max(z))
            ys, xs = np.where(m)
            self.results.append(dict(
                id=int(i),
                volume_m3=vol,
                area_m2=area,
                max_height_m=max_h,
                cy=int(np.mean(ys)),
                cx=int(np.mean(xs)),
                mask=m
            ))

        self.results.sort(key=lambda r: r["volume_m3"], reverse=True)
        print(f"       piles={len(self.results)} (mode={self.params['mode_used']})")

    # -------------------------
    # CSV
    # -------------------------
    def save_csv(self):
        out = self.dsm_path.parent / "results.csv"
        with open(out, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["id", "volume_m3", "area_m2", "max_height_m", "centroid_row", "centroid_col", "mode_used"])
            for r in self.results:
                w.writerow([r["id"], f"{r['volume_m3']:.4f}", f"{r['area_m2']:.4f}", f"{r['max_height_m']:.4f}",
                            r["cy"], r["cx"], self.params["mode_used"]])
        print(f"       saved {out}")

    # -------------------------
    # Plots (memory-safe)
    # -------------------------
    def _downsample(self, arr, max_dim):
        h, w = arr.shape[:2]
        s = max(1, int(np.ceil(max(h, w) / max_dim)))
        if arr.ndim == 2:
            return arr[::s, ::s], s
        return arr[::s, ::s, :], s

    def plot_diagnostics(self):
        out_dir = self.dsm_path.parent

        # slope debug standalone
        slope_show, ss = self._downsample(self.slope_map, self.plot_max_dim)
        fig = plt.figure(figsize=(10, 8))
        im = plt.imshow(slope_show, cmap="inferno", vmin=0, vmax=70)
        plt.colorbar(im, label="Slope (deg)")
        plt.title("Slope Map (Dark=Flat, Bright=Steep)")
        plt.axis("off")
        plt.tight_layout()
        p = out_dir / "slope_debug.png"
        plt.savefig(p, dpi=150, bbox_inches="tight")
        plt.close(fig)

        # Main 2D analysis
        if self.ortho is not None:
            ortho_show, s = self._downsample(self.ortho, self.plot_max_dim)
        else:
            ortho_show, s = self._downsample(self.ndsm, self.plot_max_dim)

        slope_show, _ = self._downsample(self.slope_map, self.plot_max_dim)

        fig, axes = plt.subplots(1, 2, figsize=(22, 10))

        # Left: ortho + core vs final
        axes[0].imshow(ortho_show)
        for r in self.results:
            rid = r["id"]
            core = (self.core_labels == rid)[::s, ::s]
            fin = r["mask"][::s, ::s]
            axes[0].contour(core, levels=[0.5], colors=["cyan"], linewidths=1.0, linestyles="dashed", alpha=0.8)
            axes[0].contour(fin, levels=[0.5], colors=["lime"], linewidths=2.0)
            axes[0].text(r["cx"]/s, r["cy"]/s, f"#{rid}\n{r['volume_m3']:.0f}m³",
                         color="white", fontsize=8, ha="center", va="center",
                         bbox=dict(facecolor="black", alpha=0.6, pad=1.5))
        axes[0].set_title(f"Core vs Final (mode={self.params['mode_used']})\nCyan=Core, Green=Toe-to-Top")
        axes[0].axis("off")

        # Right: slope map + final boundaries
        im = axes[1].imshow(slope_show, cmap="inferno", vmin=0, vmax=70)
        plt.colorbar(im, ax=axes[1], label="Slope (deg)")
        for r in self.results:
            fin = r["mask"][::s, ::s]
            axes[1].contour(fin, levels=[0.5], colors=["cyan"], linewidths=1.4)
        axes[1].set_title("Slope Map (Dark=Flat, Bright=Steep) + Final Boundaries")
        axes[1].axis("off")

        plt.tight_layout()
        out = out_dir / "2d_analysis.png"
        plt.savefig(out, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"       saved {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Universal stockpile detection (adaptive)")
    parser.add_argument("--dsm", required=True, help="DSM GeoTIFF")
    parser.add_argument("--ortho", default=None, help="Orthophoto (optional)")

    parser.add_argument("--target-res", type=float, default=0.15, help="Processing resolution in meters (try 0.20/0.25 if low RAM)")
    parser.add_argument("--plot-max-dim", type=int, default=2500, help="Downsample plotting to this max dimension")

    parser.add_argument("--mode", choices=["auto", "small", "industrial"], default="auto")

    # Optional overrides
    parser.add_argument("--core-min-slope", type=float, default=None)
    parser.add_argument("--core-max-slope", type=float, default=None)
    parser.add_argument("--core-min-height", type=float, default=None)
    parser.add_argument("--toe-min-slope", type=float, default=None)
    parser.add_argument("--toe-min-height", type=float, default=None)
    parser.add_argument("--buffer-distance", type=float, default=None)
    parser.add_argument("--min-area", type=float, default=None)
    parser.add_argument("--machine-width", type=float, default=None)

    # Ground window override
    parser.add_argument("--ground-win-m", type=float, default=None, help="Override ground window size in meters (otherwise adaptive)")

    args = parser.parse_args()

    pipe = UniversalStockpilePipeline(
        dsm_path=args.dsm,
        ortho_path=args.ortho,
        target_res=args.target_res,
        plot_max_dim=args.plot_max_dim,
        mode=args.mode,
        core_min_slope=args.core_min_slope,
        core_max_slope=args.core_max_slope,
        core_min_height=args.core_min_height,
        toe_min_slope=args.toe_min_slope,
        toe_min_height=args.toe_min_height,
        buffer_distance_m=args.buffer_distance,
        min_area_m2=args.min_area,
        machine_width_m=args.machine_width,
        ground_win_m=args.ground_win_m,
    )
    pipe.run()