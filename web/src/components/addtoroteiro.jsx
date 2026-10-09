// "Adicionar a um roteiro": coloca o lugar num roteiro meu ou cria um novo com ele
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons.jsx";
import { useNav, useAccount } from "../nav.js";
import { myRoteiros, addPlaceToRoteiro } from "../account.js";

export function AddToRoteiro({ place, className = "btn-outline btn-lg", iconSize = 18, compact = false }) {
  const nav = useNav();
  const { user, ask, paused } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(null);       // { roteiro, already } | { error }
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  function toggle() {
    if (!user) return ask({ type: "roteiro", place: place.id });
    setOpen(!open); setDone(null);
  }
  async function add(r) {
    setBusy(r.id);
    try { setDone(await addPlaceToRoteiro(r.id, place)); }
    catch (e) { setDone({ error: e.message }); }
    setBusy("");
  }
  const list = user ? myRoteiros() : [];

  if (paused) return null;                       // contas e interações pausadas
  return (
    <div className="add-rot" ref={box}>
      <button className={className + (open ? " show" : "")} onClick={toggle} aria-expanded={open} aria-haspopup="dialog" aria-label="Adicionar a um roteiro">
        <Icon name="list" size={iconSize} />{compact ? <span className="act-label">Adicionar a um roteiro</span> : " Adicionar a um roteiro"}
      </button>
      {open && (
        <div className="add-rot-pop" role="dialog" aria-label="Adicionar a um roteiro">
          {done && !done.error && (
            <div className="add-rot-done" role="status">
              <Icon name="check" size={16} />
              <span>{done.already ? <>Já está em <strong>{done.roteiro.title}</strong>.</> : <>Adicionado a <strong>{done.roteiro.title}</strong>.</>}</span>
              <button className="auth-link" onClick={() => nav("meuRoteiro", { id: done.roteiro.id })}>Ver roteiro</button>
            </div>
          )}
          {done?.error && <div className="auth-alert" role="alert">{done.error}</div>}
          <p className="add-rot-title">{list.length ? "Seus roteiros" : "Você ainda não tem roteiros."}</p>
          {list.length > 0 && (
            <ul className="add-rot-list">
              {list.map(r => {
                const has = r.steps.some(s => s.place === place.id);
                return (
                  <li key={r.id}>
                    <button disabled={!!busy} onClick={() => add(r)} aria-label={`Adicionar a ${r.title}`}>
                      <span><strong>{r.title}</strong><em>{r.steps.length} parada{r.steps.length === 1 ? "" : "s"}{has ? " · já inclui este lugar" : ""}</em></span>
                      {busy === r.id ? <span className="add-rot-busy">…</span> : <Icon name={has ? "check" : "arrow"} size={16} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button className="btn-pill btn-block add-rot-new" onClick={() => nav("meuRoteiroEditar", { id: "novo", lugar: place.id })}>
            <Icon name="pin" size={16} /> Novo roteiro com {place.name}
          </button>
        </div>
      )}
    </div>
  );
}
