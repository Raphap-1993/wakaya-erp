import styles from "./reservations.module.css";
import {
  buildReservationInfoChips,
  type ReservationInfoChipSource,
} from "./reservation-info-chips";

type ReservationInfoChipsProps = ReservationInfoChipSource & {
  className?: string;
};

export function ReservationInfoChipsView({
  className,
  ...source
}: ReservationInfoChipsProps) {
  const chips = buildReservationInfoChips(source);

  return (
    <div className={`${styles.legendGrid}${className ? ` ${className}` : ""}`.trim()}>
      {chips.map((chip) => {
        const chipClassName = chip.tone ? `${styles.badge} ${styles[chip.tone]}` : styles.badge;
        return (
          <span key={chip.key} className={chipClassName} title={`${chip.label}: ${chip.value}`}>
            {chip.value}
          </span>
        );
      })}
    </div>
  );
}
