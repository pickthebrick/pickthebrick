"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateLayoutRoomTypeAction,
  setLayoutAdjacencyRuleAction,
  updateLayoutSettingsAction,
  setLayoutConstitutionAction,
} from "@/app/actions/layoutRules";
import { LayoutAdjacencyRelation } from "@/app/generated/prisma/enums";

type Space = { key: string; label: string };
type RoomType = {
  spaceKey: string;
  minWidth: number;
  minLength: number;
  targetArea: number;
  color: string;
  sortOrder: number;
};
type AdjacencyRule = {
  roomTypeA: string;
  roomTypeB: string;
  relation: LayoutAdjacencyRelation;
  weight: number;
};
type Settings = {
  corridorWidth: number;
  doorWidth: number;
  minRoomClearance: number;
  estimatedCorridorOverheadPct: number;
  currentAlgorithmVersion: number;
} | null;
type Constitution = {
  designPhilosophy: string;
  circulationStandards: string;
  roomSizingNotes: string;
  terminology: string;
};

const EMPTY_ROOM_TYPE = { minWidth: 0, minLength: 0, targetArea: 0, color: "#cccccc" };

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

export default function AiDesignerClient({
  spaces,
  roomTypes,
  adjacencyRules,
  settings,
  constitution,
}: {
  spaces: Space[];
  roomTypes: RoomType[];
  adjacencyRules: AdjacencyRule[];
  settings: Settings;
  constitution: Constitution;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      {error && (
        <p className="sub" style={{ color: "#b23b3b" }}>
          {error}
        </p>
      )}
      <KnowledgeBase constitution={constitution} onError={setError} onSaved={() => router.refresh()} />
      <RoomTypesTable spaces={spaces} roomTypes={roomTypes} onError={setError} onSaved={() => router.refresh()} />
      <AdjacencyTable spaces={spaces} adjacencyRules={adjacencyRules} onError={setError} onSaved={() => router.refresh()} />
      <SettingsForm settings={settings} onError={setError} onSaved={() => router.refresh()} />
    </>
  );
}

const CONSTITUTION_SECTIONS: { key: keyof Constitution; label: string; hint: string }[] = [
  {
    key: "designPhilosophy",
    label: "Design philosophy",
    hint: "Overall priorities for how PickTheBrick lays out an office - e.g. what should win when priorities conflict (privacy vs. collaboration, headcount density vs. comfort).",
  },
  {
    key: "circulationStandards",
    label: "Circulation standards",
    hint: "The corridor width, door width, and fire-egress/accessibility standards the Circulation settings below should be based on, and where they come from.",
  },
  {
    key: "roomSizingNotes",
    label: "Room sizing notes",
    hint: "The reasoning behind the per-room-type minimums below - space per desk, per seat, ergonomic clearances, etc.",
  },
  {
    key: "terminology",
    label: "Terminology",
    hint: "Definitions for room types or internal shorthand, so this page stays legible to whoever edits it next.",
  },
];

