import { NextResponse } from "next/server";

import { BACKOFFICE_SESSION_COOKIE } from "@/lib/backoffice-auth/constants";
import { backofficeAuthStore } from "@/lib/backoffice-auth/store";
import { buildForwardedUrl } from "../redirect-origin";

function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const segments = cookieHeader.split(";").map((segment) => segment.trim());
  for (const segment of segments) {
    if (!segment.startsWith(`${BACKOFFICE_SESSION_COOKIE}=`)) continue;
    return decodeURIComponent(segment.slice(BACKOFFICE_SESSION_COOKIE.length + 1));
  }
  return null;
}

export async function POST(request: Request) {
  const token = readSessionToken(request.headers.get("cookie"));
  if (token) {
    await backofficeAuthStore.deleteSession(token);
  }

  const response = NextResponse.redirect(buildForwardedUrl(request, "/login"), { status: 303 });
  response.cookies.set(BACKOFFICE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
