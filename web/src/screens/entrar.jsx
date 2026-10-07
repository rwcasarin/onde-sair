// Entrar / Criar conta / Boas-vindas — contas de visitantes
import { useState } from "react";
import { CITIES, VIBE_ORDER, AFFINITIES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { OSIcon } from "../components/brand.jsx";
import { VibePill } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { account, signup, login, updateAccount } from "../account.js";
import { go, href } from "../router.js";

function Field({ id, label, error, hint, children, aside }) {
  return (
    <div className={"auth-field" + (error ? " has-error" : "")}>
      <label htmlFor={id}>{label}{aside}</label>
      {children}
      {error ? <span className="auth-error" role="alert">{error}</span> : hint ? <span className="auth-hint">{hint}</span> : null}
    </div>
  );
}

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

export function Entrar({ mode: initialMode = "entrar", onDone }) {
  const nav = useNav();
  // boas-vindas só faz sentido logado; quem já entrou não precisa do formulário
  const mode = initialMode === "boas-vindas" ? (account.user ? "boas-vindas" : "entrar") : account.user ? "logado" : initialMode;

  if (mode === "logado") {
    return (
      <AuthShell>
        <div className="auth-card">
          <h1>Você já está na sua conta</h1>
          <p className="auth-sub">Entrou como <strong>{account.user.name}</strong>.</p>
          <button className="btn-pill btn-lg btn-block" onClick={() => nav("perfil")}>Ir para o meu perfil</button>
        </div>
      </AuthShell>
    );
  }

  if (mode === "boas-vindas") return <AuthShell><Welcome onDone={(u) => onDone(u, true)} /></AuthShell>;

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Acesso">
          <a role="tab" href={href("/entrar")} data-route="/entrar" aria-selected={mode === "entrar"} className={mode === "entrar" ? "on" : ""}>Entrar</a>
          <a role="tab" href={href("/cadastro")} data-route="/cadastro" aria-selected={mode === "cadastro"} className={mode === "cadastro" ? "on" : ""}>Criar conta</a>
        </div>

        <h1>{mode === "entrar" ? "Que bom te ver de novo" : "Crie sua conta grátis"}</h1>
        <p className="auth-sub">{mode === "entrar" ? "Entre para ver seus salvos, rolês e dicas pelas suas vibes." : "Salve lugares, monte rolês com amigos e receba dicas que combinam com você."}</p>

        {mode === "entrar"
          ? <LoginForm onDone={(u) => (u.onboarded ? onDone(u, false) : go("/boas-vindas"))} onSignup={() => go("/cadastro")} />
          : <SignupForm onDone={() => go("/boas-vindas")} onLogin={() => go("/entrar")} />}
      </div>
    </AuthShell>
  );
}

function AuthShell({ children }) {
  return (
    <main className="auth">
      <section className="auth-art" aria-hidden="true">
        <ImageSlot className="auth-photo" src="images/home/entrar.jpg" hint="Foto de pessoas curtindo a cidade · ~1200×1400" />
        <div className="auth-art-copy">
          <span className="auth-art-mark"><OSIcon /></span>
          <h2>Sua cidade tem mais do que você imagina.</h2>
          <ul>
            <li><Icon name="heart" size={18} fill /> Salve lugares e roteiros</li>
            <li><Icon name="users" size={18} /> Monte rolês com os amigos</li>
            <li><Icon name="sparkle" size={18} fill /> Dicas pelas suas vibes</li>
          </ul>
        </div>
        <svg className="auth-geo" viewBox="0 0 240 120">
          <circle cx="40" cy="80" r="40" fill="var(--c-yellow)" />
          <rect x="80" y="40" width="80" height="80" fill="var(--c-teal)" />
          <polygon points="80,40 160,80 80,120" fill="var(--c-magenta)" />
          <path d="M160,120 A80,80 0 0 1 240,40 L240,120 Z" fill="var(--c-yellow)" />
        </svg>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}

function LoginForm({ onDone, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const x = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) x.email = "Informe um e-mail válido.";
    if (!password) x.password = "Informe sua senha.";
    setErr(x); setMsg("");
    if (Object.keys(x).length) return;
    setBusy(true);
    const r = await login(email, password);
    setBusy(false);
    if (r.user) onDone(r.user); else setMsg(r.message);
  }

  if (forgot) {
    return (
      <div className="auth-form">
        <p className="auth-info"><Icon name="bulb" size={16} /> A recuperação de senha por e-mail chega em breve. Enquanto isso, fale com a gente pelo contato do site que a gente ajuda.</p>
        <button type="button" className="btn-outline btn-block" onClick={() => setForgot(false)}>Voltar para o login</button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {msg && <div className="auth-alert" role="alert"><Icon name="x" size={14} /> {msg}</div>}
      <Field id="li-email" label="E-mail" error={err.email}>
        <input id="li-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err.email} placeholder="voce@email.com" />
      </Field>
      <Field id="li-pass" label="Senha" error={err.password}
        aside={<button type="button" className="auth-link" onClick={() => setForgot(true)}>Esqueci a senha</button>}>
        <div className="auth-pass">
          <input id="li-pass" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!err.password} />
          <button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)}><Icon name="eye" size={18} /></button>
        </div>
      </Field>
      <button type="submit" className="btn-pill btn-lg btn-block" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      <p className="auth-switch">Ainda não tem conta? <button type="button" className="auth-link" onClick={onSignup}>Crie grátis</button></p>
    </form>
  );
}

