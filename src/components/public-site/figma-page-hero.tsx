import styles from "./figma-public-pages.module.css";

type FigmaPageHeroProps = {
  meta: string;
  title: string;
  copy: string;
  image: string;
  imageAlt?: string;
};

export function FigmaPageHero({
  meta,
  title,
  copy,
  image,
  imageAlt,
}: FigmaPageHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMedia}>
        <img src={image} alt={imageAlt ?? title} />
        <div className={styles.heroOverlay} />
      </div>

      <div className={styles.heroShell}>
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>{meta}</div>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroBody}>{copy}</p>
        </div>

        <div className={styles.heroExplore} aria-hidden="true">
          <div className={styles.heroExploreLabel}>Explorar</div>
          <div className={styles.heroExploreIcon}>↓</div>
        </div>
      </div>
    </section>
  );
}
