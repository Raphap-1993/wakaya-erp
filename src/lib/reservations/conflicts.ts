import { compareDateOnly } from "@/lib/reservations/date-utils";

type RequestLike = {
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedBungalowType: string | null;
};

type ReservationLike = {
  reservationId: string;
  reservationNumber?: string | null;
  bungalowId: string | null;
  channel?: "web" | "ota";
  status: string;
  paymentStatus?: string | null;
  sourceRequestId?: string | null;
  startDate: string;
  endDate: string;
};

export interface RequestConflictPolicy {
  title: string;
  detail: string;
  tone: "contact_and_reprogram" | "manual_review";
  anchorSide: "reservation" | "request";
  anchorLabel: string;
  moveLabel: string;
}

export interface RequestConflictMatch {
  reservationId: string;
  reservationNumber: string | null;
  policy: RequestConflictPolicy;
}

export interface RequestConflictDetectionResult {
  hasConflict: boolean;
  conflictType: "date_overlap" | null;
  overlappingReservationIds: string[];
  matches: RequestConflictMatch[];
}

type ReservationConflictRecommendationInput = {
  reservationId: string;
  number: string;
  channel: "web" | "ota";
  status: string;
  paymentStatus?: string | null;
  sourceRequestId?: string | null;
};

export interface ReservationConflictRecommendation {
  reservationId: string;
  tone: "anchor" | "move" | "review";
  label: string;
  detail: string;
}

export interface OccupancyConflictResolutionPlan {
  tone: "ota_vs_web" | "web_vs_ota" | "manual_review";
  title: string;
  summary: string;
  anchorReservationId: string | null;
  anchorNumber: string | null;
  moveFirstReservationId: string | null;
  moveFirstNumber: string | null;
  contactReservationId: string | null;
  steps: string[];
}