function SignupForm({ onDone, onLogin }) {
  const { name: cityLabel } = useCity();
  const [f, setF] = useState({ name: "", email: "", password: "", city: (CITIES.find(c => c.name === cityLabel) || CITIES[0])?.id, terms: false, marketing: true });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (p) => setF({ ...f, ...p });
  const s = strength(f.password);

  async function submit(e) {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = "Conte como você quer ser chamada(o).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) x.email = "Informe um e-mail válido.";
    if (f.password.length < 8) x.password = "Use pelo menos 8 caracteres.";
    if (!f.terms) x.terms = "Para criar a conta, aceite os termos.";
    setErr(x); setMsg("");
    if (Object.keys(x).length) return;
    setBusy(true);
    const r = await signup(f);
    setBusy(false);
    if (r.user) return onDone(r.user);
    if (r.fields) setErr(r.fields); else setMsg(r.message || "Não foi possível criar a conta agora.");
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {msg && <div className="auth-alert" role="alert"><Icon name="x" size={14} /> {msg}</div>}
      <Field id="su-name" label="Como podemos te chamar?" error={err.name}>
        <input id="su-name" autoComplete="given-name" value={f.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!err.name} />
      </Field>
      <Field id="su-email" label="E-mail" error={err.email}>
        <input id="su-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} aria-invalid={!!err.email} placeholder="voce@email.com" />
      </Field>
      <Field id="su-pass" label="Crie uma senha" error={err.password} hint={f.password ? null : "Pelo menos 8 caracteres."}>
        <div className="auth-pass">
          <input id="su-pass" type={show ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} aria-invalid={!!err.password} aria-describedby="su-strength" />
          <button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)}><Icon name="eye" size={18} /></button>
        </div>
        {f.password && (
          <div className={"auth-strength s" + s} id="su-strength" aria-live="polite">
            <span><i /><i /><i /><i /></span>{STRENGTH[s]}
          </div>
        )}
      </Field>
      <Field id="su-city" label="Sua cidade">
        <div className="auth-select">
          <select id="su-city" value={f.city} onChange={(e) => set({ city: e.target.value })}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Icon name="chevron" size={16} />
        </div>
      </Field>
      <label className={"auth-check" + (err.terms ? " has-error" : "")}>
        <input type="checkbox" checked={f.terms} onChange={(e) => set({ terms: e.target.checked })} aria-invalid={!!err.terms} />
        <span>Li e aceito os <a href="#" onClick={(e) => e.preventDefault()}>Termos de uso</a> e a <a href="#" onClick={(e) => e.preventDefault()}>Política de privacidade</a>.</span>
      </label>
      {err.terms && <span className="auth-error" role="alert">{err.terms}</span>}
      <label className="auth-check">
        <input type="checkbox" checked={f.marketing} onChange={(e) => set({ marketing: e.target.checked })} />
        <span>Quero receber o roteiro da semana por e-mail.</span>
      </label>
      <button type="submit" className="btn-pill btn-lg btn-block" disabled={busy}>{busy ? "Criando sua conta…" : "Criar conta"}</button>
      <p className="auth-switch">Já tem conta? <button type="button" className="auth-link" onClick={onLogin}>Entrar</button></p>
    </form>
  );
}

// Passo 2: vibes + cidade
function Welcome({ onDone }) {
  const u = account.user || {};
  const [vibes, setVibes] = useState(new Set(u.vibes || []));
  const [city, setCity] = useState(u.city || CITIES[0]?.id);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (v) => { const n = new Set(vibes); n.has(v) ? n.delete(v) : n.add(v); setVibes(n); };

  async function finish() {
    setBusy(true);
    try {
      const user = await updateAccount({ vibes: [...vibes], city, onboarded: true });
      onDone(user);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="auth-card auth-welcome">
      <span className="auth-ok"><Icon name="check" size={22} /></span>
      <h1>Oi, {(u.name || "").split(" ")[0]}! Qual é a sua vibe?</h1>
      <p className="auth-sub">Escolha as vibes que têm a ver com você. A gente usa isso pra calibrar as dicas. Dá pra mudar quando quiser.</p>
      <div className="hero2-vibes auth-vibes">
        {VIBE_ORDER.filter(v => AFFINITIES.some(a => a.id === v)).map(v => <VibePill key={v} aff={v} active={vibes.has(v)} onClick={() => toggle(v)} />)}
      </div>
      <Field id="wc-city" label="Sua cidade">
        <div className="auth-select">
          <select id="wc-city" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Icon name="chevron" size={16} />
        </div>
      </Field>
      {err && <div className="auth-alert" role="alert">{err}</div>}
      <button className="btn-pill btn-lg btn-block" disabled={busy} onClick={finish}>{busy ? "Salvando…" : vibes.size ? "Ver minhas dicas" : "Continuar"}</button>
      <button className="auth-link auth-center auth-skip" onClick={finish}>Pular por enquanto</button>
    </div>
  );
}

