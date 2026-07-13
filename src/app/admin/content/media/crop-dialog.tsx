"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

import type { MediaCropSpec } from "@/lib/content/media/image-optimizer";

import styles from "../content-hub.module.css";

type CropDialogSlot = "hero" | "gallery" | "card" | "detail";
type CropVariant = "desktop" | "mobile" | "standard";

type CropDialogProps = {
  file: File | null;
  open: boolean;
  slot: CropDialogSlot;
  onApply: (crops: Partial<Record<CropVariant, MediaCropSpec>>) => void;
  onCancel: () => void;
};

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const VARIANT_META: Record<CropVariant, { label: string; aspect: number }> = {
  desktop: { label: "Desktop", aspect: 16 / 9 },
  mobile: { label: "Mobile", aspect: 4 / 5 },
  standard: { label: "Recorte", aspect: 4 / 3 },
};

export function requiredVariants(slot: CropDialogSlot): CropVariant[] {
  return slot === "hero" ? ["desktop", "mobile"] : ["standard"];
}

export function isCropDialogReady({
  slot,
  activeVariant,
  areas,
  saved,
}: {
  slot: CropDialogSlot;
  activeVariant: CropVariant;
  areas: Partial<Record<CropVariant, CropArea>>;
  saved: Partial<Record<CropVariant, MediaCropSpec>>;
}) {
  return requiredVariants(slot).every((variant) =>
    variant === activeVariant ? Boolean(saved[variant] ?? areas[variant]) : Boolean(saved[variant]),
  );
}

function buildObjectUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

export function CropDialog({ file, open, slot, onApply, onCancel }: CropDialogProps) {
  const variants = useMemo(() => requiredVariants(slot), [slot]);
  const [activeVariant, setActiveVariant] = useState<CropVariant>(variants[0] ?? "standard");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [areas, setAreas] = useState<Partial<Record<CropVariant, CropArea>>>({});
  const [saved, setSaved] = useState<Partial<Record<CropVariant, MediaCropSpec>>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextUrl = buildObjectUrl(file);
    setSourceUrl(nextUrl);
    setActiveVariant(requiredVariants(slot)[0] ?? "standard");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreas({});
    setSaved({});
    setMediaSize(null);

    return () => {
      if (nextUrl) {
        URL.revokeObjectURL(nextUrl);
      }
    };
  }, [file, open, slot]);

  if (!open || !file || !sourceUrl) {
    return null;
  }

  const isReady = isCropDialogReady({
    slot,
    activeVariant,
    areas,
    saved,
  });
  const aspect = VARIANT_META[activeVariant].aspect;

  function persistCurrentVariant() {
    const currentArea = areas[activeVariant];
    if (!currentArea || !mediaSize) {
      return;
    }

    setSaved((current) => ({
      ...current,
      [activeVariant]: {
        x: currentArea.x / mediaSize.width,
        y: currentArea.y / mediaSize.height,
        width: currentArea.width / mediaSize.width,
        height: currentArea.height / mediaSize.height,
        rotation: 0,
      },
    }));
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div
        className={styles.dialogCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-dialog-title"
      >
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.tabMeta}>Ajustar imagen</p>
            <h3 id="crop-dialog-title" className={styles.dialogTitle}>
              {slot === "hero" ? "Recortes obligatorios" : "Recorte fijo obligatorio"}
            </h3>
          </div>
          <button type="button" className={styles.ghostButton} onClick={onCancel}>
            Cancelar
          </button>
        </div>

        <div className={styles.dialogTabs} role="tablist" aria-label="Recortes">
          {variants.map((variant) => (
            <button
              key={variant}
              type="button"
              role="tab"
              aria-selected={activeVariant === variant}
              className={activeVariant === variant ? styles.tabButtonActive : styles.tabButton}
              onClick={() => {
                persistCurrentVariant();
                setActiveVariant(variant);
              }}
            >
              {VARIANT_META[variant].label}
            </button>
          ))}
        </div>

        <div className={styles.cropStage}>
          <Cropper
            image={sourceUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) => {
              setAreas((current) => ({
                ...current,
                [activeVariant]: croppedAreaPixels,
              }));
            }}
            onMediaLoaded={(size: { naturalWidth: number; naturalHeight: number }) => {
              setMediaSize({
                width: size.naturalWidth,
                height: size.naturalHeight,
              });
            }}
          />
        </div>

        <div className={styles.dialogFooter}>
          <div className={styles.cropStatusRow}>
            {variants.map((variant) => (
              <span key={variant} className={saved[variant] ? styles.statusChipReady : styles.statusChipPending}>
                {VARIANT_META[variant].label}
              </span>
            ))}
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={!isReady}
            onClick={() => {
              persistCurrentVariant();
              const next = { ...saved };
              const currentArea = areas[activeVariant];
              if (currentArea && mediaSize) {
                next[activeVariant] = {
                  x: currentArea.x / mediaSize.width,
                  y: currentArea.y / mediaSize.height,
                  width: currentArea.width / mediaSize.width,
                  height: currentArea.height / mediaSize.height,
                  rotation: 0,
                };
              }
              if (variants.every((variant) => Boolean(next[variant]))) {
                onApply(next);
              }
            }}
          >
            Aplicar recortes
          </button>
        </div>
      </div>
    </div>
  );
}
