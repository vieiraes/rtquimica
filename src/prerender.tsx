// Entrada do pré-render (vite build --ssr): o HTML estático das páginas públicas, para o Google e para a prévia de link
// (WhatsApp, LinkedIn) lerem sem JavaScript. No navegador, o main.tsx monta o app por cima, do zero.
import { renderToString } from "react-dom/server";
/* eslint-disable react-refresh/only-export-components -- entrada do build, não é módulo de componente (sem recarga a quente) */
import { Landing } from "./components/landing";
import { PaginaLegal } from "./components/legal";
import { tipoLegal } from "./lib/rotas";

export { cabecalhoHtml, SITE } from "./lib/seo";
export { ROTAS_PUBLICAS } from "./lib/rotas";

/** Corpo da página; vazio onde o conteúdo depende do app (login e cadastro: só o cabeçalho vai estático). */
export function renderizar(caminho: string) {
  if (caminho === "/") return renderToString(<Landing />);
  const legal = tipoLegal(caminho);
  return legal ? renderToString(<PaginaLegal tipo={legal} logado={false} />) : "";
}
