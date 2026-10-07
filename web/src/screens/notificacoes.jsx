import { useState } from "react";
import { NOTIFICATIONS } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { PageHead, Footer } from "../components/site.jsx";

const KIND = {
  "ROTEIRO NOVO": { icon: "map",      cls: "vibe-lavender", group: "Roteiros" },
  "FAVORITO":     { icon: "heart",    cls: "vibe-pink",     group: "Favoritos" },
  "AGENDA":       { icon: "calendar", cls: "vibe-yellow",   group: "Agenda" },
  "AMIGO":        { icon: "users",    cls: "vibe-sky",      group: "Amigos" },
};
const FILTERS = ["Tudo", "Roteiros", "Favoritos", "Agenda", "Amigos"];

export function Notificacoes({ onMarkAllRead }) {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState("Tudo");
  const unread = items.filter(n => n.unread).length;
  const shown = filter === "Tudo" ? items : items.filter(n => KIND[n.kind]?.group === filter);

  function markAll() {
    setItems(items.map(n => ({ ...n, unread: false })));
    onMarkAllRead?.();
  }
  function readOne(id) { setItems(items.map(n => n.id === id ? { ...n, unread: false } : n)); }

  return (
    <main className="home2">
      <div className="shell narrow">
        <PageHead
          crumbs={[["Início", "home"], ["Notificações"]]}
          title="O que rolou na sua semana"
          lede={unread ? `${unread} ${unread === 1 ? "novidade" : "novidades"} esperando por você.` : "Você está em dia."}
        >
          {unread > 0 && <button className="btn-outline" onClick={markAll}><Icon name="check" size={16} /> Marcar tudo como lido</button>}
        </PageHead>

        <div className="filter-chips" role="group" aria-label="Filtrar notificações">
          {FILTERS.map(f => <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>)}
        </div>

        <ul className="notif-list">
          {shown.map(n => {
            const k = KIND[n.kind] || KIND.AGENDA;
            return (
              <li key={n.id}>
                <button className={"notif2" + (n.unread ? " unread" : "")} onClick={() => readOne(n.id)}>
                  <span className={"notif2-icon " + k.cls}><Icon name={k.icon} size={20} /></span>
                  <span className="notif2-text">
                    <span className="notif2-kind">{n.kind}</span>
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                  </span>
                  <span className="notif2-when">{n.when}{n.unread && <i aria-label="não lida" />}</span>
                </button>
              </li>
            );
          })}
          {shown.length === 0 && <li className="empty-state"><h3>Nada por aqui.</h3></li>}
        </ul>
      </div>
      <Footer />
    </main>
  );
}
