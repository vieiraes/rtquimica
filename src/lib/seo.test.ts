import { describe, expect, it } from "vitest";
import { ROTAS, ROTAS_PUBLICAS } from "./rotas";
import { aplicarCabecalho, CABECALHOS, cabecalhoHtml, SITE } from "./seo";

describe("SEO", () => {
  it("toda página pública tem título único e descrição que cabe no resultado do Google", () => {
    const titulos = ROTAS_PUBLICAS.map((r) => CABECALHOS[r].titulo);
    expect(new Set(titulos).size).toBe(ROTAS_PUBLICAS.length);
    for (const r of ROTAS_PUBLICAS) {
      expect(CABECALHOS[r].titulo.length).toBeLessThanOrEqual(65);
      expect(CABECALHOS[r].descricao.length).toBeGreaterThan(50);
      expect(CABECALHOS[r].descricao.length).toBeLessThanOrEqual(160);
    }
  });

  it("páginas do painel ficam fora do Google e sem canonical", () => {
    for (const rota of Object.values(ROTAS)) {
      const html = cabecalhoHtml(rota);
      expect(html).toContain('content="noindex, nofollow"');
      expect(html).not.toContain("canonical");
    }
  });

  it("a landing leva canonical, Open Graph e os dados estruturados com o preço", () => {
    const html = cabecalhoHtml("/");
    expect(html).toContain(`<link rel="canonical" href="${SITE}/" />`);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('"price":"79.90"');
    expect(cabecalhoHtml("/termos")).not.toContain("ld+json");
  });

  it("no navegador, trocar de página troca título, robots e canonical", () => {
    aplicarCabecalho("/privacidade");
    expect(document.title).toBe("Política de Privacidade | RTQuímico");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`${SITE}/privacidade`);
    aplicarCabecalho("/painel");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
