// Push no celular: só no app Android (Capacitor). No navegador não faz nada.
// O app pede permissão, recebe o token do Firebase e o guarda em /api/push; tocar no push abre a notificação.
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api } from "./admin/store.js";

// o build só marca "OndeSairApp/push" no user agent quando o APK tem o google-services.json;
// sem ele o Firebase não existe e register() derruba o app
export const pushAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications") && /OndeSairApp\/push/.test(navigator.userAgent);

let started = false, lastToken = null, lastCity = null, curCity = null;

const save = (token, city) => {
  if (token === lastToken && city === lastCity) return;
  lastToken = token; lastCity = city;
  api("push?action=register", { method: "POST", body: { token, city } }).catch(() => { lastToken = null; });
};

// city: cidade atual (o público "Cidade: …" usa esta, ou a da conta) · onOpen(route): tocou no push
export async function initPush({ city, onOpen }) {
  if (!pushAvailable()) return;
  curCity = city;
  if (started) { if (lastToken) save(lastToken, city); return; }
  started = true;
  try {
    PushNotifications.addListener("registration", (t) => save(t.value, curCity));
    PushNotifications.addListener("pushNotificationActionPerformed", (a) => onOpen?.(a.notification?.data?.route || "/notificacoes"));
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.createChannel({ id: "geral", name: "Novidades", importance: 4 }).catch(() => {});
    await PushNotifications.register();
  } catch { started = false; }
}

// o login muda o dono do aparelho: grava de novo para ligar o token à conta
export const refreshPush = (city) => { if (lastToken) { const t = lastToken; lastToken = null; save(t, city); } };
