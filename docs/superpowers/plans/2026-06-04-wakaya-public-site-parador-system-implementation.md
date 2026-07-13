# Wakaya Public Site Parador System Implementation Plan

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Indice de documentacion](../../README.md)
- Siguiente: [Indice de documentacion](../../README.md)
<!-- nav-guided:end -->


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `002-public-site` into a multi-page public prototype that keeps Wakaya's real architecture while adopting Parador-grade header, footer, hero, motion, and search behavior.

**Architecture:** Keep the public prototype inside `src/app/prototype/public-site`, add a shared route-local layout for the public shell, centralize public content in one data module, and build page-specific server routes for home, listing, detail, and support pages. The booking/search flow becomes URL-driven and idempotent by navigating to a dedicated bungalow results page with query params instead of posting directly from the home hero.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Vitest 4, Playwright

---

## File Map

- `src/app/prototype/public-site/layout.tsx`
  - Shared route-level shell for every public page, with common header/footer.
- `src/app/prototype/public-site/page.tsx`
  - Final home page with Parador-style integrated hero/header and Wakaya-specific sections.
- `src/app/prototype/public-site/about/page.tsx`
  - `Nosotros` page.
- `src/app/prototype/public-site/bungalows/page.tsx`
  - Idempotent public listing/results page driven by query params.
- `src/app/prototype/public-site/bungalows/[slug]/page.tsx`
  - Public bungalow detail page.
- `src/app/prototype/public-site/services/page.tsx`
  - Public services page.
- `src/app/prototype/public-site/events/page.tsx`
  - Public events page.
- `src/app/prototype/public-site/gallery/page.tsx`
  - Public gallery page.
- `src/app/prototype/public-site/publications/page.tsx`
  - Public publications page.
- `src/app/prototype/public-site/contact/page.tsx`
  - Public contact page.
- `src/components/public-site/public-site-data.ts`
  - Single source for nav items, room categories, services, publications, testimonials, and contact copy.
- `src/components/public-site/page-hero.tsx`
  - Shared internal page hero with breadcrumb/title/subtitle pattern.
- `src/components/public-site/play-header.tsx`
  - Evolve into the canonical public header using shared nav data and route links.
- `src/components/public-site/play-footer.tsx`
  - Evolve into the canonical public footer using shared content and contact columns.
- `src/components/public-site/booking-band.tsx`
  - Convert from POST-based pre-reservation widget into a GET-driven search form that lands on `/prototype/public-site/bungalows`.
- `src/components/public-site/public-site-theme.module.css`
  - Expand to cover the shared shell, integrated home hero, internal page heroes, listing cards, detail view, and footer/header states.
- `src/app/prototype/public-site/page.test.tsx`
  - Home render regression.
- `src/components/public-site/play-header.test.tsx`
  - Header route/render regression.
- `src/components/public-site/play-footer.test.tsx`
  - Footer route/render regression.
- `src/components/public-site/booking-band.test.tsx`
  - Search-form regression.
- `src/app/prototype/public-site/bungalows/page.test.tsx`
  - Results-page regression.
- `src/app/prototype/public-site/internal-pages.test.tsx`
  - Shared regression for `about`, `services`, `events`, `gallery`, `publications`, and `contact`.
- `e2e/public-site-prototype.spec.ts`
  - Public-site route flow check.
- `specs/002-public-site/traceability.md`
  - Update code/test links from SPDD-only empty refs to real routes and tests once pages exist.
- `specs/002-public-site/prototype-validation.md`
  - Update human-review checklist to mention integrated header/slider, idempotent search, and internal-page consistency.

## Task 1: Establish the Shared Public Shell and Content Source

**Files:**
- Create: `src/components/public-site/public-site-data.ts`
- Create: `src/app/prototype/public-site/layout.tsx`
- Create: `src/components/public-site/play-footer.test.tsx`
- Modify: `src/components/public-site/play-header.tsx`
- Modify: `src/components/public-site/play-header.test.tsx`
- Modify: `src/components/public-site/play-footer.tsx`
- Modify: `src/components/public-site/public-site-theme.module.css`

