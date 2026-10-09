import { useState } from "react";
import { PLACES, ROTEIROS, VIBE_ORDER, CITIES, cityName } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, VibePill, MiniPlaceCard, RoteiroCard, ListingCard, SectionHead, Footer } from "../components/site.jsx";
import { useNav, useFaves } from "../nav.js";
import { href, toPath } from "../router.js";
import { updateAccount, logoutAccount, deleteAccount, changeAccountPassword, deleteMyRoteiro } from "../account.js";
import { MyRoteiroCard } from "./roteiro.jsx";
import { roteiroVibes } from "../vibes.js";
import { SITE } from "../admin/store.js";

const since = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); } catch { return ""; } };

const TABS = [["favoritos", "Lugares favoritos"], ["favRoteiros", "Roteiros favoritos"], ["meus", "Meus roteiros"], ["conta", "Dados da conta"]];

export function Perfil({ user, tab = "favoritos" }) {
  const nav = useNav();
  const { faves } = useFaves();
  const [affs, setAffs] = useState(new Set(user.vibes || []));
  const [saving, setSaving] = useState("");

  const favPlaces = PLACES.filter(p => faves.has(p.id));
  const favRoteiros = ROTEIROS.filter(r => faves.has(r.id));
  const mine = user.roteiros || [];
  const count = { favoritos: favPlaces.length, favRoteiros: favRoteiros.length, meus: mine.length };
  const stats = [[favPlaces.length, "Lugares favoritos", "favoritos"], [favRoteiros.length, "Roteiros favoritos", "favRoteiros"], [mine.length, "Meus roteiros", "meus"], [affs.size, "Vibes", null]];

  async function toggleAff(a) {
    const n = new Set(affs); n.has(a) ? n.delete(a) : n.add(a); setAffs(n);
    setSaving("vibes");
    try { await updateAccount({ vibes: [...n] }); } finally { setSaving(""); }
  }

  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Meu perfil"]]} title={user.name} lede={`Na Onde Sair desde ${since(user.joined)} · ${cityName(user.city)}`}>
          <div className="row gap-12">
            <span className="profile-avatar" aria-hidden="true">{user.avatar ? <img src={user.avatar} alt="" /> : (user.name || "?").charAt(0).toUpperCase()}</span>
            <button className="btn-outline" onClick={() => nav("perfil", { tab: "conta" })}>Editar perfil</button>
            <button className="btn-outline" onClick={async () => { await logoutAccount(); nav("home"); }}>Sair</button>
          </div>
        </PageHead>

        <ul className="stat-row">
          {stats.map(([n, l, t]) => (
            <li key={l} className={t ? "stat-link" + (tab === t ? " on" : "") : ""} onClick={t ? () => nav("perfil", { tab: t }) : undefined}><strong>{n}</strong><span>{l}</span></li>
          ))}
        </ul>

        <section className="h2-section">
          <SectionHead title="Suas vibes" sub={saving === "vibes" ? "Salvando…" : "Calibramos suas dicas por essas escolhas. Toque para ligar ou desligar."} />
          <div className="hero2-vibes">
            {VIBE_ORDER.map(a => <VibePill key={a} aff={a} active={affs.has(a)} onClick={() => toggleAff(a)} />)}
          </div>
        </section>

        <nav className="underline-tabs" aria-label="Seções do perfil">
          {TABS.map(([id, l]) => {
            const to = toPath("perfil", { tab: id });
            return <a key={id} href={href(to)} aria-current={tab === id ? "page" : undefined} className={tab === id ? "on" : ""}
              onClick={(e) => { e.preventDefault(); nav("perfil", { tab: id }); }}>{l}{count[id] !== undefined && <span className="tab-count">{count[id]}</span>}</a>;
          })}
        </nav>

        <section className="tab-panel" key={tab}>
          {tab === "favoritos" && (
            <Filtered items={favPlaces} vibesOf={(p) => p.affs} empty={
              <Empty icon="heart" text="Você ainda não favoritou nenhum lugar." sub="Toque no coração de um lugar para guardar aqui." cta="Descobrir lugares" onClick={() => nav("lista")} />}>
              {(list) => <div className="listing-grid">{list.map(p => <ListingCard key={p.id} p={p} />)}</div>}
            </Filtered>
          )}

          {tab === "favRoteiros" && (
            <Filtered items={favRoteiros} vibesOf={roteiroVibes} empty={
              <Empty icon="heart" text="Nenhum roteiro favorito por enquanto." sub="Salve roteiros da curadoria para ter sempre à mão." cta="Ver roteiros" onClick={() => nav("roteiros")} />}>
              {(list) => <div className="rot-index">{list.map(r => <RoteiroCard key={r.id} r={r} />)}</div>}
            </Filtered>
          )}

          {tab === "meus" && <MyRoteiros list={mine} />}

          {tab === "conta" && <AccountData user={user} onGone={() => nav("home")} />}
        </section>

        {tab !== "conta" && (
          <section className="h2-section">
            <SectionHead title="Sugerido pra você" sub="A partir das suas vibes." link="Ver mais" onLink={() => nav("lista")} />
            <div className="tips-grid">
              {PLACES.filter(p => !faves.has(p.id) && (!affs.size || p.affs.some(a => affs.has(a)))).slice(0, 6).map(p => (
                <MiniPlaceCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}

// Lista com filtro por vibe (só mostra as vibes presentes nos itens)
function Filtered({ items, vibesOf, empty, children }) {
  const [vibe, setVibe] = useState("");
  if (!items.length) return empty;
  const present = VIBE_ORDER.filter(v => items.some(x => vibesOf(x).includes(v)));
  const list = vibe ? items.filter(x => vibesOf(x).includes(vibe)) : items;
  return (
    <>
      <div className="vibe-filter" role="group" aria-label="Filtrar por vibe">
        <button className={"vibe-filter-all" + (!vibe ? " on" : "")} aria-pressed={!vibe} onClick={() => setVibe("")}>Todas <span>{items.length}</span></button>
        {present.map(v => <VibePill key={v} aff={v} size="sm" active={vibe === v} onClick={() => setVibe(vibe === v ? "" : v)} />)}
      </div>
      {list.length ? children(list) : <p className="empty-filter">Nenhum item com essa vibe.</p>}
    </>
  );
}

function Empty({ icon, text, sub, cta, onClick, extra }) {
  return (
    <div className="empty-note">
      <Icon name={icon} size={22} />
      <p><strong>{text}</strong><br />{sub}</p>
      <div className="row gap-12 wrap">{cta && <button className="btn-pill" onClick={onClick}>{cta}</button>}{extra}</div>
    </div>
  );
}

function MyRoteiros({ list }) {
  const nav = useNav();
  const [del, setDel] = useState(null);
  const create = <button className="btn-pill" onClick={() => nav("meuRoteiroEditar", { id: "novo" })}><Icon name="pin" size={16} /> Criar roteiro</button>;
  if (!list.length) {
    return <Empty icon="list" text="Monte seu primeiro roteiro." sub="Crie do zero, comece por um lugar (botão “Adicionar a um roteiro”) ou copie um roteiro da curadoria para adaptar."
      cta="Criar do zero" onClick={() => nav("meuRoteiroEditar", { id: "novo" })}
      extra={<button className="btn-outline" onClick={() => nav("roteiros")}>Copiar da curadoria</button>} />;
  }
  return (
    <>
      <div className="my-rot-bar">
        <p>{list.length} roteiro{list.length === 1 ? "" : "s"} seu{list.length === 1 ? "" : "s"}. Só você vê.</p>
        <div className="row gap-12 wrap">
          <button className="btn-outline" onClick={() => nav("roteiros")}>Copiar da curadoria</button>
          {create}
        </div>
      </div>
      <Filtered items={list} vibesOf={roteiroVibes} empty={null}>
        {(items) => (
          <div className="rot-index">
            {items.map(r => (
              <MyRoteiroCard key={r.id} r={r} actions={del === r.id
                ? <span className="inline-confirm">Excluir?
                    <button className="btn-danger" onClick={async () => { await deleteMyRoteiro(r.id); setDel(null); }}>Excluir</button>
                    <button className="btn-outline" onClick={() => setDel(null)}>Não</button></span>
                : <>
                    <button className="auth-link" onClick={() => nav("meuRoteiroEditar", { id: r.id })}>Editar</button>
                    <button className="auth-link" onClick={() => nav("meuRoteiroEditar", { id: "novo", copiar: r.id })}>Duplicar</button>
                    <button className="auth-link danger" onClick={() => setDel(r.id)}>Excluir</button>
                  </>} />
            ))}
          </div>
        )}
      </Filtered>
    </>
  );
}

function AccountData({ user, onGone }) {
  const [f, setF] = useState({ name: user.name || "", city: user.city || SITE.defaultCity, marketing: !!user.marketing });
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
