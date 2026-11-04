export type AssignmentCandidate = { id: string; openLeads: number; lastAssignedAt: Date | null };

// A10: fewest open leads wins; ties go to whoever was assigned longest ago (never counts as
// longest ago). Null means nobody is eligible, so the lead goes to the showroom's lead desk.
export function pickConsultant(candidates: AssignmentCandidate[]) {
  const waitedSince = (candidate: AssignmentCandidate) => candidate.lastAssignedAt?.getTime() ?? -Infinity;
  const [chosen] = candidates.toSorted(
    (a, b) => a.openLeads - b.openLeads || waitedSince(a) - waitedSince(b),
  );
  return chosen?.id ?? null;
}
