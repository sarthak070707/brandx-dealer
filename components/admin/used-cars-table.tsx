"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeUsedCarStatus } from "@/app/admin/used-cars/actions";
import { RemoveUsedCarDialog } from "@/components/admin/remove-used-car-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsedCarStatus } from "@/generated/prisma/enums";
import type { AdminUsedCar } from "@/lib/admin/used-car-queries";
import { formatRupees } from "@/lib/money";

const STATUS_LABEL: Record<UsedCarStatus, string> = { AVAILABLE: "Available", BOOKED: "Booked", SOLD: "Sold" };
const kmFormat = new Intl.NumberFormat("en-IN");

export function UsedCarsTable({ cars }: { cars: AdminUsedCar[] }) {
  const [showSold, setShowSold] = useState(false);
  const [removing, setRemoving] = useState<AdminUsedCar | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const soldCount = cars.filter((car) => car.status === "SOLD").length;
  const shown = showSold ? cars : cars.filter((car) => car.status !== "SOLD");

  const changeStatus = (car: AdminUsedCar, status: UsedCarStatus) =>
    startTransition(async () => {
      setChanging(car.id);
      const result = await changeUsedCarStatus(car.id, status);
      setChanging(null);
      if (result.ok) toast.success(`${car.stockId} is now ${STATUS_LABEL[status].toLowerCase()}`);
      else toast.error(result.error);
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4 accent-foreground" checked={showSold} onChange={(event) => setShowSold(event.target.checked)} />
          Show sold cars ({soldCount})
        </label>
        <Button asChild>
          <Link href="/admin/used-cars/new">
            <PlusIcon />
            Add used car
          </Link>
        </Button>
      </div>

      <div className="overflow-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Stock</TableHead>
              <TableHead>Car</TableHead>
              <TableHead className="max-lg:hidden">Showroom</TableHead>
              <TableHead className="max-md:hidden">Driven</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((car) => (
              <TableRow key={car.id}>
                <TableCell>
                  <p className="font-medium">{car.stockId}</p>
                  <Link href={`/en/used-cars/${car.stockId}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                    View page
                  </Link>
                </TableCell>
                <TableCell>
                  <p>{car.carName}</p>
                  <p className="text-sm text-muted-foreground">{car.year}</p>
                </TableCell>
                <TableCell className="max-lg:hidden">{car.showroomName}</TableCell>
                <TableCell className="tabular-nums max-md:hidden">{kmFormat.format(car.km)} km</TableCell>
                <TableCell className="tabular-nums">{formatRupees(car.pricePaise)}</TableCell>
                <TableCell>
                  <NativeSelect
                    aria-label={`Status of ${car.stockId}`}
                    className="h-9 min-w-32"
                    value={car.status}
                    disabled={changing === car.id}
                    onChange={(event) => changeStatus(car, event.target.value as UsedCarStatus)}
                  >
                    {Object.values(UsedCarStatus).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/used-cars/${car.id}`} aria-label={`Edit ${car.stockId}`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={car.leads > 0}
                      title={car.leads > 0 ? "It has leads, so it stays. Mark it Sold instead." : undefined}
                      aria-label={`Remove ${car.stockId}`}
                      onClick={() => setRemoving(car)}
                    >
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {removing && <RemoveUsedCarDialog key={removing.id} car={removing} onClose={() => setRemoving(null)} />}
    </div>
  );
}