- [ ] **Step 1: Write the failing header/footer regressions**

Create `src/components/public-site/play-footer.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlayFooter } from './play-footer';

describe('PlayFooter', () => {
  it('renders the canonical public footer links and contact copy', () => {
    const html = renderToStaticMarkup(<PlayFooter />);

    expect(html).toContain('Nosotros');
    expect(html).toContain('Bungalows');
    expect(html).toContain('Servicios');
    expect(html).toContain('Contacto');
    expect(html).toContain('wakayaecolodge.com');
  });
});
```

Update `src/components/public-site/play-header.test.tsx` to assert route links instead of hash-only anchors:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlayHeader } from './play-header';

describe('PlayHeader', () => {
  it('renders the canonical public navigation', () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('/prototype/public-site/about');
    expect(html).toContain('/prototype/public-site/bungalows');
    expect(html).toContain('/prototype/public-site/services');
    expect(html).toContain('/prototype/public-site/contact');
    expect(html).toContain('Reservar ahora');
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npm run test -- src/components/public-site/play-header.test.tsx src/components/public-site/play-footer.test.tsx
```

Expected:

```text
FAIL
```

The current header still points to `#home`, `#bungalows`, and similar hash-only anchors, and there is no footer regression file yet.

- [ ] **Step 3: Create the shared public content module and route layout**

Create `src/components/public-site/public-site-data.ts`:

```ts
export const publicNav = [
  { label: 'Inicio', href: '/prototype/public-site' },
  { label: 'Nosotros', href: '/prototype/public-site/about' },
  { label: 'Bungalows', href: '/prototype/public-site/bungalows' },
  { label: 'Servicios', href: '/prototype/public-site/services' },
  { label: 'Eventos', href: '/prototype/public-site/events' },
  { label: 'Galería', href: '/prototype/public-site/gallery' },
  { label: 'Publicaciones', href: '/prototype/public-site/publications' },
  { label: 'Contacto', href: '/prototype/public-site/contact' },
] as const;

export const publicBungalows = [
  {
    slug: 'bungalow-familiar',
    name: 'Bungalow Familiar',
    eyebrow: 'Para familias y grupos pequeños',
    priceFrom: 'Desde S/ 350',
    capacity: '4 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
  {
    slug: 'bungalow-matrimonial',
    name: 'Bungalow Matrimonial',
    eyebrow: 'Para una estadía más íntima',
    priceFrom: 'Desde S/ 250',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BM_1.jpg',
  },
  {
    slug: 'bungalow-doble',
    name: 'Bungalow Doble',
    eyebrow: 'Para descanso cálido y flexible',
    priceFrom: 'Desde S/ 320',
    capacity: '2 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/0BT_1.jpg',
  },
  {
    slug: 'bungalow-triple',
    name: 'Bungalow Triple',
    eyebrow: 'Para grupos pequeños con más amplitud',
    priceFrom: 'Desde S/ 380',
    capacity: '3 huéspedes',
    image: 'https://wakayaecolodge.com/es/images/wakaya/habitaciones/BF_1.jpg',
  },
] as const;

export const footerContact = {
  place: 'Pucallpa · Perú',
  domain: 'wakayaecolodge.com',
  note: 'Atención personalizada del equipo Wakaya',
};
```

Create `src/app/prototype/public-site/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

import { PlayFooter } from '@/components/public-site/play-footer';
import { PlayHeader } from '@/components/public-site/play-header';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <PlayHeader />
        {children}
        <PlayFooter />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Rewrite the header and footer to use route links**

Modify `src/components/public-site/play-header.tsx`:

```tsx
'use client';

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
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          className={styles.headerCta}
          href="/prototype/public-site/bungalows"
          onClick={() => setOpen(false)}
        >
          Reservar ahora
        </Link>
      </div>
    </header>
  );
}
```

Modify `src/components/public-site/play-footer.tsx`:

```tsx
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
```

Add the missing shell selectors in `src/components/public-site/public-site-theme.module.css`:

```css
.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(244, 183, 58, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(54, 95, 82, 0.12), transparent 26%),
    linear-gradient(180deg, #fbf6ef 0%, var(--bg) 40%, #f2eadf 100%);
}

.shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 28px 24px 88px;
}
```

- [ ] **Step 5: Run the shell tests and commit**

Run:

```bash
npm run test -- src/components/public-site/play-header.test.tsx src/components/public-site/play-footer.test.tsx
```

Expected:

```text
PASS
```

Commit:

```bash
git add src/app/prototype/public-site/layout.tsx src/components/public-site/public-site-data.ts src/components/public-site/play-header.tsx src/components/public-site/play-header.test.tsx src/components/public-site/play-footer.tsx src/components/public-site/play-footer.test.tsx src/components/public-site/public-site-theme.module.css
git commit -m "feat: add shared wakaya public shell"
```

## Task 2: Rebuild the Home Page Around the Parador-Style Hero System

**Files:**
- Modify: `src/app/prototype/public-site/page.tsx`
- Modify: `src/app/prototype/public-site/page.test.tsx`
- Modify: `src/components/public-site/public-site-data.ts`
- Modify: `src/components/public-site/public-site-theme.module.css`

- [ ] **Step 1: Write the failing home regression for the new section set**

Update `src/app/prototype/public-site/page.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSitePrototypePage from './page';

