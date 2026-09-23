import PublishingWorkspace from "@/components/kural-publishing/PublishingWorkspace";

// Internal tool — not part of the Contributor App's navigation or user-facing
// surface. No auth beyond whatever the app already provides, no persistence,
// no API route. Originally scoped to Kural Koorum Aram publishing only; now
// a unified Content Asset Generator (Content -> Content Type -> Template ->
// Output Format -> Asset) reached at the same route.
export const metadata = {
  title: "Distant Devotion — Asset Generator (Internal)",
};

export default function KuralPublishingPage() {
  return <PublishingWorkspace />;
}
