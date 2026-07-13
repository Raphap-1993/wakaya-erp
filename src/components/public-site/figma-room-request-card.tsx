"use client";

import { type FormEvent, useMemo, useState } from "react";

import { WAKAYA_WHATSAPP_DISPLAY, WAKAYA_WHATSAPP_E164 } from "@/lib/wakaya-contact";

import styles from "./room-detail-figma.module.css";

type RequestDeliveryStatus = "queued_without_provider" | "sent";

type RequestSuccessLabels = {
  requestCreated: string;
  requestCreatedCopy: string;
  requestEmailSentCopy: string;
  requestEmailQueuedCopy: string;
  whatsappLabel: string;
  whatsappPrompt: string;
  whatsappButton: string;
  whatsappPrefillTemplate: string;
  closeModal: string;
};

type FigmaRoomRequestCardProps = {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  minGuests?: number;
  maxGuests: number;
  pricePerNight: number;
  priceDisplayLabel?: string;
  requestBungalowType: string | null;
  blockedDateRanges: Array<{
    startDate: string;
    endDate: string;
  }>;
  requestLabel: string;
  selectDatesLabel: string;
  proofNote: string;
  whatsappPhoneDisplay?: string;
  whatsappPhoneE164?: string;
  labels: {
    arrival: string;
    departure: string;
    guests: string;
    person: string;
    people: string;
    night: string;
    nights: string;
    total: string;
    taxesIncluded: string;
    included: string;
    perNight: string;
    preferCall: string;
    phone: string;
    hours: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    requestCreated: RequestSuccessLabels["requestCreated"];
    requestCreatedCopy: RequestSuccessLabels["requestCreatedCopy"];
    requestEmailSentCopy: RequestSuccessLabels["requestEmailSentCopy"];
    requestEmailQueuedCopy: RequestSuccessLabels["requestEmailQueuedCopy"];
    whatsappLabel: RequestSuccessLabels["whatsappLabel"];
    whatsappPrompt: RequestSuccessLabels["whatsappPrompt"];
    whatsappButton: RequestSuccessLabels["whatsappButton"];
    whatsappPrefillTemplate: RequestSuccessLabels["whatsappPrefillTemplate"];
    closeModal: RequestSuccessLabels["closeModal"];
    requestFailed: string;
    fixedGuestsCopy: string;
    blockedDatesLabel: string;
    blockedDatesConflictCopy: string;
  };
};

type RequestSuccessDialogProps = {
  bookingRequestPublicRef: string;
  deliveryStatus: RequestDeliveryStatus;
  onClose: () => void;
  labels: RequestSuccessLabels;
  whatsappPhoneDisplay?: string;
  whatsappPhoneE164?: string;
};

type SubmissionSuccess = {
  publicRef: string;
  deliveryStatus: RequestDeliveryStatus;
};

function getNightCount(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / 86400000);
}

