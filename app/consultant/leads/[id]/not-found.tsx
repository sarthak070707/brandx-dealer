import Link from "next/link";
import { Button } from "@/components/ui/button";

// The same page whether the lead doesn't exist or belongs to another consultant, so a
// consultant can't tell which leads exist outside their own.
export default function LeadNotFound() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-2xl border bg-card p-8">
      <h1 className="text-2xl">Lead not found</h1>
      <p className="text-muted-foreground">It may have been re-assigned, or it is not one of your leads.</p>
      <Button asChild>
        <Link href="/consultant">Back to the inbox</Link>
      </Button>
    </div>
  );
}
