"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeStaffAccount } from "@/app/admin/consultants/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountView } from "@/lib/admin/user-queries";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// Says exactly what removing does before it happens, because it can't be undone.
export function RemoveAccountDialog({ account, onClose }: { account: AccountView; onClose: () => void }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await removeStaffAccount(account.id);
      if (!result.ok) return setProblem(result.error);
      toast.success(`${account.name} removed`);
      onClose();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {account.name}?</DialogTitle>
          <DialogDescription>
            {account.totalLeads > 0
              ? `${account.name} has ${plural(account.totalLeads, "lead")} on record${account.openLeads > 0 ? `, ${account.openLeads} still open` : ""}. The leads stay and move to "Needs assignment", and ${account.name}'s name is taken off their history. `
              : `${account.name} has no leads on record, and their name is taken off any history. `}
            The account is deleted for good.
          </DialogDescription>
        </DialogHeader>
        {problem && (
          <p role="alert" className="text-sm text-destructive">
            {problem}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={remove} disabled={pending}>
            {pending ? "Removing…" : "Remove for good"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
