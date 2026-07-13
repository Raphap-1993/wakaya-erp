import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteAboutPage, * as aboutPageModule from './page';

describe('PublicSiteAboutPage', () => {
  it('renders the Figma story structure for the about route', async () => {
    const html = renderToStaticMarkup(await PublicSiteAboutPage());

    expect(html).toContain('Nosotros');
    expect(html).toContain('Un paraíso en el corazón de Pucallpa');
    expect(html).toContain('Tenemos como propósito');
    expect(html).toContain('Integridad');
    expect(html).toContain('Respeto por la naturaleza');
    expect(html).toContain('Trabajo en equipo');
  });

  it('exports metadata for the spanish about route used by the prototype alias', async () => {
    const metadata = await aboutPageModule.generateMetadata();

    expect(metadata).toMatchObject({
      title: 'Nosotros | Wakaya Ecolodge',
      alternates: {
        canonical: '/es/about',
      },
    });
  });
});
