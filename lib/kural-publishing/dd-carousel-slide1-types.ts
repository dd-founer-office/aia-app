/**
 * DD- Carousel (Slide 1) — Data Model
 * ----------------------------------------------------------------------------
 * Deliberately minimal and independent of the existing Distant Devotion
 * intelligence layer (lib/kural-publishing/distant-devotion/types.ts -- the
 * Worlds/FLP-lens/Safety-Override paste-and-validate pipeline). That layer
 * is for longer-form, source-sensitive storytelling composed from a
 * prompt-compiler + external-model round trip; this format is one Tamil
 * headline and one short English line, directly typed, visible the moment
 * this content type is selected -- no compile/paste step. Same reasoning as
 * distant-devotion-6sec-types.ts's own doc comment for why that format also
 * skipped the FLP/safety apparatus.
 *
 * DEFAULT_DD_CAROUSEL_SLIDE1_CONTENT is the exact founder-supplied reference
 * example (from the Figma screenshot this template was built from), so the
 * template shows real, correct content immediately on selection rather than
 * an empty form.
 */

/** A single Tamil sentence. At most one short phrase may be wrapped in
 *  **double asterisks** to mark it for inline visual emphasis (rendered as
 *  highlighted text on the panel, never literal asterisks). */
export interface DdCarouselSlide1Content {
  tamilHeadline: string;
  /** Short (ideally two-line) English paraphrase/translation shown beneath
   *  the Tamil headline. */
  englishSupport: string;
}

export const DEFAULT_DD_CAROUSEL_SLIDE1_CONTENT: DdCarouselSlide1Content = {
  tamilHeadline: "குழந்தைகள் வார்த்தைகளை விட, நம் **பழக்கங்களையே** ஆழமாகச் சேமித்துக் கொள்கிறார்கள்.",
  englishSupport: "Children rarely store our lectures. They store our habits.",
};
