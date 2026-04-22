"""
Fine-tune SAM3 sam_mask_decoder on Zeebrugge pile perimeters.
=============================================================
Architecture:
  - SamGeo3 (backend=meta, enable_inst_interactivity=True)
  - model.inst_interactive_predictor.model = Sam3TrackerPredictor
      ├─ backbone / transformer / segmentation_head  (frozen)
      ├─ sam_prompt_encoder  (frozen)
      └─ sam_mask_decoder    (4.22M — TRAINED)

Strategy:
  - Freeze everything except sam_mask_decoder
  - Use DXF perimeters as ground-truth masks
  - Box prompt per pile (tight bbox around mask)
  - BCE + Dice loss on 256×256 mask output
  - 24 piles × 20 augmented crops = ~480 samples/epoch

Usage (conda activate geo):
  python3 train_sam_piles.py \
      --ortho  "zee_files/Zeebrugge Stocks.Ii.tif" \
      --perims "zee_files/pile perimeters.dxf" \
      --epochs 30 \
      --out    interactive/sam3_decoder_finetuned.pth
"""

import argparse, os, random
import cv2
import geopandas as gpd
import numpy as np
import rasterio
import rasterio.enums
import rasterio.features
import torch
import torch.nn.functional as F
from shapely.geometry import Polygon
from torch.utils.data import DataLoader, Dataset

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SAM3_INPUT_SIZE = 1024   # SAM3 native resolution


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Rasterise DXF perimeters → (chip_rgb, binary_mask, box) triples
# ─────────────────────────────────────────────────────────────────────────────
def load_training_samples(ortho_path, perims_path, pad_px=80):
    print("[Data] Reading orthophoto …", flush=True)
    with rasterio.open(ortho_path) as src:
        geo_tf  = src.transform
        full_h, full_w = src.height, src.width
        crs     = src.crs
        # Cap read at 8192 px to stay in memory on 40k rasters
        sc = min(1.0, 8192 / max(full_h, full_w))
        oh, ow = max(1, int(full_h * sc)), max(1, int(full_w * sc))
        arr = src.read(out_shape=(src.count, oh, ow),
                       resampling=rasterio.enums.Resampling.bilinear)
        bounds = src.bounds

    rgb = np.moveaxis(arr[:3], 0, -1) if arr.shape[0] >= 3 else np.dstack([arr[0]]*3)
    if rgb.dtype != np.uint8:
        lo, hi = rgb.min(), rgb.max()
        rgb = ((rgb.astype(np.float32)-lo)/max(hi-lo,1)*255).astype(np.uint8)

    # Effective transform for the downsampled image
    eff_tf = rasterio.transform.from_bounds(*bounds, ow, oh)
    inv_tf = ~eff_tf

    print(f"[Data] Ortho {full_w}×{full_h} → read {ow}×{oh}  (sc={sc:.4f})", flush=True)

    # Load perimeters
    gdf = gpd.read_file(perims_path)
    if gdf.crs is not None and gdf.crs != crs:
        gdf = gdf.to_crs(crs)

    def _to_poly(geom):
        raw = list(geom.coords)
        if len(raw) < 3: return None
        xy = [(c[0], c[1]) for c in raw]
        if xy[0] != xy[-1]: xy.append(xy[0])
        p = Polygon(xy)
        return p if p.is_valid and p.area > 0 else None

    polys = []
    for geom in gdf.geometry:
        if geom is None or geom.is_empty: continue
        if geom.geom_type in ("LineString", "LinearRing"):
            p = _to_poly(geom)
            if p: polys.append(p)
        elif geom.geom_type == "MultiLineString":
            for ls in geom.geoms:
                p = _to_poly(ls);
                if p: polys.append(p)
        elif geom.geom_type == "Polygon":
            polys.append(geom)

    print(f"[Data] {len(polys)} pile perimeters", flush=True)

    def geo_to_px(gx, gy):
        c, r = inv_tf * (gx, gy)
        return int(c), int(r)

    samples = []
    for i, poly in enumerate(polys):
        minx, miny, maxx, maxy = poly.bounds
        px0, py0 = geo_to_px(minx, maxy)   # top-left in image
        px1, py1 = geo_to_px(maxx, miny)   # bottom-right
        px0 = max(0, px0 - pad_px);  py0 = max(0, py0 - pad_px)
        px1 = min(ow-1, px1 + pad_px); py1 = min(oh-1, py1 + pad_px)
        cw, ch = px1 - px0, py1 - py0
        if cw < 10 or ch < 10: continue

        chip_rgb = rgb[py0:py1, px0:px1].copy()

        # Rasterise polygon into chip
        chip_tf = rasterio.transform.from_bounds(
            eff_tf.c + px0*eff_tf.a, eff_tf.f + py1*eff_tf.e,
            eff_tf.c + px1*eff_tf.a, eff_tf.f + py0*eff_tf.e,
            cw, ch)
        chip_mask = rasterio.features.rasterize(
            [(poly.__geo_interface__, 1)], out_shape=(ch, cw),
            transform=chip_tf, fill=0, dtype=np.uint8)

        if chip_mask.sum() < 50: continue

        ys, xs = np.where(chip_mask > 0)
        box = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]

        # Resize to SAM3_INPUT_SIZE for both image and mask
        img_r   = cv2.resize(chip_rgb,  (SAM3_INPUT_SIZE, SAM3_INPUT_SIZE))
        mask_r  = cv2.resize(chip_mask, (SAM3_INPUT_SIZE, SAM3_INPUT_SIZE),
                              interpolation=cv2.INTER_NEAREST)
        sx = SAM3_INPUT_SIZE / cw;  sy = SAM3_INPUT_SIZE / ch
        box_r = [int(box[0]*sx), int(box[1]*sy), int(box[2]*sx), int(box[3]*sy)]

        samples.append({"image": img_r, "mask": mask_r, "box": box_r, "id": i})

    print(f"[Data] {len(samples)} training chips", flush=True)
    return samples


