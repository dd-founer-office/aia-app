import PublishingWorkspace from "@/components/kural-publishing/PublishingWorkspace";

// Internal tool — not part of the Contributor App's navigation or user-facing
// surface. No auth beyond whatever the app already provides, no persistence,
// no API route, per today's one-day MVP scope.
export const metadata = {
  title: "Kural Koorum Aram — Publishing (Internal)",
};

export default function KuralPublishingPage() {
  return <PublishingWorkspace />;
}
