"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { CropDialog } from "@/app/admin/content/media/crop-dialog";
import { MediaFilenamePreview } from "@/app/admin/content/media/media-filename-preview";
import {
  resolveAdminMediaDescriptor,
  type AdminMediaMetadataMap,
} from "@/lib/content/media/admin-media-metadata";
import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import {
  homeContentSectionSchema,
  homeContentSlideSchema,
} from "@/lib/home-content/schema";
import {
  HOME_BODY_SIZES,
  HOME_BODY_WEIGHTS,
  HOME_HEADING_SIZES,
  HOME_HEADING_WEIGHTS,
  HOME_INTERNAL_ROUTE_KEYS,
  HOME_SIZE_ADJUST_MAX_PX,
  HOME_SIZE_ADJUST_MIN_PX,
  HOME_SIZE_ADJUST_STEP_PX,
  HOME_WEIGHT_VALUE_MAX,
  HOME_WEIGHT_VALUE_MIN,
  HOME_WEIGHT_VALUE_STEP,
  type CtaDestination,
  type HomeContentDocument,
  type HomeNavigationStyle,
  type HomeContentRevisionRecord,
  type HomeCta,
  type HomeSection,
  type HomeSlide,
  type HomeTextStyle,
} from "@/lib/home-content/types";

import styles from "./home-editor.module.css";
import {
  buildHomeMediaUploadFormData,
  resolveHomeMediaUrl,
  type HomeMediaCropPayload,
  type HomeMediaSlot,
} from "./home-media-upload";
import {
  countValidationIssuesForNode,
  mapHomeValidationIssues,
  validateHomeDocument,
  type HomeValidationIssueInput,
  type HomeValidationNode,
  type HomeValidationTarget,
} from "./home-validation";

type HomeEditorProps = {
  initialItem: HomeContentRevisionRecord;
  initialRevisions: HomeContentRevisionRecord[];
  mediaMetadata?: AdminMediaMetadataMap;
  onMediaAssetCreated?: (asset: ContentMediaAsset) => void;
};

type SelectedNode =
  | { kind: "slide"; id: string }
  | { kind: "section"; id: string };

type LocaleKey = "es" | "en";
type PreviewMode = "desktop" | "mobile";
type HomeUploadIntent = {
  file: File;
  fieldSlot: string;
  mediaSlot: HomeMediaSlot;
  onComplete: (mediaUrl: string) => void;
};

const LOCALE_LABELS: Record<LocaleKey, string> = {
  es: "Español",
  en: "English",
};

const HOME_SECTION_LABELS: Record<HomeSection["type"], string> = {
  "booking-band": "Reservas",
  stats: "Cifras",
  story: "Historia",
  bungalows: "Bungalows",
  "quote-band": "Frase destacada",
  experiences: "Experiencias",
  testimonials: "Testimonios",
  "closing-cta": "Cierre",
};

const DEFAULT_HEADING_WEIGHT = "semibold" as const;
const DEFAULT_BODY_WEIGHT = "medium" as const;
const DEFAULT_EYEBROW_SIZE = "regular" as const;
const DEFAULT_EYEBROW_WEIGHT = "medium" as const;
const DEFAULT_SUBTITLE_SIZE = "regular" as const;
const DEFAULT_SUBTITLE_WEIGHT = "medium" as const;
const DEFAULT_LABEL_SIZE = "small" as const;
const DEFAULT_LABEL_WEIGHT = "medium" as const;
const DEFAULT_CTA_SIZE = "regular" as const;
const DEFAULT_CTA_WEIGHT = "semibold" as const;
const DEFAULT_NAV_LINK_SIZE = "regular" as const;
const DEFAULT_NAV_LINK_WEIGHT = "regular" as const;
const DEFAULT_NAV_CTA_SIZE = "regular" as const;
const DEFAULT_NAV_CTA_WEIGHT = "semibold" as const;

function cloneDocument(document: HomeContentDocument): HomeContentDocument {
  return structuredClone(document);
}

function createDefaultSelection(document: HomeContentDocument): SelectedNode {
  return document.slider.slides[0]
    ? { kind: "slide", id: document.slider.slides[0].id }
    : { kind: "section", id: document.sections[0]?.id ?? "section-booking-band" };
}

function formatRevisionLabel(item: HomeContentRevisionRecord) {
  if (item.revisionVersion === 0) {
    return "Base inicial";
  }

  return `Versión ${item.revisionVersion}`;
}

