// SEO: título, descrição e indexação de cada página. A mesma tabela serve ao navegador (aplicarCabecalho, a cada troca de
// página) e ao pré-render do build (cabecalhoHtml, que escreve o <head> de cada página pública em HTML estático).
// Trocou o endereço oficial? Mude SITE aqui, o public/robots.txt e o domínio no Search Console.
import { EMPRESA } from "./legal";
import { ROTA_COOKIES, ROTA_CRIAR_CONTA, ROTA_ENTRAR, ROTA_PRIVACIDADE, ROTA_TERMOS, rotaPublica, type RotaPublica } from "./rotas";

export const SITE = "https://rtquimico.web.app";
export const IMAGEM_COMPARTILHAMENTO = `${SITE}/og-rtquimico.png`;

interface Cabecalho {
  titulo: string;
  descricao: string;
}

export const CABECALHOS: Record<RotaPublica, Cabecalho> = {
  "/": {
    titulo: "RTQuímico | Gestão de responsabilidade técnica para químicos",
    descricao: "Vigência de TRT, ART e CRT, comunicação ao CRQ, diário técnico com IA, POPs com fonte normativa e honorários. Para quem assina como RT. 7 dias grátis.",
  },
  [ROTA_CRIAR_CONTA]: {
    titulo: "Criar conta grátis | RTQuímico",
    descricao: "Teste o RTQuímico por 7 dias, sem cartão: prazos de TRT, ART e CRT, Quadro do CRQ, diário técnico e POPs para o responsável técnico da Química.",
  },
  [ROTA_ENTRAR]: {
    titulo: "Entrar | RTQuímico",
    descricao: "Acesse o painel do RTQuímico com e-mail e senha ou com a sua conta Google.",
  },
  [ROTA_PRIVACIDADE]: {
    titulo: "Política de Privacidade | RTQuímico",
    descricao: "Quais dados pessoais o RTQuímico trata, para quê, com quem compartilha e como exercer os seus direitos pela LGPD.",
  },
  [ROTA_TERMOS]: {
    titulo: "Termos de Uso | RTQuímico",
    descricao: "Regras de uso do RTQuímico: o serviço, a assinatura de R$ 79,90 por mês, o teste grátis de 7 dias e o cancelamento.",
  },
  [ROTA_COOKIES]: {
    titulo: "Política de Cookies | RTQuímico",
    descricao: "O que o RTQuímico guarda no seu navegador, a medição de visitas com o seu consentimento e como mudar a sua escolha.",
  },
};

/** Painel, /definir-senha e qualquer outra URL: fora do Google. */
const FORA_DO_INDICE: Cabecalho = { titulo: EMPRESA.produto, descricao: "Gestão de responsabilidade técnica para profissionais da Química." };

/** Dados estruturados da landing (schema.org): o produto e o preço, para o resultado de busca. */
export function dadosEstruturados() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: EMPRESA.produto,
    url: SITE,
    image: IMAGEM_COMPARTILHAMENTO,
    description: CABECALHOS["/"].descricao,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "79.90", priceCurrency: "BRL", url: `${SITE}${ROTA_CRIAR_CONTA}` },
    publisher: { "@type": "Organization", name: EMPRESA.desenvolvedora, email: EMPRESA.contato },
  };
}

function cabecalhoDe(caminho: string) {
  const rota = rotaPublica(caminho);
  return { rota, ...(rota ? CABECALHOS[rota] : FORA_DO_INDICE) };
}

function meta(atributo: "name" | "property", chave: string, conteudo: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${atributo}="${chave}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, chave);
    document.head.appendChild(el);
  }
  el.content = conteudo;
}

/** Atualiza o <head> para a página atual (o Google executa o JavaScript; o pré-render já entrega o mesmo no HTML). */
export function aplicarCabecalho(caminho: string) {
  const { rota, titulo, descricao } = cabecalhoDe(caminho);
  document.title = titulo;
  meta("name", "description", descricao);
  meta("name", "robots", rota ? "index, follow" : "noindex, nofollow");
  meta("property", "og:title", titulo);
  meta("property", "og:description", descricao);
  meta("property", "og:url", `${SITE}${rota ?? "/"}`);
  meta("name", "twitter:title", titulo);
  meta("name", "twitter:description", descricao);
  let canonico = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!rota) {
    canonico?.remove();
    return;
  }
  if (!canonico) {
    canonico = document.createElement("link");
    canonico.rel = "canonical";
    document.head.appendChild(canonico);
  }
  canonico.href = `${SITE}${rota}`;
}

const escapar = (texto: string) => texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** O mesmo cabeçalho em HTML, para o pré-render. `caminho` fora das páginas públicas gera o do painel (noindex). */
export function cabecalhoHtml(caminho: string) {
  const { rota, titulo, descricao } = cabecalhoDe(caminho);
  const t = escapar(titulo);
  const d = escapar(descricao);
  const linhas = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${rota ? "index, follow" : "noindex, nofollow"}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${SITE}${rota ?? "/"}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
  ];
  if (rota) linhas.push(`<link rel="canonical" href="${SITE}${rota}" />`);
  if (rota === "/") linhas.push(`<script type="application/ld+json">${JSON.stringify(dadosEstruturados()).replace(/</g, "\\u003c")}</script>`);
  return linhas.join("\n    ");
}
