import type { VaazhgaReport } from "./vaazhga-vaazhthudan-reports";

/**
 * Approved copy for the page the birthday person sees. Everything that
 * depends on the booking (names, deity, place) is filled in from the report.
 * The prasadam wording follows the real tracker status and never runs ahead
 * of it. Straight apostrophes throughout.
 */
export type GiftStage = "preparing" | "packing" | "packed" | "shipped" | "delivered";

export function giftStage(report: VaazhgaReport): GiftStage {
  const t = report.gift.tracker;
  if (t.deliveredOn) return "delivered";
  if (t.shippedOn) return "shipped";
  if (t.packedOn) return "packed";
  if (t.blessedOn) return "packing";
  return "preparing";
}

export function giftCopy(report: VaazhgaReport) {
  const { recipient: name, deityShort, place, gift } = report;
  const stage = giftStage(report);

  const prasadamLead = {
    preparing: "The prasadam offered at the temple will be prepared for you, along with your sankalpam card.",
    packing: "The prasadam offered at the temple is being carefully prepared for you, along with your sankalpam card.",
    packed: "The prasadam offered at the temple is being carefully prepared for you, along with your sankalpam card.",
    shipped: "The prasadam offered at the temple is on its way to you, along with your sankalpam card.",
    delivered: "The prasadam offered at the temple has reached you, along with your sankalpam card.",
  }[stage];

  const status = {
    preparing: { title: "Your prasadam will be prepared soon.", text: "Once your name and star have been offered, your prasadam and sankalpam card will be prepared for you." },
    packing: { title: "Your prasadam is being packed.", text: "Your blessed prasadam and sankalpam card are being carefully packed. We'll let you know when they begin their journey to you." },
    packed: { title: "Your prasadam is packed.", text: "Your blessed prasadam and sankalpam card are packed and ready to begin their journey to you." },
    shipped: { title: "Your prasadam is on its way.", text: "Your blessed prasadam and sankalpam card have begun their journey to you." },
    delivered: { title: "Your prasadam has reached you.", text: "Your blessed prasadam and sankalpam card have reached you." },
  }[stage];

  return {
    hero: {
      headline: `${name}, this blessing is for you.`,
      paragraphs: [
        `On your birthday, someone who holds you dear wanted to seek ${deityShort}'s blessings for you.`,
        `Your name and star were offered in prayer at ${place}. These moments have been gathered here for you, along with a little something blessed in your name, making its way home.`,
        "A birthday wish, carried with love.",
      ],
    },
    sentBy: `Sent with love by ${gift.sender}`,
    message: {
      headline: "A few words, just for you.",
      text: "Along with this blessing comes a message from someone who wanted to make your day a little more special.",
    },
    offering: {
      headline: "A prayer, made in your name.",
      paragraphs: [
        `At ${place}, your name and star were offered before ${deityShort}, with prayers for your happiness, health and well-being.`,
        "This was a moment set aside for you.",
      ],
    },
    photos: {
      headline: `A morning at ${place}.`,
      paragraphs: [
        "A few moments from the temple visit, when prayers were offered in your name. These photographs preserve a little of the morning, so you can be part of the moment too.",
      ],
    },
    prasadam: {
      headline: "A blessing, making its way home to you.",
      paragraphs: [prasadamLead, `A little from ${place}, sent with the love and wishes of someone dear to you.`],
      status,
      track: "Track your parcel",
    },
    journey: {
      blessed: { title: "Offered in your name", text: `Your name and star were offered in prayer at ${place}.` },
      packed: { title: "Being prepared for you", text: "Your blessed prasadam and sankalpam card are being carefully prepared." },
      shipped: { title: "On its way", text: "Your blessing has begun its journey home to you." },
      delivered: { title: "Reached home", text: "Your blessed offering has reached you." },
      labels: { done: "Completed", inProgress: "In progress", awaiting: "Awaiting update" },
    },
    tamil: {
      label: "வாழ்க வாழ்த்துடன்",
      lines: ["நம்பிக்கை குறையாமல் வாழ்க!", "நற்பேறு விலகாமல் வாழ்க!", "நன்மைகள் மறையாமல் வாழ்க!", "நல்வழி தவறாமல் வாழ்க!"],
      deityLine: `இன்று போல் என்றும் ${report.deityTamil} அருள் சூழ வாழ்க!`,
      closing: "வாழ்க வாழ்த்துடன்! 🙏",
    },
    closing: {
      headline: "Some blessings are received. Some stay with us.",
      paragraphs: [
        "May this birthday bring you happiness, good health and countless reasons to smile.",
        "And may you always feel the love of those who remember you.",
      ],
    },
    discover: {
      headline: "One day, you may have a blessing to send too.",
      paragraphs: [
        "Birthdays, new beginnings, anniversaries and moments when someone needs a little extra love.",
        "There are many ways to remember someone who matters.",
      ],
    },
  };
}
