import { describe, expect, it } from "vitest";
import { paginaDaUrl, ROTAS } from "./rotas";

describe("rotas do painel", () => {
  it("cada página tem uma URL única e volta para a mesma página", () => {
    const urls = Object.values(ROTAS);
    expect(new Set(urls).size).toBe(urls.length);
    for (const [pagina, url] of Object.entries(ROTAS)) expect(paginaDaUrl(url)).toBe(pagina);
  });

  it("aceita barra no fim e ignora URLs que não são do painel", () => {
    expect(paginaDaUrl("/alertas/")).toBe("alertas");
    expect(paginaDaUrl("/")).toBeNull();
    expect(paginaDaUrl("/nao-existe")).toBeNull();
  });
});
