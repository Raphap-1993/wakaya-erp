import { describe, expect, it } from "vitest";

import {
  describeAdminApiError,
  mapAdminValidationIssues,
} from "./admin-api-errors";

describe("admin API error presentation", () => {
  it("never exposes invalid_payload to an editor", () => {
    expect(describeAdminApiError({ error: "invalid_payload" })).toBe(
      "No se pudo guardar. Revisa los campos señalados.",
    );
  });

  it("maps bungalow numeric issues to useful field messages", () => {
    const result = mapAdminValidationIssues([
      { path: ["nightlyRatePen"], message: "too_small" },
      { path: ["areaSqm"], message: "invalid_type" },
    ]);

    expect(result).toEqual({
      nightlyRatePen: "La tarifa debe ser mayor que cero.",
      areaSqm: "Debes ingresar el área del bungalow.",
    });
  });

  it("gives version conflicts an explicit recovery action", () => {
    expect(
      describeAdminApiError(
        { error: "content_version_conflict" },
        { status: 409 },
      ),
    ).toBe(
      "El contenido cambió en otra sesión. Recarga la página antes de volver a guardar.",
    );
  });
});
