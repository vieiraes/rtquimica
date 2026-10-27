// Aviso de cookies. O essencial (sessão de login e esta escolha) não depende de consentimento; a medição de visitas
// (Google Analytics, só nas páginas públicas) só liga depois do "Aceitar". Recusar é tão fácil quanto aceitar,
// e a escolha pode ser mudada pelo rodapé ("Preferências de cookies") ou pela Política de Cookies.
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { desligarAnalytics, registrarVisita } from "../lib/analytics";
import { EVENTO_ABRIR_AVISO_COOKIES as EVENTO_ABRIR, gravarConsentimento, lerConsentimento, type Consentimento } from "../lib/cookies";
import { ROTA_COOKIES } from "../lib/rotas";
import { LinkInterno } from "./primitives";

export function AvisoCookies() {
  const [atual, setAtual] = useState(lerConsentimento);
  const [aberto, setAberto] = useState(() => atual === null);

  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  if (!aberto) return null;

  const escolher = (escolha: Consentimento) => {
    gravarConsentimento(escolha);
    if (escolha === "aceito") registrarVisita(window.location.pathname);
    else desligarAnalytics();
    setAtual(escolha);
    setAberto(false);
  };

  return (
    <aside className="aviso-cookies" role="dialog" aria-labelledby="aviso-cookies-titulo" aria-live="polite">
      <span className="aviso-cookies-icone"><Cookie size={20} /></span>
      <div>
        <strong id="aviso-cookies-titulo">Cookies: o essencial e, se você permitir, a contagem de visitas</strong>
        <p>Guardamos no navegador o necessário para o site funcionar: a sessão de login e esta escolha. Se você aceitar, o Google Analytics conta as visitas às páginas públicas do site, para sabermos o que melhorar. O painel nunca é medido e não usamos publicidade. <LinkInterno to={ROTA_COOKIES}>Ver a Política de Cookies</LinkInterno></p>
        {atual && <p className="aviso-cookies-atual">Sua escolha atual: {atual === "aceito" ? "contagem de visitas permitida" : "contagem de visitas recusada"}.</p>}
      </div>
      <div className="aviso-cookies-botoes">
        <button type="button" className="button secondary" onClick={() => escolher("recusado")}>Recusar</button>
        <button type="button" className="button primary" onClick={() => escolher("aceito")}>Aceitar</button>
      </div>
    </aside>
  );
}
