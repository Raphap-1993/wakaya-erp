"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Bungalow } from "@/lib/reservations/types";
import type { ReservationDetail } from "@/lib/reservations/store";
import styles from "./reservations.module.css";
import { formatMoneyCents } from "./reservations-monitor-shared";
import type { ReservationEditorValues } from "./reservation-editor-values";

type ReservationEditorMode = "create" | "edit";

type ReservationEditorFormProps = {
  mode: ReservationEditorMode;
  actionHref: string;
  backHref: string;
  bungalows: Bungalow[];
  initialValues: ReservationEditorValues;
  reservation?: ReservationDetail | null;
};

const MODE_COPY: Record<
  ReservationEditorMode,
  {
    eyebrow: string;
    title: string;
    submitLabel: string;
  }
> = {
  create: {
    eyebrow: "Wakaya · alta manual",
    title: "Nueva reserva manual",
    submitLabel: "Crear reserva",
  },
  edit: {
    eyebrow: "Wakaya · edición manual",
    title: "Editar reserva",
    submitLabel: "Guardar cambios",
  },
};

function parseMoneyInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

function asLabel(amount: string): string {
  const parsed = parseMoneyInput(amount);
  return parsed === undefined ? "Automático" : formatMoneyCents(parsed);
}

export function ReservationEditorForm({
  mode,
  actionHref,
  backHref,
  bungalows,
  initialValues,
  reservation,
}: ReservationEditorFormProps) {
  const [values, setValues] = useState(initialValues);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeBungalows = useMemo(
    () => bungalows.filter((bungalow) => bungalow.active),
    [bungalows],
  );

  const copy = MODE_COPY[mode];

  const handleChange = (key: keyof ReservationEditorValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setFeedback(null);
    setIsSubmitting(true);

    const payload = {
      channel: values.channel,
      bungalowId: values.bungalowId,
      startDate: values.startDate,
      endDate: values.endDate,
      amountTotalCents: parseMoneyInput(values.amountTotal),
      amountPaidCents: parseMoneyInput(values.amountPaid),
    };

    const requestBody =
      mode === "create"
        ? { number: values.number.trim(), ...payload }
        : payload;

    try {
      const response = await fetch(actionHref, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message ?? body.reason ?? body.error ?? "No se pudo guardar la reserva");
      }

      const reservationId =
        (body?.reservation?.id as string | undefined) ??
        (mode === "edit" && reservation ? reservation.id : undefined);
      if (!reservationId) {
        throw new Error("No se pudo resolver la reserva guardada");
      }

      setFeedback({
        kind: "success",
        message: mode === "create" ? "Reserva creada correctamente." : "Reserva actualizada correctamente.",
      });
      window.setTimeout(() => {
        window.location.assign(`/admin/reservations/${reservationId}`);
      }, 450);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "No se pudo guardar la reserva",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title}>{copy.title}</h1>

          <div className={styles.heroActions}>
            <Link className={`${styles.button} ${styles.buttonSecondary}`} href={backHref as never}>
              Volver al monitor
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.detailGrid}>
            <article className={styles.sectionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Datos de reserva</h2>
              </div>

              {feedback ? (
                <p
                  className={`${styles.feedbackBanner} ${
                    feedback.kind === "success" ? styles.feedbackSuccess : styles.feedbackError
                  }`}
                >
                  {feedback.message}
                </p>
              ) : null}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Número</span>
                    <input
                      className={styles.input}
                      name="number"
                      value={values.number}
                      onChange={handleChange("number")}
                      readOnly={mode === "edit"}
                      required
                    />
                    {mode === "edit" ? (
                      <span className={styles.fieldNote}>Código fijo después de crear la reserva.</span>
                    ) : null}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Canal</span>
                    <select
                      className={styles.select}
                      name="channel"
                      value={values.channel}
                      onChange={handleChange("channel")}
                      required
                    >
                      <option value="web">Web</option>
                      <option value="ota">OTA</option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Bungalow</span>
                    <select
                      className={styles.select}
                      name="bungalowId"
                      value={values.bungalowId}
                      onChange={handleChange("bungalowId")}
                      required
                    >
                      <option value="" disabled>
                        Bungalow
                      </option>
                      {activeBungalows.map((bungalow) => (
                        <option key={bungalow.id} value={bungalow.id}>
                          {bungalow.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Fecha de ingreso</span>
                    <input
                      className={styles.input}
                      name="startDate"
                      type="date"
                      value={values.startDate}
                      onChange={handleChange("startDate")}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Fecha de salida</span>
                    <input
                      className={styles.input}
                      name="endDate"
                      type="date"
                      value={values.endDate}
                      onChange={handleChange("endDate")}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Monto total</span>
                    <input
                      className={styles.input}
                      name="amountTotal"
                      inputMode="decimal"
                      value={values.amountTotal}
                      onChange={handleChange("amountTotal")}
                      placeholder="Automático"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Monto pagado</span>
                    <input
                      className={styles.input}
                      name="amountPaid"
                      inputMode="decimal"
                      value={values.amountPaid}
                      onChange={handleChange("amountPaid")}
                      placeholder="0.00"
                    />
                  </label>
                </div>

                <div className={styles.buttonRow}>
                  <button className={styles.button} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : copy.submitLabel}
                  </button>
                  <Link className={`${styles.button} ${styles.buttonSecondary}`} href={backHref as never}>
                    Cancelar
                  </Link>
                </div>
              </form>
            </article>

            <aside className={styles.actions}>
              <article className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Vista previa</h2>
                </div>
                <div className={styles.kvGrid}>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Número</span>
                    <span className={styles.kvValue}>{values.number || "Sin número"}</span>
                  </div>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Canal</span>
                    <span className={styles.kvValue}>{values.channel === "web" ? "Web" : "OTA"}</span>
                  </div>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Total</span>
                    <span className={styles.kvValue}>{asLabel(values.amountTotal)}</span>
                  </div>
                  <div className={styles.kv}>
                    <span className={styles.kvLabel}>Pagado</span>
                    <span className={styles.kvValue}>{asLabel(values.amountPaid)}</span>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
