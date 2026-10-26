"use client";

import { useId, useState } from "react";
import localFont from "next/font/local";
import { ArrowRight, Info, Lock, Pencil, Plus, X } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

// Reuses ActDetailHero/ActTheAct/ActEvidence's exact teal/mint pair for
// the section surface and accents.
const TEAL = "#0A363A";
const MINT = "#68FFAD";
// New, local to this section only -- a darker-than-TEAL charcoal-teal
// surface for the inset cards (feeling picker, textarea, My Reflection),
// distinct from the outer TEAL section behind them. No existing token
// covers this depth; same precedent as ActTheAct's own local chip colors.
const CARD_SURFACE = "#0F2422";
const CHIP_BG = "#1B3F3C";

const FEELINGS = ["Connected", "Grateful", "Peaceful", "Responsible", "Inspired", "Hopeful"] as const;

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
  // Badge swaps "+" (unselected, leading) for "x" (selected, trailing) --
  // same icon-swap/position-swap mechanic as the founder's reference,
  // not its colors: this app's own mint-badge/teal-icon pairing instead.
  const badge = (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: MINT }}>
      {selected ? <X size={12} strokeWidth={2.5} color={TEAL} /> : <Plus size={12} strokeWidth={2.5} color={TEAL} />}
    </span>
  );

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`${inter.className} flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{
        background: CHIP_BG,
        color: "#FFFFFF",
        border: selected ? `1.5px solid ${MINT}` : "1.5px solid transparent",
        outlineColor: MINT,
      }}
    >
      {!selected && badge}
      {label}
      {selected && badge}
    </button>
  );
}

function PrivacyToggle({ isPrivate, onToggle }: { isPrivate: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPrivate}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-[12px] px-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ outlineColor: MINT }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors"
        style={{ background: isPrivate ? MINT : CHIP_BG }}
      >
        <Lock size={16} strokeWidth={2} color={isPrivate ? TEAL : "rgba(255, 255, 255, 0.6)"} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={`${inter.className} text-[14px] font-semibold`} style={{ color: "#FFFFFF" }}>
          Private to you
        </span>
        <span className={`${inter.className} text-[12px]`} style={{ color: "rgba(255, 255, 255, 0.55)" }}>
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
  const [selectedFeelings, setSelectedFeelings] = useState<Set<string>>(new Set());
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
    setSaved({ feelings: Array.from(selectedFeelings), text: reflectionText.trim(), isPrivate });
  }

  function handleMaybeLater() {
    setSelectedFeelings(new Set());
    setReflectionText("");
    setIsPrivate(false);
  }

  function handleEdit() {
    if (!saved) return;
    setSelectedFeelings(new Set(saved.feelings));
    setReflectionText(saved.text);
    setIsPrivate(saved.isPrivate);
    setSaved(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[16px] px-5 py-6" style={{ background: TEAL }}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 text-center">
            <h2 className={`${calSans.className} m-0 text-[24px] font-bold leading-[1.15]`} style={{ color: MINT }}>
              And Something Stays
            </h2>
            <p className={`${inter.className} m-0 text-[14px] leading-[1.55]`} style={{ color: "rgba(255, 255, 255, 0.78)" }}>
              Take a moment to capture what this act mean to you.
            </p>
          </div>

          {saved ? (
            <div className="rounded-[14px] p-5" style={{ background: CARD_SURFACE }}>
              <div className="flex items-start justify-between gap-3">
                <h3 className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: "#FFFFFF" }}>
                  My Reflection
                </h3>
                <button
                  type="button"
                  onClick={handleEdit}
                  className={`${inter.className} flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{ background: CHIP_BG, color: "#FFFFFF", outlineColor: MINT }}
                >
                  <Pencil size={12} strokeWidth={2} />
                  Edit
                </button>
              </div>

              {saved.text && (
                <p className={`${inter.className} m-0 mt-3 text-[14px] italic leading-[1.6]`} style={{ color: "rgba(255, 255, 255, 0.88)" }}>
                  &ldquo;{saved.text}&rdquo;
                </p>
              )}

              {saved.feelings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {saved.feelings.map((feeling) => (
                    <span
                      key={feeling}
                      className={`${inter.className} rounded-full px-3 py-1.5 text-[12px] font-medium`}
                      style={{ background: CHIP_BG, color: "#FFFFFF" }}
                    >
                      {feeling}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-[14px] p-5" style={{ background: CARD_SURFACE }}>
                <h3 className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: "#FFFFFF" }}>
                  This act made me feel...
                </h3>
                <p className={`${inter.className} m-0 mt-0.5 text-[12px]`} style={{ color: "rgba(255, 255, 255, 0.55)" }}>
                  You can choose more than one.
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
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

              <div className="rounded-[14px] p-5" style={{ background: CARD_SURFACE }}>
                <label htmlFor={textareaId} className="block cursor-text">
                  <h3 className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: "#FFFFFF" }}>
                    Or write it in your own words (optional)
                  </h3>
                  <p className={`${inter.className} m-0 mt-0.5 text-[12px]`} style={{ color: "rgba(255, 255, 255, 0.55)" }}>
                    What would you like to remember about this moment?
                  </p>
                </label>
                <textarea
                  id={textareaId}
                  value={reflectionText}
                  onChange={(event) => setReflectionText(event.target.value.slice(0, MAX_LENGTH))}
                  maxLength={MAX_LENGTH}
                  rows={4}
                  placeholder="Share what this moment meant to you..."
                  className={`${inter.className} mt-3 w-full resize-none rounded-[10px] px-3.5 py-3 text-[13.5px] leading-[1.5] placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{ background: "rgba(255, 255, 255, 0.06)", color: "#FFFFFF", outlineColor: MINT }}
                />
                <div className={`${inter.className} mt-1 text-right text-[11px]`} style={{ color: "rgba(255, 255, 255, 0.45)" }}>
                  {reflectionText.length}/{MAX_LENGTH}
                </div>
              </div>

              <PrivacyToggle isPrivate={isPrivate} onToggle={() => setIsPrivate((v) => !v)} />

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleMaybeLater}
                  className={`${inter.className} flex-1 rounded-full px-4 py-2.5 text-[13.5px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{ background: CHIP_BG, color: "#FFFFFF", outlineColor: MINT }}
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`${inter.className} flex flex-[1.4] items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{ background: MINT, color: TEAL, outlineColor: TEAL }}
                >
                  Save Reflection
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {saved && (
        <div className="flex items-center gap-3 rounded-[14px] px-4 py-3.5" style={{ background: "#FFFFFF", border: "1px solid var(--color-border)" }}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: MINT }}>
            <Info size={14} strokeWidth={2.5} color={TEAL} />
          </span>
          <p className={`${inter.className} m-0 min-w-0 flex-1 text-[12.5px] leading-[1.4]`} style={{ color: "var(--color-foreground)" }}>
            Some moments are worth leaving for the next generation.
          </p>
          <button
            type="button"
            className={`${inter.className} flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[12px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
            style={{ background: TEAL, color: "#FFFFFF", outlineColor: TEAL }}
          >
            Add to Legacy
            <ArrowRight size={13} strokeWidth={2.5} color={MINT} />
          </button>
        </div>
      )}
    </div>
  );
}
