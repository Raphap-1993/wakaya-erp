"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { HomeEditor } from "@/app/admin/home/home-editor";
import { CropDialog } from "@/app/admin/content/media/crop-dialog";
import { MediaFilenamePreview } from "@/app/admin/content/media/media-filename-preview";
import { CorporateContentEditor } from "@/app/admin/content/corporate-content-editor";
import {
  resolveAdminMediaDescriptor,
  type AdminMediaMetadataMap,
} from "@/lib/content/media/admin-media-metadata";
import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import type {
  ExperienceRecord,
  GalleryPublication,
} from "@/lib/content/types";
import type { HomeContentRevisionRecord } from "@/lib/home-content/types";
import type {
  CorporateContentRevisionRecord,
  CorporateContentRevisionSummary,
} from "@/lib/corporate-content/types";
import type { Bungalow, BungalowPublicContent } from "@/lib/reservations/types";

import styles from "./content-hub.module.css";

type TabKey = "overview" | "home" | "experiences" | "gallery" | "bungalows" | "company";
type LocaleKey = "es" | "en";

type HubBungalowItem = {
  bungalow: Bungalow;
  publicContent: BungalowPublicContent;
};

type ContentHubProps = {
  initialTab: TabKey;
  initialHomeItem: HomeContentRevisionRecord;
  initialHomeRevisions: HomeContentRevisionRecord[];
  initialCorporateItem?: CorporateContentRevisionRecord;
  initialCorporateRevisions?: CorporateContentRevisionSummary[];
  initialExperiences: ExperienceRecord[];
  initialGallery: GalleryPublication;
  initialBungalows: HubBungalowItem[];
  initialBungalowId?: string;
  initialMediaMetadata?: AdminMediaMetadataMap;
};

type Feedback = {
  kind: "success" | "error";
  message: string;
};

type UploadIntent = {
  slot: "hero" | "gallery" | "card" | "detail";
  file: File;
  applyAsset: (asset: ContentMediaAsset) => void;
};

function blankLocaleContent() {
  return {
    title: "",
    summary: "",
    body: "",
    duration: "",
    priceLabel: "",
    ctaLabel: "",
    included: ["Incluido"],
    recommendations: ["Reservar"],
  };
}

export function rememberMediaAsset(
  current: AdminMediaMetadataMap,
  asset: ContentMediaAsset,
): AdminMediaMetadataMap {
  return {
    ...current,
    [asset.id]: {
      assetId: asset.id,
      originalFilename: asset.originalFilename,
    },
  };
}

export function applyContentHubMediaAsset(
  asset: ContentMediaAsset,
  onMediaAssetCreated: (createdAsset: ContentMediaAsset) => void,
  onApplyAsset: (createdAsset: ContentMediaAsset) => void,
) {
  onMediaAssetCreated(asset);
  onApplyAsset(asset);
}

function createDraftExperience(nextOrder: number): ExperienceRecord {
  return {
    id: `draft-${crypto.randomUUID()}`,
    slug: "",
    visible: false,
    featuredOnHome: false,
    sortOrder: nextOrder,
    iconKey: "spark",
    localeContent: {
      es: blankLocaleContent(),
      en: blankLocaleContent(),
    },
    cardAssetId: null,
    heroAssetId: null,
    galleryAssetIds: [],
    version: 0,
    deletedAt: null,
  };
}

function linesToText(items: string[]) {
  return items.join("\n");
}

function textToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveSelectedBungalowId(items: HubBungalowItem[], requestedId?: string) {
  return items.find((item) => item.bungalow.id === requestedId)?.bungalow.id ?? items[0]?.bungalow.id ?? "";
}

function buildContentHubHref(input: {
  tab: TabKey;
  bungalowId?: string;
}): Route {
  const params = new URLSearchParams();
  params.set("tab", input.tab);
  if (input.tab === "bungalows") {
    if (input.bungalowId) {
      params.set("bungalowId", input.bungalowId);
    }
  }
  return `/admin/content?${params.toString()}` as Route;
}

function assetPreviewUrl(assetId: string | null | undefined, slot: "hero" | "gallery" | "card" | "detail") {
  if (!assetId) return "";
  switch (slot) {
    case "hero":
      return `/media/assets/${assetId}/heroDesktop.webp`;
    case "card":
      return `/media/assets/${assetId}/card.webp`;
    case "gallery":
    case "detail":
      return `/media/assets/${assetId}/detail.webp`;
  }
}

