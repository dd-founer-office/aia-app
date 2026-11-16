import type { VaazhgaReport } from "./vaazhga-vaazhthudan-reports";

/**
 * Approved copy for the booker's Vaazhga Vaazhthudan report, word for word.
 * Recipient details (name, pronouns, deity, place) are filled in from the
 * report's own data, so nothing about the recipient is hard-coded here.
 * Straight apostrophes are exactly as approved.
 */
const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function reportCopy(report: VaazhgaReport) {
  const { recipient: name, pronouns: p, deity, deityShort, place } = report;

  return {
    hero: {
      headline: "Some wishes travel farther than words.",
      /** The word in the headline that is shown highlighted (a styling choice; the text is unchanged). */
      highlight: "travel",
      paragraphs: [
        `You wanted ${name} to receive ${deityShort}'s blessings on ${p.possessive} birthday.`,
        `${cap(p.possessive)} name and star were offered in prayer at ${place}. The moments from the temple have been preserved here, and ${p.possessive} blessed prasadam is now being prepared for its journey home.`,
        "A birthday wish, a prayer and your love, brought a little closer, despite the distance.",
      ],
    },
    lamp: {
      headline: "A prayer begins with a flame.",
      paragraphs: [
        `Every meaningful wish begins somewhere. Yours began with a simple intention: to seek ${deityShort}'s blessings for ${name}.`,
        "And so, we began.",
      ],
    },
    temple: {
      headline: `At the abode of ${deity}.`,
      paragraphs: [
        `We carried your wishes to ${place}, where ${name}'s name and star were offered in prayer.`,
        "Here are the moments from that visit.",
      ],
    },
    share: {
      headline: `Now, let ${name} be part of this moment.`,
      paragraphs: [
        `A page made especially for ${p.object}, with the prayer offered in ${p.possessive} name and glimpses of the temple visit.`,
        `Add your birthday wishes and share this little piece of the celebration with ${p.object}.`,
      ],
      button: `Share ${name}'s blessing`,
      note: "You'll see a preview before sharing.",
    },
    status: {
      headline: "A little blessing, on its way home.",
      paragraphs: [
        `The prayer has been offered. We are now carefully preparing the blessed prasadam for its journey to ${name}.`,
        "Follow its journey here. We'll update you as it makes its way home.",
      ],
      /** Shown while the prasadam is being packed. */
      packing: `The blessed prasadam is being packed with ${name}'s sankalpam card. We'll let you know as soon as it is dispatched.`,
    },
    track: { button: "Track Here" },
    tamil: {
      lines: ["விரைவில்", "அருளும் பொருளும்", "இல்லம் சேரும்"],
      english: "Soon, blessings will find their way home.",
    },
    journey: {
      heading: `${name}'s blessing journey`,
      milestones: {
        blessed: {
          title: "Prayer offered",
          text: `${name}'s name and star were offered before ${deity}.`,
        },
        packed: {
          title: "Prasadam preparation",
          text: `${cap(p.possessive)} blessed prasadam and sankalpam card are being carefully packed.`,
        },
        shipped: {
          title: "Dispatched",
          text: "The offering has begun its journey home.",
        },
        transit: {
          title: "On its way home",
          text: `The package is travelling to ${name}.`,
        },
        delivered: {
          title: "Delivered",
          text: "The blessed offering has reached home.",
        },
      },
      labels: {
        done: "Completed",
        inProgress: "In progress",
        awaiting: "Awaiting update",
      },
    },
  };
}
