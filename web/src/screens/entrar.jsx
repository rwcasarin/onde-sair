// Entrar / Criar conta / Boas-vindas — contas de visitantes
import { useEffect, useState } from "react";
import { CITIES, VIBE_ORDER, AFFINITIES } from "../data.js";
import { Icon } from "../components/icons.jsx";
import { ImageSlot } from "../components/image-slot.jsx";
import { OSIcon } from "../components/brand.jsx";
import { VibePill } from "../components/site.jsx";
import { useNav, useCity } from "../nav.js";
import { account, signup, login, socialLogin, updateAccount, PROVIDER_LABEL } from "../account.js";
import { REMOTE } from "../admin/store.js";

const ERRORS = {
  indisponivel: (p) => `O login com ${PROVIDER_LABEL[p] || "essa rede"} ainda não foi ativado. Use o e-mail por enquanto.`,
  cancelado: () => "Login cancelado. Tudo bem, é só tentar de novo quando quiser.",
  sessao: () => "A sessão de login expirou. Tente de novo.",
  falha: (p) => `Não conseguimos confirmar sua conta ${PROVIDER_LABEL[p] || ""}. Tente de novo ou use o e-mail.`,
  bloqueado: () => "Essa conta está suspensa. Fale com a gente pelo contato do site.",
  provedor: () => "Opção de login inválida.",
};

// Marcas das redes (botões de login)
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
function InstagramMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TikTokMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#25F4EE" d="M9.4 10.2V9.3a6.5 6.5 0 0 0-.9-.06 6.2 6.2 0 0 0-3.47 11.35A6.2 6.2 0 0 1 9.4 10.2Z" />
      <path fill="#25F4EE" d="M9.57 20.36a2.83 2.83 0 0 0 2.83-2.73V2.6h2.74A5.2 5.2 0 0 1 15.06 1.6h-3.74v15.06a2.83 2.83 0 0 1-4.11 2.47 2.83 2.83 0 0 0 2.36 1.23ZM20.6 7.37v-.84a5.17 5.17 0 0 1-2.85-.86 5.2 5.2 0 0 0 2.85 1.7Z" />
      <path fill="#FE2C55" d="M17.75 5.67a5.18 5.18 0 0 1-1.29-3.43h-1.02a5.22 5.22 0 0 0 2.31 3.43ZM8.5 13.07a2.83 2.83 0 0 0-1.29 5.36 2.83 2.83 0 0 1 3.1-4.4v-3.83a6.5 6.5 0 0 0-.9-.06h-.17v2.92a2.83 2.83 0 0 0-.74-.1ZM20.6 7.37v2.9a8.03 8.03 0 0 1-4.7-1.51v6.84a6.2 6.2 0 0 1-9.75 5.09A6.2 6.2 0 0 0 16.92 15.9V9.05a8.03 8.03 0 0 0 4.69 1.5V7.5a4.7 4.7 0 0 1-1.01-.13Z" />
      <path fill="#fff" d="M15.9 15.6V8.76a8.03 8.03 0 0 0 4.7 1.51v-2.9a5.2 5.2 0 0 1-2.85-1.7 5.22 5.22 0 0 1-2.31-3.43h-2.74v15.03a2.83 2.83 0 0 1-5.12 1.65 2.83 2.83 0 0 1 1.29-5.36c.25 0 .5.04.74.1V10.2a6.2 6.2 0 0 0-4.39 10.35 6.2 6.2 0 0 0 10.68-4.95Z" />
    </svg>
  );
}

function SocialButtons({ onPick, busy }) {
  return (
    <div className="auth-social">
      <button type="button" className="auth-soc google" disabled={!!busy} onClick={() => onPick("google")}><GoogleMark /> {busy === "google" ? "Abrindo o Google…" : "Continuar com Google"}</button>
      <button type="button" className="auth-soc instagram" disabled={!!busy} onClick={() => onPick("instagram")}><InstagramMark /> {busy === "instagram" ? "Abrindo o Instagram…" : "Continuar com Instagram"}</button>
      <button type="button" className="auth-soc tiktok" disabled={!!busy} onClick={() => onPick("tiktok")}><TikTokMark /> {busy === "tiktok" ? "Abrindo o TikTok…" : "Continuar com TikTok"}</button>
    </div>
  );
}

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

