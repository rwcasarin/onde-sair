// Botão "Fazer login com o Google" (Google Identity Services): o botão oficial do Google,
// carregado só quando o ID do cliente está configurado (GOOGLE_CLIENT_ID na Vercel).
import { useEffect, useRef, useState } from "react";

const SRC = "https://accounts.google.com/gsi/client";
let loading = null;
function loadGsi() {
  if (typeof window === "undefined") return Promise.reject(new Error("sem navegador"));
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC; s.async = true; s.defer = true;
      s.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error("gsi")));
      s.onerror = () => { loading = null; reject(new Error("gsi")); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

// text: "signin_with" (Fazer login com o Google) | "signup_with" (Inscrever-se com o Google) | "continue_with"
export function GoogleButton({ clientId, onCredential, text = "continue_with", busy = false, className = "" }) {
  const box = useRef(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [state, setState] = useState("loading");    // loading | ready | error
  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGsi().then((google) => {
      if (!alive || !box.current) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => r?.credential && cb.current?.(r.credential),
        ux_mode: "popup", auto_select: false, cancel_on_tap_outside: true, context: text === "signup_with" ? "signup" : "signin",
        itp_support: true, use_fedcm_for_prompt: true,
      });
      const width = Math.min(400, Math.max(220, Math.round(box.current.getBoundingClientRect().width || 320)));
      box.current.innerHTML = "";
      google.accounts.id.renderButton(box.current, { type: "standard", theme: "outline", size: "large", shape: "pill", text, logo_alignment: "center", width, locale: "pt-BR" });
      setState("ready");
    }).catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, [clientId, text]);
  if (!clientId) return null;
  return (
    <div className={"google-btn" + (busy ? " is-busy" : "") + (className ? " " + className : "")} aria-busy={busy || state === "loading"}>
      <div ref={box} className="google-btn-slot" />
      {state === "loading" && <span className="google-btn-wait" aria-hidden="true" />}
      {state === "error" && <p className="google-btn-error">Não foi possível carregar o login com o Google. Verifique a conexão ou use o e-mail.</p>}
    </div>
  );
}

// Mensagens de erro do login com Google (site e painel)
export function googleError(code) {
  return {
    "not-member": "Essa conta Google não faz parte da equipe. Use o e-mail cadastrado no painel ou fale com um administrador.",
    inactive: "Seu acesso está desativado. Fale com um administrador.",
    blocked: "Essa conta está suspensa. Fale com a gente pelo contato do site.",
    "google-unverified": "O e-mail dessa conta Google ainda não foi verificado.",
    "google-expired": "O login com o Google expirou. Tente de novo.",
    "google-off": "O login com o Google não está disponível agora.",
    "google-unreachable": "Não foi possível falar com o Google agora. Tente de novo em instantes.",
    paused: "Contas e interações estão pausadas por alguns instantes.",
  }[code] || "Não foi possível entrar com o Google. Tente de novo.";
}
