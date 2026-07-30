import {
  DEFAULT_COLOR,
  DEFAULT_DECOR,
  DEFAULT_FONT,
  FONTS,
  LINE_STYLES,
  SIDES,
  getFont,
  renderWord,
  type Decor,
  type Font,
  type LineStyle,
  type Side,
  type WordStyle,
} from "@/fonts";
import { emit } from "@/events";
import { decorOf, writeState, type UrlState } from "@/url-state";
import { BaseWindow } from "@/components/base-window";
import { terminalBodyTemplate } from "@/components/terminal-window.template";

export class TerminalWindow extends BaseWindow {
  windowTitle = "user@divtext: ~";

  /** Optional seed from the URL, applied on first render. */
  seed: UrlState | null = null;

  private input!: HTMLInputElement;
  private output!: HTMLElement;
  private tools!: HTMLElement;
  private colorInput!: HTMLInputElement;
  private lineStyleInput!: HTMLSelectElement;
  private currentWord = "";
  private font: Font = DEFAULT_FONT;
  private color = DEFAULT_COLOR;
  private decor: Decor = { ...DEFAULT_DECOR };

  protected renderBody(host: HTMLElement): void {
    host.innerHTML = terminalBodyTemplate();

    this.input = host.querySelector('[data-role="input"]') as HTMLInputElement;
    this.output = host.querySelector('[data-role="output"]') as HTMLElement;
    this.tools = host.querySelector('[data-role="tools"]') as HTMLElement;

    this.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Never steal focus from another control: a select would close its
      // dropdown the moment the prompt took focus.
      if (target.closest("button, a, label, input, select, textarea")) return;
      if (window.getSelection()?.toString()) return;
      this.input.focus();
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.render(text);
      this.input.value = "";
    });

    this.onAction("view-code", () => {
      if (this.currentWord) {
        emit(this, "wm:code", {
          word: this.currentWord,
          fontId: this.font.id,
          color: this.color,
          decor: { ...this.decor },
        });
      }
    });

    this.colorInput = host.querySelector('[data-role="color"]') as HTMLInputElement;
    this.colorInput.addEventListener("input", () => {
      this.color = this.colorInput.value;
      this.redraw();
    });

    this.buildFontPicker(host.querySelector('[data-role="fonts"]') as HTMLElement);
    this.buildDecorControls(host);

    if (this.seed) this.applySeed(this.seed);
  }

  private applySeed(seed: UrlState): void {
    this.font = getFont(seed.fontId);
    this.color = seed.color;
    this.colorInput.value = seed.color;
    this.decor = decorOf(seed);
    this.lineStyleInput.value = this.decor.lineStyle;
    this.highlightFont();
    this.highlightDecor();
    this.render(seed.word);
  }

  private get wordStyle(): WordStyle {
    return { font: this.font, color: this.color, decor: this.decor };
  }

  private syncUrl(): void {
    if (!this.currentWord) return;
    writeState({
      word: this.currentWord,
      fontId: this.font.id,
      color: this.color,
      ...this.decor,
    });
  }

  /** Repaint the current word after a style change (no-op before one exists). */
  private redraw(animate = false): void {
    if (!this.currentWord) return;
    this.output.replaceChildren(renderWord(this.currentWord, this.wordStyle));
    if (animate) this.animateCells();
    this.syncUrl();
  }

  private buildDecorControls(host: HTMLElement): void {
    // One border toggle per side: any combination, up to a full box.
    const sideRow = host.querySelector('[data-role="decor"]') as HTMLElement;
    for (const side of SIDES) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.decor = side;
      button.title = `Border ${side}`;
      button.textContent = side[0].toUpperCase() + side.slice(1);
      button.className =
        "px-3 py-1 cursor-pointer border-white/10 [&:not(:first-child)]:border-l";
      button.addEventListener("click", () => {
        this.decor = { ...this.decor, [side]: !this.decor[side] };
        this.highlightDecor();
        this.redraw();
      });
      sideRow.appendChild(button);
    }

    this.lineStyleInput = host.querySelector('[data-role="line-style"]') as HTMLSelectElement;
    for (const style of LINE_STYLES) {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = style;
      this.lineStyleInput.appendChild(option);
    }
    this.lineStyleInput.value = this.decor.lineStyle;
    this.lineStyleInput.addEventListener("change", () => {
      this.decor = { ...this.decor, lineStyle: this.lineStyleInput.value as LineStyle };
      this.redraw();
    });

    this.highlightDecor();
  }

  private highlightDecor(): void {
    for (const button of this.querySelectorAll<HTMLElement>("[data-decor]")) {
      const active = this.decor[button.dataset.decor as Side];
      button.classList.toggle("bg-primary", active);
      button.classList.toggle("text-black", active);
      button.classList.toggle("text-muted", !active);
    }
  }

  private buildFontPicker(host: HTMLElement): void {
    if (FONTS.length < 2) {
      host.classList.add("hidden"); // no point showing a one-option picker
      return;
    }
    for (const font of FONTS) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.font = font.id;
      button.textContent = font.label;
      button.className =
        "px-3 py-1 cursor-pointer border-white/10 [&:not(:first-child)]:border-l";
      button.addEventListener("click", () => this.setFont(font));
      host.appendChild(button);
    }
    this.highlightFont();
  }

  private setFont(font: Font): void {
    if (this.font === font) return;
    this.font = font;
    this.highlightFont();
    this.redraw(true);
  }

  private highlightFont(): void {
    for (const button of this.querySelectorAll<HTMLElement>("[data-font]")) {
      const active = button.dataset.font === this.font.id;
      button.classList.toggle("bg-primary", active);
      button.classList.toggle("text-black", active);
      button.classList.toggle("text-muted", !active);
    }
  }

  override focusPrompt(): void {
    this.input.focus();
  }

  // Short label for the taskbar — the typed word, without the shell prefix.
  override get taskbarTitle(): string {
    return this.currentWord || "~";
  }

  private render(text: string): void {
    this.currentWord = text;
    this.setTitle(`user@divtext: ~/${text}`);
    this.collapseIntro();
    this.tools.classList.remove("hidden");
    this.redraw(true);
  }

  // Stagger a "draw" animation across every cell so the word builds up.
  private animateCells(): void {
    let i = 0;
    for (const cell of this.output.querySelectorAll<HTMLElement>("div div")) {
      if (cell.childElementCount > 0) continue; // only leaf cells
      cell.style.animationDelay = `${i++ * 6}ms`;
      cell.classList.add("divtext-draw");
    }
  }

  // Smoothly collapse the intro block the first time a word is rendered.
  private collapseIntro(): void {
    const intro = this.querySelector<HTMLElement>('[data-role="intro"]');
    if (!intro || intro.classList.contains("hidden")) return;
    intro.style.overflow = "hidden";
    intro.style.maxHeight = `${intro.scrollHeight}px`;
    requestAnimationFrame(() => {
      intro.style.transition = "max-height 300ms ease, opacity 300ms ease, margin 300ms ease";
      intro.style.maxHeight = "0";
      intro.style.opacity = "0";
      intro.style.marginBottom = "0";
    });
    intro.addEventListener("transitionend", () => intro.classList.add("hidden"), {
      once: true,
    });
  }
}

if (!customElements.get("terminal-window")) {
  customElements.define("terminal-window", TerminalWindow);
}
