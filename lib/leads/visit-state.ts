// A buyer who cancels their test drive or service visit is still a lead, so it stays in the inbox. This is
// the note that tells the consultant at a glance that the visit is off and a call is needed.
export function cancelledVisit(lead: { booking: { status: string } | null; serviceBooking: { status: string } | null }) {
  if (lead.booking?.status === "CANCELLED") return "Test drive cancelled";
  if (lead.serviceBooking?.status === "CANCELLED") return "Service visit cancelled";
  return null;
}
