function readForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

export function buildForwardedUrl(request: Request, path: string): URL {
  const forwardedProto = readForwardedValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost =
    readForwardedValue(request.headers.get("x-forwarded-host")) ??
    readForwardedValue(request.headers.get("host"));

  const baseOrigin =
    forwardedHost && forwardedProto
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(request.url).origin;

  return new URL(path, baseOrigin);
}