describe('PublicSitePrototypePage', () => {
  it('renders the parador-style Wakaya home with all required sections', () => {
    const html = renderToStaticMarkup(<PublicSitePrototypePage />);

    expect(html).toContain('Un encuentro con lo mágico');
    expect(html).toContain('Testimonios');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Newsletter');
    expect(html).toContain('Consultar disponibilidad');
  });
});
```

- [ ] **Step 2: Run the home test to verify it fails**

Run:

```bash
npm run test -- src/app/prototype/public-site/page.test.tsx
```

Expected:

```text
FAIL
```

The current home does not include the final testimonial/publications/newsletter composition and still uses the older hero copy.

- [ ] **Step 3: Expand the home content source for the real Wakaya sections**

Append to `src/components/public-site/public-site-data.ts`:

```ts
export const homeSlides = [
  {
    eyebrow: 'Hotel Wakaya Ecolodge',
    title: 'Un encuentro con lo mágico',
    copy: 'Laguna, jardines, piscina y bungalows cálidos en una experiencia tropical premium.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya1.png',
  },
  {
    eyebrow: 'Hospitalidad tropical',
    title: 'Lo mejor de la selva del Perú',
    copy: 'Una llegada más emocional, más visual y más clara para reservar.',
    image: 'https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png',
  },
] as const;

export const testimonials = [
  { name: 'Familias', quote: 'Un entorno natural para descansar del ruido de la ciudad.' },
  { name: 'Parejas', quote: 'Bungalows cálidos, agua, jardines y mejor sensación de retiro.' },
] as const;

export const publications = [
  { slug: 'bodas-en-wakaya', title: 'Celebraciones en un entorno natural' },
  { slug: 'full-day-pucallpa', title: 'Cómo vivir un Full Day en Wakaya' },
] as const;
```

- [ ] **Step 4: Rewrite the home page around the final section order**

Modify `src/app/prototype/public-site/page.tsx` so it pulls from `homeSlides`, `publicBungalows`, `testimonials`, and `publications` and renders the final section order:

```tsx
import Link from 'next/link';

import { BookingBand } from '@/components/public-site/booking-band';
import {
  homeSlides,
  publications,
  publicBungalows,
  testimonials,
} from '@/components/public-site/public-site-data';
import styles from '@/components/public-site/public-site-theme.module.css';