function KnowledgeBase({
  constitution,
  onError,
  onSaved,
}: {
  constitution: Constitution;
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(constitution);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleSave() {
    setBusy(true);
    onError(null);
    try {
      await setLayoutConstitutionAction(values);
      setSavedAt(new Date());
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Knowledge base</h2>
      <p className="sub">
        Reference documentation for whoever configures the rules below - the layout generator itself is a
        deterministic algorithm, not an AI call, so nothing here is fed into a prompt today. This is where the
        standards behind the numbers live so they survive beyond whoever typed them in.
      </p>
      {CONSTITUTION_SECTIONS.map((s) => (
        <div key={s.key} style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{s.label}</label>
          <p className="sub" style={{ marginTop: 0, marginBottom: 6 }}>
            {s.hint}
          </p>
          <textarea
            value={values[s.key]}
            onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
            rows={3}
            style={{ width: "100%", padding: 8, fontFamily: "inherit", fontSize: 13 }}
          />
        </div>
      ))}
      <button className="action" disabled={busy} onClick={handleSave}>
        {busy ? "Saving…" : "Save knowledge base"}
      </button>
      {savedAt && (
        <span className="sub" style={{ marginLeft: 10, marginBottom: 0 }}>
          Saved {savedAt.toLocaleTimeString()}
        </span>
      )}
    </>
  );
}

function RoomTypesTable({
  spaces,
  roomTypes,
  onError,
  onSaved,
}: {
  spaces: Space[];
  roomTypes: RoomType[];
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const byKey = new Map(roomTypes.map((rt) => [rt.spaceKey, rt]));
  const [values, setValues] = useState<Record<string, typeof EMPTY_ROOM_TYPE>>(
    Object.fromEntries(spaces.map((s, i) => [s.key, byKey.get(s.key) ?? { ...EMPTY_ROOM_TYPE, sortOrder: i }]))
  );
  const [busy, setBusy] = useState<string | null>(null);

  function update(key: string, field: keyof typeof EMPTY_ROOM_TYPE, value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: field === "color" ? value : Number(value) },
    }));
  }

  async function handleSave(spaceKey: string, sortOrder: number) {
    setBusy(spaceKey);
    onError(null);
    try {
      const v = values[spaceKey];
      await updateLayoutRoomTypeAction(spaceKey, { ...v, sortOrder });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h2>Room types</h2>
      <p className="sub">Minimum footprint and target area per room type - the generator never places a room smaller than this.</p>
      <table>
        <thead>
          <tr>
            <th>Room type</th>
            <th>Min width (ft)</th>
            <th>Min length (ft)</th>
            <th>Target area (sqft)</th>
            <th>Color</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {spaces.map((s, i) => {
            const v = values[s.key];
            const saved = byKey.get(s.key);
            const configured = Boolean(saved && saved.minWidth > 0 && saved.minLength > 0 && saved.targetArea > 0);
            return (
              <tr key={s.key}>
                <td>
                  {s.label}
                  {!configured && (
                    <span className="sub" style={{ marginLeft: 6, color: "#b23b3b" }}>
                      not configured
                    </span>
                  )}
                </td>
                <td>
                  <input type="number" min={0} step="0.5" value={v.minWidth} onChange={(e) => update(s.key, "minWidth", e.target.value)} style={{ width: 80 }} />
                </td>
                <td>
                  <input type="number" min={0} step="0.5" value={v.minLength} onChange={(e) => update(s.key, "minLength", e.target.value)} style={{ width: 80 }} />
                </td>
                <td>
                  <input type="number" min={0} step="1" value={v.targetArea} onChange={(e) => update(s.key, "targetArea", e.target.value)} style={{ width: 90 }} />
                </td>
                <td>
                  <input type="color" value={v.color} onChange={(e) => update(s.key, "color", e.target.value)} />
                </td>
                <td>
                  <button className="action" disabled={busy === s.key} onClick={() => handleSave(s.key, i)}>
                    {busy === s.key ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const RELATION_LABELS: Record<LayoutAdjacencyRelation, string> = {
  required: "Required adjacent",
  preferred: "Preferred adjacent",
  avoid: "Avoid adjacent",
};

function AdjacencyTable({
  spaces,
  adjacencyRules,
  onError,
  onSaved,
}: {
  spaces: Space[];
  adjacencyRules: AdjacencyRule[];
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const byPair = new Map(adjacencyRules.map((r) => [pairKey(r.roomTypeA, r.roomTypeB), r]));
  const pairs: { a: Space; b: Space }[] = [];
  for (let i = 0; i < spaces.length; i++) {
    for (let j = i + 1; j < spaces.length; j++) {
      pairs.push({ a: spaces[i], b: spaces[j] });
    }
  }

  const [values, setValues] = useState<Record<string, { relation: LayoutAdjacencyRelation | ""; weight: number }>>(
    Object.fromEntries(
      pairs.map(({ a, b }) => {
        const existing = byPair.get(pairKey(a.key, b.key));
        return [pairKey(a.key, b.key), { relation: existing?.relation ?? "", weight: existing?.weight ?? 1 }];
      })
    )
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function handleSave(a: string, b: string) {
    const key = pairKey(a, b);
    setBusy(key);
    onError(null);
    try {
      const v = values[key];
      await setLayoutAdjacencyRuleAction(a, b, v.relation === "" ? null : v.relation, v.weight);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <h2>Adjacency rules</h2>
      <p className="sub">
        Every room-type pair, both directions covered by one row. Leave as &quot;None&quot; for pairs with no particular
        relationship - the generator only uses weight to break ties among rules of the same kind, so it barely
        matters within a single relation.
      </p>
      <table>
        <thead>
          <tr>
            <th>Room A</th>
            <th>Room B</th>
            <th>Relation</th>
            <th>Weight</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pairs.map(({ a, b }) => {
            const key = pairKey(a.key, b.key);
            const v = values[key];
            return (
              <tr key={key}>
                <td>{a.label}</td>
                <td>{b.label}</td>
                <td>
                  <select
                    value={v.relation}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [key]: { ...prev[key], relation: e.target.value as LayoutAdjacencyRelation | "" } }))
                    }
                  >
                    <option value="">None</option>
                    {Object.entries(RELATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={v.weight}
                    disabled={v.relation === ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: { ...prev[key], weight: Number(e.target.value) } }))}
                    style={{ width: 60 }}
                  />
                </td>
                <td>
                  <button className="action" disabled={busy === key} onClick={() => handleSave(a.key, b.key)}>
                    {busy === key ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const EMPTY_SETTINGS = { corridorWidth: 0, doorWidth: 0, minRoomClearance: 0, estimatedCorridorOverheadPct: 0, currentAlgorithmVersion: 1 };

function SettingsForm({
  settings,
  onError,
  onSaved,
}: {
  settings: Settings;
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(settings ?? EMPTY_SETTINGS);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    onError(null);
    try {
      await updateLayoutSettingsAction(values);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Circulation</h2>
      <p className="sub">One active policy - corridor and door width, plus how much slack to assume for corridors when checking whether a room program fits a drawn boundary.</p>
      <table>
        <tbody>
          <tr>
            <td>Corridor width (ft)</td>
            <td>
              <input type="number" min={0} step="0.5" value={values.corridorWidth} onChange={(e) => setValues((v) => ({ ...v, corridorWidth: Number(e.target.value) }))} style={{ width: 80 }} />
            </td>
          </tr>
          <tr>
            <td>Door width (ft)</td>
            <td>
              <input type="number" min={0} step="0.1" value={values.doorWidth} onChange={(e) => setValues((v) => ({ ...v, doorWidth: Number(e.target.value) }))} style={{ width: 80 }} />
            </td>
          </tr>
          <tr>
            <td>Min room clearance (ft)</td>
            <td>
              <input type="number" min={0} step="0.1" value={values.minRoomClearance} onChange={(e) => setValues((v) => ({ ...v, minRoomClearance: Number(e.target.value) }))} style={{ width: 80 }} />
            </td>
          </tr>
          <tr>
            <td>Estimated corridor overhead (%)</td>
            <td>
              <input
                type="number"
                min={0}
                step="1"
                value={values.estimatedCorridorOverheadPct * 100}
                onChange={(e) => setValues((v) => ({ ...v, estimatedCorridorOverheadPct: Number(e.target.value) / 100 }))}
                style={{ width: 80 }}
              />
            </td>
          </tr>
          <tr>
            <td>Algorithm version</td>
            <td>
              <input
                type="number"
                min={1}
                step="1"
                value={values.currentAlgorithmVersion}
                onChange={(e) => setValues((v) => ({ ...v, currentAlgorithmVersion: Number(e.target.value) }))}
                style={{ width: 80 }}
              />
              <p className="sub" style={{ marginBottom: 0 }}>Bump this after a rule change that should be tracked separately from earlier generated layouts.</p>
            </td>
          </tr>
        </tbody>
      </table>
      <button className="action" disabled={busy} onClick={handleSave}>
        {busy ? "Saving…" : "Save circulation settings"}
      </button>
    </>
  );
}
