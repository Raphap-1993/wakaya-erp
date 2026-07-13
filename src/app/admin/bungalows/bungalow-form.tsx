"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";

import type { BungalowPublicContent } from "@/lib/reservations/types";

import styles from "../reservations/reservations.module.css";

type BungalowFormMode = "create" | "edit";

type BungalowFormProps = {
  mode: BungalowFormMode;
  actionHref: string;
  backHref: string;
  initialValues: {
    code: string;
    name: string;
    capacity: string;
    active: boolean;
  };
  initialPublicContent?: BungalowPublicContent | null;
  bungalowId?: string;
};

type EditableLocaleContent = {
  displayName: string;
  displayEyebrow: string;
  displayDescription: string;
  displayTagline: string;
  displayLongDescription: string;
  displayHighlightsText: string;
  displayAmenitiesText: string;
  displayIncludedText: string;
};

type EditablePublicContent = {
  featuredOnHome: boolean;
  sortOrder: string;
  heroImageUrl: string;
  galleryUrlsText: string;
  nightlyRatePen: string;
  areaSqm: string;
  localeContent: {
    es: EditableLocaleContent;
    en: EditableLocaleContent;
  };
};

const MODE_COPY = {
  create: {
    eyebrow: "Wakaya · inventario interno",
    title: "Nuevo bungalow",
    submitLabel: "Crear bungalow",
    helper:
      "Carga una unidad real en PostgreSQL para que el monitor y las reservas manuales operen con inventario persistido.",
  },
  edit: {
    eyebrow: "Wakaya · inventario interno",
    title: "Editar bungalow",
    submitLabel: "Guardar cambios",
    helper:
      "Actualiza el inventario operativo y la ficha pública del producto sin romper la fuente real que consume la web.",
  },
} as const;

function linesToText(items: string[]) {
  return items.join("\n");
}

function textToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEditablePublicContent(
  initialPublicContent: BungalowPublicContent | null | undefined,
): EditablePublicContent | null {
  if (!initialPublicContent) {
    return null;
  }

  return {
    featuredOnHome: initialPublicContent.featuredOnHome,
    sortOrder: String(initialPublicContent.sortOrder),
    heroImageUrl: initialPublicContent.heroImageUrl,
    galleryUrlsText: linesToText(initialPublicContent.galleryUrls),
    nightlyRatePen: String(initialPublicContent.nightlyRatePen),
    areaSqm: String(initialPublicContent.areaSqm),
    localeContent: {
      es: {
        displayName: initialPublicContent.localeContent.es.displayName,
        displayEyebrow: initialPublicContent.localeContent.es.displayEyebrow,
        displayDescription: initialPublicContent.localeContent.es.displayDescription,
        displayTagline: initialPublicContent.localeContent.es.displayTagline,
        displayLongDescription: initialPublicContent.localeContent.es.displayLongDescription,
        displayHighlightsText: linesToText(initialPublicContent.localeContent.es.displayHighlights),
        displayAmenitiesText: linesToText(initialPublicContent.localeContent.es.displayAmenities),
        displayIncludedText: linesToText(initialPublicContent.localeContent.es.displayIncluded),
      },
      en: {
        displayName: initialPublicContent.localeContent.en.displayName,
        displayEyebrow: initialPublicContent.localeContent.en.displayEyebrow,
        displayDescription: initialPublicContent.localeContent.en.displayDescription,
        displayTagline: initialPublicContent.localeContent.en.displayTagline,
        displayLongDescription: initialPublicContent.localeContent.en.displayLongDescription,
        displayHighlightsText: linesToText(initialPublicContent.localeContent.en.displayHighlights),
        displayAmenitiesText: linesToText(initialPublicContent.localeContent.en.displayAmenities),
        displayIncludedText: linesToText(initialPublicContent.localeContent.en.displayIncluded),
      },
    },
  };
}

