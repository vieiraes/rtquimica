// Palco 3D da landing: canvas fixo atrás dos cartões da história, com a maquete, os pinos e o relógio.
// Carregado sob demanda (React.lazy em HistoriaDoRT): three.js fica fora do primeiro carregamento.
// Decorativo: tudo o que ele mostra também está em texto nos cartões (aria-hidden aqui).
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { PCFSoftShadowMap, PerspectiveCamera, Vector3, WebGLRenderer } from "three";
import {
  ajustarParaTela, escolherLayout, pinos, poseEm, presenca, relogio, respiro, smoothstep, tPelaRolagem, type Layout,
} from "./historia";
import { montarMaquete } from "./maquete";

type Props = {
  /** Lista dos capítulos (um <li> por capítulo): a posição deles na tela vira o T da história. */
  capitulos: RefObject<HTMLOListElement | null>;
  /** prefers-reduced-motion: sem viagem de câmera nem loops; um quadro parado por capítulo. */
  reduzido: boolean;
  onFalha: () => void;
};

const temaEscuro = () => document.documentElement.getAttribute("data-theme") === "dark";

export default function Palco3D({ capitulos, reduzido, onFalha }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const horaRef = useRef<HTMLSpanElement>(null);
  const pinosRef = useRef<(HTMLDivElement | null)[]>([]);
  const listaPinos = useMemo(() => pinos(), []);
  const falha = useRef(onFalha);
  useEffect(() => {
    falha.current = onFalha;
  }, [onFalha]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      falha.current();
      return;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "palco-canvas";
    el.prepend(canvas);
    const perdeuContexto = (e: Event) => {
      e.preventDefault();
      falha.current();
    };
    canvas.addEventListener("webglcontextlost", perdeuContexto);

    let layout: Layout = escolherLayout(window.innerWidth, window.innerHeight, window.devicePixelRatio);
    const maquete = montarMaquete({ mapaSombra: layout.tipo === "celular" ? 1024 : 2048 });
    const camera = new PerspectiveCamera(35, 1, 0.5, 500);
    const alvo = new Vector3();
    const v = new Vector3();
    let largura = 1;
    let altura = 1;
    let larguraPinos: number[] = [];

    const medirPinos = () => {
      larguraPinos = pinosRef.current.map((p) => p?.offsetWidth ?? 0);
    };
    const redimensionar = () => {
      const r = el.getBoundingClientRect();
      largura = Math.max(1, Math.round(r.width));
      altura = Math.max(1, Math.round(r.height));
      layout = escolherLayout(largura, altura, window.devicePixelRatio);
      renderer.setPixelRatio(layout.dpr);
      renderer.setSize(largura, altura, false);
      camera.aspect = largura / altura;
      camera.setViewOffset(largura, altura, -layout.deslocX * largura, -layout.deslocY * altura, largura, altura);
      medirPinos();
    };

    // T da rolagem: meio de cada capítulo na tela contra o meio da janela
    const lerT = () => {
      const ol = capitulos.current;
      if (!ol) return 0;
      const centros = [...ol.children].map((li) => {
        const r = li.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      return tPelaRolagem(centros, window.innerHeight / 2);
    };
    let tAlvo = lerT();
    let tAtual = tAlvo;
    let ultimaRolagem = performance.now();
    let escuro = temaEscuro();
    let visivel = false;
    let inicioSubida: number | null = null;
    let ultimoQuadro = 0;
    let raf = 0;

    const quadro = (agora: number) => {
      raf = 0;
      if (!visivel || document.hidden) return;
      const dt = ultimoQuadro ? Math.min(0.1, (agora - ultimoQuadro) / 1000) : 0;
      ultimoQuadro = agora;
      const segundos = agora / 1000;
      if (reduzido) tAtual = Math.round(tAlvo);
      else tAtual += (tAlvo - tAtual) * Math.min(1, dt * 5);
      if (Math.abs(tAlvo - tAtual) < 1e-4) tAtual = tAlvo;
      const t = tAtual;

      const pose = ajustarParaTela(poseEm(t), largura / altura);
      const parado = reduzido ? 0 : smoothstep(400, 1600, agora - ultimaRolagem);
      const r = respiro(segundos, parado);
      camera.position.set(pose.pos[0] + r[0], pose.pos[1] + r[1], pose.pos[2] + r[2]);
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
      alvo.set(...pose.alvo);
      camera.lookAt(alvo);

      if (inicioSubida === null) inicioSubida = agora;
      const subida = reduzido ? 1 : Math.min(1, (agora - inicioSubida) / 1800);
      maquete.atualizar({ t, segundos, subida, animar: !reduzido, escuro });
      renderer.setClearColor(maquete.fundo);
      try {
        renderer.render(maquete.cena, camera);
      } catch {
        falha.current();
        return;
      }

      // Pinos: projeta o ponto da maquete na tela; some quando o capítulo não está em cena
      listaPinos.forEach((p, i) => {
        const pino = pinosRef.current[i];
        if (!pino) return;
        const op = presenca(t, p.capitulo);
        v.set(...p.pos).project(camera);
        if (op < 0.02 || v.z > 1) {
          pino.style.visibility = "hidden";
          return;
        }
        const meia = (larguraPinos[i] ?? 0) / 2;
        const x = Math.min(largura - 16 - meia, Math.max(16 + meia, (v.x * 0.5 + 0.5) * largura));
        const y = (-v.y * 0.5 + 0.5) * altura;
        pino.style.visibility = "visible";
        pino.style.opacity = String(op);
        pino.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      });
      if (horaRef.current) horaRef.current.textContent = relogio(t);

      if (!reduzido) raf = requestAnimationFrame(quadro);
    };
    const ligar = () => {
      if (!raf && visivel && !document.hidden) {
        ultimoQuadro = 0;
        raf = requestAnimationFrame(quadro);
      }
    };

    const aoRolar = () => {
      tAlvo = lerT();
      ultimaRolagem = performance.now();
      if (reduzido) ligar();
    };
    const aoRedimensionar = () => {
      redimensionar();
      aoRolar();
      ligar();
    };
    const aoMudarAba = () => {
      if (!document.hidden) ligar();
    };
    redimensionar();

    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      ligar();
    });
    io.observe(el);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(aoRedimensionar) : null;
    ro?.observe(el);
    const tema = new MutationObserver(() => {
      escuro = temaEscuro();
      ligar();
    });
    tema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRedimensionar);
    document.addEventListener("visibilitychange", aoMudarAba);
    // Fontes da página mudam a largura dos pinos
    document.fonts?.ready.then(medirPinos).catch(() => {});

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
      tema.disconnect();
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRedimensionar);
      document.removeEventListener("visibilitychange", aoMudarAba);
      canvas.removeEventListener("webglcontextlost", perdeuContexto);
      maquete.descartar();
      renderer.dispose();
      canvas.remove();
    };
  }, [capitulos, reduzido, listaPinos]);

  return (
    <div ref={host} className="palco-host" aria-hidden="true">
      <div className="palco-pinos">
        {listaPinos.map((p, i) => (
          <div
            key={p.id}
            ref={(n) => {
              pinosRef.current[i] = n;
            }}
            className="pino"
            style={{ visibility: "hidden" }}
          >
            <span className={p.tom ? `pino-texto pino-${p.tom}` : "pino-texto"}>{p.texto}</span>
            <span className="pino-haste" />
          </div>
        ))}
      </div>
      <div className="palco-relogio">
        <i />
        <span ref={horaRef}>07:00</span>
      </div>
    </div>
  );
}
