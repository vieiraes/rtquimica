// Rotas do painel: cada página tem uma URL própria (deep-link, F5 e voltar do navegador).
// History API nativa: são páginas planas, sem parâmetros; se surgir rota com parâmetro, trocar por um router.
import { useCallback, useEffect, useState } from "react";
import type { Page } from "../types";

export const ROTAS: Record<Page, string> = {
  dashboard: "/painel",
  rts: "/responsabilidades",
  alertas: "/alertas",
  acoes: "/diario",
  checklist: "/conformidade",
  pops: "/pops",
  financeiro: "/financeiro",
  radar: "/radar",
  assinatura: "/assinatura",
  plataforma: "/plataforma",
  equipe: "/equipe",
  perfil: "/configuracoes",
};

/** Páginas públicas de acesso (fora do painel). */
export const ROTA_ENTRAR = "/entrar";
export const ROTA_CRIAR_CONTA = "/criar-conta";
/** Volta do e-mail de convite ou de "esqueci a senha" (sessão de recuperação do Auth). */
export const ROTA_DEFINIR_SENHA = "/definir-senha";

/** Navega sem recarregar e avisa os hooks de rota (o mesmo evento do voltar do navegador). */
export function navegar(caminho: string, { substituir = false } = {}) {
  if (substituir) window.history.replaceState(null, "", caminho);
  else if (window.location.pathname !== caminho) window.history.pushState(null, "", caminho);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** Caminho atual da URL, atualizado no voltar/avançar e em `navegar`. */
export function useCaminho() {
  const [caminho, setCaminho] = useState(() => window.location.pathname);
  useEffect(() => {
    const aoMudar = () => setCaminho(window.location.pathname);
    window.addEventListener("popstate", aoMudar);
    return () => window.removeEventListener("popstate", aoMudar);
  }, []);
  return caminho;
}

const PAGINA_POR_ROTA = new Map<string, Page>(Object.entries(ROTAS).map(([pagina, rota]) => [rota, pagina as Page]));

/** Página da URL atual; `null` quando a URL não é de nenhuma página do painel (ex.: "/" da landing). */
export function paginaDaUrl(pathname: string): Page | null {
  const limpo = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PAGINA_POR_ROTA.get(limpo) ?? null;
}

/** Página do painel sincronizada com a URL. `ir` empilha no histórico; `substituir` troca a entrada atual. */
export function usePagina(padrao: Page = "dashboard") {
  const [pagina, setPagina] = useState<Page>(() => paginaDaUrl(window.location.pathname) ?? padrao);

  useEffect(() => {
    const aoVoltar = () => setPagina(paginaDaUrl(window.location.pathname) ?? padrao);
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, [padrao]);

  const ir = useCallback((proxima: Page) => {
    if (window.location.pathname !== ROTAS[proxima]) window.history.pushState(null, "", ROTAS[proxima]);
    setPagina(proxima);
  }, []);

  const substituir = useCallback((proxima: Page) => {
    window.history.replaceState(null, "", ROTAS[proxima]);
    setPagina(proxima);
  }, []);

  return { pagina, ir, substituir };
}
