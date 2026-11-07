"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addCarVariant } from "@/app/admin/cars/actions";
import { blankVariant, VariantFields } from "@/components/admin/variant-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminCar } from "@/lib/admin/car-queries";

// A new variant shares the car's colours and photos.
export function AddVariantDialog({ car, onClose }: { car: AdminCar; onClose: () => void }) {
  const [variant, setVariant] = useState(blankVariant);
  const [problems, setProblems] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await addCarVariant({ modelId: car.id, variant });
      if (!result.ok) return setProblems({ message: result.error, fields: result.fieldErrors ?? {} });
      toast.success(`${variant.name} added to ${car.name}`);
      onClose();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add a variant of {car.name}</DialogTitle>
            <DialogDescription>It uses the same colours and photos as the other variants.</DialogDescription>
          </DialogHeader>
          <VariantFields value={variant} onChange={setVariant} errors={problems.fields} prefix="variant" />
          {problems.message && (
            <p role="alert" className="text-sm text-destructive">
              {problems.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
