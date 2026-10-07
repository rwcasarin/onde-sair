import { useState } from "react";

// Área de imagem demarcada.
// Mostra a foto assim que o arquivo `src` existir; até lá, exibe a
// moldura tracejada com o caminho esperado e a proporção sugerida.
export function ImageSlot({ src, alt = "", hint, compact = false, className = "", style, children }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={"img-slot" + (loaded ? " is-loaded" : "") + (compact ? " is-compact" : "") + (className ? " " + className : "")} style={style} title={!loaded && compact ? src : undefined}>
      {!loaded && (
        <div className="img-slot-empty">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
          </svg>
          <span className="img-slot-path">{src}</span>
          {hint && <span className="img-slot-hint">{hint}</span>}
        </div>
      )}
      {src && (
        <img
          src={src} alt={alt} loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      )}
      {children}
    </div>
  );
}