function buildWhatsAppHref(template: string, publicRef: string, phoneE164: string) {
  const message = template.replaceAll("{publicRef}", publicRef);
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

function rangesOverlap(startDate: string, endDate: string, blockedStartDate: string, blockedEndDate: string) {
  if (!startDate || !endDate) {
    return false;
  }

  return startDate < blockedEndDate && blockedStartDate < endDate;
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72l.34 2.86a2 2 0 0 1-.57 1.72l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.72-.57l2.86.34A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RequestSuccessDialog({
  bookingRequestPublicRef,
  deliveryStatus,
  onClose,
  labels,
  whatsappPhoneDisplay = WAKAYA_WHATSAPP_DISPLAY,
  whatsappPhoneE164 = WAKAYA_WHATSAPP_E164,
}: RequestSuccessDialogProps) {
  const deliveryCopy =
    deliveryStatus === "sent"
      ? labels.requestEmailSentCopy
      : labels.requestEmailQueuedCopy;
  const whatsappHref = buildWhatsAppHref(
    labels.whatsappPrefillTemplate,
    bookingRequestPublicRef,
    whatsappPhoneE164,
  );

  return (
    <div className={styles.requestDialogOverlay} onClick={onClose}>
      <div
        className={styles.requestDialogPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-request-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.requestDialogHeader}>
          <p className={styles.requestDialogKicker}>{labels.requestCreated}</p>
          <h3 id="booking-request-success-title" className={styles.requestDialogTitle}>
            {bookingRequestPublicRef}
          </h3>
        </div>

        <div className={styles.requestDialogBody}>
          <p className={styles.requestDialogCopy}>{labels.requestCreatedCopy}</p>
          <p className={styles.requestDialogStatus}>{deliveryCopy}</p>
          <div className={styles.requestDialogWhatsappBox}>
            <span className={styles.requestDialogWhatsappLabel}>{labels.whatsappLabel}</span>
            <a
              className={styles.requestDialogWhatsappPhoneLink}
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
            >
              {whatsappPhoneDisplay}
            </a>
            <p className={styles.requestDialogWhatsappPrompt}>{labels.whatsappPrompt}</p>
          </div>
        </div>

        <div className={styles.requestDialogActions}>
          <a
            className={styles.requestDialogWhatsappButton}
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
          >
            {labels.whatsappButton}
          </a>
          <button className={styles.requestDialogClose} type="button" onClick={onClose}>
            {labels.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FigmaRoomRequestCard({
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 1,
  minGuests = 1,
  maxGuests,
  pricePerNight,
  priceDisplayLabel,
  requestBungalowType,
  blockedDateRanges,
  requestLabel,
  selectDatesLabel,
  proofNote,
  whatsappPhoneDisplay,
  whatsappPhoneE164,
  labels,
}: FigmaRoomRequestCardProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(
    Math.min(Math.max(initialGuests, minGuests), maxGuests),
  );
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccess | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0] ?? "", []);
  const nights = getNightCount(checkIn, checkOut);
  const total = nights * pricePerNight;
  const hasKnownPrice = pricePerNight > 0;
  const conflictingRange =
    blockedDateRanges.find((range) => rangesOverlap(checkIn, checkOut, range.startDate, range.endDate)) ?? null;
  const hasAvailabilityConflict = Boolean(conflictingRange);
  const isReady = Boolean(checkIn && checkOut && nights > 0 && !hasAvailabilityConflict);
  const isLockedGuestCount = minGuests === maxGuests;
  const isSubmitted = Boolean(submissionSuccess);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity() || !isReady || isSubmitting || isSubmitted) {
      if (hasAvailabilityConflict) {
        setSubmitError("occupancy_conflict");
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/public/booking-requests", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        bookingRequest?: { publicRef?: string };
        delivery?: { status?: RequestDeliveryStatus };
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.bookingRequest?.publicRef) {
        throw new Error(payload.message || payload.error || "request_failed");
      }

      setSubmissionSuccess({
        publicRef: payload.bookingRequest.publicRef,
        deliveryStatus:
          payload.delivery?.status === "sent" ? "sent" : "queued_without_provider",
      });
      setIsSuccessDialogOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "request_failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className={styles.requestCard} action="/api/public/booking-requests" method="post" onSubmit={handleSubmit}>
        <input name="requestedCheckIn" type="hidden" value={checkIn} />
        <input name="requestedCheckOut" type="hidden" value={checkOut} />
        <input name="requestedGuests" type="hidden" value={String(guests)} />
        {requestBungalowType ? (
          <input name="requestedBungalowType" type="hidden" value={requestBungalowType} />
        ) : null}

        <div className={styles.requestPriceRow}>
          <span className={styles.requestPrice}>
            {hasKnownPrice ? `S/. ${pricePerNight}` : priceDisplayLabel}
          </span>
          {hasKnownPrice ? <span className={styles.requestPriceSuffix}>{labels.perNight}</span> : null}

          <div className={styles.requestPriceMeta}>
            <span className={styles.starRow}>★★★★★</span>
            <span className={styles.requestScore}>4.9</span>
          </div>
        </div>

        <div className={styles.requestFields}>
          <div className={styles.requestFieldsRow}>
            <div className={styles.requestField}>
              <label className={styles.requestLabel} htmlFor="detail-check-in">
                {labels.arrival}
              </label>
              <input
                id="detail-check-in"
                className={styles.requestInput}
                type="date"
                min={today}
                required
                value={checkIn}
                disabled={isSubmitted}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  setCheckIn(nextCheckIn);
                  setSubmitError(null);
                  if (checkOut && nextCheckIn >= checkOut) {
                    setCheckOut("");
                  }
                }}
              />
            </div>

            <div className={`${styles.requestField} ${styles.requestFieldSplit}`}>
              <label className={styles.requestLabel} htmlFor="detail-check-out">
                {labels.departure}
              </label>
              <input
                id="detail-check-out"
                className={styles.requestInput}
                type="date"
                min={checkIn || today}
                required
                value={checkOut}
                disabled={isSubmitted}
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  setSubmitError(null);
                }}
              />
            </div>
          </div>

          <div className={styles.requestField}>
            <div className={styles.requestGuestRow}>
              <div>
                <div className={styles.requestLabel}>{labels.guests}</div>
                <span className={styles.requestValue}>
                  {guests} {guests === 1 ? labels.person : labels.people}
                </span>
              </div>

              <div className={styles.requestStepper}>
                <button
                  type="button"
                  disabled={isSubmitted ? true : guests <= minGuests}
                  onClick={() => {
                    setGuests((current) => Math.max(minGuests, current - 1));
                    setSubmitError(null);
                  }}
                  aria-label="Reducir huespedes"
                >
                  −
                </button>
                <span className={styles.requestValue}>{guests}</span>
                <button
                  type="button"
                  disabled={isSubmitted ? true : guests >= maxGuests}
                  onClick={() => {
                    setGuests((current) => Math.min(maxGuests, current + 1));
                    setSubmitError(null);
                  }}
                  aria-label="Aumentar huespedes"
                >
                  +
                </button>
              </div>
            </div>
            {isLockedGuestCount ? (
              <p className={styles.requestHelperText}>{labels.fixedGuestsCopy}</p>
            ) : null}
          </div>

          {hasAvailabilityConflict ? (
            <div className={styles.requestField}>
              <p className={styles.requestAvailabilityAlert}>{labels.blockedDatesConflictCopy}</p>
            </div>
          ) : null}

          <div className={styles.requestFieldsRow}>
            <div className={styles.requestField}>
              <label className={styles.requestLabel} htmlFor="detail-guest-name">
                {labels.guestName}
              </label>
              <input
                id="detail-guest-name"
                className={styles.requestInput}
                name="guestName"
                type="text"
                required
                value={guestName}
                disabled={isSubmitted}
                onChange={(event) => {
                  setGuestName(event.target.value);
                  setSubmitError(null);
                }}
              />
            </div>

            <div className={`${styles.requestField} ${styles.requestFieldSplit}`}>
              <label className={styles.requestLabel} htmlFor="detail-guest-email">
                {labels.guestEmail}
              </label>
              <input
                id="detail-guest-email"
                className={styles.requestInput}
                name="guestEmail"
                type="email"
                required
                value={guestEmail}
                disabled={isSubmitted}
                onChange={(event) => {
                  setGuestEmail(event.target.value);
                  setSubmitError(null);
                }}
              />
            </div>
          </div>

          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="detail-guest-phone">
              {labels.guestPhone}
            </label>
            <input
              id="detail-guest-phone"
              className={styles.requestInput}
              name="guestPhone"
              type="tel"
              value={guestPhone}
              disabled={isSubmitted}
              onChange={(event) => {
                setGuestPhone(event.target.value);
                setSubmitError(null);
              }}
            />
          </div>
        </div>

        {nights > 0 && hasKnownPrice ? (
          <div className={styles.requestSummary}>
            <div className={styles.requestSummaryRow}>
              <span>
                S/. {pricePerNight} × {nights}{" "}
                {nights === 1 ? labels.night : labels.nights}
              </span>
              <span>S/. {pricePerNight * nights}</span>
            </div>

            <div className={styles.requestSummaryRow}>
              <span>{labels.taxesIncluded}</span>
              <span>{labels.included}</span>
            </div>

            <div className={styles.requestSummaryTotal}>
              <span>{labels.total}</span>
              <strong>S/. {total}</strong>
            </div>
          </div>
        ) : null}

        <button
          className={`${styles.requestButton} ${isReady && !isSubmitting && !isSubmitted ? "" : styles.requestButtonDisabled}`}
          disabled={!isReady || isSubmitting || isSubmitted}
          type="submit"
        >
          {isSubmitted
            ? labels.requestCreated
            : isSubmitting
              ? `${requestLabel}...`
              : isReady
                ? requestLabel
                : selectDatesLabel}
        </button>

        {submitError === "occupancy_conflict" ? (
          <p className={styles.requestError}>{labels.blockedDatesConflictCopy}</p>
        ) : submitError ? (
          <p className={styles.requestError}>{labels.requestFailed}</p>
        ) : null}

        <div className={styles.requestFootnote}>
          <ShieldIcon />
          {proofNote ? <span>{proofNote}</span> : null}
        </div>

        <div className={styles.calloutBox}>
          <div className={styles.calloutLabelRow}>
            <PhoneIcon />
            <span>{labels.preferCall}</span>
          </div>
          <div className={styles.calloutPhone}>{labels.phone}</div>
          <div className={styles.calloutHours}>{labels.hours}</div>
        </div>
      </form>

      {submissionSuccess && isSuccessDialogOpen ? (
        <RequestSuccessDialog
          bookingRequestPublicRef={submissionSuccess.publicRef}
          deliveryStatus={submissionSuccess.deliveryStatus}
          onClose={() => setIsSuccessDialogOpen(false)}
          labels={labels}
          whatsappPhoneDisplay={whatsappPhoneDisplay}
          whatsappPhoneE164={whatsappPhoneE164}
        />
      ) : null}
    </>
  );
}
