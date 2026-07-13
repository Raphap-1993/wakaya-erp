import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicComplaintForm } from "./public-complaint-form";

describe("PublicComplaintForm", () => {
  it("renders the public complaints contract with progressive form fields", () => {
    const html = renderToStaticMarkup(
      <PublicComplaintForm
        labels={{
          formTitle: "Registra tu caso en línea",
          formCopy: "Completa los datos básicos de tu caso.",
          type: "Tipo de caso",
          fullName: "Nombre completo",
          documentType: "Tipo de documento",
          documentNumber: "Número de documento",
          email: "Correo",
          phone: "Teléfono",
          address: "Dirección",
          serviceType: "Categoría del servicio",
          contractedService: "Servicio contratado",
          complaintDetail: "¿Qué ocurrió?",
          consumerRequest: "¿Qué solución esperas?",
          acceptedDeclaration: "Declaro que la información es verdadera.",
          acceptedHelp: "Recibirás una constancia pública.",
          submit: "Enviar caso",
          submitting: "Enviando caso",
          error: "No pudimos registrar tu caso.",
          successTitle: "Caso recibido",
          successCopy: "Guarda tu código.",
          successResponse: "Plazo de respuesta: hasta 15 días hábiles.",
        }}
        options={{
          claim: "Reclamo",
          complaint: "Queja",
          documentTypes: [
            { value: "dni", label: "DNI" },
            { value: "passport", label: "Pasaporte" },
          ],
          serviceTypes: [
            { value: "lodging", label: "Hospedaje" },
            { value: "event", label: "Eventos" },
          ],
        }}
        placeholders={{
          fullName: "Nombre del huésped",
          documentNumber: "12345678",
          email: "nombre@email.com",
          phone: "+51 999 999 999",
          address: "Pucallpa",
          contractedService: "Estadía en bungalow familiar",
          complaintDetail: "Describe lo ocurrido.",
          consumerRequest: "Indica la solución esperada.",
        }}
      />,
    );

    expect(html).toContain('action="/api/public/complaints"');
    expect(html).toContain('method="post"');
    expect(html).toContain('name="type"');
    expect(html).toContain('name="fullName"');
    expect(html).toContain('name="documentType"');
    expect(html).toContain('name="documentNumber"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="serviceType"');
    expect(html).toContain('name="complaintDetail"');
    expect(html).toContain('name="consumerRequest"');
    expect(html).toContain('name="acceptedDeclaration"');
    expect(html).toContain("Enviar caso");
  });
});
