import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BungalowsPage from './page';

describe('BungalowsPage', () => {
  it('renders filtered listing context from search params', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-familiar',
          checkIn: '2030-07-10',
          checkOut: '2030-07-12',
          guests: '4',
        },
      }),
    );

    expect(html).toContain('Nuestros Bungalows');
    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('4 personas · 55 m2');
    expect(html).not.toContain('Bungalow Matrimonial');
    expect(html).toContain(
      'href="/es/bungalows/bungalow-familiar?category=bungalow-familiar&amp;checkIn=2030-07-10&amp;checkOut=2030-07-12&amp;guests=4"',
    );
    expect(html).toContain('Ver detalles y reservar');
  });

  it('renders an empty state when category has no matching bungalow', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-inexistente',
        },
      }),
    );

    expect(html).toContain('Nuestros Bungalows');
    expect(html).toContain('No encontramos coincidencias con esos filtros.');
  });

  it('renders the bungalow detail route with the same Figma naming used by the listing', async () => {
    const resultsHtml = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: {
          category: 'bungalow-doble',
        },
      }),
    );

    expect(resultsHtml).toContain('Bungalow Doble');
    expect(resultsHtml).toContain(
      'href="/es/bungalows/bungalow-doble?category=bungalow-doble"',
    );

    const { default: BungalowDetailPage } = await import('./[slug]/page');

    const detailHtml = renderToStaticMarkup(
      await BungalowDetailPage({
        params: Promise.resolve({
          slug: 'bungalow-doble',
        }),
      }),
    );

    expect(detailHtml).toContain('Bungalow Doble');
    expect(detailHtml).toContain('href="/es">Inicio</a><span>/</span><a href="/es/bungalows">Bungalows</a><span>/</span><span>Bungalow Doble</span>');
    expect(detailHtml).toContain('S/. 280');
  });
});
