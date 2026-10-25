import { describe, expect, it } from "vitest";
import { lerFeed, lerResolucoesCfq, limparTexto } from "../../supabase/functions/_shared/radar-rss";

const agora = new Date("2026-10-24T12:00:00Z");

describe("leitura de RSS do radar", () => {
  it("lê RSS 2.0 do WordPress (CDATA, entidades, HTML no resumo)", () => {
    const xml = `<?xml version="1.0"?><rss><channel><title>CFQ</title>
      <item><title><![CDATA[Resolução Normativa nº 300 &#8211; CFQ]]></title><link>https://cfq.org.br/noticia/rn-300/</link>
      <pubDate>Fri, 23 Oct 2026 14:30:00 +0000</pubDate><description><![CDATA[<p>O plenário aprovou&nbsp;a norma &amp; seus anexos.</p>]]></description></item>
      <item><title>Sem link</title></item></channel></rss>`;
    expect(lerFeed(xml, agora)).toEqual([{ title: "Resolução Normativa nº 300 – CFQ", link: "https://cfq.org.br/noticia/rn-300/", summary: "O plenário aprovou a norma & seus anexos.", published_at: "2026-10-23T14:30:00.000Z" }]);
  });

  it("lê Atom", () => {
    const xml = `<feed><entry><title>Portaria nova</title><link rel="alternate" href="https://www.gov.br/x"/><updated>2026-10-20T10:00:00Z</updated><summary>Texto</summary></entry></feed>`;
    const [item] = lerFeed(xml, agora);
    expect(item.link).toBe("https://www.gov.br/x");
    expect(item.published_at).toBe("2026-10-20T10:00:00.000Z");
  });

  it("data inválida ou no futuro vira a hora da coleta; resumo longo é cortado", () => {
    const xml = `<rss><item><title>A</title><link>https://a.br/1</link><pubDate>ontem</pubDate><description>${"x".repeat(600)}</description></item>
      <item><title>B</title><link>https://a.br/2</link><pubDate>Mon, 01 Jan 2035 00:00:00 +0000</pubDate></item></rss>`;
    const [a, b] = lerFeed(xml, agora);
    expect(a.published_at).toBe(agora.toISOString());
    expect(b.published_at).toBe(agora.toISOString());
    expect(a.summary?.length).toBe(400);
    expect(b.summary).toBeNull();
  });

  it("descarta anexos, imagens e pastas dos feeds do gov.br", () => {
    const item = (t: string, l: string) => `<item><title>${t}</title><link>${l}</link></item>`;
    const xml = `<rss>${[
      item("Governo reforça combate a incêndios", "https://www.gov.br/mma/pt-br/noticias/governo-reforca"),
      item("protocolo-secas.pdf", "https://www.gov.br/mma/pt-br/publicacoes/protocolo-secas.pdf/view"),
      item("prevfogo ibama", "https://www.gov.br/mma/pt-br/noticias/governo/prevfogo-ibama/view"),
      item("ARTE_IMPRENSA_NOTA.png", "https://www.gov.br/mma/arte.png"),
      item("2026", "https://www.gov.br/ibama/pt-br/assuntos/noticias/2026"),
    ].join("")}</rss>`;
    expect(lerFeed(xml, agora).map((i) => i.title)).toEqual(["Governo reforça combate a incêndios"]);
  });

  it("limpa texto com entidades numéricas e tags", () => {
    expect(limparTexto("<b>Água</b> &#x26; &quot;esgoto&quot;")).toBe('Água & "esgoto"');
  });

  it("lê a lista de resoluções do CFQ pelos links, do id mais novo para o mais velho, sem repetir", () => {
    const html = `<ul><li><a href="viewPageResolucao.php?id=310"><strong>Resolução Normativa nº 310</strong> &#8211; Dispõe sobre a RT</a></li>
      <li><a class="x" href="https://www.cfq.org.br/viewPageResolucao.php?id=355&amp;t=1">RN nº 355 - Atribuições</a></li>
      <li><a href="viewPageResolucao.php?id=310">Resolução Normativa nº 310 (repetida)</a></li>
      <li><a href="/noticia/">Notícia</a></li></ul>`;
    const itens = lerResolucoesCfq(html, "https://www.cfq.org.br/resolucoes/", agora);
    expect(itens.map((i) => i.link)).toEqual(["https://www.cfq.org.br/viewPageResolucao.php?id=355&t=1", "https://www.cfq.org.br/resolucoes/viewPageResolucao.php?id=310"]);
    expect(itens[1].title).toBe("Resolução Normativa nº 310 – Dispõe sobre a RT");
    expect(itens[0].published_at).toBe(agora.toISOString());
  });
});
