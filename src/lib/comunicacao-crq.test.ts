import { describe, expect, it } from "vitest";
import { textoComunicacao, type DadosComunicacao } from "./comunicacao-crq";

const base: DadosComunicacao = {
  tipo: "inicio",
  quimico: { nome: "Mariana Vieira", crq: "04289123" },
  regional: "CRQ-IV",
  empresa: { nome: "BioLab Análises", razaoSocial: "BIOLAB ANALISES LTDA", cnpj: "12.345.678/0001-90", cidade: "Campinas", uf: "SP" },
  documento: { tipo: "TRT", numero: "TRT-2026-0182", inicio: "10/01/2026", vigencia: "10/01/2027" },
  hoje: new Date(2026, 9, 25),
};

describe("comunicação ao CRQ", () => {
  it("início: químico, empresa com razão social, CNPJ, cidade, documento e datas", () => {
    const t = textoComunicacao(base);
    expect(t).toContain("Assunto: Comunicação de início de responsabilidade técnica");
    expect(t).toContain("Eu, Mariana Vieira, profissional da Química com registro no CRQ-IV sob o nº 04289123, comunico a este Conselho o início da minha responsabilidade técnica pela empresa BIOLAB ANALISES LTDA (BioLab Análises), inscrita no CNPJ sob o nº 12.345.678/0001-90, estabelecida em Campinas/SP.");
    expect(t).toContain("Documento de referência: TRT nº TRT-2026-0182. Data de início: 10/01/2026. Vigência do documento: até 10/01/2027.");
    expect(t).toContain("Campinas, 25 de outubro de 2026.");
    expect(t.trim().endsWith("CRQ 04289123")).toBe(true);
  });

  it("encerramento usa a data informada (ISO vira dd/mm/aaaa)", () => {
    const t = textoComunicacao({ ...base, tipo: "encerramento", dataEncerramento: "2026-11-03" });
    expect(t).toContain("o encerramento da minha responsabilidade técnica");
    expect(t).toContain("Data de encerramento: 03/11/2026.");
    expect(t).not.toContain("Vigência");
  });

  it("dados que faltam aparecem como [informar], nunca inventados", () => {
    const t = textoComunicacao({ ...base, quimico: { nome: "Carla", crq: null }, empresa: { ...base.empresa, razaoSocial: null, cidade: null }, documento: { ...base.documento, numero: "Sem número" } });
    expect(t).toContain("sob o nº [informar]");
    expect(t).toContain("pela empresa BioLab Análises, inscrita");
    expect(t).toContain("Documento de referência: TRT. ");
    expect(t).toContain("[cidade], ");
  });
});
