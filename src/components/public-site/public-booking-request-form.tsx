"use client";

import { type FormEvent, useMemo, useState } from "react";

import styles from "./figma-public-pages.module.css";
import { RequestSuccessDialog } from "./figma-room-request-card";
import type {
  PublicAvailabilityAlternative,
  PublicAvailabilityAlternativeDate,
} from "@/lib/bungalow-capacity/public-availability";

type RequestDeliveryStatus = "queued_without_provider" | "sent";

type PublicBookingRequestFormProps = {
  requestedBungalowType?: string;
  requestedExperienceId?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedGuests?: string;
  guestOptions: Array<{ label: string; value: number }>;
  whatsappPhoneDisplay?: string;
  whatsappPhoneE164?: string;
  labels: {
    name: string;
    email: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    message: string;
    submit: string;
    requestCreated: string;
    requestCreatedCopy: string;
    requestEmailSentCopy: string;
    requestEmailQueuedCopy: string;
    whatsappLabel: string;
    whatsappPrompt: string;
    whatsappButton: string;
    whatsappPrefillTemplate: string;
    closeModal: string;
    requestFailed: string;
    availabilityUnavailableTitle: string;
    availabilityUnavailableCopy: string;
    availabilityAlternativesLabel: string;
    availabilityAlternativeDatesLabel: string;
    availabilityApplyDatesLabel: string;
  };
  placeholders: {
    name: string;
    email: string;
    message: string;
  };
};

type SubmissionSuccess = {
  publicRef: string;
  deliveryStatus: RequestDeliveryStatus;
};

type AvailabilityIssue = {
  message: string;
  alternatives: PublicAvailabilityAlternative[];
  alternativeDates: PublicAvailabilityAlternativeDate[];
};

function formatAlternativeType(item: PublicAvailabilityAlternative) {
  const suffix = item.availableUnitCount === 1 ? "1 disponible" : `${item.availableUnitCount} disponibles`;
  return `${item.displayName} · ${suffix}`;
}

function formatAlternativeDate(item: PublicAvailabilityAlternativeDate) {
  const suffix = item.availableUnitCount === 1 ? "1 disponible" : `${item.availableUnitCount} disponibles`;
  return `${item.checkIn} → ${item.checkOut} · ${suffix}`;
}

