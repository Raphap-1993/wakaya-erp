"use client";

import type { ReactNode } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MODULES } from "./admin-navigation";
import styles from "./admin-shell.module.css";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeModule =
    [...ADMIN_MODULES].sort((left, right) => right.href.length - left.href.length).find((module) =>
      pathname.startsWith(module.href),
    ) ?? ADMIN_MODULES[0];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Backoffice">
        <div className={styles.brandBlock}>
          <p className={styles.brandKicker}>Wakaya</p>
          <strong className={styles.brandTitle}>Backoffice</strong>
        </div>

        <nav className={styles.nav} aria-label="Módulos de administración">
          {ADMIN_MODULES.map((module) => {
            const isActive = module.href === activeModule.href;
            const href = module.href as ComponentProps<typeof Link>["href"];
            return (
              <Link
                key={module.href}
                className={isActive ? styles.navItemActive : styles.navItem}
                href={href}
                aria-current={isActive ? "page" : undefined}
              >
                {module.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.surface}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerKicker}>Administración</p>
            <h1 className={styles.headerTitle}>{activeModule.label}</h1>
            <p className={styles.headerMeta}>
              Navegación común para reservas, ocupación y módulos operativos futuros.
            </p>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
