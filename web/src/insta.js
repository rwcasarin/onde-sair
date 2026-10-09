// Link do perfil do Instagram de um lugar ("@perfil", "perfil" ou link do perfil)
export function instaProfile(handle = "") {
  const h = String(handle).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return h ? `https://www.instagram.com/${h}/` : null;
}
