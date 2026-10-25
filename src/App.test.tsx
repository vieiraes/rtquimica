import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

const abrirDemo = () => fireEvent.click(screen.getByRole("button", { name: "Abrir demo sem Supabase" }));

describe("App em modo demonstração", () => {
  it("a landing é só apresentação: história em grade (jsdom não tem WebGL) e nenhum formulário de login", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("protege a sua assinatura");
    expect(document.querySelector(".historia")?.getAttribute("data-palco")).toBe("nao");
    expect(document.querySelectorAll(".capitulos-grade > li")).toHaveLength(6);
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it("Entrar no menu abre a página de login; Teste grátis abre o cadastro", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("link", { name: "Entrar" })[0]);
    expect(window.location.pathname).toBe("/entrar");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Entre na sua conta");
    fireEvent.click(screen.getByRole("link", { name: "Voltar ao site" }));
    expect(window.location.pathname).toBe("/");
    fireEvent.click(screen.getAllByRole("link", { name: /Teste grátis/ })[0]);
    expect(window.location.pathname).toBe("/criar-conta");
    expect(screen.getByLabelText("Número do CRQ")).toBeTruthy();
  });

  it("a demo entra no painel e o menu muda a URL", () => {
    window.history.replaceState(null, "", "/entrar");
    render(<App />);
    abrirDemo();
    expect(window.location.pathname).toBe("/painel");
    fireEvent.click(screen.getByRole("button", { name: /Diário técnico/ }));
    expect(window.location.pathname).toBe("/diario");
  });

  it("página do painel sem login pede login e, depois de entrar, abre a página pedida", () => {
    window.history.replaceState(null, "", "/conformidade");
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Entre na sua conta");
    abrirDemo();
    expect(window.location.pathname).toBe("/conformidade");
  });

  it("página de outro papel por link direto cai na inicial: a demo é químico da equipe, sem Plataforma nem Equipe", () => {
    window.history.replaceState(null, "", "/plataforma");
    render(<App />);
    abrirDemo();
    expect(window.location.pathname).toBe("/painel");
    expect(screen.queryByRole("button", { name: /Usuários da plataforma|Equipe/ })).toBeNull();
    expect(document.querySelector("kbd")).toBeNull();
  });
});
