"use client";

import type { CSSProperties, ReactNode } from "react";
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
    <div
      className={styles.shell}
      style={
        {
          ["--admin-brand" as never]: "#1f4e79",
          ["--admin-brand-dark" as never]: "#163a5c",
          ["--admin-brand-light" as never]: "#e7f1fb",
          ["--admin-brand-soft" as never]: "#d4e7f6",
          ["--admin-ink" as never]: "#102033",
          ["--admin-surface" as never]: "rgba(255, 255, 255, 0.92)",
          ["--admin-border" as never]: "rgba(203, 213, 225, 0.9)",
          ["--admin-muted" as never]: "#64748b",
          ["--admin-muted-2" as never]: "#475569",
          ["--admin-success" as never]: "#0f766e",
          ["--admin-success-soft" as never]: "#d1fae5",
          ["--admin-warning" as never]: "#b45309",
          ["--admin-warning-soft" as never]: "#fef3c7",
          ["--admin-danger" as never]: "#b91c1c",
          ["--admin-danger-soft" as never]: "#fee2e2",
        } as CSSProperties
      }
    >
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
