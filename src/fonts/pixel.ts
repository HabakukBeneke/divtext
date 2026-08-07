import { createGridFont } from "@/fonts/grid-font";

/** Separated cells: every dot reads as its own pixel. */
export const pixelFont = createGridFont({
  id: "pixel",
  label: "Pixel",
  block: "divtext",
  gap: 2,
  letterGap: 10,
  radius: 1,
});
