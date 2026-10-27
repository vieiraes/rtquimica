import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gravarConsentimento, lerConsentimento, CHAVE_AVISO_COOKIES } from "./cookies";

type Janela = Window & { dataLayer?: IArguments[] };
const eventos = () => ((window as Janela).dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === "event");

async function carregarAnalytics(id = "G-TESTE123") {
  vi.resetModules();
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", id);
  return import("./analytics");
}

beforeEach(() => {
  localStorage.clear();
  delete (window as Janela).dataLayer;
  document.head.querySelectorAll("script[src*='googletagmanager']").forEach((s) => s.remove());
});
afterEach(() => vi.unstubAllEnvs());

describe("consentimento de cookies", () => {
  it("a escolha da versão anterior do aviso (só informativo) não vale: pergunta de novo", () => {
    localStorage.setItem(CHAVE_AVISO_COOKIES, "1");
    expect(lerConsentimento()).toBeNull();
    gravarConsentimento("recusado");
    expect(lerConsentimento()).toBe("recusado");
  });
});

describe("Google Analytics", () => {
  it("sem consentimento não baixa o script nem conta nada", async () => {
    const { registrarVisita } = await carregarAnalytics();
    registrarVisita("/");
    expect(document.querySelector("script[src*='googletagmanager']")).toBeNull();
    expect(eventos()).toHaveLength(0);
  });

  it("com o Aceitar, conta as páginas públicas e nunca o painel", async () => {
    gravarConsentimento("aceito");
    const { registrarVisita } = await carregarAnalytics();
    registrarVisita("/");
    registrarVisita("/painel");
    registrarVisita("/financeiro");
    registrarVisita("/termos/");
    expect(document.querySelector("script[src*='googletagmanager']")?.getAttribute("src")).toContain("id=G-TESTE123");
    expect(eventos().map((e) => (e[2] as { page_path: string }).page_path)).toEqual(["/", "/termos"]);
  });

  it("no painel o gtag fica desligado (a medição otimizada do GA4 não conta a troca de URL) e religa ao voltar", async () => {
    gravarConsentimento("aceito");
    const { registrarVisita } = await carregarAnalytics();
    const w = window as unknown as Record<string, unknown>;
    registrarVisita("/");
    registrarVisita("/painel");
    expect(w["ga-disable-G-TESTE123"]).toBe(true);
    registrarVisita("/privacidade");
    expect(w["ga-disable-G-TESTE123"]).toBe(false);
  });

  it("só manda o caminho: sem ?query nem #hash (o retorno do login traz tokens no hash)", async () => {
    gravarConsentimento("aceito");
    window.history.replaceState(null, "", "/entrar?x=1#access_token=segredo");
    const { registrarVisita } = await carregarAnalytics();
    registrarVisita(window.location.pathname);
    const dados = eventos()[0][2] as { page_location: string };
    expect(dados.page_location).toBe(`${window.location.origin}/entrar`);
    window.history.replaceState(null, "", "/");
  });

  it("a mesma página seguida conta uma vez; voltar a ela depois de outra conta de novo", async () => {
    gravarConsentimento("aceito");
    const { registrarVisita } = await carregarAnalytics();
    registrarVisita("/");
    registrarVisita("/");
    registrarVisita("/painel");
    registrarVisita("/");
    expect(eventos()).toHaveLength(2);
  });

  it("sem o ID configurado (local e testes) nada acontece, mesmo com o Aceitar", async () => {
    gravarConsentimento("aceito");
    const { registrarVisita, analyticsConfigurado } = await carregarAnalytics("");
    registrarVisita("/");
    expect(analyticsConfigurado()).toBe(false);
    expect(document.querySelector("script[src*='googletagmanager']")).toBeNull();
  });

  it("recusar depois de aceitar desliga a medição e apaga os cookies _ga", async () => {
    gravarConsentimento("aceito");
    const { registrarVisita, desligarAnalytics } = await carregarAnalytics();
    registrarVisita("/");
    document.cookie = "_ga=GA1.1.123; path=/";
    document.cookie = "_ga_TESTE123=GS1.1; path=/";
    desligarAnalytics();
    expect(document.cookie).not.toContain("_ga");
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TESTE123"]).toBe(true);
  });
});
