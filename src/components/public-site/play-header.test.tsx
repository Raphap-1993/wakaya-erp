import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockedPathname = '/prototype/public-site';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

import { PlayHeader } from './play-header';

describe('PlayHeader', () => {
  beforeEach(() => {
    mockedPathname = '/prototype/public-site';
  });

  it('renders the canonical public navigation', () => {
    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('/prototype/public-site/about');
    expect(html).toContain('/prototype/public-site/bungalows');
    expect(html).toContain('/prototype/public-site/services');
    expect(html).toContain('/prototype/public-site/contact');
    expect(html).toContain('Reservar ahora');
  });

  it('marks the current route link with aria-current', () => {
    mockedPathname = '/prototype/public-site/services';

    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('aria-current="page" href="/prototype/public-site/services"');
  });

  it('keeps the bungalow nav item active on nested detail routes', () => {
    mockedPathname = '/prototype/public-site/bungalows/bungalow-familiar';

    const html = renderToStaticMarkup(<PlayHeader />);

    expect(html).toContain('aria-current="page" href="/prototype/public-site/bungalows"');
  });
});