function describeError(message: string) {
  switch (message) {
    case "bungalow_code_taken":
      return "Ya existe un bungalow con ese código interno.";
    case "invalid_bungalow_code":
      return "El código interno del bungalow es obligatorio.";
    case "invalid_bungalow_name":
      return "El nombre base del bungalow es obligatorio.";
    case "invalid_bungalow_capacity":
      return "La capacidad debe ser un entero positivo.";
    case "invalid_public_hero_image_url":
      return "La portada web es obligatoria.";
    case "invalid_public_nightly_rate":
      return "La tarifa referencial debe ser un entero positivo.";
    case "invalid_public_area_sqm":
      return "El área del bungalow debe ser un entero positivo.";
    case "invalid_media_payload":
      return "Debes seleccionar al menos una imagen válida.";
    case "invalid_media_type":
      return "Solo se permiten imágenes JPG, PNG o WebP.";
    case "media_too_large":
      return "La imagen supera el peso máximo permitido para subirla.";
    case "media_dimensions_too_large":
      return "La imagen supera las dimensiones máximas permitidas.";
    case "media_processing_failed":
      return "No se pudo optimizar la imagen. Intenta con otro archivo.";
    case "bungalow_not_found":
      return "No se encontró el bungalow.";
    default:
      return message || "No se pudo guardar el bungalow.";
  }
}

