import type { Side } from "@/fonts/types";

// Geometric glyphs: each character is a handful of boxes laid out inside its
// own letter box. A part is either a filled bar (optionally rotated, which is
// how diagonals are drawn) or a ring — a border-only box whose corner radii
// turn it into an arc. Coordinates are px; only the width varies per glyph, so
// round caps stay round and M/W get the room they need.
export const GEO_H = 68; // cap height, shared by every glyph
export const GEO_T = 10; // stroke thickness
export const GEO_SPACE = 26; // width of a blank
const T = GEO_T;
const H = GEO_H;

export interface GeoPart {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation in degrees around the part center (diagonals). */
  rot?: number;
  /** CSS border-radius value (any shorthand). */
  radius?: string;
  /** Present on rings: only these sides get a stroke, the box stays hollow. */
  sides?: Side[];
}

export interface GeoGlyph {
  /** Advance width of this letter box. */
  w: number;
  parts: GeoPart[];
}

/** A filled bar. */
function bar(x: number, y: number, w: number, h: number, radius?: string): GeoPart {
  return radius ? { x, y, w, h, radius } : { x, y, w, h };
}

/** A hollow box stroked on `sides` only — the arc primitive. */
function ring(
  x: number,
  y: number,
  w: number,
  h: number,
  sides: Side[],
  radius?: string,
): GeoPart {
  return radius ? { x, y, w, h, sides, radius } : { x, y, w, h, sides };
}

