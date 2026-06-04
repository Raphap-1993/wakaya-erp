import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BungalowsPage from './page';

describe('BungalowsPage', () => {
  it('renders filtered listing context from search params', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-familiar',
          checkIn: '2026-07-10',
          checkOut: '2026-07-12',
          guests: '4',
        },
      }),
    );

    expect(html).toContain('Resultados de búsqueda');
    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('2026-07-10');
    expect(html).toContain('2026-07-12');
    expect(html).toContain('4 huéspedes');
    expect(html).not.toContain('Bungalow Matrimonial');
  });

  it('renders an empty state when category has no matching bungalow', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-inexistente',
        },
      }),
    );

    expect(html).toContain('Resultados de búsqueda');
    expect(html).toContain('No encontramos coincidencias con esos filtros.');
  });

  it('renders the bungalow detail route with the same presentation name used by the search flow', async () => {
    const resultsHtml = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-doble',
        },
      }),
    );

    expect(resultsHtml).toContain('Bungalow Suite');
    expect(resultsHtml).not.toContain('Bungalow Doble');
    expect(resultsHtml).toContain('href="/prototype/public-site/bungalows/bungalow-doble"');

    const { default: BungalowDetailPage } = await import('./[slug]/page');

    const detailHtml = renderToStaticMarkup(
      await BungalowDetailPage({
        params: Promise.resolve({
          slug: 'bungalow-doble',
        }),
      }),
    );

    expect(detailHtml).toContain('Bungalow Suite');
    expect(detailHtml).toContain('Inicio / Bungalows / Bungalow Suite');
    expect(detailHtml).toContain('Desde S/ 420');
  });
});
