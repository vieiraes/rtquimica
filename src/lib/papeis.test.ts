import { describe, expect, it } from "vitest";
import { acessoDesligado, ehQuimico, papelDe, paginaInicial, paginasDoPapel } from "./papeis";

describe("páginas por papel", () => {
  it("superadmin é gestão do produto: só Plataforma e Configurações, nada do painel do químico", () => {
    expect(paginasDoPapel("superadmin")).toEqual(["plataforma", "perfil"]);
    expect(paginaInicial("superadmin")).toBe("plataforma");
    expect(ehQuimico("superadmin")).toBe(false);
  });

  it("empresa contratante não entra no painel (produto só para químicos)", () => {
    expect(acessoDesligado("tenant_external_client")).toBe(true);
    expect(acessoDesligado("tenant_admin")).toBe(false);
    expect(paginasDoPapel("tenant_external_client")).not.toContain("dashboard");
  });

  it("químico tem o Financeiro; superadmin não", () => {
    expect(paginasDoPapel("tenant_member")).toContain("financeiro");
    expect(paginasDoPapel("superadmin")).not.toContain("financeiro");
  });

  it("titular tem a Equipe; químico da equipe não", () => {
    expect(paginasDoPapel("tenant_admin")).toContain("equipe");
    expect(paginasDoPapel("tenant_member")).not.toContain("equipe");
    expect(paginaInicial("tenant_member")).toBe("dashboard");
  });

  it("papel desconhecido ou ausente (demo) vira químico da equipe", () => {
    expect(papelDe("hacker")).toBeNull();
    expect(papelDe(undefined)).toBeNull();
    expect(paginasDoPapel(null)).toEqual(paginasDoPapel("tenant_member"));
  });
});
