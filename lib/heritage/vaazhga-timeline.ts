import { giftCopy } from "./vaazhga-gift-copy";
import { reportCopy } from "./vaazhga-copy";
import type { VaazhgaReport } from "./vaazhga-vaazhthudan-reports";

export type StepKey = "received" | "blessed" | "packed" | "shipped" | "transit" | "delivered";

export type TimelineStep = {
  key: StepKey;
  title: string;
  /** The line under the title when this step is selected. */
  text: string;
  done: boolean;
  /** Small label under the circles for the selected step. */
  status: string;
  /** Recorded details for this step (date, courier reference), shown only when they exist. */
  meta?: string;
};

export type Audience = "booker" | "gift";

/**
 * The prasadam journey, worked out from the report's tracker dates. A step is
 * done once its date is set; the first step that is not done is the current
 * one. The booker sees five steps (it starts with their blessing arriving);
 * the birthday person sees the four that concern them.
 */
export function buildTimeline(report: VaazhgaReport, audience: Audience): { steps: TimelineStep[]; current: number } {
  const { recipient, deity, pronouns: p, gift } = report;
  const t = gift.tracker;
  const you = audience === "gift";
  const who = you ? "you" : recipient;
  const whose = you ? "your" : `${recipient}’s`;
  const sankalpam = you ? "your sankalpam card" : `${p.possessive} sankalpam card`;
  const on = (d?: string) => (d ? ` on ${d}` : "");

  const all: (TimelineStep | null)[] = [
    audience === "booker"
      ? {
          key: "received",
          title: "Blessing received",
          text: `We have your blessing for ${recipient}, and our team took it from there.`,
          done: true,
          status: "Done",
        }
      : null,
    {
      key: "blessed",
      title: "Blessed at the temple",
      text: t.blessedOn
        ? `Offered before ${deity}, in ${whose} name${on(t.blessedOn)}.`
        : `We will offer it before ${deity}, in ${whose} name.`,
      done: Boolean(t.blessedOn),
      status: t.blessedOn ? "Done" : "In progress",
    },
    {
      key: "packed",
      title: t.packedOn ? "Packed with the sankalpam card" : "Being packed",
      text: t.packedOn
        ? `The blessed prasadam was packed with ${sankalpam}${on(t.packedOn)}.`
        : `We pack the blessed prasadam with ${sankalpam}, then send it to ${who}.`,
      done: Boolean(t.packedOn),
      status: t.packedOn ? "Done" : "Packing in progress",
    },
    {
      key: "shipped",
      title: "On its way",
      text: t.shippedOn
        ? t.courierRef
          ? `Courier reference ${t.courierRef}.`
          : `It left${on(t.shippedOn)} and is travelling to ${who}.`
        : "Once it ships, the courier details appear here.",
      done: Boolean(t.shippedOn),
      status: t.shippedOn ? "Done" : "On its way",
    },
    {
      key: "delivered",
      title: "Delivered",
      text: t.deliveredOn
        ? `Delivered to ${who}${on(t.deliveredOn)}.`
        : `We will update this page when it reaches ${who}.`,
      done: Boolean(t.deliveredOn),
      status: t.deliveredOn ? "Done" : "Coming up",
    },
  ];

  const steps = all.filter((s): s is TimelineStep => s !== null);
  const firstOpen = steps.findIndex((s) => !s.done);
  return { steps, current: firstOpen === -1 ? steps.length - 1 : firstOpen };
}

/**
 * The booker's blessing journey: five milestones with the approved wording
 * (see vaazhga-copy.ts), driven by the same tracker dates as before. A
 * milestone is completed only when its own date is recorded, and nothing is
 * inferred: dispatch and delivery are never shown as done without a record.
 * "On its way home" has no date of its own, so it completes with delivery.
 */
export function buildBookerJourney(report: VaazhgaReport): { steps: TimelineStep[]; current: number } {
  const t = report.gift.tracker;
  const { milestones, labels } = reportCopy(report).journey;

  const defs: { key: StepKey; date?: string; extra?: string }[] = [
    { key: "blessed", date: t.blessedOn },
    { key: "packed", date: t.packedOn },
    { key: "shipped", date: t.shippedOn, extra: t.courierRef ? `Courier reference ${t.courierRef}` : undefined },
    { key: "transit", date: t.deliveredOn ? t.shippedOn ?? "" : undefined },
    { key: "delivered", date: t.deliveredOn },
  ];
  const done = [Boolean(t.blessedOn), Boolean(t.packedOn), Boolean(t.shippedOn), Boolean(t.deliveredOn), Boolean(t.deliveredOn)];
  const firstOpen = done.findIndex((d) => !d);
  const current = firstOpen === -1 ? defs.length - 1 : firstOpen;

  const steps = defs.map(({ key, date, extra }, i): TimelineStep => {
    const m = milestones[key as keyof typeof milestones];
    const inProgress = !done[i] && i === current && (key === "packed" || key === "transit");
    const meta = key === "transit" ? undefined : [date, extra].filter(Boolean).join(" · ") || undefined;
    return {
      key,
      title: m.title,
      text: m.text,
      done: done[i],
      status: done[i] ? labels.done : inProgress ? labels.inProgress : labels.awaiting,
      meta,
    };
  });
  return { steps, current };
}

/**
 * The birthday person's journey: four milestones with the approved wording
 * (see vaazhga-gift-copy.ts), from the same tracker dates. A milestone is
 * completed only when its own date is recorded.
 */
export function buildGiftJourney(report: VaazhgaReport): { steps: TimelineStep[]; current: number } {
  const t = report.gift.tracker;
  const j = giftCopy(report).journey;
  const defs: { key: "blessed" | "packed" | "shipped" | "delivered"; date?: string; extra?: string }[] = [
    { key: "blessed", date: t.blessedOn },
    { key: "packed", date: t.packedOn },
    { key: "shipped", date: t.shippedOn, extra: t.courierRef ? `Courier reference ${t.courierRef}` : undefined },
    { key: "delivered", date: t.deliveredOn },
  ];
  const done = defs.map((d) => Boolean(d.date));
  const firstOpen = done.findIndex((d) => !d);
  const current = firstOpen === -1 ? defs.length - 1 : firstOpen;
  const steps = defs.map(({ key, date, extra }, i): TimelineStep => ({
    key,
    title: j[key].title,
    text: j[key].text,
    done: done[i],
    status: done[i] ? j.labels.done : i === current && key === "packed" ? j.labels.inProgress : j.labels.awaiting,
    meta: [date, extra].filter(Boolean).join(" · ") || undefined,
  }));
  return { steps, current };
}
