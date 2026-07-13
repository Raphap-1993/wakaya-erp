import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LocalizedBungalowsPage from './page';

describe('LocalizedBungalowsPage', () => {
  it('renders the public bungalow catalog under the same editorial hero system', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          category: 'bungalow-familiar',
          checkIn: '2026-07-20',
          checkOut: '2026-07-22',
          guests: '4',
        }),
      }),
    );

    expect(html).toContain('Nuestros Bungalows');
    expect(html).toContain('slider_wakaya2.png');
    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('Ver detalles y reservar');
    expect(html).not.toContain('Ocho refugios');
  });

  it('renders the Individual card without empty area punctuation or a nightly suffix for an unpriced category', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({ category: 'bungalow-individual' }),
      }),
    );

    expect(html).toContain('Bungalow Individual');
    expect(html).toContain('1 persona');
    expect(html).not.toContain('1 personas');
    expect(html).not.toMatch(/Consultar tarifa.*?\/noche/);
  });

  it('keeps a family bungalow visible when only one of its physical units is occupied', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          category: 'bungalow-familiar',
          checkIn: '2026-07-11',
          checkOut: '2026-07-12',
          guests: '4',
        }),
      }),
    );

    expect(html).toContain('Bungalow Familiar');
    expect(html).not.toContain('No encontramos coincidencias con esos filtros.');
  });

  it('keeps a matrimonial bungalow visible while at least one of its four units is free', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          category: 'bungalow-matrimonial',
          checkIn: '2026-06-17',
          checkOut: '2026-06-18',
          guests: '2',
        }),
      }),
    );

    expect(html).toContain('Bungalow Matrimonial');
    expect(html).not.toContain('No encontramos coincidencias con esos filtros.');
  });

  it('keeps a bungalow available in date-based public search when it exists in operational inventory', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          category: 'bungalow-triple',
          checkIn: '2026-07-20',
          checkOut: '2026-07-22',
          guests: '3',
        }),
      }),
    );

    expect(html).toContain('Bungalow Triple');
    expect(html).not.toContain('No encontramos coincidencias con esos filtros.');
  });

  it('filters the public catalog by guest capacity so only matching bungalows remain', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          guests: '4',
        }),
      }),
    );

    expect(html).toContain('Bungalow Familiar');
    expect(html).not.toContain('Bungalow Matrimonial');
    expect(html).not.toContain('Bungalow Doble');
    expect(html).not.toContain('Bungalow Triple');
  });

  it('uses the configured guest count as the exact public filter so family inventory does not appear for smaller groups', async () => {
    const html = renderToStaticMarkup(
      await LocalizedBungalowsPage({
        params: Promise.resolve({ locale: 'es' }),
        searchParams: Promise.resolve({
          guests: '3',
        }),
      }),
    );

    expect(html).toContain('Bungalow Triple');
    expect(html).not.toContain('Bungalow Familiar');
    expect(html).not.toContain('Bungalow Matrimonial');
    expect(html).not.toContain('Bungalow Doble');
  });
});
