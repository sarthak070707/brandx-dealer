"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeCarById } from "@/app/admin/cars/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminCar } from "@/lib/admin/car-queries";

export function RemoveCarDialog({ car, onClose }: { car: AdminCar; onClose: () => void }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      const result = await removeCarById(car.id);
      if (!result.ok) return setProblem(result.error);
      toast.success(`${car.name} removed`);
      onClose();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {car.name}?</DialogTitle>
          <DialogDescription>
            Its page, variants, prices and demo cars are deleted for good. This is only possible for a car with no leads and no used stock.
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
