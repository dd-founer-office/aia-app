import KineticReelPrototype from "@/components/kinetic-reel-poc/KineticReelPrototype";

// Internal, isolated proof of concept -- Phase 1 only. Not linked from any
// nav, not wired into PublishingWorkspace.tsx or KuralHeroCanvas.tsx, and
// does not touch any of the five existing Asset Generator templates. See
// lib/kural-publishing/kinetic-reel-poc/ for the script + renderer this
// page mounts.
export const metadata = {
  title: "Kinetic Typography Reel — Phase 1 POC (Internal)",
};

export default function KineticReelPocPage() {
  return <KineticReelPrototype />;
}
