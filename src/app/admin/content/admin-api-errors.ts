export type AdminApiValidationIssue = {
  path?: Array<string | number>;
  message?: string;
};

export type AdminApiErrorPayload = {
  error?: string;
  message?: string;
  issues?: AdminApiValidationIssue[];
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_payload: "No se pudo guardar. Revisa los campos señalados.",
  invalid_home_content_payload: "No se pudo publicar. Revisa los campos señalados.",
  invalid_corporate_content_payload: "No se pudo publicar. Revisa los campos señalados.",
  media_crop_invalid: "El recorte elegido no es válido. Ajústalo e intenta otra vez.",
  media_crop_too_small: "La imagen no tiene el tamaño mínimo requerido.",
  media_crop_required: "Completa todos los recortes antes de continuar.",
  media_processing_failed: "No se pudo procesar la imagen. Puedes ajustar el recorte e intentar otra vez.",
  media_upload_failed: "No se pudo subir la imagen. Inténtalo nuevamente.",
  asset_in_use: "La imagen todavía está publicada en otra sección y no se puede eliminar.",
};

const FIELD_MESSAGES: Record<string, string> = {
  nightlyRatePen: "La tarifa debe ser mayor que cero.",
  areaSqm: "Debes ingresar el área del bungalow.",
  sortOrder: "El orden debe ser un número válido.",
  displayName: "Ingresa el nombre visible del bungalow.",
  displayEyebrow: "Ingresa el antetítulo del bungalow.",
  displayDescription: "Ingresa una descripción corta.",
  displayTagline: "Ingresa la frase destacada.",
  displayLongDescription: "Ingresa la descripción completa.",
};

export function adminIssueField(issue: AdminApiValidationIssue) {
  const path = issue.path ?? [];
  const leaf = [...path].reverse().find((part) => typeof part === "string");
  return typeof leaf === "string" ? leaf : "form";
}

export function mapAdminValidationIssues(issues: AdminApiValidationIssue[] = []) {
  return issues.reduce<Record<string, string>>((result, issue) => {
    const field = adminIssueField(issue);
    if (!result[field]) {
      result[field] = FIELD_MESSAGES[field] ?? "Revisa este campo.";
    }
    return result;
  }, {});
}

export function describeAdminApiError(
  payload: AdminApiErrorPayload,
  response?: { status?: number },
) {
  const code = payload.error ?? "";
  if (
    response?.status === 409 ||
    code === "content_version_conflict" ||
    code === "home_content_version_conflict" ||
    code === "corporate_content_version_conflict"
  ) {
    return "El contenido cambió en otra sesión. Recarga la página antes de volver a guardar.";
  }

  return ERROR_MESSAGES[code] ?? payload.message ?? "No se pudo completar la operación. Inténtalo nuevamente.";
}
