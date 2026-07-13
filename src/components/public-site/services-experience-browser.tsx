"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { PublicExperience } from "@/lib/content/public-content";

import type { PublicSiteLocale } from "./public-site-locale";
import { getPublicRoute } from "./public-site-routes";
import styles from "./figma-public-pages.module.css";

type ServicesExperienceBrowserProps = {
  locale: PublicSiteLocale;
  experiences: PublicExperience[];
  detailLabel: string;
  includesLabel: string;
  recommendationsLabel: string;
  closeLabel: string;
};

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

const EMPTY_SEARCH_PARAMS: SearchParamsLike = {
  get: () => null,
  toString: () => "",
};

function buildExperienceHref(pathname: string, searchParams: SearchParamsLike, slug: string | null) {
  const nextSearch = new URLSearchParams(searchParams.toString());
  if (slug) {
    nextSearch.set("experience", slug);
  } else {
    nextSearch.delete("experience");
  }
  const query = nextSearch.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function ServicesExperienceBrowser({
  locale,
  experiences,
  detailLabel,
  includesLabel,
  recommendationsLabel,
  closeLabel,
}: ServicesExperienceBrowserProps) {
  const pathname = usePathname();
  const router = useContext(AppRouterContext);
  const searchParams = useSearchParams();
  const fallbackPathname = getPublicRoute(locale, "services");
  const currentPathname = pathname ?? fallbackPathname;
  const currentSearchParams = searchParams ?? EMPTY_SEARCH_PARAMS;
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectedSlug = currentSearchParams.get("experience");

  const navigate = (slug: string | null, mode: "push" | "replace") => {
    const href = buildExperienceHref(currentPathname, currentSearchParams, slug);
    if (router) {
      router[mode](href, { scroll: false });
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(href, window.location.origin).toString();
    if (mode === "replace") {
      window.history.replaceState(null, "", nextUrl);
      return;
    }

    window.location.assign(nextUrl);
  };

  const selectedExperience = useMemo(
    () => experiences.find((item) => item.slug === selectedSlug) ?? null,
    [experiences, selectedSlug],
  );

  useEffect(() => {
    if (!selectedExperience) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(null, "replace");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [currentPathname, currentSearchParams, router, selectedExperience]);

  return (
    <>
      <div className={styles.experienceGrid}>
        {experiences.map((item) => (
          <article key={item.id} className={styles.experienceCard}>
            <div className={styles.experienceMedia}>
              <img src={item.coverImage || item.heroImage} alt={item.title} />
              <div className={styles.experienceBadge}>{item.priceLabel}</div>
            </div>

            <div className={styles.experienceBody}>
              <div className={styles.experienceMeta}>
                <span>{item.priceLabel}</span>
                <span className={styles.experienceDuration}>{item.duration}</span>
              </div>

              <div className={styles.experienceTitleRow}>
                <div className={styles.experienceTitleIcon}>{item.icon}</div>
                <h2 className={styles.experienceTitle}>{item.title}</h2>
              </div>

              <p className={styles.experienceDescription}>{item.summary}</p>

              <div className={styles.experienceActions}>
                <button
                  type="button"
                  className={styles.buttonLink}
                  onClick={() => navigate(item.slug, "push")}
                >
                  {detailLabel}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedExperience ? (
        <div
          className={styles.experienceDialogBackdrop}
          role="presentation"
          onClick={() => navigate(null, "replace")}
        >
          <div
            className={styles.experienceDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="experience-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.experienceDialogMedia}>
              <img src={selectedExperience.heroImage || selectedExperience.coverImage} alt={selectedExperience.title} />
            </div>

            <div className={styles.experienceDialogBody}>
              <div className={styles.experienceDialogHeader}>
                <div>
                  <span className={styles.experienceDialogEyebrow}>{selectedExperience.priceLabel}</span>
                  <h2 id="experience-dialog-title" className={styles.experienceDialogTitle}>
                    {selectedExperience.title}
                  </h2>
                  <p className={styles.experienceDialogLead}>{selectedExperience.summary}</p>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  className={styles.buttonLinkLight}
                  onClick={() => navigate(null, "replace")}
                >
                  {closeLabel}
                </button>
              </div>

              <div className={styles.experienceDialogMeta}>
                <span>{selectedExperience.duration}</span>
                <span>{selectedExperience.priceLabel}</span>
              </div>

              <p className={styles.experienceDialogCopy}>{selectedExperience.body}</p>

              {selectedExperience.galleryImages.length > 0 ? (
                <div className={styles.experienceGalleryStrip}>
                  {selectedExperience.galleryImages.map((image, index) => (
                    <div key={`${selectedExperience.id}-${index + 1}`} className={styles.experienceGalleryTile}>
                      <img src={image} alt={`${selectedExperience.title} ${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedExperience.included.length > 0 || selectedExperience.recommendations.length > 0 ? (
                <div className={styles.experienceDialogColumns}>
                  {selectedExperience.included.length > 0 ? (
                    <section className={styles.experienceDialogPanel}>
                      <h3 className={styles.experienceDialogPanelTitle}>{includesLabel}</h3>
                      <ul className={styles.experienceDialogList}>
                        {selectedExperience.included.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {selectedExperience.recommendations.length > 0 ? (
                    <section className={styles.experienceDialogPanel}>
                      <h3 className={styles.experienceDialogPanelTitle}>{recommendationsLabel}</h3>
                      <ul className={styles.experienceDialogList}>
                        {selectedExperience.recommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.experienceDialogActions}>
                <a
                  className={styles.buttonLink}
                  href={`${getPublicRoute(locale, "contact")}?experience=${selectedExperience.slug}`}
                >
                  {selectedExperience.ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
