import { describe, expect, it } from "vitest";
import { montarGuiaIr, type LancamentoIr } from "./guia-ir";

const l = (p: Partial<LancamentoIr>): LancamentoIr => ({ kind: "receita", payerType: "pj", payerName: null, payerDocument: null, category: null, deductible: false, valor: 0, retido: 0, pagoEm: "2026-03-10", ...p });
const lancamentos: LancamentoIr[] = [
  l({ payerName: "BioLab", payerDocument: "12.345.678/0001-90", valor: 1800, retido: 27, pagoEm: "2026-03-10" }),
  l({ payerName: "BioLab", payerDocument: "12.345.678/0001-90", valor: 1800, retido: 27, pagoEm: "2026-04-10" }),
  l({ payerName: "Aqua Pura", payerDocument: "28.491.730/0001-44", valor: 1500, pagoEm: "2026-04-15" }),
  l({ payerName: "Aqua Pura", payerDocument: "28.491.730/0001-44", valor: 1500, pagoEm: null }), // não recebido: fora
  l({ payerType: "pf", payerName: "Sítio", valor: 6000, pagoEm: "2026-05-02" }),
  l({ kind: "despesa", payerType: null, category: "anuidade_crq", deductible: true, valor: 780, pagoEm: "2026-05-20" }),
  l({ kind: "despesa", payerType: null, category: "deslocamento", deductible: false, valor: 300, pagoEm: "2026-05-21" }),
  l({ payerName: "BioLab", payerDocument: "12.345.678/0001-90", valor: 9999, pagoEm: "2025-12-20" }), // outro ano
];

describe("guia do imposto de renda", () => {
  const guia = montarGuiaIr({ ano: 2026, regime: "pf", quimico: { nome: "Mariana", crq: "04289123" }, lancamentos, hoje: new Date(2027, 2, 1) });

  it("declaração entregue no ano seguinte; uma tabela por empresa com os campos do programa", () => {
    expect(guia.anoEntrega).toBe(2027);
    const pj = guia.secoes[0];
    expect(pj.passos[1]).toContain('"Rendimentos Tributáveis Recebidos de Pessoa Jurídica pelo Titular"');
    expect(pj.tabelas.map((t) => t.titulo)).toEqual(["BioLab", "Aqua Pura"]);
    const biolab = Object.fromEntries(pj.tabelas[0].linhas.map((x) => [x.campo, x.valor]));
    expect(biolab["CPF/CNPJ da fonte pagadora"]).toBe("12.345.678/0001-90");
    expect(biolab["Rendimentos recebidos de pessoa jurídica"]).toBe("R$ 3.600,00");
    expect(biolab["Imposto retido na fonte"]).toBe("R$ 54,00");
  });

  it("carnê-leão mês a mês com livro-caixa só das despesas dedutíveis", () => {
    const pf = guia.secoes[1];
    expect(pf.passos.some((p) => p.includes('"Importar dados do Carnê-Leão"'))).toBe(true);
    const maio = pf.meses!.find((m) => m.mes === "Maio")!;
    expect(maio).toEqual({ mes: "Maio", rendimentos: "R$ 6.000,00", livroCaixa: "R$ 780,00", estimado: expect.stringMatching(/^R\$ /) });
    expect(pf.meses!.find((m) => m.mes === "Janeiro")!.rendimentos).toBe("R$ 0,00");
  });

  it("resumo e detalhe do livro-caixa por categoria", () => {
    expect(Object.fromEntries(guia.resumo)["Recebido de empresas"]).toBe("R$ 5.100,00");
    const detalhe = guia.secoes.find((s) => s.titulo.startsWith("Detalhe do livro-caixa"))!;
    expect(detalhe.tabelas[0].linhas).toEqual([{ campo: "Anuidade do CRQ", valor: "R$ 780,00" }]);
    expect(guia.secoes.at(-1)!.passos[0]).toContain('"Verificar Pendências"');
  });

  it("quem recebe pela empresa vê pró-labore e lucros (código 09), sem carnê-leão", () => {
    const pj = montarGuiaIr({ ano: 2026, regime: "pj", quimico: { nome: "Carla", crq: null }, lancamentos });
    expect(pj.secoes.some((s) => s.titulo.includes("carnê-leão"))).toBe(false);
    expect(pj.secoes[0].passos.join(" ")).toContain('"Lucros e dividendos recebidos" (código 09');
    expect(pj.secoes[0].tabelas[0].linhas[0].campo).toBe("BioLab (12.345.678/0001-90)");
  });
});
