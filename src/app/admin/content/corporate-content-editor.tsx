"use client";

import { useState } from "react";

import {
  PublicSiteSettingsEditor,
  type PublicSiteEditorSection,
} from "@/app/admin/content/public-site-settings-editor";
import { CropDialog } from "@/app/admin/content/media/crop-dialog";
import { MediaFilenamePreview } from "@/app/admin/content/media/media-filename-preview";
import { describeAdminApiError, type AdminApiErrorPayload } from "@/app/admin/content/admin-api-errors";
import {
  resolveAdminMediaDescriptor,
  type AdminMediaMetadataMap,
} from "@/lib/content/media/admin-media-metadata";
import type { ContentMediaAsset } from "@/lib/content/media/content-media-service";
import type { PublicCompanyContent } from "@/components/public-site/public-company-content";
import type {
  CorporateContentDocument,
  CorporateContentRevisionRecord,
  CorporateContentRevisionSummary,
  ResolvedCorporateContentDocument,
} from "@/lib/corporate-content/types";
import { CORPORATE_REQUIRED_TERM_SECTION_IDS } from "@/lib/corporate-content/types";
import type { PublicSiteMediaSlot } from "@/lib/corporate-content/types";
import { resolvePublicSiteMedia } from "@/lib/corporate-content/public-site-media";

import styles from "./content-hub.module.css";

type Locale = "es" | "en";
type EditorSection =
  | "about"
  | "faq"
  | "testimonials"
  | "terms"
  | "privacy"
  | "contact"
  | PublicSiteEditorSection;

const SECTIONS: Array<{ key: EditorSection; label: string }> = [
  { key: "about", label: "Nosotros" },
  { key: "faq", label: "Preguntas frecuentes" },
  { key: "testimonials", label: "Testimonios" },
  { key: "terms", label: "Términos y estadía" },
  { key: "privacy", label: "Privacidad" },
  { key: "contact", label: "Contacto y horarios" },
  { key: "navigation", label: "Navegación y footer" },
  { key: "bungalows-page", label: "Página Bungalows" },
  { key: "bungalow-detail", label: "Detalle de Bungalow" },
  { key: "services-page", label: "Página Experiencias" },
  { key: "gallery-page", label: "Página Galería" },
  { key: "events-page", label: "Página Eventos" },
  { key: "publications-page", label: "Página Publicaciones" },
  { key: "contact-page", label: "Página Contacto" },
  { key: "pet-friendly-page", label: "Página Pet Friendly" },
  { key: "complaints-page", label: "Libro de Reclamaciones" },
];

function linesToText(items: string[]) {
  return items.join("\n");
}

function textToLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  full = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  full?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={full ? styles.fieldFull : styles.field}>
      <span>{label}</span>
      {multiline ? (
        <textarea disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function revisionLabel(revision: CorporateContentRevisionSummary | CorporateContentRevisionRecord) {
  return `Versión ${revision.revisionVersion}`;
}

function isRequiredPolicyAnchor(kind: "terms" | "privacy", id: string) {
  return kind === "terms" && CORPORATE_REQUIRED_TERM_SECTION_IDS.includes(
    id as (typeof CORPORATE_REQUIRED_TERM_SECTION_IDS)[number],
  );
}

export function CorporateContentEditor({
  initialItem,
  initialRevisions,
  mediaMetadata = {},
  onMediaAssetCreated,
}: {
  initialItem: CorporateContentRevisionRecord;
  initialRevisions: CorporateContentRevisionSummary[];
  mediaMetadata?: AdminMediaMetadataMap;
  onMediaAssetCreated?: (asset: ContentMediaAsset) => void;
}) {
  const [item, setItem] = useState(initialItem);
  const [draft, setDraft] = useState<ResolvedCorporateContentDocument>(() =>
    structuredClone(initialItem.document),
  );
  const [revisions, setRevisions] = useState(initialRevisions);
  const [locale, setLocale] = useState<Locale>("es");
  const [section, setSection] = useState<EditorSection>("about");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadIntent, setUploadIntent] = useState<{ file: File; mediaSlot: PublicSiteMediaSlot } | null>(null);

  const content = draft.locales[locale];

  function updatePage<K extends keyof PublicCompanyContent>(
    key: K,
    value: PublicCompanyContent[K],
  ) {
    setDraft((current) => ({
      ...current,
      locales: {
        ...current.locales,
        [locale]: { ...current.locales[locale], [key]: value },
      },
    }));
  }

  function updateContact(next: CorporateContentDocument["contact"]) {
    setDraft((current) => ({ ...current, contact: next }));
  }

  function updateMedia(mediaSlot: PublicSiteMediaSlot, assetId: string | null) {
    setDraft((current) => ({
      ...current,
      publicSite: {
        ...current.publicSite,
        media: {
          ...current.publicSite.media,
          [mediaSlot]: assetId
            ? { kind: "asset" as const, assetId }
            : { kind: "none" as const },
        },
      },
    }));
  }

  function renderPageMedia(mediaSlot: PublicSiteMediaSlot, label = "Imagen principal") {
    const reference = draft.publicSite.media[mediaSlot];
    const previewUrl = resolvePublicSiteMedia(reference);
    const descriptor = previewUrl
      ? resolveAdminMediaDescriptor(previewUrl, mediaMetadata)
      : null;

    return (
      <div className={styles.previewCard}>
        <div className={styles.toolbar}>
          <strong>{label}</strong>
          <div className={styles.inlineActions}>
            <label className={styles.secondaryButton} htmlFor={`corporate-media-${mediaSlot}`}>
              {previewUrl ? "Reemplazar" : "Subir imagen"}
            </label>
            {previewUrl ? <button type="button" className={styles.ghostButton} onClick={() => updateMedia(mediaSlot, null)}>Quitar imagen</button> : null}
          </div>
        </div>
        {descriptor ? <img className={styles.previewImage} src={descriptor.previewUrl} alt={label} /> : <span className={styles.muted}>Sin imagen asociada</span>}
        {descriptor ? <MediaFilenamePreview originalFilename={descriptor.originalFilename} previewUrl={descriptor.previewUrl} /> : null}
        <input
          id={`corporate-media-${mediaSlot}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) setUploadIntent({ file, mediaSlot });
          }}
        />
      </div>
    );
  }

  async function publish() {
    setSaving(true);
    setFeedback(null);
    setVersionConflict(false);
    try {
      const response = await fetch("/api/admin/corporate-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: item.revisionVersion,
          document: draft,
        }),
      });
      const body = (await response.json()) as AdminApiErrorPayload & {
        item?: CorporateContentRevisionRecord;
        revisions?: CorporateContentRevisionSummary[];
      };
      if (!response.ok) {
        setVersionConflict(response.status === 409);
        setFeedback(describeAdminApiError(body, response));
        return;
      }
      if (!body.item) throw new Error("publish_failed");
      setItem(body.item);
      setDraft(structuredClone(body.item.document));
      setRevisions(body.revisions ?? []);
      setFeedback(`Versión ${body.item.revisionVersion} publicada.`);
    } catch {
      setFeedback("No se pudo publicar. Verifica la conexión e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function restore(version: number) {
    setSaving(true);
    setFeedback(null);
    setVersionConflict(false);
    try {
      const response = await fetch(
        `/api/admin/corporate-content/revisions/${version}/restore`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedVersion: item.revisionVersion }),
        },
      );
      const body = (await response.json()) as AdminApiErrorPayload & {
        item?: CorporateContentRevisionRecord;
        revisions?: CorporateContentRevisionSummary[];
      };
      if (!response.ok) {
        setVersionConflict(response.status === 409);
        setFeedback(describeAdminApiError(body, response));
        return;
      }
      if (!body.item) throw new Error("restore_failed");
      setItem(body.item);
      setDraft(structuredClone(body.item.document));
      setRevisions(body.revisions ?? []);
      setFeedback(`Versión ${version} restaurada como versión ${body.item.revisionVersion}.`);
    } catch {
      setFeedback("No se pudo restaurar. Verifica la conexión e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  function renderPageIdentity<K extends "about" | "faq" | "testimonials">(
    key: K,
    page: PublicCompanyContent[K],
  ) {
    return (
      <div className={styles.formGrid}>
        <Field label="Título SEO" value={page.metaTitle} onChange={(value) => updatePage(key, { ...page, metaTitle: value })} />
        <Field label="Descripción SEO" value={page.metaDescription} onChange={(value) => updatePage(key, { ...page, metaDescription: value })} />
        <Field label="Antetítulo" value={page.hero.eyebrow} onChange={(value) => updatePage(key, { ...page, hero: { ...page.hero, eyebrow: value } })} />
        <Field label="Título de página" value={page.hero.title} onChange={(value) => updatePage(key, { ...page, hero: { ...page.hero, title: value } })} />
        <Field full multiline label="Texto de portada" value={page.hero.copy} onChange={(value) => updatePage(key, { ...page, hero: { ...page.hero, copy: value } })} />
      </div>
    );
  }

  function renderAbout() {
    const page = content.about;
    return (
      <div className={styles.sectionStack}>
        {renderPageIdentity("about", page)}
        {renderPageMedia("aboutHero", "Imagen principal")}
        {renderPageMedia("aboutSecondary", "Imagen secundaria")}
        <div className={styles.formGrid}>
          <Field label="Fecha de historia" value={page.storyDate} onChange={(value) => updatePage("about", { ...page, storyDate: value })} />
          <Field label="Título de historia" value={page.storyTitle} onChange={(value) => updatePage("about", { ...page, storyTitle: value })} />
          <Field full multiline label="Introducción" value={page.storyLead} onChange={(value) => updatePage("about", { ...page, storyLead: value })} />
          <Field full multiline label="Historia · un párrafo por línea" value={linesToText(page.storyParagraphs)} onChange={(value) => updatePage("about", { ...page, storyParagraphs: textToLines(value) })} />
          <Field full multiline label="Puntos destacados · uno por línea" value={linesToText(page.highlights)} onChange={(value) => updatePage("about", { ...page, highlights: textToLines(value) })} />
          <Field label="Título de propósito" value={page.purposeTitle} onChange={(value) => updatePage("about", { ...page, purposeTitle: value })} />
          <Field full multiline label="Propósito" value={page.purposeCopy} onChange={(value) => updatePage("about", { ...page, purposeCopy: value })} />
          <Field label="Título del significado" value={page.meaningTitle} onChange={(value) => updatePage("about", { ...page, meaningTitle: value })} />
          <Field full multiline label="Significado de Wakaya" value={page.meaningCopy} onChange={(value) => updatePage("about", { ...page, meaningCopy: value })} />
          <Field label="Título de valores" value={page.valuesTitle} onChange={(value) => updatePage("about", { ...page, valuesTitle: value })} />
          <Field full multiline label="Introducción de valores" value={page.valuesLead} onChange={(value) => updatePage("about", { ...page, valuesLead: value })} />
        </div>
        {page.values.map((valueItem, index) => (
          <div key={`${valueItem.title}-${index}`} className={styles.previewCard}>
            <div className={styles.formGrid}>
              <Field label="Valor" value={valueItem.title} onChange={(value) => {
                const values = [...page.values]; values[index] = { ...valueItem, title: value }; updatePage("about", { ...page, values });
              }} />
              <Field multiline label="Descripción" value={valueItem.copy} onChange={(value) => {
                const values = [...page.values]; values[index] = { ...valueItem, copy: value }; updatePage("about", { ...page, values });
              }} />
            </div>
            <button type="button" className={styles.ghostButton} onClick={() => updatePage("about", { ...page, values: page.values.filter((_, itemIndex) => itemIndex !== index) })}>Eliminar valor</button>
          </div>
        ))}
        <button type="button" className={styles.secondaryButton} onClick={() => updatePage("about", { ...page, values: [...page.values, { title: "Nuevo valor", copy: "Descripción" }] })}>Agregar valor</button>
        <div className={styles.formGrid}>
          <Field label="Título final" value={page.ctaTitle} onChange={(value) => updatePage("about", { ...page, ctaTitle: value })} />
          <Field multiline label="Texto final" value={page.ctaCopy} onChange={(value) => updatePage("about", { ...page, ctaCopy: value })} />
          <Field label="CTA principal" value={page.primaryCtaLabel} onChange={(value) => updatePage("about", { ...page, primaryCtaLabel: value })} />
          <Field label="CTA secundario" value={page.secondaryCtaLabel} onChange={(value) => updatePage("about", { ...page, secondaryCtaLabel: value })} />
        </div>
      </div>
    );
  }

  function renderFaq() {
    const page = content.faq;
    return (
      <div className={styles.sectionStack}>
        {renderPageIdentity("faq", page)}
        {renderPageMedia("faqHero")}
        <div className={styles.formGrid}>
          <Field label="Título de introducción" value={page.introTitle} onChange={(value) => updatePage("faq", { ...page, introTitle: value })} />
          <Field multiline label="Texto de introducción" value={page.introCopy} onChange={(value) => updatePage("faq", { ...page, introCopy: value })} />
        </div>
        {page.items.map((faq, index) => (
          <div key={`${faq.question}-${index}`} className={styles.previewCard}>
            <Field full label={`Pregunta ${index + 1}`} value={faq.question} onChange={(value) => {
              const items = [...page.items]; items[index] = { ...faq, question: value }; updatePage("faq", { ...page, items });
            }} />
            <Field full multiline label="Respuesta" value={faq.answer} onChange={(value) => {
              const items = [...page.items]; items[index] = { ...faq, answer: value }; updatePage("faq", { ...page, items });
            }} />
            <button type="button" className={styles.ghostButton} onClick={() => updatePage("faq", { ...page, items: page.items.filter((_, itemIndex) => itemIndex !== index) })}>Eliminar pregunta</button>
          </div>
        ))}
        <button type="button" className={styles.secondaryButton} onClick={() => updatePage("faq", { ...page, items: [...page.items, { question: "Nueva pregunta", answer: "Respuesta" }] })}>Agregar pregunta</button>
        <div className={styles.formGrid}>
          <Field label="Título final" value={page.ctaTitle} onChange={(value) => updatePage("faq", { ...page, ctaTitle: value })} />
          <Field multiline label="Texto final" value={page.ctaCopy} onChange={(value) => updatePage("faq", { ...page, ctaCopy: value })} />
          <Field label="CTA" value={page.ctaLabel} onChange={(value) => updatePage("faq", { ...page, ctaLabel: value })} />
        </div>
      </div>
    );
  }

  function renderTestimonials() {
    const page = content.testimonials;
    return (
      <div className={styles.sectionStack}>
        {renderPageIdentity("testimonials", page)}
        {renderPageMedia("testimonialsHero")}
        <div className={styles.formGrid}>
          <Field label="Título de introducción" value={page.introTitle} onChange={(value) => updatePage("testimonials", { ...page, introTitle: value })} />
          <Field multiline label="Texto de introducción" value={page.introCopy} onChange={(value) => updatePage("testimonials", { ...page, introCopy: value })} />
        </div>
        {page.items.map((testimonial, index) => (
          <div key={`${testimonial.author}-${index}`} className={styles.previewCard}>
            <div className={styles.formGrid}>
              {(["author", "country", "image"] as const).map((key) => (
                <Field key={key} label={{ author: "Autor", country: "Procedencia", image: "Imagen" }[key]} value={testimonial[key]} onChange={(value) => {
                  const items = [...page.items]; items[index] = { ...testimonial, [key]: value }; updatePage("testimonials", { ...page, items });
                }} />
              ))}
              <Field multiline label="Testimonio" value={testimonial.quote} onChange={(value) => {
                const items = [...page.items]; items[index] = { ...testimonial, quote: value }; updatePage("testimonials", { ...page, items });
              }} />
            </div>
            <button type="button" className={styles.ghostButton} onClick={() => updatePage("testimonials", { ...page, items: page.items.filter((_, itemIndex) => itemIndex !== index) })}>Eliminar testimonio</button>
          </div>
        ))}
        <button type="button" className={styles.secondaryButton} onClick={() => updatePage("testimonials", { ...page, items: [...page.items, { author: "Huésped", country: "Perú", quote: "Testimonio", image: "/images/wakaya/company/review-huesped.jpg" }] })}>Agregar testimonio</button>
      </div>
    );
  }

  function renderPolicies(kind: "terms" | "privacy") {
    const page = content.policies;
    const items = kind === "terms" ? page.termsSections : page.privacySections;
    const titleKey = kind === "terms" ? "termsTitle" : "privacyTitle";
    const copyKey = kind === "terms" ? "termsCopy" : "privacyCopy";
    const listKey = kind === "terms" ? "termsSections" : "privacySections";
    return (
      <div className={styles.sectionStack}>
        {renderPageMedia("policiesHero")}
        <div className={styles.formGrid}>
          <Field label="Título SEO" value={page.metaTitle} onChange={(value) => updatePage("policies", { ...page, metaTitle: value })} />
          <Field label="Descripción SEO" value={page.metaDescription} onChange={(value) => updatePage("policies", { ...page, metaDescription: value })} />
          <Field label="Antetítulo" value={page.hero.eyebrow} onChange={(value) => updatePage("policies", { ...page, hero: { ...page.hero, eyebrow: value } })} />
          <Field label="Título de página" value={page.hero.title} onChange={(value) => updatePage("policies", { ...page, hero: { ...page.hero, title: value } })} />
          <Field full multiline label="Texto de portada" value={page.hero.copy} onChange={(value) => updatePage("policies", { ...page, hero: { ...page.hero, copy: value } })} />
          <Field label="Título del grupo" value={page[titleKey]} onChange={(value) => updatePage("policies", { ...page, [titleKey]: value })} />
          <Field multiline label="Introducción del grupo" value={page[copyKey]} onChange={(value) => updatePage("policies", { ...page, [copyKey]: value })} />
        </div>
        {items.map((policy, index) => (
          <div key={`${policy.id}-${index}`} className={styles.previewCard}>
            <div className={styles.formGrid}>
              <Field disabled={isRequiredPolicyAnchor(kind, policy.id)} label="Identificador" value={policy.id} onChange={(value) => {
                const next = [...items]; next[index] = { ...policy, id: value }; updatePage("policies", { ...page, [listKey]: next });
              }} />
              <Field label="Título" value={policy.title} onChange={(value) => {
                const next = [...items]; next[index] = { ...policy, title: value }; updatePage("policies", { ...page, [listKey]: next });
              }} />
              <Field full multiline label="Detalle" value={policy.copy} onChange={(value) => {
                const next = [...items]; next[index] = { ...policy, copy: value }; updatePage("policies", { ...page, [listKey]: next });
              }} />
            </div>
            <button type="button" disabled={isRequiredPolicyAnchor(kind, policy.id)} className={styles.ghostButton} onClick={() => updatePage("policies", { ...page, [listKey]: items.filter((_, itemIndex) => itemIndex !== index) })}>Eliminar sección</button>
          </div>
        ))}
        <button type="button" className={styles.secondaryButton} onClick={() => updatePage("policies", { ...page, [listKey]: [...items, { id: `${kind}-${items.length + 1}`, title: "Nueva sección", copy: "Detalle" }] })}>Agregar sección</button>
        <div className={styles.formGrid}>
          <Field label="Título final" value={page.ctaTitle} onChange={(value) => updatePage("policies", { ...page, ctaTitle: value })} />
          <Field multiline label="Texto final" value={page.ctaCopy} onChange={(value) => updatePage("policies", { ...page, ctaCopy: value })} />
          <Field label="CTA" value={page.ctaLabel} onChange={(value) => updatePage("policies", { ...page, ctaLabel: value })} />
        </div>
      </div>
    );
  }

  function renderContact() {
    const contact = draft.contact;
    return (
      <div className={styles.formGrid}>
        <Field full label="Dirección" value={contact.address[locale]} onChange={(value) => updateContact({ ...contact, address: { ...contact.address, [locale]: value } })} />
        <Field full label="Referencia de ubicación" value={contact.locationNote[locale]} onChange={(value) => updateContact({ ...contact, locationNote: { ...contact.locationNote, [locale]: value } })} />
        <Field full multiline label="Teléfonos · uno por línea" value={linesToText(contact.phones)} onChange={(value) => updateContact({ ...contact, phones: textToLines(value) })} />
        <Field label="WhatsApp" value={contact.whatsapp} onChange={(value) => updateContact({ ...contact, whatsapp: value })} />
        <Field label="Correo de reservas" value={contact.reservationsEmail} onChange={(value) => updateContact({ ...contact, reservationsEmail: value })} />
        <Field label="Correo de privacidad" value={contact.privacyEmail} onChange={(value) => updateContact({ ...contact, privacyEmail: value })} />
        <Field label="Horario de atención" value={contact.hours[locale]} onChange={(value) => updateContact({ ...contact, hours: { ...contact.hours, [locale]: value } })} />
      </div>
    );
  }

  return (
    <div className={styles.editorStack}>
      <section className={styles.editorCard}>
        <div className={styles.toolbar}>
          <div className={styles.sectionHeaderLine}>
            <strong>Empresa y políticas</strong>
            <span className={styles.tabMeta}>{revisionLabel(item)}</span>
          </div>
          <div className={styles.inlineActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setShowHistory((current) => !current)}>
              Historial
            </button>
            <button type="button" className={styles.primaryButton} disabled={saving} onClick={publish}>
              {saving ? "Publicando…" : "Guardar y publicar"}
            </button>
          </div>
        </div>
        <div className={styles.localeTabs}>
          <button type="button" className={locale === "es" ? styles.tabButtonActive : styles.tabButton} onClick={() => setLocale("es")}>Español</button>
          <button type="button" className={locale === "en" ? styles.tabButtonActive : styles.tabButton} onClick={() => setLocale("en")}>Inglés</button>
        </div>
        {feedback ? (
          <div className={styles.feedbackRow} aria-live="polite">
            <div className={styles.statusChipPending}>{feedback}</div>
            {versionConflict ? (
              <button type="button" className={styles.secondaryButton} onClick={() => window.location.reload()}>
                Recargar contenido
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className={styles.split}>
        <aside className={styles.panel}>
          <div className={styles.list}>
            {SECTIONS.map((entry) => (
              <button key={entry.key} type="button" className={section === entry.key ? styles.listItemActive : styles.listItem} onClick={() => setSection(entry.key)}>
                <span className={styles.listItemTitle}>{entry.label}</span>
              </button>
            ))}
          </div>
        </aside>
        <section className={styles.editorCard}>
          {section === "about" ? renderAbout() : null}
          {section === "faq" ? renderFaq() : null}
          {section === "testimonials" ? renderTestimonials() : null}
          {section === "terms" ? renderPolicies("terms") : null}
          {section === "privacy" ? renderPolicies("privacy") : null}
          {section === "contact" ? renderContact() : null}
          {[
            "navigation",
            "bungalows-page",
            "bungalow-detail",
            "services-page",
            "gallery-page",
            "events-page",
            "publications-page",
            "contact-page",
            "pet-friendly-page",
            "complaints-page",
          ].includes(section) ? (
            <div className={styles.sectionStack}>
              {section === "navigation" ? renderPageMedia("logo", "Logo del sitio") : null}
              {section === "bungalows-page" ? renderPageMedia("bungalowsHero") : null}
              {section === "services-page" ? renderPageMedia("servicesHero") : null}
              {section === "gallery-page" ? renderPageMedia("galleryHero") : null}
              {section === "events-page" ? renderPageMedia("eventsHero") : null}
              {section === "publications-page" ? renderPageMedia("publicationsHero") : null}
              {section === "contact-page" ? renderPageMedia("contactHero") : null}
              {section === "pet-friendly-page" ? renderPageMedia("petFriendlyHero") : null}
              {section === "complaints-page" ? renderPageMedia("complaintsHero") : null}
              <PublicSiteSettingsEditor
                section={section as PublicSiteEditorSection}
                content={draft.publicSite.locales[locale]}
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    publicSite: {
                      ...current.publicSite,
                      locales: {
                        ...current.publicSite.locales,
                        [locale]: next,
                      },
                    },
                  }))
                }
              />
            </div>
          ) : null}
        </section>
      </div>

      <details className={`${styles.editorCard} ${styles.advancedSection}`}>
        <summary>Contenido histórico</summary>
        <div className={styles.sectionHeaderLine}>
          <strong>Notas internas</strong>
          <span className={styles.tabMeta}>No se publican en la web.</span>
        </div>
        <ul>
          {draft.internal.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
        <div className={styles.sectionStack}>
          {draft.internal.legacyPages.map((page) => (
            <details key={page.slug} className={styles.previewCard}>
              <summary>{page.title} · texto histórico original</summary>
              <a href={page.url} target="_blank" rel="noreferrer">{page.url}</a>
              {page.paragraphs.map((paragraph, index) => (
                <p key={`${page.slug}-${index}`}>{paragraph}</p>
              ))}
            </details>
          ))}
        </div>
      </details>

      {showHistory ? (
        <section className={styles.editorCard}>
          <div className={styles.sectionHeaderLine}>
            <strong>Revisiones</strong>
            <span className={styles.tabMeta}>Restaurar crea una versión nueva.</span>
          </div>
          <div className={styles.list}>
            {revisions.length ? revisions.map((revision) => (
              <div key={revision.revisionVersion} className={styles.listItem}>
                <span className={styles.listItemTitle}>{revisionLabel(revision)}</span>
                <span className={styles.listItemMeta}>{revision.updatedAt}</span>
                <button type="button" className={styles.ghostButton} disabled={saving || revision.revisionVersion === item.revisionVersion} onClick={() => restore(revision.revisionVersion)}>Restaurar</button>
              </div>
            )) : <span className={styles.muted}>Aún no hay revisiones publicadas.</span>}
          </div>
        </section>
      ) : null}

      <CropDialog
        open={Boolean(uploadIntent)}
        file={uploadIntent?.file ?? null}
        slot="hero"
        onCancel={() => setUploadIntent(null)}
        onApply={async (crops) => {
          if (!uploadIntent) return;
          const formData = new FormData();
          formData.set("file", uploadIntent.file);
          formData.set("slot", "hero");
          formData.set("crops", JSON.stringify(crops));
          const response = await fetch("/api/admin/content/media", { method: "POST", body: formData });
          const body = (await response.json().catch(() => ({}))) as AdminApiErrorPayload & { asset?: ContentMediaAsset };
          if (!response.ok || !body.asset) {
            setFeedback(describeAdminApiError(body, response));
            throw new Error(body.error ?? "media_processing_failed");
          }
          onMediaAssetCreated?.(body.asset);
          updateMedia(uploadIntent.mediaSlot, body.asset.id);
          setFeedback("Imagen procesada. Guarda y publica para confirmar el cambio.");
          setUploadIntent(null);
        }}
      />
    </div>
  );
}
