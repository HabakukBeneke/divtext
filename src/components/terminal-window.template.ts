export function terminalBodyTemplate(): string {
  return `
    <div class="px-6 pt-[26px] pb-[30px] text-[15px] leading-[1.7]">
      <div data-role="intro">
        <p class="whitespace-pre-wrap break-words"><span class="text-secondary select-none">$</span> divtext --help</p>
        <p class="whitespace-pre-wrap break-words"><span class="text-primary font-bold">DivText</span> <span class="text-muted">v${__APP_VERSION__}</span></p>
        <p class="whitespace-pre-wrap break-words">Turn your text into a logo built from <span class="text-primary">&lt;div&gt;</span> elements.</p>
        <p class="whitespace-pre-wrap break-words text-muted">Type a word and watch it draw itself, cell by cell.</p>
        <p class="whitespace-pre-wrap break-words">&nbsp;</p>
        <p class="whitespace-pre-wrap break-words"><span class="text-secondary select-none">$</span> divtext --run</p>
      </div>

      <label class="flex items-center gap-2 mt-2 cursor-text whitespace-pre-wrap break-words">
        <span class="select-none shrink-0"><span class="text-primary font-bold">user@divtext</span><span class="text-fg">:</span><span class="text-secondary">~</span><span class="text-fg">$</span></span>
        <input type="text" data-role="input"
          class="flex-1 bg-transparent border-none outline-none text-fg font-[inherit] text-[inherit] caret-primary placeholder:text-muted"
          placeholder="type a word and press enter" autocomplete="off" spellcheck="false">
      </label>

      <div data-role="output" class="mt-[18px] min-h-[80px]"></div>

      <div data-role="tools" class="mt-4 hidden flex flex-wrap items-center gap-2">
        <div data-role="fonts" class="flex rounded-md overflow-hidden border border-white/10 text-[13px]"></div>
        <div data-role="decor" class="flex rounded-md overflow-hidden border border-white/10 text-[13px]"></div>
        <!-- Not a <label>: it would forward the click and close the dropdown. -->
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] text-muted border border-white/10">
          <span>Line</span>
          <select data-role="line-style" aria-label="Line style"
            class="bg-bar text-fg border-none outline-none text-[13px] cursor-pointer"></select>
        </div>
        <label class="flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] text-muted border border-white/10 cursor-pointer">
          Color
          <input data-role="color" type="color" value="#10b981"
            class="w-5 h-5 p-0 bg-transparent border-none cursor-pointer">
        </label>
        <button data-action="view-code" type="button"
          class="px-3 py-1 rounded-md text-[13px] bg-bar text-fg border border-white/10 hover:border-white/25 cursor-pointer">
          View code
        </button>
      </div>
    </div>
  `;
}
