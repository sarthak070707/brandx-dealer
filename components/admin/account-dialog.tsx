"use client";

import { CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetStaffPassword, saveStaffAccount } from "@/app/admin/consultants/actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { AccountsData, AccountView } from "@/lib/admin/user-queries";
import { toggleItem } from "@/lib/utils";

type Props = { account: AccountView | null; options: Pick<AccountsData, "showrooms" | "models">; onClose: () => void };
type Problems = { message: string | null; fields: Record<string, string> };

export function AccountDialog({ account, options, onClose }: Props) {
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [role, setRole] = useState<AccountView["role"]>(account?.role ?? "CONSULTANT");
  const [showroomId, setShowroomId] = useState(account?.showroomId ?? "");
  const [modelIds, setModelIds] = useState(account?.modelIds ?? []);
  const [active, setActive] = useState(account?.active ?? true);
  const [problems, setProblems] = useState<Problems>({ message: null, fields: {} });
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isConsultant = role === "CONSULTANT";
  const losingLeads = account !== null && account.active && !active && account.openLeads > 0;

  const save = () =>
    startTransition(async () => {
      const result = await saveStaffAccount({ id: account?.id ?? null, name, email, role, showroomId, modelIds, active });
      if (!result.ok) return setProblems({ message: result.error, fields: result.fieldErrors ?? {} });
      if (result.temporaryPassword) return setSecret(result.temporaryPassword);
      toast.success("Saved");
      onClose();
    });

  const reset = () =>
    startTransition(async () => {
      const result = await resetStaffPassword(account?.id ?? "");
      if (result.ok && result.temporaryPassword) setSecret(result.temporaryPassword);
      else if (!result.ok) setProblems({ message: result.error, fields: {} });
    });

  // Browsers can refuse clipboard access (no permission, page not focused), so a failure is
  // told to the admin rather than thrown. The password is select-all, so it can be copied by hand.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret ?? "");
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy. Select the password and copy it yourself.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Temporary password</DialogTitle>
              <DialogDescription>
                Share this with {name || "them"} privately. It is shown only now and can&apos;t be looked up later. They can sign in with it
                straight away.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4">
              <code className="text-lg tracking-wide select-all">{secret}</code>
              <Button variant="outline" size="sm" onClick={copy}>
                <CopyIcon />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <DialogHeader>
              <DialogTitle>{account ? `Edit ${account.name}` : "Add a consultant"}</DialogTitle>
              <DialogDescription>
                {account ? "Changes apply to the next lead that comes in." : "They get a temporary password to sign in with."}
              </DialogDescription>
            </DialogHeader>

            <Field label="Name" error={problems.fields.name}>
              <Input value={name} autoComplete="off" aria-invalid={Boolean(problems.fields.name)} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Email" error={problems.fields.email}>
              <Input type="email" value={email} autoComplete="off" aria-invalid={Boolean(problems.fields.email)} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Role" error={problems.fields.role}>
              <NativeSelect value={role} onChange={(event) => setRole(event.target.value as AccountView["role"])}>
                <option value="CONSULTANT">Sales consultant</option>
                <option value="ADMIN">Admin</option>
              </NativeSelect>
            </Field>

            {isConsultant && (
              <>
                <Field label="Showroom" error={problems.fields.showroomId}>
                  <NativeSelect value={showroomId} aria-invalid={Boolean(problems.fields.showroomId)} onChange={(event) => setShowroomId(event.target.value)}>
                    <option value="">Choose a showroom</option>
                    {options.showrooms.map((showroom) => (
                      <option key={showroom.value} value={showroom.value}>
                        {showroom.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <fieldset>
                  <legend className="mb-2 text-sm text-muted-foreground">Models they handle</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {options.models.map((model) => (
                      <label key={model.value} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4 accent-foreground"
                          checked={modelIds.includes(model.value)}
                          onChange={() => setModelIds(toggleItem(modelIds, model.value))}
                        />
                        {model.label}
                      </label>
                    ))}
                  </div>
                  {problems.fields.modelIds && <p className="mt-2 text-sm text-destructive">{problems.fields.modelIds}</p>}
                </fieldset>
              </>
            )}

            {account && (
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="size-4 accent-foreground" checked={active} onChange={(event) => setActive(event.target.checked)} />
                Active, can sign in and receive leads
              </label>
            )}
            {losingLeads && (
              <p className="rounded-xl bg-muted p-4 text-sm">
                {account.name} has {account.openLeads} open {account.openLeads === 1 ? "lead" : "leads"}. They stay assigned to them until
                you re-assign them from the lead page.
              </p>
            )}

            {problems.message && (
              <p role="alert" className="text-sm text-destructive">
                {problems.message}
              </p>
            )}

            <DialogFooter className="sm:justify-between">
              {account ? (
                <Button type="button" variant="outline" onClick={reset} disabled={pending}>
                  Reset password
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : account ? "Save changes" : "Add consultant"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
