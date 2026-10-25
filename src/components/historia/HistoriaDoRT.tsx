import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Falha3D } from "./Falha3D";
import { HISTORIA, HISTORIA_INTRO, HISTORIA_TITULO } from "./conteudo";
import { horaDoCapitulo, ULTIMO } from "./historia";
import { temWebGL, useReduzirMovimento } from "./suporte3d";

// three.js só desce quando a seção chega perto da tela
const Palco3D = lazy(() => import("./Palco3D"));

type Estado = "com-palco" | "sem-palco";

/**
 * "Um dia de responsável técnico": cartões de texto que rolam por cima de um palco 3D preso na tela (sticky).
 * O texto é o conteúdo; o palco é enfeite. Sem WebGL, ou se o 3D falhar, os cartões viram uma grade comum.
 */
export function HistoriaDoRT({ cta }: { cta: ReactNode }) {
  const reduzido = useReduzirMovimento();
  const [estado, setEstado] = useState<Estado>(() => (temWebGL() ? "com-palco" : "sem-palco"));
  const [perto, setPerto] = useState(false);
  const secao = useRef<HTMLElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const falhar = useCallback(() => setEstado("sem-palco"), []);
  const comPalco = estado === "com-palco";

  useEffect(() => {
    const el = secao.current;
    if (!comPalco || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPerto(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [comPalco]);

  return (
    <section ref={secao} aria-labelledby="historia-titulo" className="historia" id="historia" data-palco={comPalco ? "sim" : "nao"}>
      <div className="historia-intro">
        <span className="pill">A maquete</span>
        <h2 id="historia-titulo">{HISTORIA_TITULO}</h2>
        <p>{HISTORIA_INTRO}</p>
      </div>

      <div className={comPalco ? "historia-corpo com-palco" : "historia-corpo"}>
        {comPalco && (
          // O trilho tem a altura da lista: o palco preso (sticky) solta exatamente no fim da história
          <div className="palco-trilho" aria-hidden="true">
            <div className="palco">
              {perto && (
                <Falha3D onError={falhar}>
                  <Suspense fallback={null}>
                    <Palco3D capitulos={lista} reduzido={reduzido} onFalha={falhar} />
                  </Suspense>
                </Falha3D>
              )}
            </div>
          </div>
        )}
        <ol ref={lista} className={comPalco ? "capitulos" : "capitulos-grade"}>
          {HISTORIA.map((c, i) => (
            <li key={c.id} className="capitulo">
              <article aria-labelledby={`historia-${c.id}`} className="cartao-historia">
                <p className="cartao-rotulo">
                  <span>{horaDoCapitulo(i)}</span> · {c.rotulo}
                </p>
                <h3 id={`historia-${c.id}`}>{c.titulo}</h3>
                <p>{c.texto}</p>
                {i === ULTIMO && <div className="cartao-cta">{cta}</div>}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
