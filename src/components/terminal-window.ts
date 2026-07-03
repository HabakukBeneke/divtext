import { DEFAULT_COLOR, DEFAULT_FONT, FONTS, getFont, renderWord, type Font } from "@/fonts";
import { emit } from "@/events";
import { writeState, type UrlState } from "@/url-state";
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
  private currentWord = "";
  private font: Font = DEFAULT_FONT;
  private color = DEFAULT_COLOR;

  protected renderBody(host: HTMLElement): void {
    host.innerHTML = terminalBodyTemplate();

    this.input = host.querySelector('[data-role="input"]') as HTMLInputElement;
    this.output = host.querySelector('[data-role="output"]') as HTMLElement;
    this.tools = host.querySelector('[data-role="tools"]') as HTMLElement;

    this.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a")) return;
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
        emit(document, "wm:code", {
          word: this.currentWord,
          fontId: this.font.id,
          color: this.color,
        });
      }
    });

    this.colorInput = host.querySelector('[data-role="color"]') as HTMLInputElement;
    this.colorInput.addEventListener("input", () => this.setColor(this.colorInput.value));

    this.buildFontPicker(host.querySelector('[data-role="fonts"]') as HTMLElement);

    if (this.seed) this.applySeed(this.seed);
  }

  private applySeed(seed: UrlState): void {
    this.font = getFont(seed.fontId);
    this.color = seed.color;
    this.colorInput.value = seed.color;
    this.highlightFont();
    this.render(seed.word);
  }

  private syncUrl(): void {
    if (!this.currentWord) return;
    writeState({ word: this.currentWord, fontId: this.font.id, color: this.color });
  }

  private setColor(color: string): void {
    this.color = color;
    if (this.currentWord) {
      this.output.replaceChildren(renderWord(this.currentWord, this.font, this.color));
      this.syncUrl();
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
    if (this.currentWord) {
      this.output.replaceChildren(renderWord(this.currentWord, this.font, this.color));
      this.animateCells();
      this.syncUrl();
    }
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
    this.output.replaceChildren(renderWord(text, this.font, this.color));
    this.animateCells();
    this.tools.classList.remove("hidden");
    this.syncUrl();
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
