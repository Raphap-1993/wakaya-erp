'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { publicNav } from './public-site-data';
import styles from './public-site-theme.module.css';

export function PlayHeader() {
  const pathname = usePathname();
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
        <nav className={styles.nav} aria-label="Navegación pública Wakaya">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className={styles.headerCta}
          href={'/prototype/public-site/bungalows' as Route}
          onClick={() => setOpen(false)}
        >
          Reservar ahora
        </Link>
      </div>
    </header>
  );
}
