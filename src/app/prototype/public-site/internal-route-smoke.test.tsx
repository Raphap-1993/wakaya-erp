import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteLayout from './layout';
import PublicSitePrototypePage from './page';
import PublicSiteAboutPage from './about/page';
import PublicSiteBungalowsPage from './bungalows/page';
import PublicSiteServicesPage from './services/page';
import PublicSiteEventsPage from './events/page';
import PublicSiteGalleryPage from './gallery/page';
import PublicSitePublicationsPage from './publications/page';
import PublicSiteContactPage from './contact/page';

describe('PublicSiteInternalRoutes', () => {
  it('renders the current public routes inside the shared shell', () => {
    const routes = [
      { heading: 'Respira la naturaleza', page: <PublicSitePrototypePage /> },
      { heading: 'Nosotros', page: <PublicSiteAboutPage /> },
      { heading: 'Bungalows', page: <PublicSiteBungalowsPage /> },
      { heading: 'Servicios', page: <PublicSiteServicesPage /> },
      { heading: 'Eventos', page: <PublicSiteEventsPage /> },
      { heading: 'Galería', page: <PublicSiteGalleryPage /> },
      { heading: 'Publicaciones', page: <PublicSitePublicationsPage /> },
      { heading: 'Contacto', page: <PublicSiteContactPage /> },
    ];

    for (const route of routes) {
      const html = renderToStaticMarkup(
        <PublicSiteLayout>
          {route.page}
        </PublicSiteLayout>,
      );

      expect(html).toContain(route.heading);
      expect(html.match(/Navegación pública Wakaya/g)).toHaveLength(1);
      expect(html.match(/<footer/g)).toHaveLength(1);
    }
  });

  it('renders home calls to action as real navigation links', () => {
    const html = renderToStaticMarkup(
      <PublicSiteLayout>
        <PublicSitePrototypePage />
      </PublicSiteLayout>,
    );

    expect(html).toContain('href="/prototype/public-site/bungalows">Ver detalle</a>');
    expect(html).toContain('href="/prototype/public-site/bungalows">Más info</a>');
    expect(html).toContain('href="/prototype/public-site/events">Ver eventos</a>');
    expect(html).toContain('href="/prototype/public-site/services">Ver full day</a>');
  });
});