export default function PublicSitePrototypePage() {
  const hero = homeSlides[0];

  return (
    <>
      <section className={styles.homeHero} id="home">
        <div
          className={styles.homeHeroSlide}
          style={{ backgroundImage: `linear-gradient(rgba(17, 25, 22, 0.38), rgba(17, 25, 22, 0.46)), url(${hero.image})` }}
        >
          <div className={styles.homeHeroCopy}>
            <span className={styles.heroKicker}>{hero.eyebrow}</span>
            <h1>{hero.title}</h1>
            <p>{hero.copy}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/prototype/public-site/bungalows">
                Consultar disponibilidad
              </Link>
              <Link className={styles.ghostButton} href="/prototype/public-site/bungalows">
                Ver bungalows
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BookingBand />

      <section className={styles.roomSection}>
        <div className={styles.roomGrid}>
          {publicBungalows.slice(0, 3).map((room) => (
            <article key={room.slug} className={styles.roomCard}>
              <img src={room.image} alt={room.name} />
              <div className={styles.roomBody}>
                <span className={styles.roomEyebrow}>{room.eyebrow}</span>
                <h3>{room.name}</h3>
                <div className={styles.roomMeta}>
                  <span>{room.capacity}</span>
                  <span>{room.priceFrom}</span>
                </div>
                <Link className={styles.primaryButton} href={`/prototype/public-site/bungalows/${room.slug}`}>
                  Ver detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <h2>Testimonios</h2>
        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => (
            <article key={item.name} className={styles.quoteCard}>
              <strong>{item.name}</strong>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.publicationSection}>
        <h2>Publicaciones</h2>
        <div className={styles.publicationGrid}>
          {publications.map((item) => (
            <article key={item.slug} className={styles.publicationCard}>
              <strong>{item.title}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.newsletterSection}>
        <h2>Newsletter</h2>
        <p>Recibe novedades, experiencias y temporadas destacadas de Wakaya.</p>
      </section>
    </>
  );
}
```

Add the new selectors in `src/components/public-site/public-site-theme.module.css`:

```css
.homeHero {
  margin: -112px -24px 0;
}

.homeHeroSlide {
  min-height: 880px;
  display: grid;
  align-items: center;
  padding: 180px 24px 160px;
  background-size: cover;
  background-position: center;
}

.homeHeroCopy h1 {
  font-size: clamp(3.6rem, 7vw, 7.2rem);
  line-height: 0.9;
  font-weight: 800;
}

.testimonialSection,
.publicationSection,
.newsletterSection {
  padding: 56px 0;
}
```

- [ ] **Step 5: Run the home regression and commit**

Run:

```bash
npm run test -- src/app/prototype/public-site/page.test.tsx
```

Expected:

```text
PASS
```

Commit:

```bash
git add src/app/prototype/public-site/page.tsx src/app/prototype/public-site/page.test.tsx src/components/public-site/public-site-data.ts src/components/public-site/public-site-theme.module.css
git commit -m "feat: redesign wakaya public home"
```

## Task 3: Make the Home Search Idempotent and Add the Results Page

**Files:**
- Create: `src/app/prototype/public-site/bungalows/page.tsx`
- Create: `src/app/prototype/public-site/bungalows/page.test.tsx`
- Modify: `src/components/public-site/booking-band.tsx`
- Modify: `src/components/public-site/booking-band.test.tsx`
- Modify: `src/components/public-site/public-site-theme.module.css`

- [ ] **Step 1: Write the failing tests for GET-based search and URL-driven results**

Create `src/app/prototype/public-site/bungalows/page.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BungalowsPage from './page';

describe('BungalowsPage', () => {
  it('renders filtered listing context from search params', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: Promise.resolve({
          category: 'bungalow-familiar',
          checkIn: '2026-07-10',
          checkOut: '2026-07-12',
          guests: '4',
        }),
      }),
    );

    expect(html).toContain('Resultados de búsqueda');
    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('2026-07-10');
  });
});
```

Update `src/components/public-site/booking-band.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BookingBand } from './booking-band';

