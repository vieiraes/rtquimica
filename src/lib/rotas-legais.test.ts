import { describe, expect, it } from "vitest";
import { paginaDaUrl, ROTA_COOKIES, ROTA_PRIVACIDADE, ROTA_TERMOS, tipoLegal } from "./rotas";

describe("páginas legais", () => {
  it("reconhece as três páginas e nada mais", () => {
    expect(tipoLegal(ROTA_PRIVACIDADE)).toBe("privacidade");
    expect(tipoLegal(ROTA_TERMOS)).toBe("termos");
    expect(tipoLegal(ROTA_COOKIES)).toBe("cookies");
    expect(tipoLegal("/painel")).toBeNull();
    expect(tipoLegal("/")).toBeNull();
  });

  it("não colidem com páginas do painel (abrem com ou sem login)", () => {
    for (const rota of [ROTA_PRIVACIDADE, ROTA_TERMOS, ROTA_COOKIES]) expect(paginaDaUrl(rota)).toBeNull();
  });
});
