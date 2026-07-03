import { clamp } from "@/clamp";
import { emit, on } from "@/events";
import { readState } from "@/url-state";
import type { BaseWindow } from "@/components/base-window";
import type { TerminalWindow } from "@/components/terminal-window";
import type { CodeWindow } from "@/components/code-window";

const WINDOW_WIDTH = 720;
const CODE_WIDTH = 560;
const CASCADE = 28;

export class WindowDesktop extends HTMLElement {
  private idSeq = 0;
  private zSeq = 10;
  private spawnCount = 0;
  private cleanups: Array<() => void> = [];

  connectedCallback(): void {
    this.cleanups.push(
      on(this, "wm:focus", (e) => this.raise(e.target as BaseWindow)),
      on(this, "wm:minimize", () => this.notifyChanged()),
      on(this, "wm:close", (e) => this.close(e.target as BaseWindow)),
      on(document, "wm:spawn", () => this.spawn()),
      on(document, "wm:code", (e) =>
        this.spawnCode(e.detail.word, e.detail.fontId, e.detail.color),
      ),
      on(document, "wm:restore", (e) => this.restore(e.detail.id)),
    );
    this.spawn();
  }

  disconnectedCallback(): void {
    for (const off of this.cleanups) off();
    this.cleanups = [];
  }

  private spawn(): void {
    const win = document.createElement("terminal-window") as TerminalWindow;
    win.windowId = ++this.idSeq;
    if (this.idSeq === 1) win.seed = readState();

    this.placeCascaded(win, WINDOW_WIDTH);
    win.focusPrompt();
  }

  private spawnCode(word: string, fontId: string, color: string): void {
    const win = document.createElement("code-window") as CodeWindow;
    win.windowId = ++this.idSeq;
    win.word = word;
    win.fontId = fontId;
    win.color = color;

    this.placeCascaded(win, CODE_WIDTH);
  }

  /**
   * Append a window and lay it out centred, nudged by a cascading offset so
   * successive windows do not stack exactly on top of each other.
   */
  private placeCascaded(win: BaseWindow, preferredWidth: number): void {
    const width = Math.min(preferredWidth, this.clientWidth - 32);
    const baseLeft = Math.max(20, (this.clientWidth - width) / 2);
    const offset = (this.spawnCount++ % 8) * CASCADE;

    this.appendChild(win);
    win.place(
      clamp(baseLeft + offset, 8, Math.max(8, this.clientWidth - width - 8)),
      clamp(56 + offset, 8, Math.max(8, this.clientHeight - 120)),
      width,
    );
    this.raise(win);
  }

  private raise(win: BaseWindow): void {
    win.raise(++this.zSeq);
  }

  private close(win: BaseWindow): void {
    win.remove();
    this.notifyChanged();
  }

  private restore(id: number): void {
    const win = this.windows().find((w) => w.windowId === id);
    if (!win) return;
    win.show();
    this.raise(win);
    this.notifyChanged();
  }

  private windows(): BaseWindow[] {
    return [...this.querySelectorAll<BaseWindow>("terminal-window, code-window")];
  }

  private notifyChanged(): void {
    const minimized = this.windows()
      .filter((w) => w.isMinimized)
      .map((w) => ({ id: w.windowId, title: w.taskbarTitle }));
    emit(document, "wm:changed", minimized);
  }
}

if (!customElements.get("window-desktop")) {
  customElements.define("window-desktop", WindowDesktop);
}
