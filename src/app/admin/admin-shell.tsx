"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MODULES, adminModulesForRoles } from "./admin-navigation";
import type { AdminNotifications } from "./admin-notifications";
import { InfoTooltip } from "./info-tooltip";
import { ROLE_LABELS, sanitizeRoles } from "@/lib/rbac";
import styles from "./admin-shell.module.css";

const ADMIN_SIDEBAR_COLLAPSED_KEY = "wakaya-admin-sidebar-collapsed";

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
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 12.5h6.5V4H4Z" />
          <path d="M13.5 20h6.5v-9h-6.5Z" />
          <path d="M13.5 10.5h6.5V4h-6.5Z" />
          <path d="M4 20h6.5v-4.5H4Z" />
        </svg>
      );
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
    case "reports":
      return (
        <svg {...common}>
          <path d="M5 18V6" />
          <path d="M5 18h14" />
          <path d="M8 14l3-3 2 2 4-5" />
          <path d="M17 8h-2" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 20v-1.2a3.8 3.8 0 0 0-3.8-3.8H8.8A3.8 3.8 0 0 0 5 18.8V20" />
          <circle cx="10.5" cy="8" r="3.2" />
          <path d="M18.2 8.5h2.3" />
          <path d="M19.35 7.35v2.3" />
        </svg>
      );
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

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={styles.quickIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M9 5v14" />
      {collapsed ? <path d="m12.5 12 3-2.5v5Z" /> : <path d="m15.5 12-3-2.5v5Z" />}
    </svg>
  );
}

