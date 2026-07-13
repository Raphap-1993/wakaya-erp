"use client";

import { type FormEvent, useMemo, useState } from "react";

import type { CapacityAvailabilitySummary } from "@/lib/bungalow-capacity/types";

import styles from "./capacity.module.css";

type CapacityAdminItem = CapacityAvailabilitySummary & {
  displayName: string;
  guestCapacity: number | null;
  version: number;
  updatedAt: string;
};

function displayDate(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

async function parseResponse(response: Response) {
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw Object.assign(new Error(String(payload.error ?? "request_failed")), payload);
  return payload;
}

export function BungalowCapacityWorkbench({
  initialCheckIn,
  initialCheckOut,
  initialItems,
}: {
  initialCheckIn: string;
  initialCheckOut: string;
  initialItems: CapacityAdminItem[];
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<CapacityAdminItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const totalPhysical = useMemo(() => items.reduce((sum, item) => sum + item.totalUnits, 0), [items]);

  async function refresh(nextCheckIn = checkIn, nextCheckOut = checkOut) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/bungalow-capacity?checkIn=${encodeURIComponent(nextCheckIn)}&checkOut=${encodeURIComponent(nextCheckOut)}`,
      );
      const payload = await parseResponse(response);
      setItems(payload.items as CapacityAdminItem[]);
    } finally {
      setBusy(false);
    }
  }

  async function consult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await refresh();
    } catch {
      setError("No se pudo consultar el rango.");
    }
  }

  async function saveTotal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItem) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/bungalow-capacity/${selectedItem.bungalowTypeId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          totalUnits: Number(form.get("totalUnits")),
          expectedVersion: selectedItem.version,
        }),
      });
      await parseResponse(response);
      setSelectedItem(null);
      setMessage("Total actualizado.");
      await refresh();
    } catch (caught) {
      const details = caught as Error & { minimumRequired?: number; conflictDates?: string[] };
      setError(
        details.message === "capacity_below_commitments"
          ? `Se requieren al menos ${details.minimumRequired ?? 0} cupos. Fechas: ${(details.conflictDates ?? []).join(", ")}.`
          : "No se pudo actualizar el total.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Wakaya · operación</p>
          <h1>Cupos de bungalows</h1>
        </div>
        <div className={styles.totalCard}>
          <span>Total físico</span>
          <strong>{totalPhysical}</strong>
        </div>
      </header>

      <form className={styles.filters} onSubmit={consult}>
        <label>
          <span>Check-in</span>
          <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
        </label>
        <label>
          <span>Checkout</span>
          <input type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} required />
        </label>
        <button className={styles.primaryButton} type="submit" disabled={busy || checkOut <= checkIn}>
          {busy ? "Consultando…" : "Consultar"}
        </button>
      </form>

      {(message || error) && (
        <div className={error ? styles.errorBanner : styles.successBanner} role="status">
          {error || message}
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Disponibilidad por categoría</h2>
            <p>Conteos de la noche con menor disponibilidad.</p>
          </div>
          <span className={styles.rangeBadge}>{displayDate(checkIn)}–{displayDate(checkOut)}</span>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Total físico</th>
                <th>Fecha crítica</th>
                <th>Reservadas</th>
                <th>Disponibles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.bungalowTypeId}>
                  <td data-label="Categoría">
                    <strong>{item.displayName}</strong>
                    <small>Hasta {item.guestCapacity ?? "—"} huéspedes</small>
                  </td>
                  <td data-label="Total físico">{item.totalUnits}</td>
                  <td data-label="Fecha crítica"><strong>{displayDate(item.criticalDate)}</strong></td>
                  <td data-label="Reservadas">{item.confirmedOnCriticalDate}</td>
                  <td data-label="Disponibles">
                    <span className={item.availableUnitsForStay === 0 ? styles.soldOut : styles.available}>
                      {item.availableUnitsForStay === 0 ? "Agotado" : item.availableUnitsForStay}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <button type="button" className={styles.secondaryButton} onClick={() => setSelectedItem(item)}>
                      Editar total
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedItem && (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedItem(null)}>
          <aside className={styles.drawer} aria-label="Editar total">
            <div className={styles.drawerHeader}>
              <div><p>{selectedItem.displayName}</p><h2>Editar total</h2></div>
              <button type="button" className={styles.closeButton} onClick={() => setSelectedItem(null)} aria-label="Cerrar">×</button>
            </div>
            <form className={styles.drawerForm} onSubmit={saveTotal}>
              <label><span>Total físico</span><input name="totalUnits" type="number" min="0" defaultValue={selectedItem.totalUnits} required /></label>
              <button className={styles.primaryButton} type="submit" disabled={busy}>Guardar total</button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
