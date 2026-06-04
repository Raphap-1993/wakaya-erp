import styles from './public-site-theme.module.css';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  breadcrumb: string;
  copy: string;
};

export function PageHero({ eyebrow, title, breadcrumb, copy }: PageHeroProps) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.pageHeroInner}>
        <span className={styles.pageHeroEyebrow}>{eyebrow}</span>
        <p className={styles.pageHeroBreadcrumb}>{breadcrumb}</p>
        <h1 className={styles.pageHeroTitle}>{title}</h1>
        <p className={styles.pageHeroCopy}>{copy}</p>
      </div>
    </section>
  );
}
