import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LocalizedPublicSiteLayout from './layout';

function countOccurrences(source: string, fragment: string) {
  return source.split(fragment).length - 1;
}

describe('LocalizedPublicSiteLayout', () => {
  it('keeps company navigation in the footer and leaves events out of the public shell', async () => {
    const html = renderToStaticMarkup(
      await LocalizedPublicSiteLayout({
        params: Promise.resolve({ locale: 'en' }),
        children: <div>shell</div>,
      }),
    );

    expect(countOccurrences(html, 'href="/en/events"')).toBe(0);
    expect(countOccurrences(html, 'href="/en/about"')).toBe(1);
    expect(countOccurrences(html, 'href="/en/faq"')).toBe(1);
    expect(countOccurrences(html, 'href="/en/testimonials"')).toBe(1);
    expect(countOccurrences(html, 'href="/en/gallery"')).toBe(2);
    expect(countOccurrences(html, 'href="/en/publications"')).toBe(1);
    expect(html).toContain('data-public-whatsapp="floating-button"');
    expect(html).toContain('https://wa.me/51961508813');
  });
});
