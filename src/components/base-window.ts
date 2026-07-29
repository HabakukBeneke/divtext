import { clamp } from "@/clamp";
import { emit } from "@/events";
import { ICON_COLLAPSE, ICON_EXPAND } from "@/icons";

type WindowState = "open" | "minimized" | "maximized";

interface Geometry {
  left: number;
  top: number;
  width: number;
  height: string;
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 140;

// Edges first, corners last: later siblings win the overlap at the corners.
const HANDLES: Array<[dir: string, classes: string]> = [
  ["n", "top-0 left-0 right-0 h-[6px] cursor-ns-resize"],
  ["s", "bottom-0 left-0 right-0 h-[6px] cursor-ns-resize"],
  ["w", "left-0 top-0 bottom-0 w-[6px] cursor-ew-resize"],
  ["e", "right-0 top-0 bottom-0 w-[6px] cursor-ew-resize"],
  ["nw", "top-0 left-0 w-3 h-3 cursor-nwse-resize"],
  ["ne", "top-0 right-0 w-3 h-3 cursor-nesw-resize"],
  ["sw", "bottom-0 left-0 w-3 h-3 cursor-nesw-resize"],
  ["se", "bottom-0 right-0 w-3 h-3 cursor-nwse-resize"],
];

const RESIZE_HANDLES = HANDLES.map(
  ([dir, classes]) => `<div data-resize="${dir}" class="absolute z-20 ${classes}"></div>`,
).join("");

// Shared window chrome: traffic-light bar, draggable title, min/max/close.
const BAR = `
  <div data-role="bar" class="group/bar flex items-center gap-2 px-[14px] py-[11px] bg-bar border-b border-black/30 cursor-grab active:cursor-grabbing select-none">
    <button data-action="close" type="button" title="Close" aria-label="Close"
      class="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#ff5f56] text-[11px] font-bold leading-none text-black/70 cursor-pointer">
      <span class="opacity-0 group-hover/bar:opacity-100 transition-opacity">×</span>
    </button>
    <button data-action="minimize" type="button" title="Minimize" aria-label="Minimize"
      class="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#ffbd2e] text-[11px] font-bold leading-none text-black/70 cursor-pointer">
      <span class="opacity-0 group-hover/bar:opacity-100 transition-opacity">−</span>
    </button>
    <button data-action="maximize" type="button" title="Maximize" aria-label="Maximize"
      class="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#27c93f] text-[11px] font-bold leading-none text-black/70 cursor-pointer">
      <span data-role="maximize-glyph" class="flex opacity-0 group-hover/bar:opacity-100 transition-opacity">${ICON_EXPAND}</span>
    </button>
    <svg class="ml-2 block text-muted shrink-0" width="20" height="20" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="44" height="36" rx="4" stroke="currentColor" stroke-width="3" fill="none"/>
      <line x1="10" y1="24" x2="54" y2="24" stroke="currentColor" stroke-width="3"/>
      <path d="M17 32 L22 36 L17 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="26" y1="40" x2="36" y2="40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
    <span data-role="title" class="text-[13px] text-muted truncate"></span>
  </div>
`;

/** Base window: draggable, minimisable/maximisable chrome + WM event wiring. */
export abstract class BaseWindow extends HTMLElement {
  windowId = 0;
  windowTitle = "window";

  protected state: WindowState = "open";
  protected titleEl!: HTMLElement;
  private restore: Geometry | null = null;
  private built = false;

  connectedCallback(): void {
    if (this.built) return;
    this.built = true;

    this.className =
      "window absolute flex flex-col pointer-events-auto bg-term border border-white/[0.06] rounded-[10px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]";
    this.innerHTML = BAR;
    const body = document.createElement("div");
    // Own the leftover height so a resized/maximised window scrolls its body.
    body.className = "flex-1 min-h-0 overflow-auto";
    this.appendChild(body);
    this.insertAdjacentHTML("beforeend", RESIZE_HANDLES);

    const bar = this.querySelector('[data-role="bar"]') as HTMLElement;
    this.titleEl = this.querySelector('[data-role="title"]') as HTMLElement;
    this.titleEl.textContent = this.windowTitle;

    this.addEventListener("pointerdown", () => emit(this, "wm:focus"), true);
    this.enableDrag(bar);
    this.enableResize();

    this.onAction("close", () => emit(this, "wm:close"));
    this.onAction("minimize", () => {
      this.hide();
      emit(this, "wm:minimize");
    });
    this.onAction("maximize", () => this.toggleMaximize());

    this.renderBody(body);
  }

  /** Subclasses fill the window body inside the given host element. */
  protected abstract renderBody(host: HTMLElement): void;

  get isMinimized(): boolean {
    return this.state === "minimized";
  }

  /** Short label for the taskbar. Subclasses may override. */
  get taskbarTitle(): string {
    return this.windowTitle;
  }

