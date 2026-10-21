// Texto rico de lugares, roteiros e eventos (editado no painel com a mesma barra do Radar).
// Textos antigos em texto puro continuam aparecendo (viram parágrafos).
import { useEffect, useMemo, useRef } from "react";
import { sanitizeHtml, asHtml, htmlToText } from "../richtext.js";
import { href } from "../router.js";
import { resolveMedia } from "../admin/store.js";
import { mountEmbeds } from "../embeds.js";

export const hasText = (v) => !!htmlToText(asHtml(String(v || ""))).trim() || /<(figure|img)\b/i.test(String(v || ""));

export function RichText({ value, className = "" }) {
  const html = useMemo(() => sanitizeHtml(asHtml(String(value || "")), { internal: (path) => ({ href: href(path), route: path }), resolveImg: resolveMedia }), [value]);
  const ref = useRef(null);
  useEffect(() => mountEmbeds(ref.current), [html]);   // vídeos, mapas e posts incorporados
  return <div ref={ref} className={"rich-text rich-inline" + (className ? " " + className : "")} dangerouslySetInnerHTML={{ __html: html }} />;
}