# ─────────────────────────────────────────────────────────────────────────────
# 2.  Dataset with augmentation
# ─────────────────────────────────────────────────────────────────────────────
class PileDataset(Dataset):
    def __init__(self, samples, repeats=20):
        self.samples = samples
        self.repeats = repeats

    def __len__(self):
        return len(self.samples) * self.repeats

    def __getitem__(self, idx):
        s   = self.samples[idx % len(self.samples)]
        img = s["image"].copy()
        msk = s["mask"].copy()
        box = list(s["box"])

        # Random flips
        if random.random() > 0.5:
            img = cv2.flip(img, 1); msk = cv2.flip(msk, 1)
            w = img.shape[1]
            box = [w - box[2], box[1], w - box[0], box[3]]
        if random.random() > 0.5:
            img = cv2.flip(img, 0); msk = cv2.flip(msk, 0)
            h = img.shape[0]
            box = [box[0], h - box[3], box[2], h - box[1]]
        # Brightness / contrast jitter
        if random.random() > 0.3:
            img = np.clip(img.astype(np.float32) * random.uniform(0.8, 1.2)
                          + random.randint(-20, 20), 0, 255).astype(np.uint8)

        # SAM3 mask decoder outputs 288×288
        msk_small = cv2.resize(msk, (288, 288), interpolation=cv2.INTER_NEAREST)
        return (
            torch.from_numpy(img).permute(2, 0, 1).float(),        # 3×1024×1024
            torch.from_numpy(msk_small).float().unsqueeze(0),       # 1×288×288
            torch.tensor(box, dtype=torch.float32),                 # [x0,y0,x1,y1]
        )


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Loss helpers
# ─────────────────────────────────────────────────────────────────────────────
def dice_loss(pred, target, smooth=1.0):
    p = torch.sigmoid(pred).flatten(1)
    t = target.flatten(1)
    inter = (p * t).sum(1)
    return 1 - (2*inter + smooth) / (p.sum(1) + t.sum(1) + smooth)


