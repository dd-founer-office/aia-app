"use client";

import { MAX_MESSAGE_LENGTH } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { useMessage } from "./MessageContext";
import g from "./gift.module.css";
import s from "./report.module.css";

export function Quote({ sender, text }: { sender: string; text: string }) {
  return (
    <>
      <span className={g.messageFrom}>A message from {sender}</span>
      <p className={`${s.cal} ${g.messageText}`}>
        <span className={g.messageMark} aria-hidden="true">
          &ldquo;
        </span>
        {text}
      </p>
    </>
  );
}

/**
 * The sender's own words, right after the opener. The recipient sees the
 * message when there is one. The booker, in preview, sees a box to write it
 * in, with a live look at how it will appear.
 */
export function MessageSection({ sender, recipient, preview, sent, headline, text }: { sender: string; recipient: string; preview: boolean; sent: string; headline: string; text: string }) {
  const { message, setMessage } = useMessage();

  if (preview) {
    return (
      <section className={g.compose} aria-label="Your message">
        <label htmlFor="sender-message" className={s.cal}>
          Add your own words
        </label>
        <p className={g.composeHint}>
          A few lines from you to {recipient}. They appear on {recipient}&rsquo;s page, right after the first screen.
        </p>
        <textarea
          id="sender-message"
          value={message}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={`Write a few words for ${recipient}…`}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={g.count} aria-live="polite">
          {message.length} / {MAX_MESSAGE_LENGTH}
        </div>
        {message.trim() ? (
          <>
            <p className={g.howItLooks}>How it will look</p>
            <div className={g.composePreview}>
              <Quote sender={sender} text={message.trim()} />
            </div>
          </>
        ) : null}
      </section>
    );
  }

  if (!sent) return null;
  return (
    <section className={g.message} aria-label={`A message from ${sender}`}>
      <h2 className={`${s.cal} ${g.messageHead}`}>{headline}</h2>
      <p className={g.messageLead}>{text}</p>
      <Quote sender={sender} text={sent} />
    </section>
  );
}
