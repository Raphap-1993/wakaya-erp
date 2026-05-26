// i18n baseline para stacks Next.js.
//
// Se asume next-intl. Define las claves como fuente de verdad en el paquete
// frontend y sincroniza traducciones via pipeline.
//
// Instalacion:
//   npm install next-intl

import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en", "pt"] as const;
export const defaultLocale = "es" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../locales/${locale}.json`)).default,
}));
