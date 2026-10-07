import { useNav } from "../nav.js";
import { Footer } from "../components/site.jsx";

export function NotFound() {
  const nav = useNav();
  return (
    <main className="home2">
      <div className="shell notfound">
        <span className="notfound-code">404</span>
        <h1>Esse endereço não leva a lugar nenhum.</h1>
        <p>O conteúdo pode ter mudado de endereço ou saído do ar. Que tal começar de novo?</p>
        <div className="row gap-12">
          <button className="btn-pill" onClick={() => nav("home")}>Ir para o início</button>
          <button className="btn-outline" onClick={() => nav("lista")}>Ver lugares</button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
