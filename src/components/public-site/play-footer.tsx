import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { phoneHref, WAKAYA_PUBLIC_PHONES } from "@/lib/wakaya-contact";

import { footerContact } from "./public-site-data";
import type { PublicSiteLocale } from "./public-site-locale";
import { getPublicRoute } from "./public-site-routes";
import styles from "./public-site-shell.module.css";

type FooterLink = {
  key: string;
  label: string;
  href: string;
};

type FooterFeatureLink = FooterLink & {
  icon: ReactNode;
  description: string;
};

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.5h10.5a2.5 2.5 0 0 1 2.5 2.5v12H8.5A2.5 2.5 0 0 0 6 21.5v-17Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M6 18.5A2.5 2.5 0 0 1 8.5 16H19" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 8h6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 11h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="7.2" cy="8.2" r="1.8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.8" cy="8.2" r="1.8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.7 18.2c0-2.1 1.7-3.8 3.8-3.8h0c2.1 0 3.8 1.7 3.8 3.8 0 1.4-1.1 2.3-2.4 2.3-.9 0-1.2-.3-1.9-.3-.7 0-1 .3-1.9.3-1.3 0-2.4-.9-2.4-2.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PlayFooterProps = {
  brandName?: string;
  introCopy?: string;
  exploreLabel?: string;
  companyLabel?: string;
  policyLabel?: string;
  contactLabel?: string;
  contactItems?: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactPhones?: readonly string[];
  footerNav?: FooterLink[];
  companyLinks?: FooterLink[];
  featureLinks?: FooterFeatureLink[];
  policyLinks?: FooterLink[];
  bottomLinks?: FooterLink[];
  locale?: PublicSiteLocale;
};

function buildFooterNav(locale: PublicSiteLocale): FooterLink[] {
  return [
    { key: "home", label: locale === "en" ? "Home" : "Inicio", href: getPublicRoute(locale, "home") },
    { key: "bungalows", label: "Bungalows", href: getPublicRoute(locale, "bungalows") },
    {
      key: "services",
      label: locale === "en" ? "Experiences" : "Servicios",
      href: getPublicRoute(locale, "services"),
    },
    {
      key: "gallery",
      label: locale === "en" ? "Gallery" : "Galería",
      href: getPublicRoute(locale, "gallery"),
    },
    {
      key: "publications",
      label: locale === "en" ? "Publications" : "Publicaciones",
      href: getPublicRoute(locale, "publications"),
    },
    {
      key: "contact",
      label: locale === "en" ? "Contact" : "Contacto",
      href: getPublicRoute(locale, "contact"),
    },
  ];
}

function buildCompanyLinks(locale: PublicSiteLocale): FooterLink[] {
  return [
    {
      key: "about",
      label: locale === "en" ? "About" : "Nosotros",
      href: getPublicRoute(locale, "about"),
    },
    {
      key: "faq",
      label: locale === "en" ? "Frequently asked questions" : "Preguntas frecuentes",
      href: getPublicRoute(locale, "faq"),
    },
    {
      key: "testimonials",
      label: locale === "en" ? "Testimonials" : "Testimonios",
      href: getPublicRoute(locale, "testimonials"),
    },
  ];
}

