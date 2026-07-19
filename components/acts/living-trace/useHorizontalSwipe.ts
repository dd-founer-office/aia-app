"use client";

import { useEffect, useRef } from "react";

interface UseHorizontalSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

/**
 * Robust horizontal swipe detection via native, non-passive touch
 * listeners. React's synthetic touch handlers are passive by default,
 * which silently breaks preventDefault() -- letting the browser's own
 * gestures (edge-back navigation, vertical overscroll) intercept one
 * swipe direction on some mobile browsers while the other still works.
 * A native, explicitly non-passive touchmove listener fixes that: once
 * horizontal intent is detected, we take over the gesture outright.
 */
export function useHorizontalSwipe<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseHorizontalSwipeOptions) {
  const ref = useRef<T | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const horizontalIntent = useRef(false);
  const callbacks = useRef({ onSwipeLeft, onSwipeRight });
  callbacks.current = { onSwipeLeft, onSwipeRight };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
      horizontalIntent.current = false;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;

      if (!horizontalIntent.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        horizontalIntent.current = true;
      }
      if (horizontalIntent.current) {
        e.preventDefault();
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      start.current = null;

      if (horizontalIntent.current) {
        if (dx < -threshold) callbacks.current.onSwipeLeft();
        else if (dx > threshold) callbacks.current.onSwipeRight();
      }
      horizontalIntent.current = false;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [threshold]);

  return ref;
}
