"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/notifications-actions";
import type { NotificationRow } from "@/lib/notifications";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function NotificationsClient({ notifications }: { notifications: NotificationRow[] }) {
  const [items, setItems] = useState(notifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = items.filter((n) => !n.readAtIso).length;

  function handleOpen(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.readAtIso) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAtIso: new Date().toISOString() } : n)));
    startTransition(() => {
      markNotificationReadAction(id);
    });
  }

  function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => (n.readAtIso ? n : { ...n, readAtIso: new Date().toISOString() })));
    startTransition(() => {
      markAllNotificationsReadAction();
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {unreadCount > 0 && (
        <Button variant="text" className="self-end" onClick={handleMarkAllRead} disabled={isPending}>
          Mark all as read
        </Button>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Nothing here yet. You&apos;ll see updates about your participation and Acts of Aram as they happen.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const unread = !n.readAtIso;
            const card = (
              <div
                className={`rounded-[var(--radius-card)] border p-4 text-left ${
                  unread
                    ? "border-[var(--color-primary)] bg-[var(--color-badge-verified-bg)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)]"
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-foreground)]">{n.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{n.body}</p>
                <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{formatDate(n.createdAtIso)}</p>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} onClick={() => handleOpen(n.id)}>
                {card}
              </Link>
            ) : (
              <button key={n.id} type="button" onClick={() => handleOpen(n.id)} className="w-full">
                {card}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
