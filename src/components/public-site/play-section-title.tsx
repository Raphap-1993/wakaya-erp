import styles from './public-site-theme.module.css';

type PlaySectionTitleProps = {
  subtitle?: string;
  title: string;
  paragraph: string;
  center?: boolean;
};

export function PlaySectionTitle({
  subtitle,
  title,
  paragraph,
  center = true,
}: PlaySectionTitleProps) {
  return (
    <div
      className={`${styles.sectionTitle} ${center ? styles.sectionTitleCentered : ''}`}
    >
      {subtitle ? <span className={styles.sectionSubtitle}>{subtitle}</span> : null}
      <h2>{title}</h2>
      <p>{paragraph}</p>
    </div>
  );
}
