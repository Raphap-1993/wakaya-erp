import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { mockedNotFound } = vi.hoisted(() => ({
  mockedNotFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: mockedNotFound,
}));

import BungalowDetailPage from './page';

describe('BungalowDetailPage', () => {
  it('preserves search filters in the back link to results', async () => {
    const html = renderToStaticMarkup(
      await BungalowDetailPage({
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
    );

    expect(html).toContain('Bungalow Familiar');
    expect(html).toContain(
      'href="/prototype/public-site/bungalows?category=bungalow-familiar&amp;checkIn=2026-07-10&amp;checkOut=2026-07-12&amp;guests=4"',
    );
  });

  it('delegates unknown slugs to notFound', async () => {
    await expect(
      BungalowDetailPage({
        params: Promise.resolve({
          slug: 'bungalow-inexistente',
        }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });
});