function formatTimestamp(value: string) {
  if (!value || value.startsWith("1970-01-01")) {
    return "Sin publicación previa";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPublicationMeta(item: HomeContentRevisionRecord) {
  const actor = item.updatedByUserId ?? "Sistema";
  return `${formatTimestamp(item.updatedAt)} · ${actor}`;
}

function describeSaveError(message: string) {
  switch (message) {
    case "home_content_version_conflict":
      return "Otro cambio se publicó antes que tú. Recarga para evitar sobrescribir contenido.";
    case "invalid_home_content_payload":
      return "Hay un bloque con datos inválidos. Revisa CTA, tamaños de texto y campos obligatorios.";
    case "invalid_media_payload":
      return "Selecciona una imagen válida antes de subirla.";
    case "invalid_media_type":
      return "Solo se permiten imágenes JPG, PNG o WebP.";
    case "media_too_large":
      return "La imagen supera el tamaño máximo permitido.";
    case "media_dimensions_too_large":
      return "La imagen es demasiado grande para procesarla de forma segura.";
    case "media_crop_required":
      return "Completa todos los recortes obligatorios antes de aplicar la imagen.";
    case "media_crop_invalid":
      return "El recorte seleccionado no es válido. Ajusta la imagen e inténtalo otra vez.";
    case "media_crop_too_small":
      return "El recorte usa un área demasiado pequeña. Selecciona una zona más amplia.";
    case "media_processing_failed":
      return "No se pudo optimizar la imagen. Prueba con otro archivo JPG, PNG o WebP.";
    default:
      return message || "No se pudo publicar el home.";
  }
}

function defaultValueForDestinationKind(kind: CtaDestination["kind"]) {
  switch (kind) {
    case "internal":
      return "contact";
    case "phone":
      return "+51999999999";
    case "whatsapp":
      return "51999999999";
    case "external":
      return "https://wakayaecolodge.com";
  }
}

function parseOptionalDecimal(value: string) {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalInteger(value: string) {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createDestination(kind: CtaDestination["kind"], value?: string): CtaDestination {
  switch (kind) {
    case "internal":
      return {
        kind,
        value: (value as (typeof HOME_INTERNAL_ROUTE_KEYS)[number] | undefined) ?? "contact",
      };
    case "phone":
      return {
        kind,
        value: value ?? "+51999999999",
      };
    case "whatsapp":
      return {
        kind,
        value: value ?? "51999999999",
      };
    case "external":
      return {
        kind,
        value: value ?? "https://wakayaecolodge.com",
      };
  }
}

function updateDocumentState(
  current: HomeContentDocument,
  mutate: (draft: HomeContentDocument) => void,
): HomeContentDocument {
  const next = cloneDocument(current);
  mutate(next);
  return next;
}

function normalizeOrders<T extends { order: number }>(items: T[]) {
  items
    .sort((left, right) => left.order - right.order)
    .forEach((item, index) => {
      item.order = index + 1;
    });
}

function createDraftSlide(order: number): HomeSlide {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return {
    id: `slide-${suffix}`,
    visible: false,
    order,
    image: "",
    content: {
      es: { eyebrow: "Wakaya", title: "Nuevo slide", subtitle: "" },
      en: { eyebrow: "Wakaya", title: "New slide", subtitle: "" },
    },
    primaryCta: {
      id: `slide-${suffix}-primary`,
      label: { es: "Reservar", en: "Book" },
      destination: { kind: "internal", value: "contact" },
      style: "primary",
    },
    secondaryCta: null,
    style: { headingSize: "display", bodySize: "regular" },
  };
}

function isSlideComplete(slide: HomeSlide) {
  return homeContentSlideSchema.safeParse(slide).success;
}

function isSectionComplete(section: HomeSection) {
  return homeContentSectionSchema.safeParse(section).success;
}

function describeCompletionState(isComplete: boolean) {
  return isComplete ? "Completo" : "Pendiente";
}

function describeValidationCount(count: number) {
  return `Revisar · ${count} ${count === 1 ? "campo" : "campos"}`;
}

function validationIssueId(key: string) {
  return `home-validation-issue-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function isValidationIssueInput(value: unknown): value is HomeValidationIssueInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { path?: unknown; message?: unknown };
  return Array.isArray(candidate.path) && typeof candidate.message === "string";
}

function getPreviewTitle(document: HomeContentDocument, selected: SelectedNode) {
  if (selected.kind === "slide") {
    const slide = document.slider.slides.find((item) => item.id === selected.id);
    return slide?.content.es.title || slide?.content.en.title || "Slide";
  }

  const section = document.sections.find((item) => item.id === selected.id);
  if (!section) {
    return "Sección";
  }

  switch (section.type) {
    case "booking-band":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
    case "stats":
      return "Cifras clave";
    case "story":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
    case "bungalows":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
    case "quote-band":
      return section.content.quote.es || HOME_SECTION_LABELS[section.type];
    case "experiences":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
    case "testimonials":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
    case "closing-cta":
      return section.content.title.es || HOME_SECTION_LABELS[section.type];
  }
}

function getPreviewBody(document: HomeContentDocument, selected: SelectedNode, locale: LocaleKey) {
  if (selected.kind === "slide") {
    const slide = document.slider.slides.find((item) => item.id === selected.id);
    if (!slide) {
      return "No se encontró el slide seleccionado.";
    }
    return slide.content[locale].copy ?? slide.content[locale].subtitle ?? "Completa el texto principal de este slide.";
  }

  const section = document.sections.find((item) => item.id === selected.id);
  if (!section) {
    return "No se encontró la sección seleccionada.";
  }

  switch (section.type) {
    case "booking-band":
      return section.content.helper[locale];
    case "stats":
      return section.content.items.map((item) => `${item.value} · ${item.label[locale]}`).join(" · ");
    case "story":
      return section.content.paragraphs[locale][0] ?? "Agrega el primer párrafo de esta historia.";
    case "bungalows":
      return `${section.content.title[locale]} · ${section.content.visibleCount} bungalows visibles`;
    case "quote-band":
      return section.content.quote[locale];
    case "experiences":
      return `${section.content.visibleCount} experiencias visibles`;
    case "testimonials":
      return section.content.items[0]?.quote[locale] ?? "Agrega al menos un testimonio visible.";
    case "closing-cta":
      return section.content.title[locale];
  }
}

function getPreviewPrimaryCta(document: HomeContentDocument, selected: SelectedNode, locale: LocaleKey) {
  if (selected.kind === "slide") {
    return document.slider.slides.find((item) => item.id === selected.id)?.primaryCta.label[locale] ?? "CTA";
  }

  return document.sections.find((item) => item.id === selected.id)?.ctas[0]?.label[locale] ?? "Sin CTA";
}

function getPreviewOrder(document: HomeContentDocument) {
  return [
    "Slider",
    ...[...document.sections]
      .sort((left, right) => left.order - right.order)
      .map((section) => HOME_SECTION_LABELS[section.type]),
  ].join(" · ");
}

function CtaEditor({
  title,
  cta,
  activeLocale,
  onChange,
}: {
  title: string;
  cta: HomeCta;
  activeLocale: LocaleKey;
  onChange: (next: HomeCta) => void;
}) {
  return (
    <section className={styles.subCard}>
      <div className={styles.subCardHeader}>
        <h4>{title}</h4>
        <span className={styles.metaPill}>{cta.style}</span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Label</span>
          <input
            value={cta.label[activeLocale]}
            onChange={(event) =>
              onChange({
                ...cta,
                label: {
                  ...cta.label,
                  [activeLocale]: event.target.value,
                },
              })
            }
          />
        </label>

        <label className={styles.field}>
          <span>Destino</span>
          <select
            value={cta.destination.kind}
            onChange={(event) =>
              onChange({
                ...cta,
                destination: createDestination(
                  event.target.value as CtaDestination["kind"],
                  defaultValueForDestinationKind(event.target.value as CtaDestination["kind"]),
                ),
              })
            }
          >
            <option value="internal">Interno</option>
            <option value="phone">Teléfono</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="external">Externo</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Valor destino</span>
          {cta.destination.kind === "internal" ? (
            <select
              value={cta.destination.value}
              onChange={(event) =>
                onChange({
                  ...cta,
                  destination: {
                    kind: "internal",
                    value: event.target.value as (typeof HOME_INTERNAL_ROUTE_KEYS)[number],
                  },
                })
              }
            >
              {HOME_INTERNAL_ROUTE_KEYS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={cta.destination.value}
              onChange={(event) =>
                onChange({
                  ...cta,
                  destination: createDestination(cta.destination.kind, event.target.value),
                })
              }
            />
          )}
        </label>
      </div>
    </section>
  );
}

function TextStyleFields({
  style,
  onChange,
  includeSubtitle,
}: {
  style: HomeTextStyle;
  onChange: (patch: Partial<HomeTextStyle>) => void;
  includeSubtitle?: boolean;
}) {
  return (
    <details className={`${styles.advancedDetails} ${styles.fieldFull}`}>
      <summary>Opciones avanzadas</summary>
      <div className={styles.formGrid}>
      <label className={styles.field}>
        <span>Tamaño eyebrow</span>
        <select
          value={style.eyebrowSize ?? DEFAULT_EYEBROW_SIZE}
          onChange={(event) => onChange({ eyebrowSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
        >
          {HOME_BODY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Ajuste fino eyebrow (px)</span>
        <input
          type="number"
          min={HOME_SIZE_ADJUST_MIN_PX}
          max={HOME_SIZE_ADJUST_MAX_PX}
          step={HOME_SIZE_ADJUST_STEP_PX}
          placeholder="0"
          value={style.eyebrowSizeAdjustPx ?? ""}
          onChange={(event) => onChange({ eyebrowSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Peso eyebrow</span>
        <select
          value={style.eyebrowWeight ?? DEFAULT_EYEBROW_WEIGHT}
          onChange={(event) => onChange({ eyebrowWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
        >
          {HOME_BODY_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Peso exacto eyebrow</span>
        <input
          type="number"
          min={HOME_WEIGHT_VALUE_MIN}
          max={HOME_WEIGHT_VALUE_MAX}
          step={HOME_WEIGHT_VALUE_STEP}
          placeholder="Preset"
          value={style.eyebrowWeightValue ?? ""}
          onChange={(event) => onChange({ eyebrowWeightValue: parseOptionalInteger(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Tamaño heading</span>
        <select
          value={style.headingSize}
          onChange={(event) => onChange({ headingSize: event.target.value as (typeof HOME_HEADING_SIZES)[number] })}
        >
          {HOME_HEADING_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Ajuste fino heading (px)</span>
        <input
          type="number"
          min={HOME_SIZE_ADJUST_MIN_PX}
          max={HOME_SIZE_ADJUST_MAX_PX}
          step={HOME_SIZE_ADJUST_STEP_PX}
          placeholder="0"
          value={style.headingSizeAdjustPx ?? ""}
          onChange={(event) => onChange({ headingSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Peso heading</span>
        <select
          value={style.headingWeight ?? DEFAULT_HEADING_WEIGHT}
          onChange={(event) => onChange({ headingWeight: event.target.value as (typeof HOME_HEADING_WEIGHTS)[number] })}
        >
          {HOME_HEADING_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Peso exacto heading</span>
        <input
          type="number"
          min={HOME_WEIGHT_VALUE_MIN}
          max={HOME_WEIGHT_VALUE_MAX}
          step={HOME_WEIGHT_VALUE_STEP}
          placeholder="Preset"
          value={style.headingWeightValue ?? ""}
          onChange={(event) => onChange({ headingWeightValue: parseOptionalInteger(event.target.value) })}
        />
      </label>

      {includeSubtitle ? (
        <>
          <label className={styles.field}>
            <span>Tamaño subtítulo</span>
            <select
              value={style.subtitleSize ?? DEFAULT_SUBTITLE_SIZE}
              onChange={(event) => onChange({ subtitleSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
            >
              {HOME_BODY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Ajuste fino subtítulo (px)</span>
            <input
              type="number"
              min={HOME_SIZE_ADJUST_MIN_PX}
              max={HOME_SIZE_ADJUST_MAX_PX}
              step={HOME_SIZE_ADJUST_STEP_PX}
              placeholder="0"
              value={style.subtitleSizeAdjustPx ?? ""}
              onChange={(event) => onChange({ subtitleSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
            />
          </label>

          <label className={styles.field}>
            <span>Peso subtítulo</span>
            <select
              value={style.subtitleWeight ?? DEFAULT_SUBTITLE_WEIGHT}
              onChange={(event) => onChange({ subtitleWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
            >
              {HOME_BODY_WEIGHTS.map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Peso exacto subtítulo</span>
            <input
              type="number"
              min={HOME_WEIGHT_VALUE_MIN}
              max={HOME_WEIGHT_VALUE_MAX}
              step={HOME_WEIGHT_VALUE_STEP}
              placeholder="Preset"
              value={style.subtitleWeightValue ?? ""}
              onChange={(event) => onChange({ subtitleWeightValue: parseOptionalInteger(event.target.value) })}
            />
          </label>
        </>
      ) : null}

      <label className={styles.field}>
        <span>Tamaño body</span>
        <select
          value={style.bodySize}
          onChange={(event) => onChange({ bodySize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
        >
          {HOME_BODY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Ajuste fino body (px)</span>
        <input
          type="number"
          min={HOME_SIZE_ADJUST_MIN_PX}
          max={HOME_SIZE_ADJUST_MAX_PX}
          step={HOME_SIZE_ADJUST_STEP_PX}
          placeholder="0"
          value={style.bodySizeAdjustPx ?? ""}
          onChange={(event) => onChange({ bodySizeAdjustPx: parseOptionalDecimal(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Peso body</span>
        <select
          value={style.bodyWeight ?? DEFAULT_BODY_WEIGHT}
          onChange={(event) => onChange({ bodyWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
        >
          {HOME_BODY_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Peso exacto body</span>
        <input
          type="number"
          min={HOME_WEIGHT_VALUE_MIN}
          max={HOME_WEIGHT_VALUE_MAX}
          step={HOME_WEIGHT_VALUE_STEP}
          placeholder="Preset"
          value={style.bodyWeightValue ?? ""}
          onChange={(event) => onChange({ bodyWeightValue: parseOptionalInteger(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Tamaño labels</span>
        <select
          value={style.labelSize ?? DEFAULT_LABEL_SIZE}
          onChange={(event) => onChange({ labelSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
        >
          {HOME_BODY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Ajuste fino labels (px)</span>
        <input
          type="number"
          min={HOME_SIZE_ADJUST_MIN_PX}
          max={HOME_SIZE_ADJUST_MAX_PX}
          step={HOME_SIZE_ADJUST_STEP_PX}
          placeholder="0"
          value={style.labelSizeAdjustPx ?? ""}
          onChange={(event) => onChange({ labelSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Peso labels</span>
        <select
          value={style.labelWeight ?? DEFAULT_LABEL_WEIGHT}
          onChange={(event) => onChange({ labelWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
        >
          {HOME_BODY_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Peso exacto labels</span>
        <input
          type="number"
          min={HOME_WEIGHT_VALUE_MIN}
          max={HOME_WEIGHT_VALUE_MAX}
          step={HOME_WEIGHT_VALUE_STEP}
          placeholder="Preset"
          value={style.labelWeightValue ?? ""}
          onChange={(event) => onChange({ labelWeightValue: parseOptionalInteger(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Tamaño CTA</span>
        <select
          value={style.ctaSize ?? DEFAULT_CTA_SIZE}
          onChange={(event) => onChange({ ctaSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
        >
          {HOME_BODY_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Ajuste fino CTA (px)</span>
        <input
          type="number"
          min={HOME_SIZE_ADJUST_MIN_PX}
          max={HOME_SIZE_ADJUST_MAX_PX}
          step={HOME_SIZE_ADJUST_STEP_PX}
          placeholder="0"
          value={style.ctaSizeAdjustPx ?? ""}
          onChange={(event) => onChange({ ctaSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
        />
      </label>

      <label className={styles.field}>
        <span>Peso CTA</span>
        <select
          value={style.ctaWeight ?? DEFAULT_CTA_WEIGHT}
          onChange={(event) => onChange({ ctaWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
        >
          {HOME_BODY_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Peso exacto CTA</span>
        <input
          type="number"
          min={HOME_WEIGHT_VALUE_MIN}
          max={HOME_WEIGHT_VALUE_MAX}
          step={HOME_WEIGHT_VALUE_STEP}
          placeholder="Preset"
          value={style.ctaWeightValue ?? ""}
          onChange={(event) => onChange({ ctaWeightValue: parseOptionalInteger(event.target.value) })}
        />
      </label>
      </div>
    </details>
  );
}

function NavigationStyleFields({
  style,
  onChange,
}: {
  style: HomeNavigationStyle | undefined;
  onChange: (patch: Partial<HomeNavigationStyle>) => void;
}) {
  return (
    <section className={styles.subCard}>
      <div className={styles.subCardHeader}>
        <h3>Menú público</h3>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Tamaño links menú</span>
          <select
            value={style?.linkSize ?? DEFAULT_NAV_LINK_SIZE}
            onChange={(event) => onChange({ linkSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
          >
            {HOME_BODY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Ajuste fino links menú (px)</span>
          <input
            type="number"
            min={HOME_SIZE_ADJUST_MIN_PX}
            max={HOME_SIZE_ADJUST_MAX_PX}
            step={HOME_SIZE_ADJUST_STEP_PX}
            placeholder="0"
            value={style?.linkSizeAdjustPx ?? ""}
            onChange={(event) => onChange({ linkSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
          />
        </label>

        <label className={styles.field}>
          <span>Peso links menú</span>
          <select
            value={style?.linkWeight ?? DEFAULT_NAV_LINK_WEIGHT}
            onChange={(event) => onChange({ linkWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
          >
            {HOME_BODY_WEIGHTS.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Peso exacto links menú</span>
          <input
            type="number"
            min={HOME_WEIGHT_VALUE_MIN}
            max={HOME_WEIGHT_VALUE_MAX}
            step={HOME_WEIGHT_VALUE_STEP}
            placeholder="Preset"
            value={style?.linkWeightValue ?? ""}
            onChange={(event) => onChange({ linkWeightValue: parseOptionalInteger(event.target.value) })}
          />
        </label>

        <label className={styles.field}>
          <span>Tamaño CTA menú</span>
          <select
            value={style?.ctaSize ?? DEFAULT_NAV_CTA_SIZE}
            onChange={(event) => onChange({ ctaSize: event.target.value as (typeof HOME_BODY_SIZES)[number] })}
          >
            {HOME_BODY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Ajuste fino CTA menú (px)</span>
          <input
            type="number"
            min={HOME_SIZE_ADJUST_MIN_PX}
            max={HOME_SIZE_ADJUST_MAX_PX}
            step={HOME_SIZE_ADJUST_STEP_PX}
            placeholder="0"
            value={style?.ctaSizeAdjustPx ?? ""}
            onChange={(event) => onChange({ ctaSizeAdjustPx: parseOptionalDecimal(event.target.value) })}
          />
        </label>

        <label className={styles.field}>
          <span>Peso CTA menú</span>
          <select
            value={style?.ctaWeight ?? DEFAULT_NAV_CTA_WEIGHT}
            onChange={(event) => onChange({ ctaWeight: event.target.value as (typeof HOME_BODY_WEIGHTS)[number] })}
          >
            {HOME_BODY_WEIGHTS.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Peso exacto CTA menú</span>
          <input
            type="number"
            min={HOME_WEIGHT_VALUE_MIN}
            max={HOME_WEIGHT_VALUE_MAX}
            step={HOME_WEIGHT_VALUE_STEP}
            placeholder="Preset"
            value={style?.ctaWeightValue ?? ""}
            onChange={(event) => onChange({ ctaWeightValue: parseOptionalInteger(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

function LocaleColumns({
  activeLocale,
  onChange,
  children,
}: {
  activeLocale: LocaleKey;
  onChange: (locale: LocaleKey) => void;
  children: (locale: LocaleKey) => ReactNode;
}) {
  return (
    <div className={styles.localeWorkspace}>
      <div className={styles.localeTabs} role="tablist" aria-label="Idioma de edición">
        {(["es", "en"] as const).map((locale) => (
          <button
            key={locale}
            type="button"
            className={activeLocale === locale ? styles.localeTabActive : styles.localeTab}
            onClick={() => onChange(locale)}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
      <section className={styles.localeCard}>
        <div className={styles.subCardHeader}>
          <h4>{LOCALE_LABELS[activeLocale]}</h4>
        </div>
        <div className={styles.formGrid}>{children(activeLocale)}</div>
      </section>
    </div>
  );
}

function StructureRow({
  title,
  subtitle,
  status,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  subtitle: string;
  status: string;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <article className={styles.structureRow}>
      <button type="button" className={selected ? styles.nodeButtonActive : styles.nodeButton} onClick={onSelect}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
        <span>{status}</span>
      </button>
      <div className={styles.structureActions}>
        <button type="button" className={styles.secondaryButton} onClick={onMoveUp}>
          Subir
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onMoveDown}>
          Bajar
        </button>
      </div>
    </article>
  );
}

function ImageField({
  label,
  value,
  mediaMetadata,
  slot,
  isUploading,
  onSelect,
}: {
  label: string;
  value: string;
  mediaMetadata: AdminMediaMetadataMap;
  slot: string;
  isUploading: boolean;
  onSelect: (file: File, slot: string) => void;
}) {
  const mediaDescriptor = value
    ? resolveAdminMediaDescriptor(value, mediaMetadata)
    : null;

  return (
    <div className={`${styles.field} ${styles.fieldFull}`} data-validation-field={label}>
      <span>{label}</span>
      {mediaDescriptor ? (
        <MediaFilenamePreview
          originalFilename={mediaDescriptor.originalFilename}
          previewUrl={mediaDescriptor.previewUrl}
        />
      ) : (
        <span className={styles.metaPill}>Sin imagen asociada</span>
      )}
      <label className={styles.uploadButton}>
        <span>{isUploading ? "Subiendo..." : "Subir imagen"}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            onSelect(file, slot);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function SelectedPreview({
  document,
  selected,
  locale,
  mode,
}: {
  document: HomeContentDocument;
  selected: SelectedNode;
  locale: LocaleKey;
  mode: PreviewMode;
}) {
  const selectionTitle = getPreviewTitle(document, selected);
  const previewBody = getPreviewBody(document, selected, locale);
  const previewCta = getPreviewPrimaryCta(document, selected, locale);

  return (
    <div className={`${styles.previewFrame} ${mode === "mobile" ? styles.previewFrameMobile : styles.previewFrameDesktop}`}>
      <div className={styles.previewTop}>
        <span className={styles.previewLocale}>{LOCALE_LABELS[locale]}</span>
        <h4>{selectionTitle}</h4>
        <p>{previewBody}</p>
        <span className={styles.previewCallout}>{previewCta}</span>
      </div>
      <div className={styles.previewContent}>
        <div className={styles.previewBlock}>
          <strong>Bloque activo</strong>
          <span className={styles.previewEmpty}>
            {selected.kind === "slide" ? "Slide activo" : "Sección activa"} · {selectionTitle}
          </span>
        </div>
        <div className={styles.previewBlock}>
          <strong>Estructura publicada</strong>
          <span className={styles.previewEmpty}>{getPreviewOrder(document)}</span>
        </div>
      </div>
    </div>
  );
}

export function completeHomeMediaUpload(
  asset: ContentMediaAsset,
  mediaSlot: HomeMediaSlot,
  onMediaAssetCreated: ((asset: ContentMediaAsset) => void) | undefined,
  onComplete: (mediaUrl: string) => void,
) {
  const mediaUrl = resolveHomeMediaUrl(asset, mediaSlot);
  onMediaAssetCreated?.(asset);
  onComplete(mediaUrl);
}

export function HomeEditor({
  initialItem,
  initialRevisions,
  mediaMetadata = {},
  onMediaAssetCreated,
}: HomeEditorProps) {
  const [document, setDocument] = useState<HomeContentDocument>(() => cloneDocument(initialItem.document));
  const [publishedRecord, setPublishedRecord] = useState(initialItem);
  const [currentVersion, setCurrentVersion] = useState(initialItem.revisionVersion);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [selected, setSelected] = useState<SelectedNode>(() => createDefaultSelection(initialItem.document));
  const [activeLocale, setActiveLocale] = useState<LocaleKey>("es");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [editingSiteSettings, setEditingSiteSettings] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<"preview" | "history" | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [serverValidationResult, setServerValidationResult] = useState<{
    documentFingerprint: string;
    issues: HomeValidationTarget[];
  } | null>(null);
  const [pendingFocusTarget, setPendingFocusTarget] = useState<HomeValidationTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadIntent, setUploadIntent] = useState<HomeUploadIntent | null>(null);
  const [baseDocument, setBaseDocument] = useState(() => JSON.stringify(initialItem.document));

  const selectedSlide =
    selected.kind === "slide" ? document.slider.slides.find((item) => item.id === selected.id) ?? null : null;
  const selectedSection =
    selected.kind === "section" ? document.sections.find((item) => item.id === selected.id) ?? null : null;

  const isDirty = useMemo(() => JSON.stringify(document) !== baseDocument, [baseDocument, document]);
  const selectionTitle = getPreviewTitle(document, selected);

  const sortedSlides = useMemo(
    () => [...document.slider.slides].sort((left, right) => left.order - right.order),
    [document.slider.slides],
  );
  const sortedSections = useMemo(
    () => [...document.sections].sort((left, right) => left.order - right.order),
    [document.sections],
  );
  const clientValidationIssues = useMemo(
    () => (validationAttempted ? validateHomeDocument(document) : []),
    [document, validationAttempted],
  );
  const documentFingerprint = JSON.stringify(document);
  const serverValidationIssues =
    serverValidationResult?.documentFingerprint === documentFingerprint ? serverValidationResult.issues : [];
  const validationIssues = clientValidationIssues.length > 0 ? clientValidationIssues : serverValidationIssues;

  const selectedIsComplete =
    selected.kind === "slide"
      ? (selectedSlide ? isSlideComplete(selectedSlide) : false)
      : (selectedSection ? isSectionComplete(selectedSection) : false);

  useEffect(() => {
    const root = window.document.getElementById("home-editor-fields");
    if (!root) return;

    const clearActiveField = () => {
      root.querySelectorAll<HTMLElement>('[data-validation-active="true"]').forEach((element) => {
        element.removeAttribute("data-validation-active");
      });
      root.querySelectorAll<HTMLElement>('[data-home-validation-control="true"]').forEach((element) => {
        element.removeAttribute("data-home-validation-control");
        element.removeAttribute("aria-invalid");
        element.removeAttribute("aria-describedby");
      });
    };

    clearActiveField();
    if (!pendingFocusTarget) return;

    const currentTarget = validationIssues.find((issue) => issue.key === pendingFocusTarget.key);
    if (!currentTarget) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      let scope: ParentNode = root;

      if (currentTarget.groupLabel.startsWith("CTA")) {
        const ctaSection = Array.from(root.querySelectorAll("section")).find((section) => {
          const heading = section.querySelector(":scope > div h3, :scope > div h4");
          return heading?.textContent?.trim() === currentTarget.groupLabel;
        });
        if (ctaSection) scope = ctaSection;
      }

      if (currentTarget.groupLabel === "Opciones avanzadas") {
        const advanced = root.querySelector<HTMLDetailsElement>("details");
        if (advanced) {
          advanced.open = true;
          scope = advanced;
        }
      }

      const candidates = Array.from(scope.querySelectorAll<HTMLElement>("label, [data-validation-field]")).filter(
        (element) => {
          const directLabel = Array.from(element.children).find((child) => child.tagName === "SPAN");
          return (
            element.dataset.validationField === currentTarget.fieldLabel ||
            directLabel?.textContent?.trim() === currentTarget.fieldLabel
          );
        },
      );
      const field = candidates[currentTarget.focusOccurrence] ?? candidates[0];
      const control = field?.matches("input, select, textarea, button, a")
        ? field
        : field?.querySelector<HTMLElement>("input, select, textarea, button, a");

      if (!field || !control) return;

      field.setAttribute("data-validation-active", "true");
      control.setAttribute("data-home-validation-control", "true");
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", validationIssueId(currentTarget.key));
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      control.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeLocale, editingSiteSettings, pendingFocusTarget, selected, validationIssues]);

  function goToValidationTarget(target: HomeValidationTarget) {
    if (target.node.kind === "settings") {
      setEditingSiteSettings(true);
    } else {
      setSelected({ kind: target.node.kind, id: target.node.id });
      setEditingSiteSettings(false);
    }
    if (target.locale) setActiveLocale(target.locale);
    setPendingFocusTarget(target);
  }

  function nodeStatus(node: HomeValidationNode, isComplete: boolean) {
    const count = countValidationIssuesForNode(validationIssues, node);
    return count > 0 ? describeValidationCount(count) : describeCompletionState(isComplete);
  }

  function updateSlide(slideId: string, mutate: (slide: HomeSlide) => void) {
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        const slide = draft.slider.slides.find((item) => item.id === slideId);
        if (slide) {
          mutate(slide);
        }
      }),
    );
  }

  function moveSlide(slideId: string, direction: -1 | 1) {
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        const sorted = [...draft.slider.slides].sort((left, right) => left.order - right.order);
        const index = sorted.findIndex((item) => item.id === slideId);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
          return;
        }
        [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
        normalizeOrders(sorted);
      }),
    );
  }

  function addSlide() {
    if (document.slider.slides.length >= 8) {
      setFeedback({ kind: "error", message: "El slider admite un máximo de 8 imágenes." });
      return;
    }
    const slide = createDraftSlide(document.slider.slides.length + 1);
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        draft.slider.slides.push(slide);
        normalizeOrders(draft.slider.slides);
      }),
    );
    setSelected({ kind: "slide", id: slide.id });
    setEditingSiteSettings(false);
    setFeedback({ kind: "success", message: "Slide creado. Sube una imagen y publica los cambios." });
  }

  function deleteSlide(slideId: string) {
    if (document.slider.slides.length <= 1) {
      setFeedback({ kind: "error", message: "El home debe conservar al menos un slide." });
      return;
    }
    const remaining = document.slider.slides.filter((slide) => slide.id !== slideId);
    normalizeOrders(remaining);
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        draft.slider.slides = remaining;
      }),
    );
    setSelected({ kind: "slide", id: remaining[0].id });
    setFeedback({ kind: "success", message: "Slide eliminado del borrador. Publica para confirmar." });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        const sorted = [...draft.sections].sort((left, right) => left.order - right.order);
        const index = sorted.findIndex((item) => item.id === sectionId);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
          return;
        }
        [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
        normalizeOrders(sorted);
      }),
    );
  }

  function beginImageUpload(
    file: File,
    fieldSlot: string,
    mediaSlot: HomeMediaSlot,
    onComplete: (mediaUrl: string) => void,
  ) {
    setFeedback(null);
    setUploadIntent({ file, fieldSlot, mediaSlot, onComplete });
  }

  async function uploadImageWithCrops(
    intent: HomeUploadIntent,
    crops: HomeMediaCropPayload,
  ) {
    setUploadingSlot(intent.fieldSlot);
    setFeedback(null);

    try {
      const formData = buildHomeMediaUploadFormData(
        intent.file,
        intent.mediaSlot,
        crops,
      );

      const response = await fetch("/api/admin/content/media", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "media_upload_failed");
      }

      completeHomeMediaUpload(
        body.asset as ContentMediaAsset,
        intent.mediaSlot,
        onMediaAssetCreated,
        intent.onComplete,
      );
      setFeedback({
        kind: "success",
        message: "Imagen optimizada y lista para publicar en el home.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeSaveError(error instanceof Error ? error.message : "media_upload_failed"),
      });
    } finally {
      setUploadingSlot(null);
      setUploadIntent(null);
    }
  }

  function updateSection(sectionId: string, mutate: (section: HomeSection) => void) {
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        const section = draft.sections.find((item) => item.id === sectionId);
        if (section) {
          mutate(section);
        }
      }),
    );
  }

  function updateNavigationStyle(patch: Partial<HomeNavigationStyle>) {
    setDocument((current) =>
      updateDocumentState(current, (draft) => {
        draft.navigation ??= {};
        draft.navigation.style = {
          ...(draft.navigation.style ?? {}),
          ...patch,
        };
      }),
    );
  }

  async function publishChanges() {
    setFeedback(null);
    setServerValidationResult(null);

    const issues = validateHomeDocument(document);
    if (issues.length > 0) {
      setValidationAttempted(true);
      goToValidationTarget(issues[0]);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/home-content", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          expectedVersion: currentVersion,
          document,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        const serverIssues = Array.isArray(body.issues) ? body.issues.filter(isValidationIssueInput) : [];
        if (serverIssues.length > 0) {
          const mappedIssues = mapHomeValidationIssues(document, serverIssues);
          if (mappedIssues.length > 0) {
            setValidationAttempted(true);
            setServerValidationResult({ documentFingerprint, issues: mappedIssues });
            goToValidationTarget(mappedIssues[0]);
            return;
          }
        }
        throw new Error(body.error ?? "publish_failed");
      }

      setDocument(cloneDocument(body.item.document));
      setPublishedRecord(body.item);
      setCurrentVersion(body.item.revisionVersion);
      setRevisions(body.revisions);
      setBaseDocument(JSON.stringify(body.item.document));
      setValidationAttempted(false);
      setServerValidationResult(null);
      setPendingFocusTarget(null);
      setFeedback({
        kind: "success",
        message: `Home publicado como versión ${body.item.revisionVersion}.`,
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeSaveError(error instanceof Error ? error.message : "publish_failed"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function restoreRevision(version: number) {
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/home-content/revisions/${version}/restore`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          expectedVersion: currentVersion,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "restore_failed");
      }

      setDocument(cloneDocument(body.item.document));
      setPublishedRecord(body.item);
      setCurrentVersion(body.item.revisionVersion);
      setRevisions(body.revisions);
      setBaseDocument(JSON.stringify(body.item.document));
      setValidationAttempted(false);
      setServerValidationResult(null);
      setPendingFocusTarget(null);
      setFeedback({
        kind: "success",
        message: `Restaurado y republicado como versión ${body.item.revisionVersion}.`,
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeSaveError(error instanceof Error ? error.message : "restore_failed"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.publishBar}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Wakaya · home público</p>
          <h1>Editor del home</h1>
        </div>

        <div className={styles.publishSide}>
          <div className={styles.legend}>
            <span>
              <strong>Última publicación:</strong> {formatPublicationMeta(publishedRecord)}
            </span>
            <span>
              <strong>Estado:</strong> {nodeStatus(selected, selectedIsComplete)}
            </span>
          </div>

          <div className={styles.headerActions}>
            <a className={styles.secondaryButton} href="/es" target="_blank" rel="noreferrer">
              Ver home
            </a>
            <button
              className={styles.secondaryButton}
              type="button"
              aria-expanded={utilityPanel === "preview"}
              aria-controls="home-utility-panel"
              onClick={() => setUtilityPanel("preview")}
            >
              Vista previa
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              aria-expanded={utilityPanel === "history"}
              aria-controls="home-utility-panel"
              onClick={() => setUtilityPanel("history")}
            >
              Historial
            </button>
            <span className={styles.versionBadge}>{isDirty ? "Borrador local" : "Publicado"}</span>
            <span className={styles.versionBadge}>Versión activa {currentVersion}</span>
            <button className={styles.primaryButton} type="button" onClick={publishChanges} disabled={isSaving || !isDirty}>
              {isSaving ? "Publicando..." : "Publicar cambios"}
            </button>
          </div>
        </div>
      </section>

      <div id="home-validation-feedback" aria-live="polite">
        {validationIssues.length > 0 ? (
          <section className={`${styles.errorAlert} ${styles.validationAlert}`} role="alert">
            <strong>
              No se puede publicar. Corrige {validationIssues.length} {validationIssues.length === 1 ? "campo" : "campos"}.
            </strong>
            <ul className={styles.validationList}>
              {validationIssues.map((issue) => (
                <li className={styles.validationItem} id={validationIssueId(issue.key)} key={issue.key}>
                  <span className={styles.validationMessage}>
                    <strong>{issue.summaryLabel}</strong>
                    <span>{issue.message}</span>
                  </span>
                  <button
                    className={styles.validationButton}
                    type="button"
                    aria-label={`Ir al campo: ${issue.summaryLabel}`}
                    onClick={() => goToValidationTarget(issue)}
                  >
                    Ir al campo
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : feedback ? (
          <div className={feedback.kind === "success" ? styles.successAlert : styles.errorAlert}>{feedback.message}</div>
        ) : null}
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h2>Slider</h2>
              <span>{sortedSlides.length}</span>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={addSlide}>
              Agregar slide
            </button>
            <div className={styles.nodeList}>
              {sortedSlides.map((slide) => (
                <StructureRow
                  key={slide.id}
                  title={slide.content.es.title}
                  subtitle={`Orden ${slide.order} · ${slide.visible ? "Visible" : "Oculto"}`}
                  status={nodeStatus({ kind: "slide", id: slide.id }, isSlideComplete(slide))}
                  selected={selected.kind === "slide" && selected.id === slide.id}
                  onSelect={() => {
                    setSelected({ kind: "slide", id: slide.id });
                    setEditingSiteSettings(false);
                  }}
                  onMoveUp={() => moveSlide(slide.id, -1)}
                  onMoveDown={() => moveSlide(slide.id, 1)}
                />
              ))}
            </div>
          </section>

          <section className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h2>Secciones</h2>
              <span>{sortedSections.length}</span>
            </div>
            <div className={styles.nodeList}>
              {sortedSections.map((section) => (
                <StructureRow
                  key={section.id}
                  title={HOME_SECTION_LABELS[section.type]}
                  subtitle={`${getPreviewTitle(document, { kind: "section", id: section.id })} · ${section.visible ? "Visible" : "Oculta"}`}
                  status={nodeStatus({ kind: "section", id: section.id }, isSectionComplete(section))}
                  selected={selected.kind === "section" && selected.id === section.id}
                  onSelect={() => {
                    setSelected({ kind: "section", id: section.id });
                    setEditingSiteSettings(false);
                  }}
                  onMoveUp={() => moveSection(section.id, -1)}
                  onMoveDown={() => moveSection(section.id, 1)}
                />
              ))}
            </div>
          </section>

          <button
            type="button"
            className={editingSiteSettings ? styles.nodeButtonActive : styles.nodeButton}
            onClick={() => setEditingSiteSettings(true)}
          >
            <strong>Configuración web</strong>
            <span>Ajustes generales</span>
            {countValidationIssuesForNode(validationIssues, { kind: "settings", id: "navigation" }) > 0 ? (
              <span>
                {describeValidationCount(
                  countValidationIssuesForNode(validationIssues, { kind: "settings", id: "navigation" }),
                )}
              </span>
            ) : null}
          </button>
        </aside>

        <section className={styles.editor} id="home-editor-fields">
          <div className={styles.editorHeader}>
            <div>
              <p className={styles.editorKicker}>
                {editingSiteSettings ? "Sitio" : selected.kind === "slide" ? "Slider" : "Sección"}
              </p>
              <h2>{editingSiteSettings ? "Configuración web" : selectionTitle}</h2>
            </div>
            <span className={styles.metaPill}>
              {editingSiteSettings
                ? "Menú público"
                : `Estado · ${nodeStatus(selected, selectedIsComplete)}`}
            </span>
          </div>

          {editingSiteSettings ? (
            <NavigationStyleFields
              style={document.navigation?.style}
              onChange={(patch) => updateNavigationStyle(patch)}
            />
          ) : null}

          {!editingSiteSettings && selectedSlide ? (
            <div className={styles.editorBody}>
              <section className={styles.subCard}>
                <div className={styles.subCardHeader}>
                  <h3>Estructura</h3>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => deleteSlide(selectedSlide.id)}
                  >
                    Eliminar slide
                  </button>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.fieldCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedSlide.visible}
                      onChange={(event) => updateSlide(selectedSlide.id, (slide) => void (slide.visible = event.target.checked))}
                    />
                    <span>Visible en home</span>
                  </label>

                  <label className={styles.field}>
                    <span>Orden</span>
                    <input
                      type="number"
                      value={selectedSlide.order}
                      onChange={(event) =>
                        updateSlide(selectedSlide.id, (slide) => void (slide.order = Number.parseInt(event.target.value || "0", 10) || 1))
                      }
                    />
                  </label>

                  <TextStyleFields
                    style={selectedSlide.style}
                    includeSubtitle
                    onChange={(patch) =>
                      updateSlide(selectedSlide.id, (slide) => {
                        Object.assign(slide.style, patch);
                      })
                    }
                  />

                  <label className={styles.field}>
                    <span>Autoplay slider</span>
                    <select
                      value={String(document.slider.autoplayMs)}
                      onChange={(event) =>
                        setDocument((current) =>
                          updateDocumentState(current, (draft) => {
                            draft.slider.autoplayMs = Number.parseInt(event.target.value, 10);
                          }),
                        )
                      }
                    >
                      <option value="4000">4.0 s</option>
                      <option value="4800">4.8 s</option>
                      <option value="6000">6.0 s</option>
                      <option value="8000">8.0 s</option>
                      <option value="10000">10.0 s</option>
                    </select>
                  </label>

                  <ImageField
                    label="Imagen"
                    value={selectedSlide.image}
                    mediaMetadata={mediaMetadata}
                    slot={selectedSlide.id}
                    isUploading={uploadingSlot === selectedSlide.id}
                    onSelect={(file, slot) =>
                      beginImageUpload(file, slot, "hero", (mediaUrl) => {
                        updateSlide(selectedSlide.id, (slide) => void (slide.image = mediaUrl));
                      })
                    }
                  />
                </div>
              </section>

              <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                {(locale) => (
                  <>
                    <label className={styles.field}>
                      <span>Eyebrow</span>
                      <input
                        value={selectedSlide.content[locale].eyebrow}
                        onChange={(event) =>
                          updateSlide(selectedSlide.id, (slide) => void (slide.content[locale].eyebrow = event.target.value))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Título</span>
                      <input
                        value={selectedSlide.content[locale].title}
                        onChange={(event) =>
                          updateSlide(selectedSlide.id, (slide) => void (slide.content[locale].title = event.target.value))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Subtítulo</span>
                      <input
                        value={selectedSlide.content[locale].subtitle ?? ""}
                        onChange={(event) =>
                          updateSlide(selectedSlide.id, (slide) => void (slide.content[locale].subtitle = event.target.value))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Scroll label</span>
                      <input
                        value={selectedSlide.content[locale].scrollLabel ?? ""}
                        onChange={(event) =>
                          updateSlide(selectedSlide.id, (slide) => void (slide.content[locale].scrollLabel = event.target.value))
                        }
                      />
                    </label>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                      <span>Copy</span>
                      <textarea
                        rows={4}
                        value={selectedSlide.content[locale].copy ?? ""}
                        onChange={(event) =>
                          updateSlide(selectedSlide.id, (slide) => void (slide.content[locale].copy = event.target.value))
                        }
                      />
                    </label>
                  </>
                )}
              </LocaleColumns>

              <CtaEditor
                title="CTA principal"
                cta={selectedSlide.primaryCta}
                activeLocale={activeLocale}
                onChange={(next) => updateSlide(selectedSlide.id, (slide) => void (slide.primaryCta = next))}
              />

              {selectedSlide.secondaryCta ? (
                <CtaEditor
                  title="CTA secundario"
                  cta={selectedSlide.secondaryCta}
                  activeLocale={activeLocale}
                  onChange={(next) => updateSlide(selectedSlide.id, (slide) => void (slide.secondaryCta = next))}
                />
              ) : null}
            </div>
          ) : null}

          {!editingSiteSettings && selectedSection ? (
            <div className={styles.editorBody}>
              <section className={styles.subCard}>
                <div className={styles.subCardHeader}>
                  <h3>Estructura</h3>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.fieldCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedSection.visible}
                      onChange={(event) => updateSection(selectedSection.id, (section) => void (section.visible = event.target.checked))}
                    />
                    <span>Visible en home</span>
                  </label>

                  <label className={styles.field}>
                    <span>Orden</span>
                    <input
                      type="number"
                      value={selectedSection.order}
                      onChange={(event) =>
                        updateSection(selectedSection.id, (section) => void (section.order = Number.parseInt(event.target.value || "0", 10) || 1))
                      }
                    />
                  </label>

                  <TextStyleFields
                    style={selectedSection.style}
                    onChange={(patch) =>
                      updateSection(selectedSection.id, (section) => {
                        Object.assign(section.style, patch);
                      })
                    }
                  />
                </div>
              </section>

              {selectedSection.type === "booking-band" ? (
                <>
                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Helper</span>
                          <textarea
                            rows={4}
                            value={selectedSection.content.helper[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.helper[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label check-in</span>
                          <input
                            value={selectedSection.content.checkInLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.checkInLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label check-out</span>
                          <input
                            value={selectedSection.content.checkOutLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.checkOutLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label personas</span>
                          <input
                            value={selectedSection.content.guestsLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.guestsLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label bungalow</span>
                          <input
                            value={selectedSection.content.roomLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.roomLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label todas las categorías</span>
                          <input
                            value={selectedSection.content.allCategoriesLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.allCategoriesLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Opciones de huéspedes (una por línea)</span>
                          <textarea
                            rows={4}
                            value={selectedSection.content.guestOptions[locale].join("\n")}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") {
                                  section.content.guestOptions[locale] = event.target.value
                                    .split(/\r?\n/)
                                    .map((item) => item.trim())
                                    .filter(Boolean);
                                }
                              })
                            }
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Hint submit</span>
                          <textarea
                            rows={3}
                            value={selectedSection.content.submitHint[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "booking-band") section.content.submitHint[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <CtaEditor
                    title="CTA principal"
                    cta={selectedSection.ctas[0]}
                    activeLocale={activeLocale}
                    onChange={(next) =>
                      updateSection(selectedSection.id, (section) => {
                        if (section.type === "booking-band") section.ctas[0] = next;
                      })
                    }
                  />
                </>
              ) : null}

              {selectedSection.type === "stats" ? (
                <section className={styles.subCard}>
                  <div className={styles.subCardHeader}>
                    <h3>Cifras</h3>
                  </div>
                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <div className={`${styles.stack} ${styles.fieldFull}`}>
                        {selectedSection.content.items.map((item, index) => (
                          <div key={`${item.value}-${index}`} className={styles.inlineGrid}>
                            <label className={styles.field}>
                              <span>Valor</span>
                              <input
                                value={item.value}
                                onChange={(event) =>
                                  updateSection(selectedSection.id, (section) => {
                                    if (section.type === "stats") section.content.items[index].value = event.target.value;
                                  })
                                }
                              />
                            </label>
                            <label className={styles.field}>
                              <span>Label</span>
                              <input
                                value={item.label[locale]}
                                onChange={(event) =>
                                  updateSection(selectedSection.id, (section) => {
                                    if (section.type === "stats") section.content.items[index].label[locale] = event.target.value;
                                  })
                                }
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </LocaleColumns>
                </section>
              ) : null}

              {selectedSection.type === "story" ? (
                <>
                  <section className={styles.subCard}>
                    <div className={styles.subCardHeader}>
                      <h3>Media y cita</h3>
                    </div>
                    <div className={styles.formGrid}>
                      <ImageField
                        label="Imagen"
                        value={selectedSection.content.image}
                        mediaMetadata={mediaMetadata}
                        slot={selectedSection.id}
                        isUploading={uploadingSlot === selectedSection.id}
                        onSelect={(file, slot) =>
                          beginImageUpload(file, slot, "detail", (mediaUrl) => {
                            updateSection(selectedSection.id, (section) => {
                              if (section.type === "story") section.content.image = mediaUrl;
                            });
                          })
                        }
                      />
                    </div>
                  </section>

                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Eyebrow</span>
                          <input
                            value={selectedSection.content.eyebrow[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "story") section.content.eyebrow[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "story") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Párrafos (uno por línea)</span>
                          <textarea
                            rows={5}
                            value={selectedSection.content.paragraphs[locale].join("\n")}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "story") {
                                  section.content.paragraphs[locale] = event.target.value
                                    .split(/\r?\n/)
                                    .map((item) => item.trim())
                                    .filter(Boolean);
                                }
                              })
                            }
                          />
                        </label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Cita</span>
                          <textarea
                            rows={3}
                            value={selectedSection.content.quote[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "story") section.content.quote[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Fuente cita</span>
                          <input
                            value={selectedSection.content.quoteSource[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "story") section.content.quoteSource[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <CtaEditor
                    title="CTA historia"
                    cta={selectedSection.ctas[0]}
                    activeLocale={activeLocale}
                    onChange={(next) =>
                      updateSection(selectedSection.id, (section) => {
                        if (section.type === "story") section.ctas[0] = next;
                      })
                    }
                  />
                </>
              ) : null}

              {selectedSection.type === "bungalows" ? (
                <>
                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Eyebrow</span>
                          <input
                            value={selectedSection.content.eyebrow[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "bungalows") section.content.eyebrow[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "bungalows") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Label detalle</span>
                          <input
                            value={selectedSection.content.detailLabel[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "bungalows") section.content.detailLabel[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <section className={styles.subCard}>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Bungalows visibles</span>
                        <select
                          value={selectedSection.content.visibleCount}
                          onChange={(event) =>
                            updateSection(selectedSection.id, (section) => {
                              if (section.type === "bungalows") section.content.visibleCount = Number.parseInt(event.target.value, 10) as 2 | 3 | 4;
                            })
                          }
                        >
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </label>
                    </div>
                  </section>

                  <CtaEditor
                    title="CTA listado"
                    cta={selectedSection.ctas[0]}
                    activeLocale={activeLocale}
                    onChange={(next) =>
                      updateSection(selectedSection.id, (section) => {
                        if (section.type === "bungalows") section.ctas[0] = next;
                      })
                    }
                  />
                </>
              ) : null}

              {selectedSection.type === "quote-band" ? (
                <>
                  <section className={styles.subCard}>
                    <div className={styles.formGrid}>
                      <ImageField
                        label="Imagen"
                        value={selectedSection.content.image}
                        mediaMetadata={mediaMetadata}
                        slot={selectedSection.id}
                        isUploading={uploadingSlot === selectedSection.id}
                        onSelect={(file, slot) =>
                          beginImageUpload(file, slot, "detail", (mediaUrl) => {
                            updateSection(selectedSection.id, (section) => {
                              if (section.type === "quote-band") section.content.image = mediaUrl;
                            });
                          })
                        }
                      />
                    </div>
                  </section>

                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={`${styles.field} ${styles.fieldFull}`}>
                          <span>Cita</span>
                          <textarea
                            rows={3}
                            value={selectedSection.content.quote[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "quote-band") section.content.quote[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Fuente</span>
                          <input
                            value={selectedSection.content.source[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "quote-band") section.content.source[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>
                </>
              ) : null}

              {selectedSection.type === "experiences" ? (
                <>
                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Eyebrow</span>
                          <input
                            value={selectedSection.content.eyebrow[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "experiences") section.content.eyebrow[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "experiences") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Cards visibles</span>
                          <input
                            type="number"
                            min={2}
                            max={4}
                            value={selectedSection.content.visibleCount}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type !== "experiences") return;
                                const nextValue = Number.parseInt(event.target.value, 10);
                                section.content.visibleCount =
                                  nextValue <= 2 ? 2 : nextValue >= 4 ? 4 : 3;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <section className={styles.subCard}>
                    <div className={styles.subCardHeader}>
                      <h3>Fuente de experiencias</h3>
                      <span className={styles.metaPill}>{selectedSection.experienceIds.length} asociadas</span>
                    </div>
                    <Link
                      className={styles.secondaryButton}
                      href="/admin/content?tab=experiences"
                      data-validation-field="Experiencias visibles"
                    >
                      Gestionar experiencias
                    </Link>
                  </section>

                  <CtaEditor
                    title="CTA experiencias"
                    cta={selectedSection.ctas[0]}
                    activeLocale={activeLocale}
                    onChange={(next) =>
                      updateSection(selectedSection.id, (section) => {
                        if (section.type === "experiences") section.ctas[0] = next;
                      })
                    }
                  />
                </>
              ) : null}

              {selectedSection.type === "testimonials" ? (
                <>
                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Eyebrow</span>
                          <input
                            value={selectedSection.content.eyebrow[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "testimonials") section.content.eyebrow[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "testimonials") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <section className={styles.subCard}>
                    <div className={styles.subCardHeader}>
                      <h3>Testimonios</h3>
                    </div>
                    <div className={styles.stack}>
                      {selectedSection.content.items.map((item, index) => (
                        <div key={`${item.name}-${index}`} className={styles.inlineGrid}>
                          <label className={styles.field}>
                            <span>Nombre</span>
                            <input
                              value={item.name}
                              onChange={(event) =>
                                updateSection(selectedSection.id, (section) => {
                                  if (section.type === "testimonials") section.content.items[index].name = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label className={styles.field}>
                            <span>Origen</span>
                            <input
                              value={item.origin[activeLocale]}
                              onChange={(event) =>
                                updateSection(selectedSection.id, (section) => {
                                  if (section.type === "testimonials") section.content.items[index].origin[activeLocale] = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label className={`${styles.field} ${styles.fieldFull}`}>
                            <span>Testimonio</span>
                            <textarea
                              rows={3}
                              value={item.quote[activeLocale]}
                              onChange={(event) =>
                                updateSection(selectedSection.id, (section) => {
                                  if (section.type === "testimonials") section.content.items[index].quote[activeLocale] = event.target.value;
                                })
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}

              {selectedSection.type === "closing-cta" ? (
                <>
                  <section className={styles.subCard}>
                    <div className={styles.formGrid}>
                      <ImageField
                        label="Imagen"
                        value={selectedSection.content.image}
                        mediaMetadata={mediaMetadata}
                        slot={selectedSection.id}
                        isUploading={uploadingSlot === selectedSection.id}
                        onSelect={(file, slot) =>
                          beginImageUpload(file, slot, "detail", (mediaUrl) => {
                            updateSection(selectedSection.id, (section) => {
                              if (section.type === "closing-cta") section.content.image = mediaUrl;
                            });
                          })
                        }
                      />
                    </div>
                  </section>

                  <LocaleColumns activeLocale={activeLocale} onChange={setActiveLocale}>
                    {(locale) => (
                      <>
                        <label className={styles.field}>
                          <span>Eyebrow</span>
                          <input
                            value={selectedSection.content.eyebrow[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "closing-cta") section.content.eyebrow[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Título</span>
                          <input
                            value={selectedSection.content.title[locale]}
                            onChange={(event) =>
                              updateSection(selectedSection.id, (section) => {
                                if (section.type === "closing-cta") section.content.title[locale] = event.target.value;
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                  </LocaleColumns>

                  <CtaEditor
                    title="CTA cierre"
                    cta={selectedSection.ctas[0]}
                    activeLocale={activeLocale}
                    onChange={(next) =>
                      updateSection(selectedSection.id, (section) => {
                        if (section.type === "closing-cta") section.ctas[0] = next;
                      })
                    }
                  />
                </>
              ) : null}
            </div>
          ) : null}
        </section>

      </div>

      {utilityPanel ? (
        <div className={styles.utilityBackdrop} role="presentation" onMouseDown={() => setUtilityPanel(null)}>
          <section
            id="home-utility-panel"
            className={styles.utilityPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-utility-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.utilityHeader}>
              <div>
                <p className={styles.editorKicker}>Home</p>
                <h2 id="home-utility-title">{utilityPanel === "preview" ? "Vista previa" : "Historial"}</h2>
              </div>
              <button className={styles.secondaryButton} type="button" onClick={() => setUtilityPanel(null)}>
                Cerrar
              </button>
            </div>

            {utilityPanel === "preview" ? (
              <div className={styles.utilityBody}>
                <div className={styles.previewTabs}>
                  <button
                    type="button"
                    className={previewMode === "desktop" ? styles.localeTabActive : styles.localeTab}
                    onClick={() => setPreviewMode("desktop")}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    className={previewMode === "mobile" ? styles.localeTabActive : styles.localeTab}
                    onClick={() => setPreviewMode("mobile")}
                  >
                    Mobile
                  </button>
                </div>
                <SelectedPreview document={document} selected={selected} locale={activeLocale} mode={previewMode} />
              </div>
            ) : (
              <div className={styles.revisionList}>
                {revisions.length === 0 ? (
                  <p className={styles.previewEmpty}>Aún no hay publicaciones guardadas.</p>
                ) : (
                  revisions.map((revision) => (
                    <article key={revision.revisionVersion} className={styles.revisionCard}>
                      <div>
                        <strong>{formatRevisionLabel(revision)}</strong>
                        <p>{revision.updatedAt}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => restoreRevision(revision.revisionVersion)}
                        disabled={isSaving || revision.revisionVersion === currentVersion}
                      >
                        Restaurar
                      </button>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}

      <CropDialog
        open={Boolean(uploadIntent)}
        file={uploadIntent?.file ?? null}
        slot={uploadIntent?.mediaSlot ?? "detail"}
        onCancel={() => {
          if (!uploadingSlot) setUploadIntent(null);
        }}
        onApply={async (crops) => {
          if (!uploadIntent) return;
          await uploadImageWithCrops(uploadIntent, crops);
        }}
      />
    </main>
  );
}
