"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CauseId, ParticipationFlowState } from "@/types/participation";

const STORAGE_KEY = "aia:participation-flow";

const DEFAULT_STATE: ParticipationFlowState = {
  selectedCauses: [],
};

interface ParticipationFlowContextValue {
  state: ParticipationFlowState;
  toggleCause: (id: CauseId) => void;
}

const ParticipationFlowContext =
  createContext<ParticipationFlowContextValue | null>(null);

/**
 * Wraps the Participation Flow route group. Holds selection state in
 * sessionStorage (not localStorage — this should not outlive the browser
 * session, matching CA-014A's "force-quit restarts clean" edge case) so a
 * contributor can move forward and back between steps without losing
 * selections, while nothing here is a recorded Commitment.
 */
export function ParticipationFlowProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Lazy initializer (not an effect) so the very first client render
  // already reflects sessionStorage — avoids a state-in-effect cascade
  // and avoids a visible flash of empty selections on return visits.
  const [state, setState] = useState<ParticipationFlowState>(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ParticipationFlowState) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Non-fatal: selection simply won't survive a refresh in this case.
    }
  }, [state]);

  const value = useMemo<ParticipationFlowContextValue>(
    () => ({
      state,
      toggleCause: (id) =>
        setState((prev) => ({
          ...prev,
          selectedCauses: prev.selectedCauses.includes(id)
            ? prev.selectedCauses.filter((c) => c !== id)
            : [...prev.selectedCauses, id],
        })),
    }),
    [state],
  );

  return (
    <ParticipationFlowContext.Provider value={value}>
      {children}
    </ParticipationFlowContext.Provider>
  );
}

export function useParticipationFlow() {
  const ctx = useContext(ParticipationFlowContext);
  if (!ctx) {
    throw new Error(
      "useParticipationFlow must be used within a ParticipationFlowProvider",
    );
  }
  return ctx;
}
