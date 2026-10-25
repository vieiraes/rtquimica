import { describe, expect, it } from "vitest";
import { calcularCarneLeao, vencimentoDarf } from "./impostos";

describe("carnê-leão 2026", () => {
  it("exemplo da Receita: R$ 6.000 com desconto simplificado dá R$ 394,54", () => {
    const c = calcularCarneLeao(6000, 0);
    expect(c.usouSimplificado).toBe(true);
    expect(c.base).toBe(5392.8);
    expect(c.impostoTabela).toBe(574.29);
    expect(c.reducao).toBe(179.75);
    expect(c.imposto).toBe(394.54);
  });

  it("até R$ 5.000 o imposto zera pela redução", () => {
    expect(calcularCarneLeao(5000, 0).imposto).toBe(0);
    expect(calcularCarneLeao(1200, 0).imposto).toBe(0);
  });

  it("livro-caixa maior que o desconto simplificado entra no lugar dele", () => {
    const c = calcularCarneLeao(10000, 2000);
    expect(c.usouSimplificado).toBe(false);
    expect(c.base).toBe(8000);
    expect(c.reducao).toBe(0);
    expect(c.imposto).toBe(1291.27);
  });

  it("sem rendimento não há imposto nem base negativa", () => {
    const c = calcularCarneLeao(0, 800);
    expect(c.base).toBe(0);
    expect(c.imposto).toBe(0);
  });

  it("DARF vence no último dia útil do mês seguinte", () => {
    expect(vencimentoDarf(2026, 9).toISOString().slice(0, 10)).toBe("2026-11-30"); // outubro → 30/11 (segunda)
    expect(vencimentoDarf(2026, 6).getDate()).toBe(31); // julho → 31/08/2026 (segunda)
    expect(vencimentoDarf(2026, 4).getDate()).toBe(30); // maio → 30/06/2026 (terça)
    expect(vencimentoDarf(2026, 3).getDate()).toBe(29); // abril → 31/05 é domingo → 29/05 (sexta)
  });
});
