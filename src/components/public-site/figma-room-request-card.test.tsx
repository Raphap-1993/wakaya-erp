import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FigmaRoomRequestCard, RequestSuccessDialog } from "./figma-room-request-card";

describe("FigmaRoomRequestCard", () => {
  it("locks the guest stepper when the product has a fixed supported occupancy and renders the direct booking-request form", () => {
    const html = renderToStaticMarkup(
      <FigmaRoomRequestCard
        initialCheckIn="2026-07-23"
        initialCheckOut="2026-07-26"
        initialGuests={4}
        minGuests={4}
        maxGuests={4}
        pricePerNight={350}
        requestBungalowType="bungalow-family"
        blockedDateRanges={[]}
        requestLabel="Enviar solicitud"
        selectDatesLabel="Selecciona las fechas"
        proofNote="El comprobante se responde en el mismo hilo."
        labels={{
          arrival: "Llegada",
          departure: "Salida",
          guests: "Huéspedes",
          person: "persona",
          people: "personas",
          night: "noche",
          nights: "noches",
          total: "Total",
          taxesIncluded: "Tasas e impuestos",
          included: "incluidos",
          perNight: "/noche",
          preferCall: "¿Prefieres llamar?",
          phone: "+51 961 508 813",
          hours: "Lun-Dom · 7:00 - 20:00",
          guestName: "Nombre",
          guestEmail: "Email",
          guestPhone: "Teléfono o WhatsApp",
          requestCreated: "Solicitud enviada",
          requestCreatedCopy: "Tu solicitud ya está con el equipo de reservas.",
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
          fixedGuestsCopy: "Capacidad: 4 huéspedes.",
          blockedDatesLabel: "Fechas ocupadas",
          blockedDatesConflictCopy: "Estas fechas ya están ocupadas para este bungalow.",
        }}
      />,
    );

    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('name="guestName"');
    expect(html).toContain('name="guestEmail"');
    expect(html).toContain('type="hidden" name="requestedGuests" value="4"');
    expect(html).toContain('disabled="" aria-label="Reducir huespedes"');
    expect(html).toContain('disabled="" aria-label="Aumentar huespedes"');
  });

  it("blocks the request when the selected range overlaps an assigned stay for the same bungalow", () => {
    const html = renderToStaticMarkup(
      <FigmaRoomRequestCard
        initialCheckIn="2026-07-14"
        initialCheckOut="2026-07-16"
        initialGuests={2}
        minGuests={2}
        maxGuests={2}
        pricePerNight={280}
        requestBungalowType="bungalow-suite"
        blockedDateRanges={[
          {
            startDate: "2026-07-14",
            endDate: "2026-07-16",
          },
        ]}
        requestLabel="Enviar solicitud"
        selectDatesLabel="Selecciona las fechas"
        proofNote="El comprobante se responde en el mismo hilo."
        labels={{
          arrival: "Llegada",
          departure: "Salida",
          guests: "Huéspedes",
          person: "persona",
          people: "personas",
          night: "noche",
          nights: "noches",
          total: "Total",
          taxesIncluded: "Tasas e impuestos",
          included: "incluidos",
          perNight: "/noche",
          preferCall: "¿Prefieres llamar?",
          phone: "+51 961 508 813",
          hours: "Lun-Dom · 7:00 - 20:00",
          guestName: "Nombre",
          guestEmail: "Email",
          guestPhone: "Teléfono o WhatsApp",
          requestCreated: "Solicitud enviada",
          requestCreatedCopy: "Tu solicitud ya está con el equipo de reservas.",
          requestEmailSentCopy: "Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.",
          requestEmailQueuedCopy: "Si nuestro primer correo tarda un poco más, el equipo seguirá tu solicitud manualmente.",
          whatsappLabel: "WhatsApp Wakaya",
          whatsappPrompt:
            "Si nuestro equipo tarda un poco en escribirte, contáctanos por WhatsApp y comparte este código de solicitud.",
          whatsappButton: "Abrir WhatsApp Wakaya",
          whatsappPrefillTemplate:
            "Hola Wakaya, acabo de enviar la solicitud {publicRef} desde la web y deseo continuar por WhatsApp.",
          closeModal: "Cerrar",
          requestFailed: "No pudimos enviar la solicitud.",
          fixedGuestsCopy: "Capacidad: 2 huéspedes.",
          blockedDatesLabel: "Fechas ocupadas",
          blockedDatesConflictCopy: "Estas fechas ya están ocupadas para este bungalow.",
        }}
      />,
    );

    expect(html).toContain("Estas fechas ya están ocupadas para este bungalow.");
    expect(html).not.toContain("Fechas ocupadas");
    expect(html).not.toContain("2026-07-14 → 2026-07-16");
    expect(html).toContain("Selecciona las fechas");
    expect(html).toContain('disabled="" type="submit"');
  });

  it("allows a new stay to start on the checkout date of the previous stay", () => {
    const html = renderToStaticMarkup(
      <FigmaRoomRequestCard
        initialCheckIn="2026-07-16"
        initialCheckOut="2026-07-18"
        initialGuests={2}
        minGuests={2}
        maxGuests={2}
        pricePerNight={280}
        requestBungalowType="bungalow-suite"
        blockedDateRanges={[{ startDate: "2026-07-14", endDate: "2026-07-16" }]}
        requestLabel="Enviar solicitud"
        selectDatesLabel="Selecciona las fechas"
        proofNote="El comprobante se responde en el mismo hilo."
        labels={{
          arrival: "Llegada",
          departure: "Salida",
          guests: "Huéspedes",
          person: "persona",
          people: "personas",
          night: "noche",
          nights: "noches",
          total: "Total",
          taxesIncluded: "Tasas e impuestos",
          included: "incluidos",
          perNight: "/noche",
          preferCall: "¿Prefieres llamar?",
          phone: "+51 961 508 813",
          hours: "Lun-Dom · 7:00 - 20:00",
          guestName: "Nombre",
          guestEmail: "Email",
          guestPhone: "Teléfono o WhatsApp",
          requestCreated: "Solicitud enviada",
          requestCreatedCopy: "Tu solicitud ya está con el equipo de reservas.",
          requestEmailSentCopy: "Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.",
          requestEmailQueuedCopy: "Si nuestro primer correo tarda un poco más, el equipo seguirá tu solicitud manualmente.",
          whatsappLabel: "WhatsApp Wakaya",
          whatsappPrompt: "Comparte este código de solicitud por WhatsApp.",
          whatsappButton: "Abrir WhatsApp Wakaya",
          whatsappPrefillTemplate: "Hola Wakaya, deseo continuar la solicitud {publicRef}.",
          closeModal: "Cerrar",
          requestFailed: "No pudimos enviar la solicitud.",
          fixedGuestsCopy: "Capacidad: 2 huéspedes.",
          blockedDatesLabel: "Fechas ocupadas",
          blockedDatesConflictCopy: "Estas fechas ya están ocupadas para este bungalow.",
        }}
      />,
    );

    expect(html).not.toContain("Estas fechas ya están ocupadas para este bungalow.");
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('disabled="" type="submit"');
  });

  it("renders a large success dialog that explains both the back office registration and the guest email status", () => {
    const html = renderToStaticMarkup(
      <RequestSuccessDialog
        bookingRequestPublicRef="WR-2026-0009"
        deliveryStatus="sent"
        onClose={() => undefined}
        labels={{
          requestCreated: "Solicitud enviada",
          requestCreatedCopy: "Tu solicitud ya está con el equipo de reservas de Wakaya.",
          requestEmailSentCopy: "Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.",
          requestEmailQueuedCopy: "Si nuestro primer correo tarda un poco más, el equipo seguirá tu solicitud manualmente.",
          whatsappLabel: "WhatsApp Wakaya",
          whatsappPrompt:
            "Si nuestro equipo tarda un poco en escribirte, contáctanos por WhatsApp y comparte este código de solicitud.",
          whatsappButton: "Abrir WhatsApp Wakaya",
          whatsappPrefillTemplate:
            "Hola Wakaya, acabo de enviar la solicitud {publicRef} desde la web y deseo continuar por WhatsApp.",
          closeModal: "Cerrar",
        }}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Solicitud enviada");
    expect(html).toContain("WR-2026-0009");
    expect(html).toContain("Tu solicitud ya está con el equipo de reservas de Wakaya.");
    expect(html).toContain("Nuestro equipo ya está trabajando en ella y te contactará lo antes posible.");
    expect(html).toContain("+51 961 508 813");
    expect(html).toContain(
      "Si nuestro equipo tarda un poco en escribirte, contáctanos por WhatsApp y comparte este código de solicitud.",
    );
    expect(html).toContain("Abrir WhatsApp Wakaya");
    expect(html).toContain("https://wa.me/51961508813?text=Hola%20Wakaya%2C%20acabo%20de%20enviar%20la%20solicitud%20WR-2026-0009%20desde%20la%20web%20y%20deseo%20continuar%20por%20WhatsApp.");
    expect(html).not.toContain("51963847291");
    expect(html).toContain("Cerrar");
  });
});
