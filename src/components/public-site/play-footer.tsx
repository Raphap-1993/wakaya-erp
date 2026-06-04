import Link from 'next/link';

import { footerContact, publicNav } from './public-site-data';
import styles from './public-site-theme.module.css';

export function PlayFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.footerCard} ${styles.footerIntro}`}>
        <strong>Wakaya Ecolodge</strong>
        <p>
          Capa pública multipágina con arquitectura real de Wakaya y lenguaje visual
          premium inspirado en Parador.
        </p>
      </div>

      <div className={styles.footerCard}>
        <div className={styles.footerColumn}>
          <h4>Explora</h4>
          <ul>
            {publicNav.slice(0, 4).map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.footerCard}>
        <div className={styles.footerColumn}>
          <h4>Reserva</h4>
          <ul>
            <li><span>Disponibilidad referencial</span></li>
            <li><span>Validación manual de la solicitud</span></li>
            <li><span>Pago coordinado por el equipo Wakaya</span></li>
          </ul>
        </div>
      </div>

      <div className={styles.footerCard}>
        <div className={styles.footerColumn}>
          <h4>Contacto</h4>
          <ul>
            <li><span>{footerContact.place}</span></li>
            <li><span>{footerContact.domain}</span></li>
            <li><span>{footerContact.note}</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
