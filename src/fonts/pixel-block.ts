import { createGridFont } from "@/fonts/grid-font";

/** Same pixel glyphs as Pixel, but the cells touch: solid, blocky strokes. */
export const pixelBlockFont = createGridFont({
  id: "pixel-block",
  label: "Pixel Block",
  block: "divtext-pixel-block",
  gap: 0,
  letterGap: 8,
  radius: 0,
});