function normalizeBungalowKey(value: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function datesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean {
  return compareDateOnly(leftStart, rightEnd) <= 0 && compareDateOnly(rightStart, leftEnd) <= 0;
}

function describeReservationAnchor(reservation: ReservationLike): string {
  return reservation.reservationNumber?.trim() || "la reserva existente";
}

function isWebReservation(
  reservation:
    | ReservationLike
    | ReservationConflictRecommendationInput,
): boolean {
  return reservation.channel === "web" || Boolean(reservation.sourceRequestId);
}

function describePriorityReason(item: ReservationConflictRecommendationInput): string {
  if (item.status === "checked_in") {
    return `${item.number} ya está en check-in`;
  }
  if (item.status === "assigned") {
    return `${item.number} ya quedó asignada operativamente`;
  }
  if (item.status === "paid" || item.paymentStatus === "paid") {
    return `${item.number} ya tiene compromiso de pago cerrado`;
  }
  if (item.status === "ota_imported_confirmed" || item.channel === "ota") {
    return `${item.number} entró como OTA confirmada`;
  }
  if (isWebReservation(item) && item.paymentStatus === "partial") {
    return `${item.number} ya tiene hilo web activo y pago parcial`;
  }
  if (isWebReservation(item)) {
    return `${item.number} ya tiene continuidad comercial en el hilo web`;
  }
  return `${item.number} tiene mayor compromiso operativo`;
}

export function buildRequestConflictPolicy(
  _request: RequestLike,
  reservation: ReservationLike,
): RequestConflictPolicy {
  const anchorLabel = describeReservationAnchor(reservation);
  const moveLabel = "la solicitud web";

  if (reservation.channel === "ota" || reservation.status === "ota_imported_confirmed") {
    return {
      title: "Conflicto OTA vs solicitud web",
      detail:
        "La OTA ya ocupa esas noches. Primero coordina con el cliente y luego reprograma la solicitud web antes de confirmar la reserva.",
      tone: "contact_and_reprogram",
      anchorSide: "reservation",
      anchorLabel,
      moveLabel,
    };
  }

  if (reservation.channel === "web" || reservation.sourceRequestId) {
    return {
      title: "Conflicto web vs web",
      detail:
        "Ya existe otra reserva web sobre esas noches. Revisa cuál debe quedar como base y mueve la otra solo después de validar disponibilidad real.",
      tone: "manual_review",
      anchorSide: "reservation",
      anchorLabel,
      moveLabel,
    };
  }

  return {
    title: "Choque con reserva existente",
    detail:
      "Ya existe una reserva operativa sobre esas noches. Valida cuál debe quedar como ancla antes de reprogramar o reasignar.",
    tone: "manual_review",
    anchorSide: "reservation",
    anchorLabel,
    moveLabel,
  };
}

function reservationConflictScore(item: ReservationConflictRecommendationInput): number {
  if (item.status === "checked_in") return 100;
  if (item.status === "assigned") return 90;
  if (item.status === "paid" || item.paymentStatus === "paid") return 86;
  if (item.status === "ota_imported_confirmed" || item.channel === "ota") return 80;
  if (item.status === "confirmed" && item.sourceRequestId) return item.paymentStatus === "partial" ? 69 : 66;
  if (item.status === "confirmed") return 64;
  if (item.paymentStatus === "partial") return 58;
  return 45;
}

export function buildOccupancyConflictResolutionPlan(
  reservations: ReservationConflictRecommendationInput[],
): OccupancyConflictResolutionPlan {
  if (reservations.length === 0) {
    return {
      tone: "manual_review",
      title: "Revisión manual requerida",
      summary: "No hay reservas suficientes para construir una regla operativa.",
      anchorReservationId: null,
      anchorNumber: null,
      moveFirstReservationId: null,
      moveFirstNumber: null,
      contactReservationId: null,
      steps: ["Selecciona otra celda o abre la ficha completa para continuar."],
    };
  }

  const scored = reservations
    .map((reservation) => ({
      reservation,
      score: reservationConflictScore(reservation),
    }))
    .sort((left, right) => right.score - left.score);

  const anchor = scored[0]?.reservation ?? null;
  const moveFirst = scored[1]?.reservation ?? null;
  const anchorIsWeb = anchor ? isWebReservation(anchor) : false;
  const moveIsWeb = moveFirst ? isWebReservation(moveFirst) : false;

  if (anchor?.channel === "ota" && moveFirst && moveIsWeb) {
    return {
      tone: "ota_vs_web",
      title: "Mantener OTA y mover web",
      summary: `${describePriorityReason(anchor)}. Primero coordina con el cliente web y luego guarda la reprogramación desde este mismo modal.`,
      anchorReservationId: anchor.reservationId,
      anchorNumber: anchor.number,
      moveFirstReservationId: moveFirst.reservationId,
      moveFirstNumber: moveFirst.number,
      contactReservationId: moveFirst.reservationId,
      steps: [
        `Mantén ${anchor.number} como ancla en esta celda.`,
        `Abre el hilo del cliente ligado a ${moveFirst.number}.`,
        `Guarda la nueva fecha o bungalow de ${moveFirst.number} y recalcula la semana.`,
      ],
    };
  }

  if (anchor && anchorIsWeb && moveFirst?.channel === "ota") {
    return {
      tone: "web_vs_ota",
      title: "Mantener web y revisar OTA",
      summary: `${describePriorityReason(anchor)}. Ajusta primero la OTA importada y vuelve a validar la ocupación final antes de cerrar el conflicto.`,
      anchorReservationId: anchor.reservationId,
      anchorNumber: anchor.number,
      moveFirstReservationId: moveFirst.reservationId,
      moveFirstNumber: moveFirst.number,
      contactReservationId: anchor.reservationId,
      steps: [
        `Mantén ${anchor.number} como base mientras se resuelve el cruce.`,
        `Reprograma o reubica ${moveFirst.number} dentro de esta misma ventana.`,
        "Refresca la grilla y confirma que solo quede una reserva por noche.",
      ],
    };
  }

  return {
    tone: "manual_review",
    title: "Revisión manual requerida",
    summary: "Las reservas tienen prioridad operativa similar. Elige un ancla, coordina excepciones y luego reprograma la otra reserva.",
    anchorReservationId: anchor?.reservationId ?? null,
    anchorNumber: anchor?.number ?? null,
    moveFirstReservationId: moveFirst?.reservationId ?? null,
    moveFirstNumber: moveFirst?.number ?? null,
    contactReservationId:
      reservations.find((reservation) => isWebReservation(reservation))?.reservationId ?? null,
    steps: [
      "Revisa estado, pago y compromiso comercial de cada reserva.",
      "Define qué reserva debe quedarse en la celda como ancla operativa.",
      "Mueve o reprograma la otra reserva y valida la grilla antes de salir.",
    ],
  };
}

export function buildReservationConflictRecommendations(
  reservations: ReservationConflictRecommendationInput[],
): ReservationConflictRecommendation[] {
  if (reservations.length === 0) {
    return [];
  }

  const scored = reservations
    .map((reservation) => ({
      reservation,
      score: reservationConflictScore(reservation),
    }))
    .sort((left, right) => right.score - left.score);

  const top = scored[0];
  const second = scored[1];
  const shouldReviewAll =
    scored.length > 1 &&
    Math.abs((top?.score ?? 0) - (second?.score ?? 0)) < 5 &&
    top?.reservation.channel === second?.reservation.channel;

  return reservations.map((reservation) => {
    if (shouldReviewAll) {
      return {
        reservationId: reservation.reservationId,
        tone: "review",
        label: "Revisión manual",
        detail: "Ambas reservas tienen prioridad similar. Revisa fechas, pagos y compromiso comercial antes de mover una.",
      };
    }

    if (reservation.reservationId === top?.reservation.reservationId) {
      return {
        reservationId: reservation.reservationId,
        tone: "anchor",
        label: "Ancla sugerida",
        detail: `Mantén ${reservation.number} como base mientras resuelves el resto del cruce.`,
      };
    }

    return {
      reservationId: reservation.reservationId,
      tone: "move",
      label: "Mover primero",
      detail: "Es la mejor candidata para reprogramar o reasignar sin seguir solapando el bungalow.",
    };
  });
}

export function detectRequestConflicts(
  request: RequestLike,
  reservations: ReservationLike[],
): RequestConflictDetectionResult {
  const requestedBungalowKey = normalizeBungalowKey(request.requestedBungalowType);
  if (!requestedBungalowKey) {
    return {
      hasConflict: false,
      conflictType: null,
      overlappingReservationIds: [],
      matches: [],
    };
  }

  const matches = reservations
    .filter((reservation) =>
      normalizeBungalowKey(reservation.bungalowId) === requestedBungalowKey &&
      datesOverlap(
        request.requestedCheckIn,
        request.requestedCheckOut,
        reservation.startDate,
        reservation.endDate,
      ),
    )
    .map((reservation) => ({
      reservationId: reservation.reservationId,
      reservationNumber: reservation.reservationNumber ?? null,
      policy: buildRequestConflictPolicy(request, reservation),
    }));
  const overlappingReservationIds = matches.map((match) => match.reservationId);

  if (overlappingReservationIds.length > 0) {
    return {
      hasConflict: true,
      conflictType: "date_overlap",
      overlappingReservationIds,
      matches,
    };
  }

  return {
    hasConflict: false,
    conflictType: null,
    overlappingReservationIds: [],
    matches: [],
  };
}
