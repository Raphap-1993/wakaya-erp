import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import PublicSiteLayout from './layout';
import PublicSiteAboutPage from './about/page';

describe('PublicSiteInternalRoutes', () => {
  it('renders an internal public route inside the shared shell', () => {
    const html = renderToStaticMarkup(
      <PublicSiteLayout>
        <PublicSiteAboutPage />
      </PublicSiteLayout>,
    );

    expect(html).toContain('Nosotros');
    expect(html.match(/Navegación pública Wakaya/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
  });
});
