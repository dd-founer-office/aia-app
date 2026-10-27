"use client";

import { useId, useState } from "react";
import localFont from "next/font/local";
import { ArrowRight, Heart, Info, Lock, Plus, X } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

// Reuses ActDetailHero/ActTheAct/ActEvidence's exact teal/mint pair for
// the section surface and accents.
const TEAL = "#0A363A";
const MINT = "#68FFAD";
// New, local to this section only -- a darker-than-TEAL charcoal-teal
// surface for the inset cards (feeling picker, textarea, My Reflection),
// distinct from the outer TEAL section behind them. No existing token
// covers this depth; same precedent as ActTheAct's own local chip colors.
// Neutral charcoal stack from the founder's reference: one dark panel
// holding slightly lighter cards, with a lighter grey for chips/inputs.
const PANEL = "#1B1B1B";
const CARD_SURFACE = "#232323";
const CHIP_BG = "#363636";
const CARD_RADIUS = 8;
const CONTROL_RADIUS = 6;

const FEELINGS = [
  "Connected",
  "Grateful",
  "Peaceful",
  "Responsible",
  "Inspired",
  "Hopeful",
] as const;

const MAX_LENGTH = 500;

interface SavedReflection {
  feelings: string[];
  text: string;
  isPrivate: boolean;
}

function FeelingChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`${inter.className} flex items-center justify-center gap-1 whitespace-nowrap px-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{
        borderRadius: CONTROL_RADIUS,
        background: CHIP_BG,
        color: "#FFFFFF",
        border: selected ? `1.5px solid ${MINT}` : "1.5px solid transparent",
        outlineColor: MINT,
      }}
    >
      {selected ? (
        <X size={12} strokeWidth={2.5} color={MINT} />
      ) : (
        <Plus size={12} strokeWidth={2.5} />
      )}
      {label}
    </button>
  );
}

function PrivacyToggle({
  isPrivate,
  onToggle,
}: {
  isPrivate: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPrivate}
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ outlineColor: MINT }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center transition-colors"
        style={{
          background: isPrivate ? MINT : CHIP_BG,
          borderRadius: CONTROL_RADIUS,
        }}
      >
        <Lock
          size={16}
          strokeWidth={2}
          color={isPrivate ? TEAL : "rgba(255, 255, 255, 0.6)"}
        />
      </span>
      <span className="flex flex-col gap-0.5">
        <span
          className={`${calSans.className} text-[15px] font-semibold`}
          style={{ color: "#FFFFFF" }}
        >
          Private to you
        </span>
        <span
          className={`${calSans.className} text-[12px]`}
          style={{ color: "rgba(255, 255, 255, 0.85)" }}
        >
          Only you can see this reflection.
        </span>
      </span>
    </button>
  );
}

/**
 * Act Detail's Reflection section -- "what did this experience mean to
 * me," kept deliberately separate from the Contribution Impact Record's
 * accountability layer (see that component's own comment) and never
 * merged into it. Pure client-side state: Save Reflection moves local
 * state from the editable form into the read-only "My Reflection"
 * summary, nothing is persisted to Supabase (no reflections table exists
 * yet), so a page refresh resets it. Generic copy, not Annadhanam-
 * specific -- hardcoded here rather than threaded through
 * lib/act-content-overrides.ts since it reads the same on any Act.
 */
export function ActReflection() {
  const [selectedFeelings, setSelectedFeelings] = useState<Set<string>>(
    new Set(),
  );
  const [reflectionText, setReflectionText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saved, setSaved] = useState<SavedReflection | null>(null);
  const textareaId = useId();

  function toggleFeeling(feeling: string) {
    setSelectedFeelings((previous) => {
      const next = new Set(previous);
      if (next.has(feeling)) next.delete(feeling);
      else next.add(feeling);
      return next;
    });
  }

  function handleSave() {
    setSaved({
      feelings: Array.from(selectedFeelings),
      text: reflectionText.trim(),
      isPrivate,
    });
  }

  function handleMaybeLater() {
    setSelectedFeelings(new Set());
    setReflectionText("");
    setIsPrivate(false);
  }

  // The form stays on screen under the summary (as in the reference), so
  // Edit only has to hide the summary; the form still holds the values.
  function handleEdit() {
    setSaved(null);
  }

  return (
    <section
      className="px-5 py-8"
      style={{ background: TEAL, borderRadius: 16 }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 text-center">
          <h2
            className={`${calSans.className} m-0 text-[26px] font-bold leading-[1.15]`}
            style={{ color: MINT }}
          >
            And Something Stays
          </h2>
          <p
            className={`${inter.className} m-0 text-[16px] leading-[1.45]`}
            style={{ color: "#D4FFE9" }}
          >
            Take a moment to capture what this act mean to you.
          </p>
        </div>

        <div
          className="flex flex-col gap-4 p-3"
          style={{ background: PANEL, borderRadius: CARD_RADIUS }}
        >
          <div
            className="p-4"
            style={{ background: CARD_SURFACE, borderRadius: CARD_RADIUS }}
          >
            <h3
              className={`${calSans.className} m-0 text-[17px] font-semibold`}
              style={{ color: "#FFFFFF" }}
            >
              This act made me feel...
            </h3>
            <p
              className={`${calSans.className} m-0 mt-0.5 text-[12px]`}
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              You can choose more than one.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {FEELINGS.map((feeling) => (
                <FeelingChip
                  key={feeling}
                  label={feeling}
                  selected={selectedFeelings.has(feeling)}
                  onToggle={() => toggleFeeling(feeling)}
                />
              ))}
            </div>
          </div>

          <div
            className="p-4"
            style={{ background: CARD_SURFACE, borderRadius: CARD_RADIUS }}
          >
            <label htmlFor={textareaId} className="block cursor-text">
              <h3
                className={`${calSans.className} m-0 text-[17px] font-semibold`}
                style={{ color: "#FFFFFF" }}
              >
                Or write it in your own words (optional)
              </h3>
              <p
                className={`${calSans.className} m-0 mt-0.5 text-[12px]`}
                style={{ color: "rgba(255, 255, 255, 0.85)" }}
              >
                What would you like to remember about this moment?
              </p>
            </label>
            <div className="relative mt-4">
              <textarea
                id={textareaId}
                value={reflectionText}
                onChange={(event) =>
                  setReflectionText(event.target.value.slice(0, MAX_LENGTH))
                }
                maxLength={MAX_LENGTH}
                rows={5}
                placeholder="Share what this moment meant to you..."
                className={`${inter.className} w-full resize-none px-3 pb-7 pt-2.5 text-[12px] leading-[1.45] placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                style={{
                  background: CHIP_BG,
                  color: "#FFFFFF",
                  outlineColor: MINT,
                  borderRadius: CONTROL_RADIUS,
                }}
              />
              <span
                className={`${inter.className} pointer-events-none absolute bottom-2.5 right-3 text-[10px]`}
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                {reflectionText.length}/{MAX_LENGTH}
              </span>
            </div>
            <div className="mt-4">
              <PrivacyToggle
                isPrivate={isPrivate}
                onToggle={() => setIsPrivate((v) => !v)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleMaybeLater}
              className={`${inter.className} flex-1 px-4 py-3 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              style={{
                background: CHIP_BG,
                color: "#FFFFFF",
                outlineColor: MINT,
                borderRadius: CONTROL_RADIUS,
              }}
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`${inter.className} flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-3 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              style={{
                background: MINT,
                color: TEAL,
                outlineColor: MINT,
                borderRadius: CONTROL_RADIUS,
              }}
            >
              Save Reflection
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          {saved && (
            <>
              <div
                className="p-4"
                style={{ background: CARD_SURFACE, borderRadius: CARD_RADIUS }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center"
                    style={{
                      background: CHIP_BG,
                      borderRadius: CONTROL_RADIUS,
                    }}
                  >
                    <Heart size={18} strokeWidth={2} color={MINT} />
                  </span>
                  <h3
                    className={`${calSans.className} m-0 min-w-0 flex-1 text-[17px] font-semibold`}
                    style={{ color: "#FFFFFF" }}
                  >
                    My Reflection
                  </h3>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={`${inter.className} shrink-0 self-start px-3 py-1 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                    style={{
                      background: CHIP_BG,
                      color: "#FFFFFF",
                      outlineColor: MINT,
                      borderRadius: 4,
                    }}
                  >
                    Edit
                  </button>
                </div>

                {saved.text && (
                  <p
                    className={`${calSans.className} m-0 mt-4 text-[13px] leading-[1.4]`}
                    style={{ color: "#FFFFFF" }}
                  >
                    &ldquo;{saved.text}&rdquo;
                  </p>
                )}

                {saved.feelings.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {saved.feelings.map((feeling) => (
                      <span
                        key={feeling}
                        className={`${inter.className} px-6 py-2.5 text-[11px] font-medium`}
                        style={{
                          background: CHIP_BG,
                          color: "#FFFFFF",
                          borderRadius: CONTROL_RADIUS,
                        }}
                      >
                        {feeling}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-3 px-3 py-4"
                style={{ background: "#202620", borderRadius: CARD_RADIUS }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: MINT }}
                >
                  <Info size={16} strokeWidth={2.5} color={TEAL} />
                </span>
                <p
                  className={`${calSans.className} m-0 min-w-0 flex-1 text-[12px] leading-[1.4]`}
                  style={{ color: "#FFFFFF" }}
                >
                  Some moments are worth leaving for the next generation.
                </p>
                <button
                  type="button"
                  className={`${inter.className} flex shrink-0 items-center gap-1 px-3 py-2 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{
                    background: PANEL,
                    color: "#FFFFFF",
                    outlineColor: MINT,
                    borderRadius: CONTROL_RADIUS,
                  }}
                >
                  Add to Legacy
                  <ArrowRight size={11} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
