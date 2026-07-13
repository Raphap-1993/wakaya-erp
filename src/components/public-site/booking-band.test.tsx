import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BookingBand } from './booking-band';

describe('BookingBand', () => {
  it('renders a GET form that hands off filters into the request flow', () => {
    const html = renderToStaticMarkup(<BookingBand />);

    expect(html).toContain('action="/prototype/public-site/contact"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="requestedCheckIn"');
    expect(html).toContain('name="requestedCheckOut"');
    expect(html).toContain('name="requestedGuests"');
    expect(html).toContain('name="requestedBungalowType"');
    expect(html).toContain('Solicitar disponibilidad');
  });

  it('keeps localized routing when the public site is rendered from a locale route', () => {
    const html = renderToStaticMarkup(
      <BookingBand
        locale="en"
        requestedGuestsLabel="Guests"
        requestedBungalowLabel="Room type"
        guestOptions={['2 guests', '3 guests']}
      />,
    );

    expect(html).toContain('action="/en/contact"');
    expect(html).toContain('>Guests<');
    expect(html).toContain('>Room type<');
    expect(html).toContain('>2 guests<');
  });
});
