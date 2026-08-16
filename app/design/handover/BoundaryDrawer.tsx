"use client";

import { useEffect, useRef, useState } from "react";
import {
  DiagramComponent,
  SnapConstraints,
  DiagramTools,
  NodeConstraints,
  type NodeModel,
  type ConnectorModel,
  type IElementDrawEventArgs,
  type IDraggingEventArgs,
} from "@syncfusion/ej2-react-diagrams";
import { registerLicense } from "@syncfusion/ej2-base";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-diagrams/styles/material.css";
import { isSimplePolygon } from "@/lib/layoutGenerator/planarGeometry";
import type { Point, LayoutAnnotations, LayoutLineMark } from "@/lib/layoutGenerator/types";

// Empty locally shows Syncfusion's trial watermark - harmless for dev, see
// .env.example for how to get a real (free, for an eligible business)
// Community License key.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY) {
  registerLicense(process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY);
}

const CANVAS_HEIGHT = 640;
const RULER_H_SIZE = 22;
const RULER_V_SIZE = 34;

const WALL_COLOR = "#1f2937";
// Light orange, 60% transparent - the border (strokeColor/strokeWidth
// above) stays fully solid since this is only the polygon's interior fill.
const WALL_FILL_COLOR = "rgba(251, 146, 60, 0.4)";
const DOOR_COLOR = "#16a34a";
const WINDOW_COLOR = "#2563eb";
const COLUMN_COLOR = "#78716c";
const COLUMN_FILL = "rgba(120, 113, 108, 0.35)";
// Typical concrete column footprint - a sensible default size for a plain
// click (no drag) with the column tool, in meters regardless of active unit.
const COLUMN_DEFAULT_SIZE_M = 0.4;
const VERTEX_HANDLE_COLOR = "#d9633f";
// A comfortably clickable dot regardless of unit - about 10 inches across.
const VERTEX_HANDLE_SIZE_M = 0.25;
const METERS_TO_FEET = 3.28084;
const TRACE_IMAGE_OPACITY = 0.35;
const CALIB_DISPLAY_MAX_WIDTH = 600;
const WALL_THICKNESS_M = 0.15;
// How much of the canvas a freshly-opened board (or a just-fitted import)
// leaves as breathing room around the content, rather than filling it edge
// to edge.
const FIT_MARGIN = 0.85;
const DEFAULT_VIEW_M = 10;

type Unit = "ft" | "m";
type Tool = "wall" | "door" | "window" | "column-rect" | "column-oval" | "select";
// Maps diagram-unit coordinates to screen pixels: screenX = (diagramX + tx) * scale
// (read directly off Syncfusion's own scroller.transform - see ej2-diagrams
// interaction/scroller.d.ts). Kept in our own state, refreshed on the
// diagram's `created`/`scrollChange` events, so the ruler below stays
// accurate through panning/zooming instead of drifting out of sync.
type ViewTransform = { tx: number; ty: number; scale: number };
type Mark = LayoutLineMark & { id: string };
type ColumnMark = { id: string; shape: "rect" | "oval"; center: Point; width: number; height: number };
// Undocumented internal state of the in-progress drawing tool - there's no
// public type for this in ej2-diagrams, so it's narrowed by hand the same
// way ViewTransform narrows scroller.transform above. Used to read the
// polygon's live points (for the "Close wall" button, see handleCloseWall)
// without waiting for Syncfusion's own Completed event.
type DrawingToolState = { drawingObject?: { shape?: { points?: { x: number; y: number }[] } } };

// The diagram's own coordinate space is always in "diagram units" no matter
// the zoom - currentZoom only changes how many screen pixels one diagram
// unit occupies. So "1 unit = 1 ft" vs "1 unit = 1 m" is purely a labeling
// + grid-density choice; whichever is active, points read off the diagram
// are converted to feet (the algorithm's native unit, see types.ts) before
// they ever leave this component.
//
// Default pixelsPerUnit opens the board on roughly a DEFAULT_VIEW_M x
// DEFAULT_VIEW_M (10m x 10m) area - the previous fixed 20px/ft, 60px/m
// zoom left barely any margin around a room that size, reading as "too
// zoomed in".
const UNIT_CONFIG: Record<Unit, { minor: number; major: number; pixelsPerUnit: number; toFeet: number; label: string }> = {
  ft: {
    minor: 1,
    major: 5,
    pixelsPerUnit: (CANVAS_HEIGHT * FIT_MARGIN) / (DEFAULT_VIEW_M * METERS_TO_FEET),
    toFeet: 1,
    label: "ft",
  },
  m: { minor: 1, major: 5, pixelsPerUnit: (CANVAS_HEIGHT * FIT_MARGIN) / DEFAULT_VIEW_M, toFeet: METERS_TO_FEET, label: "m" },
};

// A repeating [line-width, gap] pattern whose pairs each sum to `minor`,
// with the first (thicker) pair marking every `majorEvery`-th line - the
// same structure Syncfusion's own default gridline pattern uses.
function gridlineIntervals(minor: number, majorEvery: number): number[] {
  const intervals: number[] = [0.1 * minor, 0.9 * minor];
  for (let i = 1; i < majorEvery; i++) intervals.push(0.02 * minor, 0.98 * minor);
  return intervals;
}

// A door is a small opening marker, clearly thinner than the wall it's cut
// into. A window, by contrast, can be a full curtain-wall/glass section
// replacing a run of solid wall - so it's drawn at the SAME thickness as
// the wall itself (see drawingObjectFor below), letting the client trace
// it directly over a wall edge rather than as a separate stubby marker.
const DOOR_THICKNESS_M = WALL_THICKNESS_M * 0.5;

function thicknessInUnit(meters: number, unit: Unit): number {
  return unit === "m" ? meters : meters * METERS_TO_FEET;
}

