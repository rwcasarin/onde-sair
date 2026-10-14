// Fotos do lugar: lista ordenada com legenda, crédito, link e descrição (alt).
// Lugares antigos tinham 4 espaços fixos (images/lugares/{id}-1..4.jpg): valem enquanto
// o lugar não tiver a lista nova salva no painel.
import { placeGallery, placeImg } from "./data.js";
import { hasMedia } from "./admin/store.js";

export const MAX_PHOTOS = 30;
export const blankPhoto = (path) => ({ path, caption: "", credit: "", link: "", linkLabel: "", alt: "" });

// lista para editar no painel (inclui as fotos antigas que foram enviadas)
export function photosForEdit(p) {
  if (Array.isArray(p.photos)) return p.photos;
  return p.id ? placeGallery(p.id).filter(hasMedia).map(blankPhoto) : [];
}

// só endereços http(s) viram link na legenda
export const safeUrl = (u = "") => {
  const t = String(u).trim();
  if (!t) return "";
  const full = /^https?:\/\//i.test(t) ? t : /^[\w-]+(\.[\w-]+)+/.test(t) ? "https://" + t : "";
  try { return full ? new URL(full).href : ""; } catch { return ""; }
};

// fotos da galeria no site (só as que existem de fato)
export const placePhotos = (p) => photosForEdit(p).filter(x => x.path && hasMedia(x.path));

// slides da galeria em tela cheia: a foto principal (se enviada) e depois as da galeria
export function placeSlides(p) {
  const cover = hasMedia(placeImg(p.id)) ? [{ ...blankPhoto(placeImg(p.id)), caption: p.coverCaption || "", credit: p.coverCredit || "", alt: p.name }] : [];
  return [...cover, ...placePhotos(p)];
}
