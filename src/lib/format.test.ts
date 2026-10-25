import { afterEach, describe, expect, it, vi } from "vitest";
import { daysUntil, formatDate, parseBrDate } from "./format";
import { categoryToDb, categoryToUi } from "./mappers";

afterEach(() => vi.useRealTimers());

describe("datas", () => {
  it("lê dd/mm/aaaa e recusa outros formatos", () => {
    expect(parseBrDate("05/03/2026")?.getMonth()).toBe(2);
    expect(parseBrDate("2026-03-05")).toBeNull();
  });

  it("formata ISO em pt-BR sem deslocar o dia pelo fuso", () => {
    expect(formatDate("2026-03-05")).toBe("05/03/2026");
    expect(formatDate(null)).toBe("");
  });

  it("conta os dias até a vigência", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 24, 15, 0));
    expect(daysUntil("11/11/2026")).toBe(18);
    expect(daysUntil("24/10/2026")).toBe(0);
    expect(daysUntil("inválida")).toBeNull();
  });
});

describe("categorias do diário", () => {
  it("ida e volta entre a tela e o banco", () => {
    for (const [ui, db] of Object.entries(categoryToDb)) expect(categoryToUi[db]).toBe(ui);
  });
});
