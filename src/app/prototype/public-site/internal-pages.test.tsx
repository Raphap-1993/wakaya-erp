import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import EventsPage from './events/page';
import GalleryPage from './gallery/page';
import PublicationsPage from './publications/page';
import ServicesPage from './services/page';

const staticPageCases = [
  {
    label: 'services',
    render: () => ServicesPage(),
    heading: 'Servicios',
    stableFragment: 'Eventos Corporativos',
    requiredHrefs: ['/es/contact'] as string[],
  },
  {
    label: 'events',
    render: () => EventsPage(),
    heading: 'Eventos',
    stableFragment: 'Wakaya como venue natural',
    requiredHrefs: [] as string[],
  },
  {
    label: 'gallery',
    render: () => GalleryPage(),
    heading: 'Galería',
    stableFragment: 'La belleza de Wakaya en imágenes',
    requiredHrefs: [] as string[],
  },
  {
    label: 'publications',
    render: () => PublicationsPage(),
    heading: 'Publicaciones',
    stableFragment: 'Novedades de Wakaya',
    requiredHrefs: [
      '/es/contact',
      '/es/bungalows',
    ],
  },
] as const;

describe('internal public pages', () => {
  for (const pageCase of staticPageCases) {
    it(`${pageCase.label} renders its page hero and stable route hooks`, async () => {
      const html = renderToStaticMarkup(await pageCase.render());

      expect(html).toContain(pageCase.heading);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(pageCase.stableFragment);

      for (const href of pageCase.requiredHrefs) {
        expect(html).toContain(`href="${href}"`);
      }
    });
  }
});