# ─────────────────────────────────────────────────────────────────────────────
# 4.  Training loop
# ─────────────────────────────────────────────────────────────────────────────
def train(args):
    samples = load_training_samples(args.ortho, args.perims)
    if not samples:
        print("[Error] No training samples."); return

    loader = DataLoader(PileDataset(samples, repeats=args.repeats),
                        batch_size=1, shuffle=True, num_workers=0)

    # ── Load SAM3 (same way as the interactive tools) ─────────────────────
    print("[Train] Loading SAM3 (enable_inst_interactivity=True) …", flush=True)
    from samgeo.samgeo3 import SamGeo3
    sam_geo = SamGeo3(backend="meta", enable_inst_interactivity=True,
                      load_from_HF=True)
    sam_geo.model.to(DEVICE)

    # ── Identify trainable component ──────────────────────────────────────
    inner = sam_geo.model.inst_interactive_predictor.model   # Sam3TrackerPredictor
    decoder = inner.sam_mask_decoder

    # Freeze everything
    for p in sam_geo.model.parameters():
        p.requires_grad = False
    # Unfreeze ONLY the mask decoder
    for p in decoder.parameters():
        p.requires_grad = True

    trainable = sum(p.numel() for p in decoder.parameters())
    print(f"[Train] Training sam_mask_decoder only: {trainable/1e6:.2f}M params",
          flush=True)

    optimizer = torch.optim.AdamW(decoder.parameters(),
                                  lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs)

    best_loss = float("inf")

    for epoch in range(1, args.epochs + 1):
        sam_geo.model.train()
        decoder.train()
        epoch_loss = 0.0
        n = 0

        for img_t, msk_t, box_t in loader:
            img_np = img_t[0].permute(1, 2, 0).numpy().astype(np.uint8)
            msk_t  = msk_t.to(DEVICE)   # 1×1×256×256
            box_np = box_t[0].numpy()    # [x0,y0,x1,y1]

            # Encode image features (no grad — backbone frozen)
            with torch.no_grad():
                sam_geo.set_image(img_np)   # populates inference_state

            inf_state = sam_geo.inference_state
            backbone_out = inf_state["backbone_out"]["sam2_backbone_out"]

            # Prepare backbone features for the inst predictor
            (_, vision_feats, _, _) = inner._prepare_backbone_features(backbone_out)
            vision_feats[-1] = vision_feats[-1] + inner.no_mem_embed
            feats = [
                feat.permute(1,2,0).view(1, -1, *fs)
                for feat, fs in zip(vision_feats[::-1],
                                    sam_geo.model.inst_interactive_predictor
                                    ._bb_feat_sizes[::-1])
            ][::-1]
            image_embed    = feats[-1]          # 1×C×H×W
            high_res_feats = feats[:-1]

            # Prompt encoder (no grad)
            with torch.no_grad():
                box_tensor = torch.tensor(box_np[None, None, :],   # 1×1×4
                                          dtype=torch.float32, device=DEVICE)
                sparse_emb, dense_emb = inner.sam_prompt_encoder(
                    points=None, boxes=box_tensor, masks=None)

            # Mask decoder (WITH grad) — returns (masks, iou_pred, sam_tokens_out, object_score_logits)
            low_res_masks, iou_pred, _, _ = inner.sam_mask_decoder(
                image_embeddings=image_embed,
                image_pe=inner.sam_prompt_encoder.get_dense_pe(),
                sparse_prompt_embeddings=sparse_emb,
                dense_prompt_embeddings=dense_emb,
                multimask_output=False,
                repeat_image=False,
                high_res_features=high_res_feats,
            )
            # low_res_masks: 1×1×288×288
            pred  = low_res_masks                # 1×1×288×288
            gt    = msk_t                        # 1×1×288×288

            loss = (F.binary_cross_entropy_with_logits(pred, gt)
                    + dice_loss(pred, gt).mean())

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(decoder.parameters(), 1.0)
            optimizer.step()
            epoch_loss += loss.item(); n += 1

        scheduler.step()
        avg = epoch_loss / max(n, 1)
        print(f"[Epoch {epoch:3d}/{args.epochs}]  loss={avg:.4f}"
              f"  lr={scheduler.get_last_lr()[0]:.2e}", flush=True)

        if avg < best_loss:
            best_loss = avg
            torch.save(decoder.state_dict(), args.out)
            print(f"  -> Saved → {args.out}", flush=True)

    print(f"\n[Done] Best loss={best_loss:.4f}  checkpoint={args.out}", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="Fine-tune SAM3 sam_mask_decoder on pile perimeters")
    ap.add_argument("--ortho",   required=True, help="Orthophoto GeoTIFF")
    ap.add_argument("--perims",  required=True, help="DXF/GeoJSON pile perimeters")
    ap.add_argument("--epochs",  type=int,   default=30)
    ap.add_argument("--lr",      type=float, default=1e-4)
    ap.add_argument("--repeats", type=int,   default=20,
                    help="Dataset repetitions per epoch (augmentation multiplier)")
    ap.add_argument("--out",     default="interactive/sam3_decoder_finetuned.pth")
    args = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    train(args)


if __name__ == "__main__":
    main()
