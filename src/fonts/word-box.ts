import { SIDES } from "@/fonts/types";
import type { RenderOptions } from "@/fonts/types";

export const LINE = 4; // px thickness of the decoration border
export const LINE_GAP = 8; // px between the word and a decoration line

/**
 * Declarations for the word container: a wrapping row of letters plus the
 * optional decoration borders. Shared by every font so decor behaves the
 * same regardless of how the letters themselves are drawn.
 */
export function wordDecls(opts: RenderOptions, letterGap: number): Record<string, string> {
  const decor = opts.decor;
  const decls: Record<string, string> = {
    display: "flex",
    "align-items": "flex-start",
    gap: `${letterGap}px`,
    "flex-wrap": "wrap",
  };
  const sides = SIDES.filter((side) => decor[side]);
  if (sides.length === 0) return decls;

  // Shrink to the word so the lines stop at the last letter.
  decls.width = "max-content";
  decls["max-width"] = "100%";
  const stroke = `${LINE}px ${decor.lineStyle} ${opts.color}`;
  for (const side of sides) {
    decls[`border-${side}`] = stroke;
    decls[`padding-${side}`] = `${LINE_GAP}px`;
  }
  return decls;
}

/** Collapse declarations into a style attribute value. */
export function inlineStyle(decls: Record<string, string>): string {
  return Object.entries(decls)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(";");
}
