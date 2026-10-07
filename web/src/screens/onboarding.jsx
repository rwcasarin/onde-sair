import { useState } from "react";
import { CITIES, AFFINITIES, TAGLINES } from "../data.js";

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("sp");
  const [affs, setAffs] = useState(new Set(["dates", "impress"]));
  const [pace, setPace] = useState("equilibrado");
  const A = AFFINITIES;
  const TAG = TAGLINES;

  function toggleAff(id) {
    const next = new Set(affs);
    if (next.has(id)) next.delete(id); else next.add(id);
    setAffs(next);
  }

  const steps = [
    {
      eyebrow: "Cidade",
      title: <>Por <span className="accent">onde</span> começamos?</>,
      helper: "A curadoria muda de cidade pra cidade. Escolha a sua pra começar.",
      render: () => (
        <div className="onb-options">
          {CITIES.map(c => (
            <button
              key={c.id}
              className={"onb-option" + (city === c.id ? " checked" : "")}
              onClick={() => !c.soon && setCity(c.id)}
              disabled={c.soon}
              style={c.soon ? { opacity: 0.5 } : {}}
            >
              <span>
                <span className="name">{c.name}</span>
                <div className="sub">{c.sub}{c.active ? " · disponível" : c.soon ? " · em breve" : ""}</div>
              </span>
              <span className="tick">{city === c.id ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      eyebrow: "Afinidades",
      title: <>O que <span className="accent">você</span> costuma procurar?</>,
      helper: "Escolha 2 ou mais. Vamos usar isso pra calibrar seu feed — muda quando quiser.",
      render: () => (
        <div className="onb-options" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {A.map(a => (
            <button key={a.id} className={"onb-option" + (affs.has(a.id) ? " checked" : "")} onClick={() => toggleAff(a.id)}>
              <span>
                <span className="name">{a.label}</span>
                <div className="sub">{a.sub}</div>
              </span>
              <span className="tick">{affs.has(a.id) ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      eyebrow: "Ritmo",
      title: <>Como você <span className="accent">prefere</span> sair?</>,
      helper: "Pra calibrar o tom da curadoria — pode mudar a qualquer momento.",
      render: () => (
        <div className="onb-options">
          {[
            { id: "tranquilo",   name: "Mais tranquilo",   sub: "Lugares calmos, menos fila" },
            { id: "equilibrado", name: "Equilibrado",      sub: "Um pouco de tudo" },
            { id: "intenso",     name: "Intenso",          sub: "Bar cheio, balada, agenda lotada" },
            { id: "surpresa",    name: "Modo surpresa",    sub: "Decide por mim" },
          ].map(p => (
            <button key={p.id} className={"onb-option" + (pace === p.id ? " checked" : "")} onClick={() => setPace(p.id)}>
              <span>
                <span className="name">{p.name}</span>
                <div className="sub">{p.sub}</div>
              </span>
              <span className="tick">{pace === p.id ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];
  const canNext = step === 0 ? !!city : step === 1 ? affs.size >= 2 : !!pace;
  const isLast = step === steps.length - 1;

  return (
    <div className="onb">
      <aside className="onb-side">
        <span className="eyebrow label">Onde Sair · curadoria</span>
        <h1>{TAG.hero}<br /><span className="accent">{TAG.heroEm}</span></h1>
        <p className="helper">
          A gente não tenta mostrar tudo. Mostra o que vale — pra você, hoje, com o tempo que você tem.
        </p>
        <div className="quote">
          "Saí pra comer com a sogra, segui o roteiro, e o jantar virou conversa boa. Inédito."
          <span className="quote-by">Bruna T., assinante</span>
        </div>
      </aside>

      <main className="onb-main">
        <div className="onb-step"><span className="num">{step + 1}</span> {s.eyebrow}</div>
        <h2 style={{ marginTop: 16 }}>{s.title}</h2>
        <p className="helper">{s.helper}</p>
        {s.render()}

        <div className="onb-actions">
          <div className="onb-progress">
            {steps.map((_, i) => <span key={i} className={"dot" + (i <= step ? " on" : "")}></span>)}
          </div>
          <div className="row gap-12">
            {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Voltar</button>}
            <button
              className="btn btn-cta"
              disabled={!canNext}
              onClick={() => isLast ? onDone({ city, affs: [...affs], pace }) : setStep(step + 1)}
            >
              {isLast ? "Ver minha curadoria" : "Continuar"} →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

