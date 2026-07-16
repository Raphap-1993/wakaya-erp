"use client";

import type {
  PublicSiteContent,
  PublicSitePageSection,
} from "@/app/[locale]/public-site-content";

import styles from "./content-hub.module.css";

export type PublicSiteEditorSection =
  | "navigation"
  | "bungalows-page"
  | "bungalow-detail"
  | "services-page"
  | "gallery-page"
  | "events-page"
  | "publications-page"
  | "contact-page"
  | "pet-friendly-page"
  | "complaints-page";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  full?: boolean;
}) {
  return (
    <label className={full ? styles.fieldFull : styles.field}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function LinesField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <Field
      full
      multiline
      label={label}
      value={value.join("\n")}
      onChange={(next) =>
        onChange(
          next
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

function PageIdentity({
  page,
  onChange,
}: {
  page: PublicSitePageSection;
  onChange: (page: PublicSitePageSection) => void;
}) {
  return (
    <div className={styles.formGrid}>
      <Field label="Título SEO" value={page.metadata.title} onChange={(value) => onChange({ ...page, metadata: { ...page.metadata, title: value } })} />
      <Field label="Descripción SEO" value={page.metadata.description} onChange={(value) => onChange({ ...page, metadata: { ...page.metadata, description: value } })} />
      <Field label="Antetítulo" value={page.hero.eyebrow} onChange={(value) => onChange({ ...page, hero: { ...page.hero, eyebrow: value } })} />
      <Field label="Título" value={page.hero.title} onChange={(value) => onChange({ ...page, hero: { ...page.hero, title: value } })} />
      <Field full multiline label="Texto de portada" value={page.hero.copy} onChange={(value) => onChange({ ...page, hero: { ...page.hero, copy: value } })} />
    </div>
  );
}

export function PublicSiteSettingsEditor({
  section,
  content,
  onChange,
}: {
  section: PublicSiteEditorSection;
  content: PublicSiteContent;
  onChange: (content: PublicSiteContent) => void;
}) {
  function updatePage<K extends "bungalows" | "services" | "gallery" | "events" | "publications" | "contact" | "petFriendly" | "complaints">(
    key: K,
    page: PublicSiteContent[K],
  ) {
    onChange({ ...content, [key]: page });
  }

  if (section === "navigation") {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.formGrid}>
          <Field label="Marca" value={content.site.brandName} onChange={(value) => onChange({ ...content, site: { ...content.site, brandName: value } })} />
          <Field label="Ubicación corta" value={content.site.brandSmall} onChange={(value) => onChange({ ...content, site: { ...content.site, brandSmall: value } })} />
          <Field full multiline label="Texto del footer" value={content.labels.footerIntro} onChange={(value) => onChange({ ...content, labels: { ...content.labels, footerIntro: value } })} />
          <Field label="Título de enlaces" value={content.labels.footerExplore} onChange={(value) => onChange({ ...content, labels: { ...content.labels, footerExplore: value } })} />
          <Field label="Título de contacto" value={content.labels.footerContact} onChange={(value) => onChange({ ...content, labels: { ...content.labels, footerContact: value } })} />
          <Field label="CTA de reserva" value={content.labels.reserveNow} onChange={(value) => onChange({ ...content, labels: { ...content.labels, reserveNow: value } })} />
          <Field label="Selector de idioma" value={content.labels.languageSwitchLabel} onChange={(value) => onChange({ ...content, labels: { ...content.labels, languageSwitchLabel: value } })} />
        </div>
        <div className={styles.sectionStack}>
          <strong>Navegación</strong>
          {content.labels.nav.map((item, index) => (
            <div className={styles.previewCard} key={item.key}>
              <div className={styles.formGrid}>
                <Field label="Página" value={item.key} onChange={() => undefined} />
                <Field label="Nombre en el menú" value={item.label} onChange={(label) => {
                  const nav = [...content.labels.nav];
                  nav[index] = { ...item, label };
                  onChange({ ...content, labels: { ...content.labels, nav } });
                }} />
              </div>
              <div className={styles.inlineActions}>
                <label className={styles.checkboxRow}>
                  <input type="checkbox" checked={item.visible !== false} onChange={(event) => {
                    const nav = [...content.labels.nav];
                    nav[index] = { ...item, visible: event.target.checked };
                    onChange({ ...content, labels: { ...content.labels, nav } });
                  }} />
                  Visible
                </label>
                <button type="button" className={styles.ghostButton} disabled={index === 0} onClick={() => {
                  const nav = [...content.labels.nav];
                  [nav[index - 1], nav[index]] = [nav[index], nav[index - 1]];
                  onChange({ ...content, labels: { ...content.labels, nav } });
                }}>Subir orden</button>
                <button type="button" className={styles.ghostButton} disabled={index === content.labels.nav.length - 1} onClick={() => {
                  const nav = [...content.labels.nav];
                  [nav[index], nav[index + 1]] = [nav[index + 1], nav[index]];
                  onChange({ ...content, labels: { ...content.labels, nav } });
                }}>Bajar orden</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "bungalow-detail") {
    const page = content.bungalowDetail;
    return (
      <div className={styles.formGrid}>
        <Field label="Breadcrumb" value={page.breadcrumbLabel} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, breadcrumbLabel: value } })} />
        <Field label="Comodidades" value={page.amenitiesTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, amenitiesTitle: value } })} />
        <Field label="Servicios incluidos" value={page.includedTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, includedTitle: value } })} />
        <Field label="Detalles" value={page.detailsTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, detailsTitle: value } })} />
        <Field label="Destacados" value={page.highlightsTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, highlightsTitle: value } })} />
        <Field label="Información de reserva" value={page.howItWorksTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, howItWorksTitle: value } })} />
        <Field label="CTA" value={page.requestLabel} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, requestLabel: value } })} />
        <Field label="Volver" value={page.backLabel} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, backLabel: value } })} />
        <Field label="Título del formulario" value={page.requestPanelTitle} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, requestPanelTitle: value } })} />
        <Field full multiline label="Texto del formulario" value={page.requestPanelCopy} onChange={(value) => onChange({ ...content, bungalowDetail: { ...page, requestPanelCopy: value } })} />
        <LinesField label="Pasos de reserva · uno por línea" value={page.checklist} onChange={(checklist) => onChange({ ...content, bungalowDetail: { ...page, checklist } })} />
      </div>
    );
  }

  const pageKey = section === "bungalows-page"
    ? "bungalows"
    : section === "services-page"
      ? "services"
      : section === "gallery-page"
        ? "gallery"
        : section === "events-page"
          ? "events"
          : section === "publications-page"
            ? "publications"
            : section === "pet-friendly-page"
              ? "petFriendly"
              : section === "complaints-page"
                ? "complaints"
                : "contact";
  const page = content[pageKey];

  return (
    <div className={styles.sectionStack}>
      <PageIdentity page={page} onChange={(next) => updatePage(pageKey, { ...page, ...next } as never)} />

      {pageKey === "bungalows" ? (
        <div className={styles.formGrid}>
          <Field label="CTA de detalle" value={content.bungalows.viewDetailLabel} onChange={(value) => updatePage("bungalows", { ...content.bungalows, viewDetailLabel: value })} />
          <Field label="Título sin resultados" value={content.bungalows.emptyTitle} onChange={(value) => updatePage("bungalows", { ...content.bungalows, emptyTitle: value })} />
          <Field full multiline label="Texto sin resultados" value={content.bungalows.emptyCopy} onChange={(value) => updatePage("bungalows", { ...content.bungalows, emptyCopy: value })} />
        </div>
      ) : null}

      {pageKey === "services" ? (
        <div className={styles.formGrid}>
          <Field label="Antetítulo de sección" value={content.services.sectionEyebrow} onChange={(value) => updatePage("services", { ...content.services, sectionEyebrow: value })} />
          <Field label="Título de sección" value={content.services.sectionTitle} onChange={(value) => updatePage("services", { ...content.services, sectionTitle: value })} />
          <Field full multiline label="Texto de sección" value={content.services.sectionCopy} onChange={(value) => updatePage("services", { ...content.services, sectionCopy: value })} />
        </div>
      ) : null}

      {pageKey === "gallery" ? (
        <div className={styles.formGrid}>
          <Field label="Antetítulo de sección" value={content.gallery.sectionEyebrow} onChange={(value) => updatePage("gallery", { ...content.gallery, sectionEyebrow: value })} />
          <Field label="Título de sección" value={content.gallery.sectionTitle} onChange={(value) => updatePage("gallery", { ...content.gallery, sectionTitle: value })} />
          <Field full multiline label="Texto de sección" value={content.gallery.sectionCopy} onChange={(value) => updatePage("gallery", { ...content.gallery, sectionCopy: value })} />
        </div>
      ) : null}

      {pageKey === "events" ? (
        <div className={styles.formGrid}>
          <Field label="Etiqueta" value={content.events.venueBadge} onChange={(value) => updatePage("events", { ...content.events, venueBadge: value })} />
          <Field label="Título de contenido" value={content.events.bodyTitle} onChange={(value) => updatePage("events", { ...content.events, bodyTitle: value })} />
          <Field full multiline label="Texto de contenido" value={content.events.bodyCopy} onChange={(value) => updatePage("events", { ...content.events, bodyCopy: value })} />
          <LinesField label="Puntos · uno por línea" value={content.events.checklist} onChange={(checklist) => updatePage("events", { ...content.events, checklist })} />
          <Field full multiline label="Texto de propuesta" value={content.events.proposalCopy} onChange={(value) => updatePage("events", { ...content.events, proposalCopy: value })} />
          <Field label="CTA de propuesta" value={content.events.proposalCtaLabel} onChange={(value) => updatePage("events", { ...content.events, proposalCtaLabel: value })} />
        </div>
      ) : null}

      {pageKey === "publications" ? (
        <div className={styles.sectionStack}>
          <div className={styles.formGrid}>
          <Field label="Antetítulo de sección" value={content.publications.sectionEyebrow} onChange={(value) => updatePage("publications", { ...content.publications, sectionEyebrow: value })} />
          <Field label="Título de sección" value={content.publications.sectionTitle} onChange={(value) => updatePage("publications", { ...content.publications, sectionTitle: value })} />
          <Field full multiline label="Texto de sección" value={content.publications.sectionCopy} onChange={(value) => updatePage("publications", { ...content.publications, sectionCopy: value })} />
          <Field label="CTA de artículos" value={content.publications.ctaLabel} onChange={(value) => updatePage("publications", { ...content.publications, ctaLabel: value })} />
          <Field label="Título final" value={content.publications.ctaTitle} onChange={(value) => updatePage("publications", { ...content.publications, ctaTitle: value })} />
          <Field full multiline label="Texto final" value={content.publications.ctaCopy} onChange={(value) => updatePage("publications", { ...content.publications, ctaCopy: value })} />
          <Field label="CTA final" value={content.publications.ctaButton} onChange={(value) => updatePage("publications", { ...content.publications, ctaButton: value })} />
          </div>
          {content.publications.items.map((item, index) => (
            <div className={styles.previewCard} key={item.slug}>
              <div className={styles.formGrid}>
                <Field label="Título" value={item.title} onChange={(value) => {
                  const items = [...content.publications.items];
                  items[index] = { ...item, title: value };
                  updatePage("publications", { ...content.publications, items });
                }} />
                <Field label="Categoría" value={item.meta} onChange={(value) => {
                  const items = [...content.publications.items];
                  items[index] = { ...item, meta: value };
                  updatePage("publications", { ...content.publications, items });
                }} />
                <Field full multiline label="Resumen" value={item.copy} onChange={(value) => {
                  const items = [...content.publications.items];
                  items[index] = { ...item, copy: value };
                  updatePage("publications", { ...content.publications, items });
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {pageKey === "contact" ? (
        <div className={styles.formGrid}>
          <Field label="Título de contacto" value={content.contact.introTitle} onChange={(value) => updatePage("contact", { ...content.contact, introTitle: value })} />
          <Field full multiline label="Texto de contacto" value={content.contact.introCopy} onChange={(value) => updatePage("contact", { ...content.contact, introCopy: value })} />
          <Field label="Título del formulario" value={content.contact.formTitle} onChange={(value) => updatePage("contact", { ...content.contact, formTitle: value })} />
          <LinesField label="Puntos de contacto · uno por línea" value={content.contact.checklist} onChange={(checklist) => updatePage("contact", { ...content.contact, checklist })} />
          <Field label="Campo nombre" value={content.contact.form.guestName} onChange={(value) => updatePage("contact", { ...content.contact, form: { ...content.contact.form, guestName: value } })} />
          <Field label="Campo correo" value={content.contact.form.guestEmail} onChange={(value) => updatePage("contact", { ...content.contact, form: { ...content.contact.form, guestEmail: value } })} />
          <Field label="Campo teléfono" value={content.contact.form.guestPhone} onChange={(value) => updatePage("contact", { ...content.contact, form: { ...content.contact.form, guestPhone: value } })} />
          <Field label="CTA del formulario" value={content.contact.form.submitLabel} onChange={(value) => updatePage("contact", { ...content.contact, form: { ...content.contact.form, submitLabel: value } })} />
        </div>
      ) : null}

      {pageKey === "petFriendly" ? (
        <div className={styles.sectionStack}>
          {content.petFriendly.sections.map((item, index) => (
            <div className={styles.previewCard} key={`${item.title}-${index}`}>
              <div className={styles.formGrid}>
                <Field label="Título" value={item.title} onChange={(title) => {
                  const sections = [...content.petFriendly.sections];
                  sections[index] = { ...item, title };
                  updatePage("petFriendly", { ...content.petFriendly, sections });
                }} />
                <Field full multiline label="Texto" value={item.copy} onChange={(copy) => {
                  const sections = [...content.petFriendly.sections];
                  sections[index] = { ...item, copy };
                  updatePage("petFriendly", { ...content.petFriendly, sections });
                }} />
                <LinesField label="Puntos · uno por línea" value={item.bullets} onChange={(bullets) => {
                  const sections = [...content.petFriendly.sections];
                  sections[index] = { ...item, bullets };
                  updatePage("petFriendly", { ...content.petFriendly, sections });
                }} />
              </div>
            </div>
          ))}
          <div className={styles.formGrid}>
            <Field label="Título del CTA" value={content.petFriendly.ctaTitle} onChange={(ctaTitle) => updatePage("petFriendly", { ...content.petFriendly, ctaTitle })} />
            <Field full multiline label="Texto del CTA" value={content.petFriendly.ctaCopy} onChange={(ctaCopy) => updatePage("petFriendly", { ...content.petFriendly, ctaCopy })} />
            <Field label="Botón del CTA" value={content.petFriendly.ctaLabel} onChange={(ctaLabel) => updatePage("petFriendly", { ...content.petFriendly, ctaLabel })} />
          </div>
        </div>
      ) : null}

      {pageKey === "complaints" ? (
        <div className={styles.sectionStack}>
          <div className={styles.formGrid}>
            <Field label="Título del formulario" value={content.complaints.formTitle} onChange={(formTitle) => updatePage("complaints", { ...content.complaints, formTitle })} />
            <Field full multiline label="Texto del formulario" value={content.complaints.formCopy} onChange={(formCopy) => updatePage("complaints", { ...content.complaints, formCopy })} />
          </div>
          {content.complaints.cards.map((item, index) => (
            <div className={styles.previewCard} key={`${item.title}-${index}`}>
              <div className={styles.formGrid}>
                <Field label="Título" value={item.title} onChange={(title) => {
                  const cards = [...content.complaints.cards];
                  cards[index] = { ...item, title };
                  updatePage("complaints", { ...content.complaints, cards });
                }} />
                <Field full multiline label="Texto" value={item.copy} onChange={(copy) => {
                  const cards = [...content.complaints.cards];
                  cards[index] = { ...item, copy };
                  updatePage("complaints", { ...content.complaints, cards });
                }} />
                <LinesField label="Puntos · uno por línea" value={item.bullets} onChange={(bullets) => {
                  const cards = [...content.complaints.cards];
                  cards[index] = { ...item, bullets };
                  updatePage("complaints", { ...content.complaints, cards });
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
