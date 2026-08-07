import { cssRule } from "@/fonts/format";
import { GLYPHS, GLYPH_COLS as COLS, GLYPH_ROWS as ROWS } from "@/fonts/glyphs";
import { inlineStyle, wordDecls as boxDecls } from "@/fonts/word-box";
import type { Font, RenderOptions } from "@/fonts/types";

const CELL = 8; // px per cell
const SPACE = 24; // px width of a blank space

/** What separates one grid font from another: spacing and cell shape. */
export interface GridFontSpec {
  /** Stable id used in URLs / storage. */
  id: string;
  /** Human-readable name for pickers. */
  label: string;
  /** CSS block name, root of the BEM class names. */
  block: string;
  /** px between cells; 0 welds the cells into solid strokes. */
  gap: number;
  /** px between letters. */
  letterGap: number;
  /** px corner radius of a lit cell. */
  radius: number;
}

// Minimal convention: only two classes; everything else is structural.
const MIN_ON = "on";

const EMPTY_ROWS = Array.from({ length: ROWS }, () => ".".repeat(COLS));

/** Build a grid font (fixed glyph matrix) from its spacing spec. */
export function createGridFont(spec: GridFontSpec): Font {
  const { block, gap, letterGap, radius } = spec;
  // BEM class names.
  const BEM = {
    word: block,
    letter: `${block}__letter`,
    cell: `${block}__cell`,
    cellOn: `${block}__cell--on`,
    space: `${block}__space`,
  };

  const letterDecls: Record<string, string> = {
    display: "grid",
    "grid-template-columns": `repeat(${COLS}, ${CELL}px)`,
    ...(gap > 0 ? { gap: `${gap}px` } : {}),
    flex: "0 0 auto",
  };
  const letterInline =
    `display:grid;grid-template-columns:repeat(${COLS},${CELL}px);` +
    (gap > 0 ? `gap:${gap}px;` : "") +
    "flex:0 0 auto";

  const onDecls = (color: string): Record<string, string> => ({
    background: color,
    ...(radius > 0 ? { "border-radius": `${radius}px` } : {}),
  });
  const onInline = (color: string): string =>
    `background:${color}` + (radius > 0 ? `;border-radius:${radius}px` : "");

  // Container declarations, shared by both class conventions and inline mode.
  const wordDecls = (opts: RenderOptions): Record<string, string> =>
    boxDecls(opts, letterGap);

  // BEM: one class per role. Five classes, no structural coupling.
  function bemStylesheet(opts: RenderOptions): string {
    return [
      cssRule(`.${BEM.word}`, wordDecls(opts)),
      cssRule(`.${BEM.letter}`, letterDecls),
      cssRule(`.${BEM.cell}`, { width: `${CELL}px`, height: `${CELL}px` }),
      cssRule(`.${BEM.cellOn}`, onDecls(opts.color)),
      cssRule(`.${BEM.space}`, { width: `${SPACE}px`, flex: "0 0 auto" }),
    ].join("\n\n");
  }

  // Minimal: one container class + one modifier. Letters/cells matched by
  // structure; blank spaces are just empty letter grids (no extra class).
  function minimalStylesheet(opts: RenderOptions): string {
    return [
      cssRule(`.${block}`, wordDecls(opts)),
      cssRule(`.${block} > div`, letterDecls),
      cssRule(`.${block} > div > div`, { width: `${CELL}px`, height: `${CELL}px` }),
      cssRule(`.${block} > div > div.${MIN_ON}`, onDecls(opts.color)),
    ].join("\n\n");
  }

  function stylesheet(opts: RenderOptions): string {
    return opts.style === "minimal" ? minimalStylesheet(opts) : bemStylesheet(opts);
  }

  function makeCell(on: boolean, opts: RenderOptions): HTMLElement {
    const dot = document.createElement("div");
    if (opts.mode !== "css") {
      dot.style.cssText =
        `width:${CELL}px;height:${CELL}px` + (on ? `;${onInline(opts.color)}` : "");
    } else if (opts.style === "minimal") {
      if (on) dot.className = MIN_ON;
    } else {
      dot.className = on ? `${BEM.cell} ${BEM.cellOn}` : BEM.cell;
    }
    return dot;
  }

  function makeGlyph(rows: string[], opts: RenderOptions): HTMLElement {
    const letter = document.createElement("div");
    if (opts.mode !== "css") {
      letter.style.cssText = letterInline;
    } else if (opts.style === "bem") {
      letter.className = BEM.letter;
    }
    for (const row of rows) {
      for (const cell of row) {
        letter.appendChild(makeCell(cell === "#", opts));
      }
    }
    return letter;
  }

  function render(word: string, opts: RenderOptions): HTMLElement {
    const line = document.createElement("div");
    if (opts.mode !== "css") {
      line.style.cssText = inlineStyle(wordDecls(opts));
    } else {
      line.className = block; // same container class for both conventions
    }

    for (const char of word.toUpperCase()) {
      const glyph = GLYPHS[char];
      if (glyph) {
        line.appendChild(makeGlyph(glyph, opts));
      } else if (char === " ") {
        if (opts.mode === "css" && opts.style === "minimal") {
          // A blank is an empty letter grid, so no dedicated class is needed.
          line.appendChild(makeGlyph(EMPTY_ROWS, opts));
        } else {
          const space = document.createElement("div");
          if (opts.mode === "css") space.className = BEM.space;
          else space.style.cssText = `width:${SPACE}px;flex:0 0 auto`;
          line.appendChild(space);
        }
      }
    }
    return line;
  }

  return { id: spec.id, label: spec.label, render, stylesheet };
}
