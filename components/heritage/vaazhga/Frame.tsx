import s from "./report.module.css";

/** Thin inset frame with a diamond on each corner, sat on the card's rounded edge. */
export function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
