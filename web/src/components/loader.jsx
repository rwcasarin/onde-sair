// Carregamento da marca: o asterisco com os raios saindo do centro, um após o outro, e voltando.
// tone "brand" = magenta da marca (telas e áreas grandes); "mono" = cor do texto (dentro de botões e selos).
// Só aparece se a espera passar de 0,3 s (sem piscar em conexões rápidas); com "reduzir movimento", só pulsa.
export function Loader({ size = 56, tone = "brand", label = "Carregando", delay = true, className = "" }) {
  return (
    <svg className={`os-loader os-loader-${tone}` + (delay ? " is-delayed" : "") + (className ? " " + className : "")}
      viewBox="-6 -6 412 412" width={size} height={size} role="img" aria-label={label}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <g key={i} transform={`rotate(${i * 45} 200 200)`}>
          <polygon points="189,200 177,2 222,2 211,200" style={{ "--i": i }} />
        </g>
      ))}
    </svg>
  );
}

// Tela inteira de carregamento (abertura do site e do painel)
export function LoaderScreen({ label = "Carregando", className = "" }) {
  return (
    <div className={"os-loader-screen" + (className ? " " + className : "")} role="status" aria-live="polite">
      <Loader size={96} label={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Texto de botão em andamento: ícone pequeno + texto ("Salvando…")
export function Busy({ children }) {
  return <span className="os-busy"><Loader size={16} tone="mono" delay={false} label="" />{children}</span>;
}
