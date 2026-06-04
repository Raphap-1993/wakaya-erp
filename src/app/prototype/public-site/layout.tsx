import type { ReactNode } from 'react';

import { PlayFooter } from '@/components/public-site/play-footer';
import { PlayHeader } from '@/components/public-site/play-header';
import styles from '@/components/public-site/public-site-theme.module.css';

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
