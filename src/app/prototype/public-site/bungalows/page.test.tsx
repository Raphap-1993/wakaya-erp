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
    expect(html).toContain('2026-07-12');
    expect(html).toContain('4 huéspedes');
    expect(html).not.toContain('Bungalow Matrimonial');
  });

  it('renders an empty state when category has no matching bungalow', async () => {
    const html = renderToStaticMarkup(
      await BungalowsPage({
        searchParams: Promise.resolve({
          category: 'bungalow-inexistente',
        }),
      }),
    );

    expect(html).toContain('Resultados de búsqueda');
    expect(html).toContain('No encontramos coincidencias con esos filtros.');
  });
});
