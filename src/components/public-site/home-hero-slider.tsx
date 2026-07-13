'use client';

import type { CSSProperties } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { HomeTextStyle } from '@/lib/home-content/types';
import { buildHomeHeroStyleVars } from '@/lib/home-content/style-resolver';

import styles from './home-prototype.module.css';

type Slide = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  copy?: string;
  ctaLabel: string;
  href: string;
  secondaryCtaLabel?: string;
  secondaryHref?: string;
  image: string;
  scrollLabel?: string;
  style?: HomeTextStyle;
};

type HomeHeroSliderProps = {
  slides: Slide[];
};

export function HomeHeroSlider({ slides }: HomeHeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = ((activeIndex % slides.length) + slides.length) % slides.length;

  function goTo(nextIndex: number) {
    setActiveIndex(((nextIndex % slides.length) + slides.length) % slides.length);
  }

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => ((current + 1) % slides.length + slides.length) % slides.length);
    }, 4800);

    return () => {
      window.clearInterval(timer);
    };
  }, [safeIndex, slides.length]);

  return (
    <section className={styles.heroSection} aria-label="Hero principal de Wakaya">
      <div className={styles.heroSlider}>
        {slides.map((slide, index) => (
          <article
            key={slide.title}
            className={`${styles.heroSlide} ${index === safeIndex ? styles.heroSlideActive : ''}`}
            aria-hidden={index === safeIndex ? undefined : true}
            style={buildHomeHeroStyleVars(slide.style) as CSSProperties}
          >
            <div className={styles.heroMedia}>
              <img src={slide.image} alt={slide.title} />
              <div className={styles.heroOverlay} />
            </div>

            <div className={styles.heroShell}>
              <div className={styles.heroCopy}>
                <span className={styles.heroKicker}>{slide.eyebrow}</span>
                <h1>{slide.title}</h1>
                {slide.subtitle ? <p className={styles.heroSubtitle}>{slide.subtitle}</p> : null}
                {slide.copy ? <p className={styles.heroBody}>{slide.copy}</p> : null}

                <div className={styles.heroActions}>
                  <Link className={styles.primaryButton} href={slide.href as Route}>
                    {slide.ctaLabel}
                  </Link>
                  {slide.secondaryCtaLabel && slide.secondaryHref ? (
                    <Link className={styles.ghostButton} href={slide.secondaryHref as Route}>
                      {slide.secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              </div>

              {slide.scrollLabel ? (
                <div className={styles.heroScrollCue} aria-hidden="true">
                  <span className={styles.heroScrollLabel}>{slide.scrollLabel}</span>
                  <span className={styles.heroScrollMark}>⌄</span>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {slides.length > 1 ? (
          <>
            <button
              className={`${styles.heroArrow} ${styles.heroArrowPrev}`}
              type="button"
              aria-label="Previous slide"
              onClick={() => goTo(safeIndex - 1)}
            >
              ←
            </button>
            <button
              className={`${styles.heroArrow} ${styles.heroArrowNext}`}
              type="button"
              aria-label="Next slide"
              onClick={() => goTo(safeIndex + 1)}
            >
              →
            </button>

            <div className={styles.heroDots} aria-label="Hero pagination">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  className={`${styles.heroDot} ${index === safeIndex ? styles.heroDotActive : ''}`}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