describe('BookingBand', () => {
  it('renders a GET form that points to the bungalow results page', () => {
    const html = renderToStaticMarkup(<BookingBand />);

    expect(html).toContain('action="/prototype/public-site/bungalows"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="checkIn"');
    expect(html).toContain('name="checkOut"');
    expect(html).toContain('Consultar disponibilidad');
  });
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
npm run test -- src/components/public-site/booking-band.test.tsx src/app/prototype/public-site/bungalows/page.test.tsx
```

Expected:

```text
FAIL
```

The current band still posts client-side state and the results route does not exist.

- [ ] **Step 3: Convert the booking band into an idempotent GET form**

Modify `src/components/public-site/booking-band.tsx`:

```tsx
import styles from './public-site-theme.module.css';

export function BookingBand() {
  return (
    <section className={styles.bookingBand} id="booking">
      <div className={styles.bookingIntro}>
        <strong>Disponibilidad referencial</strong>
        <p>
          La disponibilidad es orientativa. La validación final y el pago se coordinan
          manualmente con Wakaya.
        </p>
      </div>

      <form className={styles.bookingForm} action="/prototype/public-site/bungalows" method="get">
        <div className={styles.field}>
          <label htmlFor="checkIn">Check in</label>
          <input id="checkIn" name="checkIn" type="date" defaultValue="2026-07-10" />
        </div>

        <div className={styles.field}>
          <label htmlFor="checkOut">Check out</label>
          <input id="checkOut" name="checkOut" type="date" defaultValue="2026-07-12" />
        </div>

        <div className={styles.field}>
          <label htmlFor="guests">Personas</label>
          <select id="guests" name="guests" defaultValue="2">
            <option value="2">2 huéspedes</option>
            <option value="3">3 huéspedes</option>
            <option value="4">4 huéspedes</option>
            <option value="5">5 huéspedes</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="category">Habitación</label>
          <select id="category" name="category" defaultValue="">
            <option value="">Todas las categorías</option>
            <option value="bungalow-familiar">Bungalow Familiar</option>
            <option value="bungalow-matrimonial">Bungalow Matrimonial</option>
            <option value="bungalow-doble">Bungalow Doble</option>
            <option value="bungalow-triple">Bungalow Triple</option>
          </select>
        </div>

        <button className={styles.primaryButton} type="submit">
          Consultar disponibilidad
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Create the results page and its key states**

Create `src/app/prototype/public-site/bungalows/page.tsx`:

```tsx
import Link from 'next/link';

import { publicBungalows } from '@/components/public-site/public-site-data';
import { PageHero } from '@/components/public-site/page-hero';
import styles from '@/components/public-site/public-site-theme.module.css';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BungalowsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : '';
  const checkIn = typeof params.checkIn === 'string' ? params.checkIn : '';
  const checkOut = typeof params.checkOut === 'string' ? params.checkOut : '';
  const guests = typeof params.guests === 'string' ? params.guests : '';

  const rooms = category
    ? publicBungalows.filter((item) => item.slug === category)
    : publicBungalows;

  return (
    <>
      <PageHero
        title="Resultados de búsqueda"
        eyebrow="Bungalows"
        breadcrumb="Inicio / Bungalows"
        copy="Consulta categorías disponibles con contexto referencial y CTA a detalle o solicitud."
      />

      <section className={styles.resultsMeta}>
        <strong>{checkIn || 'Sin fecha'} · {checkOut || 'Sin fecha'} · {guests || 'Sin huéspedes'}</strong>
      </section>

      <section className={styles.roomGrid}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <article key={room.slug} className={styles.roomCard}>
              <img src={room.image} alt={room.name} />
              <div className={styles.roomBody}>
                <span className={styles.roomEyebrow}>{room.eyebrow}</span>
                <h3>{room.name}</h3>
                <div className={styles.roomMeta}>
                  <span>{room.capacity}</span>
                  <span>{room.priceFrom}</span>
                </div>
                <Link className={styles.primaryButton} href={`/prototype/public-site/bungalows/${room.slug}`}>
                  Ver detalle
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className={styles.emptyCard}>
            <strong>No encontramos coincidencias con esos filtros.</strong>
            <p>Ajusta fechas o categoría para revisar más opciones referenciales.</p>
          </div>
        )}
      </section>
    </>
  );
}
```

Add selectors in `src/components/public-site/public-site-theme.module.css`:

```css
.resultsMeta {
  margin: 20px 0 32px;
  color: var(--muted);
}

.emptyCard {
  padding: 32px;
  border-radius: var(--radius-lg);
  background: rgba(255, 252, 247, 0.78);
  border: 1px solid var(--line);
}
```

- [ ] **Step 5: Run search tests and commit**

Run:

```bash
npm run test -- src/components/public-site/booking-band.test.tsx src/app/prototype/public-site/bungalows/page.test.tsx
```

Expected:

```text
PASS
```

Commit:

```bash
git add src/components/public-site/booking-band.tsx src/components/public-site/booking-band.test.tsx src/app/prototype/public-site/bungalows/page.tsx src/app/prototype/public-site/bungalows/page.test.tsx src/components/public-site/public-site-theme.module.css
git commit -m "feat: add idempotent bungalow search flow"
```

## Task 4: Add the Internal Public Pages and the Bungalow Detail Route

**Files:**
- Create: `src/components/public-site/page-hero.tsx`
- Create: `src/app/prototype/public-site/about/page.tsx`
- Create: `src/app/prototype/public-site/bungalows/[slug]/page.tsx`
- Create: `src/app/prototype/public-site/services/page.tsx`
- Create: `src/app/prototype/public-site/events/page.tsx`
- Create: `src/app/prototype/public-site/gallery/page.tsx`
- Create: `src/app/prototype/public-site/publications/page.tsx`
- Create: `src/app/prototype/public-site/contact/page.tsx`
- Create: `src/app/prototype/public-site/internal-pages.test.tsx`
- Modify: `src/components/public-site/public-site-data.ts`
- Modify: `src/components/public-site/public-site-theme.module.css`

- [ ] **Step 1: Write the failing regression for the internal page family**

Create `src/app/prototype/public-site/internal-pages.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AboutPage from './about/page';
import ContactPage from './contact/page';
import EventsPage from './events/page';
import GalleryPage from './gallery/page';
import PublicationsPage from './publications/page';
import ServicesPage from './services/page';

describe('internal public pages', () => {
  it('render their own hero titles and keep Wakaya context', () => {
    const html = [
      renderToStaticMarkup(<AboutPage />),
      renderToStaticMarkup(<ServicesPage />),
      renderToStaticMarkup(<EventsPage />),
      renderToStaticMarkup(<GalleryPage />),
      renderToStaticMarkup(<PublicationsPage />),
      renderToStaticMarkup(<ContactPage />),
    ].join('');

    expect(html).toContain('Acerca de Wakaya');
    expect(html).toContain('Servicios');
    expect(html).toContain('Eventos');
    expect(html).toContain('Galería');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Contacto');
  });
});
```

- [ ] **Step 2: Run the internal-pages regression to verify it fails**

Run:

```bash
npm run test -- src/app/prototype/public-site/internal-pages.test.tsx
```

Expected:

```text
FAIL
```

Those page routes and the shared page hero do not exist yet.

- [ ] **Step 3: Create the reusable page hero**

Create `src/components/public-site/page-hero.tsx`:

```tsx
import styles from './public-site-theme.module.css';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  breadcrumb: string;
  copy: string;
};

export function PageHero({ eyebrow, title, breadcrumb, copy }: PageHeroProps) {
  return (
    <section className={styles.pageHero}>
      <span className={styles.pageHeroEyebrow}>{eyebrow}</span>
      <p className={styles.pageHeroBreadcrumb}>{breadcrumb}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </section>
  );
}
```

- [ ] **Step 4: Add the internal routes and bungalow detail page**

Create `src/app/prototype/public-site/about/page.tsx`:

```tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Acerca de Wakaya"
        breadcrumb="Inicio / Nosotros"
        copy="Historia, naturaleza, propósito y experiencia real del ecolodge."
      />
      <section>
        <h2>Un paraíso en el corazón de Pucallpa</h2>
      </section>
    </>
  );
}
```

Create `src/app/prototype/public-site/bungalows/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';

import { PageHero } from '@/components/public-site/page-hero';
import { publicBungalows } from '@/components/public-site/public-site-data';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BungalowDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const room = publicBungalows.find((item) => item.slug === slug);

  if (!room) notFound();

  return (
    <>
      <PageHero
        eyebrow="Bungalow"
        title={room.name}
        breadcrumb={`Inicio / Bungalows / ${room.name}`}
        copy={`${room.capacity} · ${room.priceFrom}`}
      />
      <section>
        <img src={room.image} alt={room.name} />
      </section>
    </>
  );
}
```

Create the other pages as small complete route files with `PageHero` and one page-specific section:

```tsx
// services/page.tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Servicios" title="Servicios" breadcrumb="Inicio / Servicios" copy="Experiencias y amenities reales de Wakaya." />
      <section><h2>Laguna, piscina, restaurante y más</h2></section>
    </>
  );
}
```

```tsx
// events/page.tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function EventsPage() {
  return (
    <>
      <PageHero eyebrow="Eventos" title="Eventos" breadcrumb="Inicio / Eventos" copy="Celebraciones, corporativo y momentos especiales." />
      <section><h2>Wakaya como venue natural</h2></section>
    </>
  );
}
```

```tsx
// gallery/page.tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function GalleryPage() {
  return (
    <>
      <PageHero eyebrow="Galería" title="Galería" breadcrumb="Inicio / Galería" copy="Agua, vegetación, arquitectura y uso humano del lugar." />
      <section><h2>Atmósfera del ecolodge</h2></section>
    </>
  );
}
```

```tsx
// publications/page.tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function PublicationsPage() {
  return (
    <>
      <PageHero eyebrow="Publicaciones" title="Publicaciones" breadcrumb="Inicio / Publicaciones" copy="Historias, temporadas y experiencias del sitio." />
      <section><h2>Novedades de Wakaya</h2></section>
    </>
  );
}
```

```tsx
// contact/page.tsx
import { PageHero } from '@/components/public-site/page-hero';

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contacto" title="Contacto" breadcrumb="Inicio / Contacto" copy="Canales directos para consulta y coordinación." />
      <section><h2>Hablemos de tu próxima estadía</h2></section>
    </>
  );
}
```

Add the shared internal-page selectors in `src/components/public-site/public-site-theme.module.css`:

```css
.pageHero {
  margin: 0 0 36px;
  padding: 180px 0 48px;
}

.pageHeroEyebrow,
.pageHeroBreadcrumb {
  color: var(--muted);
}

.pageHero h1 {
  font-size: clamp(2.8rem, 5vw, 4.8rem);
  line-height: 0.94;
  font-weight: 780;
}
```

- [ ] **Step 5: Run the internal-page regression and commit**

Run:

```bash
npm run test -- src/app/prototype/public-site/internal-pages.test.tsx
```

Expected:

```text
PASS
```

Commit:

```bash
git add src/components/public-site/page-hero.tsx src/app/prototype/public-site/about/page.tsx src/app/prototype/public-site/bungalows/[slug]/page.tsx src/app/prototype/public-site/services/page.tsx src/app/prototype/public-site/events/page.tsx src/app/prototype/public-site/gallery/page.tsx src/app/prototype/public-site/publications/page.tsx src/app/prototype/public-site/contact/page.tsx src/app/prototype/public-site/internal-pages.test.tsx src/components/public-site/public-site-theme.module.css
git commit -m "feat: add wakaya public interior pages"
```

## Task 5: Tighten E2E Coverage and Sync the SPDD Evidence

**Files:**
- Modify: `e2e/public-site-prototype.spec.ts`
- Modify: `specs/002-public-site/traceability.md`
- Modify: `specs/002-public-site/prototype-validation.md`

- [ ] **Step 1: Extend the public-site E2E test with the new happy path**

Modify `e2e/public-site-prototype.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.describe('public site prototype route', () => {
  test('navigates from home search to results and detail', async ({ page }) => {
    await page.goto('/prototype/public-site');

    await expect(page.getByRole('heading', { level: 1, name: /un encuentro con lo mágico/i })).toBeVisible();

    await page.getByLabel('Habitación').selectOption('bungalow-familiar');
    await page.getByRole('button', { name: /consultar disponibilidad/i }).click();

    await expect(page).toHaveURL(/\/prototype\/public-site\/bungalows/);
    await expect(page.getByRole('heading', { level: 1, name: /resultados de búsqueda/i })).toBeVisible();

    await page.getByRole('link', { name: /ver detalle/i }).first().click();
    await expect(page).toHaveURL(/\/prototype\/public-site\/bungalows\//);
  });
});
```

- [ ] **Step 2: Run the focused E2E check to verify the public route is green**

Run:

```bash
npm run test:e2e -- e2e/public-site-prototype.spec.ts
```

Expected:

```text
PASS
```

- [ ] **Step 3: Update the public-site traceability matrix with real code and test paths**

Modify `specs/002-public-site/traceability.md` rows to replace `-` in `Codigo` and `Test` for the built pages. For example:

```md
| RF-01 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-home | - | - | src/app/prototype/public-site/page.tsx, src/components/public-site/play-header.tsx, src/components/public-site/play-footer.tsx | src/app/prototype/public-site/page.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
| RF-02 | HU-PS-01 | spdd-frontend.md | prototype-html5/index.html#view-habitaciones | - | - | src/app/prototype/public-site/bungalows/page.tsx, src/app/prototype/public-site/bungalows/[slug]/page.tsx | src/app/prototype/public-site/bungalows/page.test.tsx, e2e/public-site-prototype.spec.ts | Implementado y validado | prototype-validation.md |
```

- [ ] **Step 4: Update the prototype-validation checklist to match the approved design**

Modify `specs/002-public-site/prototype-validation.md`:

```md
| Criterio | Estado | Observacion |
|---|---|---|
| La home se siente visualmente cercana a Parador | PENDIENTE | Validar header integrado al slider y booking band en el hero final. |
| El color y contenido siguen sintiendose Wakaya | PENDIENTE | Revisar fotos, copy y categorias reales del ecolodge. |
| Existe pagina idempotente de resultados desde el home | PENDIENTE | Validar query params, recarga y back navigation en `/prototype/public-site/bungalows`. |
| Las paginas internas comparten familia visual sin parecer otra home | PENDIENTE | Revisar hero interno, breadcrumb y footer comun en `about`, `services`, `events`, `gallery`, `publications` y `contact`. |
| Los titulos ya no se sienten excesivamente gruesos | PENDIENTE | Confirmar ajuste de peso en home e interiores. |
```

- [ ] **Step 5: Run the evidence set and commit**

Run:

```bash
npm run test -- src/app/prototype/public-site/page.test.tsx src/components/public-site/play-header.test.tsx src/components/public-site/play-footer.test.tsx src/components/public-site/booking-band.test.tsx src/app/prototype/public-site/bungalows/page.test.tsx src/app/prototype/public-site/internal-pages.test.tsx
npm run test:e2e -- e2e/public-site-prototype.spec.ts
npm run typecheck
```

Expected:

```text
PASS
```

Commit:

```bash
git add e2e/public-site-prototype.spec.ts specs/002-public-site/traceability.md specs/002-public-site/prototype-validation.md
git commit -m "test: cover wakaya public site prototype"
```

## Self-Review

### Spec coverage

- Shared `header/footer` shell: covered by Task 1.
- `Home` with integrated `menu + slider`: covered by Task 2.
- Idempotent search results page: covered by Task 3.
- `Bungalows`, `Detalle`, `Nosotros`, `Servicios`, `Eventos`, `Galería`, `Publicaciones`, `Contacto`: covered by Task 4.
- Lower heading weight and internal-page family consistency: covered by Tasks 2 and 4.
- Traceability and validation evidence: covered by Task 5.

No spec gaps remain.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task includes exact files, commands, and expected outputs.

### Type consistency

- Public nav paths consistently use `/prototype/public-site/...`.
- The results flow consistently uses `category`, `checkIn`, `checkOut`, and `guests`.
- Shared room data consistently uses `slug`, `name`, `priceFrom`, `capacity`, and `image`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-04-wakaya-public-site-parador-system-implementation.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