export function Entrar({ mode: initialMode = "entrar", erro, provedor, onDone }) {
  const nav = useNav();
  const [mode, setMode] = useState(account.user && initialMode !== "boas-vindas" ? "logado" : initialMode);
  const [alert, setAlert] = useState(erro ? (ERRORS[erro] || ERRORS.falha)(provedor) : "");
  const [busy, setBusy] = useState(null);

  useEffect(() => { document.title = { entrar: "Entrar · Onde Sair", cadastro: "Criar conta · Onde Sair", "boas-vindas": "Boas-vindas · Onde Sair" }[mode] || "Onde Sair"; }, [mode]);

  async function social(p) {
    setAlert(""); setBusy(p);
    const r = await socialLogin(p, "conta");
    if (r.redirecting) return;              // indo para o provedor
    setBusy(null);
    if (r.message) return setAlert(r.message);
    if (r.user) { r.user.onboarded ? onDone(r.user, false) : setMode("boas-vindas"); }
  }

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
          <button role="tab" aria-selected={mode === "entrar"} className={mode === "entrar" ? "on" : ""} onClick={() => { setMode("entrar"); setAlert(""); }}>Entrar</button>
          <button role="tab" aria-selected={mode === "cadastro"} className={mode === "cadastro" ? "on" : ""} onClick={() => { setMode("cadastro"); setAlert(""); }}>Criar conta</button>
        </div>

        <h1>{mode === "entrar" ? "Que bom te ver de novo" : "Crie sua conta grátis"}</h1>
        <p className="auth-sub">{mode === "entrar" ? "Entre para ver seus salvos, rolês e dicas pelas suas vibes." : "Salve lugares, monte rolês com amigos e receba dicas que combinam com você."}</p>

        {alert && <div className="auth-alert" role="alert"><Icon name="x" size={14} /> {alert}</div>}

        <SocialButtons onPick={social} busy={busy} />
        {!REMOTE && <p className="auth-hint auth-center">Versão offline: os botões das redes simulam o login.</p>}

        <div className="auth-divider"><span>ou com seu e-mail</span></div>

        {mode === "entrar"
          ? <LoginForm onDone={(u) => (u.onboarded ? onDone(u, false) : setMode("boas-vindas"))} onSignup={() => setMode("cadastro")} />
          : <SignupForm onDone={() => setMode("boas-vindas")} onLogin={() => setMode("entrar")} />}
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
        <p className="auth-info"><Icon name="bulb" size={16} /> A recuperação de senha por e-mail chega em breve. Enquanto isso, entre com Google, Instagram ou TikTok, ou fale com a gente pelo contato do site.</p>
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

// Passo 2: vibes + cidade (+ e-mail para quem entrou com Instagram/TikTok)
function Welcome({ onDone }) {
  const u = account.user || {};
  const [vibes, setVibes] = useState(new Set(u.vibes || []));
  const [city, setCity] = useState(u.city || CITIES[0]?.id);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (v) => { const n = new Set(vibes); n.has(v) ? n.delete(v) : n.add(v); setVibes(n); };

  async function finish(skip) {
    if (!skip && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Esse e-mail não parece válido.");
    setBusy(true);
    try {
      const user = await updateAccount({ vibes: [...vibes], city, onboarded: true, ...(email && !u.email ? { email } : {}) });
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
      {!u.email && (
        <Field id="wc-email" label="E-mail (opcional)" hint="Para receber o roteiro da semana e recuperar sua conta." error={err}>
          <input id="wc-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="voce@email.com" />
        </Field>
      )}
      {err && u.email && <div className="auth-alert" role="alert">{err}</div>}
      <button className="btn-pill btn-lg btn-block" disabled={busy} onClick={() => finish(false)}>{busy ? "Salvando…" : vibes.size ? "Ver minhas dicas" : "Continuar"}</button>
      <button className="auth-link auth-center auth-skip" onClick={() => finish(true)}>Pular por enquanto</button>
    </div>
  );
}

