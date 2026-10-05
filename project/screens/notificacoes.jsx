/* global React */
function Notificacoes({ onMarkAllRead }) {
  const [items, setItems] = React.useState(window.OS_DATA.NOTIFICATIONS);
  const unread = items.filter(n => n.unread).length;

  function markAll() {
    setItems(items.map(n => ({ ...n, unread: false })));
    onMarkAllRead && onMarkAllRead();
  }

  function toggleOne(id) {
    setItems(items.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  return (
    <main className="shell" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 920 }}>
      <Eyebrow>Notificações{unread > 0 ? ` · ${unread} novas` : ""}</Eyebrow>
      <div className="row between" style={{ marginTop: 8, marginBottom: 28 }}>
        <h1 className="display" style={{ fontSize: 42, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.12, maxWidth: "16ch" }}>
          O que rolou na <span className="accent">sua semana</span>.
        </h1>
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAll}>Marcar tudo como lido</button>}
      </div>

      <div className="row gap-8" style={{ marginBottom: 12 }}>
        <ChipContext active>Tudo</ChipContext>
        <ChipContext muted>Roteiros</ChipContext>
        <ChipContext muted>VIP</ChipContext>
        <ChipContext muted>Amigos</ChipContext>
        <ChipContext muted>Agenda</ChipContext>
      </div>

      {items.map(n => (
        <article key={n.id} className={"notif-item" + (n.unread ? " unread" : "")} onClick={() => toggleOne(n.id)}>
          <span className="dot"></span>
          <div>
            <span className="kicker">{n.kind}</span>
            <h4>{n.title}</h4>
            <p>{n.body}</p>
          </div>
          <span className="when">{n.when}</span>
        </article>
      ))}

      <div style={{ paddingTop: 36, textAlign: "center" }}>
        <span className="kicker mute">Você está em dia.</span>
      </div>
    </main>
  );
}

window.Notificacoes = Notificacoes;
