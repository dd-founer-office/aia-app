"use client";

import { MAX_MESSAGE_LENGTH } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { useMessage } from "./MessageContext";
import g from "./gift.module.css";
import s from "./report.module.css";

export function Quote({ signoff, text }: { signoff: string; text: string }) {
  return (
    <>
      <span className={g.messageMark} aria-hidden="true">
        &ldquo;
      </span>
      <p className={`${s.cal} ${g.messageText}`}>{text}</p>
      <p className={g.signoff}>{signoff}</p>
    </>
  );
}

/**
 * The booker's box for writing the personal message (share view only), with
 * a live look at how it will appear. The recipient reads the message from the
 * envelope in the hero (HeroReveal).
 */
export function MessageSection({ recipient, preview, signoff }: { recipient: string; preview: boolean; signoff: string }) {
  const { message, setMessage } = useMessage();

  if (!preview) return null;

  return (
      <section className={g.compose} aria-label="Your message">
        <label htmlFor="sender-message" className={s.cal}>
          Add your own words
        </label>
        <p className={g.composeHint}>
          A few lines from you to {recipient}. They open from the sealed envelope on {recipient}&rsquo;s first screen.
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
              <Quote signoff={signoff} text={message.trim()} />
            </div>
          </>
        ) : null}
      </section>
  );
}