/** A bar of thickness T laid along the segment (x1,y1)-(x2,y2). */
function diag(x1: number, y1: number, x2: number, y2: number): GeoPart {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Place the unrotated bar centered on the segment, then spin it into place.
  return {
    x: round((x1 + x2) / 2 - len / 2),
    y: round((y1 + y2) / 2 - T / 2),
    w: round(len),
    h: T,
    rot: round(rot),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function glyph(w: number, ...parts: GeoPart[]): GeoGlyph {
  return { w, parts };
}

const ALL: Side[] = ["top", "right", "bottom", "left"];
const OVAL = "50%";

// Recurring pieces: the left stem and the right-hand bowl of B/D/P/R.
const stem = (x = 0, y = 0, h = H): GeoPart => bar(x, y, T, h);
const bowl = (y: number, h: number, w: number): GeoPart =>
  ring(T - 2, y, w - T + 2, h, ["top", "right", "bottom"], `0 ${h / 2}px ${h / 2}px 0`);

// Round letters are drawn on a near-circular body so O never reads as a 0.
const ROUND = 62;

// A wave: up, down, up. Used on its own and as the tilde of Ñ.
const tilde = (x: number, y: number): GeoPart[] => [
  diag(x, y + 12, x + 10, y + 2),
  diag(x + 10, y + 2, x + 22, y + 14),
  diag(x + 22, y + 14, x + 32, y + 4),
];

export const GEO_GLYPHS: Record<string, GeoGlyph> = {
  A: glyph(58, diag(3, H, 29, 0), diag(55, H, 29, 0), bar(12, 42, 34, T)),
  B: glyph(52, stem(), bowl(0, 32, 52), bowl(36, 32, 52)),
  C: glyph(ROUND, ring(0, 0, ROUND, H, ["top", "left", "bottom"], OVAL)),
  D: glyph(56, stem(), bowl(0, H, 56)),
  E: glyph(46, stem(), bar(0, 0, 46, T), bar(0, 29, 40, T), bar(0, H - T, 46, T)),
  F: glyph(46, stem(), bar(0, 0, 46, T), bar(0, 29, 40, T)),
  G: glyph(
    ROUND,
    ring(0, 0, ROUND, H, ["top", "left", "bottom"], OVAL),
    bar(36, 34, ROUND - 36, T),
    bar(ROUND - T, 34, T, 24),
  ),
  H: glyph(54, stem(), stem(44), bar(0, 29, 54, T)),
  I: glyph(T, stem()),
  J: glyph(42, bar(32, 0, T, 44), ring(0, 34, 42, 34, ["left", "bottom"], "0 0 0 21px")),
  K: glyph(52, stem(), diag(9, 36, 52, 1), diag(9, 32, 52, 67)),
  L: glyph(44, stem(), bar(0, H - T, 44, T)),
  // The inner strokes run a couple of px past the vertex so it closes clean.
  M: glyph(64, stem(), stem(54), diag(5, 2, 32, 53), diag(59, 2, 32, 53)),
  N: glyph(56, stem(), stem(46), diag(5, 1, 51, 67)),
  // The tilde rides above a shortened N, so the glyph keeps the cap height.
  Ñ: glyph(
    56,
    bar(0, 20, T, 48),
    bar(46, 20, T, 48),
    diag(5, 21, 51, 67),
    ...tilde(14, 0),
  ),
  O: glyph(ROUND, ring(0, 0, ROUND, H, ALL, OVAL)),
  P: glyph(52, stem(), bowl(0, 38, 52)),
  Q: glyph(ROUND, ring(0, 0, ROUND, H, ALL, OVAL), diag(38, 44, ROUND, H + 6)),
  R: glyph(52, stem(), bowl(0, 38, 52), diag(22, 36, 50, H)),
  // Two three-quarter arcs facing opposite ways; they meet at the waist.
  S: glyph(
    52,
    ring(0, 0, 52, 38, ["top", "left"], OVAL),
    ring(0, 30, 52, 38, ["bottom", "right"], OVAL),
  ),
  T: glyph(52, bar(0, 0, 52, T), bar(21, 0, T, H)),
  U: glyph(54, ring(0, 0, 54, H, ["left", "bottom", "right"], "0 0 27px 27px")),
  V: glyph(56, diag(3, 0, 28, H), diag(53, 0, 28, H)),
  W: glyph(
    78,
    diag(2, 0, 16, H),
    diag(16, 66, 39, 18),
    diag(39, 18, 62, 66),
    diag(76, 0, 62, H),
  ),
  X: glyph(54, diag(2, 2, 52, 66), diag(52, 2, 2, 66)),
  Y: glyph(54, diag(2, 0, 27, 34), diag(52, 0, 27, 34), bar(22, 30, T, 38)),
  Z: glyph(52, bar(0, 0, 52, T), bar(0, H - T, 52, T), diag(47, 9, 5, 59)),

  "0": glyph(52, ring(0, 0, 52, H, ALL, OVAL), diag(8, 58, 44, 10)),
  "1": glyph(30, bar(18, 0, T, H), diag(2, 15, 20, 1)),
  "2": glyph(
    50,
    ring(0, 0, 50, 38, ["top", "right"], "25px 25px 0 0"),
    diag(45, 28, 6, 60),
    bar(0, H - T, 50, T),
  ),
  "3": glyph(
    50,
    ring(4, 0, 46, 36, ["top", "right", "bottom"], "0 18px 18px 0"),
    ring(4, 32, 46, 36, ["top", "right", "bottom"], "0 18px 18px 0"),
  ),
  "4": glyph(52, diag(30, 0, 4, 44), bar(0, 40, 52, T), bar(32, 0, T, H)),
  "5": glyph(
    50,
    bar(0, 0, 46, T),
    stem(0, 0, 32),
    ring(0, 26, 50, 42, ["top", "right", "bottom"], "0 21px 21px 0"),
    bar(0, H - T, 18, T),
  ),
  "6": glyph(
    52,
    ring(0, 0, 52, H, ["top", "left", "bottom"], OVAL),
    ring(0, 32, 52, 36, ["top", "right", "bottom"], "0 18px 18px 0"),
  ),
  "7": glyph(50, bar(0, 0, 50, T), diag(45, 8, 18, H)),
  "8": glyph(52, ring(0, 0, 52, 36, ALL, OVAL), ring(0, 32, 52, 36, ALL, OVAL)),
  "9": glyph(52, ring(0, 0, 52, 36, ALL, OVAL), bar(42, 18, T, 50)),

  ".": glyph(T, bar(0, H - T, T, T)),
  ",": glyph(14, bar(0, H - T, T, T), diag(6, 62, 0, 76)),
  "!": glyph(T, bar(0, 0, T, 44), bar(0, H - T, T, T)),
  "?": glyph(
    46,
    ring(0, 0, 46, 34, ["top", "right"], "23px 23px 0 0"),
    diag(41, 24, 23, 38),
    bar(18, 34, T, 14),
    bar(18, H - T, T, T),
  ),
  "-": glyph(34, bar(0, 29, 34, T)),
  "_": glyph(44, bar(0, H - T, 44, T)),
  ":": glyph(T, bar(0, 18, T, T), bar(0, 48, T, T)),
  ";": glyph(14, bar(0, 18, T, T), bar(0, 48, T, T), diag(6, 52, 0, 66)),
  "'": glyph(T, bar(0, 0, T, 18)),
  '"': glyph(28, bar(0, 0, T, 18), bar(18, 0, T, 18)),
  "+": glyph(38, bar(0, 29, 38, T), bar(14, 15, T, 38)),
  "=": glyph(38, bar(0, 20, 38, T), bar(0, 40, 38, T)),
  "*": glyph(34, bar(12, 14, T, 34), diag(1, 22, 33, 40), diag(33, 22, 1, 40)),
  "/": glyph(34, diag(30, 0, 4, H)),
  "\\": glyph(34, diag(4, 0, 30, H)),
  "(": glyph(24, ring(0, 0, 44, H, ["left"], OVAL)),
  ")": glyph(24, ring(-20, 0, 44, H, ["right"], OVAL)),
  "[": glyph(26, ring(0, 0, 26, H, ["top", "left", "bottom"])),
  "]": glyph(26, ring(0, 0, 26, H, ["top", "right", "bottom"])),
  "{": glyph(30, ring(6, 0, 40, H, ["left"], "20px 0 0 20px"), bar(0, 29, 12, T)),
  "}": glyph(30, ring(-16, 0, 40, H, ["right"], "0 20px 20px 0"), bar(18, 29, 12, T)),
  "|": glyph(T, bar(0, 0, T, H)),
  "<": glyph(36, diag(33, 6, 3, 34), diag(3, 34, 33, 62)),
  ">": glyph(36, diag(3, 6, 33, 34), diag(33, 34, 3, 62)),
  "#": glyph(48, bar(12, 2, T, 64), bar(30, 2, T, 64), bar(0, 18, 48, T), bar(0, 42, 48, T)),
  "^": glyph(38, diag(2, 26, 19, 4), diag(36, 26, 19, 4)),
  "~": glyph(34, ...tilde(1, 26)),
  "`": glyph(20, diag(2, 2, 18, 16)),
};
