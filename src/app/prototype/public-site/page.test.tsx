import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { publicBungalows } from '@/components/public-site/public-site-data';

import * as homePageModule from './page';
import PublicSitePrototypePage from './page';

function countOccurrences(source: string, fragment: string) {
  return source.split(fragment).length - 1;
}

describe('PublicSitePrototypePage', () => {
  it('exports metadata for the home SEO baseline', () => {
    expect(homePageModule.metadata).toMatchObject({
      title: 'Wakaya Ecolodge | Estadia amazónica en Pucallpa',
      alternates: {
        canonical: '/prototype/public-site',
      },
    });
  });

  it('renders the parador-style Wakaya home with all required sections', () => {
    const html = renderToStaticMarkup(<PublicSitePrototypePage />);
    const featuredRooms = publicBungalows.filter((room) => room.featuredOnHome).slice(0, 3);

    expect(html).toContain('Un encuentro con lo mágico');
    expect(html).toContain('Testimonios');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Newsletter');
    expect(html).toContain('Consultar disponibilidad');

    for (const room of featuredRooms) {
      expect(html).toContain(`href="/prototype/public-site/bungalows?category=${room.slug}"`);
      expect(html).toContain(`aria-label="Ver disponibilidad de ${room.homeName ?? room.name}"`);
      expect(
        countOccurrences(
          html,
          `href="/prototype/public-site/bungalows?category=${room.slug}"`,
        ),
      ).toBe(1);
    }

    expect(html).toContain('aria-label="Leer más sobre Celebraciones en un entorno natural"');
    expect(html).toContain('aria-label="Leer más sobre Cómo vivir un Full Day en Wakaya"');
  });
});
