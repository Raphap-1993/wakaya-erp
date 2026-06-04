import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlayFooter } from './play-footer';

describe('PlayFooter', () => {
  it('renders the canonical public footer links and contact copy', () => {
    const html = renderToStaticMarkup(<PlayFooter />);

    expect(html).toContain('Nosotros');
    expect(html).toContain('Bungalows');
    expect(html).toContain('Servicios');
    expect(html).toContain('Contacto');
    expect(html).toContain('wakayaecolodge.com');
  });
});
