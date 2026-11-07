import type { Role } from "@/generated/prisma/enums";

const PROTECTED_AREAS: { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/consultant", roles: ["CONSULTANT", "ADMIN"] },
];

function areaFor(pathname: string) {
  return PROTECTED_AREAS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessPath(pathname: string, role: Role | undefined) {
  const area = areaFor(pathname);
  if (!area) return true;
  return role !== undefined && area.roles.includes(role);
}

// Staff screens live outside the language folders and stay in English.
export const isStaffArea = (pathname: string) => areaFor(pathname) !== undefined;
