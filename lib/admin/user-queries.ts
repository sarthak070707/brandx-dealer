import type { Role } from "@/generated/prisma/enums";
import type { Option } from "@/lib/admin/price-queries";
import { countLeadsByOwner } from "@/lib/admin/lead-counts";
import { db } from "@/lib/db";

export type AccountView = {
  id: string;
  name: string;
  email: string;
  role: Extract<Role, "CONSULTANT" | "ADMIN">;
  active: boolean;
  showroomId: string;
  showroomName: string | null;
  modelIds: string[];
  modelNames: string[];
  openLeads: number;
  totalLeads: number;
};

export type AccountsData = { accounts: AccountView[]; showrooms: Option[]; models: (Option & { id: string })[] };

// Staff accounts only: buyers are customers, not something the admin manages here.
export async function getAccounts(): Promise<AccountsData> {
  const [users, showrooms, models, leadRows] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["CONSULTANT", "ADMIN"] } },
      orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        showroom: { select: { id: true, name: true } },
        models: { select: { model: { select: { id: true, name: true } } } },
      },
    }),
    db.showroom.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.model.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.lead.groupBy({ by: ["assignedToId", "status"], where: { assignedToId: { not: null } }, _count: { _all: true } }),
  ]);
  const leadCounts = countLeadsByOwner(leadRows);

  return {
    accounts: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as AccountView["role"],
      active: user.active,
      showroomId: user.showroom?.id ?? "",
      showroomName: user.showroom?.name ?? null,
      modelIds: user.models.map(({ model }) => model.id),
      modelNames: user.models.map(({ model }) => model.name).toSorted(),
      openLeads: leadCounts.get(user.id)?.open ?? 0,
      totalLeads: leadCounts.get(user.id)?.total ?? 0,
    })),
    showrooms: showrooms.map((showroom) => ({ value: showroom.id, label: showroom.name })),
    models: models.map((model) => ({ id: model.id, value: model.id, label: model.name })),
  };
}
