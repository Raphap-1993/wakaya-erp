import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { PlayFooter } from '@/components/public-site/play-footer';
import { PlayHeader } from '@/components/public-site/play-header';
import { publicSiteMetadataBase } from '@/components/public-site/public-site-metadata';
import styles from '@/components/public-site/public-site-theme.module.css';

export const metadata: Metadata = {
  metadataBase: publicSiteMetadataBase,
};

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <PlayHeader />
        {children}
        <PlayFooter />
      </div>
    </main>
  );
}
