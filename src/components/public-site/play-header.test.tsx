import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlayHeader } from './play-header';

describe('PlayHeader', () => {
  it('renders the canonical public navigation', () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('/prototype/public-site/about');
    expect(html).toContain('/prototype/public-site/bungalows');
    expect(html).toContain('/prototype/public-site/services');
    expect(html).toContain('/prototype/public-site/contact');
    expect(html).toContain('Reservar ahora');
  });
});
