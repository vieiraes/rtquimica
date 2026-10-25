import { describe, expect, it } from "vitest";
import { traduzirErroAuth } from "./auth-erros";

describe("mensagens do login em português", () => {
  it("traduz os erros mais comuns do Auth", () => {
    expect(traduzirErroAuth("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
    expect(traduzirErroAuth("User is banned")).toContain("acesso foi desativado");
    expect(traduzirErroAuth("For security purposes, you can only request this after 30 seconds.")).toContain("Muitas tentativas");
  });

  it("erro desconhecido ou vazio vira mensagem genérica, sem inglês na tela", () => {
    expect(traduzirErroAuth("Something weird happened")).toBe("Não consegui entrar agora. Tente de novo.");
    expect(traduzirErroAuth(undefined)).toBe("Não consegui entrar agora. Tente de novo.");
  });
});
