"use client";

import { useRef, useState } from "react";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Direct-to-Supabase-Storage upload for Proof of Act media (hero photo,
 * testimonial video, evidence photos) -- same pattern
 * components/capture/MissionCamera.tsx already uses for execution
 * evidence: upload via the authenticated browser client straight to
 * Storage (bucket "act-proof-media", public read, operator-only insert
 * -- see the act_proofs_full_detail_and_public_link / act-proof-media
 * migrations), then store the public URL. No server-side upload path;
 * the server action only ever receives the resulting URL.
 */
export function ActProofMediaUpload({
  label,
  accept,
  maxSizeMb,
  value,
  onChange,
  kind,
}: {
  label: string;
  accept: string;
  maxSizeMb: number;
  value: string;
  onChange: (url: string) => void;
  kind: "image" | "video";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File is too large (max ${maxSizeMb}MB).`);
      return;
    }

    const supabase = getSupabaseAuthBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
    const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("act-proof-media")
      .upload(path, file, { contentType: file.type || undefined });
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("act-proof-media").getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">{label}</span>
      {value ? (
        <div className="flex items-center gap-3">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-16 w-16 rounded-[8px] object-cover" />
          ) : (
            <video src={value} className="h-16 w-28 rounded-[8px] object-cover" muted />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-[var(--color-muted-foreground)] underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-[var(--radius-button)] border border-dashed border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-muted-foreground)]"
        >
          {uploading ? "Uploading…" : `Upload ${kind === "video" ? "a video" : "a photo"}`}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
