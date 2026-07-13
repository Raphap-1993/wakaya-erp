import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import * as homePageModule from './page';
import PublicSitePrototypePage from './page';

function countOccurrences(source: string, fragment: string) {
  return source.split(fragment).length - 1;
}

describe('PublicSitePrototypePage', () => {
  it('exports metadata for the localized spanish home baseline used by the prototype alias', async () => {
    const metadata = await homePageModule.generateMetadata();

    expect(metadata).toMatchObject({
      title: 'Wakaya Ecolodge | Estadia amazonica en Pucallpa',
      alternates: {
        canonical: '/es',
      },
    });
  });

  it('renders the spanish public home alias with the approved home structure already worked in code', async () => {
    const html = renderToStaticMarkup(await PublicSitePrototypePage());

    expect(html).toContain('Wakaya Ecolodge');
    expect(html).toContain('Pucallpa · Amazonía peruana');
    expect(html).toContain('Un encuentro con lo Magico');
    expect(html).toContain('href="/es/contact">Reservar ahora</a>');
    expect(html).toContain('href="/es/services">Explorar experiencias</a>');
    expect(html).toContain('<form class="');
    expect(html).toContain('action="/es/bungalows"');
    expect(html).toContain('Ver opciones');
    expect(html).not.toContain('Solicitud manual de reserva');
    expect(html).not.toContain('Comparte tu fecha ideal y el equipo Wakaya coordina contigo antes de confirmar.');
    expect(html).toContain('Nuestra historia');
    expect(html).toContain('Donde la selva');
    expect(html).toContain('Nuestros Bungalows');
    expect(html).toContain('Experiencias unicas');
    expect(html).toContain('Lo que dicen nuestros huespedes');
    expect(html).toContain('Tu retiro en la selva te espera');
    expect(html).toContain('Solicitar reserva');
    expect(countOccurrences(html, 'data-home-section="room-grid-card"')).toBe(4);
    expect(countOccurrences(html, 'data-home-section="experience-card"')).toBe(3);
    expect(countOccurrences(html, 'data-home-section="testimonial-card"')).toBe(3);
  });
});
