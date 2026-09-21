"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { updatePersonalDetailsAction } from "@/lib/profile-actions";

interface PersonalDetailsRowProps {
  initialName: string;
  initialCountry: string | null;
}

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

/** CA-013 Account Settings' "Personal details" row, now real: an inline
 *  disclosure (no separate screen/modal needed for two fields) that edits
 *  the name/country updatePersonalDetailsAction() writes. The other two
 *  Account Settings rows ("Communication preferences", "Privacy settings")
 *  stay static placeholders -- out of scope here, no real destination for
 *  either exists yet. */
export function PersonalDetailsRow({ initialName, initialCountry }: PersonalDetailsRowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updatePersonalDetailsAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm"
      >
        Personal details
        {open ? (
          <ChevronDown size={16} className="text-[var(--color-muted-foreground)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
        )}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-4">
          <label className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
            Name
            <input name="name" required defaultValue={initialName} className={inputClass()} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
            Country
            <input name="country" defaultValue={initialCountry ?? ""} placeholder="Optional" className={inputClass()} />
          </label>
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
