"use client";

import { ShieldCheck, Clock, MapPin, Building2 } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { MapEmbed } from "./MapEmbed";
import type { EvidenceTraceItem } from "./types";

export interface TrustCardProps {
  item: EvidenceTraceItem;
  onExpandMap: () => void;
}

/**
 * Floating Trust Card (Living Trace Constitution §3-4). Sits underneath
 * the Evidence Card. Colour is status-only (verified/pending), never
 * category -- evidence type is distinguished through icon/label content,
 * per explicit ruling.
 */
export function TrustCard({ item, onExpandMap }: TrustCardProps) {
  const { trust } = item;
  const statusColor =
    trust.verificationStatus === "verified" ? "var(--color-success)" : "var(--color-pending)";
  const statusBg =
    trust.verificationStatus === "verified"
      ? "var(--color-badge-verified-bg)"
      : "var(--color-badge-pending-bg)";

  return (
    <Card className="-mt-4 flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin size={14} />
          {trust.locationLabel}
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: statusColor, backgroundColor: statusBg }}
        >
          <ShieldCheck size={12} />
          {trust.verificationStatus === "verified" ? "Verified" : "Pending"}
        </span>
      </div>

      <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Clock size={12} />
        {item.captureDate} · {item.captureTime}
      </span>

      {trust.kind === "map" && trust.lat !== undefined && trust.lng !== undefined ? (
        <button type="button" onClick={onExpandMap} className="text-left">
          <MapEmbed lat={trust.lat} lng={trust.lng} locationLabel={trust.locationLabel} heightClassName="h-24" compact />
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm">
          <Building2 size={16} className="shrink-0 text-[var(--color-muted-foreground)]" />
          <div className="flex flex-col">
            <span className="text-xs text-[var(--color-muted-foreground)]">{trust.infoLabel}</span>
            <span>{trust.infoValue}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
