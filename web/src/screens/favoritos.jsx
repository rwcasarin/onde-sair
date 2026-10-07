import { useState } from "react";
import { PLACES, ROTEIROS, FAV_LISTS } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { PageHead, ListingCard, RoteiroMini, Footer } from "../components/site.jsx";
import { useNav, useFaves } from "../nav.js";

export function Favoritos() {
  const nav = useNav();
  const { faves } = useFaves();
  const [tab, setTab] = useState("lugares");
  const places = PLACES.filter(p => faves.has(p.id));
  const rots = ROTEIROS.filter(r => faves.has(r.id));

  const tabs = [["lugares", `Lugares (${places.length})`], ["roteiros", `Roteiros (${rots.length})`], ["roles", `Meus rolês (${FAV_LISTS.length})`]];

  return (
    <main className="home2">
      <div className="shell">
        <PageHead crumbs={[["Início", "home"], ["Favoritos"]]} title="Onde eu quero ir" lede="Tudo o que você salvou, num lugar só. Monte rolês e convide quem vai junto.">
          <button className="btn-pill"><Icon name="users" size={16} /> Novo rolê em grupo</button>
        </PageHead>

        <div className="underline-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <section className="tab-panel">
          {tab === "lugares" && (places.length
            ? <div className="listing-grid">{places.map(p => <ListingCard key={p.id} p={p} />)}</div>
            : <Empty text="Você ainda não salvou nenhum lugar." cta="Descobrir lugares" onClick={() => nav("lista")} />)}

          {tab === "roteiros" && (rots.length
            ? <div className="rot-mini-grid">{rots.map(r => <RoteiroMini key={r.id} r={r} />)}</div>
            : <Empty text="Nenhum roteiro salvo por enquanto." cta="Ver roteiros" onClick={() => nav("roteiros")} />)}

          {tab === "roles" && (
            <div className="roles-grid">
              {FAV_LISTS.map((l, i) => (
                <article key={l.id} className="role-card">
                  <div className="role-thumbs">
                    {[0, 1, 2].map(n => <ImageSlot key={n} src={`images/roles/${l.id}-${n + 1}.jpg`} compact />)}
                  </div>
                  <h3>{l.title}</h3>
                  <div className="role-meta"><span>{l.count} lugares</span><span>{l.when}</span></div>
                </article>
              ))}
              <button className="role-card role-new">
                <span className="role-plus"><Icon name="users" size={26} /></span>
                <strong>Novo rolê</strong>
                <span>Convide até 8 amigos</span>
              </button>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}

function Empty({ text, cta, onClick }) {
  return (
    <div className="empty-state">
      <Icon name="heart" size={30} />
      <h3>{text}</h3>
      <p>Toque no coração de qualquer card para salvar aqui.</p>
      <button className="btn-outline" onClick={onClick}>{cta} <Icon name="arrow" size={14} /></button>
    </div>
  );
}