// Inverse of the `p.x * config.toFeet` conversion used everywhere marks are
// read off the diagram - needed here to place vertex handles (which live in
// diagram-unit space) from wallClosed (which is stored in feet).
function feetToUnit(feet: number, unit: Unit): number {
  return unit === "m" ? feet / METERS_TO_FEET : feet;
}

// Capped at 15cm (~0.49ft) regardless of unit - this is a visual stroke
// width on the boundary shape, not something fed into the layout algorithm
// (which only ever sees the boundary's vertex coordinates), so it just
// needs to read as a plausible partition wall rather than the room's own
// footprint.
function wallDrawingObject(unit: Unit): NodeModel {
  const thickness = thicknessInUnit(WALL_THICKNESS_M, unit);
  return {
    shape: { type: "Basic", shape: "Polygon" },
    style: { strokeColor: WALL_COLOR, strokeWidth: thickness, fill: WALL_FILL_COLOR },
    // No Drag/Resize/Rotate - reshaping only happens per-vertex via the
    // handle dots (see the vertex-handle effect/handleVertexDrag below).
    // Left whole-shape draggable, an edge-drag would just relocate the
    // entire outline instead, fighting with corner-by-corner editing.
    constraints: NodeConstraints.Select | NodeConstraints.PointerEvents,
  } as NodeModel;
}

function lineDrawingObject(color: string, thickness: number): ConnectorModel {
  return {
    type: "Straight",
    style: { strokeColor: color, strokeWidth: thickness },
    // A plain colored line, not a flowchart-style arrow. `shape: "None"`
    // should suppress the decorator entirely, but its default width/height
    // is 10 *diagram units* - 10 feet, on our human-scale grid - so it's
    // also shrunk to near-zero as a defensive fallback in case a shape of
    // "None" still occupies its full bounding box in some code path.
    sourceDecorator: { shape: "None", width: 1, height: 1 },
    targetDecorator: { shape: "None", width: 1, height: 1 },
  } as ConnectorModel;
}

// A column/pillar is a resizable box or ellipse the client click-drags to
// size - a plain click (no drag) falls back to COLUMN_DEFAULT_SIZE_M so it
// still reads as a plausible column instead of Syncfusion's own default
// (100 diagram units - 100 feet - which would swallow the whole floor plan).
function columnDrawingObject(shapeType: "Rectangle" | "Ellipse", unit: Unit): NodeModel {
  const size = thicknessInUnit(COLUMN_DEFAULT_SIZE_M, unit);
  return {
    width: size,
    height: size,
    shape: { type: "Basic", shape: shapeType },
    style: { strokeColor: COLUMN_COLOR, strokeWidth: thicknessInUnit(0.03, unit), fill: COLUMN_FILL },
  } as NodeModel;
}

function toolFor(tool: Tool): DiagramTools {
  if (tool === "wall") return DiagramTools.ContinuousDraw;
  if (tool === "select") return DiagramTools.SingleSelect;
  return DiagramTools.DrawOnce;
}

function drawingObjectFor(tool: Tool, unit: Unit): NodeModel | ConnectorModel | undefined {
  if (tool === "wall") return wallDrawingObject(unit);
  if (tool === "select") return undefined;
  if (tool === "door") return lineDrawingObject(DOOR_COLOR, thicknessInUnit(DOOR_THICKNESS_M, unit));
  if (tool === "window") return lineDrawingObject(WINDOW_COLOR, thicknessInUnit(WALL_THICKNESS_M, unit));
  if (tool === "column-rect") return columnDrawingObject("Rectangle", unit);
  return columnDrawingObject("Ellipse", unit);
}

type Tick = { pos: number; unit: number; major: boolean };

// Syncfusion's own ruler labels raw screen-pixel offsets with no zoom
// awareness (verified in ej2-diagrams source), so its numbers never mean
// real feet/meters - it's disabled below in favor of this hand-rolled one,
// computed straight from the same unit system the grid and boundary points
// use (screenPos = (diagramUnit + offset) * scale, read off Syncfusion's
// own scroller.transform - see ViewTransform above), kept in sync with
// panning/zooming via the diagram's `scrollChange` event.
function ticksForAxis(offsetValue: number, viewportPx: number, scale: number, major: number): Tick[] {
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(viewportPx)) return [];
  const unitAtStart = Math.floor(-offsetValue) - 1;
  const unitAtEnd = Math.ceil(viewportPx / scale - offsetValue) + 1;
  const ticks: Tick[] = [];
  for (let u = unitAtStart; u <= unitAtEnd; u++) {
    const pos = (u + offsetValue) * scale;
    if (pos < -2 || pos > viewportPx + 2) continue;
    ticks.push({ pos, unit: u, major: ((u % major) + major) % major === 0 });
  }
  return ticks;
}

function WallIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 4h12M2 4v8M14 4v8M2 12h12" />
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 13.5V2.5" />
      <path d="M3 13.5A10.5 10.5 0 0 0 13 3" />
    </svg>
  );
}
function WindowIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 6h12M2 10h12" />
    </svg>
  );
}
function ColumnRectIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="10" height="10" rx="1" />
    </svg>
  );
}
function ColumnOvalIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <ellipse cx="8" cy="8" rx="6" ry="4" />
    </svg>
  );
}
function CursorIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 1.8 12.8 8.4 8.2 9.3 10.4 13.6 8.6 14.5 6.4 10.2 3.4 13.2Z" />
    </svg>
  );
}
function CloseLoopIcon() {
  return (
    <svg className="layout-tool-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 6.5 12 13 4" />
    </svg>
  );
}

