import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PageHero } from './page-hero';

describe('PageHero', () => {
  it('renders the route media and heading without a redundant process panel', () => {
    const html = renderToStaticMarkup(
      <PageHero
        eyebrow="Eventos"
        title="Celebraciones con atmosfera tropical"
        breadcrumb="Inicio / Eventos"
        copy="Bodas, retiros y encuentros con lenguaje hospitality premium."
        image="https://wakayaecolodge.com/es/images/wakaya/slider/slider_wakaya2.png"
        imageAlt="Pareja caminando frente a la laguna de Wakaya"
      />,
    );

    expect(html).toContain("<header");
    expect(html).not.toContain('aria-label="Reserva asistida"');
    expect(html).toContain('Celebraciones con atmosfera tropical');
    expect(html).toContain('Inicio / Eventos');
    expect(html).toContain('slider_wakaya2.png');
    expect(html).toContain('Pareja caminando frente a la laguna de Wakaya');
    expect(html).toContain('Eventos');
    expect(html).not.toContain('Reservas asistidas por Wakaya.');
  });
});
