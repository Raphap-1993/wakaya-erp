import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteLayout from './layout';
import PublicSitePrototypePage from './page';
import PublicSiteAboutPage from './about/page';
import PublicSiteBungalowsPage from './bungalows/page';
import PublicSiteBungalowDetailPage from './bungalows/[slug]/page';
import PublicSiteServicesPage from './services/page';
import PublicSiteEventsPage from './events/page';
import PublicSiteGalleryPage from './gallery/page';
import PublicSitePublicationsPage from './publications/page';
import PublicSiteContactPage from './contact/page';

describe('PublicSiteInternalRoutes', () => {
  it('renders the current public routes inside the shared shell', () => {
    const routes = [
      { heading: 'Un encuentro con lo mágico', page: <PublicSitePrototypePage /> },
      { heading: 'Acerca de Wakaya', page: <PublicSiteAboutPage /> },
      { heading: 'Resultados de búsqueda', page: <PublicSiteBungalowsPage /> },
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

    expect(html).toContain('href="/prototype/public-site/bungalows">Consultar disponibilidad</a>');
    expect(html).toContain('href="/prototype/public-site/bungalows">Ver bungalows</a>');
    expect(html).toContain(
      'href="/prototype/public-site/bungalows?category=bungalow-familiar">Ver disponibilidad</a>',
    );
    expect(html).toContain(
      'href="/prototype/public-site/publications">Leer más</a>',
    );
    expect(html).toContain(
      'href="/prototype/public-site/contact">Solicitar novedades</a>',
    );
  });

  it('renders the bungalow detail route inside the shared shell', async () => {
    const html = renderToStaticMarkup(
      <PublicSiteLayout>
        {await PublicSiteBungalowDetailPage({
          params: Promise.resolve({
            slug: 'bungalow-familiar',
          }),
          searchParams: Promise.resolve({
            category: 'bungalow-familiar',
            checkIn: '2026-07-10',
            checkOut: '2026-07-12',
            guests: '4',
          }),
        })}
      </PublicSiteLayout>,
    );

    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('Navegación pública Wakaya');
    expect(html).toContain('href="/prototype/public-site/bungalows?category=bungalow-familiar');
    expect(html).toContain('<footer');
  });
});
