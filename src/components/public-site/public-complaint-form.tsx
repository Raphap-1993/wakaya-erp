"use client";

import { type FormEvent, useState } from "react";

import styles from "./figma-public-pages.module.css";

type PublicComplaintFormProps = {
  labels: {
    formTitle: string;
    formCopy: string;
    type: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    email: string;
    phone: string;
    address: string;
    serviceType: string;
    contractedService: string;
    complaintDetail: string;
    consumerRequest: string;
    acceptedDeclaration: string;
    acceptedHelp: string;
    submit: string;
    submitting: string;
    error: string;
    successTitle: string;
    successCopy: string;
    successResponse: string;
  };
  options: {
    claim: string;
    complaint: string;
    documentTypes: Array<{ value: string; label: string }>;
    serviceTypes: Array<{ value: string; label: string }>;
  };
  placeholders: {
    fullName: string;
    documentNumber: string;
    email: string;
    phone: string;
    address: string;
    contractedService: string;
    complaintDetail: string;
    consumerRequest: string;
  };
};

type FormState = {
  type: "queja" | "reclamo";
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  contractedService: string;
  complaintDetail: string;
  consumerRequest: string;
  acceptedDeclaration: boolean;
};

const INITIAL_STATE: FormState = {
  type: "reclamo",
  fullName: "",
  documentType: "dni",
  documentNumber: "",
  email: "",
  phone: "",
  address: "",
  serviceType: "lodging",
  contractedService: "",
  complaintDetail: "",
  consumerRequest: "",
  acceptedDeclaration: false,
};

export function PublicComplaintForm({
  labels,
  options,
  placeholders,
}: PublicComplaintFormProps) {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }));
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.reportValidity() || isSubmitting || trackingCode) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/public/complaints", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formState),
      });
      const payload = (await response.json()) as {
        trackingCode?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.trackingCode) {
        throw new Error(payload.message || payload.error || "request_failed");
      }

      setTrackingCode(payload.trackingCode);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "request_failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.contactFormCard}>
      <div className={styles.cardHeaderCompact}>
        <h3 className={styles.cardTitleCompact}>{labels.formTitle}</h3>
        <p className={styles.cardCopyCompact}>{labels.formCopy}</p>
      </div>

      <form className={styles.contactForm} action="/api/public/complaints" method="post" onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="acceptedDeclaration" value="false" />
        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="complaintType">{labels.type}</label>
            <select
              id="complaintType"
              name="type"
              value={formState.type}
              disabled={Boolean(trackingCode)}
              onChange={(event) =>
                updateField("type", event.target.value as FormState["type"])
              }
            >
              <option value="reclamo">{options.claim}</option>
              <option value="queja">{options.complaint}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="complaintDocumentType">{labels.documentType}</label>
            <select
              id="complaintDocumentType"
              name="documentType"
              value={formState.documentType}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("documentType", event.target.value)}
            >
              {options.documentTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="complaintFullName">{labels.fullName}</label>
            <input
              id="complaintFullName"
              name="fullName"
              required
              type="text"
              placeholder={placeholders.fullName}
              value={formState.fullName}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="complaintDocumentNumber">{labels.documentNumber}</label>
            <input
              id="complaintDocumentNumber"
              name="documentNumber"
              required
              type="text"
              placeholder={placeholders.documentNumber}
              value={formState.documentNumber}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("documentNumber", event.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="complaintEmail">{labels.email}</label>
            <input
              id="complaintEmail"
              name="email"
              required
              type="email"
              placeholder={placeholders.email}
              value={formState.email}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="complaintPhone">{labels.phone}</label>
            <input
              id="complaintPhone"
              name="phone"
              type="tel"
              placeholder={placeholders.phone}
              value={formState.phone}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="complaintAddress">{labels.address}</label>
          <input
            id="complaintAddress"
            name="address"
            type="text"
            placeholder={placeholders.address}
            value={formState.address}
            disabled={Boolean(trackingCode)}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label htmlFor="complaintServiceType">{labels.serviceType}</label>
            <select
              id="complaintServiceType"
              name="serviceType"
              value={formState.serviceType}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("serviceType", event.target.value)}
            >
              {options.serviceTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="complaintContractedService">{labels.contractedService}</label>
            <input
              id="complaintContractedService"
              name="contractedService"
              type="text"
              placeholder={placeholders.contractedService}
              value={formState.contractedService}
              disabled={Boolean(trackingCode)}
              onChange={(event) => updateField("contractedService", event.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="complaintDetail">{labels.complaintDetail}</label>
          <textarea
            id="complaintDetail"
            name="complaintDetail"
            required
            rows={5}
            placeholder={placeholders.complaintDetail}
            value={formState.complaintDetail}
            disabled={Boolean(trackingCode)}
            onChange={(event) => updateField("complaintDetail", event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="complaintConsumerRequest">{labels.consumerRequest}</label>
          <textarea
            id="complaintConsumerRequest"
            name="consumerRequest"
            required
            rows={4}
            placeholder={placeholders.consumerRequest}
            value={formState.consumerRequest}
            disabled={Boolean(trackingCode)}
            onChange={(event) => updateField("consumerRequest", event.target.value)}
          />
        </div>

        <label className={styles.toggleField}>
          <input
            checked={formState.acceptedDeclaration}
            disabled={Boolean(trackingCode)}
            name="acceptedDeclaration"
            type="checkbox"
            value="true"
            onChange={(event) => updateField("acceptedDeclaration", event.target.checked)}
          />
          <span>{labels.acceptedDeclaration}</span>
        </label>
        <p className={styles.formHelper}>{labels.acceptedHelp}</p>

        <button
          className={`${styles.buttonLink} ${trackingCode ? styles.buttonLinkDisabled : ""}`}
          disabled={isSubmitting || Boolean(trackingCode)}
          type="submit"
        >
          {isSubmitting ? labels.submitting : trackingCode ? labels.successTitle : labels.submit}
        </button>

        {submitError ? <p className={styles.formError}>{labels.error}</p> : null}

        {trackingCode ? (
          <div className={styles.formSuccessCard}>
            <strong>{labels.successTitle}</strong>
            <p>{labels.successCopy}</p>
            <p>
              <strong>{trackingCode}</strong>
            </p>
            <p>{labels.successResponse}</p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
