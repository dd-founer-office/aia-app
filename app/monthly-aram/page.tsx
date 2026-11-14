import type { Metadata } from "next";
import CauseSelection from "@/components/monthly-aram/CauseSelection";

export const metadata: Metadata = {
  title: "Let Your Aram Take Action",
  description: "Choose where your Monthly Aram goes and give it in someone's name.",
};

export default function MonthlyAramPage() {
  return <CauseSelection />;
}
