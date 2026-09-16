import { EnterAmountClient } from "@/components/participate/EnterAmountClient";

// CA-014 v1.0 + founder-directed amendment: new Step 2, between Cause
// Selection and Participation Summary. Founder direction (2026-09-16):
// contributor enters a total amount, splits it across selected causes
// themselves -- that becomes the order AiA's Ops side executes and later
// publishes as an Act of Aram. Pure client screen like Step 1 (Cause
// Selection) -- no server-side auth check here; that starts at Step 3
// (Participation Summary), and the write itself is independently
// authorized by RLS regardless of what the client does.
export default function EnterAmountPage() {
  return <EnterAmountClient />;
}
