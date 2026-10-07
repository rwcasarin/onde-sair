import { useEffect, useState } from "react";
import { OSLogo, OSIcon } from "../../components/brand.jsx";
import { AIcon, Btn } from "../kit.jsx";
import { login, ROLES, REMOTE } from "../store.js";

const DEMO = [
  ["admin@ondesair.com.br", "admin123", "admin"],
  ["editora@ondesair.com.br", "editor123", "editor"],
  ["curador@ondesair.com.br", "curador123", "curador"],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | forgot | sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => { document.title = "Entrar · Onde Sair Painel"; }, []);
  useEffect(() => {
    if (!wait) return;
    const t = setInterval(() => setWait(w => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [wait]);

  function validate(needPassword = true) {
    const e = {};
    if (!email.trim()) e.email = "Informe seu e-mail.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Esse e-mail não parece válido.";
    if (needPassword && !password) e.password = "Informe sua senha.";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setBusy(true);
    login(email, password, remember).then(r => {
      setBusy(false);
      if (r.user) return onLogin(r.user);
      if (r.error === "locked") { setWait(r.wait); setFormError(`Muitas tentativas. Tente de novo em ${r.wait} segundos.`); }
      else if (r.error === "inactive") setFormError("Seu acesso está desativado. Fale com um administrador.");
      else if (r.error === "network") setFormError("Não foi possível falar com o servidor. Verifique a conexão e tente de novo.");
      else setFormError(`E-mail ou senha incorretos.${r.left <= 2 ? ` ${r.left} tentativa(s) antes do bloqueio temporário.` : ""}`);
    });
  }

  function forgot(e) {
    e.preventDefault();
    if (!validate(false)) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setMode("sent"); }, 500);
  }

  return (
    <div className="a-login">
      <section className="a-login-art" aria-hidden="true">
        <span className="a-login-logo"><OSLogo /></span>
        <div className="a-login-claim">
          <p>Painel de curadoria</p>
          <h2>A cidade muda todo dia.<br />A curadoria também.</h2>
        </div>
        <svg className="a-login-geo" viewBox="0 0 400 260" preserveAspectRatio="xMaxYMax meet">
          <circle cx="60" cy="200" r="60" fill="var(--c-yellow)" />
          <rect x="120" y="140" width="120" height="120" fill="var(--c-teal)" />
          <polygon points="120,140 240,200 120,260" fill="var(--c-magenta)" />
          <path d="M240,260 A140,140 0 0 1 380,120 L380,260 Z" fill="var(--c-yellow)" />
          <rect x="300" y="20" width="80" height="80" fill="var(--c-magenta)" />
          <polygon points="300,20 380,20 380,100" fill="#fff" opacity=".9" />
        </svg>
      </section>

      <section className="a-login-panel">
        <a className="a-login-back" href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}><AIcon name="left" size={14} /> Voltar ao site</a>
        <div className="a-login-box">
          <span className="a-login-mark"><OSIcon /></span>

          {mode === "login" && (
            <form onSubmit={submit} noValidate>
              <h1>Entrar no painel</h1>
              <p className="a-login-sub">Acesso restrito à equipe Onde Sair.</p>
              {formError && <div className="a-alert tone-error" role="alert"><AIcon name="alert" size={16} /> {formError}</div>}

              <div className={"a-field" + (errors.email ? " has-error" : "")}>
                <label className="a-label" htmlFor="l-email">E-mail</label>
                <div className="a-input-wrap has-icon">
                  <AIcon name="mail" size={17} />
                  <input id="l-email" className="a-input" type="email" autoComplete="username" value={email}
                    onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} placeholder="voce@ondesair.com.br" autoFocus />
                </div>
                {errors.email && <span className="a-error" role="alert">{errors.email}</span>}
              </div>

              <div className={"a-field" + (errors.password ? " has-error" : "")}>
                <label className="a-label" htmlFor="l-pass">Senha
                  <button type="button" className="a-link a-label-link" onClick={() => { setMode("forgot"); setErrors({}); setFormError(""); }}>Esqueci minha senha</button>
                </label>
                <div className="a-input-wrap has-icon has-after">
                  <AIcon name="lock" size={17} />
                  <input id="l-pass" className="a-input" type={show ? "text" : "password"} autoComplete="current-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
                  <button type="button" className="a-input-after" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)}>
                    <AIcon name={show ? "eyeoff" : "eye"} size={17} />
                  </button>
                </div>
                {errors.password && <span className="a-error" role="alert">{errors.password}</span>}
              </div>

              <label className="a-check a-login-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Manter conectado neste dispositivo</span>
              </label>

              <Btn kind="primary" className="a-btn-block a-btn-lg" type="submit" disabled={busy || wait > 0}>
                {busy ? "Entrando…" : wait ? `Aguarde ${wait}s` : "Entrar"}
              </Btn>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={forgot} noValidate>
              <h1>Recuperar acesso</h1>
              <p className="a-login-sub">Informe o e-mail da sua conta. Um administrador da equipe vai gerar uma nova senha provisória para você.</p>
              <div className={"a-field" + (errors.email ? " has-error" : "")}>
                <label className="a-label" htmlFor="f-email">E-mail</label>
                <div className="a-input-wrap has-icon">
                  <AIcon name="mail" size={17} />
                  <input id="f-email" className="a-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus aria-invalid={!!errors.email} />
                </div>
                {errors.email && <span className="a-error" role="alert">{errors.email}</span>}
              </div>
              <Btn kind="primary" className="a-btn-block a-btn-lg" type="submit" disabled={busy}>{busy ? "Enviando…" : "Pedir nova senha"}</Btn>
              <button type="button" className="a-link a-login-alt" onClick={() => setMode("login")}><AIcon name="left" size={14} /> Voltar para o login</button>
            </form>
          )}

          {mode === "sent" && (
            <div>
              <span className="a-login-ok"><AIcon name="check" size={26} /></span>
              <h1>Pedido enviado</h1>
              <p className="a-login-sub">Pedido registrado para <strong>{email}</strong>. Peça a um administrador para redefinir seu acesso em Equipe e permissões.</p>
              <Btn kind="primary" className="a-btn-block a-btn-lg" onClick={() => setMode("login")}>Voltar para o login</Btn>
            </div>
          )}
        </div>

        {!REMOTE && <details className="a-login-demo">
          <summary>Acessos de demonstração</summary>
          <p>Versão offline: os dados ficam salvos só neste navegador.</p>
          <ul>
            {DEMO.map(([e, p, role]) => (
              <li key={e}>
                <button type="button" onClick={() => { setMode("login"); setEmail(e); setPassword(p); setErrors({}); setFormError(""); }}>
                  <strong>{ROLES[role].label}</strong><span>{e} · {p}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>}
      </section>
    </div>
  );
}
