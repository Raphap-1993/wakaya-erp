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
import { generateMetadata } from './page';

describe('BungalowDetailPage', () => {
  it('exports metadata for each bungalow detail page', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'bungalow-familiar',
      }),
    });

    expect(metadata).toMatchObject({
      title: 'Bungalow Familiar | Wakaya Ecolodge',
      alternates: {
        canonical: '/es/bungalows/bungalow-familiar',
      },
    });
  });

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
      'href="/es/bungalows?category=bungalow-familiar&amp;checkIn=2026-07-10&amp;checkOut=2026-07-12&amp;guests=4"',
    );
    expect(html).toContain('Lo que incluye');
    expect(html).toContain('Servicios incluidos');
    expect(html).toContain('Detalles del bungalow');
  });

  it('routes the detail CTA into the booking-request form context', async () => {
    const html = renderToStaticMarkup(
      await BungalowDetailPage({
        params: Promise.resolve({
          slug: 'bungalow-familiar',
        }),
        searchParams: Promise.resolve({
          checkIn: '2030-07-10',
          checkOut: '2030-07-12',
          guests: '4',
        }),
      }),
    );

    expect(html).toContain('Enviar solicitud');
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('name="requestedBungalowType" value="bungalow-family"');
    expect(html).toContain('name="requestedCheckIn" value="2030-07-10"');
    expect(html).toContain('name="requestedCheckOut" value="2030-07-12"');
    expect(html).toContain('name="requestedGuests" value="4"');
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
