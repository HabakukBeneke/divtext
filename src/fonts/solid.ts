import { createGridFont } from "@/fonts/grid-font";

/** Same glyphs as Pixel, but the cells touch: solid, blocky strokes. */
export const solidFont = createGridFont({
  id: "solid",
  label: "Solid",
  block: "divtext-solid",
  gap: 0,
  letterGap: 8,
  radius: 0,
});
