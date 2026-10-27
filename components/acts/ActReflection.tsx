"use client";

import { useId, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { ArrowRight, Heart, Lock, Plus, X } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const notoTamil = localFont({
  src: "../../app/fonts/NotoSansTamilVF.woff2",
  weight: "100 900",
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
// Inside this section only the heading and the Save CTA use mint.
const WHITE = "#FFFFFF";
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
const HAIRLINE = "1px solid rgba(255, 255, 255, 0.14)";
const STROKE_GREY = "154, 160, 158";
const LOGO_ORANGE = "255, 90, 31";
const MINT_RGB = "104, 255, 173";
// Outer panel: a soft glow around the whole card instead of a stroke. Inner
// cards: a grey stroke only along the top half that fades out downwards (a
// masked ::before). My Reflection: a full gradient stroke, logo orange at the
// bottom-left to mint at the top-right, with a matching glow.
const REFLECTION_CSS = `
  .rf-panel { box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 0 26px 2px rgba(255,255,255,0.14); }
  .rf-card { position: relative; box-shadow: 0 -2px 14px -6px rgba(${STROKE_GREY},0.35); }
  .rf-card::before {
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
    background: linear-gradient(180deg, rgba(${STROKE_GREY},0.95) 0%, rgba(${STROKE_GREY},0.45) 30%, rgba(${STROKE_GREY},0) 55%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .rf-card.rf-gradient { box-shadow: 0 0 22px -4px rgba(${LOGO_ORANGE},0.35), 0 0 22px -4px rgba(${MINT_RGB},0.25); }
  .rf-card.rf-gradient::before {
    padding: 1.5px;
    background: linear-gradient(45deg, rgb(${LOGO_ORANGE}) 0%, rgba(${LOGO_ORANGE},0) 38%, rgba(${MINT_RGB},0) 62%, rgb(${MINT_RGB}) 100%);
  }
`;
const SAVE_GRADIENT = `linear-gradient(180deg, #8DFFC4 0%, ${MINT} 55%, #3FE08C 100%)`;
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
      className={`${inter.className} flex items-center justify-center gap-1 whitespace-nowrap h-8 px-1 text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{
        borderRadius: CONTROL_RADIUS,
        background: CHIP_BG,
        color: "#FFFFFF",
        border: selected ? `1.5px solid ${WHITE}` : "1.5px solid transparent",
        outlineColor: WHITE,
      }}
    >
      {selected ? (
        <X size={12} strokeWidth={2.5} color={WHITE} />
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
      style={{ outlineColor: WHITE }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center transition-colors"
        style={{
          background: isPrivate ? WHITE : CHIP_BG,
          borderRadius: CONTROL_RADIUS,
        }}
      >
        <Lock
          size={16}
          strokeWidth={2}
          color={isPrivate ? TEAL : "#FFFFFF"}
          fill={isPrivate ? TEAL : "#FFFFFF"}
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

  // Full-bleed to the viewport edges and down to the page bottom, like the
  // Snapshot section (-mx-5 / -mb-16 cancel the page wrapper's px-5 / pb-16).
  return (
    <>
      <style>{REFLECTION_CSS}</style>
      <section
        className="-mx-5 px-5 py-10"
        style={{ background: TEAL, borderRadius: 12 }}
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
            className="rf-panel flex flex-col gap-4 p-3"
            style={{ background: PANEL, borderRadius: CARD_RADIUS }}
          >
            <div
              className="rf-card p-4"
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
              className="rf-card p-4"
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
                  rows={4}
                  placeholder="Share what this moment meant to you..."
                  className={`${inter.className} w-full resize-none px-3 pb-7 pt-2.5 text-[12px] leading-[1.45] placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{
                    background: CHIP_BG,
                    color: "#FFFFFF",
                    outlineColor: WHITE,
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

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleMaybeLater}
                className={`${inter.className} h-8 px-4 text-[12px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                style={{
                  background: PANEL,
                  border: HAIRLINE,
                  color: "#FFFFFF",
                  outlineColor: WHITE,
                  borderRadius: CONTROL_RADIUS,
                }}
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`${inter.className} flex h-8 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[12px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                style={{
                  background: SAVE_GRADIENT,
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: "0 0 14px rgba(104, 255, 173, 0.28)",
                  color: TEAL,
                  outlineColor: WHITE,
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
                  className="rf-card rf-gradient p-4"
                  style={{
                    background: CARD_SURFACE,
                    borderRadius: CARD_RADIUS,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center"
                      style={{
                        background: CHIP_BG,
                        borderRadius: CONTROL_RADIUS,
                      }}
                    >
                      <Heart
                        size={18}
                        strokeWidth={2}
                        color={WHITE}
                        fill={WHITE}
                      />
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
                      className={`${inter.className} shrink-0 self-start h-6 px-3 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                      style={{
                        background: CHIP_BG,
                        color: "#FFFFFF",
                        outlineColor: WHITE,
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
                          className={`${inter.className} flex h-8 items-center px-5 text-[11px] font-medium`}
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `rgba(${MINT_RGB}, 0.24)` }}
                  >
                    <span
                      className={`${inter.className} flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-extrabold`}
                      style={{ background: MINT, color: TEAL }}
                    >
                      i
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`${calSans.className} m-0 text-[12px] font-semibold leading-[1.3]`}
                      style={{ color: "#FFFFFF" }}
                    >
                      Some moments are worth leaving for the next generation
                    </p>
                    <p
                      className={`${calSans.className} m-0 mt-0.5 text-[11px]`}
                      style={{ color: "rgba(255, 255, 255, 0.6)" }}
                    >
                      Add this reflection to your legacy
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${inter.className} flex shrink-0 items-center gap-1 h-8 px-3 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                    style={{
                      background: PANEL,
                      color: "#FFFFFF",
                      outlineColor: WHITE,
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
      <footer className="flex flex-col items-center gap-3 pt-8 text-center">
        <span
          className={`${calSans.className} text-[13px] font-medium`}
          style={{ color: "#5C6B69" }}
        >
          Held with{" "}
          <span className={notoTamil.className} style={{ fontWeight: 600 }}>
            அறம்
          </span>{" "}
          by
        </span>
        <Image
          src="/brand/distant-devotion-logo.png"
          alt="Distant Devotion"
          width={664}
          height={301}
          sizes="150px"
          className="h-auto w-[150px] rounded-[10px]"
        />
        <span
          className={`${calSans.className} text-[14px] font-medium`}
          style={{ color: TEAL }}
        >
          Keeping what matters alive
        </span>
      </footer>
    </>
  );
}
