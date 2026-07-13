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
  it('renders the current public routes inside the shared shell', async () => {
    const routes = [
      { heading: 'Wakaya Ecolodge', page: await PublicSitePrototypePage() },
      { heading: 'Nosotros', page: await PublicSiteAboutPage() },
      { heading: 'Nuestros Bungalows', page: await PublicSiteBungalowsPage({}) },
      { heading: 'Servicios', page: await PublicSiteServicesPage() },
      { heading: 'Eventos', page: await PublicSiteEventsPage() },
      { heading: 'Galería', page: await PublicSiteGalleryPage() },
      { heading: 'Publicaciones', page: await PublicSitePublicationsPage() },
      { heading: 'Contáctanos', page: await PublicSiteContactPage({}) },
    ];

    for (const route of routes) {
      const html = renderToStaticMarkup(
        await PublicSiteLayout({
          children: route.page,
        }),
      );

      expect(html).toContain(route.heading);
      expect(html.match(/Navegación pública Wakaya/g)).toHaveLength(1);
      expect(html.match(/<footer/g)).toHaveLength(1);
    }
  });

  it('renders home calls to action as real navigation links', async () => {
    const html = renderToStaticMarkup(
      await PublicSiteLayout({
        children: await PublicSitePrototypePage(),
      }),
    );

    expect(html).toContain('href="/es/contact">Reservar ahora</a>');
    expect(html).toContain('href="/es/services">Explorar experiencias</a>');
    expect(html).toContain('href="/es/about">Conoce nuestra historia</a>');
    expect(html).toContain('href="/es/bungalows">Ver todos</a>');
    expect(html).toContain('href="/es/services">Ver todas</a>');
    expect(html).toContain('href="/es/contact">Solicitar reserva</a>');
  });

  it('renders the bungalow detail route inside the shared shell', async () => {
    const html = renderToStaticMarkup(
      await PublicSiteLayout({
        children: await PublicSiteBungalowDetailPage({
          params: Promise.resolve({
            slug: 'bungalow-familiar',
          }),
          searchParams: Promise.resolve({
            category: 'bungalow-familiar',
            checkIn: '2026-07-10',
            checkOut: '2026-07-12',
            guests: '4',
          }),
        }),
      }),
    );

    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain('Navegación pública Wakaya');
    expect(html).toContain('href="/es/bungalows?category=bungalow-familiar');
    expect(html).toContain('<footer');
  });

  it('routes the public contact flow to booking requests language', async () => {
    const html = renderToStaticMarkup(await PublicSiteContactPage({}));

    expect(html).toContain('Contáctanos');
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('Enviar solicitud');
  });
});