function describeContentHubError(message: string) {
  switch (message) {
    case "media_crop_required":
      return "Debes confirmar el recorte obligatorio antes de guardar la imagen.";
    case "media_crop_invalid":
      return "El recorte elegido quedó fuera del área válida. Ajústalo e intenta otra vez.";
    case "media_crop_too_small":
      return "El recorte quedó demasiado pequeño para la variante requerida. Amplía el área o usa una imagen con más resolución.";
    case "invalid_media_type":
      return "Solo se permiten imágenes JPG, PNG o WebP.";
    case "media_too_large":
      return "La imagen supera el peso máximo permitido.";
    case "media_dimensions_too_large":
      return "La imagen supera las dimensiones máximas permitidas.";
    case "media_processing_failed":
    case "media_upload_failed":
      return "No se pudo procesar la imagen subida.";
    default:
      return message;
  }
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? styles.tabButtonActive : styles.tabButton}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AssetField({
  label,
  slot,
  previewUrl,
  mediaMetadata,
  onUploadSelected,
}: {
  label: string;
  slot: "hero" | "gallery" | "card" | "detail";
  previewUrl: string;
  mediaMetadata: AdminMediaMetadataMap;
  onUploadSelected: (file: File, slot: "hero" | "gallery" | "card" | "detail") => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const usablePreviewUrl = previewUrl.trim();
  const descriptor = usablePreviewUrl
    ? resolveAdminMediaDescriptor(usablePreviewUrl, mediaMetadata)
    : null;

  return (
    <div className={styles.previewCard}>
      <div className={styles.toolbar}>
        <strong>{label}</strong>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => inputRef.current?.click()}
        >
          {usablePreviewUrl ? "Reemplazar" : "Subir imagen"}
        </button>
      </div>
      {descriptor ? (
        // eslint-disable-next-line @next/next/no-img-element -- Preview administrativa de una variante runtime ya optimizada.
        <img className={styles.previewImage} src={descriptor.previewUrl} alt={label} />
      ) : null}
      {descriptor ? (
        <div className={styles.mediaFilename}>
          <MediaFilenamePreview
            originalFilename={descriptor.originalFilename}
            previewUrl={descriptor.previewUrl}
          />
        </div>
      ) : (
        <div className={styles.listItemMeta}>Sin imagen asociada</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            onUploadSelected(file, slot);
          }
        }}
      />
    </div>
  );
}

