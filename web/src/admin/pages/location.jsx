// Localização do lugar: endereço com autocompletar do Google Maps (Places API New),
// cidade e bairro preenchidos a partir do endereço, com cadastro na hora (sem duplicidade).
import { useEffect, useMemo, useRef, useState } from "react";
import { AIcon, Btn, Field } from "../kit.jsx";

// ---------------------------------------------------------------------
// Normalização (comparação sem acento, caixa ou espaços extras)
// ---------------------------------------------------------------------
export const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export const tidy = (s = "") => s.replace(/\s+/g, " ").trim();
export const findCity = (cities, name, uf) => cities.find(c => norm(c.name) === norm(name) && (!uf || !c.sub || norm(c.sub) === norm(uf)));
export const findBairro = (city, name) => (city?.bairros || []).find(b => norm(b) === norm(name));

// ---------------------------------------------------------------------
// Carregamento do Google Maps JS (uma vez por página)
// ---------------------------------------------------------------------
let mapsPromise = null;
export function loadPlaces(key) {
  if (window.google?.maps?.importLibrary) return window.google.maps.importLibrary("places");
  if (!key) return Promise.reject(new Error("sem-chave"));
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      window.__osMapsReady = () => resolve();
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=pt-BR&region=BR&callback=__osMapsReady`;
      s.async = true;
      s.onerror = () => { mapsPromise = null; reject(new Error("falha-ao-carregar")); };
      document.head.appendChild(s);
    }).then(() => window.google.maps.importLibrary("places"));
  }
  return mapsPromise;
}

// Converte o resultado do Google no formato do lugar
export function parsePlace(place) {
  const comp = (type, short) => {
    const c = (place.addressComponents || []).find(x => x.types.includes(type));
    return c ? (short ? c.shortText : c.longText) : "";
  };
  const street = [comp("route"), comp("street_number")].filter(Boolean).join(", ");
  return {
    end: street || (place.formattedAddress || "").split(" - ")[0],
    bairro: comp("sublocality_level_1") || comp("sublocality") || comp("neighborhood"),
    city: comp("administrative_area_level_2") || comp("locality"),
    uf: comp("administrative_area_level_1", true),
    cep: comp("postal_code"),
    formatted: place.formattedAddress || "",
    geo: place.location ? { lat: +place.location.lat().toFixed(6), lng: +place.location.lng().toFixed(6) } : null,
    placeId: place.id || "",
  };
}

// ---------------------------------------------------------------------
// Campo de endereço com sugestões
// ---------------------------------------------------------------------
export function AddressAutocomplete({ label, value, onChange, onPick, apiKey, error, required, hint }) {
  const [status, setStatus] = useState("loading");     // loading | ready | off | error
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const lib = useRef(null), token = useRef(null), timer = useRef(null), seq = useRef(0);

  useEffect(() => {
    let alive = true;
    loadPlaces(apiKey)
      .then((l) => { if (alive) { lib.current = l; setStatus("ready"); } })
      .catch((e) => { if (alive) setStatus(e.message === "sem-chave" ? "off" : "error"); });
    return () => { alive = false; };
  }, [apiKey]);

  function search(text) {
    clearTimeout(timer.current);
    seq.current++;                                   // descarta respostas de buscas anteriores
    setItems([]); setOpen(false); setActive(-1);     // não deixa sugestões antigas clicáveis enquanto digita
    if (status !== "ready" || text.trim().length < 3) return;
    timer.current = setTimeout(async () => {
      const my = ++seq.current;
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = lib.current;
        token.current ||= new AutocompleteSessionToken();
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text, sessionToken: token.current, includedRegionCodes: ["br"], language: "pt-BR", region: "br",
        });
        if (my !== seq.current) return;
        setItems(suggestions.filter(s => s.placePrediction).slice(0, 6));
        setOpen(true); setActive(-1);
      } catch { if (my === seq.current) { setItems([]); setOpen(false); } }
    }, 250);
  }

  async function pick(s) {
    setOpen(false); setBusy(true);
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ["addressComponents", "formattedAddress", "location", "id"] });
      token.current = null;                                  // encerra a sessão de cobrança do Google
      onPick(parsePlace(place));
    } catch { setStatus("error"); }
    setBusy(false);
  }

  function onKey(e) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + items.length) % items.length); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Escape") setOpen(false);
  }

  const note = {
    off: "Autocompletar desligado: cadastre a chave do Google Maps em Configurações › Integrações.",
    error: "Não foi possível falar com o Google Maps. Confira a chave e as APIs liberadas; dá pra digitar o endereço à mão.",
  }[status];

  return (
    <Field label={label} required={required} error={error} hint={note || hint}>
      {(id) => (
        <div className="a-combo">
          <div className="a-input-wrap has-icon">
            <AIcon name={busy ? "clock" : "pin"} size={16} />
            <input id={id} className="a-input" value={value || ""} autoComplete="off"
              role="combobox" aria-expanded={open} aria-controls={id + "-list"} aria-autocomplete="list" aria-invalid={!!error}
              aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
              placeholder={status === "ready" ? "Comece a digitar o endereço…" : "Rua, número"}
              onChange={(e) => { onChange(e.target.value); search(e.target.value); }}
              onKeyDown={onKey} onFocus={() => items.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
          </div>
          {open && items.length > 0 && (
            <ul className="a-combo-list" id={id + "-list"} role="listbox">
              {items.map((s, i) => {
                const p = s.placePrediction;
                return (
                  <li key={p.placeId || i} id={`${id}-opt-${i}`} role="option" aria-selected={i === active} className={i === active ? "on" : ""}
                    onMouseDown={(e) => { e.preventDefault(); pick(s); }}>
                    <AIcon name="pin" size={14} />
                    <span><strong>{String(p.mainText ?? p.text)}</strong>{p.secondaryText && <em>{String(p.secondaryText)}</em>}</span>
                  </li>
                );
              })}
              <li className="a-combo-foot" aria-hidden="true">Sugestões do Google</li>
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------------
// Campo que escolhe um item da lista ou cadastra um novo (sem duplicidade)
// ---------------------------------------------------------------------
export function CreatableField({ label, required, error, hint, value, options, onSelect, onCreate, createLabel, placeholder, disabled, extra }) {
  const [text, setText] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => { setText(value || ""); }, [value]);

  const q = norm(text);
  const list = useMemo(() => options.filter(o => !q || norm(o.label).includes(q) || norm(o.value) === q).slice(0, 50), [options, q]);
  const exact = options.find(o => norm(o.label) === q);
  const canCreate = !!q && !exact && !!onCreate;
  const rows = [...list.map(o => ({ type: "opt", o })), ...(canCreate ? [{ type: "new" }] : [])];

  function choose(row) {
    setOpen(false);
    if (row.type === "new") return onCreate(tidy(text));
    setText(row.o.label); onSelect(row.o.value);
  }
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive(Math.min(active + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (open && rows[active]) choose(rows[active]); else if (exact) choose({ type: "opt", o: exact }); }
    else if (e.key === "Escape") setOpen(false);
  }
  // ao sair do campo: texto igual a um item existente seleciona; senão volta ao valor salvo
  function onBlur() {
    setTimeout(() => {
      setOpen(false);
      if (exact && exact.value !== value) onSelect(exact.value);
      else if (!exact && !canCreate) setText(value || "");
    }, 150);
  }

  return (
    <Field label={label} required={required} error={error} hint={hint}>
      {(id) => (
        <div className="a-combo">
          <div className="a-select">
            <input id={id} className="a-input" value={text} disabled={disabled} autoComplete="off" placeholder={placeholder}
              role="combobox" aria-expanded={open} aria-controls={id + "-list"} aria-autocomplete="list" aria-invalid={!!error}
              onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0); }}
              onFocus={() => setOpen(true)} onKeyDown={onKey} onBlur={onBlur} />
            <AIcon name="chevron" size={16} />
          </div>
          {open && !disabled && rows.length > 0 && (
            <ul className="a-combo-list" id={id + "-list"} role="listbox">
              {rows.map((r, i) => r.type === "opt"
                ? <li key={r.o.value} role="option" aria-selected={r.o.value === value} className={(i === active ? "on" : "") + (r.o.value === value ? " sel" : "")}
                    onMouseDown={(e) => { e.preventDefault(); choose(r); }} onMouseEnter={() => setActive(i)}>
                    <span><strong>{r.o.label}</strong>{r.o.note && <em>{r.o.note}</em>}</span>
                    {r.o.value === value && <AIcon name="check" size={14} />}
                  </li>
                : <li key="new" role="option" aria-selected={false} className={"a-combo-new" + (i === active ? " on" : "")}
                    onMouseDown={(e) => { e.preventDefault(); choose(r); }} onMouseEnter={() => setActive(i)}>
                    <AIcon name="plus" size={14} /> <span>{createLabel(tidy(text))}</span>
                  </li>)}
            </ul>
          )}
          {extra}
        </div>
      )}
    </Field>
  );
}

// Aviso quando o endereço trouxe cidade/bairro que ainda não existem
export function Pending({ text, action, onClick }) {
  return (
    <div className="a-pending" role="status">
      <AIcon name="alert" size={14} /> <span>{text}</span>
      <Btn size="sm" icon="plus" onClick={onClick}>{action}</Btn>
    </div>
  );
}
