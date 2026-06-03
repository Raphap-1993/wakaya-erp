'use client';

import { useState } from 'react';

import styles from './public-site-theme.module.css';

const navItems = [
  { label: 'Inicio', href: '#home' },
  { label: 'Bungalows', href: '#bungalows' },
  { label: 'Experiencias', href: '#activities' },
  { label: 'Eventos', href: '#events' },
];

export function PlayHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>W</span>
        <div className={styles.brandCopy}>
          <small>Pucallpa · Perú</small>
          <strong>Wakaya Ecolodge</strong>
        </div>
      </div>

      <button
        className={styles.menuButton}
        type="button"
        aria-expanded={open}
        aria-label="Abrir navegación"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
      </button>

      <div className={`${styles.navWrap} ${open ? styles.navOpen : ''}`}>
        <nav className={styles.nav} aria-label="Navegación del prototipo público">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className={styles.headerCta} href="#booking" onClick={() => setOpen(false)}>
          Consultar
        </a>
      </div>
    </header>
  );
}
