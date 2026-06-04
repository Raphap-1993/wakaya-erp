import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSitePrototypePage from './page';

describe('PublicSitePrototypePage', () => {
  it('renders the parador-style Wakaya home with all required sections', () => {
    const html = renderToStaticMarkup(<PublicSitePrototypePage />);

    expect(html).toContain('Un encuentro con lo mágico');
    expect(html).toContain('Testimonios');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Newsletter');
    expect(html).toContain('Consultar disponibilidad');
  });
});
