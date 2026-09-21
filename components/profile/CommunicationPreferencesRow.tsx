"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { updateNotificationPreferencesAction } from "@/lib/notifications-actions";

interface CommunicationPreferencesRowProps {
  initialNotifyParticipationReminders: boolean;
  initialNotifyActPublished: boolean;
  initialNotifyContinuityReminders: boolean;
}

const PREFERENCES: { name: string; label: string; helper: string }[] = [
  {
    name: "notify_participation_reminders",
    label: "Participation reminders",
    helper: "It's time for this month's Act of Aram.",
  },
  {
    name: "notify_act_published",
    label: "Act published",
    helper: "A new Act of Aram you helped create has been published.",
  },
  {
    name: "notify_continuity_reminders",
    label: "Continuity reminders",
    helper: "You have maintained N months of continuity.",
  },
];

/** CA-013 Account Settings' "Communication preferences" row, now real: an
 *  inline disclosure (same pattern as PersonalDetailsRow) toggling the
 *  three Phase 4 notification types on/off, backed by
 *  updateNotificationPreferencesAction(). Was a dead static placeholder --
 *  shipping real notifications without a real off switch would cut
 *  against the locked Notification Philosophy's own "avoid pressure" rule. */
export function CommunicationPreferencesRow({
  initialNotifyParticipationReminders,
  initialNotifyActPublished,
  initialNotifyContinuityReminders,
}: CommunicationPreferencesRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateNotificationPreferencesAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const defaults: Record<string, boolean> = {
    notify_participation_reminders: initialNotifyParticipationReminders,
    notify_act_published: initialNotifyActPublished,
    notify_continuity_reminders: initialNotifyContinuityReminders,
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm"
      >
        Communication preferences
        {open ? (
          <ChevronDown size={16} className="text-[var(--color-muted-foreground)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
        )}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-4">
          {PREFERENCES.map((pref) => (
            <label key={pref.name} className="flex items-start gap-3 text-sm">
              <input type="checkbox" name={pref.name} defaultChecked={defaults[pref.name]} className="mt-0.5" />
              <span>
                <span className="block font-medium text-[var(--color-foreground)]">{pref.label}</span>
                <span className="block text-xs text-[var(--color-muted-foreground)]">{pref.helper}</span>
              </span>
            </label>
          ))}
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
