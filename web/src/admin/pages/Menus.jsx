// Menus do site: superior, rodapé e links legais do rodapé
import { useEffect } from "react";
import { Card, Input, Select, Toggle, Repeater, PageHeader, useAdmin, useDraft, Btn } from "../kit.jsx";
import { saveMenus, isLive } from "../store.js";
import { SITE_TARGETS } from "../../menus.js";
import { SEED_MENUS } from "../../data.js";

const MENUS = [
  ["header", "Menu superior", "Links do topo de todas as páginas. Recomendado: até 7 itens.", 8],
  ["footer", "Rodapé", "Links principais do rodapé.", 10],
  ["legal", "Rodapé · links legais", "Linha de baixo do rodapé (termos, privacidade…).", 5],
];
const TYPES = [["site", "Seção do site"], ["page", "Página de conteúdo"], ["url", "Link (URL)"]];
const newId = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// problema do item (mostrado embaixo dele e bloqueando o salvamento quando grave)
function issue(it, pages) {
  if (!it.label.trim()) return ["erro", "Dê um nome ao link."];
  if (it.type === "page") {
    const pg = pages.find(p => p.id === it.page);
    if (!pg) return ["erro", "Escolha a página."];
    if (!isLive(pg)) return ["aviso", "A página não está publicada: o link só aparece no site depois que ela for publicada."];
  }
  if (it.type === "url" && !/^(https?:\/\/|mailto:|tel:|\/)/i.test((it.url || "").trim())) return ["erro", "Use um endereço completo (https://…), um e-mail (mailto:…) ou um caminho do site (/…)."];
  return null;
}

export function MenusPage() {
  const { db, user, toast, saved, setDirty, go } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(JSON.parse(JSON.stringify(db.menus || SEED_MENUS)));
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const pages = db.pages || [];
  const pageOpts = pages.filter(p => p.status !== "arquivado").map(p => [p.id, `${p.title}${isLive(p) ? "" : " (não publicada)"}`]);

  function save() {
    const bad = MENUS.some(([k]) => (draft[k] || []).some(it => issue(it, pages)?.[0] === "erro"));
    if (bad) return toast("Corrija os links destacados antes de salvar.", "error");
    const clean = Object.fromEntries(MENUS.map(([k]) => [k, (draft[k] || []).map(it => ({ ...it, label: it.label.trim(), ...(it.url ? { url: it.url.trim() } : {}) }))]));
    saveMenus(clean, user); commit(clean);
    saved("Menus salvos e aplicados ao site.");
  }

  return (
    <>
      <PageHeader title="Menus" crumbs={[["Painel", "/"], ["Menus"]]}
        subtitle="Escolha os links do topo e do rodapé do site. A ordem aqui é a ordem no site."
        actions={<><Btn icon="plus" onClick={() => go("paginas/novo")}>Nova página</Btn><Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar menus</Btn></>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      <div className="a-stack">
        {MENUS.map(([key, title, subtitle, max]) => (
          <Card key={key} title={title} subtitle={subtitle}>
            <Repeater items={draft[key] || []} max={max} addLabel="Adicionar link"
              newItem={() => ({ id: newId(), label: "", type: "site", target: "home" })}
              onChange={(items) => set({ [key]: items })}
              render={(it, upd) => {
                const prob = issue(it, pages);
                return (
                  <div className="a-menu-item">
                    <div className="a-menu-row">
                      <Input label="Nome do link" value={it.label} onChange={(label) => upd({ label })} maxCount={30} />
                      <Select label="Leva para" value={it.type} options={TYPES}
                        onChange={(type) => upd(type === "site" ? { type, target: it.target || "home" } : type === "page" ? { type, page: it.page || pages.find(isLive)?.id || pages[0]?.id || "" } : { type, url: it.url || "https://", newTab: it.newTab ?? true })} />
                      {it.type === "site" && <Select label="Seção" value={it.target} onChange={(target) => upd({ target })} options={SITE_TARGETS.map(t => [t.id, t.label])} />}
                      {it.type === "page" && <Select label="Página" value={it.page || ""} onChange={(page) => upd({ page })} options={pageOpts} placeholder="Escolha a página" />}
                      {it.type === "url" && <Input label="Endereço" value={it.url || ""} onChange={(url) => upd({ url })} placeholder="https://…" />}
                    </div>
                    {it.type === "url" && <Toggle label="Abrir em nova aba" checked={it.newTab !== false} onChange={(newTab) => upd({ newTab })} />}
                    {prob && <p className={prob[0] === "erro" ? "a-error" : "a-hint a-menu-warn"} role={prob[0] === "erro" ? "alert" : undefined}>{prob[1]}</p>}
                  </div>
                );
              }} />
          </Card>
        ))}
      </div>
    </>
  );
}
