import { describe, expect, it } from "vitest";
import { CAPITULOS, EMPRESAS, formatarHora, horaDoCapitulo, pinos, poseEm, presenca, tPelaRolagem, ULTIMO } from "./historia";
import { HISTORIA } from "./conteudo";

describe("história da maquete", () => {
  it("um cartão por capítulo, na mesma ordem", () => {
    expect(HISTORIA.map((c) => c.id)).toEqual(CAPITULOS.map((c) => c.id));
  });

  it("a rolagem vira T: inteiro no meio de cada capítulo e fração entre eles", () => {
    const centros = [100, 300, 500];
    expect(tPelaRolagem(centros, 50)).toBe(0);
    expect(tPelaRolagem(centros, 300)).toBe(1);
    expect(tPelaRolagem(centros, 400)).toBeCloseTo(1.5);
    expect(tPelaRolagem(centros, 900)).toBe(2);
    expect(tPelaRolagem([], 300)).toBe(0);
  });

  it("em T inteiro a câmera está exatamente na pose do capítulo", () => {
    CAPITULOS.forEach((c, i) => expect(poseEm(i)).toEqual(c.pose));
  });

  it("relógio de 5 em 5 minutos e horas do primeiro e do último capítulo", () => {
    expect(formatarHora(8 * 60 + 32)).toBe("08:30");
    expect(formatarHora(8 * 60 + 33)).toBe("08:35");
    expect(horaDoCapitulo(0)).toBe("07:00");
    expect(horaDoCapitulo(ULTIMO)).toBe("19:00");
  });

  it("o pino só aparece perto do seu capítulo", () => {
    expect(presenca(2, 2)).toBe(1);
    expect(presenca(2.9, 2)).toBe(0);
  });

  it("todo pino aponta para um capítulo que existe e cada empresa tem nome na abertura", () => {
    const lista = pinos();
    expect(new Set(lista.map((p) => p.id)).size).toBe(lista.length);
    for (const p of lista) {
      expect(p.capitulo).toBeGreaterThanOrEqual(0);
      expect(p.capitulo).toBeLessThanOrEqual(ULTIMO);
    }
    for (const e of EMPRESAS) expect(lista.some((p) => p.capitulo === 0 && p.texto === e.nome)).toBe(true);
  });
});
