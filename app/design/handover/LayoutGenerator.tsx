"use client";

import { useState } from "react";
import { generateLayoutAction } from "@/app/actions/design";
import BoundaryDrawer from "./BoundaryDrawer";
import type { Point, LayoutResult, LayoutAnnotations } from "@/lib/layoutGenerator/types";

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 360;

type GenerateOutcome = Awaited<ReturnType<typeof generateLayoutAction>>;

function pointsAttr(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function centroid(points: Point[]): Point {
  const n = points.length;
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y] as Point, [0, 0] as Point);
  return [sum[0] / n, sum[1] / n];
}

export default function LayoutGenerator({
  designRequestId,
  onGenerated,
}: {
  designRequestId: string;
  onGenerated?: () => void;
}) {
  // Already in real feet - BoundaryDrawer's grid/ruler are 1 diagram unit =
  // 1 ft, so unlike the hand-rolled canvas this replaced, there's no
  // separate "scale the drawn shape to match the declared office size" step.
  const [boundary, setBoundary] = useState<Point[] | null>(null);
  const [annotations, setAnnotations] = useState<LayoutAnnotations>({ doors: [], windows: [], columns: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<GenerateOutcome | null>(null);

  function handleReset() {
    setBoundary(null);
    setAnnotations({ doors: [], windows: [], columns: [] });
    setOutcome(null);
    setError(null);
  }

  async function handleGenerate() {
    if (!boundary) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateLayoutAction(designRequestId, boundary, annotations);
      setOutcome(result);
      if (!result.ok) setError(null);
      else onGenerated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate a layout");
    } finally {
      setBusy(false);
    }
  }

  if (outcome?.ok) {
    return <LayoutResultView result={outcome.result} feasibility={outcome.feasibility} onRedraw={handleReset} />;
  }

  if (!boundary) {
    return (
      <div>
        <BoundaryDrawer
          onComplete={(pts, marks) => {
            setBoundary(pts);
            setAnnotations(marks);
            setError(null);
          }}
          onError={setError}
        />
        {error && <p className="sqft-hint">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="sqft-hint">
        Wall outline drawn ({boundary.length} corners, {annotations.doors.length} door
        {annotations.doors.length === 1 ? "" : "s"}, {annotations.windows.length} window
        {annotations.windows.length === 1 ? "" : "s"}, {annotations.columns.length} column
        {annotations.columns.length === 1 ? "" : "s"} marked). Ready to generate a layout from it.
      </p>
      <div className="handover-upload-row layout-draw-actions">
        <button type="button" className="action" onClick={handleReset} disabled={busy}>
          Redraw boundary
        </button>
        <button type="button" className="design-start-btn" onClick={handleGenerate} disabled={busy}>
          {busy ? "Generating…" : "Generate layout"}
        </button>
      </div>
      {error && <p className="sqft-hint">{error}</p>}
      {outcome && !outcome.ok && (
        <>
          <p className="sqft-hint">{outcome.message}</p>
          {outcome.reason === "boundary_too_irregular" && (
            <button type="button" className="action" onClick={handleReset}>
              Redraw boundary
            </button>
          )}
        </>
      )}
    </div>
  );
}

function LayoutResultView({
  result,
  feasibility,
  onRedraw,
}: {
  result: LayoutResult;
  feasibility: { feasible: boolean; utilizationPct: number } | null;
  onRedraw: () => void;
}) {
  const allPoints: Point[] = [...result.rooms.flatMap((r) => r.polygon), ...result.corridors.flatMap((c) => c.polygon)];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of allPoints) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const padding = Math.max(width, height) * 0.04;
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;
  const labelSize = Math.max(width, height) * 0.02;

  return (
    <div>
      {feasibility && !feasibility.feasible && (
        <p className="sqft-hint">
          This room program may be tight for your drawn boundary (about {Math.round(feasibility.utilizationPct * 100)}% of the
          space it needs) - the layout below is still generated, but a larger boundary or a smaller room program would fit
          more comfortably.
        </p>
      )}
      <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} viewBox={viewBox} className="layout-result-canvas">
        {result.corridors.map((c, i) => (
          <polygon key={`corridor-${i}`} points={pointsAttr(c.polygon)} className="layout-corridor" />
        ))}
        {result.rooms.map((r, i) => {
          const [cx, cy] = centroid(r.polygon);
          return (
            <g key={`room-${i}`}>
              <polygon points={pointsAttr(r.polygon)} fill={r.color} className="layout-room" />
              {r.doors.map((d, di) => (
                <line
                  key={di}
                  x1={d.axis === "x" ? d.center[0] : d.center[0] - d.width / 2}
                  y1={d.axis === "x" ? d.center[1] - d.width / 2 : d.center[1]}
                  x2={d.axis === "x" ? d.center[0] : d.center[0] + d.width / 2}
                  y2={d.axis === "x" ? d.center[1] + d.width / 2 : d.center[1]}
                  className="layout-door"
                />
              ))}
              <text x={cx} y={cy} textAnchor="middle" fontSize={labelSize} className="layout-room-label">
                {r.instanceLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <button type="button" className="action" onClick={onRedraw}>
        Redraw boundary
      </button>
    </div>
  );
}
