"use client";

import type { CSSProperties } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buildHomeNavigationStyleVars } from "@/lib/home-content/style-resolver";
import type { HomeNavigationStyle } from "@/lib/home-content/types";
import type { PublicSiteLocale } from "./public-site-locale";
import { getPublicRoute, swapPublicLocaleInPathname } from "./public-site-routes";
import styles from "./public-site-shell.module.css";

type NavigationItem = {
  key: string;
  label: string;
  href: string;
};

type PlayHeaderProps = {
  brandSmall?: string;
  brandName?: string;
  ctaLabel?: string;
  locale?: PublicSiteLocale;
  localeSwitchLabel?: string;
  navItems?: NavigationItem[];
  navigationStyle?: HomeNavigationStyle;
  hubHref?: string;
  hubLabel?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPlace?: string;
};

const NAV_ORDER = ["home", "bungalows", "services", "gallery", "contact"] as const;

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlayHeader({
  brandName = "Wakaya Ecolodge",
  ctaLabel = "Reservar ahora",
  locale,
  localeSwitchLabel,
  navItems,
  navigationStyle,
}: PlayHeaderProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const homeHref = locale ? getPublicRoute(locale, "home") : "/prototype/public-site";
  const contactHref = locale ? getPublicRoute(locale, "contact") : "/prototype/public-site/contact";
  const localeSwitchName = localeSwitchLabel ?? (locale === "en" ? "Language" : "Idioma");
  const localeTargets = locale
    ? (["es", "en"] as const).map((targetLocale) => ({
        code: targetLocale.toUpperCase(),
        href: swapPublicLocaleInPathname(pathname ?? homeHref, targetLocale),
        isActive: targetLocale === locale,
      }))
    : [];

  const fallbackNav = NAV_ORDER.map((key) => {
    switch (key) {
      case "home":
        return { key, href: homeHref, label: locale === "en" ? "Home" : "Inicio" };
      case "bungalows":
        return {
          key,
          href: locale ? getPublicRoute(locale, "bungalows") : "/prototype/public-site/bungalows",
          label: locale === "en" ? "Rooms" : "Habitaciones",
        };
      case "services":
        return {
          key,
          href: locale ? getPublicRoute(locale, "services") : "/prototype/public-site/services",
          label: locale === "en" ? "Services" : "Servicios",
        };
      case "gallery":
        return {
          key,
          href: locale ? getPublicRoute(locale, "gallery") : "/prototype/public-site/gallery",
          label: locale === "en" ? "Gallery" : "Galería",
        };
      case "contact":
        return {
          key,
          href: locale ? getPublicRoute(locale, "contact") : "/prototype/public-site/contact",
          label: locale === "en" ? "Contact" : "Contacto",
        };
      default:
        return null;
    }
  }).filter(Boolean) as NavigationItem[];
  const resolvedNav = navItems && navItems.length > 0 ? navItems : fallbackNav;
  const navigationVars = buildHomeNavigationStyleVars(navigationStyle) as CSSProperties;

  const isHomeRoute = pathname === homeHref || pathname === "/" || pathname === "/prototype/public-site";

  function isActive(href: string, key: string) {
    if (!pathname) {
      return false;
    }

    if (key === "bungalows") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    return pathname === href;
  }

  useEffect(() => {
    if (!isHomeRoute) {
      setScrolled(true);
      return;
    }

    function syncScrollState() {
      setScrolled(window.scrollY > 24);
    }

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScrollState);
    };
  }, [isHomeRoute]);

  return (
    <header
      className={[
        styles.prototypeHeader,
        isHomeRoute ? styles.prototypeHeaderHome : styles.prototypeHeaderInner,
        scrolled ? styles.prototypeHeaderScrolled : "",
      ].join(" ")}
    >
      <div className={styles.prototypeBar}>
        <div className={styles.prototypeBarInner}>
          <Link
            className={styles.prototypeBrand}
            href={homeHref as Route}
            aria-label={brandName}
            onClick={() => setOpen(false)}
          >
            <img
              className={styles.prototypeBrandLogo}
              src="/images/wakaya/wakaya-logo-min.png"
              alt={brandName}
            />
          </Link>

          <nav className={styles.prototypeNav} aria-label="Navegación pública Wakaya">
            {resolvedNav.map((item) => (
              <Link
                key={item.key}
                href={item.href as Route}
                aria-current={isActive(item.href, item.key) ? "page" : undefined}
                className={`${styles.prototypeNavLink} ${isActive(item.href, item.key) ? styles.prototypeNavLinkActive : ""}`}
                style={navigationVars}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.prototypeActions}>
            {localeTargets.length > 0 ? (
              <div className={styles.prototypeLocaleSwitch} role="group" aria-label={localeSwitchName}>
                {localeTargets.map((target) => (
                  <Link
                    key={target.code}
                    className={`${styles.prototypeLocaleLink} ${target.isActive ? styles.prototypeLocaleLinkActive : ""}`}
                    href={target.href as Route}
                    aria-current={target.isActive ? "page" : undefined}
                    style={navigationVars}
                    onClick={() => setOpen(false)}
                  >
                    {target.code}
                  </Link>
                ))}
              </div>
            ) : null}

            <Link className={styles.prototypeCta} href={contactHref as Route} style={navigationVars}>
              {ctaLabel}
            </Link>

            <button
              type="button"
              className={styles.prototypeMenuButton}
              aria-expanded={open}
              aria-label={locale === "en" ? "Open navigation" : "Abrir navegación"}
              onClick={() => setOpen((value) => !value)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className={styles.prototypeMobilePanel}>
          <div className={styles.prototypeMobileHeader}>
            <Link
              className={styles.prototypeBrand}
              href={homeHref as Route}
              aria-label={brandName}
              onClick={() => setOpen(false)}
            >
              <img
                className={styles.prototypeBrandLogo}
                src="/images/wakaya/wakaya-logo-min.png"
                alt={brandName}
              />
            </Link>
            <button
              type="button"
              className={styles.prototypeMobileClose}
              aria-label={locale === "en" ? "Close navigation" : "Cerrar navegación"}
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <nav className={styles.prototypeMobileNav}>
            {resolvedNav.map((item) => (
              <Link
                key={item.key}
                href={item.href as Route}
                className={styles.prototypeMobileLink}
                style={navigationVars}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {localeTargets.length > 0 ? (
            <div className={styles.prototypeMobileLocaleWrap}>
              <div className={styles.prototypeLocaleSwitch} role="group" aria-label={localeSwitchName}>
                {localeTargets.map((target) => (
                  <Link
                    key={target.code}
                    className={`${styles.prototypeLocaleLink} ${target.isActive ? styles.prototypeLocaleLinkActive : ""}`}
                    href={target.href as Route}
                    aria-current={target.isActive ? "page" : undefined}
                    style={navigationVars}
                    onClick={() => setOpen(false)}
                  >
                    {target.code}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.prototypeMobileCtaWrap}>
            <Link
              className={styles.prototypeMobileCta}
              href={contactHref as Route}
              style={navigationVars}
              onClick={() => setOpen(false)}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
