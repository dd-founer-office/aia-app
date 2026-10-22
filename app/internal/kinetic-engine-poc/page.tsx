import KineticEnginePrototype from "@/components/kinetic-engine-poc/KineticEnginePrototype";

// Internal, isolated proof of concept for the REUSABLE kinetic typography
// engine (lib/kural-publishing/kinetic-engine/). Not linked from any nav,
// not wired into PublishingWorkspace.tsx or KuralHeroCanvas.tsx, and does
// not touch any of the five existing Asset Generator templates. Distinct
// from, and does not replace, the earlier Fear/Burden/Release/Belonging
// kinetic-reel-poc at /internal/kinetic-reel-poc -- that one stays as the
// prior phase's hardcoded Reel prototype; this route demonstrates the new
// generic engine against temporary demo text instead.
export const metadata = {
  title: "Kinetic Typography Engine — POC (Internal)",
};

export default function KineticEnginePocPage() {
  return <KineticEnginePrototype />;
}
