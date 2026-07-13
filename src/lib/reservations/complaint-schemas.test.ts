import { describe, expect, it } from "vitest";

import { complaintCreateSchema } from "@/lib/reservations/schemas";

describe("complaint schema", () => {
  it("accepts a basic libro de reclamaciones payload", () => {
    const parsed = complaintCreateSchema.parse({
      type: "reclamo",
      fullName: "Ada Lovelace",
      documentType: "dni",
      documentNumber: "12345678",
      email: "ada@example.com",
      phone: "+51987654321",
      address: "Jr. Ucayali 123, Pucallpa",
      serviceType: "lodging",
      contractedService: "Estadia en bungalow matrimonial",
      complaintDetail: "La habitacion no estuvo lista al llegar.",
      consumerRequest: "Solicito una respuesta formal y compensacion.",
      acceptedDeclaration: true,
    });

    expect(parsed.serviceType).toBe("lodging");
    expect(parsed.acceptedDeclaration).toBe(true);
  });

  it("normalizes blank optional fields", () => {
    const parsed = complaintCreateSchema.parse({
      type: "queja",
      fullName: "Ada Lovelace",
      documentType: "passport",
      documentNumber: "AB123456",
      email: "ada@example.com",
      phone: "",
      address: "",
      serviceType: "",
      contractedService: "Visita de dia",
      complaintDetail: "El volumen de la musica fue demasiado alto.",
      consumerRequest: "Solicito que se mejore la atencion.",
      acceptedDeclaration: true,
    });

    expect(parsed.phone).toBeUndefined();
    expect(parsed.address).toBeUndefined();
    expect(parsed.serviceType).toBeNull();
  });

  it("requires at least a categorized or described service", () => {
    expect(() =>
      complaintCreateSchema.parse({
        type: "reclamo",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        complaintDetail: "Detalle",
        consumerRequest: "Pedido",
        acceptedDeclaration: true,
      }),
    ).toThrow("service_required");
  });

  it("requires acceptance of the declaration", () => {
    expect(() =>
      complaintCreateSchema.parse({
        type: "reclamo",
        fullName: "Ada Lovelace",
        documentType: "dni",
        documentNumber: "12345678",
        email: "ada@example.com",
        serviceType: "lodging",
        complaintDetail: "Detalle",
        consumerRequest: "Pedido",
        acceptedDeclaration: false,
      }),
    ).toThrow("acceptance_required");
  });
});
