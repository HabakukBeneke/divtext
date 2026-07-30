import type { Decor } from "@/fonts";

export interface MinimizedWindow {
  id: number;
  title: string;
}

export interface WindowEventMap {
  "wm:focus": undefined;
  "wm:minimize": undefined;
  "wm:close": undefined;
  "wm:spawn": undefined;
  "wm:code": { word: string; fontId: string; color: string; decor: Decor };
  "wm:restore": { id: number };
  "wm:changed": MinimizedWindow[];
}

export function emit<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  detail?: WindowEventMap[K],
): void {
  target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
}

export function on<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  handler: (event: CustomEvent<WindowEventMap[K]>) => void,
): () => void {
  const listener = (event: Event) => handler(event as CustomEvent<WindowEventMap[K]>);
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
