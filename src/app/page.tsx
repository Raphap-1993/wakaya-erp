import { redirect } from "next/navigation";
import type { Route } from "next";

import { defaultLocale } from "@/lib/i18n";

export default function HomePage() {
  redirect(`/${defaultLocale}` as Route);
}
