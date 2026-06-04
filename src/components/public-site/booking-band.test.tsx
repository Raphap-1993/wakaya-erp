import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BookingBand } from './booking-band';

describe('BookingBand', () => {
  it('renders a GET form that points to the bungalow results page', () => {
    const html = renderToStaticMarkup(<BookingBand />);

    expect(html).toContain('action="/prototype/public-site/bungalows"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="checkIn"');
    expect(html).toContain('name="checkOut"');
    expect(html).toContain('name="guests"');
    expect(html).toContain('name="category"');
    expect(html).toContain('Consultar disponibilidad');
  });
});
