import g from "./gift.module.css";
import s from "./report.module.css";

/** Smaller type for longer messages, so the card never overflows. */
const messageSize = (n: number) => (n <= 90 ? 22 : n <= 180 ? 18 : 15);

/**
 * The sender's card: a quote mark, their own words and a sign-off line for
 * each name. The same card is on the stage the birthday person opens and in
 * the "how it will look" box the sender sees while writing.
 */
export function SenderCard({ text, signoffs }: { text: string; signoffs: string[] }) {
  return (
    <div className={`${g.paper} ${g.paperSender}`}>
      <div className={g.artTop} />
      <span className={g.cardMark} aria-hidden="true">
        &ldquo;
      </span>
      <p className={`${s.cal} ${g.cardText}`} style={{ fontSize: messageSize(text.length) }}>
        {text}
      </p>
      {signoffs.map((line) => (
        <p key={line} className={g.cardSign}>
          {line}
        </p>
      ))}
      <div className={g.artBottom} />
    </div>
  );
}
