import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteLayout from './layout';
import PublicSitePrototypePage from './page';
import { publicBungalows } from '@/components/public-site/public-site-data';

describe('PublicSitePrototypePage', () => {
  it('renders the Wakaya editorial prototype content inside the shared public shell', () => {
    const html = renderToStaticMarkup(
      <PublicSiteLayout>
        <PublicSitePrototypePage />
      </PublicSiteLayout>,
    );

    const homeRoomNames = publicBungalows
      .filter((room) => room.featuredOnHome)
      .map((room) => room.homeName ?? room.name);

    expect(html).toContain('Respira la naturaleza');
    expect(html).toContain(homeRoomNames[0]);
    expect(html).toContain(homeRoomNames[1]);
    expect(html).toContain(homeRoomNames[2]);
    expect(html).toContain('Consultar');
    expect(html.match(/Navegación pública Wakaya/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
  });
});
