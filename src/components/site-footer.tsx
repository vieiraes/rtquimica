// Rodapé do site (landing e páginas legais) e a linha legal compacta (tela de login e painel).
import { Mail } from "lucide-react";
import { EMPRESA } from "../lib/legal";
import { ROTA_COOKIES, ROTA_CRIAR_CONTA, ROTA_ENTRAR, ROTA_PRIVACIDADE, ROTA_TERMOS } from "../lib/rotas";
import { abrirAvisoCookies } from "../lib/cookies";
import { Brand, LinkInterno } from "./primitives";

const ANO = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grade">
        <div className="site-footer-marca">
          <LinkInterno to="/"><Brand /></LinkInterno>
          <p>Prazos, CRQ, diário técnico e honorários de quem assina como responsável técnico.</p>
          <a className="site-footer-contato" href={`mailto:${EMPRESA.contato}`}><Mail size={16} /> {EMPRESA.contato}</a>
        </div>
        <nav aria-label="Produto">
          <h2>Produto</h2>
          <a href="/#recursos">Recursos</a>
          <a href="/#telas">Telas</a>
          <a href="/#planos">Plano e preço</a>
          <a href="/#duvidas">Dúvidas</a>
        </nav>
        <nav aria-label="Conta">
          <h2>Conta</h2>
          <LinkInterno to={ROTA_CRIAR_CONTA}>Criar conta grátis</LinkInterno>
          <LinkInterno to={ROTA_ENTRAR}>Entrar</LinkInterno>
        </nav>
        <nav aria-label="Privacidade">
          <h2>Privacidade</h2>
          <LinkInterno to={ROTA_PRIVACIDADE}>Política de Privacidade</LinkInterno>
          <LinkInterno to={ROTA_TERMOS}>Termos de Uso</LinkInterno>
          <LinkInterno to={ROTA_COOKIES}>Política de Cookies</LinkInterno>
          <button type="button" onClick={abrirAvisoCookies}>Preferências de cookies</button>
        </nav>
      </div>
      <div className="site-footer-base">
        <span>© {ANO} {EMPRESA.produto} · CNPJ {EMPRESA.cnpj} · {EMPRESA.cidade}</span>
        <span>Desenvolvido por {EMPRESA.desenvolvedora}</span>
      </div>
    </footer>
  );
}

/** Uma linha só, para a tela de login e o fim do painel. */
export function RodapeLegal() {
  return (
    <footer className="rodape-legal">
      <span>© {ANO} {EMPRESA.produto} · CNPJ {EMPRESA.cnpj}</span>
      <nav aria-label="Privacidade">
        <LinkInterno to={ROTA_PRIVACIDADE}>Privacidade</LinkInterno>
        <LinkInterno to={ROTA_TERMOS}>Termos</LinkInterno>
        <LinkInterno to={ROTA_COOKIES}>Cookies</LinkInterno>
        <a href={`mailto:${EMPRESA.contato}`}>Contato</a>
      </nav>
    </footer>
  );
}
