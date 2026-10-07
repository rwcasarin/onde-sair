import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { boot } from "./admin/store.js"; // conteúdo salvo (local) ou da API (nuvem)
import { usePath, migrateLegacyHash } from "./router.js";
import App from "./App.jsx";
import "./styles.css";
import "./home.css";
import "./pages.css";

// Painel administrativo em /admin (carregado sob demanda)
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));

function Root() {
  const path = usePath();
  return /^\/admin(\/|$|\?)/.test(path)
    ? <Suspense fallback={<div className="a-loading">Carregando painel…</div>}><AdminApp /></Suspense>
    : <App />;
}

// links antigos (#/admin/...) continuam funcionando
migrateLegacyHash();
// busca o conteúdo publicado na API antes de renderizar (sem API, segue o modo local)
boot().finally(() => createRoot(document.getElementById("root")).render(<Root />));
