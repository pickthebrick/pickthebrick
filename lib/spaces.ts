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

export const PACKAGE_LABELS: Record<string, string> = {
  essential: "Essential",
  advanced: "Advanced",
  premium: "Premium",
};
