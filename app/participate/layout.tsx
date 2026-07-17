import { ParticipationFlowProvider } from "@/lib/participation-flow-context";

export default function ParticipateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParticipationFlowProvider>{children}</ParticipationFlowProvider>;
}
