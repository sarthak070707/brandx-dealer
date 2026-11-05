import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-2xl border bg-card p-8">
      <h1 className="text-2xl">Page not found</h1>
      <p className="text-muted-foreground">There is nothing at this address in the admin.</p>
      <Button asChild>
        <Link href="/admin">Back to the admin</Link>
      </Button>
    </div>
  );
}
