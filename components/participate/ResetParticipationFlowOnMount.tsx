"use client";

import { useEffect, useRef } from "react";
import { useParticipationFlow } from "@/lib/participation-flow-context";

/**
 * Renders nothing -- just clears the client-side cause selection once this
 * screen mounts, so a future visit to Step 1 (next month) starts from
 * nothing rather than carrying over an already-recorded month's causes.
 * ParticipationConfirmClient already calls resetSelection() on its own
 * successful submit; this covers reaching this page any OTHER way (a later
 * revisit within the same month, a page refresh here).
 *
 * Ref-guarded, empty-dependency effect -- same idempotency shape used
 * elsewhere in this app (e.g. Home's one-time triggers) -- because
 * resetSelection's identity changes whenever context state changes
 * (useMemo keyed on `state`), so including it in a dependency array would
 * re-run this effect after every reset it itself causes.
 */
export function ResetParticipationFlowOnMount() {
  const { resetSelection } = useParticipationFlow();
  const hasReset = useRef(false);

  useEffect(() => {
    if (hasReset.current) return;
    hasReset.current = true;
    resetSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
