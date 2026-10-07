import { useState } from "react";
import { PLACES, ROTEIROS, VIBE_ORDER, CITIES, cityName } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, MiniPlaceCard, RoteiroMini, SectionHead, Footer } from "../components/site.jsx";
import { useNav, useFaves } from "../nav.js";
import { updateAccount, logoutAccount, deleteAccount, changeAccountPassword } from "../account.js";

const since = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); } catch { return ""; } };

export function Perfil({ user }) {
  const nav = useNav();
  const { faves } = useFaves();
  const [tab, setTab] = useState("salvos");
  const [affs, setAffs] = useState(new Set(user.vibes || []));
  const [saving, setSaving] = useState("");

  const savedPlaces = PLACES.filter(p => faves.has(p.id));
  const savedRoteiros = ROTEIROS.filter(r => faves.has(r.id));
  const stats = [[faves.size, "Salvos"], [affs.size, "Vibes"]];

  async function toggleAff(a) {
    const n = new Set(affs); n.has(a) ? n.delete(a) : n.add(a); setAffs(n);
    setSaving("vibes");
    try { await updateAccount({ vibes: [...n] }); } finally { setSaving(""); }
  }

  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Perfil"]]} title={user.name} lede={`Na Onde Sair desde ${since(user.joined)} · ${cityName(user.city)}`}>
          <div className="row gap-12">
            <span className="profile-avatar" aria-hidden="true">{user.avatar ? <img src={user.avatar} alt="" /> : (user.name || "?").charAt(0).toUpperCase()}</span>
            <button className="btn-outline" onClick={() => setTab("conta")}>Editar perfil</button>
            <button className="btn-outline" onClick={async () => { await logoutAccount(); nav("home"); }}>Sair</button>
          </div>
        </PageHead>

        <ul className="stat-row">
          {stats.map(([n, l]) => <li key={l}><strong>{n}</strong><span>{l}</span></li>)}
        </ul>

        <section className="h2-section">
          <SectionHead title="Suas vibes" sub={saving === "vibes" ? "Salvando…" : "Calibramos suas dicas por essas escolhas. Toque para ligar ou desligar."} />
          <div className="hero2-vibes">
            {VIBE_ORDER.map(a => <VibePill key={a} aff={a} active={affs.has(a)} onClick={() => toggleAff(a)} />)}
          </div>
        </section>

        <div className="underline-tabs" role="tablist">
          {[["salvos", "Meus salvos"], ["conta", "Dados da conta"]].map(([id, l]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>

        <section className="tab-panel">
          {tab === "salvos" && (faves.size === 0
            ? <div className="empty-note"><Icon name="heart" size={22} /><p>Você ainda não salvou nada. Toque no coração de um lugar ou roteiro pra guardar aqui.</p><button className="btn-pill" onClick={() => nav("lista")}>Explorar lugares</button></div>
            : <>
                {savedPlaces.length > 0 && <div className="tips-grid">{savedPlaces.map(p => <MiniPlaceCard key={p.id} p={p} />)}</div>}
                {savedRoteiros.length > 0 && <div className="roteiro-minis">{savedRoteiros.map(r => <RoteiroMini key={r.id} r={r} />)}</div>}
              </>
          )}

          {tab === "conta" && <AccountData user={user} onGone={() => nav("home")} />}

        </section>

        <section className="h2-section">
          <SectionHead title="Sugerido pra você" sub="A partir das suas vibes." link="Ver mais" onLink={() => nav("lista")} />
          <div className="tips-grid">
            {PLACES.filter(p => !affs.size || p.affs.some(a => affs.has(a))).slice(0, 6).map(p => (
              <MiniPlaceCard key={p.id} p={p} aff={p.affs.find(a => affs.has(a)) || p.affs[0]} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

function AccountData({ user, onGone }) {
  const [f, setF] = useState({ name: user.name || "", city: user.city || "sp", marketing: !!user.marketing });
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (p) => { setF({ ...f, ...p }); setMsg(""); };

  async function save(e) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setMsg("Informe seu nome.");
    try {
      await updateAccount({ name: f.name.trim(), city: f.city, marketing: f.marketing });
      setMsg("Dados salvos.");
    } catch (err) { setMsg(err.message); }
  }
  async function savePw(e) {
    e.preventDefault();
    try { await changeAccountPassword(pw.current, pw.next); setPw({ current: "", next: "" }); setPwMsg("Senha alterada."); }
    catch (err) { setPwMsg(err.message); }
  }

  return (
    <div className="account-data">
      <form className="auth-form info-box" onSubmit={save}>
        <h2 className="h2t">Seus dados</h2>
        <div className="auth-field"><label htmlFor="ac-name">Nome</label><input id="ac-name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
        <div className="auth-field">
          <label htmlFor="ac-email">E-mail</label>
          <input id="ac-email" value={user.email || ""} disabled />
        </div>
        <div className="auth-field">
          <label htmlFor="ac-city">Cidade</label>
          <div className="auth-select"><select id="ac-city" value={f.city} onChange={(e) => set({ city: e.target.value })}>{CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Icon name="chevron" size={16} /></div>
        </div>
        <label className="auth-check"><input type="checkbox" checked={f.marketing} onChange={(e) => set({ marketing: e.target.checked })} /><span>Receber o roteiro da semana por e-mail</span></label>
        {msg && <p className="auth-hint" role="status">{msg}</p>}
        <button className="btn-pill" type="submit">Salvar dados</button>
      </form>

      <div className="info-box">
        <h2 className="h2t">Trocar senha</h2>
        <form className="auth-form" onSubmit={savePw}>
          <div className="auth-field"><label htmlFor="ac-cur">Senha atual</label><input id="ac-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div className="auth-field"><label htmlFor="ac-new">Nova senha</label><input id="ac-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          {pwMsg && <p className="auth-hint" role="status">{pwMsg}</p>}
          <button className="btn-outline" type="submit">Trocar senha</button>
        </form>
      </div>

      <div className="info-box danger-box">
        <h2 className="h2t">Excluir conta</h2>
        <p>Apaga seus dados, salvos e vibes. Não dá pra desfazer.</p>
        {confirmDel
          ? <div className="row gap-12"><button className="btn-danger" onClick={async () => { await deleteAccount(); onGone(); }}>Excluir de vez</button><button className="btn-outline" onClick={() => setConfirmDel(false)}>Cancelar</button></div>
          : <button className="btn-outline" onClick={() => setConfirmDel(true)}>Excluir minha conta</button>}
      </div>
    </div>
  );
}
