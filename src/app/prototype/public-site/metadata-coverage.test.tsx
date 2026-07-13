import { describe, expect, it } from 'vitest';

import { publicSiteMetadataBase } from '@/components/public-site/public-site-metadata';

import * as aboutPageModule from './about/page';
import * as bungalowsPageModule from './bungalows/page';
import * as bungalowDetailPageModule from './bungalows/[slug]/page';
import * as contactPageModule from './contact/page';
import * as eventsPageModule from './events/page';
import * as galleryPageModule from './gallery/page';
import * as layoutModule from './layout';
import * as homePageModule from './page';
import * as publicationsPageModule from './publications/page';
import * as servicesPageModule from './services/page';

const staticMetadataCases = [
  {
    label: 'home',
    path: '/es',
    module: homePageModule,
  },
  {
    label: 'about',
    path: '/es/about',
    module: aboutPageModule,
  },
  {
    label: 'contact',
    path: '/es/contact',
    module: contactPageModule,
  },
] as const;

const routeModulesRequiringMetadata = [
  {
    label: 'bungalows results',
    path: '/es/bungalows',
    module: bungalowsPageModule,
  },
  {
    label: 'services',
    path: '/es/services',
    module: servicesPageModule,
  },
  {
    label: 'events',
    path: '/es/events',
    module: eventsPageModule,
  },
  {
    label: 'gallery',
    path: '/es/gallery',
    module: galleryPageModule,
  },
  {
    label: 'publications',
    path: '/es/publications',
    module: publicationsPageModule,
  },
] as const;

describe('public-site metadata coverage', () => {
  it('keeps the shared metadata base on the public shell layout', () => {
    expect(layoutModule.metadata).toMatchObject({
      metadataBase: publicSiteMetadataBase,
    });
  });

  for (const testCase of staticMetadataCases) {
    it(`${testCase.label} exports canonical and social metadata`, async () => {
      const metadata = await testCase.module.generateMetadata();

      expect(metadata).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        alternates: {
          canonical: testCase.path,
        },
        openGraph: {
          siteName: 'Wakaya Ecolodge',
          title: expect.any(String),
          description: expect.any(String),
          url: testCase.path,
        },
        twitter: {
          card: 'summary_large_image',
          title: expect.any(String),
          description: expect.any(String),
        },
      });
    });
  }

  it('derives canonical and social metadata for the bungalow detail route', async () => {
    const metadata = await bungalowDetailPageModule.generateMetadata({
      params: Promise.resolve({
        slug: 'bungalow-familiar',
      }),
    });

    expect(metadata).toMatchObject({
      title: 'Bungalow Familiar | Wakaya Ecolodge',
      alternates: {
        canonical: '/es/bungalows/bungalow-familiar',
      },
      openGraph: {
        siteName: 'Wakaya Ecolodge',
        url: '/es/bungalows/bungalow-familiar',
      },
      twitter: {
        card: 'summary_large_image',
      },
    });
  });

  it('keeps page-level metadata coverage on every current public route module', () => {
    const uncoveredRoutePaths = routeModulesRequiringMetadata
      .filter(
        ({ module }) =>
          !('metadata' in module) &&
          !('generateMetadata' in module),
      )
      .map(({ path }) => path);

    expect(uncoveredRoutePaths).toEqual([]);
  });
});