export function AvailabilityRetryNotice({
  message,
  alternatives,
  alternativeDates,
  labels,
  onSelectDate,
}: {
  message: string;
  alternatives: PublicAvailabilityAlternative[];
  alternativeDates: PublicAvailabilityAlternativeDate[];
  labels: {
    availabilityUnavailableTitle: string;
    availabilityAlternativesLabel: string;
    availabilityAlternativeDatesLabel: string;
    availabilityApplyDatesLabel: string;
  };
  onSelectDate?: (item: PublicAvailabilityAlternativeDate) => void;
}) {
  return (
    <div className={styles.formAvailabilityCard} role="alert">
      <strong>{labels.availabilityUnavailableTitle}</strong>
      <p className={styles.formAvailabilityCopy}>{message}</p>

      {alternatives.length > 0 ? (
        <div className={styles.formAvailabilityGroup}>
          <span className={styles.formAvailabilityLabel}>{labels.availabilityAlternativesLabel}</span>
          <div className={styles.chipGrid}>
            {alternatives.map((item) => (
              <span key={item.bungalowTypeId} className={styles.chip}>
                <span className={styles.chipDot} aria-hidden="true" />
                {formatAlternativeType(item)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {alternativeDates.length > 0 ? (
        <div className={styles.formAvailabilityGroup}>
          <span className={styles.formAvailabilityLabel}>{labels.availabilityAlternativeDatesLabel}</span>
          <div className={styles.formAvailabilityActions}>
            {alternativeDates.map((item) => (
              <button
                key={`${item.checkIn}-${item.checkOut}`}
                className={styles.formAvailabilityButton}
                type="button"
                onClick={() => onSelectDate?.(item)}
              >
                <span>{formatAlternativeDate(item)}</span>
                <strong>{labels.availabilityApplyDatesLabel}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getInitialGuestValue(
  requestedGuests: string | undefined,
  guestOptions: Array<{ label: string; value: number }>,
) {
  const preferredValue = Number.parseInt(requestedGuests ?? "", 10);
  if (Number.isFinite(preferredValue) && guestOptions.some((option) => option.value === preferredValue)) {
    return String(preferredValue);
  }

  return String(guestOptions[0]?.value ?? 1);
}

export function PublicBookingRequestForm({
  requestedBungalowType,
  requestedExperienceId,
  requestedCheckIn = "",
  requestedCheckOut = "",
  requestedGuests,
  guestOptions,
  whatsappPhoneDisplay,
  whatsappPhoneE164,
  labels,
  placeholders,
}: PublicBookingRequestFormProps) {
  const [checkIn, setCheckIn] = useState(requestedCheckIn);
  const [checkOut, setCheckOut] = useState(requestedCheckOut);
  const [guests, setGuests] = useState(getInitialGuestValue(requestedGuests, guestOptions));
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availabilityIssue, setAvailabilityIssue] = useState<AvailabilityIssue | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccess | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0] ?? "", []);
  const isSubmitted = Boolean(submissionSuccess);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity() || isSubmitting || isSubmitted) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setAvailabilityIssue(null);

    try {
      const response = await fetch("/api/public/booking-requests", {
        method: "POST",
        body: new FormData(form),
      });

      const payload = (await response.json()) as {
        bookingRequest?: { publicRef?: string };
        delivery?: { status?: RequestDeliveryStatus };
        message?: string;
        error?: string;
        alternatives?: PublicAvailabilityAlternative[];
        alternativeDates?: PublicAvailabilityAlternativeDate[];
      };

      if (!response.ok || !payload.bookingRequest?.publicRef) {
        if (payload.error === "bungalow_type_unavailable") {
          setAvailabilityIssue({
            message: payload.message || labels.availabilityUnavailableCopy,
            alternatives: Array.isArray(payload.alternatives) ? payload.alternatives : [],
            alternativeDates: Array.isArray(payload.alternativeDates) ? payload.alternativeDates : [],
          });
          return;
        }

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
      <form
        className={styles.contactForm}
        action="/api/public/booking-requests"
        method="post"
        onSubmit={handleSubmit}
      >
        {requestedBungalowType ? (
          <input
            className={styles.hiddenField}
            name="requestedBungalowType"
            readOnly
            type="hidden"
            value={requestedBungalowType}
          />
        ) : null}

        {requestedExperienceId ? (
          <input
            className={styles.hiddenField}
            name="requestedExperienceId"
            readOnly
            type="hidden"
            value={requestedExperienceId}
          />
        ) : null}

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="guestName">{labels.name}</label>
            <input
              id="guestName"
              name="guestName"
              placeholder={placeholders.name}
              required
              type="text"
              value={guestName}
              disabled={isSubmitted}
              onChange={(event) => {
                setGuestName(event.target.value);
                setSubmitError(null);
                setAvailabilityIssue(null);
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="guestEmail">{labels.email}</label>
            <input
              id="guestEmail"
              name="guestEmail"
              placeholder={placeholders.email}
              required
              type="email"
              value={guestEmail}
              disabled={isSubmitted}
              onChange={(event) => {
                setGuestEmail(event.target.value);
                setSubmitError(null);
                setAvailabilityIssue(null);
              }}
            />
          </div>
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="requestedCheckIn">{labels.checkIn}</label>
            <input
              id="requestedCheckIn"
              name="requestedCheckIn"
              required
              type="date"
              min={today}
              value={checkIn}
              disabled={isSubmitted}
              onChange={(event) => {
                const nextCheckIn = event.target.value;
                setCheckIn(nextCheckIn);
                setSubmitError(null);
                setAvailabilityIssue(null);
                if (checkOut && nextCheckIn > checkOut) {
                  setCheckOut("");
                }
              }}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="requestedCheckOut">{labels.checkOut}</label>
            <input
              id="requestedCheckOut"
              name="requestedCheckOut"
              required
              type="date"
              min={checkIn || today}
              value={checkOut}
              disabled={isSubmitted}
              onChange={(event) => {
                setCheckOut(event.target.value);
                setSubmitError(null);
                setAvailabilityIssue(null);
              }}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="requestedGuests">{labels.guests}</label>
          <select
            id="requestedGuests"
            name="requestedGuests"
            value={guests}
            disabled={isSubmitted}
            onChange={(event) => {
              setGuests(event.target.value);
              setSubmitError(null);
              setAvailabilityIssue(null);
            }}
          >
            {guestOptions.map((option) => (
              <option key={`${option.value}-${option.label}`} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="notes">{labels.message}</label>
          <textarea
            id="notes"
            name="notes"
            placeholder={placeholders.message}
            rows={5}
            value={notes}
            disabled={isSubmitted}
            onChange={(event) => {
              setNotes(event.target.value);
              setSubmitError(null);
              setAvailabilityIssue(null);
            }}
          />
        </div>

        <button
          className={`${styles.buttonLink} ${isSubmitting || isSubmitted ? styles.buttonLinkDisabled : ""}`}
          disabled={isSubmitting || isSubmitted}
          type="submit"
        >
          {isSubmitted ? labels.requestCreated : isSubmitting ? `${labels.submit}...` : labels.submit}
        </button>

        {availabilityIssue ? (
          <AvailabilityRetryNotice
            message={availabilityIssue.message}
            alternatives={availabilityIssue.alternatives}
            alternativeDates={availabilityIssue.alternativeDates}
            labels={{
              availabilityUnavailableTitle: labels.availabilityUnavailableTitle,
              availabilityAlternativesLabel: labels.availabilityAlternativesLabel,
              availabilityAlternativeDatesLabel: labels.availabilityAlternativeDatesLabel,
              availabilityApplyDatesLabel: labels.availabilityApplyDatesLabel,
            }}
            onSelectDate={(item) => {
              setCheckIn(item.checkIn);
              setCheckOut(item.checkOut);
              setAvailabilityIssue(null);
              setSubmitError(null);
            }}
          />
        ) : null}

        {submitError ? <p className={styles.formError}>{labels.requestFailed}</p> : null}
      </form>

      {submissionSuccess && isSuccessDialogOpen ? (
        <RequestSuccessDialog
          bookingRequestPublicRef={submissionSuccess.publicRef}
          deliveryStatus={submissionSuccess.deliveryStatus}
          onClose={() => setIsSuccessDialogOpen(false)}
          labels={{
            requestCreated: labels.requestCreated,
            requestCreatedCopy: labels.requestCreatedCopy,
            requestEmailSentCopy: labels.requestEmailSentCopy,
            requestEmailQueuedCopy: labels.requestEmailQueuedCopy,
            whatsappLabel: labels.whatsappLabel,
            whatsappPrompt: labels.whatsappPrompt,
            whatsappButton: labels.whatsappButton,
            whatsappPrefillTemplate: labels.whatsappPrefillTemplate,
            closeModal: labels.closeModal,
          }}
          whatsappPhoneDisplay={whatsappPhoneDisplay}
          whatsappPhoneE164={whatsappPhoneE164}
        />
      ) : null}
    </>
  );
}