export function ContentHub({
  initialTab,
  initialHomeItem,
  initialHomeRevisions,
  initialCorporateItem,
  initialCorporateRevisions = [],
  initialExperiences,
  initialGallery,
  initialBungalows,
  initialBungalowId,
  initialMediaMetadata = {},
}: ContentHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeLocale, setActiveLocale] = useState<LocaleKey>("es");
  const [experiences, setExperiences] = useState<ExperienceRecord[]>(initialExperiences);
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>(
    initialExperiences[0]?.id ?? "",
  );
  const [gallery, setGallery] = useState<GalleryPublication>(initialGallery);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(initialGallery.items[0]?.id ?? "");
  const [bungalows, setBungalows] = useState<HubBungalowItem[]>(initialBungalows);
  const [mediaMetadata, setMediaMetadata] = useState<AdminMediaMetadataMap>(
    initialMediaMetadata,
  );
  const [selectedBungalowId, setSelectedBungalowId] = useState<string>(deriveSelectedBungalowId(initialBungalows, initialBungalowId));
  const [uploadIntent, setUploadIntent] = useState<UploadIntent | null>(null);
  const uploadHandlerRef = useRef<((asset: ContentMediaAsset) => void) | null>(null);
  const bungalowGalleryUploadRef = useRef<HTMLInputElement | null>(null);

  const selectedExperience = useMemo(
    () => experiences.find((item) => item.id === selectedExperienceId) ?? null,
    [experiences, selectedExperienceId],
  );

  const selectedGalleryItem = useMemo(
    () => gallery.items.find((item) => item.id === selectedGalleryId) ?? null,
    [gallery.items, selectedGalleryId],
  );

  const selectedBungalow = useMemo(
    () => bungalows.find((item) => item.bungalow.id === selectedBungalowId) ?? null,
    [bungalows, selectedBungalowId],
  );
  const selectedBungalowLocale = selectedBungalow?.publicContent.localeContent[activeLocale] ?? null;

  function handleMediaAssetCreated(asset: ContentMediaAsset) {
    setMediaMetadata((current) => rememberMediaAsset(current, asset));
  }

  function updateSelectedBungalow(
    updater: (current: BungalowPublicContent) => BungalowPublicContent,
  ) {
    if (!selectedBungalow) {
      return;
    }

    setBungalows((current) =>
      current.map((item) =>
        item.bungalow.id === selectedBungalow.bungalow.id
          ? { ...item, publicContent: updater(item.publicContent) }
          : item,
      ),
    );
  }

  function updateSelectedBungalowLocale(
    locale: LocaleKey,
    updater: (
      current: BungalowPublicContent["localeContent"][LocaleKey],
    ) => BungalowPublicContent["localeContent"][LocaleKey],
  ) {
    updateSelectedBungalow((current) => ({
      ...current,
      localeContent: {
        ...current.localeContent,
        [locale]: updater(current.localeContent[locale]),
      },
    }));
  }

  function switchTab(nextTab: TabKey) {
    setActiveTab(nextTab);
    router.replace(
      buildContentHubHref({
        tab: nextTab,
        bungalowId: selectedBungalowId,
      }),
    );
  }

  function openBungalow(nextBungalowId: string) {
    setSelectedBungalowId(nextBungalowId);
    router.replace(
      buildContentHubHref({
        tab: "bungalows",
        bungalowId: nextBungalowId,
      }),
    );
  }

  function beginUpload(
    file: File,
    slot: "hero" | "gallery" | "card" | "detail",
    onApplyAsset: (asset: ContentMediaAsset) => void,
  ) {
    uploadHandlerRef.current = onApplyAsset;
    setUploadIntent({ file, slot, applyAsset: onApplyAsset });
  }

  async function uploadWithCrops(file: File, slot: "hero" | "gallery" | "card" | "detail", crops: unknown) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("slot", slot);
    formData.set("crops", JSON.stringify(crops));

    const response = await fetch("/api/admin/content/media", {
      method: "POST",
      body: formData,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(describeContentHubError(body.error ?? "media_upload_failed"));
    }
    return body.asset as ContentMediaAsset;
  }

  async function saveExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!selectedExperience) {
      return;
    }

    const currentExperience = selectedExperience;

    const payload = {
      slug: currentExperience.slug,
      visible: currentExperience.visible,
      featuredOnHome: currentExperience.featuredOnHome,
      sortOrder: currentExperience.sortOrder,
      iconKey: currentExperience.iconKey,
      content: currentExperience.localeContent,
      cardAssetId: currentExperience.cardAssetId,
      heroAssetId: currentExperience.heroAssetId,
      galleryAssetIds: currentExperience.galleryAssetIds,
    };

    const isDraft = currentExperience.version === 0;
    const response = await fetch(
      isDraft
        ? "/api/admin/content/experiences"
        : `/api/admin/content/experiences/${currentExperience.id}`,
      {
        method: isDraft ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isDraft ? payload : { ...payload, expectedVersion: currentExperience.version },
        ),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback({ kind: "error", message: body.error ?? "No se pudo guardar la experiencia." });
      return;
    }

    const nextItem = body.experience as ExperienceRecord;
    setExperiences((current) => {
      const rest = current.filter((item) => item.id !== currentExperience.id);
      return [...rest, nextItem].sort((left, right) => left.sortOrder - right.sortOrder);
    });
    setSelectedExperienceId(nextItem.id);
    setFeedback({ kind: "success", message: "Experiencia guardada." });
  }

  async function archiveExperience() {
    if (!selectedExperience) {
      return;
    }

    const currentExperience = selectedExperience;

    if (currentExperience.version === 0) {
      setExperiences((current) => current.filter((item) => item.id !== currentExperience.id));
      setSelectedExperienceId(experiences.find((item) => item.id !== currentExperience.id)?.id ?? "");
      return;
    }

    const response = await fetch(`/api/admin/content/experiences/${currentExperience.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expectedVersion: currentExperience.version }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback({ kind: "error", message: body.error ?? "No se pudo archivar la experiencia." });
      return;
    }

    setExperiences((current) => current.filter((item) => item.id !== currentExperience.id));
    setSelectedExperienceId(experiences.find((item) => item.id !== currentExperience.id)?.id ?? "");
    setFeedback({ kind: "success", message: "Experiencia archivada." });
  }

  async function saveGallery() {
    const response = await fetch("/api/admin/content/gallery", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expectedVersion: gallery.version,
        items: gallery.items,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback({ kind: "error", message: body.error ?? "No se pudo guardar la galería." });
      return;
    }
    setGallery(body as GalleryPublication);
    setFeedback({ kind: "success", message: "Galería publicada." });
  }

  async function saveBungalow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBungalow) return;

    const response = await fetch(`/api/admin/content/bungalows/${selectedBungalow.bungalow.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expectedVersion: selectedBungalow.publicContent.revisionVersion ?? 0,
        featuredOnHome: selectedBungalow.publicContent.featuredOnHome,
        sortOrder: selectedBungalow.publicContent.sortOrder,
        nightlyRatePen: selectedBungalow.publicContent.nightlyRatePen,
        areaSqm: selectedBungalow.publicContent.areaSqm,
        heroImageUrl: selectedBungalow.publicContent.heroImageUrl,
        galleryUrls: selectedBungalow.publicContent.galleryUrls,
        localeContent: selectedBungalow.publicContent.localeContent,
        heroAssetId: selectedBungalow.publicContent.heroAssetId ?? null,
        galleryAssetIds: selectedBungalow.publicContent.galleryAssetIds ?? [],
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback({ kind: "error", message: body.error ?? "No se pudo guardar el bungalow." });
      return;
    }

    setBungalows((current) =>
      current.map((item) =>
        item.bungalow.id === selectedBungalow.bungalow.id
          ? { ...item, publicContent: body.item as BungalowPublicContent }
          : item,
      ),
    );
    setFeedback({ kind: "success", message: "Bungalow guardado." });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Wakaya · centro editorial</p>
        <h1 className={styles.title}>Contenido público</h1>
        <div className={styles.tabs} role="tablist" aria-label="Módulos de contenido">
          <TabButton active={activeTab === "overview"} label="Inicio" onClick={() => switchTab("overview")} />
          <TabButton active={activeTab === "home"} label="Home" onClick={() => switchTab("home")} />
          <TabButton
            active={activeTab === "experiences"}
            label="Experiencias"
            onClick={() => switchTab("experiences")}
          />
          <TabButton active={activeTab === "gallery"} label="Galería" onClick={() => switchTab("gallery")} />
          <TabButton
            active={activeTab === "bungalows"}
            label="Bungalows"
            onClick={() => switchTab("bungalows")}
          />
          <TabButton
            active={activeTab === "company"}
            label="Páginas"
            onClick={() => switchTab("company")}
          />
        </div>
        {feedback ? (
          <div className={feedback.kind === "success" ? styles.statusChipReady : styles.statusChipPending}>
            {feedback.message}
          </div>
        ) : null}
      </header>

      <section className={styles.workspace}>
        {activeTab === "overview" ? (
          <section className={styles.overview} aria-labelledby="content-overview-title">
            <div className={styles.overviewHeader}>
              <h2 id="content-overview-title">¿Qué quieres gestionar?</h2>
            </div>
            <div className={styles.moduleGrid}>
              <Link className={styles.moduleCard} href={buildContentHubHref({ tab: "home" })}>
                <span className={styles.moduleName}>Home</span>
                <strong>Editar Home</strong>
                <span className={styles.moduleMeta}>Slider y {initialHomeItem.document.sections.length} secciones</span>
              </Link>
              <Link className={styles.moduleCard} href={buildContentHubHref({ tab: "company" })}>
                <span className={styles.moduleName}>Páginas</span>
                <strong>Gestionar páginas</strong>
                <span className={styles.moduleMeta}>Empresa, contacto y políticas</span>
              </Link>
              <Link className={styles.moduleCard} href={buildContentHubHref({ tab: "experiences" })}>
                <span className={styles.moduleName}>Experiencias</span>
                <strong>Editar experiencias</strong>
                <span className={styles.moduleMeta}>{experiences.length} registradas</span>
              </Link>
              <Link className={styles.moduleCard} href={buildContentHubHref({ tab: "gallery" })}>
                <span className={styles.moduleName}>Galería</span>
                <strong>Gestionar galería</strong>
                <span className={styles.moduleMeta}>{gallery.items.length} imágenes</span>
              </Link>
              <Link className={styles.moduleCard} href={buildContentHubHref({ tab: "bungalows" })}>
                <span className={styles.moduleName}>Bungalows</span>
                <strong>Editar fichas públicas</strong>
                <span className={styles.moduleMeta}>{bungalows.length} categorías</span>
              </Link>
            </div>
          </section>
        ) : null}

        {activeTab === "home" ? (
          <HomeEditor
            initialItem={initialHomeItem}
            initialRevisions={initialHomeRevisions}
            mediaMetadata={mediaMetadata}
            onMediaAssetCreated={handleMediaAssetCreated}
          />
        ) : null}

        {activeTab === "company" && initialCorporateItem ? (
          <CorporateContentEditor
            initialItem={initialCorporateItem}
            initialRevisions={initialCorporateRevisions}
          />
        ) : null}

        {activeTab === "experiences" && selectedExperience ? (
          <div className={styles.split}>
            <aside className={styles.panel}>
              <div className={styles.toolbar}>
                <strong>Experiencias</strong>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    const draft = createDraftExperience(experiences.length + 1);
                    setExperiences((current) => [draft, ...current]);
                    setSelectedExperienceId(draft.id);
                  }}
                >
                  Nueva
                </button>
              </div>
              <div className={styles.list}>
                {experiences.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === selectedExperienceId ? styles.listItemActive : styles.listItem}
                    onClick={() => setSelectedExperienceId(item.id)}
                  >
                    <span className={styles.listItemTitle}>{item.localeContent.es.title || "Sin título"}</span>
                    <span className={styles.listItemMeta}>
                      Orden {item.sortOrder} · {item.visible ? "Visible" : "Oculta"}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <form className={styles.editorCard} onSubmit={saveExperience}>
              <div className={styles.toolbar}>
                <strong>Editor de experiencia</strong>
                <div className={styles.inlineActions}>
                  <button type="submit" className={styles.primaryButton}>
                    Guardar
                  </button>
                  <button type="button" className={styles.ghostButton} onClick={archiveExperience}>
                    Archivar
                  </button>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Orden</span>
                  <input
                    type="number"
                    value={selectedExperience.sortOrder}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? { ...item, sortOrder: Number(event.target.value) || 0 }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Visible</span>
                  <select
                    value={selectedExperience.visible ? "yes" : "no"}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? { ...item, visible: event.target.value === "yes" }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="yes">Visible</option>
                    <option value="no">Oculta</option>
                  </select>
                </label>
              </div>

              <details className={styles.advancedSection}>
                <summary>Opciones avanzadas</summary>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Slug</span>
                    <input
                      value={selectedExperience.slug}
                      onChange={(event) =>
                        setExperiences((current) =>
                          current.map((item) =>
                            item.id === selectedExperience.id ? { ...item, slug: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Icono</span>
                    <input
                      value={selectedExperience.iconKey}
                      onChange={(event) =>
                        setExperiences((current) =>
                          current.map((item) =>
                            item.id === selectedExperience.id ? { ...item, iconKey: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              </details>

              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={activeLocale === "es" ? styles.tabButtonActive : styles.tabButton}
                  onClick={() => setActiveLocale("es")}
                >
                  ES
                </button>
                <button
                  type="button"
                  className={activeLocale === "en" ? styles.tabButtonActive : styles.tabButton}
                  onClick={() => setActiveLocale("en")}
                >
                  EN
                </button>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Título</span>
                  <input
                    value={selectedExperience.localeContent[activeLocale].title}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    title: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Duración</span>
                  <input
                    value={selectedExperience.localeContent[activeLocale].duration}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    duration: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Precio</span>
                  <input
                    value={selectedExperience.localeContent[activeLocale].priceLabel}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    priceLabel: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>CTA</span>
                  <input
                    value={selectedExperience.localeContent[activeLocale].ctaLabel}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    ctaLabel: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.fieldFull}>
                  <span>Resumen</span>
                  <textarea
                    value={selectedExperience.localeContent[activeLocale].summary}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    summary: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.fieldFull}>
                  <span>Descripción</span>
                  <textarea
                    value={selectedExperience.localeContent[activeLocale].body}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    body: event.target.value,
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.fieldFull}>
                  <span>Incluye</span>
                  <textarea
                    value={linesToText(selectedExperience.localeContent[activeLocale].included)}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    included: textToLines(event.target.value),
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <label className={styles.fieldFull}>
                  <span>Recomendaciones</span>
                  <textarea
                    value={linesToText(selectedExperience.localeContent[activeLocale].recommendations)}
                    onChange={(event) =>
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id
                            ? {
                                ...item,
                                localeContent: {
                                  ...item.localeContent,
                                  [activeLocale]: {
                                    ...item.localeContent[activeLocale],
                                    recommendations: textToLines(event.target.value),
                                  },
                                },
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              </div>

              <div className={styles.formGrid}>
                <AssetField
                  label="Cover / card"
                  slot="card"
                  previewUrl={assetPreviewUrl(selectedExperience.cardAssetId, "card")}
                  mediaMetadata={mediaMetadata}
                  onUploadSelected={(file, slot) =>
                    beginUpload(file, slot, (asset) => {
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id ? { ...item, cardAssetId: asset.id } : item,
                        ),
                      );
                    })
                  }
                />
                <AssetField
                  label="Hero"
                  slot="hero"
                  previewUrl={assetPreviewUrl(selectedExperience.heroAssetId, "hero")}
                  mediaMetadata={mediaMetadata}
                  onUploadSelected={(file, slot) =>
                    beginUpload(file, slot, (asset) => {
                      setExperiences((current) =>
                        current.map((item) =>
                          item.id === selectedExperience.id ? { ...item, heroAssetId: asset.id } : item,
                        ),
                      );
                    })
                  }
                />
              </div>
            </form>
          </div>
        ) : null}

        {activeTab === "experiences" && !selectedExperience ? (
          <div className={styles.editorCard}>
            <div className={styles.toolbar}>
              <strong>Experiencias</strong>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  const draft = createDraftExperience(experiences.length + 1);
                  setExperiences((current) => [draft, ...current]);
                  setSelectedExperienceId(draft.id);
                }}
              >
                Crear primera experiencia
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "gallery" ? (
          <div className={styles.split}>
            <aside className={styles.panel}>
              <div className={styles.toolbar}>
                <strong>Galería</strong>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    const nextId = `gallery_${String(gallery.items.length + 1).padStart(2, "0")}`;
                    setGallery((current) => ({
                      ...current,
                      items: [
                        ...current.items,
                        {
                          id: nextId,
                          assetId: "",
                          visible: true,
                          sortOrder: current.items.length + 1,
                          localeContent: {
                            es: { alt: "", caption: "" },
                            en: { alt: "", caption: "" },
                          },
                        },
                      ],
                    }));
                    setSelectedGalleryId(nextId);
                  }}
                >
                  Agregar imagen
                </button>
              </div>
              <div className={styles.list}>
                {gallery.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === selectedGalleryId ? styles.listItemActive : styles.listItem}
                    onClick={() => setSelectedGalleryId(item.id)}
                  >
                    <span className={styles.listItemTitle}>{item.localeContent.es.caption || "Imagen sin título"}</span>
                    <span className={styles.listItemMeta}>Orden {item.sortOrder}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.editorCard}>
              <div className={styles.toolbar}>
                <strong>Editor de galería</strong>
                <button type="button" className={styles.primaryButton} onClick={saveGallery}>
                  Guardar y publicar
                </button>
              </div>

              {selectedGalleryItem ? (
                <>
                  <div className={styles.formGrid}>
                    <AssetField
                      label="Imagen"
                      slot="gallery"
                      previewUrl={assetPreviewUrl(selectedGalleryItem.assetId, "gallery")}
                      mediaMetadata={mediaMetadata}
                      onUploadSelected={(file, slot) =>
                        beginUpload(file, slot, (asset) => {
                          setGallery((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                              item.id === selectedGalleryItem.id ? { ...item, assetId: asset.id } : item,
                            ),
                          }));
                        })
                      }
                    />

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Orden</span>
                        <input
                          type="number"
                          value={selectedGalleryItem.sortOrder}
                          onChange={(event) =>
                            setGallery((current) => ({
                              ...current,
                              items: current.items.map((item) =>
                                item.id === selectedGalleryItem.id
                                  ? { ...item, sortOrder: Number(event.target.value) || 0 }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Visible</span>
                        <select
                          value={selectedGalleryItem.visible ? "yes" : "no"}
                          onChange={(event) =>
                            setGallery((current) => ({
                              ...current,
                              items: current.items.map((item) =>
                                item.id === selectedGalleryItem.id
                                  ? { ...item, visible: event.target.value === "yes" }
                                  : item,
                              ),
                            }))
                          }
                        >
                          <option value="yes">Visible</option>
                          <option value="no">Oculta</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className={styles.inlineActions}>
                    <button
                      type="button"
                      className={activeLocale === "es" ? styles.tabButtonActive : styles.tabButton}
                      onClick={() => setActiveLocale("es")}
                    >
                      ES
                    </button>
                    <button
                      type="button"
                      className={activeLocale === "en" ? styles.tabButtonActive : styles.tabButton}
                      onClick={() => setActiveLocale("en")}
                    >
                      EN
                    </button>
                  </div>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>Alt</span>
                      <input
                        value={selectedGalleryItem.localeContent[activeLocale].alt}
                        onChange={(event) =>
                          setGallery((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                              item.id === selectedGalleryItem.id
                                ? {
                                    ...item,
                                    localeContent: {
                                      ...item.localeContent,
                                      [activeLocale]: {
                                        ...item.localeContent[activeLocale],
                                        alt: event.target.value,
                                      },
                                    },
                                  }
                                : item,
                            ),
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Caption</span>
                      <input
                        value={selectedGalleryItem.localeContent[activeLocale].caption}
                        onChange={(event) =>
                          setGallery((current) => ({
                            ...current,
                            items: current.items.map((item) =>
                              item.id === selectedGalleryItem.id
                                ? {
                                    ...item,
                                    localeContent: {
                                      ...item.localeContent,
                                      [activeLocale]: {
                                        ...item.localeContent[activeLocale],
                                        caption: event.target.value,
                                      },
                                    },
                                  }
                                : item,
                            ),
                          }))
                        }
                      />
                    </label>
                  </div>
                </>
              ) : (
                <p className={styles.muted}>Selecciona una imagen de la galería.</p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "bungalows" && selectedBungalow ? (
          <div className={styles.split}>
            <aside className={styles.panel}>
              <div className={styles.toolbar}>
                <strong>Bungalows</strong>
              </div>
              <div className={styles.list}>
                {bungalows.map((item) => (
                  <button
                    key={item.bungalow.id}
                    type="button"
                    className={item.bungalow.id === selectedBungalowId ? styles.listItemActive : styles.listItem}
                    onClick={() => openBungalow(item.bungalow.id)}
                  >
                    <span className={styles.listItemTitle}>{item.publicContent.localeContent.es.displayName}</span>
                    <span className={styles.listItemMeta}>Hasta {item.bungalow.capacity} huéspedes</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.editorStack}>
              <form className={styles.editorCard} onSubmit={saveBungalow}>
                <div className={styles.toolbar}>
                  <strong>Ficha pública del bungalow</strong>
                  <button type="submit" className={styles.primaryButton}>
                    Guardar
                  </button>
                </div>

                <div className={styles.sectionStack}>
                  <section className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderLine}>
                      <strong>Contenido público</strong>
                      <span className={styles.tabMeta}>Edita copy, orden y visibilidad del tipo comercial.</span>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Orden</span>
                        <input
                          type="number"
                          value={selectedBungalow.publicContent.sortOrder}
                          onChange={(event) =>
                            updateSelectedBungalow((current) => ({
                              ...current,
                              sortOrder: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Tarifa PEN</span>
                        <input
                          type="number"
                          value={selectedBungalow.publicContent.nightlyRatePen}
                          onChange={(event) =>
                            updateSelectedBungalow((current) => ({
                              ...current,
                              nightlyRatePen: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Área m²</span>
                        <input
                          type="number"
                          value={selectedBungalow.publicContent.areaSqm}
                          onChange={(event) =>
                            updateSelectedBungalow((current) => ({
                              ...current,
                              areaSqm: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Visible en Home</span>
                        <select
                          value={selectedBungalow.publicContent.featuredOnHome ? "yes" : "no"}
                          onChange={(event) =>
                            updateSelectedBungalow((current) => ({
                              ...current,
                              featuredOnHome: event.target.value === "yes",
                            }))
                          }
                        >
                          <option value="yes">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    </div>

                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        className={activeLocale === "es" ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveLocale("es")}
                      >
                        ES
                      </button>
                      <button
                        type="button"
                        className={activeLocale === "en" ? styles.tabButtonActive : styles.tabButton}
                        onClick={() => setActiveLocale("en")}
                      >
                        EN
                      </button>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Nombre visible</span>
                        <input
                          value={selectedBungalowLocale?.displayName ?? ""}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Eyebrow</span>
                        <input
                          value={selectedBungalowLocale?.displayEyebrow ?? ""}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayEyebrow: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.fieldFull}>
                        <span>Descripción corta</span>
                        <textarea
                          value={selectedBungalowLocale?.displayDescription ?? ""}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayDescription: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.fieldFull}>
                        <span>Frase destacada</span>
                        <input
                          value={selectedBungalowLocale?.displayTagline ?? ""}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayTagline: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.fieldFull}>
                        <span>Descripción larga</span>
                        <textarea
                          value={selectedBungalowLocale?.displayLongDescription ?? ""}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayLongDescription: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Puntos destacados</span>
                        <textarea
                          value={linesToText(selectedBungalowLocale?.displayHighlights ?? [])}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayHighlights: textToLines(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Comodidades</span>
                        <textarea
                          value={linesToText(selectedBungalowLocale?.displayAmenities ?? [])}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayAmenities: textToLines(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className={styles.fieldFull}>
                        <span>Incluye</span>
                        <textarea
                          value={linesToText(selectedBungalowLocale?.displayIncluded ?? [])}
                          onChange={(event) =>
                            updateSelectedBungalowLocale(activeLocale, (current) => ({
                              ...current,
                              displayIncluded: textToLines(event.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>
                  </section>

                  <section className={styles.sectionBlock}>
                    <div className={styles.sectionHeaderLine}>
                      <strong>Media</strong>
                      <span className={styles.tabMeta}>Hero y galería pública del bungalow.</span>
                    </div>

                    <div className={styles.formGrid}>
                      <AssetField
                        label="Hero"
                        slot="hero"
                        previewUrl={
                          assetPreviewUrl(selectedBungalow.publicContent.heroAssetId, "hero") ||
                          selectedBungalow.publicContent.heroImageUrl
                        }
                        mediaMetadata={mediaMetadata}
                        onUploadSelected={(file, slot) =>
                          beginUpload(file, slot, (asset) => {
                            updateSelectedBungalow((current) => ({
                              ...current,
                              heroAssetId: asset.id,
                              heroImageUrl: assetPreviewUrl(asset.id, "hero"),
                            }));
                          })
                        }
                      />

                      <div className={styles.previewCard}>
                        <div className={styles.toolbar}>
                          <strong>Galería del bungalow</strong>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => bungalowGalleryUploadRef.current?.click()}
                          >
                            Agregar imagen
                          </button>
                        </div>
                        {selectedBungalow.publicContent.galleryAssetIds?.length ? (
                          <div className={styles.assetGrid}>
                            {selectedBungalow.publicContent.galleryAssetIds.map((assetId, index) => {
                              const previewUrl = assetPreviewUrl(assetId, "gallery");
                              const descriptor = resolveAdminMediaDescriptor(
                                previewUrl,
                                mediaMetadata,
                              );

                              return (
                                <div key={assetId} className={styles.previewCard}>
                                  {/* eslint-disable-next-line @next/next/no-img-element -- Preview administrativa de una variante runtime ya optimizada. */}
                                  <img
                                    className={styles.previewImage}
                                    src={descriptor.previewUrl}
                                    alt={`Galería ${index + 1}`}
                                  />
                                  <div className={styles.listItemMeta}>Imagen {index + 1}</div>
                                  <div className={styles.mediaFilename}>
                                    <MediaFilenamePreview
                                      originalFilename={descriptor.originalFilename}
                                      previewUrl={descriptor.previewUrl}
                                    />
                                  </div>
                                  <div className={styles.inlineActions}>
                                    <button
                                      type="button"
                                      className={styles.ghostButton}
                                      disabled={index === 0}
                                      onClick={() =>
                                        updateSelectedBungalow((current) => {
                                          const next = [...(current.galleryAssetIds ?? [])];
                                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                          return { ...current, galleryAssetIds: next };
                                        })
                                      }
                                    >
                                      Subir orden
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.ghostButton}
                                      disabled={index === (selectedBungalow.publicContent.galleryAssetIds?.length ?? 1) - 1}
                                      onClick={() =>
                                        updateSelectedBungalow((current) => {
                                          const next = [...(current.galleryAssetIds ?? [])];
                                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                          return { ...current, galleryAssetIds: next };
                                        })
                                      }
                                    >
                                      Bajar orden
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.ghostButton}
                                      onClick={() =>
                                        updateSelectedBungalow((current) => ({
                                          ...current,
                                          galleryAssetIds: (current.galleryAssetIds ?? []).filter(
                                            (currentAssetId) => currentAssetId !== assetId,
                                          ),
                                        }))
                                      }
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : selectedBungalow.publicContent.galleryUrls.length ? (
                          <div className={styles.assetGrid}>
                            {selectedBungalow.publicContent.galleryUrls.map((url, index) => {
                              const descriptor = resolveAdminMediaDescriptor(
                                url,
                                mediaMetadata,
                              );

                              return (
                                <div key={url} className={styles.previewCard}>
                                  {/* eslint-disable-next-line @next/next/no-img-element -- Compatibilidad visual con media legacy externa. */}
                                  <img
                                    className={styles.previewImage}
                                    src={descriptor.previewUrl}
                                    alt={`Galería legacy ${index + 1}`}
                                  />
                                  <div className={styles.listItemMeta}>Media legacy {index + 1}</div>
                                  <div className={styles.mediaFilename}>
                                    <MediaFilenamePreview
                                      originalFilename={descriptor.originalFilename}
                                      previewUrl={descriptor.previewUrl}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={styles.muted}>Aún no hay imágenes cargadas para la galería de este bungalow.</p>
                        )}
                        <input
                          ref={bungalowGalleryUploadRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          hidden
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) {
                              return;
                            }
                            beginUpload(file, "gallery", (asset) => {
                              updateSelectedBungalow((current) => ({
                                ...current,
                                galleryAssetIds: [...(current.galleryAssetIds ?? []), asset.id],
                              }));
                            });
                          }}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </form>

              <section className={styles.editorCard}>
                <div className={styles.toolbar}>
                  <div className={styles.sectionHeaderLine}>
                    <strong>Cupos de bungalows</strong>
                    <span className={styles.tabMeta}>Totales físicos y disponibilidad por categoría.</span>
                  </div>
                  <Link className={styles.secondaryButton} href={"/admin/bungalow-capacity" as Route}>
                    Abrir cupos
                  </Link>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </section>

      <CropDialog
        open={Boolean(uploadIntent)}
        file={uploadIntent?.file ?? null}
        slot={uploadIntent?.slot ?? "gallery"}
        onCancel={() => setUploadIntent(null)}
        onApply={async (crops) => {
          if (!uploadIntent || !uploadHandlerRef.current) return;
          try {
            const asset = await uploadWithCrops(uploadIntent.file, uploadIntent.slot, crops);
            applyContentHubMediaAsset(
              asset,
              handleMediaAssetCreated,
              uploadHandlerRef.current,
            );
            setFeedback({ kind: "success", message: "Imagen procesada y asociada." });
          } catch (error) {
            setFeedback({
              kind: "error",
              message: error instanceof Error ? describeContentHubError(error.message) : "No se pudo procesar la imagen.",
            });
          } finally {
            setUploadIntent(null);
          }
        }}
      />
    </div>
  );
}
