import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteContactPage, * as contactPageModule from './page';

describe('PublicSiteContactPage', () => {
  it('prefills the booking-request form from incoming search params', async () => {
    const html = renderToStaticMarkup(
      await PublicSiteContactPage({
        searchParams: Promise.resolve({
          requestedCheckIn: '2026-08-05',
          requestedCheckOut: '2026-08-08',
          requestedGuests: '3',
          requestedBungalowType: 'bungalow-matrimonial',
        }),
      }),
    );

    expect(html).toContain('value="2026-08-05"');
    expect(html).toContain('value="2026-08-08"');
    expect(html).toContain('<option value="3" selected="">3 huéspedes</option>');
    expect(html).toContain(
      '<option value="bungalow-matrimonial" selected="">Bungalow Matrimonial</option>',
    );
  });

  it('exports metadata for the contact page SEO baseline', () => {
    expect(contactPageModule.metadata).toMatchObject({
      title: 'Contacto y reservas | Wakaya Ecolodge',
      alternates: {
        canonical: '/prototype/public-site/contact',
      },
    });
  });
});
