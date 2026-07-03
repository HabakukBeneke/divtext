import { DEFAULT_COLOR, DEFAULT_FONT, getFont } from "@/fonts";

// Shareable snapshot of a rendered word, mirrored in the query string so a
// URL round-trips the terminal state (?w=word&f=fontId&c=rrggbb).
export interface UrlState {
  word: string;
  fontId: string;
  color: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Normalise an untrusted color to a safe #rrggbb, or fall back to default. */
function safeColor(raw: string | null): string {
  if (!raw) return DEFAULT_COLOR;
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  return HEX.test(hex) ? hex.toLowerCase() : DEFAULT_COLOR;
}

/** Read the current URL into a state, or null when no word is present. */
export function readState(): UrlState | null {
  const params = new URLSearchParams(location.search);
  const word = params.get("w")?.trim();
  if (!word) return null;
  return {
    word,
    fontId: getFont(params.get("f") ?? "").id, // getFont clamps to a known id
    color: safeColor(params.get("c")),
  };
}

/** Mirror a state into the query string without adding history entries. */
export function writeState(state: UrlState): void {
  const params = new URLSearchParams();
  params.set("w", state.word);
  if (state.fontId !== DEFAULT_FONT.id) params.set("f", state.fontId);
  if (state.color.toLowerCase() !== DEFAULT_COLOR) {
    params.set("c", state.color.replace(/^#/, ""));
  }
  history.replaceState(null, "", `${location.pathname}?${params}`);
}
