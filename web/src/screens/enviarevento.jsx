// Enviar evento (/perfil/eventos/novo): o usuário logado sugere um evento para a agenda.
// Segue os grupos do cadastro do painel; o evento entra em revisão e só aparece depois que a equipe aprova.
import { useState } from "react";
import { EVENT_CATEGORIES, AGE_RATINGS, VIBE_ORDER, CITIES, PLACES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { Crumbs, VibePill, EventCard, Footer } from "../components/site.jsx";
import { useNav, useAccount } from "../nav.js";
import { submitEvent } from "../account.js";
import { blankSubmission, cleanSubmission, submissionDays } from "../../shared/eventsubmit.js";
import { compressImage } from "../admin/kit.jsx";
import { dayLabel, hoursLabel, periodLines, priceLabel } from "../events.js";

let fid = 0;
function F({ label, hint, error, required, children }) {
  const [id] = useState(() => "ev" + ++fid);
  return (
    <div className={"auth-field" + (error ? " has-error" : "")}>
      <label htmlFor={id}>{label}{required && <i className="req">*</i>}</label>
      {children(id)}
      {error ? <span className="auth-error" role="alert">{error}</span> : hint ? <span className="auth-hint">{hint}</span> : null}
    </div>
  );
}
const TABS = [["conteudo", "Conteúdo", ["title", "desc", "contact"]], ["data", "Data e ingressos", ["dateFrom", "dateTo", "timeFrom", "timeTo", "perDay", "price", "ticketUrl"]],
  ["classificacao", "Classificação", ["category", "affs"]], ["local", "Local", ["venueName", "end", "city", "whatsapp"]], ["foto", "Foto", ["image"]]];
const nextSat = () => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.toLocaleDateString("sv-SE"); };

