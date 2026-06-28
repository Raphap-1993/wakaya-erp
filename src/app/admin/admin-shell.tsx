"use client";

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MODULES } from "./admin-navigation";
import styles from "./admin-shell.module.css";

function ShellIcon({ icon }: { icon: (typeof ADMIN_MODULES)[number]["icon"] }) {
  const common = {
    className: styles.quickIcon,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icon) {
    case "reservations":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M8 3.5v3" />
          <path d="M16 3.5v3" />
          <path d="M3.5 9.5h17" />
        </svg>
      );
    case "occupancy":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8" />
          <path d="M14.5 9.8c0-1.2-1.1-2.2-2.5-2.2s-2.5 1-2.5 2.2S10.1 12 12 12s2.5 1 2.5 2.2-1.1 2.2-2.5 2.2-2.5-1-2.5-2.2" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M5 18V6" />
          <path d="M5 18h14" />
          <path d="M8 14l3-3 2 2 4-5" />
          <path d="M17 8h-2" />
        </svg>
      );
    case "settings":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 3.5v2.2" />
          <path d="M12 18.3v2.2" />
          <path d="M3.5 12h2.2" />
          <path d="M18.3 12h2.2" />
          <path d="M6.1 6.1l1.6 1.6" />
          <path d="M16.3 16.3l1.6 1.6" />
          <path d="M6.1 17.9l1.6-1.6" />
          <path d="M16.3 7.7l1.6-1.6" />
        </svg>
      );
  }
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeModule =
    [...ADMIN_MODULES].sort((left, right) => right.href.length - left.href.length).find((module) =>
      pathname.startsWith(module.href),
    ) ?? ADMIN_MODULES[0];

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
    };

    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      html.style.height = previous.htmlHeight;
      body.style.height = previous.bodyHeight;
    };
  }, []);

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
        <div className={styles.frame}>
          <header className={styles.header}>
            <nav className={styles.quickNav} aria-label="Accesos rápidos">
              {ADMIN_MODULES.map((module) => {
                const isActive = module.href === activeModule.href;
                const href = module.href as ComponentProps<typeof Link>["href"];
                return (
                  <Link
                    key={module.href}
                    className={isActive ? styles.quickNavItemActive : styles.quickNavItem}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={module.label}
                    title={module.label}
                  >
                    <ShellIcon icon={module.icon} />
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}