  protected setTitle(title: string): void {
    this.windowTitle = title;
    this.titleEl.textContent = title;
  }

  place(left: number, top: number, width: number, height?: number): void {
    this.style.left = `${left}px`;
    this.style.top = `${top}px`;
    this.style.width = `${width}px`;
    if (height !== undefined) this.style.height = `${height}px`;
  }

  raise(zIndex: number): void {
    this.style.zIndex = String(zIndex);
  }

  /** Called after spawn/restore; subclasses may focus an inner control. */
  focusPrompt(): void {
    this.focus();
  }

  hide(): void {
    this.state = "minimized";
    this.classList.add("hidden");
  }

  show(): void {
    this.state = this.restore ? "maximized" : "open";
    if (this.state === "maximized") this.applyMaximized();
    this.classList.remove("hidden");
  }

  protected onAction(name: string, handler: (el: HTMLElement) => void): void {
    const el = this.querySelector(`[data-action="${name}"]`) as HTMLElement;
    el.addEventListener("click", () => handler(el));
  }

  private get area(): HTMLElement {
    return this.closest("window-desktop") as HTMLElement;
  }

  private toggleMaximize(): void {
    if (this.state === "maximized") {
      const previous = this.restore;
      this.restore = null;
      this.state = "open";
      if (previous) {
        this.style.left = `${previous.left}px`;
        this.style.top = `${previous.top}px`;
        this.style.width = `${previous.width}px`;
        this.style.height = previous.height;
      }
      this.setMaximizeGlyph();
    } else {
      this.restore = {
        left: this.offsetLeft,
        top: this.offsetTop,
        width: this.offsetWidth,
        height: this.style.height,
      };
      this.state = "maximized";
      this.applyMaximized();
    }
  }

  private applyMaximized(): void {
    const { clientWidth, clientHeight } = this.area;
    this.style.left = "8px";
    this.style.top = "8px";
    this.style.width = `${clientWidth - 16}px`;
    this.style.height = `${clientHeight - 16}px`;
    this.setMaximizeGlyph();
  }

  private setMaximizeGlyph(): void {
    const glyph = this.querySelector('[data-role="maximize-glyph"]');
    const button = this.querySelector('[data-action="maximize"]') as HTMLElement | null;
    const maximized = this.state === "maximized";
    if (glyph) glyph.innerHTML = maximized ? ICON_COLLAPSE : ICON_EXPAND;
    if (button) button.title = maximized ? "Restore" : "Maximize";
  }

  /** Drag any edge/corner handle to grow or shrink the window in place. */
  private enableResize(): void {
    for (const handle of this.querySelectorAll<HTMLElement>("[data-resize]")) {
      handle.addEventListener("pointerdown", (e) => {
        if (this.state === "maximized") return;
        e.preventDefault();
        e.stopPropagation();
        emit(this, "wm:focus");

        const dir = handle.dataset.resize as string;
        const startX = e.clientX;
        const startY = e.clientY;
        const origin = {
          left: this.offsetLeft,
          top: this.offsetTop,
          width: this.offsetWidth,
          height: this.offsetHeight,
        };
        const { clientWidth, clientHeight } = this.area;

        const move = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (dir.includes("e")) {
            this.style.width = `${clamp(origin.width + dx, MIN_WIDTH, Math.max(MIN_WIDTH, clientWidth - origin.left))}px`;
          }
          if (dir.includes("s")) {
            this.style.height = `${clamp(origin.height + dy, MIN_HEIGHT, Math.max(MIN_HEIGHT, clientHeight - origin.top))}px`;
          }
          if (dir.includes("w")) {
            const width = clamp(origin.width - dx, MIN_WIDTH, origin.left + origin.width);
            this.style.width = `${width}px`;
            this.style.left = `${origin.left + origin.width - width}px`;
          }
          if (dir.includes("n")) {
            const height = clamp(origin.height - dy, MIN_HEIGHT, origin.top + origin.height);
            this.style.height = `${height}px`;
            this.style.top = `${origin.top + origin.height - height}px`;
          }
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
    }
  }

  private enableDrag(bar: HTMLElement): void {
    bar.addEventListener("pointerdown", (e) => {
      if (this.state === "maximized") return;
      if ((e.target as HTMLElement).closest("[data-action]")) return;
      e.preventDefault();
      emit(this, "wm:focus");

      const startX = e.clientX;
      const startY = e.clientY;
      const originLeft = this.offsetLeft;
      const originTop = this.offsetTop;
      const maxLeft = this.area.clientWidth - this.offsetWidth;
      const maxTop = this.area.clientHeight - 40;

      const move = (ev: PointerEvent) => {
        this.style.left = `${clamp(originLeft + (ev.clientX - startX), 0, Math.max(0, maxLeft))}px`;
        this.style.top = `${clamp(originTop + (ev.clientY - startY), 0, Math.max(0, maxTop))}px`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }
}
