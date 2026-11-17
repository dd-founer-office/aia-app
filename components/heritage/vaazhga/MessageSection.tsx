"use client";

import { Plus, X } from "lucide-react";
import { MAX_SENDERS, signoffLines } from "@/lib/heritage/vaazhga-senders";
import { MAX_MESSAGE_LENGTH } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { useMessage } from "./MessageContext";
import { SenderCard } from "./SenderCard";
import g from "./gift.module.css";
import s from "./report.module.css";

/**
 * The sender's writing box, on the share view only. They write their words,
 * say who the blessing is from (a name and how they are known, with a plus
 * button for more names), and see the sender's card exactly as the birthday
 * person will get it. The birthday person never sees this: they read the
 * message from the envelope in the hero (HeroReveal).
 */
export function MessageSection({ recipient, preview, composeId }: { recipient: string; preview: boolean; composeId: string }) {
  const { message, setMessage, senders, setSenders } = useMessage();

  if (!preview) return null;

  const update = (i: number, field: "name" | "relation", value: string) =>
    setSenders(senders.map((row, n) => (n === i ? { ...row, [field]: value } : row)));

  return (
    <section id={composeId} className={g.compose} aria-label="Your message">
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

      <p className={g.fromHead}>Who is it from?</p>
      <div className={g.fromRows}>
        {senders.map((row, i) => (
          <div key={i} className={g.fromRow}>
            <input
              className={g.fromInput}
              value={row.name}
              maxLength={40}
              placeholder="Name"
              aria-label={`Name ${i + 1}`}
              autoComplete="off"
              onChange={(e) => update(i, "name", e.target.value)}
            />
            <input
              className={g.fromInput}
              value={row.relation}
              maxLength={24}
              placeholder="Relationship (Appa, Amma…)"
              aria-label={`Relationship ${i + 1}`}
              autoComplete="off"
              onChange={(e) => update(i, "relation", e.target.value)}
            />
            {senders.length > 1 ? (
              <button type="button" className={g.fromRemove} aria-label={`Remove name ${i + 1}`} onClick={() => setSenders(senders.filter((_, n) => n !== i))}>
                <X size={16} strokeWidth={2.4} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {senders.length < MAX_SENDERS ? (
        <button type="button" className={g.fromAdd} onClick={() => setSenders([...senders, { name: "", relation: "" }])}>
          <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
          Add another name
        </button>
      ) : null}

      {message.trim() ? (
        <>
          <p className={g.howItLooks}>How it will look</p>
          <div className={g.previewCard}>
            <SenderCard text={message.trim()} signoffs={signoffLines(senders)} />
          </div>
        </>
      ) : null}
    </section>
  );
}
