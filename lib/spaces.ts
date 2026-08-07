// The 10 space types a client can pick from during the design survey -
// shared between the spaces-picker page, the measurements summary, and the
// designer dashboard so the list/labels never drift apart.
export const SPACES: { key: string; label: string }[] = [
  { key: "reception", label: "Reception" },
  { key: "meetingRoom", label: "Meeting Room" },
  { key: "openWorkstation", label: "Open Workstation" },
  { key: "closedWorkstation", label: "Closed Workstation" },
  { key: "executiveCabin", label: "Executive Cabin" },
  { key: "storeRoom", label: "Store Room" },
  { key: "serveRoom", label: "Serve Room" },
  { key: "prayerRoom", label: "Prayer Room" },
  { key: "pantry", label: "Pantry" },
  { key: "washroom", label: "Washroom" },
];

export const SPACE_LABELS: Record<string, string> = Object.fromEntries(SPACES.map((s) => [s.key, s.label]));

export function spaceKeysToLabels(spaces: string): string[] {
  return spaces
    .split(",")
    .filter(Boolean)
    .map((key) => SPACE_LABELS[key] ?? key);
}

// "Reception, Executive Cabin ×2" - a one-line summary of a client's space
// instances, grouped by type, for dashboard rows.
export function groupSpaceEntries(entries: { spaceKey: string }[]): string {
  const counts: Record<string, number> = {};
  const order: string[] = [];
  for (const e of entries) {
    if (!(e.spaceKey in counts)) order.push(e.spaceKey);
    counts[e.spaceKey] = (counts[e.spaceKey] ?? 0) + 1;
  }
  return order
    .map((key) => {
      const label = SPACE_LABELS[key] ?? key;
      return counts[key] > 1 ? `${label} ×${counts[key]}` : label;
    })
    .join(", ");
}

// "Reception", "Executive Cabin #1", "Executive Cabin #2" - per-instance
// labels for spaces that appear more than once, preserving input order.
export function labelSpaceInstances<T extends { spaceKey: string }>(entries: T[]): (T & { label: string })[] {
  const totals: Record<string, number> = {};
  for (const e of entries) totals[e.spaceKey] = (totals[e.spaceKey] ?? 0) + 1;

  const counts: Record<string, number> = {};
  return entries.map((e) => {
    counts[e.spaceKey] = (counts[e.spaceKey] ?? 0) + 1;
    const base = SPACE_LABELS[e.spaceKey] ?? e.spaceKey;
    const label = totals[e.spaceKey] > 1 ? `${base} #${counts[e.spaceKey]}` : base;
    return { ...e, label };
  });
}

export const PACKAGE_LABELS: Record<string, string> = {
  essential: "Essential",
  advanced: "Advanced",
  premium: "Premium",
};
