import { describe, expect, it } from "vitest";
import { lerComprovante } from "./ocr-comprovante";

const hoje = new Date("2026-10-25T12:00:00Z");

describe("leitura de comprovante", () => {
  it("boleto da anuidade do CRQ: valor do total, data, CNPJ e categoria", () => {
    const texto = `CONSELHO REGIONAL DE QUIMICA IV REGIAO
CNPJ 62.601.553/0001-20
Anuidade 2026 - Pessoa Fisica
Desconto R$ 39,00
Data do pagamento: 15/03/2026
VALOR PAGO R$ 741,00`;
    expect(lerComprovante(texto, hoje)).toEqual({ valor: 741, data: "2026-03-15", cnpj: "62.601.553/0001-20", categoria: "anuidade_crq", descricao: "CONSELHO REGIONAL DE QUIMICA IV REGIAO" });
  });

  it("cupom de posto: deslocamento, com milhar e data de 2 dígitos", () => {
    const r = lerComprovante("AUTO POSTO BOA VIAGEM LTDA\nGASOLINA COMUM 40,000 L\nTOTAL R$ 1.234,56\n05/10/26 14:22", hoje);
    expect(r.valor).toBe(1234.56);
    expect(r.data).toBe("2026-10-05");
    expect(r.categoria).toBe("deslocamento");
  });

  it("sem linha de total usa o maior valor; ignora data futura (validade) e texto sem nada útil", () => {
    const r = lerComprovante("Inscrição Congresso Brasileiro de Química\nLote 1 R$ 350,00\nTaxa R$ 12,50\nValidade 10/10/2030\nEmitido 01/09/2026", hoje);
    expect(r.valor).toBe(350);
    expect(r.data).toBe("2026-09-01");
    expect(r.categoria).toBe("curso");
    expect(lerComprovante("xx", hoje)).toEqual({ valor: null, data: null, cnpj: null, categoria: null, descricao: null });
  });
});