export function PlayFooter({
  brandName = "Wakaya Ecolodge",
  introCopy = "Tu refugio pet friendly en Pucallpa para descansar, celebrar y reconectar con la naturaleza.",
  exploreLabel = "Explorar",
  companyLabel,
  policyLabel,
  contactLabel = "Contacto",
  contactItems = [footerContact.place, footerContact.domain, footerContact.note],
  contactEmail = "reservas@wakayaecolodge.com",
  contactPhone,
  contactPhones = WAKAYA_PUBLIC_PHONES,
  footerNav,
  companyLinks,
  featureLinks,
  policyLinks,
  bottomLinks,
  locale = "es",
}: PlayFooterProps = {}) {
  const resolvedFooterNav = footerNav ?? buildFooterNav(locale);
  const resolvedCompanyLinks = companyLinks ?? buildCompanyLinks(locale);
  const resolvedFeatureLinks =
    featureLinks ??
    [
      {
        key: "complaints-book",
        label: locale === "en" ? "Complaints Book" : "Libro de Reclamaciones",
        href: getPublicRoute(locale, "complaintsBook"),
        icon: <BookIcon />,
        description:
          locale === "en"
            ? "Submit a claim before, during, or after your stay."
            : "Presenta un reclamo antes, durante o después de tu estadía.",
      },
      {
        key: "pet-friendly",
        label: "Pet Friendly",
        href: getPublicRoute(locale, "petFriendly"),
        icon: <PawIcon />,
        description:
          locale === "en"
            ? "Bring your companion and review the house rules before arrival."
            : "Viaja con tu compañero y revisa las reglas de casa antes de llegar.",
      },
    ];
  const resolvedPolicyLinks =
    policyLinks ??
    [
      {
        key: "policy-reservations",
        label: locale === "en" ? "Reservation policy" : "Política de reservas",
        href: `${getPublicRoute(locale, "hotelPolicies")}#reservations`,
      },
      {
        key: "policy-payments",
        label: locale === "en" ? "Payments and deposits" : "Pagos y adelantos",
        href: `${getPublicRoute(locale, "hotelPolicies")}#payments`,
      },
      {
        key: "policy-cancellations",
        label: locale === "en" ? "Cancellation and no-show" : "Cancelaciones y no-show",
        href: `${getPublicRoute(locale, "hotelPolicies")}#cancellations`,
      },
      {
        key: "policy-pets",
        label: locale === "en" ? "Pet friendly policy" : "Política pet friendly",
        href: getPublicRoute(locale, "petFriendly"),
      },
    ];
  const resolvedBottomLinks =
    bottomLinks ??
    [
      {
        key: "hotel-policies",
        label: locale === "en" ? "Hotel Policies" : "Políticas del hotel",
        href: getPublicRoute(locale, "hotelPolicies"),
      },
      {
        key: "pet-friendly-bottom",
        label: "Pet Friendly",
        href: getPublicRoute(locale, "petFriendly"),
      },
      {
        key: "complaints-book-bottom",
        label: locale === "en" ? "Complaints Book" : "Libro de Reclamaciones",
        href: getPublicRoute(locale, "complaintsBook"),
      },
    ];
  const resolvedPolicyLabel = policyLabel ?? (locale === "en" ? "Policies" : "Políticas");
  const resolvedCompanyLabel = companyLabel ?? (locale === "en" ? "Company" : "Empresa");
  const resolvedContactPhones = contactPhone ? [contactPhone] : contactPhones;

  return (
    <footer className={styles.prototypeFooter}>
      <div className={styles.prototypeFooterGrid}>
        <div className={styles.prototypeFooterBrandColumn}>
          <img
            className={styles.prototypeFooterLogo}
            src="/images/wakaya/wakaya-logo-min.png"
            alt={brandName}
          />
          <p className={styles.prototypeFooterLead}>{introCopy}</p>
          <div>
            <div className={styles.prototypeFooterHeading}>{contactLabel}</div>
            <div className={styles.prototypeFooterContactList}>
              {contactItems.filter(Boolean).map((item) => (
                <span key={item}>{item}</span>
              ))}
              {resolvedContactPhones.map((phone) => (
                <a key={phone} href={phoneHref(phone)}>{phone}</a>
              ))}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
          </div>
          <div className={styles.prototypeFooterSocials}>
            <a href="https://www.facebook.com/wakayaecolodge/" target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href="https://www.instagram.com/wakayaecolodge/" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={`mailto:${contactEmail}`}>Email</a>
          </div>
        </div>

        <div>
          <div className={styles.prototypeFooterHeading}>{exploreLabel}</div>
          <div className={styles.prototypeFooterLinks}>
            {resolvedFooterNav.map((item) => (
              <Link key={item.key} href={item.href as Route}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.prototypeFooterHeading}>{resolvedCompanyLabel}</div>
          <div className={styles.prototypeFooterLinks}>
            {resolvedCompanyLinks.map((item) => (
              <Link key={item.key} href={item.href as Route}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.prototypeFooterPolicyColumn}>
          <div className={styles.prototypeFooterHeading}>{resolvedPolicyLabel}</div>
          <div className={styles.prototypeFooterLinks}>
            {resolvedPolicyLinks.map((item) => (
              <Link key={item.key} href={item.href as Route}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.prototypeFooterFeatureLinks}>
            {resolvedFeatureLinks.map((item) => (
              <Link
                key={item.key}
                className={styles.prototypeFooterFeatureCard}
                href={item.href as Route}
              >
                <span className={styles.prototypeFooterFeatureIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.prototypeFooterFeatureBody}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.prototypeFooterBottom}>
        <span>
          {locale === "en"
            ? "© 2026 Wakaya Ecolodge. All rights reserved."
            : "© 2026 Wakaya Ecolodge. Todos los derechos reservados."}
        </span>
        <div className={styles.prototypeFooterPolicies}>
          {resolvedBottomLinks.map((item) => (
            <Link key={item.key} href={item.href as Route}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
