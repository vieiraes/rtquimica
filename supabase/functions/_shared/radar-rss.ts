// Leitura de RSS 2.0 e Atom sem dependência: os feeds dos órgãos são simples (WordPress, Joomla, Plone).
// Código puro: a Edge Function "radar" usa e o Vitest testa.

export interface ItemRss {
  title: string;
  link: string;
  summary: string | null;
  published_at: string;
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function limparTexto(bruto: string): string {
  return bruto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const tag = (bloco: string, nome: string) => {
  const m = bloco.match(new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, "i"));
  return m ? m[1] : null;
};

function data(bruta: string | null, agora: Date): string {
  const d = bruta ? new Date(limparTexto(bruta)) : null;
  // Data inválida ou no futuro (feed mal configurado) vira a hora da coleta
  return d && !Number.isNaN(d.getTime()) && d.getTime() <= agora.getTime() + 86_400_000 ? d.toISOString() : agora.toISOString();
}

const resumo = (texto: string | null) => {
  if (!texto) return null;
  const limpo = limparTexto(texto);
  return limpo ? (limpo.length > 400 ? `${limpo.slice(0, 397).trimEnd()}...` : limpo) : null;
};

// Feeds do gov.br (Plone) misturam notícias com anexos e imagens delas (link terminando em /view, título de arquivo)
// e até pastas (título "2026"). Isso não é novidade para o químico.
export function ehRuido(title: string, link: string) {
  return /\/view\/?$/.test(link) || /\.(pdf|png|jpe?g|gif|webp|docx?|xlsx?|odt|zip)$/i.test(title) || /^\d{4}$/.test(title);
}

export function lerFeed(xml: string, agora = new Date()): ItemRss[] {
  const itens: ItemRss[] = [];
  for (const bloco of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []) {
    const title = limparTexto(tag(bloco, "title") ?? "");
    const link = limparTexto(tag(bloco, "link") ?? tag(bloco, "guid") ?? "");
    if (!title || !/^https?:\/\//.test(link) || ehRuido(title, link)) continue;
    itens.push({ title, link, summary: resumo(tag(bloco, "description")), published_at: data(tag(bloco, "pubDate") ?? tag(bloco, "dc:date"), agora) });
  }
  for (const bloco of xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []) {
    const title = limparTexto(tag(bloco, "title") ?? "");
    const link = bloco.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "";
    if (!title || !/^https?:\/\//.test(link) || ehRuido(title, link)) continue;
    itens.push({ title, link, summary: resumo(tag(bloco, "summary") ?? tag(bloco, "content")), published_at: data(tag(bloco, "updated") ?? tag(bloco, "published"), agora) });
  }
  return itens;
}

/**
 * Página de resoluções do CFQ (não tem feed). Pega qualquer link para viewPageResolucao.php?id=N, sem depender do
 * layout da página. Sem data na lista: vale a hora da coleta; o link (com o id) evita duplicar.
 */
export function lerResolucoesCfq(html: string, base: string, agora = new Date()): ItemRss[] {
  const vistos = new Set<string>();
  const itens: ItemRss[] = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']*viewPageResolucao\.php\?id=(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const link = new URL(m[1].replace(/&amp;/g, "&"), base).toString();
    const title = limparTexto(m[3]);
    if (!title || vistos.has(link)) continue;
    vistos.add(link);
    itens.push({ title: title.length > 300 ? `${title.slice(0, 297)}...` : title, link, summary: null, published_at: agora.toISOString() });
  }
  // Os ids maiores são as resoluções mais novas
  return itens.sort((a, b) => Number(b.link.match(/id=(\d+)/)![1]) - Number(a.link.match(/id=(\d+)/)![1])).slice(0, 30);
}
