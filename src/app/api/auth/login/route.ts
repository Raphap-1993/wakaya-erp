import { NextResponse } from "next/server";

import { BACKOFFICE_SESSION_COOKIE } from "@/lib/backoffice-auth/constants";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { buildForwardedUrl } from "../redirect-origin";

function sanitizeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/admin";
  }
  if (value.startsWith("//")) {
    return "/admin";
  }
  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextPath(String(formData.get("next") ?? "/admin"));

  if (!email || !password) {
    return NextResponse.redirect(buildForwardedUrl(request, `/login?error=missing_credentials&next=${encodeURIComponent(next)}`), {
      status: 303,
    });
  }

  const user = await backofficeAuthStore.authenticateWithPassword(email, password);
  if (!user) {
    return NextResponse.redirect(buildForwardedUrl(request, `/login?error=invalid_credentials&next=${encodeURIComponent(next)}`), {
      status: 303,
    });
  }

  const { token, session } = await backofficeAuthStore.createSession(user);
  const response = NextResponse.redirect(buildForwardedUrl(request, next), { status: 303 });
  response.cookies.set(BACKOFFICE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return response;
}