export function BungalowForm({
  mode,
  actionHref,
  backHref,
  initialValues,
  initialPublicContent,
  bungalowId,
}: BungalowFormProps) {
  const router = useRouter();
  const copy = MODE_COPY[mode];
  const formId = bungalowId ? `bungalow-form-${bungalowId}` : `bungalow-form-${mode}`;
  const heroUploadRef = useRef<HTMLInputElement | null>(null);
  const galleryUploadRef = useRef<HTMLInputElement | null>(null);

  const [code, setCode] = useState(initialValues.code);
  const [name, setName] = useState(initialValues.name);
  const [capacity, setCapacity] = useState(initialValues.capacity);
  const [active, setActive] = useState(initialValues.active);
  const [publicContent, setPublicContent] = useState<EditablePublicContent | null>(
    createEditablePublicContent(initialPublicContent),
  );
  const [activeLocale, setActiveLocale] = useState<"es" | "en">("es");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [submitScope, setSubmitScope] = useState<"all" | "operations">("all");

  const canSaveBase = useMemo(
    () => code.trim().length > 0 && name.trim().length > 0 && capacity.trim().length > 0,
    [capacity, code, name],
  );

  const canSaveAll = useMemo(() => {
    if (!canSaveBase || !publicContent) {
      return canSaveBase;
    }

    const locales = [publicContent.localeContent.es, publicContent.localeContent.en];
    return (
      publicContent.heroImageUrl.trim().length > 0 &&
      publicContent.nightlyRatePen.trim().length > 0 &&
      publicContent.areaSqm.trim().length > 0 &&
      locales.every((localeContent) =>
        [
          localeContent.displayName,
          localeContent.displayEyebrow,
          localeContent.displayDescription,
          localeContent.displayTagline,
          localeContent.displayLongDescription,
        ].every((value) => value.trim().length > 0),
      )
    );
  }, [canSaveBase, publicContent]);

  const activeLocaleContent = publicContent ? publicContent.localeContent[activeLocale] : null;
  const galleryUrls = publicContent ? textToLines(publicContent.galleryUrlsText) : [];
  const galleryCount = galleryUrls.length;
  const statusLabel = active ? "Activo para asignación" : "Inactivo";
  const visibilityLabel = publicContent
    ? publicContent.featuredOnHome
      ? "Visible en home"
      : "Solo ficha web"
    : "Sin ficha web";
  const hasEnglishCopy =
    publicContent &&
    [
      publicContent.localeContent.en.displayName,
      publicContent.localeContent.en.displayEyebrow,
      publicContent.localeContent.en.displayDescription,
      publicContent.localeContent.en.displayTagline,
      publicContent.localeContent.en.displayLongDescription,
    ].every((value) => value.trim().length > 0);

  const onActiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActive(event.target.checked);
  };

  const onPublicToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPublicContent((current) =>
      current
        ? {
            ...current,
            featuredOnHome: event.target.checked,
          }
        : current,
    );
  };

  const updateLocaleContent = (
    locale: "es" | "en",
    field: keyof EditableLocaleContent,
    value: string,
  ) => {
    setPublicContent((current) =>
      current
        ? {
            ...current,
            localeContent: {
              ...current.localeContent,
              [locale]: {
                ...current.localeContent[locale],
                [field]: value,
              },
            },
          }
        : current,
    );
  };

  const buildPublicContentPayload = () => {
    if (!publicContent) {
      return undefined;
    }

    return {
      featuredOnHome: publicContent.featuredOnHome,
      sortOrder: Number(publicContent.sortOrder),
      heroImageUrl: publicContent.heroImageUrl.trim(),
      galleryUrls: textToLines(publicContent.galleryUrlsText),
      nightlyRatePen: Number(publicContent.nightlyRatePen),
      areaSqm: Number(publicContent.areaSqm),
      localeContent: {
        es: {
          displayName: publicContent.localeContent.es.displayName.trim(),
          displayEyebrow: publicContent.localeContent.es.displayEyebrow.trim(),
          displayDescription: publicContent.localeContent.es.displayDescription.trim(),
          displayTagline: publicContent.localeContent.es.displayTagline.trim(),
          displayLongDescription: publicContent.localeContent.es.displayLongDescription.trim(),
          displayHighlights: textToLines(publicContent.localeContent.es.displayHighlightsText),
          displayAmenities: textToLines(publicContent.localeContent.es.displayAmenitiesText),
          displayIncluded: textToLines(publicContent.localeContent.es.displayIncludedText),
        },
        en: {
          displayName: publicContent.localeContent.en.displayName.trim(),
          displayEyebrow: publicContent.localeContent.en.displayEyebrow.trim(),
          displayDescription: publicContent.localeContent.en.displayDescription.trim(),
          displayTagline: publicContent.localeContent.en.displayTagline.trim(),
          displayLongDescription: publicContent.localeContent.en.displayLongDescription.trim(),
          displayHighlights: textToLines(publicContent.localeContent.en.displayHighlightsText),
          displayAmenities: textToLines(publicContent.localeContent.en.displayAmenitiesText),
          displayIncluded: textToLines(publicContent.localeContent.en.displayIncludedText),
        },
      },
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isOperationOnly = submitScope === "operations";

    if (isSubmitting || !(isOperationOnly ? canSaveBase : canSaveAll)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(actionHref, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          capacity: Number(capacity),
          active,
          publicContent: isOperationOnly ? undefined : buildPublicContentPayload(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? "unexpected_error");
      }

      setFeedback({
        kind: "success",
        message:
          mode === "create"
            ? "Bungalow creado correctamente."
            : isOperationOnly
              ? "Operación del bungalow actualizada correctamente."
              : "Bungalow actualizado correctamente.",
      });
      window.setTimeout(() => {
        router.replace("/admin/bungalows" as never);
      }, 400);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeError(error instanceof Error ? error.message : "unexpected_error"),
      });
    } finally {
      setIsSubmitting(false);
      setSubmitScope("all");
    }
  };

  const handleHeroUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !bungalowId || !publicContent) {
      return;
    }

    setIsUploadingHero(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch(`/api/bungalows/${bungalowId}/media/hero`, {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? "unexpected_error");
      }

      setPublicContent((current) =>
        current
          ? {
              ...current,
              heroImageUrl: String(body.publicContent?.heroImageUrl ?? body.media?.url ?? current.heroImageUrl),
            }
          : current,
      );
      setFeedback({
        kind: "success",
        message: "Portada web optimizada y reemplazada correctamente.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeError(error instanceof Error ? error.message : "unexpected_error"),
      });
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0 || !bungalowId || !publicContent) {
      return;
    }

    setIsUploadingGallery(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch(`/api/bungalows/${bungalowId}/media/gallery`, {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? "unexpected_error");
      }

      const nextGalleryUrls = Array.isArray(body.publicContent?.galleryUrls)
        ? body.publicContent.galleryUrls
        : galleryUrls;
      setPublicContent((current) =>
        current
          ? {
              ...current,
              galleryUrlsText: linesToText(nextGalleryUrls),
            }
          : current,
      );
      setFeedback({
        kind: "success",
        message: "Galería optimizada y actualizada correctamente.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: describeError(error instanceof Error ? error.message : "unexpected_error"),
      });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (targetUrl: string) => {
    setPublicContent((current) =>
      current
        ? {
            ...current,
            galleryUrlsText: linesToText(textToLines(current.galleryUrlsText).filter((item) => item !== targetUrl)),
          }
        : current,
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={`${styles.hero} ${styles.bungalowEditorBar}`}>
          <div className={styles.formHeroHeader}>
            <div className={styles.formHeroCopy}>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h1 className={styles.title}>{copy.title}</h1>
              <p className={styles.lead}>{copy.helper}</p>
              <div className={styles.heroBadgeRow}>
                <span className={styles.requestPill}>{statusLabel}</span>
                <span className={styles.requestPill}>{visibilityLabel}</span>
              </div>
            </div>

            <div className={styles.editorHeaderActions}>
              {publicContent ? (
                <div className={styles.surfacePills}>
                  <span className={`${styles.requestPill} ${styles.surfacePillActive}`}>Operación</span>
                  <span className={styles.requestPill}>Ficha web</span>
                  <span className={styles.requestPill}>Textos web</span>
                </div>
              ) : null}

              <div className={styles.heroActions}>
                <Link className={`${styles.button} ${styles.buttonSecondary}`} href={backHref as never}>
                  Cancelar
                </Link>
                <button
                  className={styles.button}
                  type="submit"
                  form={formId}
                  disabled={isSubmitting || !canSaveAll}
                  onClick={() => setSubmitScope("all")}
                >
                  {isSubmitting ? `${copy.submitLabel}...` : copy.submitLabel}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`${styles.detailGrid} ${styles.detailGridWide}`}>
            <form id={formId} className={styles.detailStack} onSubmit={handleSubmit}>
              {feedback ? (
                <p
                  className={`${styles.feedbackBanner} ${
                    feedback.kind === "success" ? styles.feedbackSuccess : styles.feedbackError
                  }`}
                >
                  {feedback.message}
                </p>
              ) : null}

              {publicContent ? (
                <article className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>Ficha web</p>
                      <h2 className={styles.cardTitle}>Imágenes</h2>
                      <p className={styles.cardCopy}>
                        La portada y la galería se editan como activos visuales. El modo manual de URLs queda como
                        fallback avanzado.
                      </p>
                    </div>
                  </div>

                  <div className={styles.mediaGrid}>
                    <div className={styles.stack}>
                      <div className={styles.mediaHeroCard}>
                        {publicContent.heroImageUrl.trim().length > 0 ? (
                          <img
                            className={styles.mediaHeroImage}
                            src={publicContent.heroImageUrl}
                            alt={`Portada web de ${name || "bungalow"}`}
                          />
                        ) : (
                          <div className={styles.mediaHeroEmpty}>Sin portada cargada</div>
                        )}

                        <div className={styles.mediaHeroOverlay}>
                          <span className={styles.mediaMeta}>Portada web · WebP optimizado</span>
                          <strong className={styles.mediaTitle}>Vista principal de la ficha pública</strong>
                          <div className={styles.heroActions}>
                            <button
                              className={styles.button}
                              type="button"
                              onClick={() => heroUploadRef.current?.click()}
                              disabled={isUploadingHero}
                            >
                              {isUploadingHero ? "Optimizando portada..." : "Reemplazar portada"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <input
                        ref={heroUploadRef}
                        className={styles.hiddenInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleHeroUpload}
                      />

                      <details className={styles.advancedPanel}>
                        <summary className={styles.advancedSummary}>Modo avanzado: editar URLs manualmente</summary>
                        <div className={styles.stack}>
                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>Portada web</span>
                            <input
                              className={styles.input}
                              name="heroImageUrl"
                              value={publicContent.heroImageUrl}
                              onChange={(event) =>
                                setPublicContent((current) =>
                                  current ? { ...current, heroImageUrl: event.target.value } : current,
                                )
                              }
                              required
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>URLs de galería (una por línea)</span>
                            <textarea
                              className={`${styles.textarea} ${styles.textareaTall}`}
                              name="galleryUrls"
                              value={publicContent.galleryUrlsText}
                              onChange={(event) =>
                                setPublicContent((current) =>
                                  current ? { ...current, galleryUrlsText: event.target.value } : current,
                                )
                              }
                            />
                          </label>
                        </div>
                      </details>
                    </div>

                    <div className={styles.stack}>
                      <div className={styles.mediaThumbGrid}>
                        {galleryUrls.map((url, index) => (
                          <article key={url} className={styles.mediaThumbCard}>
                            <img className={styles.mediaThumbImage} src={url} alt={`Galería ${index + 1} de ${name || "bungalow"}`} />
                            <div className={styles.mediaThumbOverlay}>
                              <span className={styles.mediaMeta}>{String(index + 1).padStart(2, "0")} · Galería</span>
                              <div className={styles.mediaThumbActions}>
                                <button
                                  className={`${styles.button} ${styles.buttonSecondary}`}
                                  type="button"
                                  onClick={() => removeGalleryImage(url)}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>

                      <input
                        ref={galleryUploadRef}
                        className={styles.hiddenInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleGalleryUpload}
                      />

                      <div className={styles.heroActions}>
                        <button
                          className={styles.button}
                          type="button"
                          onClick={() => galleryUploadRef.current?.click()}
                          disabled={isUploadingGallery}
                        >
                          {isUploadingGallery ? "Optimizando galería..." : "Agregar imagen"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}

              <article className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.eyebrow}>Operación</p>
                    <h2 className={styles.cardTitle}>Inventario y operación</h2>
                    <p className={styles.cardCopy}>
                      Los cambios operativos quedan separados del trabajo editorial para el uso diario del backoffice.
                    </p>
                  </div>
                  {mode === "edit" ? (
                    <button
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      type="submit"
                      disabled={isSubmitting || !canSaveBase}
                      onClick={() => setSubmitScope("operations")}
                    >
                      Guardar operación
                    </button>
                  ) : null}
                </div>

                <div className={`${styles.fieldGrid} ${styles.fieldGridThirds}`}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Código interno</span>
                    <input
                      className={styles.input}
                      name="code"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      required
                    />
                  </label>

                  <label className={`${styles.field} ${styles.fieldSpanTwo}`}>
                    <span className={styles.fieldLabel}>Nombre base del bungalow</span>
                    <input
                      className={styles.input}
                      name="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Capacidad</span>
                    <input
                      className={styles.input}
                      name="capacity"
                      type="number"
                      min="1"
                      step="1"
                      value={capacity}
                      onChange={(event) => setCapacity(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label className={styles.toggleField}>
                  <input type="checkbox" checked={active} onChange={onActiveChange} />
                  <span>Bungalow activo para asignación y ocupación</span>
                </label>
              </article>

              {publicContent ? (
                <>
                  <article className={styles.sectionCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <p className={styles.eyebrow}>Ficha web</p>
                        <h2 className={styles.cardTitle}>Publicación web</h2>
                        <p className={styles.cardCopy}>
                          Ajusta visibilidad, orden y datos comerciales sin mezclar esta tarea con el copy editorial.
                        </p>
                      </div>
                    </div>

                    <div className={`${styles.fieldGrid} ${styles.fieldGridThirds}`}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Tarifa referencial (PEN)</span>
                        <input
                          className={styles.input}
                          name="nightlyRatePen"
                          type="number"
                          min="1"
                          step="1"
                          value={publicContent.nightlyRatePen}
                          onChange={(event) =>
                            setPublicContent((current) =>
                              current ? { ...current, nightlyRatePen: event.target.value } : current,
                            )
                          }
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Área (m2)</span>
                        <input
                          className={styles.input}
                          name="areaSqm"
                          type="number"
                          min="1"
                          step="1"
                          value={publicContent.areaSqm}
                          onChange={(event) =>
                            setPublicContent((current) =>
                              current ? { ...current, areaSqm: event.target.value } : current,
                            )
                          }
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Orden en listado web</span>
                        <input
                          className={styles.input}
                          name="sortOrder"
                          type="number"
                          min="0"
                          step="1"
                          value={publicContent.sortOrder}
                          onChange={(event) =>
                            setPublicContent((current) =>
                              current ? { ...current, sortOrder: event.target.value } : current,
                            )
                          }
                          required
                        />
                      </label>
                    </div>

                    <label className={styles.toggleField}>
                      <input type="checkbox" checked={publicContent.featuredOnHome} onChange={onPublicToggleChange} />
                      <span>Visible en home</span>
                    </label>
                  </article>

                  <article className={styles.sectionCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <p className={styles.eyebrow}>Textos web</p>
                        <h2 className={styles.cardTitle}>Contenido por idioma</h2>
                        <p className={styles.cardCopy}>
                          El copy ES/EN ya no compite con operación ni media. Cada idioma mantiene su propio foco.
                        </p>
                      </div>

                      <div className={styles.localeToggle} role="tablist" aria-label="Idiomas de la ficha pública">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeLocale === "es"}
                          className={`${styles.localeToggleButton} ${
                            activeLocale === "es" ? styles.localeToggleButtonActive : ""
                          }`}
                          onClick={() => setActiveLocale("es")}
                        >
                          Contenido ES
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeLocale === "en"}
                          className={`${styles.localeToggleButton} ${
                            activeLocale === "en" ? styles.localeToggleButtonActive : ""
                          }`}
                          onClick={() => setActiveLocale("en")}
                        >
                          {hasEnglishCopy ? "Contenido EN" : "Contenido EN · incompleto"}
                        </button>
                      </div>
                    </div>

                    {activeLocaleContent ? (
                      <div className={styles.stack}>
                        <p className={styles.formHelper}>
                          {activeLocale === "es"
                            ? "Este bloque afecta la versión en español visible en la web."
                            : "This block affects the English version shown on the website."}
                        </p>

                        <div className={styles.fieldGrid}>
                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Nombre comercial</span>
                            <input
                              className={styles.input}
                              value={activeLocaleContent.displayName}
                              onChange={(event) => updateLocaleContent(activeLocale, "displayName", event.target.value)}
                              required
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Antetítulo</span>
                            <input
                              className={styles.input}
                              value={activeLocaleContent.displayEyebrow}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayEyebrow", event.target.value)
                              }
                              required
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>Descripción corta</span>
                            <textarea
                              className={styles.textarea}
                              value={activeLocaleContent.displayDescription}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayDescription", event.target.value)
                              }
                              required
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>Frase destacada</span>
                            <input
                              className={styles.input}
                              value={activeLocaleContent.displayTagline}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayTagline", event.target.value)
                              }
                              required
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>Descripción larga</span>
                            <textarea
                              className={`${styles.textarea} ${styles.textareaTall}`}
                              value={activeLocaleContent.displayLongDescription}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayLongDescription", event.target.value)
                              }
                              required
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Puntos destacados (uno por línea)</span>
                            <textarea
                              className={styles.textarea}
                              value={activeLocaleContent.displayHighlightsText}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayHighlightsText", event.target.value)
                              }
                            />
                          </label>

                          <label className={styles.field}>
                            <span className={styles.fieldLabel}>Comodidades (una por línea)</span>
                            <textarea
                              className={styles.textarea}
                              value={activeLocaleContent.displayAmenitiesText}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayAmenitiesText", event.target.value)
                              }
                            />
                          </label>

                          <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                            <span className={styles.fieldLabel}>Incluye (uno por línea)</span>
                            <textarea
                              className={styles.textarea}
                              value={activeLocaleContent.displayIncludedText}
                              onChange={(event) =>
                                updateLocaleContent(activeLocale, "displayIncludedText", event.target.value)
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </article>
                </>
              ) : null}
            </form>

            <aside className={styles.detailStack}>
              <article className={`${styles.sectionCard} ${styles.stickySideCard}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.eyebrow}>Resumen</p>
                    <h2 className={styles.cardTitle}>Estado rápido</h2>
                    <p className={styles.cardCopy}>Contexto corto para editar sin perder el hilo operativo.</p>
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Estado</span>
                    <span className={styles.statValue}>{statusLabel}</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Capacidad</span>
                    <span className={styles.statValue}>{capacity || "0"}</span>
                  </div>
                  {publicContent ? (
                    <>
                      <div className={styles.statCard}>
                        <span className={styles.statLabel}>Tarifa</span>
                        <span className={styles.statValue}>PEN {publicContent.nightlyRatePen || "0"}</span>
                      </div>
                      <div className={styles.statCard}>
                        <span className={styles.statLabel}>Galería</span>
                        <span className={styles.statValue}>{galleryCount}</span>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className={styles.kvGrid}>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Ruta técnica</span>
                    <span className={styles.kvValue}>{bungalowId ?? "Se genera al crear"}</span>
                  </div>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Nombre web</span>
                    <span className={styles.kvValue}>{name || "Pendiente"}</span>
                  </div>
                  {publicContent ? (
                    <>
                      <div className={styles.kv}>
                        <span className={styles.kvLabel}>Visibilidad</span>
                        <span className={styles.kvValue}>{visibilityLabel}</span>
                      </div>
                      <div className={styles.kv}>
                        <span className={styles.kvLabel}>Idioma EN</span>
                        <span className={styles.kvValue}>{hasEnglishCopy ? "Completo" : "Incompleto"}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </article>

              {publicContent ? (
                <article className={styles.sectionCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>Optimización</p>
                      <h2 className={styles.cardTitle}>Reglas de media</h2>
                    </div>
                  </div>

                  <div className={styles.formNoteList}>
                    <div className={styles.formNoteItem}>
                      JPGs pesados se optimizan server-side y se guardan como WebP para acelerar la web pública.
                    </div>
                  </div>
                </article>
              ) : null}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
