import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AboutPage from './about/page';
import ContactPage from './contact/page';
import EventsPage from './events/page';
import GalleryPage from './gallery/page';
import PublicationsPage from './publications/page';
import ServicesPage from './services/page';

describe('internal public pages', () => {
  it('render their own hero titles and keep Wakaya context', () => {
    const html = [
      renderToStaticMarkup(<AboutPage />),
      renderToStaticMarkup(<ServicesPage />),
      renderToStaticMarkup(<EventsPage />),
      renderToStaticMarkup(<GalleryPage />),
      renderToStaticMarkup(<PublicationsPage />),
      renderToStaticMarkup(<ContactPage />),
    ].join('');

    expect(html).toContain('Acerca de Wakaya');
    expect(html).toContain('Servicios');
    expect(html).toContain('Eventos');
    expect(html).toContain('Galería');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Contacto');
    expect(html).toContain('Wakaya');
  });
});