function NotificationBellIcon() {
  return (
    <svg
      className={styles.quickIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M8.5 18h7" />
      <path d="M10 20.2a2.2 2.2 0 0 0 4 0" />
      <path d="M6 16.5h12l-1.5-2.1v-4a4.5 4.5 0 1 0-9 0v4Z" />
    </svg>
  );
}

function notificationToneLabel(tone: AdminNotifications["items"][number]["tone"]): string {
  switch (tone) {
    case "critical":
      return "Crítico";
    case "warning":
      return "Seguimiento";
    default:
      return "Info";
  }
}

export default function AdminShell({
  children,
  roles = [],
  operatorLabel = null,
  notifications,
}: {
  children: ReactNode;
  roles?: readonly string[];
  operatorLabel?: string | null;
  notifications?: AdminNotifications;
}) {
  const pathname = usePathname();
  const visibleModules = adminModulesForRoles(roles);
  const roleBadges = sanitizeRoles(roles);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notificationPanelStyle, setNotificationPanelStyle] = useState<CSSProperties>({});
  const notificationWrapRef = useRef<HTMLDivElement | null>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeModule =
    [...visibleModules].sort((left, right) => right.href.length - left.href.length).find((module) =>
      pathname.startsWith(module.href),
    ) ?? visibleModules[0] ?? ADMIN_MODULES[0];

  useEffect(() => {
    setIsNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const updateNotificationPosition = () => {
      const button = notificationButtonRef.current;
      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const width = Math.min(380, window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setNotificationPanelStyle({
        top: rect.bottom + 10,
        left,
        width,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationWrapRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    updateNotificationPosition();
    window.addEventListener("resize", updateNotificationPosition);
    window.addEventListener("scroll", updateNotificationPosition, true);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateNotificationPosition);
      window.removeEventListener("scroll", updateNotificationPosition, true);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

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

  useEffect(() => {
    try {
      const storedPreference = window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
      setIsSidebarCollapsed(storedPreference === "1");
    } catch {
      setIsSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, isSidebarCollapsed ? "1" : "0");
    } catch {
      // Ignore storage failures on restricted browsers.
    }
  }, [isSidebarCollapsed]);

  return (
    <div
      className={isSidebarCollapsed ? `${styles.shell} ${styles.shellCollapsed}` : styles.shell}
      style={
        {
          ["--admin-brand" as never]: "#4f96dc",
          ["--admin-brand-dark" as never]: "#1c4f80",
          ["--admin-brand-light" as never]: "#e9f5ff",
          ["--admin-brand-soft" as never]: "#d8edff",
          ["--admin-accent" as never]: "#6ac7d9",
          ["--admin-accent-soft" as never]: "rgba(106, 199, 217, 0.18)",
          ["--admin-ink" as never]: "#11253d",
          ["--admin-surface" as never]: "rgba(255, 255, 255, 0.84)",
          ["--admin-surface-strong" as never]: "rgba(255, 255, 255, 0.96)",
          ["--admin-surface-alt" as never]: "rgba(242, 248, 255, 0.9)",
          ["--admin-border" as never]: "rgba(182, 209, 229, 0.72)",
          ["--admin-muted" as never]: "#67809a",
          ["--admin-muted-2" as never]: "#4b657d",
          ["--admin-success" as never]: "#137f6c",
          ["--admin-success-soft" as never]: "#d9f7eb",
          ["--admin-warning" as never]: "#bb7a0c",
          ["--admin-warning-soft" as never]: "#fff1ca",
          ["--admin-danger" as never]: "#cb4759",
          ["--admin-danger-soft" as never]: "#ffe3e8",
        } as CSSProperties
      }
    >
      <aside className={styles.sidebar} aria-label="Backoffice">
        <div className={styles.brandBlock}>
          <button
            className={styles.sidebarToggle}
            type="button"
            aria-label={isSidebarCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            aria-pressed={isSidebarCollapsed}
            title={isSidebarCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            onClick={() => setIsSidebarCollapsed((current) => !current)}
          >
            <SidebarToggleIcon collapsed={isSidebarCollapsed} />
            <span className={styles.sidebarToggleText}>
              {isSidebarCollapsed ? "Expandir" : "Colapsar menú lateral"}
            </span>
          </button>
          <div className={styles.brandLockup}>
            <img className={styles.brandLogo} src="/images/wakaya/wakaya-logo-min.png" alt="Wakaya Ecolodge" />
            <p className={styles.brandKicker}>Wakaya</p>
            <strong className={styles.brandTitle}>{isSidebarCollapsed ? "WK" : "Backoffice"}</strong>
          </div>
        </div>

        <div className={styles.sessionCard}>
          <span className={styles.sessionKicker}>Sesión activa</span>
          <strong className={styles.sessionValue}>{operatorLabel ?? "Acceso interno"}</strong>
          <div className={styles.sessionBadges}>
            {roleBadges.length > 0 ? (
              roleBadges.map((role) => (
                <span key={role} className={styles.sessionBadge}>
                  {ROLE_LABELS[role]}
                </span>
              ))
            ) : (
              <span className={styles.sessionBadgeMuted}>Sin permisos cargados</span>
            )}
          </div>
        </div>

        <nav className={styles.nav} aria-label="Módulos de administración">
          {visibleModules.map((module) => {
            const isActive = module.href === activeModule.href;
            const href = module.href as ComponentProps<typeof Link>["href"];
            return (
              <Link
                key={module.href}
                className={isActive ? styles.navItemActive : styles.navItem}
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-label={module.label}
                title={module.label}
              >
                <ShellIcon icon={module.icon} />
                <span className={styles.navLabel}>{module.label}</span>
              </Link>
            );
          })}
        </nav>

        <form className={styles.logoutForm} action="/api/auth/logout" method="post">
          <button className={styles.logoutButton} type="submit">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <div className={styles.surface}>
        <div className={styles.frame}>
          <header className={styles.header}>
            <div className={styles.headerSession}>
              <span className={styles.headerSessionLabel}>Operador</span>
              <strong className={styles.headerSessionValue}>{operatorLabel ?? "Sin sesión"}</strong>
            </div>
            <div className={styles.headerActions}>
              <div ref={notificationWrapRef} className={styles.notificationWrap}>
                <button
                  ref={notificationButtonRef}
                  className={isNotificationsOpen ? styles.notificationButtonActive : styles.notificationButton}
                  type="button"
                  aria-label={`Notificaciones${notifications?.total ? ` (${notifications.total})` : ""}`}
                  aria-expanded={isNotificationsOpen}
                  onClick={() => setIsNotificationsOpen((current) => !current)}
                >
                  <NotificationBellIcon />
                  <span className={styles.notificationLabel}>Notificaciones</span>
                  <span className={notifications?.total ? styles.notificationCountActive : styles.notificationCount}>
                    {notifications?.total ?? 0}
                  </span>
                </button>

                {isNotificationsOpen ? (
                  <div
                    className={styles.notificationPanel}
                    role="dialog"
                    aria-label="Centro de notificaciones"
                    style={notificationPanelStyle}
                  >
                    <div className={styles.notificationPanelHeader}>
                      <div className={styles.notificationPanelTitle}>
                        <strong>Centro de alertas</strong>
                        <InfoTooltip label="Aquí solo aparecen alertas operativas que requieren decisión rápida: conflictos, sync degradado, comprobantes pendientes y movimientos del día." />
                      </div>
                      <span className={styles.notificationPanelMeta}>{notifications?.total ?? 0} activas</span>
                    </div>

                    {notifications?.items.length ? (
                      <ul className={styles.notificationList}>
                        {notifications.items.map((item) => (
                          <li key={item.id} className={styles.notificationItem}>
                            <div className={styles.notificationItemHeader}>
                              <div className={styles.notificationItemSummary}>
                                <span
                                  className={
                                    item.tone === "critical"
                                      ? styles.notificationToneCritical
                                      : item.tone === "warning"
                                        ? styles.notificationToneWarning
                                        : styles.notificationToneInfo
                                  }
                                >
                                  {notificationToneLabel(item.tone)}
                                </span>
                                <strong className={styles.notificationItemTitle}>{item.title}</strong>
                              </div>
                              <span className={styles.notificationItemCount}>{item.count}</span>
                            </div>
                            <p className={styles.notificationItemDetail} title={item.detail}>
                              {item.detail}
                            </p>
                            <Link className={styles.notificationLink} href={item.href as never}>
                              Abrir caso
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={styles.notificationEmpty}>
                        <strong>Sin alertas operativas.</strong>
                        <span>La campana mostrará conflictos, sync degradado y tareas del día.</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <nav className={styles.quickNav} aria-label="Accesos rápidos">
                {visibleModules.map((module) => {
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
            </div>
          </header>

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}
