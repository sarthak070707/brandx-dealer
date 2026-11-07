"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AccountDialog } from "@/components/admin/account-dialog";
import { RemoveAccountDialog } from "@/components/admin/remove-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountsData, AccountView } from "@/lib/admin/user-queries";

const ROLE_LABEL = { CONSULTANT: "Consultant", ADMIN: "Admin" } as const;

export function AccountsTable({ accounts, showrooms, models }: AccountsData) {
  const [editing, setEditing] = useState<AccountView | "new" | null>(null);
  const [removing, setRemoving] = useState<AccountView | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setEditing("new")}>
          <PlusIcon />
          Add consultant
        </Button>
      </div>

      <div className="overflow-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="max-md:hidden">Showroom</TableHead>
              <TableHead className="max-lg:hidden">Models</TableHead>
              <TableHead className="max-md:hidden">Open leads</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">{account.email}</p>
                </TableCell>
                <TableCell>{ROLE_LABEL[account.role]}</TableCell>
                <TableCell className="max-md:hidden">{account.showroomName ?? "–"}</TableCell>
                <TableCell className="max-lg:hidden">{account.modelNames.join(", ") || "–"}</TableCell>
                <TableCell className="tabular-nums max-md:hidden">{account.openLeads}</TableCell>
                <TableCell>
                  <Badge variant={account.active ? "success" : "neutral"}>{account.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" aria-label={`Edit ${account.name}`} onClick={() => setEditing(account)}>
                      Edit
                    </Button>
                    {!account.active && (
                      <Button size="sm" variant="ghost" className="text-destructive" aria-label={`Remove ${account.name}`} onClick={() => setRemoving(account)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {removing && <RemoveAccountDialog key={removing.id} account={removing} onClose={() => setRemoving(null)} />}

      {editing && (
        <AccountDialog
          key={editing === "new" ? "new" : editing.id}
          account={editing === "new" ? null : editing}
          options={{ showrooms, models }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
