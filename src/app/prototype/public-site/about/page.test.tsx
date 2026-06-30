import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteAboutPage, * as aboutPageModule from './page';

describe('PublicSiteAboutPage', () => {
  it('renders a richer hospitality narrative aligned to the home style', () => {
    const html = renderToStaticMarkup(<PublicSiteAboutPage />);

    expect(html).toContain('Naturaleza, hospitalidad y celebraciones');
    expect(html).toContain('Hospitalidad con criterio humano');
    expect(html).toContain('Planifica tu llegada con el equipo de reservas');
  });

  it('exports metadata for the about page SEO baseline', () => {
    expect(aboutPageModule.metadata).toMatchObject({
      title: 'Nosotros | Wakaya Ecolodge',
      alternates: {
        canonical: '/prototype/public-site/about',
      },
    });
  });
});