export function EnviarEvento() {
  const nav = useNav();
  const { user } = useAccount();
  const [d, setD] = useState(() => { const s = nextSat(); return { ...blankSubmission(), dateFrom: s, dateTo: s, timeFrom: "20:00", timeTo: "23:00", city: user?.city || "", contact: user?.email || "" }; });
  const [tab, setTab] = useState("conteudo");
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const [image, setImage] = useState("");
  // editar um campo limpa o erro dele
  const ERR_OF = { price: ["price"], ticket: ["ticketUrl"], days: ["perDay"], dateFrom: ["dateFrom", "dateTo"] };
  const set = (patch) => {
    setD(x => ({ ...x, ...patch }));
    setErrors(e => { const n = { ...e }; Object.keys(patch).forEach(k => (ERR_OF[k] || [k]).forEach(x => delete n[x])); return n; });
    setMsg("");
  };
  const setPrice = (patch) => set({ price: { ...d.price, ...patch } });
  const setTicket = (patch) => set({ ticket: { ...d.ticket, ...patch } });
  const days = submissionDays(d);
  const places = PLACES.filter(p => !d.city || p.city === d.city);
  const venue = PLACES.find(p => p.id === d.venue);

  function pickVenue(id) {
    const p = PLACES.find(x => x.id === id);
    set(p ? { venue: p.id, venueName: "", end: p.end || "", bairro: p.bairro || "", city: p.city || d.city, cep: p.cep || "", whatsapp: d.whatsapp || p.whatsapp || "", insta: d.insta || p.insta || "" } : { venue: "" });
  }
  function setDay(date, patch) {
    const cur = days.find(x => x.date === date);
    set({ days: { ...d.days, [date]: { from: cur.from, to: cur.to, ...patch } } });
  }
  async function pickImage(f) {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) return setErrors(e => ({ ...e, image: "Arquivo acima de 15 MB." }));
    try { setImage(await compressImage(f, 1600, 0.8)); setErrors(({ image: _, ...e }) => e); }
    catch { setErrors(e => ({ ...e, image: "Não foi possível ler essa imagem." })); }
  }
  async function send() {
    setMsg(""); setErrors({});
    const today = new Date().toLocaleDateString("sv-SE");
    const local = cleanSubmission(d, { categories: EVENT_CATEGORIES, vibes: VIBE_ORDER.map(id => ({ id })), places: PLACES, cities: CITIES, today }).errors;
    if (Object.keys(local).length) { setErrors(local); setTab(TABS.find(t => t[2].some(k => local[k]))?.[0] || tab); return; }
    setBusy(true);
    const r = await submitEvent({ ...d, ...(image ? { image } : {}) });
    setBusy(false);
    if (r.event) { setSent(r.event); window.scrollTo(0, 0); return; }
    if (r.fields) { setErrors(r.fields); setTab(TABS.find(t => t[2].some(k => r.fields[k]))?.[0] || tab); }
    setMsg(r.message || "Confira os campos destacados.");
  }

  if (sent) {
    return (
      <main className="home2">
        <div className="shell rot-editor">
          <div className="ev-sent">
            <span className="ev-sent-icon"><Icon name="check" size={28} /></span>
            <h1 className="page-title page-title-md">Evento enviado!</h1>
            <p>Recebemos “{sent.title}”. A equipe do Onde Sair vai analisar e, se estiver tudo certo, ele entra na agenda. Você acompanha a situação em <strong>Meus eventos</strong>.</p>
            <div className="row gap-12 wrap">
              <button className="btn-pill" onClick={() => nav("perfil", { tab: "meusEventos" })}>Ver meus eventos</button>
              <button className="btn-outline" onClick={() => nav("eventos")}>Voltar para a agenda</button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const tabErr = (keys) => keys.some(k => errors[k]);
  const preview = { ...d, id: "preview", title: d.title || "Nome do evento", tagline: d.tagline || "Frase de destaque do evento.", venueName: venue?.name || d.venueName, startAt: days[0] ? `${days[0].date}T${days[0].from || "00:00"}` : "", endAt: "" };

  return (
    <main className="home2">
      <div className="shell rot-editor">
        <Crumbs items={[["Início", "home"], ["Meus eventos", "perfil", { tab: "meusEventos" }], ["Enviar evento"]]} />
        <header className="rot-editor-head">
          <h1 className="page-title page-title-md">Enviar evento</h1>
          <p className="rot-editor-from"><Icon name="calendar" size={16} /> Conte sobre o evento: a equipe revisa antes de publicar na agenda.</p>
        </header>

        <div className="rot-editor-grid">
          <div>
            <div className="underline-tabs" role="tablist">
              {TABS.map(([k, l, keys]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{tabErr(keys) && <span className="tab-err" aria-label="com erro">!</span>}</button>
              ))}
            </div>

            {tab === "conteudo" && (
              <section className="rot-form">
                <F label="Nome do evento" required error={errors.title}>{(id) => <input id={id} value={d.title} maxLength={70} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Feira de vinil e café" />}</F>
                <F label="Frase de destaque" hint="Uma linha que resume o evento.">{(id) => <input id={id} value={d.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} />}</F>
                <F label="Sobre o evento" required error={errors.desc} hint="Atrações, programação, o que esperar e o que levar.">{(id) => <textarea id={id} rows={6} maxLength={900} value={d.desc} onChange={(e) => set({ desc: e.target.value })} />}</F>
                <F label="Seu contato" required error={errors.contact} hint="E-mail ou telefone para a equipe falar com você. Não aparece no site.">{(id) => <input id={id} value={d.contact} maxLength={120} onChange={(e) => set({ contact: e.target.value })} />}</F>
              </section>
            )}

            {tab === "data" && (
              <section className="rot-form">
                <div className="rot-form-2">
                  <F label="Primeiro dia" required error={errors.dateFrom}>{(id) => <input id={id} type="date" value={d.dateFrom} onChange={(e) => set({ dateFrom: e.target.value, dateTo: d.dateTo < e.target.value ? e.target.value : d.dateTo })} />}</F>
                  <F label="Último dia" required error={errors.dateTo} hint="Igual ao primeiro para eventos de um dia.">{(id) => <input id={id} type="date" value={d.dateTo} min={d.dateFrom} onChange={(e) => set({ dateTo: e.target.value })} />}</F>
                  <F label="Abre às" required error={errors.timeFrom}>{(id) => <input id={id} type="time" value={d.timeFrom} onChange={(e) => set({ timeFrom: e.target.value })} />}</F>
                  <F label="Fecha às" error={errors.timeTo} hint="Depois da meia-noite? Use o horário do dia seguinte.">{(id) => <input id={id} type="time" value={d.timeTo} onChange={(e) => set({ timeTo: e.target.value })} />}</F>
                </div>
                {days.length > 1 && (
                  <label className="check-row"><input type="checkbox" checked={d.perDay} onChange={(e) => set({ perDay: e.target.checked })} /><span>Dias com horários diferentes</span></label>
                )}
                {errors.perDay && <span className="auth-error" role="alert">{errors.perDay}</span>}
                {d.perDay && days.length > 1 && (
                  <ul className="ev-day-hours">
                    {days.map(x => (
                      <li key={x.date}><span>{dayLabel(x.date)}</span>
                        <input type="time" value={x.from} aria-label={`Abre às · ${dayLabel(x.date)}`} onChange={(e) => setDay(x.date, { from: e.target.value })} />
                        <span>às</span>
                        <input type="time" value={x.to} aria-label={`Fecha às · ${dayLabel(x.date)}`} onChange={(e) => setDay(x.date, { to: e.target.value })} /></li>
                    ))}
                  </ul>
                )}
                {days.length > 0 && <p className="auth-hint">No site: {periodLines(d).join(" ")}{days.length === 1 ? " · " + hoursLabel(days[0]) : ""}</p>}
                <F label="Abertura da casa" hint="Opcional.">{(id) => <input id={id} value={d.doors} maxLength={20} onChange={(e) => set({ doors: e.target.value })} placeholder="19h30" />}</F>

                <label className="check-row"><input type="checkbox" checked={d.price.free} onChange={(e) => setPrice({ free: e.target.checked })} /><span>Evento gratuito</span></label>
                {!d.price.free && (
                  <div className="rot-form-2">
                    <F label="A partir de (R$)" required error={errors.price}>{(id) => <input id={id} type="number" min={0} step="0.01" value={d.price.from} onChange={(e) => setPrice({ from: e.target.value })} />}</F>
                    <F label="Até (R$)" hint="Opcional, para faixas de preço.">{(id) => <input id={id} type="number" min={0} step="0.01" value={d.price.to} onChange={(e) => setPrice({ to: e.target.value })} />}</F>
                  </div>
                )}
                <F label="Observação sobre o valor">{(id) => <input id={id} value={d.price.note} maxLength={90} onChange={(e) => setPrice({ note: e.target.value })} placeholder="Ex.: Meia-entrada para estudantes" />}</F>
                <p className="auth-hint">No site: {priceLabel(d)}</p>
                <label className="check-row"><input type="checkbox" checked={d.ticket.required} onChange={(e) => setTicket({ required: e.target.checked })} /><span>Precisa de ingresso (mesmo se for gratuito)</span></label>
                <F label="Link da venda" error={errors.ticketUrl} hint="Sympla, Eventim, Ingresse ou o site do evento.">{(id) => <input id={id} value={d.ticket.url} maxLength={300} onChange={(e) => setTicket({ url: e.target.value.trim() })} placeholder="https://" />}</F>
                <F label="Classificação etária">{(id) => <select id={id} value={d.age} onChange={(e) => set({ age: e.target.value })}>{AGE_RATINGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</F>
              </section>
            )}

            {tab === "classificacao" && (
              <section className="rot-form">
                <F label="Categoria" required error={errors.category}>{(id) => (
                  <select id={id} value={d.category} onChange={(e) => set({ category: e.target.value })}>
                    <option value="">Escolha a categoria</option>
                    {EVENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>)}</F>
                <div className={"auth-field" + (errors.affs ? " has-error" : "")}>
                  <span className="ev-label">Vibes<i className="req">*</i></span>
                  <div className="hero2-vibes">{VIBE_ORDER.map(a => <VibePill key={a} aff={a} size="sm" active={d.affs.includes(a)} onClick={() => set({ affs: d.affs.includes(a) ? d.affs.filter(x => x !== a) : [...d.affs, a] })} />)}</div>
                  {errors.affs ? <span className="auth-error" role="alert">{errors.affs}</span> : <span className="auth-hint">Marque as vibes que combinam com o evento.</span>}
                </div>
                <F label="Assuntos" hint="Separados por vírgula. Ex.: Jazz, Cerveja artesanal.">{(id) => <input id={id} value={d.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map(s => s.trimStart()).slice(0, 8) })} />}</F>
              </section>
            )}

            {tab === "local" && (
              <section className="rot-form">
                <F label="Cidade" required error={errors.city}>{(id) => (
                  <select id={id} value={d.city} onChange={(e) => set({ city: e.target.value, venue: "" })}>
                    <option value="">Escolha a cidade</option>
                    {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>)}</F>
                <F label="Lugar" hint={venue ? "O endereço foi preenchido com o do lugar. Edite se precisar." : "Se for num lugar da curadoria, escolha aqui; senão, deixe “Outro local”."}>{(id) => (
                  <select id={id} value={d.venue} onChange={(e) => pickVenue(e.target.value)}>
                    <option value="">Outro local</option>
                    {places.map(p => <option key={p.id} value={p.id}>{p.name} · {p.bairro}</option>)}
                  </select>)}</F>
                {!venue && <F label="Nome do local" required error={errors.venueName}>{(id) => <input id={id} value={d.venueName} maxLength={80} onChange={(e) => set({ venueName: e.target.value })} placeholder="Ex.: Praça Coronel Fernando Prestes" />}</F>}
                <F label="Endereço" required error={errors.end}>{(id) => <input id={id} value={d.end} maxLength={160} onChange={(e) => set({ end: e.target.value })} placeholder="Rua, número" />}</F>
                <div className="rot-form-2">
                  <F label="Bairro">{(id) => <input id={id} value={d.bairro} maxLength={60} onChange={(e) => set({ bairro: e.target.value })} />}</F>
                  <F label="CEP">{(id) => <input id={id} value={d.cep} maxLength={9} onChange={(e) => set({ cep: e.target.value.replace(/[^\d-]/g, "") })} />}</F>
                  <F label="WhatsApp" error={errors.whatsapp} hint="Opcional, com DDD.">{(id) => <input id={id} type="tel" value={d.whatsapp} maxLength={20} onChange={(e) => set({ whatsapp: e.target.value })} />}</F>
                  <F label="Instagram do evento" hint="Opcional.">{(id) => <input id={id} value={d.insta} maxLength={40} onChange={(e) => set({ insta: e.target.value })} placeholder="@" />}</F>
                </div>
              </section>
            )}

            {tab === "foto" && (
              <section className="rot-form">
                <div className={"auth-field" + (errors.image ? " has-error" : "")}>
                  <span className="ev-label">Imagem do evento</span>
                  <label className="ev-photo">
                    {image ? <img src={image} alt="Prévia da imagem do evento" /> : <span><Icon name="image" size={28} /> Escolher imagem</span>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickImage(e.target.files[0])} />
                  </label>
                  {errors.image ? <span className="auth-error" role="alert">{errors.image}</span> : <span className="auth-hint">Opcional. Foto ou arte horizontal, sem textos pequenos.</span>}
                  {image && <button type="button" className="link-btn" onClick={() => setImage("")}>Remover imagem</button>}
                </div>
              </section>
            )}
          </div>

          <aside className="ev-side">
            <span className="ev-label">Prévia do card</span>
            <div aria-hidden="true" className="ev-preview">{<EventCard e={preview} />}</div>
            {msg && <p className="auth-error" role="alert">{msg}</p>}
            <button className="btn-pill btn-lg btn-block" disabled={busy} onClick={send}>{busy ? "Enviando…" : "Enviar para aprovação"}</button>
            <p className="auth-hint">A equipe do Onde Sair revisa todos os eventos antes de publicar. Você acompanha em Meus eventos.</p>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  );
}
