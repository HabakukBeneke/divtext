/** Escape a string for use in HTML text content. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escape a string for use inside a double-quoted attribute value. */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/** Serialize an element tree as indented HTML (2-space), Prettier-style. */
export function formatHtml(el: Element, indent = 0): string {
  const pad = "  ".repeat(indent);
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${escapeAttr(a.value)}"`)
    .join("");
  const children = Array.from(el.children);
  if (children.length === 0) {
    const text = escapeHtml(el.textContent ?? "");
    return `${pad}<${tag}${attrs}>${text}</${tag}>`;
  }
  const inner = children.map((c) => formatHtml(c, indent + 1)).join("\n");
  return `${pad}<${tag}${attrs}>\n${inner}\n${pad}</${tag}>`;
}

/** Build a CSS rule with one declaration per line (stays under ~80 columns). */
export function cssRule(selector: string, decls: Record<string, string>): string {
  const body = Object.entries(decls)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}
