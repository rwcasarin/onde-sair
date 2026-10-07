// Editor de roteiros do usuário — criar do zero, a partir de um lugar ou copiando outro roteiro
import { useEffect, useMemo, useRef, useState } from "react";
import { PLACES, ROTEIROS, AFFINITIES, placeImg } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { Crumbs, VibePill, MapArt, Footer } from "../components/site.jsx";
import { useNav, useFaves } from "../nav.js";
import { findMyRoteiro, saveMyRoteiro, copyOf } from "../account.js";
import { bySlug } from "../router.js";
import { blankRoteiro, blankStep, roteiroErrors, cleanRoteiro, INVEST_LABELS, LIMITS } from "../../shared/myroteiros.js";
import { NotFound } from "./notfound.jsx";

const STEP_COLORS = ["var(--c-magenta)", "var(--primary)", "#F58220", "var(--c-teal)", "var(--c-yellow)"];
const plain = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const placeById = (id) => PLACES.find(p => p.id === id);
const stepFromPlace = (p) => blankStep({ place: p.id, title: p.name, sub: p.sub || "" });

// Monta o rascunho inicial: edição, cópia (?copiar=) ou novo com um lugar (?lugar=)
function initialDraft({ id, lugar, copiar }) {
  if (id && id !== "novo") { const r = findMyRoteiro(id); return r ? cleanRoteiro(r) : null; }
  if (copiar) {
    const mine = copiar.startsWith("ur") ? findMyRoteiro(copiar) : null;
    const src = mine || bySlug(ROTEIROS, copiar);
    if (src) return copyOf(src, { mine: !!mine });
  }
  const d = blankRoteiro();
  const p = lugar && placeById(lugar);
  if (p) { d.steps = [stepFromPlace(p)]; d.aff = p.affs?.[0] || ""; }
  return d;
}

export function MeuRoteiroEditor({ id, lugar, copiar }) {
  const start = useMemo(() => initialDraft({ id, lugar, copiar }), [id, lugar, copiar]);
  if (!start) return <NotFound />;
  return <Editor start={start} isNew={!id || id === "novo"} />;
}

