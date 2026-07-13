import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AvailabilityRetryNotice, PublicBookingRequestForm } from "./public-booking-request-form";

describe("PublicBookingRequestForm", () => {
  it("renders the direct booking-request contract used by the public contact flow", () => {
    const html = renderToStaticMarkup(
      <PublicBookingRequestForm
        requestedBungalowType="bungalow-family"
        requestedExperienceId="exp_02"
        requestedCheckIn="2026-07-10"
        requestedCheckOut="2026-07-12"
        requestedGuests="4"
        guestOptions={[
          { label: "4 personas", value: 4 },
          { label: "5 personas", value: 5 },
        ]}
        labels={{
          name: "Nombre",
          email: "Email",
          checkIn: "Check-in",
          checkOut: "Check-out",
          guests: "Huéspedes",
          message: "Mensaje",
          submit: "Enviar solicitud",
          requestCreated: "Solicitud enviada",
          requestCreatedCopy: "Tu solicitud ya está con el equipo de reservas de Wakaya.",
          requestEmailSentCopy: "También enviamos un correo al huésped.",
          requestEmailQueuedCopy: "Si nuestro primer correo tarda un poco más, el equipo seguirá tu solicitud manualmente.",
          whatsappLabel: "WhatsApp Wakaya",
          whatsappPrompt:
            "Si nuestro equipo tarda un poco en escribirte, contáctanos por WhatsApp y comparte este código de solicitud.",
          whatsappButton: "Abrir WhatsApp Wakaya",
          whatsappPrefillTemplate:
            "Hola Wakaya, acabo de enviar la solicitud {publicRef} desde la web y deseo continuar por WhatsApp.",
          closeModal: "Cerrar",
          requestFailed: "No pudimos enviar la solicitud.",
          availabilityUnavailableTitle: "No disponible para ese rango",
          availabilityUnavailableCopy: "No quedan unidades disponibles para esas fechas.",
          availabilityAlternativesLabel: "Opciones similares",
          availabilityAlternativeDatesLabel: "Fechas sugeridas",
          availabilityApplyDatesLabel: "Usar estas fechas",
        }}
        placeholders={{
          name: "Tu nombre",
          email: "tu@email.com",
          message: "Cuéntanos qué tipo de experiencia buscas...",
        }}
      />,
    );

    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('name="guestName"');
    expect(html).toContain('name="guestEmail"');
    expect(html).toContain('name="requestedBungalowType"');
    expect(html).toContain('name="requestedExperienceId" value="exp_02"');
    expect(html).toContain('name="requestedGuests"');
    expect(html).toContain("Enviar solicitud");
  });

  it("renders the sold-out retry notice with alternative types and date actions", () => {
    const html = renderToStaticMarkup(
      <AvailabilityRetryNotice
        message="No quedan unidades disponibles para esas fechas."
        alternatives={[
          {
            bungalowTypeId: "bungalow-matrimonial",
            displayName: "Bungalow Matrimonial",
            capacity: 2,
            availableUnitCount: 1,
          },
          {
            bungalowTypeId: "bungalow-triple",
            displayName: "Bungalow Triple",
            capacity: 3,
            availableUnitCount: 1,
          },
        ]}
        alternativeDates={[
          {
            checkIn: "2026-08-12",
            checkOut: "2026-08-14",
            availableUnitCount: 5,
          },
        ]}
        labels={{
          availabilityUnavailableTitle: "No disponible para ese rango",
          availabilityAlternativesLabel: "Opciones similares",
          availabilityAlternativeDatesLabel: "Fechas sugeridas",
          availabilityApplyDatesLabel: "Usar estas fechas",
        }}
      />,
    );

    expect(html).toContain("No disponible para ese rango");
    expect(html).toContain("Bungalow Matrimonial");
    expect(html).toContain("Bungalow Triple");
    expect(html).toContain("2026-08-12");
    expect(html).toContain("Usar estas fechas");
  });
});
