import { afterEach, describe, expect, it, vi } from "vitest";
import { cnpjValido, consultarCnpj, deBrasilApi, deCnpjWs, formatarCnae, formatarCnpj } from "./cnpj";

afterEach(() => vi.unstubAllGlobals());

describe("CNPJ", () => {
  it("valida os dígitos verificadores", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("11.111.111/1111-11")).toBe(false);
    expect(cnpjValido("123")).toBe(false);
  });

  it("formata CNPJ e CNAE", () => {
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatarCnae(7120100)).toBe("7120-1/00");
    expect(formatarCnae("3600601")).toBe("3600-6/01");
    expect(formatarCnae(null)).toBeNull();
  });

  it("lê a resposta da BrasilAPI", () => {
    const d = deBrasilApi({ cnpj: "11222333000181", razao_social: "LABORATORIO TESTE LTDA", nome_fantasia: "", descricao_situacao_cadastral: "ATIVA", cnae_fiscal: 7120100, cnae_fiscal_descricao: "Testes e análises técnicas", municipio: "CAMPINAS", uf: "SP" });
    expect(d).toEqual({ cnpj: "11.222.333/0001-81", razaoSocial: "LABORATORIO TESTE LTDA", nomeFantasia: null, situacao: "ATIVA", ativa: true, cnae: "7120-1/00", cnaeDescricao: "Testes e análises técnicas", municipio: "CAMPINAS", uf: "SP" });
  });

  it("lê a resposta da CNPJ.ws e marca empresa baixada como inativa", () => {
    const d = deCnpjWs({ razao_social: "ÁGUA LIMPA SA", estabelecimento: { cnpj: "11222333000181", nome_fantasia: "Água Limpa", situacao_cadastral: "Baixada", atividade_principal: { id: "3600601", descricao: "Captação, tratamento e distribuição de água" }, cidade: { nome: "Santos" }, estado: { sigla: "SP" } } });
    expect(d.ativa).toBe(false);
    expect(d.situacao).toBe("BAIXADA");
    expect(d.cnae).toBe("3600-6/01");
    expect(d.municipio).toBe("Santos");
  });

  it("usa a CNPJ.ws quando a BrasilAPI falha; 404 nas duas = CNPJ não existe", async () => {
    const fetchFalso = vi.fn()
      .mockResolvedValueOnce(new Response("erro", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ razao_social: "RESERVA LTDA", estabelecimento: { cnpj: "11222333000181", situacao_cadastral: "Ativa" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchFalso);
    expect((await consultarCnpj("11.222.333/0001-81"))?.razaoSocial).toBe("RESERVA LTDA");
    expect(fetchFalso.mock.calls[1][0]).toContain("publica.cnpj.ws");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    expect(await consultarCnpj("04.252.011/0001-10")).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(consultarCnpj("33.000.167/0001-01")).rejects.toThrow("indisponível");
  });
});
