import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { boot } from "./admin/store.js"; // conteúdo salvo (local) ou da API (nuvem)
import App from "./App.jsx";
import "./styles.css";
import "./home.css";
import "./pages.css";

// Painel administrativo em #/admin (carregado sob demanda)
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const isAdmin = () => window.location.hash.startsWith("#/admin");

function Root() {
  const [admin, setAdmin] = useState(isAdmin);
  useEffect(() => {
    const on = () => setAdmin(isAdmin());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return admin
    ? <Suspense fallback={<div className="a-loading">Carregando painel…</div>}><AdminApp /></Suspense>
    : <App />;
}

// busca o conteúdo publicado na API antes de renderizar (sem API, segue o modo local)
boot().finally(() => createRoot(document.getElementById("root")).render(<Root />));
