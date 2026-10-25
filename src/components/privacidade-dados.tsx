// Configurações → Privacidade e dados: baixar a cópia dos dados, pedir a exclusão da conta e rever o que foi aceito.
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { EMPRESA } from "../lib/legal";
import { baixarJson, montarExportacao } from "../lib/exportar-dados";
import { ROTA_COOKIES, ROTA_PRIVACIDADE, ROTA_TERMOS } from "../lib/rotas";
import { supabase } from "../lib/supabase";
import { abrirAvisoCookies } from "../lib/cookies";
import { LinkInterno, PanelHeader } from "./primitives";

export function PrivacidadeDados({ email, tenantId, titular, aceiteEm, showToast }: {
  email: string;
  tenantId?: string;
  titular: boolean;
  aceiteEm: string | null;
  showToast: (texto: string) => void;
}) {
  const [baixando, setBaixando] = useState(false);

  const baixar = async () => {
    if (!supabase) return showToast("Disponível com a conta conectada.");
    setBaixando(true);
    try {
      const dados = await montarExportacao(supabase, email);
      baixarJson(dados, `rtquimico-meus-dados-${new Date().toISOString().slice(0, 10)}.json`);
      showToast("Cópia dos seus dados baixada.");
    } catch (error) {
      console.error(error);
      showToast("Não consegui montar a cópia agora. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  };

  const assunto = encodeURIComponent("Exclusão da conta no RTQuímico");
  const corpo = encodeURIComponent(
    `Quero excluir a minha conta no RTQuímico.\n\nE-mail da conta: ${email}\nCódigo do escritório: ${tenantId ?? "-"}\n` +
    (titular ? "Sou titular do escritório: entendo que os dados da equipe e das RTs do escritório também serão apagados.\n" : ""),
  );

  return (
    <article className="panel privacidade-dados">
      <PanelHeader title="Privacidade e dados" subtitle="Seus direitos pela LGPD: ver, levar e apagar o que está guardado" />
      <div className="privacidade-corpo">
        <div className="privacidade-item">
          <div>
            <h3>Baixar meus dados</h3>
            <p>Uma cópia em arquivo JSON de tudo o que o seu escritório tem no RTQuímico: perfil, RTs, diário, checklists, POPs, financeiro e alertas.</p>
          </div>
          <button type="button" className="button secondary" onClick={() => void baixar()} disabled={baixando}><Download size={17} /> {baixando ? "Montando..." : "Baixar meus dados"}</button>
        </div>
        <div className="privacidade-item">
          <div>
            <h3>Excluir a conta</h3>
            <p>Abre um e-mail pronto para {EMPRESA.contato}. Apagamos os dados em até 30 dias e confirmamos por e-mail. Se quiser, baixe a cópia antes.</p>
          </div>
          <a className="button secondary perigo" href={`mailto:${EMPRESA.contato}?subject=${assunto}&body=${corpo}`}><Trash2 size={17} /> Pedir exclusão da conta</a>
        </div>
        <p className="privacidade-aceite">
          <ShieldCheck size={16} />
          <span>
            {aceiteEm ? <>Você aceitou os termos em {new Date(aceiteEm).toLocaleDateString("pt-BR")}. </> : null}
            <LinkInterno to={ROTA_PRIVACIDADE}>Política de Privacidade</LinkInterno> · <LinkInterno to={ROTA_TERMOS}>Termos de Uso</LinkInterno> · <LinkInterno to={ROTA_COOKIES}>Cookies</LinkInterno> · <button type="button" onClick={abrirAvisoCookies}>Preferências de cookies</button>
          </span>
        </p>
      </div>
    </article>
  );
}
