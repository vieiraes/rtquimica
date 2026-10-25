import { describe, expect, it } from "vitest";
import { montarGuiaIr } from "./guia-ir";
import { gerarPdfGuiaIr } from "./guia-ir-pdf";

describe("PDF do guia do IR", () => {
  it("gera um PDF de verdade, com o nome do arquivo pelo ano", async () => {
    const guia = montarGuiaIr({
      ano: 2026, regime: "pf", quimico: { nome: "Mariana Vieira", crq: "04289123" },
      lancamentos: [{ kind: "receita", payerType: "pj", payerName: "BioLab", payerDocument: "12.345.678/0001-90", category: null, deductible: false, valor: 1800, retido: 27, pagoEm: "2026-03-10" }],
    });
    const pdf = await gerarPdfGuiaIr(guia);
    const inicio = new TextDecoder("latin1").decode(pdf.bytes.slice(0, 8));
    expect(inicio.startsWith("%PDF-")).toBe(true);
    expect(pdf.bytes.byteLength).toBeGreaterThan(5000);
    expect(pdf.nomeArquivo).toBe("rtquimico-guia-ir-2027-ano-calendario-2026.pdf");
  });
});
