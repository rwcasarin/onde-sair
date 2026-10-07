import { useEffect, useRef, useState } from "react";
import { AIcon, Btn, Card, Input, Textarea, Select, Toggle, Tabs, Segmented, Field, PageHeader, useAdmin, useDraft } from "../kit.jsx";
import { saveSettings, getDB, resetDemo, importDB, REMOTE } from "../store.js";

export function SettingsPage() {
  const { db, user, toast, saved, confirm, setDirty } = useAdmin();
  const { draft, set, dirty, commit } = useDraft(db.settings);
  const [tab, setTab] = useState("geral");
  const file = useRef(null);
  useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]);
  const ann = draft.announcement;

  function save() {
    if (!draft.siteName.trim()) return toast("O nome do site não pode ficar vazio.", "error");
    saveSettings(draft, user); commit(draft);
    saved("Configurações salvas.");
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(getDB(), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `onde-sair-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast("Backup baixado.", "success");
  }
  async function importJson(f) {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.places || !data.roteiros) throw new Error();
      if (!(await confirm({ title: "Restaurar backup?", text: "Todo o conteúdo atual do painel será substituído pelo do arquivo.", ok: "Restaurar", danger: true }))) return;
      importDB(data);
      saved("Backup restaurado.");
    } catch { toast("Arquivo inválido: não é um backup do Onde Sair.", "error"); }
  }
  async function reset() {
    if (await confirm({ title: "Restaurar conteúdo original?", text: "Apaga todas as edições de conteúdo e volta ao conteúdo de lançamento. Faça um backup antes.", ok: "Restaurar", danger: true })) {
      resetDemo(); commit(getDB().settings); saved("Conteúdo original restaurado.");
    }
  }

  return (
    <>
      <PageHeader title="Configurações" crumbs={[["Painel", "/"], ["Configurações"]]} subtitle="Identidade, SEO, avisos e dados do site."
        actions={<Btn kind="primary" icon="check" disabled={!dirty} onClick={save}>Salvar configurações</Btn>} />
      {dirty && <p className="a-dirty a-dirty-bar"><i /> Alterações não salvas</p>}
      <Tabs value={tab} onChange={setTab} tabs={[["geral", "Geral"], ["seo", "SEO"], ["aviso", "Aviso no topo"], ["redes", "Redes sociais"], ["integracoes", "Integrações"], ["avancado", "Avançado"], ["dados", "Dados"]]} />

      {tab === "geral" && (
        <Card>
          <div className="a-form-grid">
            <Input label="Nome do site" required value={draft.siteName} onChange={(siteName) => set({ siteName })} />
            <Input label="E-mail de contato" type="email" value={draft.contactEmail} onChange={(contactEmail) => set({ contactEmail })} />
            <Input label="Assinatura" value={draft.tagline} onChange={(tagline) => set({ tagline })} hint="Ex.: Curadoria por afinidade." />
            <Input label="Frase de campanha" value={draft.campaign} onChange={(campaign) => set({ campaign })} />
          </div>
          <Select label="Cidade padrão" value={draft.defaultCity} onChange={(defaultCity) => set({ defaultCity })} options={db.cities.filter(c => c.active).map(c => [c.id, c.name])} hint="Usada por quem ainda não escolheu uma cidade." />
        </Card>
      )}

      {tab === "seo" && (
        <Card subtitle="Valores padrão para páginas sem SEO próprio.">
          <Input label="Título padrão" value={draft.seoTitle} onChange={(seoTitle) => set({ seoTitle })} maxCount={60} />
          <Textarea label="Descrição padrão" value={draft.seoDesc} onChange={(seoDesc) => set({ seoDesc })} rows={3} maxCount={160} />
          <div className="a-serp"><span className="a-serp-url">ondesair.com.br</span><strong>{draft.seoTitle}</strong><p>{draft.seoDesc}</p></div>
        </Card>
      )}

      {tab === "aviso" && (
        <Card subtitle="Uma faixa no topo de todas as páginas do site. Bom para lançamentos e avisos rápidos.">
          <Toggle label="Mostrar aviso no site" checked={ann.enabled} onChange={(enabled) => set({ announcement: { ...ann, enabled } })} />
          <Input label="Texto do aviso" value={ann.text} onChange={(text) => set({ announcement: { ...ann, text } })} maxCount={90} />
          <Field label="Cor">
            <Segmented label="Cor do aviso" value={ann.tone} onChange={(tone) => set({ announcement: { ...ann, tone } })} options={[["primary", "Roxo"], ["magenta", "Magenta"], ["teal", "Teal"], ["yellow", "Amarelo"]]} />
          </Field>
          <span className="a-label">Prévia</span>
          <div className={"site-announce tone-" + ann.tone + (ann.enabled ? "" : " off")}>{ann.text || "Texto do aviso"}</div>
        </Card>
      )}

      {tab === "redes" && (
        <Card>
          <div className="a-form-grid">
            <Input label="Instagram" value={draft.instagram} onChange={(instagram) => set({ instagram })} prefix="instagram.com/" />
            <Input label="TikTok" value={draft.tiktok} onChange={(tiktok) => set({ tiktok })} prefix="tiktok.com/" />
            <Input label="YouTube" value={draft.youtube} onChange={(youtube) => set({ youtube })} prefix="youtube.com" />
            <Input label="Spotify" value={draft.spotify} onChange={(spotify) => set({ spotify })} />
          </div>
        </Card>
      )}

      {tab === "integracoes" && (
        <Card title="Google Maps" subtitle="Ativa o autocompletar de endereço no cadastro de lugares.">
          <Input label="Chave da API (navegador)" value={draft.mapsKey || ""} onChange={(mapsKey) => set({ mapsKey: mapsKey.trim() })}
            placeholder="AIza…" autoComplete="off" spellCheck={false}
            hint="Fica guardada só no painel; o site público não recebe essa chave." />
          <ol className="a-steps">
            <li>No Google Cloud Console, ative <strong>Maps JavaScript API</strong> e <strong>Places API (New)</strong>.</li>
            <li>Crie uma chave em <em>APIs e serviços › Credenciais</em>.</li>
            <li>Restrinja a chave a <em>Referenciadores HTTP</em>: <code>https://www.ondesair.com.br/*</code> e <code>https://ondesair.com.br/*</code>, e às duas APIs acima.</li>
            <li>Cole a chave aqui e salve. O campo de endereço passa a sugerir endereços na hora.</li>
          </ol>
        </Card>
      )}

      {tab === "avancado" && (
        <Card>
          <Toggle label="Newsletter ativa" hint="Mostra o formulário de inscrição." checked={draft.newsletter} onChange={(newsletter) => set({ newsletter })} />
          <Toggle label="Exigir aprovação de avaliações" checked={draft.reviewsRequireApproval} onChange={(reviewsRequireApproval) => set({ reviewsRequireApproval })} />
          <div className={"a-alert" + (draft.maintenance ? " tone-error" : "")}>
            <AIcon name="alert" size={16} />
            <div>
              <Toggle label="Modo manutenção" hint="O site mostra uma página de “voltamos já”. O painel continua acessível." checked={draft.maintenance} onChange={(maintenance) => set({ maintenance })} />
            </div>
          </div>
        </Card>
      )}

      {tab === "dados" && (
        <div className="a-grid-2">
          <Card title="Backup" subtitle="Baixe todo o conteúdo do painel (inclui imagens enviadas) ou restaure um arquivo.">
            <div className="a-btn-row">
              <Btn icon="download" onClick={exportJson}>Baixar backup (.json)</Btn>
              <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { importJson(e.target.files[0]); e.target.value = ""; }} />
              <Btn icon="upload" onClick={() => file.current?.click()}>Restaurar backup</Btn>
            </div>
          </Card>
          <Card title="Conteúdo original" subtitle={REMOTE ? "Volta lugares, roteiros, histórias e home ao conteúdo de lançamento. Equipe e imagens são mantidas." : "Esta versão offline guarda os dados só neste navegador."}>
            <Btn kind="danger" icon="refresh" onClick={reset}>Restaurar conteúdo original</Btn>
          </Card>
        </div>
      )}
    </>
  );
}
