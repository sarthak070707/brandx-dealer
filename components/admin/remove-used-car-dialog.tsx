"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeUsedCarById } from "@/app/admin/used-cars/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminUsedCar } from "@/lib/admin/used-car-queries";

export function RemoveUsedCarDialog({ car, onClose }: { car: AdminUsedCar; onClose: () => void }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await removeUsedCarById(car.id);
      if (!result.ok) return setProblem(result.error);
      toast.success(`${car.stockId} removed`);
      onClose();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {car.stockId}?</DialogTitle>
          <DialogDescription>
            {car.carName} is deleted for good, with its photo and inspection report. If it was sold, mark it Sold instead so its history stays.
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
