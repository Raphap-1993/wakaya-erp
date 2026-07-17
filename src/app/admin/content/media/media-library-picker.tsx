"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./media-library-picker.module.css";

export type MediaLibrarySlot = "hero" | "detail" | "card" | "gallery";

export type MediaLibraryAsset = {
  id: string;
  originalFilename: string;
  previewUrl: string;
  createdAt: string;
};

type MediaLibraryPickerProps = {
  open: boolean;
  slot: MediaLibrarySlot;
  selectedAssetId?: string | null;
  onClose: () => void;
  onSelect: (assetId: string) => void;
};

export function mediaAssetUrl(assetId: string, slot: MediaLibrarySlot) {
  const variant = slot === "hero" ? "heroDesktop" : slot === "card" ? "card" : "detail";
  return `/media/assets/${assetId}/${variant}.webp`;
}

export function MediaLibraryPicker({
  open,
  slot,
  selectedAssetId,
  onClose,
  onSelect,
}: MediaLibraryPickerProps) {
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/admin/content/media?q=${encodeURIComponent(query)}&limit=100`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as { assets?: MediaLibraryAsset[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "media_library_failed");
        setAssets(body.assets ?? []);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("No se pudo cargar la biblioteca de imágenes.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [open, query]);

  async function deleteAsset(asset: MediaLibraryAsset) {
    if (!window.confirm(`¿Eliminar físicamente “${asset.originalFilename}”? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingAssetId(asset.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/content/media/${encodeURIComponent(asset.id)}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(
          body.error === "asset_in_use"
            ? "No se puede eliminar: esta imagen todavía se usa en otra sección."
            : "No se pudo eliminar físicamente la imagen.",
        );
        return;
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch {
      setError("No se pudo eliminar físicamente la imagen.");
    } finally {
      setDeletingAssetId(null);
    }
  }

  const title = useMemo(
    () => (slot === "hero" ? "imagen de slider" : slot === "card" ? "tarjeta" : "contenido"),
    [slot],
  );

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="media-library-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Biblioteca multimedia</p>
            <h2 id="media-library-title">Elegir {title}</h2>
            <p className={styles.lead}>Selecciona una imagen existente. Su uso en otra sección se conserva.</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
        </header>

        <label className={styles.searchLabel}>
          Buscar por nombre
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. recepción.webp"
            autoFocus
          />
        </label>

        {loading ? <p className={styles.status}>Cargando imágenes…</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {!loading && !error && assets.length === 0 ? (
          <p className={styles.status}>No hay imágenes que coincidan con la búsqueda.</p>
        ) : null}
        <div className={styles.grid}>
          {assets.map((asset) => {
            const selected = asset.id === selectedAssetId;
            return (
              <button
                type="button"
                key={asset.id}
                className={selected ? styles.assetSelected : styles.asset}
                onClick={() => {
                  onSelect(asset.id);
                  onClose();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Selector administrativo para assets runtime. */}
                <img src={asset.previewUrl} alt="" />
                <span title={asset.originalFilename}>{asset.originalFilename}</span>
                {selected ? <small>Seleccionada</small> : null}
                <span
                  role="button"
                  tabIndex={0}
                  className={styles.deleteButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    void deleteAsset(asset);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      void deleteAsset(asset);
                    }
                  }}
                >
                  {deletingAssetId === asset.id ? "Eliminando…" : "Eliminar físicamente"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
