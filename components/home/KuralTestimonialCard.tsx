import { Check } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { mockKuralOfTheDay } from "@/lib/mock-data";

/**
 * Kural Koorum Aram, testimonial-card treatment (founder reference: a
 * competitor's quote-card design -- italic quote, name/role attribution,
 * a small credibility line, and a circular checkmark badge overlapping
 * the card's bottom-left corner). Content below is still
 * mockKuralOfTheDay (same source the previous, now-dormant Kural section
 * used) -- placeholder until the founder supplies the real copy/icon.
 */
export function KuralTestimonialCard() {
  return (
    <div className="relative mb-3">
      <Card className="flex flex-col gap-4 pb-6">
        <p className="font-tamil-sans text-[20px] font-medium italic leading-[1.5] text-[var(--color-primary-dark)]">
          {mockKuralOfTheDay.kural_tamil.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              திருவள்ளுவர்
            </span>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              · குறள் {mockKuralOfTheDay.kural_number}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {mockKuralOfTheDay.core_principle}
          </p>
        </div>
      </Card>
      {/* Border color is a literal, not --color-background: this badge
          sits against HomeClient's page-local #EAF2F2, not the global
          background token, so the ring has to match that same value to
          blend seamlessly. */}
      <span
        className="absolute -bottom-3 left-6 flex h-9 w-9 items-center justify-center rounded-full border-4"
        style={{ background: "var(--color-primary)", borderColor: "#EAF2F2" }}
      >
        <Check size={16} color="#FFFFFF" strokeWidth={3} />
      </span>
    </div>
  );
}
