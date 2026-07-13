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
    expect(html).toContain('<option value="2" selected="">2 personas</option>');
    expect(html).toContain('type="hidden" name="requestedBungalowType" value="bungalow-matrimonial"');
  });

  it('keeps the booking-request contract behind the Figma contact layout', async () => {
    const html = renderToStaticMarkup(await PublicSiteContactPage({}));

    expect(html).toContain('Contáctanos');
    expect(html).toContain('Hablemos');
    expect(html).toContain('Planifica tu estadía');
    expect(html).toContain('action="/api/public/booking-requests"');
    expect(html).toContain('method="post"');
    expect(html).toContain('reservas@wakayaecolodge.com');
    expect(html).toContain('Enviar solicitud');
  });

  it('exports metadata for the spanish contact route used by the prototype alias', async () => {
    const metadata = await contactPageModule.generateMetadata();

    expect(metadata).toMatchObject({
      title: 'Contacto y reservas | Wakaya Ecolodge',
      alternates: {
        canonical: '/es/contact',
      },
    });
  });
});
