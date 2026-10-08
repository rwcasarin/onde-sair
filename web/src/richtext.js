// Texto rico das páginas de conteúdo: HTML com uma lista fechada de tags.
// Tudo passa por sanitizeHtml ao salvar e ao exibir (nunca vai HTML bruto para a página).
const ALLOWED = new Set(["P", "H2", "H3", "STRONG", "EM", "U", "S", "A", "UL", "OL", "LI", "BLOCKQUOTE", "BR", "HR"]);
const RENAME = { B: "STRONG", I: "EM", STRIKE: "S", DEL: "S", H1: "H2", H4: "H3", H5: "H3", H6: "H3", DIV: "P" };
const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "SELECT", "TEXTAREA", "LINK", "META", "TITLE", "HEAD", "IMG", "VIDEO", "AUDIO", "CANVAS"]);
const BLOCK = new Set(["P", "H2", "H3", "UL", "OL", "BLOCKQUOTE", "HR"]);

// Links permitidos: http(s), e-mail, telefone, caminhos do site (/…) e âncoras (#…)
export function safeHref(h = "") {
  const v = String(h).trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v;
  if (/^\/(?!\/)/.test(v) || /^#[\w-]*$/.test(v)) return v;
  return null;
}

// internal(path) → { href, route } para links do próprio site (navegação sem recarregar)
export function sanitizeHtml(html = "", { internal } = {}) {
  if (typeof DOMParser === "undefined") return "";
  const src = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  const doc = document.implementation.createHTMLDocument("");
  const root = doc.createElement("div");
  walk(src, root, doc, internal);
  // texto solto na raiz vira parágrafo
  const out = doc.createElement("div");
  let para = null;
  [...root.childNodes].forEach(n => {
    const block = n.nodeType === 1 && BLOCK.has(n.tagName);
    if (block) { para = null; out.appendChild(n); return; }
    if (n.nodeType === 3 && !n.nodeValue.trim() && !para) return;
    if (!para) { para = doc.createElement("p"); out.appendChild(para); }
    para.appendChild(n);
  });
  // remove parágrafos vazios do começo e do fim
  const empty = (n) => n && n.nodeType === 1 && n.tagName === "P" && !n.textContent.trim();
  while (empty(out.firstChild)) out.firstChild.remove();
  while (out.lastChild && out.lastChild.nodeType === 1 && out.lastChild.tagName === "P" && !out.lastChild.textContent.trim()) out.lastChild.remove();
  return out.innerHTML;
}

function walk(src, dst, doc, internal) {
  for (const n of src.childNodes) {
    if (n.nodeType === 3) { dst.appendChild(doc.createTextNode(n.nodeValue)); continue; }
    if (n.nodeType !== 1) continue;
    let tag = n.tagName;
    if (DROP.has(tag)) continue;
    tag = RENAME[tag] || tag;
    // <span style="font-weight:bold"> (colado do Google Docs / Word)
    if (tag === "SPAN") {
      const st = n.getAttribute("style") || "";
      if (/font-weight:\s*(bold|[6-9]00)/i.test(st)) tag = "STRONG";
      else if (/font-style:\s*italic/i.test(st)) tag = "EM";
    }
    if (!ALLOWED.has(tag)) { walk(n, dst, doc, internal); continue; }
    // blocos dentro de parágrafo (ex.: <p><div>) viram conteúdo do próprio parágrafo
    if (dst.tagName === "P" && BLOCK.has(tag)) { walk(n, dst, doc, internal); continue; }
    const el = doc.createElement(tag);
    if (tag === "A") {
      const h = safeHref(n.getAttribute("href"));
      if (!h) { walk(n, dst, doc, internal); continue; }
      if (h.startsWith("/") && internal) { const r = internal(h); el.setAttribute("href", r.href); el.setAttribute("data-route", r.route); }
      else el.setAttribute("href", h);
      if (/^https?:/i.test(h)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
    }
    walk(n, el, doc, internal);
    if (["STRONG", "EM", "U", "S", "A"].includes(tag) && !el.textContent && !el.querySelector("br")) continue;   // formatação vazia
    dst.appendChild(el);
  }
}

// Texto puro (resumo, descrição padrão, contagem de palavras)
export function htmlToText(html = "") {
  if (typeof DOMParser === "undefined") return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const d = new DOMParser().parseFromString(`<body>${String(html).replace(/<\/(p|h2|h3|li|blockquote)>/gi, "$& ")}</body>`, "text/html");
  return (d.body.textContent || "").replace(/\s+/g, " ").trim();
}
