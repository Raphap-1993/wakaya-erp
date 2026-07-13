import { headers } from "next/headers";

import "./globals.css";

export const metadata = {
  title: "Wakaya",
  description: "Wakaya hospitality site and reservations monitor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-wakaya-locale") ?? "es";

  return (
    <html lang={locale === "en" ? "en" : "es"}>
      <body>{children}</body>
    </html>
  );
}
