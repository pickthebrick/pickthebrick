import type { ReactElement } from "react";

// Small isometric "room corner" illustrations for the space-picker cards -
// a shared floor+walls shell (drawn once per icon) plus a couple of simple
// isometric boxes standing in for each space's signature furniture, so every
// icon reads as a distinct little room rather than a generic glyph.

type Point = { x: number; y: number };

const CENTER: Point = { x: 50, y: 62 };
// One "floor unit" step along each of the two horizontal room axes.
const RIGHT = { dx: 17.5, dy: 8.5 };
const LEFT = { dx: -17.5, dy: 8.5 };

function add(p: Point, v: { dx: number; dy: number }, n = 1): Point {
  return { x: p.x + v.dx * n, y: p.y + v.dy * n };
}
function pts(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

// A box floating on the floor, anchored at `origin` (in right/left step
// units from the room center) with width/depth in step units and a pixel
// height. Renders as three shaded polygons (top, right face, left face).
function IsoBox({
  originR,
  originL,
  w,
  d,
  h,
  top,
  right,
  left,
}: {
  originR: number;
  originL: number;
  w: number;
  d: number;
  h: number;
  top: string;
  right: string;
  left: string;
}) {
  const base = add(add(CENTER, RIGHT, originR), LEFT, originL);
  const bFront = base;
  const bRight = add(base, RIGHT, w);
  const bBack = add(add(base, RIGHT, w), LEFT, d);
  const bLeft = add(base, LEFT, d);
  const up = (p: Point): Point => ({ x: p.x, y: p.y - h });

  return (
    <>
      <polygon points={pts([up(bFront), up(bRight), up(bBack), up(bLeft)])} fill={top} />
      <polygon points={pts([bFront, bRight, up(bRight), up(bFront)])} fill={right} />
      <polygon points={pts([bFront, bLeft, up(bLeft), up(bFront)])} fill={left} />
    </>
  );
}

function RoomShell() {
  const topV = add(CENTER, RIGHT, 0);
  const rightV = add(CENTER, RIGHT, 2);
  const leftV = add(CENTER, LEFT, 2);
  const backTopLeft = { x: leftV.x, y: leftV.y - 25 };
  const backTopRight = { x: rightV.x, y: rightV.y - 25 };
  const topWallPeak = { x: topV.x, y: topV.y - 25 };

  return (
    <>
      <polygon points={pts([leftV, topV, rightV, CENTER])} fill="#e9dec4" />
      <polygon points={pts([leftV, topV, topWallPeak, backTopLeft])} fill="#ddcfae" />
      <polygon points={pts([topV, rightV, backTopRight, topWallPeak])} fill="#cebd97" />
    </>
  );
}

const ACCENT = "#ef7b57";
const ACCENT_TOP = "#f4a37f";
const ACCENT_DEEP = "#c85a37";
const INK = "#3a3632";
const INK_TOP = "#5b544c";
const INK_LIGHT = "#756e63";
const GOLD = "#f2a254";
const GOLD_TOP = "#f6bd80";
const GOLD_DEEP = "#c97e37";

function ReceptionIcon() {
  return (
    <>
      <IsoBox originR={-1.3} originL={-0.3} w={1.6} d={0.7} h={9} top={ACCENT_TOP} right={ACCENT} left={ACCENT_DEEP} />
      <IsoBox originR={-0.4} originL={-0.5} w={0.35} d={0.35} h={13} top={INK_TOP} right={INK} left={INK} />
    </>
  );
}
function MeetingRoomIcon() {
  return (
    <>
      <IsoBox originR={-0.9} originL={-0.9} w={1.8} d={1.8} h={5} top={GOLD_TOP} right={GOLD} left={GOLD_DEEP} />
      {[
        [-1.3, -1.3],
        [0.7, -1.3],
        [-1.3, 0.7],
        [0.7, 0.7],
      ].map(([r, l], i) => (
        <IsoBox key={i} originR={r} originL={l} w={0.3} d={0.3} h={4} top={INK_TOP} right={INK} left={INK} />
      ))}
    </>
  );
}
function OpenWorkstationIcon() {
  return (
    <>
      {[-1.4, -0.1, 1.2].map((r, i) => (
        <IsoBox key={i} originR={r} originL={-0.9} w={1} d={0.55} h={4.5} top={ACCENT_TOP} right={ACCENT} left={ACCENT_DEEP} />
      ))}
    </>
  );
}
function ClosedWorkstationIcon() {
  return (
    <>
      <IsoBox originR={-1} originL={-0.4} w={1.6} d={0.6} h={4.5} top={ACCENT_TOP} right={ACCENT} left={ACCENT_DEEP} />
      <IsoBox originR={-1} originL={-0.4} w={0.15} d={0.6} h={9} top={INK_LIGHT} right={INK_LIGHT} left={INK} />
      <IsoBox originR={0.6} originL={-0.4} w={0.15} d={0.6} h={9} top={INK_LIGHT} right={INK_LIGHT} left={INK} />
    </>
  );
}
function ExecutiveCabinIcon() {
  return (
    <>
      <IsoBox originR={-1.3} originL={-0.6} w={1.9} d={1.1} h={6} top={GOLD_TOP} right={GOLD} left={GOLD_DEEP} />
      <IsoBox originR={-0.5} originL={0.7} w={0.6} d={0.4} h={4} top={INK_TOP} right={INK} left={INK} />
      <IsoBox originR={1.3} originL={-1.2} w={0.4} d={0.4} h={5.5} top="#8bbf7a" right="#6fa25e" left="#57894a" />
    </>
  );
}
function StoreRoomIcon() {
  return (
    <>
      <IsoBox originR={-1.1} originL={-0.9} w={0.9} d={0.9} h={4} top={INK_LIGHT} right="#645d53" left={INK} />
      <IsoBox originR={-0.1} originL={-0.9} w={0.9} d={0.9} h={5.5} top={INK_LIGHT} right="#645d53" left={INK} />
      <IsoBox originR={-1.1} originL={0.1} w={0.9} d={0.9} h={3} top={INK_LIGHT} right="#645d53" left={INK} />
    </>
  );
}
function ServeRoomIcon() {
  return (
    <>
      <IsoBox originR={-1.4} originL={-0.4} w={1.7} d={0.7} h={7} top={ACCENT_TOP} right={ACCENT} left={ACCENT_DEEP} />
      <IsoBox originR={0.1} originL={-1} w={0.3} d={0.3} h={3} top={GOLD_TOP} right={GOLD} left={GOLD_DEEP} />
    </>
  );
}
function PrayerRoomIcon() {
  return (
    <>
      <IsoBox originR={-0.5} originL={-0.9} w={0.9} d={1.7} h={0.6} top={GOLD_TOP} right={GOLD} left={GOLD_DEEP} />
      <IsoBox originR={-0.15} originL={0.1} w={0.2} d={0.5} h={10} top="#efe6d3" right="#e3d7ba" left="#d3c39e" />
    </>
  );
}
function PantryIcon() {
  return (
    <>
      <IsoBox originR={-1.1} originL={-0.9} w={0.7} d={0.55} h={12} top="#e7e2d8" right="#cfc9bc" left="#b6afa0" />
      <IsoBox originR={-0.2} originL={-0.9} w={1.1} d={0.55} h={5} top={ACCENT_TOP} right={ACCENT} left={ACCENT_DEEP} />
    </>
  );
}
function WashroomIcon() {
  return (
    <>
      <IsoBox originR={-0.8} originL={-0.5} w={1.1} d={0.6} h={3} top="#e7e2d8" right="#cfc9bc" left="#b6afa0" />
      <IsoBox originR={-0.55} originL={-0.25} w={0.6} d={0.15} h={0.8} top="#cfe6ee" right="#a9cfdb" left="#8fb8c6" />
      <IsoBox originR={-0.5} originL={0.9} w={0.5} d={0.15} h={7} top="#dcecef" right="#bcd8dd" left="#a3c3c8" />
    </>
  );
}

const ICONS: Record<string, () => ReactElement> = {
  reception: ReceptionIcon,
  meetingRoom: MeetingRoomIcon,
  openWorkstation: OpenWorkstationIcon,
  closedWorkstation: ClosedWorkstationIcon,
  executiveCabin: ExecutiveCabinIcon,
  storeRoom: StoreRoomIcon,
  serveRoom: ServeRoomIcon,
  prayerRoom: PrayerRoomIcon,
  pantry: PantryIcon,
  washroom: WashroomIcon,
};

export default function SpaceIcon({ spaceKey, className }: { spaceKey: string; className?: string }) {
  const Furniture = ICONS[spaceKey];
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <RoomShell />
      {Furniture && <Furniture />}
    </svg>
  );
}
