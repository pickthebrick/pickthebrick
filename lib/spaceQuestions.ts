// Preset per-space question sets for the Features survey step. Boolean
// answers double as feature-layer toggles on the SpaceIcon graphic (see
// app/design/SpaceIcon.tsx); choice answers (counts) are recorded but don't
// change the icon.
export type SpaceQuestion =
  | { key: string; label: string; type: "boolean" }
  | { key: string; label: string; type: "choice"; options: string[] };

export const SPACE_QUESTIONS: Record<string, SpaceQuestion[]> = {
  reception: [
    { key: "receptionDesk", label: "Reception desk", type: "boolean" },
    { key: "logoWall", label: "Feature logo wall", type: "boolean" },
    { key: "waitingArea", label: "Waiting area", type: "boolean" },
    { key: "displayWall", label: "Display wall", type: "boolean" },
    { key: "displayScreen", label: "Display screen", type: "boolean" },
  ],
  meetingRoom: [
    { key: "chairCount", label: "How many chairs at the table?", type: "choice", options: ["4", "6", "8", "10", "12"] },
    { key: "videoScreen", label: "Video conferencing screen", type: "boolean" },
    { key: "whiteboard", label: "Writable wall / whiteboard", type: "boolean" },
    { key: "credenza", label: "Storage credenza", type: "boolean" },
  ],
  openWorkstation: [
    { key: "deskCount", label: "How many desks?", type: "choice", options: ["4", "6", "8", "10", "12+"] },
    { key: "acousticPanels", label: "Acoustic partition panels", type: "boolean" },
    { key: "breakoutSeating", label: "Breakout seating nearby", type: "boolean" },
  ],
  closedWorkstation: [
    {
      key: "deskCount",
      label: "How many desks?",
      type: "choice",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    { key: "glassPartition", label: "Glass partition walls", type: "boolean" },
    { key: "storageUnit", label: "Built-in storage unit", type: "boolean" },
  ],
  executiveCabin: [
    { key: "meetingTable", label: "Small meeting table", type: "boolean" },
    { key: "sofaSeating", label: "Sofa seating", type: "boolean" },
    { key: "privateWashroom", label: "Private washroom", type: "boolean" },
    { key: "bookshelf", label: "Bookshelf / display unit", type: "boolean" },
  ],
  storeRoom: [
    { key: "shelvingRacks", label: "Shelving racks", type: "boolean" },
    { key: "lockableCabinet", label: "Lockable cabinet", type: "boolean" },
    { key: "heavyDutyFlooring", label: "Heavy-duty flooring", type: "boolean" },
  ],
  serveRoom: [
    { key: "servingCounter", label: "Serving counter", type: "boolean" },
    { key: "sink", label: "Sink", type: "boolean" },
    { key: "applianceWall", label: "Microwave / fridge wall", type: "boolean" },
  ],
  prayerRoom: [
    { key: "wuduArea", label: "Wudu / ablution area", type: "boolean" },
    { key: "prayerMats", label: "Prayer mats", type: "boolean" },
    { key: "qiblaMarker", label: "Qibla direction marker", type: "boolean" },
  ],
  pantry: [
    { key: "islandCounter", label: "Island counter", type: "boolean" },
    { key: "barSeating", label: "Bar seating", type: "boolean" },
    { key: "applianceWall", label: "Appliance wall", type: "boolean" },
  ],
  washroom: [
    { key: "vanityCounter", label: "Vanity counter", type: "boolean" },
    { key: "showerCubicle", label: "Shower cubicle", type: "boolean" },
    { key: "accessibleFixtures", label: "Accessible fixtures", type: "boolean" },
  ],
};

export function booleanQuestionKeys(spaceKey: string): string[] {
  return (SPACE_QUESTIONS[spaceKey] ?? []).filter((q) => q.type === "boolean").map((q) => q.key);
}
