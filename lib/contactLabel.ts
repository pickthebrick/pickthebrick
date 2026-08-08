// Shared display fallback for a Quote/DesignRequest row that might belong to
// an anonymous lead (no client, just contactPhone/contactEmail) instead of a
// full account - used anywhere a dashboard currently assumes `client` is
// always present (admin quotes, captain/designer dashboards, admin designer
// view, notification code).
export function contactLabel(row: {
  client?: { fullName: string | null; email: string } | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}): string {
  return row.client?.fullName ?? row.client?.email ?? row.contactPhone ?? row.contactEmail ?? "Anonymous lead";
}