export default function BoundaryDrawer({
  onComplete,
  onError,
}: {
  onComplete: (boundary: Point[], annotations: LayoutAnnotations) => void;
  onError: (message: string) => void;
}) {
  const [unit, setUnit] = useState<Unit>("ft");
  const [tool, setTool] = useState<Tool>("wall");
  const toolRef = useRef<Tool>("wall");
  const [pointCount, setPointCount] = useState(0);
  const pointCountRef = useRef(0);
  // Set once the wall outline itself is closed - the diagram's polygon tool
  // only tolerates one continuous, uninterrupted click sequence (switching
  // to the door/window tool mid-draw corrupts the in-progress shape, since
  // that hands diagram.eventHandler.tool to a different tool instance
  // partway through Syncfusion's own drawing state machine). So doors/
  // windows are marked in a second phase, after the wall is done and no
  // draw is in-flight to interrupt - onComplete only fires once the client
  // confirms via the "Done" button below, not the instant the wall closes.
  const [wallClosed, setWallClosed] = useState<Point[] | null>(null);
  // The id Syncfusion assigned the closed wall's own polygon node - needed
  // to find and mutate its shape.points when a vertex handle is dragged
  // (see the vertex-handle effect and handleVertexDrag below).
  const wallNodeIdRef = useRef<string | null>(null);
  // Guards handleVertexDrag against double-processing: Syncfusion has been
  // observed firing "Completed" more than once for a single real drag
  // gesture, which - since each firing removes+re-adds the wall node - left
  // stale duplicate nodes behind. Reset on "Start" so the next genuine drag
  // is still handled.
  const vertexDragCompletedRef = useRef(false);
  const [doors, setDoors] = useState<Mark[]>([]);
  const [windows, setWindows] = useState<Mark[]>([]);
  const [columns, setColumns] = useState<ColumnMark[]>([]);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [transform, setTransform] = useState<ViewTransform>({ tx: 0, ty: 0, scale: UNIT_CONFIG.ft.pixelsPerUnit });
  const [viewportWidth, setViewportWidth] = useState(0);
  // Set right after a trace import is confirmed, to fit the whole image on
  // screen - overrides the unit's default pixelsPerUnit until the next
  // reset/unit change.
  const [fitZoom, setFitZoom] = useState<number | null>(null);
  const diagramRef = useRef<DiagramComponent>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasCellRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // Calibrating a just-imported PDF/image before it's added to the board -
  // see handleImportFile/handleConfirmCalibration.
  const [pendingImport, setPendingImport] = useState<{ dataUrl: string; naturalWidth: number; naturalHeight: number } | null>(null);
  const [calibPoints, setCalibPoints] = useState<{ x: number; y: number }[]>([]);
  const [calibLength, setCalibLength] = useState("");
  // Lets the client zoom into the calibration preview to click precise
  // points on a detailed floor plan - existing points are cleared on zoom
  // since they're stored in on-screen (not natural-image) coordinates and
  // would otherwise land in the wrong place once the image resizes.
  const [calibZoom, setCalibZoom] = useState(1);

  const config = UNIT_CONFIG[unit];
  const zoom = fitZoom ?? config.pixelsPerUnit;
  const gridIntervals = gridlineIntervals(config.minor, config.major / config.minor);

  useEffect(() => {
    pointCountRef.current = pointCount;
  }, [pointCount]);

  // Track the canvas cell's live pixel width so the horizontal ruler knows
  // how many ticks to draw (height is fixed, see CANVAS_HEIGHT), and so a
  // just-imported trace can be fit to the real on-screen size.
  useEffect(() => {
    const el = canvasCellRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setViewportWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Two interception points on the wrapper, both ahead of Syncfusion's own
  // listeners on the canvas element itself:
  //
  // 1. `mouseleave`/`pointerleave` - Syncfusion's handler unconditionally
  //    discards the in-progress drawing tool on leave (see
  //    DiagramEventHandler.prototype.mouseLeave in ej2-diagrams source - it
  //    sets `this.tool = null`), so a client whose cursor strays outside the
  //    canvas mid-outline would otherwise lose every point placed so far
  //    with no warning. These events don't bubble, but they do still
  //    traverse the capture phase on the way down to the canvas element, so
  //    a capturing listener up here can swallow them first. Only suppressed
  //    mid-draw; normal hover/selection-on-leave behavior is left alone the
  //    rest of the time.
  // 2. `wheel` - Syncfusion only zooms on Ctrl/Cmd+wheel and pans on a bare
  //    wheel; scroll-to-zoom (the expected gesture here) is handled
  //    entirely ourselves, and Syncfusion's own handling is suppressed so
  //    the two don't fight over the same gesture.
  // 3. `keydown` (on window, not just the wrapper - focus can land almost
  //    anywhere mid-draw) - Escape cancels an in-progress wall outline. Only
  //    acts while the wall tool has points down, so it never interferes with
  //    Escape's usual job elsewhere on the page.
  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    function interceptLeave(e: Event) {
      if (pointCountRef.current > 0) e.stopPropagation();
    }
    function interceptWheel(e: WheelEvent) {
      const diagram = diagramRef.current;
      const cell = canvasCellRef.current;
      if (!diagram || !cell) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = cell.getBoundingClientRect();
      const t = diagram.scroller.transform as unknown as ViewTransform;
      const focusPoint = {
        x: (e.clientX - rect.left) / t.scale - t.tx,
        y: (e.clientY - rect.top) / t.scale - t.ty,
      };
      diagram.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, focusPoint);
    }
    function interceptEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (toolRef.current !== "wall" || pointCountRef.current === 0) return;
      e.preventDefault();
      // Just reassigning `diagram.tool` leaves Syncfusion's in-progress
      // polygon adorner (the preview outline) stuck on screen and the next
      // click unresponsive - it only replaces the internal tool instance on
      // the NEXT full mousedown, not immediately. A key-bump remount (same
      // mechanism resetDrawing() uses) throws away the whole Diagram
      // instance and rebuilds it clean, which is safe here since nothing
      // else has been placed yet at this stage (wall not yet closed, no
      // doors/windows/columns exist before that).
      setPointCount(0);
      setResetKey((k) => k + 1);
    }
    wrap.addEventListener("pointerleave", interceptLeave, true);
    wrap.addEventListener("mouseleave", interceptLeave, true);
    wrap.addEventListener("wheel", interceptWheel, { capture: true, passive: false });
    window.addEventListener("keydown", interceptEscape, true);
    return () => {
      wrap.removeEventListener("pointerleave", interceptLeave, true);
      wrap.removeEventListener("mouseleave", interceptLeave, true);
      wrap.removeEventListener("wheel", interceptWheel, true);
      window.removeEventListener("keydown", interceptEscape, true);
    };
  }, []);

  function refreshTransform() {
    const diagram = diagramRef.current;
    if (!diagram) return;
    const t = diagram.scroller.transform as unknown as ViewTransform;
    setTransform({ tx: t.tx, ty: t.ty, scale: t.scale });
  }

  function applyTool(next: Tool) {
    toolRef.current = next;
    setTool(next);
    setSelectedMarkId(null);
    // React re-renders BoundaryDrawer for lots of reasons unrelated to tool
    // choice (a new door/window mark, unit change, etc.) - the JSX props
    // below are kept reactive to `tool` so those re-renders can't silently
    // reset the diagram back to whatever the props said last render. This
    // imperative nudge is just for instant effect on the click itself,
    // without waiting on React's render pass.
    const diagram = diagramRef.current;
    if (!diagram) return;
    // A just-completed shape (most importantly the wall, which auto-selects
    // itself right after closing) stays selected with its resize handles
    // showing. Left alone, a drag that starts near one of those handles
    // gets captured as a RESIZE of that shape instead of reaching the new
    // tool at all - which is exactly what was distorting the wall into a
    // stray triangle the instant a door/window draw began nearby.
    diagram.clearSelection();
    diagram.tool = toolFor(next);
    const obj = drawingObjectFor(next, unit);
    if (obj) diagram.drawingObject = obj;
  }

  function handleUnitChange(next: Unit) {
    if (next === unit) return;
    const hasWork = pointCount > 0 || wallClosed !== null || doors.length > 0 || windows.length > 0 || columns.length > 0;
    if (hasWork && typeof window !== "undefined" && !window.confirm("Switching units clears the current drawing. Continue?")) {
      return;
    }
    setUnit(next);
    resetDrawing();
  }

  function resetDrawing() {
    setWallClosed(null);
    wallNodeIdRef.current = null;
    setDoors([]);
    setWindows([]);
    setColumns([]);
    setSelectedMarkId(null);
    setPointCount(0);
    setTool("wall");
    toolRef.current = "wall";
    setFitZoom(null);
    setResetKey((k) => k + 1);
  }

  // Finishes the wall outline without requiring the (not-obvious) double-
  // click gesture - dispatches a synthetic double-click at the last point
  // already placed, landing on Syncfusion's own native close-the-loop
  // handling exactly as if the client had double-clicked that same spot.
  function handleCloseWall() {
    const diagram = diagramRef.current;
    const cell = canvasCellRef.current;
    if (!diagram || !cell) return;
    const toolState = (diagram as unknown as { eventHandler?: { tool?: DrawingToolState } }).eventHandler?.tool;
    const points = toolState?.drawingObject?.shape?.points;
    if (!points || points.length < 2) return;
    // points always has one trailing "rubber band" entry past the last real
    // click, continuously overwritten to track the mouse - including all
    // the way to wherever the cursor travels while heading toward this very
    // button. Using that entry (points.length - 1) is what made the closed
    // shape distort to match the cursor's position instead of the last
    // corner actually placed - target the point BEFORE it instead, which is
    // the last click that was really committed.
    const last = points[points.length - 2];
    const rect = cell.getBoundingClientRect();
    const t = diagram.scroller.transform as unknown as ViewTransform;
    const clientX = rect.left + (last.x + t.tx) * t.scale;
    const clientY = rect.top + (last.y + t.ty) * t.scale;
    const canvasEl = document.getElementById(`${diagram.element.id}_diagramLayer`);
    if (!canvasEl) return;
    canvasEl.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, clientX, clientY, button: 0 }));
  }

  function handleSelectionChange() {
    const diagram = diagramRef.current;
    if (!diagram) return;
    const connId = diagram.selectedItems.connectors?.[0]?.id;
    const nodeId = diagram.selectedItems.nodes?.[0]?.id;
    if (connId && (doors.some((d) => d.id === connId) || windows.some((w) => w.id === connId))) {
      setSelectedMarkId(connId as string);
    } else if (nodeId && columns.some((c) => c.id === nodeId)) {
      setSelectedMarkId(nodeId as string);
    } else {
      setSelectedMarkId(null);
    }
  }

  function handleDeleteSelected() {
    const diagram = diagramRef.current;
    if (!diagram || !selectedMarkId) return;
    const connector = diagram.connectors.find((c) => c.id === selectedMarkId);
    const node = diagram.nodes.find((n) => n.id === selectedMarkId);
    if (connector) diagram.remove(connector);
    if (node) diagram.remove(node);
    setDoors((prev) => prev.filter((d) => d.id !== selectedMarkId));
    setWindows((prev) => prev.filter((w) => w.id !== selectedMarkId));
    setColumns((prev) => prev.filter((c) => c.id !== selectedMarkId));
    setSelectedMarkId(null);
  }

  // Small draggable dots at each wall corner, live only while the Select
  // tool is active (elsewhere they'd sit on top of the canvas and steal
  // clicks meant for door/window/column placement - the same class of bug
  // fixed earlier for the imported trace image). Dragging one reshapes the
  // wall directly - see handleVertexDrag below.
  useEffect(() => {
    const diagram = diagramRef.current;
    if (!diagram) return;
    // Defensive: this effect re-runs right after every wallClosed update,
    // including the one handleVertexDrag itself makes - a real drag can
    // fire that handler's "Completed" branch more than once for a single
    // gesture, occasionally leaving a duplicate wall node behind. Collapse
    // to just the most recently added copy whenever that happens.
    if (wallNodeIdRef.current) {
      const dupeWalls = diagram.nodes.filter((n) => n.id === wallNodeIdRef.current);
      dupeWalls.slice(0, -1).forEach((n) => diagram.remove(n));
    }
    const existing = diagram.nodes.filter((n) => (n.id as string)?.startsWith("wall-handle-"));
    existing.forEach((n) => diagram.remove(n));
    if (tool !== "select" || !wallClosed) return;
    const size = thicknessInUnit(VERTEX_HANDLE_SIZE_M, unit);
    const addedIds = wallClosed.map((point, i) => {
      const id = `wall-handle-${i}`;
      diagram.add({
        id,
        offsetX: feetToUnit(point[0], unit),
        offsetY: feetToUnit(point[1], unit),
        width: size,
        height: size,
        shape: { type: "Basic", shape: "Ellipse" },
        style: { fill: VERTEX_HANDLE_COLOR, strokeColor: "#fff", strokeWidth: thicknessInUnit(0.03, unit) },
        constraints: NodeConstraints.Select | NodeConstraints.Drag | NodeConstraints.PointerEvents,
      } as NodeModel);
      return id;
    });
    // React (in development, under StrictMode) runs this setup function
    // twice back-to-back for the same dependency change - without an
    // explicit cleanup undoing exactly what setup just added, the second
    // run's "remove existing" pass at the top can race Syncfusion's own
    // internal node-collection update and miss them, leaving duplicates.
    return () => {
      addedIds.forEach((id) => {
        const n = diagram.nodes.find((node) => node.id === id);
        if (n) diagram.remove(n);
      });
    };
  }, [tool, wallClosed, unit]);

  // Dragging a vertex handle reshapes the wall once the drag finishes -
  // only on "Completed", not every "Progress" tick. A real (non-scripted)
  // drag fires Progress many times, and remove+re-add on every one of those
  // piled up duplicate wall nodes with stale references (some updated, some
  // not) - Completed-only keeps this to one remove+add per gesture. The
  // handle dot itself still moves live via Syncfusion's own native
  // rendering, so the drag doesn't feel dead even though the wall polygon
  // only snaps into its new shape at release.
  function handleVertexDrag(args: IDraggingEventArgs) {
    if (args.state === "Start") {
      vertexDragCompletedRef.current = false;
      return;
    }
    if (args.state !== "Completed" || vertexDragCompletedRef.current) return;
    vertexDragCompletedRef.current = true;
    // For a single-node drag, args.source IS the node itself (not a
    // Selector wrapping .nodes[], despite the IDraggingEventArgs typing) -
    // .nodes?.[0] only ever populates for a multi-selection drag.
    const handle = args.source?.nodes?.[0] ?? (args.source as unknown as NodeModel | undefined);
    if (!handle) return;
    const id = handle.id as string | undefined;
    if (!id || !id.startsWith("wall-handle-")) return;
    const index = Number(id.slice("wall-handle-".length));
    const diagram = diagramRef.current;
    if (!diagram || !wallClosed || !wallNodeIdRef.current || Number.isNaN(index) || !wallClosed[index]) return;
    const existingWalls = diagram.nodes.filter((n) => n.id === wallNodeIdRef.current);
    const styleSource = existingWalls[existingWalls.length - 1];
    if (!styleSource) return;
    // Real (non-scripted) drags can fire this handler more than once per
    // gesture, so two things guard against duplicate/stale wall nodes
    // piling up: derive the new points from wallClosed (React state) rather
    // than the live node's shape.points, which might already be a stale
    // duplicate by the second firing; and remove every node sharing this
    // id, not just the first match, before re-adding one fresh copy.
    // A Basic Shape Polygon node's rendered path is computed once at
    // creation and isn't recomputed from a direct points mutation (neither
    // refreshDiagramLayer() nor updateDiagramObject() picks it up) - remove
    // and re-add with the updated points instead, the same pattern already
    // used elsewhere here for columns/doors/the trace image.
    const newHandlePoint = { x: handle.offsetX ?? 0, y: handle.offsetY ?? 0 };
    const newPoints = wallClosed.map((p, i) =>
      i === index ? newHandlePoint : { x: feetToUnit(p[0], unit), y: feetToUnit(p[1], unit) }
    );
    // Syncfusion is meant to auto-derive the node's bounding box from
    // `points` alone, but was observed occasionally failing to do so on a
    // second add() for the same id, leaving a degenerate offsetX/offsetY:0
    // node behind (rendered as stray handles at the origin) - computing and
    // passing the box explicitly removes that ambiguity.
    const xs = newPoints.map((p) => p.x);
    const ys = newPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    existingWalls.forEach((n) => diagram.remove(n));
    diagram.add({
      id: wallNodeIdRef.current,
      offsetX: (minX + maxX) / 2,
      offsetY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
      shape: { type: "Basic", shape: "Polygon", points: newPoints },
      style: styleSource.style,
      constraints: NodeConstraints.Select | NodeConstraints.PointerEvents,
    } as NodeModel);
    const updated: Point[] = wallClosed.map((p, i) =>
      i === index ? [(handle.offsetX ?? 0) * config.toFeet, (handle.offsetY ?? 0) * config.toFeet] : p
    );
    setWallClosed(updated);
  }

  function handleElementDraw(args: IElementDrawEventArgs) {
    // The very first mousedown of a fresh draw fires before Syncfusion has
    // constructed the node/connector object yet - source is genuinely null
    // then, despite the (non-optional) typing.
    if (!args.source) return;

    if (args.objectType === "Node") {
      const node = args.source as NodeModel;

      if (toolRef.current === "wall") {
        const shape = node.shape as { points?: { x: number; y: number }[] } | undefined;
        const rawPoints = shape?.points ?? [];

        if (args.state === "Progress" || args.state === "Start") {
          setPointCount(rawPoints.length);
          return;
        }
        if (args.state !== "Completed") return;

        // The polygon tool's click-to-add-vertex mechanics leave consecutive
        // duplicate points behind (a placeholder pushed on mousedown, only
        // repositioned once the cursor actually moves) - most visibly a run
        // of 2-3 identical trailing points from the closing click. Left in,
        // those read as zero-length edges and falsely trip the
        // self-intersection check below, so collapse runs of duplicates
        // before validating.
        const shapePoints = rawPoints.filter((p, i) => {
          const prev = rawPoints[i - 1];
          return i === 0 || !prev || p.x !== prev.x || p.y !== prev.y;
        });

        if (shapePoints.length < 3) {
          onError("Draw at least 3 points to close the wall outline.");
          setPointCount(0);
          return;
        }
        const boundary: Point[] = shapePoints.map((p) => [p.x * config.toFeet, p.y * config.toFeet]);
        if (!isSimplePolygon(boundary)) {
          onError("This boundary crosses itself - undo a point or start over.");
          setPointCount(0);
          return;
        }
        setPointCount(0);
        setWallClosed(boundary);
        wallNodeIdRef.current = (node.id as string) ?? null;
        // Deferred: this whole elementDraw callback runs from inside
        // Syncfusion's own PolygonDrawingTool.mouseUp, which still has
        // cleanup (endAction, etc.) left to run on its call stack. Mutating
        // diagram.tool/drawingObject synchronously here raced with that
        // cleanup and left a phantom wall-shaped node behind on the very
        // next draw - letting the current call stack unwind first avoids it.
        setTimeout(() => applyTool("door"), 0);
        return;
      }

      if (toolRef.current === "column-rect" || toolRef.current === "column-oval") {
        if (args.state !== "Completed") return;
        const width = node.width ?? 0;
        const height = node.height ?? 0;
        // A plain click with no drag can register with a near-zero size
        // rather than the drawingObject's default - drop it instead of
        // recording a column too small to mean anything.
        if (width < 0.05 || height < 0.05) {
          diagramRef.current?.remove(node);
          applyTool(toolRef.current);
          return;
        }
        const mark: ColumnMark = {
          id: (node.id as string) ?? `column-${Date.now()}`,
          shape: toolRef.current === "column-rect" ? "rect" : "oval",
          center: [(node.offsetX ?? 0) * config.toFeet, (node.offsetY ?? 0) * config.toFeet],
          width: width * config.toFeet,
          height: height * config.toFeet,
        };
        setColumns((prev) => [...prev, mark]);
        // DrawOnce reverts to the default select tool after one shape -
        // re-arm so the client can keep placing columns without re-clicking.
        // Deferred for the same reason as the wall branch above.
        const nextTool = toolRef.current;
        setTimeout(() => applyTool(nextTool), 0);
        return;
      }

      return;
    }

    if (args.objectType === "Connector") {
      if (args.state !== "Completed") return;
      const connector = args.source as ConnectorModel;
      const start = connector.sourcePoint;
      const end = connector.targetPoint;
      if (!start || !end) return;
      // A drag that starts exactly on an existing wall edge occasionally
      // registers with no movement at all (source === target) rather than
      // a proper line - silently drop it instead of recording a
      // zero-length door/window.
      if (Math.hypot((end.x ?? 0) - (start.x ?? 0), (end.y ?? 0) - (start.y ?? 0)) < 0.05) {
        diagramRef.current?.remove(connector);
        applyTool(toolRef.current);
        return;
      }
      const mark: Mark = {
        id: connector.id ?? `mark-${Date.now()}`,
        start: [(start.x ?? 0) * config.toFeet, (start.y ?? 0) * config.toFeet],
        end: [(end.x ?? 0) * config.toFeet, (end.y ?? 0) * config.toFeet],
      };
      if (toolRef.current === "door") setDoors((prev) => [...prev, mark]);
      else if (toolRef.current === "window") setWindows((prev) => [...prev, mark]);
      // DrawOnce reverts to the default select tool after one shape - re-arm
      // so the client can keep placing doors/windows without re-clicking.
      // Deferred for the same reason as above.
      const nextTool = toolRef.current;
      setTimeout(() => applyTool(nextTool), 0);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    setImporting(true);
    try {
      const dataUrl = file.type === "application/pdf" ? await renderPdfFirstPageToDataUrl(file) : await readFileAsDataUrl(file);
      const size = await loadImageSize(dataUrl);
      setPendingImport({ dataUrl, naturalWidth: size.width, naturalHeight: size.height });
      setCalibPoints([]);
      setCalibLength("");
      setCalibZoom(1);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import that file");
    } finally {
      setImporting(false);
    }
  }

  function handleCalibClick(e: React.MouseEvent<HTMLDivElement>) {
    if (calibPoints.length >= 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCalibPoints((prev) => [...prev, point]);
  }

  function handleCalibZoom(delta: number) {
    setCalibZoom((z) => Math.min(5, Math.max(0.5, z * delta)));
    setCalibPoints([]);
  }

  function handleConfirmCalibration() {
    if (!pendingImport || calibPoints.length !== 2) return;
    const realLength = Number(calibLength);
    if (!realLength || realLength <= 0) return;
    const diagram = diagramRef.current;
    if (!diagram) return;

    const displayScale = Math.min(1, CALIB_DISPLAY_MAX_WIDTH / pendingImport.naturalWidth) * calibZoom;
    const [p1, p2] = calibPoints;
    const displayPxDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const naturalPxDistance = displayPxDistance / displayScale;
    // realLength is entered in whichever unit is currently active, and
    // diagram units already equal that same unit (see UNIT_CONFIG comment
    // above), so this ratio converts straight from source-image pixels to
    // diagram units with no separate feet/meters step.
    const naturalPxPerDiagramUnit = naturalPxDistance / realLength;
    const widthInDiagramUnits = pendingImport.naturalWidth / naturalPxPerDiagramUnit;
    const heightInDiagramUnits = pendingImport.naturalHeight / naturalPxPerDiagramUnit;

    diagram.add({
      id: `trace-${Date.now()}`,
      offsetX: widthInDiagramUnits / 2,
      offsetY: heightInDiagramUnits / 2,
      width: widthInDiagramUnits,
      height: heightInDiagramUnits,
      shape: { type: "Image", source: pendingImport.dataUrl },
      // Scaled-to-real-size but kept low-opacity so it reads as a watermark
      // to trace over, not something that hides the grid underneath it.
      style: { opacity: TRACE_IMAGE_OPACITY },
      // Fully non-interactive: the trace is a fixed reference once scaled,
      // not something to select/drag/resize - without this it sits on top
      // of the canvas and swallows clicks meant for the active drawing
      // tool, which is exactly why walls couldn't be drawn over an import.
      constraints: NodeConstraints.None,
    } as NodeModel);

    // Placed with its top-left at the diagram origin above, and the view is
    // still at its default (untouched) pan, which also has the origin at
    // the canvas's top-left - so fitting the zoom alone (no separate pan)
    // is enough to bring the whole image into view.
    const availableWidth = (viewportWidth || CANVAS_HEIGHT) * FIT_MARGIN;
    const availableHeight = CANVAS_HEIGHT * FIT_MARGIN;
    const fitScale = Math.min(availableWidth / widthInDiagramUnits, availableHeight / heightInDiagramUnits);
    if (Number.isFinite(fitScale) && fitScale > 0) setFitZoom(fitScale);

    setPendingImport(null);
    setCalibPoints([]);
    setCalibLength("");
    setCalibZoom(1);
  }

  const hTicks = ticksForAxis(transform.tx, viewportWidth, transform.scale, config.major);
  const vTicks = ticksForAxis(transform.ty, CANVAS_HEIGHT, transform.scale, config.major);

  return (
    <div>
      <div className="layout-toolbar-card">
        <div className="layout-toolbar-section">
          <span className="layout-toolbar-label">Draw</span>
          <div className="layout-toolbar-group">
            <button type="button" className={tool === "wall" ? "active" : ""} disabled={wallClosed !== null} onClick={() => applyTool("wall")}>
              <WallIcon />
              Wall
            </button>
            <button
              type="button"
              className={tool === "door" ? "active" : ""}
              style={{ "--tool-color": DOOR_COLOR } as React.CSSProperties}
              disabled={wallClosed === null}
              onClick={() => applyTool("door")}
            >
              <DoorIcon />
              Door
            </button>
            <button
              type="button"
              className={tool === "window" ? "active" : ""}
              style={{ "--tool-color": WINDOW_COLOR } as React.CSSProperties}
              disabled={wallClosed === null}
              onClick={() => applyTool("window")}
              title="Drawn at wall thickness - trace it right over a wall edge for a curtain-wall/glass section"
            >
              <WindowIcon />
              Window
            </button>
          </div>
        </div>

        <div className="layout-toolbar-divider" />

        <div className="layout-toolbar-section">
          <span className="layout-toolbar-label">Columns</span>
          <div className="layout-toolbar-group">
            <button
              type="button"
              className={tool === "column-rect" ? "active" : ""}
              style={{ "--tool-color": COLUMN_COLOR } as React.CSSProperties}
              disabled={wallClosed === null}
              onClick={() => applyTool("column-rect")}
              title="Click-drag to size a rectangular column/pillar"
            >
              <ColumnRectIcon />
              Rectangular
            </button>
            <button
              type="button"
              className={tool === "column-oval" ? "active" : ""}
              style={{ "--tool-color": COLUMN_COLOR } as React.CSSProperties}
              disabled={wallClosed === null}
              onClick={() => applyTool("column-oval")}
              title="Click-drag to size an oval column/pillar"
            >
              <ColumnOvalIcon />
              Oval
            </button>
          </div>
        </div>

        <div className="layout-toolbar-divider" />

        <div className="layout-toolbar-section">
          <span className="layout-toolbar-label">Select</span>
          <div className="layout-toolbar-group">
            <button type="button" className={tool === "select" ? "active" : ""} disabled={wallClosed === null} onClick={() => applyTool("select")}>
              <CursorIcon />
              Select
            </button>
          </div>
        </div>

        <div className="layout-toolbar-divider" />

        <div className="layout-toolbar-section">
          <span className="layout-toolbar-label">Units</span>
          <div className="layout-toolbar-group layout-toolbar-segmented">
            <button type="button" className={unit === "ft" ? "active" : ""} onClick={() => handleUnitChange("ft")}>
              Feet
            </button>
            <button type="button" className={unit === "m" ? "active" : ""} onClick={() => handleUnitChange("m")}>
              Meters
            </button>
          </div>
        </div>

        <div className="layout-toolbar-divider" />

        <div className="layout-toolbar-section">
          <span className="layout-toolbar-label">Trace</span>
          <div className="layout-toolbar-group">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? "Importing…" : "Import PDF/image"}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleImportFile} />
          </div>
        </div>

        <div className="layout-toolbar-actions">
          {tool === "wall" && pointCount >= 3 && (
            <button type="button" className="layout-close-btn" onClick={handleCloseWall}>
              <CloseLoopIcon />
              Close wall
            </button>
          )}
          {selectedMarkId && (
            <button type="button" className="layout-delete-btn" onClick={handleDeleteSelected}>
              Delete selected
            </button>
          )}
          {wallClosed !== null && (
            <>
              <button type="button" onClick={resetDrawing}>
                Start over
              </button>
              <button type="button" className="active" onClick={() => onComplete(wallClosed, { doors, windows, columns })}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
      {importError && <p className="sqft-hint">{importError}</p>}

      <div className="layout-canvas-grid" ref={canvasWrapRef}>
        <div className="layout-ruler-corner">{config.label}</div>
        <div className="layout-ruler-h" style={{ height: RULER_H_SIZE }}>
          {hTicks.map((t) => (
            <div key={t.unit} className={`layout-ruler-tick-h${t.major ? " major" : ""}`} style={{ left: t.pos }}>
              {t.major && <span>{t.unit}</span>}
            </div>
          ))}
        </div>
        <div className="layout-ruler-v" style={{ width: RULER_V_SIZE, height: CANVAS_HEIGHT }}>
          {vTicks.map((t) => (
            <div key={t.unit} className={`layout-ruler-tick-v${t.major ? " major" : ""}`} style={{ top: t.pos }}>
              {t.major && <span>{t.unit}</span>}
            </div>
          ))}
        </div>
        <div className="layout-canvas-cell" ref={canvasCellRef}>
          <DiagramComponent
            key={`${unit}-${resetKey}`}
            ref={diagramRef}
            id="boundary-drawer-diagram"
            width="100%"
            height={`${CANVAS_HEIGHT}px`}
            tool={toolFor(tool)}
            drawingObject={drawingObjectFor(tool, unit)}
            snapSettings={{
              constraints: SnapConstraints.ShowLines | SnapConstraints.SnapToLines,
              horizontalGridlines: { lineIntervals: gridIntervals, snapIntervals: [config.minor] },
              verticalGridlines: { lineIntervals: gridIntervals, snapIntervals: [config.minor] },
            }}
            // The native ruler is off (see ticksForAxis above for why) - the
            // hand-rolled strips around this canvas replace it.
            rulerSettings={{ showRulers: false }}
            scrollSettings={{ currentZoom: zoom }}
            created={refreshTransform}
            scrollChange={refreshTransform}
            selectionChange={handleSelectionChange}
            positionChange={handleVertexDrag}
            elementDraw={handleElementDraw}
          />
        </div>
      </div>

      <p className="sqft-hint">
        {wallClosed !== null
          ? tool === "select"
            ? `Drag an orange corner dot to reshape the wall, or click a door/window/column to select it, then Delete selected. ${doors.length} door${doors.length === 1 ? "" : "s"}, ${windows.length} window${windows.length === 1 ? "" : "s"}, ${columns.length} column${columns.length === 1 ? "" : "s"} placed.`
            : `Wall outline closed. Mark any doors/windows/columns, then click Done. ${doors.length} door${doors.length === 1 ? "" : "s"}, ${windows.length} window${windows.length === 1 ? "" : "s"}, ${columns.length} column${columns.length === 1 ? "" : "s"} placed so far.`
          : pointCount > 0
            ? `${pointCount} point${pointCount === 1 ? "" : "s"} placed - click Close wall (or double-click anywhere) once you have at least 3 corners. Press Esc to start over.`
            : `Draw the wall outline (1 grid square = 1 ${unit}). Scroll to zoom. Click Close wall (or double-click) to finish once you have at least 3 corners.`}
      </p>

      {pendingImport && (
        <div className="layout-calib-overlay">
          <div className="layout-calib-modal">
            <h3>Scale this import</h3>
            <p className="sqft-hint" style={{ marginTop: 0 }}>
              Click both ends of something on the image whose real length you know (a door, a wall) so the trace
              lines up with the grid, then enter that length.
            </p>
            <div className="layout-toolbar-group" style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => handleCalibZoom(1 / 1.25)} disabled={calibZoom <= 0.5}>
                Zoom out
              </button>
              <span className="sqft-hint" style={{ margin: "0 4px" }}>
                {Math.round(calibZoom * 100)}%
              </span>
              <button type="button" onClick={() => handleCalibZoom(1.25)} disabled={calibZoom >= 5}>
                Zoom in
              </button>
            </div>
            <div
              className="layout-calib-image-scroll"
              style={{
                maxWidth: Math.min(CALIB_DISPLAY_MAX_WIDTH, pendingImport.naturalWidth),
                maxHeight: 480,
              }}
              onWheel={(e) => {
                e.preventDefault();
                handleCalibZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
              }}
            >
              <div
                className="layout-calib-image-wrap"
                onClick={handleCalibClick}
                style={{
                  width: Math.round(pendingImport.naturalWidth * Math.min(1, CALIB_DISPLAY_MAX_WIDTH / pendingImport.naturalWidth) * calibZoom),
                  height: Math.round(pendingImport.naturalHeight * Math.min(1, CALIB_DISPLAY_MAX_WIDTH / pendingImport.naturalWidth) * calibZoom),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImport.dataUrl} alt="Import preview" draggable={false} />
                {calibPoints.map((p, i) => (
                  <div key={i} className="layout-calib-point" style={{ left: p.x, top: p.y }} />
                ))}
                {calibPoints.length === 2 && (
                  <svg className="layout-calib-line">
                    <line x1={calibPoints[0].x} y1={calibPoints[0].y} x2={calibPoints[1].x} y2={calibPoints[1].y} />
                  </svg>
                )}
              </div>
            </div>
            <p className="sqft-hint">Scroll or use the buttons above to zoom in for a more precise click.</p>
            {calibPoints.length < 2 ? (
              <p className="sqft-hint">
                {2 - calibPoints.length} point{2 - calibPoints.length === 1 ? "" : "s"} left - click on the image above.
              </p>
            ) : (
              <div className="layout-toolbar-group">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={calibLength}
                  onChange={(e) => setCalibLength(e.target.value)}
                  placeholder={`Length in ${unit}`}
                  style={{ width: 120 }}
                />
                <span>{unit}</span>
                <button type="button" className="active" onClick={handleConfirmCalibration} disabled={!calibLength || Number(calibLength) <= 0}>
                  Use this scale
                </button>
                <button type="button" onClick={() => setCalibPoints([])}>
                  Redo points
                </button>
              </div>
            )}
            <button type="button" onClick={() => setPendingImport(null)} style={{ marginTop: 10 }}>
              Cancel import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

function loadImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = dataUrl;
  });
}

async function renderPdfFirstPageToDataUrl(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare a canvas to render the PDF");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}
