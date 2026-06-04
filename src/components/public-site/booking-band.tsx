'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { publicBungalows } from './public-site-data';
import styles from './public-site-theme.module.css';

const ALL_CATEGORIES_VALUE = 'all';
const roomOptions = publicBungalows.flatMap((bungalow) =>
  bungalow.bookingRequestBungalowId
    ? [
        {
          bungalowId: bungalow.bookingRequestBungalowId,
          label: bungalow.homeName ?? bungalow.name,
        },
      ]
    : [],
);
const defaultBungalowId = roomOptions[0]?.bungalowId ?? '';

export function BookingBand() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('La web muestra capacidad y tarifa base. La confirmación final y el pago se coordinan manualmente con Wakaya.');
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('2026-06-12');
  const [checkOut, setCheckOut] = useState('2026-06-14');
  const [guests, setGuests] = useState('2 huéspedes');
  const [room, setRoom] = useState(ALL_CATEGORIES_VALUE);

  const derivedBungalowId = useMemo(() => {
    return room === ALL_CATEGORIES_VALUE ? defaultBungalowId : room;
  }, [room]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('Enviando prereserva...');
    setReservationNumber(null);

    const payload = {
      bungalowId: derivedBungalowId,
      startDate: checkIn,
      endDate: checkOut,
    };

    try {
      const response = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(error?.message ?? error?.error ?? 'No se pudo registrar la prereserva.');
      }

      const body = (await response.json()) as { reservation?: { number?: string } };
      setReservationNumber(body.reservation?.number ?? null);
      setStatus('success');
      setMessage('Prereserva enviada. Wakaya la revisará y coordinará la confirmación por transferencia.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la prereserva.');
    }
  }

  return (
    <section className={styles.bookingBand} id="booking">
      <div className={styles.bookingIntro}>
        <strong>Disponibilidad referencial</strong>
        <p>{message}</p>
        {status === 'success' ? (
          <p className={styles.bookingSuccess}>
            La prereserva quedó registrada con estado <strong>pending_review</strong>
            {reservationNumber ? (
              <>
                {' '}
                y número <strong>{reservationNumber}</strong>.
              </>
            ) : (
              '.'
            )}
          </p>
        ) : null}
      </div>

      <form className={styles.bookingForm} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="checkin">Check in</label>
          <input id="checkin" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="checkout">Check out</label>
          <input id="checkout" type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="guests">Personas</label>
          <select id="guests" value={guests} onChange={(event) => setGuests(event.target.value)}>
            <option>2 huéspedes</option>
            <option>3 huéspedes</option>
            <option>4 huéspedes</option>
            <option>5 huéspedes</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="room">Habitación</label>
          <select id="room" value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value={ALL_CATEGORIES_VALUE}>Todas las categorías</option>
            {roomOptions.map((option) => (
              <option key={option.bungalowId} value={option.bungalowId}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className={styles.primaryButton} type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando...' : 'Consultar'}
        </button>

        <a className={styles.bookingLink} href="/admin/reservations">
          Revisar monitor interno
        </a>
      </form>
    </section>
  );
}
