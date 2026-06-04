import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BookingBand } from './booking-band';
import { publicBungalows } from './public-site-data';

describe('BookingBand', () => {
  it('renders the public booking surface with a submit action', () => {
    const html = renderToStaticMarkup(<BookingBand />);
    const publicRoomOptions = publicBungalows
      .flatMap((room) =>
        room.bookingRequestBungalowId
          ? [
              {
                bungalowId: room.bookingRequestBungalowId,
                label: room.homeName ?? room.name,
              },
            ]
          : [],
      );

    expect(html).toContain('Disponibilidad referencial');
    expect(html).toContain('Consultar');
    expect(html).toContain('Check in');
    expect(html).toContain('Check out');
    expect(html).toContain('Revisar monitor interno');
    expect(html).toContain('Todas las categorías');

    for (const option of publicRoomOptions) {
      expect(html).toContain(option.label);
      expect(html).toContain(`value="${option.bungalowId}"`);
    }

    expect(html).not.toContain('Bungalow Triple');
    expect(html).not.toContain('value="bungalow-triple"');
  });
});
