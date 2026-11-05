import bcrypt from "bcryptjs";
import { accountSchema } from "@/lib/admin/account-schemas";
import { validateAccountChange } from "@/lib/admin/account-rules";
import { fieldErrorsOf } from "@/lib/admin/field-errors";
import { generateTemporaryPassword } from "@/lib/admin/password";
import type { CurrentStaff } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db-errors";

// The temporary password is only ever returned here, once, and never stored in plain text.
export type AccountResult =
  | { ok: true; temporaryPassword: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const BCRYPT_COST = 10;
const GONE = { ok: false, error: "This account no longer exists. Reload the page." } as const;
const fieldProblem = (field: string, message: string): AccountResult => ({ ok: false, error: message, fieldErrors: { [field]: message } });

export async function saveAccount(actor: CurrentStaff, input: unknown): Promise<AccountResult> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { id, name, email, role, active } = parsed.data;

  // Admins don't take leads, so they have no showroom and handle no models.
  const isConsultant = role === "CONSULTANT";
  const showroomId = isConsultant ? parsed.data.showroomId : null;
  const modelIds = isConsultant ? [...new Set(parsed.data.modelIds)] : [];

  if (showroomId && !(await db.showroom.count({ where: { id: showroomId } }))) return fieldProblem("showroomId", "Choose a showroom");
  if ((await db.model.count({ where: { id: { in: modelIds } } })) !== modelIds.length) {
    return fieldProblem("modelIds", "One of those models no longer exists");
  }

  const existing = id ? await db.user.findFirst({ where: { id, role: { in: ["CONSULTANT", "ADMIN"] } }, select: { id: true, role: true, active: true } }) : null;
  if (id && !existing) return GONE;
  if (existing) {
    const refusal = validateAccountChange({ actorId: actor.id, targetId: existing.id, current: existing, next: { role, active } });
    if (refusal) return { ok: false, error: refusal };
  }

  const handled = modelIds.map((modelId) => ({ modelId }));
  try {
    if (existing) {
      // Replacing the list of models is one write, so a consultant is never left half-updated.
      await db.user.update({ where: { id: existing.id }, data: { name, email, role, active, showroomId, models: { deleteMany: {}, create: handled } } });
      return { ok: true, temporaryPassword: null };
    }
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_COST);
    await db.user.create({ data: { name, email, role, showroomId, passwordHash, models: { create: handled } } });
    return { ok: true, temporaryPassword };
  } catch (error) {
    if (isUniqueViolation(error)) return fieldProblem("email", "That email already belongs to another account");
    throw error;
  }
}

export async function resetPassword(id: string): Promise<AccountResult> {
  const account = await db.user.findFirst({ where: { id, role: { in: ["CONSULTANT", "ADMIN"] } }, select: { id: true } });
  if (!account) return GONE;

  const temporaryPassword = generateTemporaryPassword();
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_COST) } });
  return { ok: true, temporaryPassword };
}
