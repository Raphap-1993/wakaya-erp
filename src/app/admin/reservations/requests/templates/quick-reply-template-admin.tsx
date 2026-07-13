"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import styles from "../../reservations.module.css";
import type { QuickReplyTemplate } from "@/lib/reservations/types";

type Props = {
  items: QuickReplyTemplate[];
};

export function QuickReplyTemplateAdmin({ items }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/reservations/reply-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: String(formData.get("key") ?? ""),
          label: String(formData.get("label") ?? ""),
          category: String(formData.get("category") ?? ""),
          subjectMode: String(formData.get("subjectMode") ?? "keep_thread_subject"),
          bodyText: String(formData.get("bodyText") ?? ""),
          sortOrder: Number(formData.get("sortOrder") ?? 0),
          isActive: true,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string; message?: string };
        setError(body.message ?? body.error ?? "No se pudo guardar la plantilla.");
        return;
      }
      event.currentTarget.reset();
      refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.detailStack}>
      <section className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h1 className={styles.cardTitle}>Plantillas rápidas</h1>
            <p className={styles.cardCopy}>Compartidas por el equipo de reservas.</p>
          </div>
          <a className={`${styles.button} ${styles.buttonSecondary}`} href="/admin/reservations/requests">
            Volver al inbox
          </a>
        </div>

        {error ? <p className={`${styles.feedbackBanner} ${styles.feedbackError}`}>{error}</p> : null}

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Key</span>
              <input className={styles.input} name="key" required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Label</span>
              <input className={styles.input} name="label" required />
            </label>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Categoría</span>
              <input className={styles.input} name="category" required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Orden</span>
              <input className={styles.input} name="sortOrder" type="number" min="0" defaultValue="40" required />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Modo de asunto</span>
            <select className={styles.select} name="subjectMode" defaultValue="keep_thread_subject">
              <option value="keep_thread_subject">Mantener asunto del hilo</option>
              <option value="custom_subject">Asunto propio</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Texto</span>
            <textarea className={`${styles.textarea} ${styles.textareaTall}`} name="bodyText" required />
          </label>
          <button className={styles.button} type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Crear plantilla"}
          </button>
        </form>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Plantillas activas</h2>
          </div>
        </div>
        <div className={styles.stack}>
          {items.map((item) => (
            <div key={item.id} className={styles.formNoteItem}>
              <div className={styles.buttonRow}>
                <strong>{item.label}</strong>
                <span className={`${styles.badge} ${item.isActive ? styles.statusConfirmed : styles.statusCancelled}`}>
                  {item.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className={styles.helper}>
                {item.category} · {item.key} · orden {item.sortOrder}
              </div>
              <div className={styles.helper}>{item.bodyText}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
