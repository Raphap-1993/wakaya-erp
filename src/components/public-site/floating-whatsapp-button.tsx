import type { PublicSiteLocale } from "./public-site-locale";

import styles from "./floating-whatsapp-button.module.css";

const WHATSAPP_COPY: Record<
  PublicSiteLocale,
  { label: string; message: string }
> = {
  es: {
    label: "Contactar a Wakaya por WhatsApp",
    message:
      "Hola Wakaya, quisiera recibir información sobre sus bungalows y disponibilidad.",
  },
  en: {
    label: "Contact Wakaya on WhatsApp",
    message:
      "Hello Wakaya, I would like more information about your bungalows and availability.",
  },
};

export function buildFloatingWhatsAppHref(
  phone: string,
  locale: PublicSiteLocale,
): string | null {
  const phoneE164 = phone.replace(/\D/g, "");
  if (phoneE164.length < 7 || phoneE164.length > 15) {
    return null;
  }

  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(WHATSAPP_COPY[locale].message)}`;
}

export function FloatingWhatsAppButton({
  phone,
  locale,
}: {
  phone: string;
  locale: PublicSiteLocale;
}) {
  const href = buildFloatingWhatsAppHref(phone, locale);
  if (!href) {
    return null;
  }

  return (
    <a
      className={styles.button}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={WHATSAPP_COPY[locale].label}
      title={WHATSAPP_COPY[locale].label}
      data-public-whatsapp="floating-button"
    >
      <svg className={styles.icon} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.05 3.2A12.7 12.7 0 0 0 5.3 22.64L3.6 28.8l6.3-1.65a12.67 12.67 0 0 0 6.14 1.56h.01A12.76 12.76 0 0 0 16.05 3.2Zm0 23.36a10.55 10.55 0 0 1-5.38-1.47l-.39-.23-3.74.98 1-3.64-.25-.4a10.59 10.59 0 1 1 8.76 4.76Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.58a9.55 9.55 0 0 1-1.77-2.2c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.31.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.42 4.8.76.32 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.75.27-1.4.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
