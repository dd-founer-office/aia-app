"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, Download, Info } from "lucide-react";

export interface EvidenceItem {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface EvidenceRecord {
  capturedBy: string;
  verifiedBy: string;
  capturedOn: string;
  gpsVerified: boolean;
  evidenceId: string;
  partnerOrganisation: string;
}

export interface EvidenceViewerProps {
  images: EvidenceItem[];
  initialIndex?: number;
  locationLabel: string;
  date: string;
  time?: string;
  record: EvidenceRecord;
  onClose: () => void;
  onLocationTap?: () => void;
}

/**
 * Evidence Viewer -- reusable full-screen component (not a page/route).
 * "I'm verifying an Act of Aram," not "I'm browsing photos." Depends only
 * on its props, not on Act Detail or any specific screen -- any future
 * screen opens it by rendering <EvidenceViewer .../> with its own data.
 *
 * See PR/commit message for flagged assumptions (Report Issue has no
 * backend workflow; Original Resolution only renders when supplied;
 * onLocationTap is a no-op extension point for the future Map
 * Experience; entry animation is fade+scale, not shared-element).
 */
export function EvidenceViewer({
  images,
  initialIndex = 0,
  locationLabel,
  date,
  time,
  record,
  onClose,
  onLocationTap,
}: EvidenceViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = images[index];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, onClose]);

  function distanceBetween(t: React.TouchList) {
    const a = t[0];
    const b = t[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: distanceBetween(e.touches), scale };
      clearLongPress();
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      if (scale > 1) {
        panStart.current = { x: t.clientX, y: t.clientY, tx: translate.x, ty: translate.y };
      }
      longPressTimer.current = setTimeout(() => {
        setMenuOpen(true);
        touchStart.current = null;
      }, 550);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStart.current) {
      const dist = distanceBetween(e.touches);
      const ratio = dist / pinchStart.current.dist;
      const next = Math.min(Math.max(pinchStart.current.scale * ratio, 1), 4);
      setScale(next);
      clearLongPress();
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (scale > 1 && panStart.current) {
        setTranslate({
          x: panStart.current.tx + (t.clientX - panStart.current.x),
          y: panStart.current.ty + (t.clientY - panStart.current.y),
        });
        clearLongPress();
        return;
      }
      if (touchStart.current) {
        const dx = t.clientX - touchStart.current.x;
        const dy = t.clientY - touchStart.current.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearLongPress();
      }
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    clearLongPress();
    pinchStart.current = null;
    panStart.current = null;

    if (scale > 1 || !touchStart.current) {
      touchStart.current = null;
      return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const SWIPE_THRESHOLD = 50;
    if (Math.abs(dy) > Math.abs(dx) && dy > SWIPE_THRESHOLD) {
      onClose();
      return;
    }
    if (Math.abs(dy) > Math.abs(dx) && dy < -SWIPE_THRESHOLD) {
      setSheetOpen(true);
      return;
    }
    if (dx < -SWIPE_THRESHOLD) {
      setIndex((i) => Math.min(i + 1, images.length - 1));
      return;
    }
    if (dx > SWIPE_THRESHOLD) {
      setIndex((i) => Math.max(i - 1, 0));
    }
  }

  function handleDoubleClick() {
    setScale((s) => (s > 1 ? 1 : 2));
    setTranslate({ x: 0, y: 0 });
  }

  function handleImageClick() {
    if (scale === 1) setSheetOpen((v) => !v);
  }

  function handleSaveImage() {
    const a = document.createElement("a");
    a.href = current.url;
    a.download = `evidence-${record.evidenceId}-${index + 1}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMenuOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black transition-opacity duration-300"
      style={{ opacity: mounted ? 1 : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Evidence Viewer"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-white/90" aria-label="Close evidence viewer">
          <X size={20} />
          Close
        </button>
        <span className="text-sm text-white/70" aria-live="polite">
          {index + 1} / {images.length}
        </span>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={handleImageClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? `Evidence photo ${index + 1} of ${images.length}`}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
          style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
          draggable={false}
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLocationTap?.();
          }}
          className="absolute bottom-4 left-4 flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
        >
          <span className="flex items-center gap-1.5 text-xs">
            <MapPin size={12} />
            {locationLabel}
          </span>
          <span className="text-xs text-white/70">
            {date}
            {time ? ` · ${time}` : ""}
          </span>
        </button>
      </div>

      {sheetOpen && (
        <div className="absolute inset-0 z-10" onClick={() => setSheetOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[var(--color-background)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-sm font-medium">Evidence Record</p>
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Captured By" value={record.capturedBy} />
              <Row label="GPS Verified" value={record.gpsVerified ? "Yes" : "No"} />
              <Row label="Evidence ID" value={record.evidenceId} />
              <Row label="Captured On" value={record.capturedOn} />
              <Row label="Verified By" value={record.verifiedBy} />
              <Row label="Partner Organisation" value={record.partnerOrganisation} />
              <Row label="Evidence Count" value={String(images.length)} />
              {current.width && current.height && (
                <Row label="Original Resolution" value={`${current.width} × ${current.height}`} />
              )}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="absolute inset-0 z-20" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-6 left-1/2 flex w-72 -translate-x-1/2 flex-col gap-1 rounded-2xl bg-[var(--color-background)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuAction icon={<Download size={16} />} label="Save Image" onClick={handleSaveImage} />
            <MenuAction
              icon={<Info size={16} />}
              label="View Metadata"
              onClick={() => {
                setMenuOpen(false);
                setSheetOpen(true);
              }}
            />
            <ReportIssueAction onDone={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[var(--color-muted-foreground)]">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function MenuAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm">
      {icon}
      {label}
    </button>
  );
}

function ReportIssueAction({ onDone }: { onDone: () => void }) {
  const [reported, setReported] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setReported(true);
        setTimeout(onDone, 900);
      }}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm"
    >
      {reported ? "Thanks — we'll review this" : "Report Issue"}
    </button>
  );
}
