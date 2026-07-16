import styles from './page-hero.module.css';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  breadcrumb: string;
  copy: string;
  image: string;
  imageAlt?: string;
};

export function PageHero({
  eyebrow,
  title,
  breadcrumb,
  copy,
  image,
  imageAlt,
}: PageHeroProps) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.pageHeroShell}>
        <div className={styles.pageHeroInner}>
          <div className={styles.pageHeroMedia}>
            <img src={image} alt={imageAlt ?? title} />
            <div className={styles.pageHeroOverlay} />
          </div>

          <div className={styles.pageHeroContent}>
            <header className={styles.pageHeroHeader}>
              <span className={styles.pageHeroEyebrow}>{eyebrow}</span>
              <p className={styles.pageHeroBreadcrumb}>{breadcrumb}</p>
              <h1 className={styles.pageHeroTitle}>{title}</h1>
              <p className={styles.pageHeroCopy}>{copy}</p>
            </header>

          </div>
        </div>
      </div>
    </section>
  );
}