function Editor({ start, isNew }) {
  const nav = useNav();
  const { faves } = useFaves();
  const [d, setD] = useState(start);
  const [tab, setTab] = useState("info");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const baseline = useRef(JSON.stringify(start));
  const dirty = JSON.stringify(d) !== baseline.current;
  const set = (patch) => setD(x => ({ ...x, ...patch }));
  const setStats = (patch) => setD(x => ({ ...x, stats: { ...x.stats, ...patch } }));
  const setTips = (patch) => setD(x => ({ ...x, tips: { ...x.tips, ...patch } }));
  const setStep = (i, patch) => setD(x => ({ ...x, steps: x.steps.map((s, k) => k === i ? { ...s, ...patch } : s) }));

  // aviso ao fechar a aba com alterações não salvas
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => { if (Object.keys(errors).length) setErrors(roteiroErrors(d)); }, [d]); // eslint-disable-line

  function move(i, dir) {
    const j = i + dir; if (j < 0 || j >= d.steps.length) return;
    const steps = [...d.steps]; [steps[i], steps[j]] = [steps[j], steps[i]]; set({ steps });
  }
  const remove = (i) => set({ steps: d.steps.filter((_, k) => k !== i) });
  function addStep(step = blankStep()) {
    if (d.steps.length >= LIMITS.steps) return setMsg(`Um roteiro pode ter até ${LIMITS.steps} paradas.`);
    // substitui a parada vazia inicial em vez de acumular
    const steps = d.steps.length === 1 && !d.steps[0].title && !d.steps[0].place ? [] : d.steps;
    set({ steps: [...steps, step] }); setMsg("");
  }

  async function save() {
    const e = roteiroErrors(d);
    setErrors(e);
    if (Object.keys(e).length) { setTab(e.title || e.aff ? "info" : "paradas"); return; }
    setBusy(true); setMsg("");
    try {
      const saved = await saveMyRoteiro(d);
      baseline.current = JSON.stringify(d);
      nav("meuRoteiro", { id: saved.id });
    } catch (err) { setMsg(err.message || "Não foi possível salvar agora."); setBusy(false); }
  }
  function cancel() {
    if (dirty && !window.confirm("Descartar as alterações deste roteiro?")) return;
    baseline.current = JSON.stringify(d);
    if (isNew) nav("perfil", { tab: "meus" }); else nav("meuRoteiro", { id: d.id });
  }

  const usedPlaces = new Set(d.steps.map(s => s.place).filter(Boolean));
  const favPlaces = PLACES.filter(p => faves.has(p.id) && !usedPlaces.has(p.id));
  const pins = d.steps.map((s, i) => {
    const pl = s.place && placeById(s.place);
    const b = pl ? pl.map : { x: 20 + i * 14, y: 50 };
    return { x: Math.min(88, Math.max(12, b.x)), y: Math.min(85, Math.max(12, b.y)), num: i + 1, color: STEP_COLORS[i % STEP_COLORS.length], title: s.title };
  });
  const title = isNew ? (d.from ? "Adaptar roteiro" : "Novo roteiro") : "Editar roteiro";

  return (
    <main className="home2">
      <div className="shell rot-editor">
        <Crumbs items={[["Início", "home"], ["Meus roteiros", "perfil", { tab: "meus" }], [title]]} />
        <header className="rot-editor-head">
          <div>
            <h1 className="page-title page-title-md">{title}</h1>
            {d.from && <p className="rot-editor-from"><Icon name="list" size={16} /> Baseado em “{d.from.title}”. As mudanças valem só para a sua cópia.</p>}
            {!d.from && isNew && <p className="rot-editor-from">Monte do seu jeito: escolha lugares da curadoria ou crie paradas livres.</p>}
          </div>
        </header>

        <div className="rot-editor-grid">
          <div>
            <div className="underline-tabs" role="tablist">
              {[["info", "Informações", errors.title || errors.aff], ["paradas", `Paradas (${d.steps.length})`, errors.steps], ["dicas", "Dicas e anotações"]].map(([k, l, err]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{err && <span className="tab-err" aria-label="com erro">!</span>}</button>
              ))}
            </div>

            {tab === "info" && (
              <section className="rot-form">
                <F label="Nome do roteiro" error={errors.title} required>
                  {(id) => <input id={id} value={d.title} maxLength={90} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Sábado de feira e boteco" />}
                </F>
                <F label="Resumo" hint="Uma ou duas frases sobre o clima do roteiro.">
                  {(id) => <textarea id={id} rows={2} maxLength={240} value={d.desc} onChange={(e) => set({ desc: e.target.value })} />}
                </F>
                <div className="rot-field">
                  <span className="rot-label">Vibe principal <i>*</i></span>
                  <div className="hero2-vibes rot-vibes" role="radiogroup" aria-label="Vibe principal">
                    {AFFINITIES.map(a => <VibePill key={a.id} aff={a.id} active={d.aff === a.id} onClick={() => set({ aff: a.id, vibes: d.vibes.filter(v => v !== a.id) })} />)}
                  </div>
                  {errors.aff && <span className="auth-error" role="alert">{errors.aff}</span>}
                </div>
                <div className="rot-field">
                  <span className="rot-label">Outras vibes</span>
                  <div className="hero2-vibes rot-vibes">
                    {AFFINITIES.filter(a => a.id !== d.aff).map(a => <VibePill key={a.id} aff={a.id} size="sm" active={d.vibes.includes(a.id)}
                      onClick={() => set({ vibes: d.vibes.includes(a.id) ? d.vibes.filter(v => v !== a.id) : [...d.vibes, a.id] })} />)}
                  </div>
                </div>
                <F label="Sobre este roteiro" hint="Opcional. Conte o que torna esse dia especial.">
                  {(id) => <textarea id={id} rows={4} maxLength={1500} value={d.about} onChange={(e) => set({ about: e.target.value })} />}
                </F>
                <div className="rot-form-2">
                  <F label="Tempo total">{(id) => <input id={id} value={d.stats.tempo} maxLength={40} onChange={(e) => setStats({ tempo: e.target.value })} placeholder="4 a 6 horas" />}</F>
                  <F label="Ideal para">{(id) => <input id={id} value={d.stats.ideal} maxLength={60} onChange={(e) => setStats({ ideal: e.target.value })} placeholder="Casal, amigos, família…" />}</F>
                </div>
                <div className="rot-field">
                  <span className="rot-label">Investimento</span>
                  <div className="seg" role="radiogroup" aria-label="Investimento">
                    {INVEST_LABELS.map((l, i) => <button key={l} type="button" role="radio" aria-checked={d.stats.invest === i} className={d.stats.invest === i ? "on" : ""} onClick={() => setStats({ invest: i })}>{i ? "$".repeat(i) + " " : ""}{l}</button>)}
                  </div>
                </div>
              </section>
            )}

            {tab === "paradas" && (
              <section className="rot-form">
                {errors.steps && <div className="auth-alert" role="alert"><Icon name="x" size={14} /> {errors.steps}</div>}
                <ol className="stop-list">
                  {d.steps.map((s, i) => (
                    <li key={i} className="stop-card">
                      <div className="stop-head">
                        <span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>
                        <strong>{s.title || "Nova parada"}</strong>
                        <div className="stop-tools">
                          <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></button>
                          <button type="button" aria-label="Descer" disabled={i === d.steps.length - 1} onClick={() => move(i, 1)}><Icon name="chevron" size={16} /></button>
                          <button type="button" aria-label="Remover parada" onClick={() => remove(i)}><Icon name="x" size={16} /></button>
                        </div>
                      </div>
                      <PlacePicker value={s.place} exclude={usedPlaces}
                        onChange={(pid) => { const p = placeById(pid); setStep(i, p ? { place: pid, title: !s.title || placeById(s.place)?.name === s.title ? p.name : s.title, sub: s.sub || p.sub || "" } : { place: "" }); }} />
                      <div className="rot-form-3">
                        <F label="Horário">{(id) => <input id={id} value={s.time} maxLength={30} onChange={(e) => setStep(i, { time: e.target.value })} placeholder="10h – 12h" />}</F>
                        <F label="Título da parada" required>{(id) => <input id={id} value={s.title} maxLength={90} onChange={(e) => setStep(i, { title: e.target.value })} placeholder={s.place ? "" : "Ex.: Piquenique no parque"} />}</F>
                        <F label="Subtítulo">{(id) => <input id={id} value={s.sub} maxLength={90} onChange={(e) => setStep(i, { sub: e.target.value })} placeholder="Café da manhã sem pressa" />}</F>
                      </div>
                      <F label="Anotação">{(id) => <textarea id={id} rows={2} maxLength={400} value={s.desc} onChange={(e) => setStep(i, { desc: e.target.value })} placeholder="O que pedir, onde sentar, quanto tempo ficar…" />}</F>
                      <label className="auth-check"><input type="checkbox" checked={s.optional} onChange={(e) => setStep(i, { optional: e.target.checked })} /><span>Parada opcional</span></label>
                    </li>
                  ))}
                </ol>
                <div className="stop-add">
                  <button type="button" className="btn-outline" onClick={() => addStep()}><Icon name="pin" size={16} /> Adicionar parada</button>
                  <span className="auth-hint">{d.steps.length} de {LIMITS.steps} paradas</span>
                </div>
                {favPlaces.length > 0 && (
                  <div className="stop-faves">
                    <span className="rot-label">Dos seus favoritos</span>
                    <div className="stop-fave-list">
                      {favPlaces.map(p => (
                        <button key={p.id} type="button" className="stop-fave" onClick={() => addStep(stepFromPlace(p))}>
                          <ImageSlot className="stop-fave-img" src={placeImg(p.id)} compact /><span><strong>{p.name}</strong><em>{p.bairro}</em></span><Icon name="arrow" size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {tab === "dicas" && (
              <section className="rot-form">
                <F label="Minhas anotações" hint="Aparece em destaque na página do roteiro.">{(id) => <textarea id={id} rows={3} maxLength={300} value={d.tips.dica} onChange={(e) => setTips({ dica: e.target.value })} />}</F>
                <div className="rot-form-2">
                  <F label="Melhor horário">{(id) => <input id={id} value={d.tips.horario} maxLength={60} onChange={(e) => setTips({ horario: e.target.value })} placeholder="Sábado de manhã" />}</F>
                  <F label="Como chegar">{(id) => <input id={id} value={d.tips.comoChegar} maxLength={120} onChange={(e) => setTips({ comoChegar: e.target.value })} placeholder="Metrô até a primeira parada, depois a pé" />}</F>
                </div>
                <F label="Não esqueça">{(id) => <textarea id={id} rows={2} maxLength={200} value={d.tips.lembrete} onChange={(e) => setTips({ lembrete: e.target.value })} placeholder="Protetor solar, canga, dinheiro para a feira…" />}</F>
              </section>
            )}
          </div>

          <aside className="rot-editor-side">
            <div className="rot-side-card">
              <h2 className="h2t">Resumo</h2>
              <ol className="rot-side-steps">
                {d.steps.map((s, i) => (
                  <li key={i}><span className="step-num" style={{ "--pin": STEP_COLORS[i % STEP_COLORS.length] }}>{i + 1}</span>
                    <span><strong>{s.title || "Sem título"}</strong><em>{[s.time, s.place ? placeById(s.place)?.bairro : "parada livre", s.optional && "opcional"].filter(Boolean).join(" · ")}</em></span></li>
                ))}
              </ol>
              <MapArt className="rot-side-map" pins={pins} route />
              {msg && <div className="auth-alert" role="alert"><Icon name="x" size={14} /> {msg}</div>}
              <button className="btn-pill btn-lg btn-block" disabled={busy} onClick={save}>{busy ? "Salvando…" : isNew ? "Criar roteiro" : "Salvar alterações"}</button>
              <button className="btn-outline btn-block" onClick={cancel}>Cancelar</button>
              {dirty && <p className="auth-hint auth-center">Alterações não salvas</p>}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}

let fid = 0;
function F({ label, hint, error, required, children }) {
  const [id] = useState(() => "rf" + ++fid);
  return (
    <div className={"auth-field" + (error ? " has-error" : "")}>
      <label htmlFor={id}>{label}{required && <i className="req">*</i>}</label>
      {children(id)}
      {error ? <span className="auth-error" role="alert">{error}</span> : hint ? <span className="auth-hint">{hint}</span> : null}
    </div>
  );
}

// Busca de lugares da curadoria para vincular à parada
function PlacePicker({ value, onChange, exclude }) {
  const cur = value && placeById(value);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [id] = useState(() => "pp" + ++fid);
  const list = PLACES.filter(p => (p.id === value || !exclude.has(p.id)) && (!q || plain(`${p.name} ${p.bairro} ${p.sub} ${p.type}`).includes(plain(q)))).slice(0, 8);
  const pick = (p) => { onChange(p ? p.id : ""); setQ(""); setOpen(false); };
  return (
    <div className="auth-field place-picker">
      <label htmlFor={id}>Lugar</label>
      {cur && !open ? (
        <div className="pp-chosen">
          <ImageSlot className="pp-img" src={placeImg(cur.id)} compact />
          <span><strong>{cur.name}</strong><em>{cur.sub} · {cur.bairro}</em></span>
          <button type="button" className="auth-link" onClick={() => setOpen(true)}>Trocar</button>
          <button type="button" className="auth-link" onClick={() => pick(null)}>Remover</button>
        </div>
      ) : (
        <div className="pp-box">
          <input id={id} value={q} autoComplete="off" role="combobox" aria-expanded={open} aria-controls={id + "-l"}
            placeholder="Busque um lugar da curadoria (ou deixe em branco para uma parada livre)"
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, list.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
              else if (e.key === "Enter" && list[active]) { e.preventDefault(); pick(list[active]); }
              else if (e.key === "Escape") setOpen(false);
            }} />
          {open && (
            <ul className="pp-list" id={id + "-l"} role="listbox">
              {list.map((p, i) => (
                <li key={p.id} role="option" aria-selected={i === active} className={i === active ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); pick(p); }} onMouseEnter={() => setActive(i)}>
                  <ImageSlot className="pp-img" src={placeImg(p.id)} compact /><span><strong>{p.name}</strong><em>{p.sub} · {p.bairro}</em></span>
                </li>
              ))}
              {!list.length && <li className="pp-empty">Nenhum lugar encontrado. Use uma parada livre.</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
