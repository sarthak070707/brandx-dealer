"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddVariantDialog } from "@/components/admin/add-variant-dialog";
import { RemoveCarDialog } from "@/components/admin/remove-car-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCar } from "@/lib/admin/car-queries";
import { BODY_TYPE_LABEL, FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";

export function CarsTable({ cars }: { cars: AdminCar[] }) {
  const [addingTo, setAddingTo] = useState<AdminCar | null>(null);
  const [removing, setRemoving] = useState<AdminCar | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/admin/cars/new">
            <PlusIcon />
            Add car
          </Link>
        </Button>
      </div>

      <div className="overflow-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Car</TableHead>
              <TableHead className="max-md:hidden">Body type</TableHead>
              <TableHead className="max-lg:hidden">Variants</TableHead>
              <TableHead className="max-md:hidden">Colours</TableHead>
              <TableHead>Home page</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => {
              const inUse = car.leads > 0 || car.usedCars > 0;
              return (
                <TableRow key={car.id}>
                  <TableCell>
                    <p className="font-medium">{car.name}</p>
                    <Link href={`/en/cars/${car.slug}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                      View page
                    </Link>
                  </TableCell>
                  <TableCell className="max-md:hidden">{BODY_TYPE_LABEL[car.bodyType]}</TableCell>
                  <TableCell className="max-lg:hidden">
                    {car.variants.map((variant) => `${variant.name} ${TRANSMISSION_LABEL[variant.transmission]} ${FUEL_LABEL[variant.fuel]}`).join(", ")}
                  </TableCell>
                  <TableCell className="tabular-nums max-md:hidden">{car.colourCount}</TableCell>
                  <TableCell>
                    <Badge variant={car.featured ? "success" : "neutral"}>{car.featured ? "Shown" : "Not shown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" aria-label={`Add a variant of ${car.name}`} onClick={() => setAddingTo(car)}>
                        Add variant
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={inUse}
                        title={inUse ? "It has leads or used stock, so it stays in the system" : undefined}
                        aria-label={`Remove ${car.name}`}
                        onClick={() => setRemoving(car)}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {addingTo && <AddVariantDialog key={addingTo.id} car={addingTo} onClose={() => setAddingTo(null)} />}
      {removing && <RemoveCarDialog key={removing.id} car={removing} onClose={() => setRemoving(null)} />}
    </div>
  );
}
