// Aviso de cookies. O RTQuímico só usa armazenamento essencial (sessão de login e esta escolha): não há publicidade,
// análise nem rastreamento, então o aviso informa e não pede um "aceito" que não teria o que ligar ou desligar.
// Se um dia entrar algo opcional (ex.: medição de audiência), ele só pode carregar depois de um consentimento aqui.
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CHAVE_AVISO_COOKIES as CHAVE, EVENTO_ABRIR_AVISO_COOKIES as EVENTO_ABRIR, VERSAO_AVISO_COOKIES as VERSAO } from "../lib/cookies";
import { ROTA_COOKIES } from "../lib/rotas";
import { LinkInterno } from "./primitives";

function jaViu() {
  try {
    return localStorage.getItem(CHAVE) === VERSAO;
  } catch {
    return false;
  }
}

export function AvisoCookies() {
  const [aberto, setAberto] = useState(() => !jaViu());

  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  if (!aberto) return null;

  const fechar = () => {
    try {
      localStorage.setItem(CHAVE, VERSAO);
    } catch {
      /* navegador sem armazenamento: o aviso volta na próxima visita */
    }
    setAberto(false);
  };

  return (
    <aside className="aviso-cookies" role="dialog" aria-labelledby="aviso-cookies-titulo" aria-live="polite">
      <span className="aviso-cookies-icone"><Cookie size={20} /></span>
      <div>
        <strong id="aviso-cookies-titulo">Só o essencial, sem rastreamento</strong>
        <p>Guardamos no seu navegador apenas o necessário para o site funcionar: a sessão de login e esta escolha. Não usamos cookies de publicidade, de análise nem de redes sociais. <LinkInterno to={ROTA_COOKIES}>Ver a Política de Cookies</LinkInterno></p>
      </div>
      <button type="button" className="button primary" onClick={fechar}>Entendi</button>
      <button type="button" className="icon-button aviso-cookies-fechar" onClick={fechar} aria-label="Fechar aviso"><X size={18} /></button>
    </aside>
  );
}
