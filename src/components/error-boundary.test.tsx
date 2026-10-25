import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

afterEach(cleanup);

function Quebra(): never {
  throw new Error("falha de teste");
}

describe("ErrorBoundary", () => {
  it("mostra o conteúdo quando nada quebra", () => {
    render(<ErrorBoundary><p>painel</p></ErrorBoundary>);
    expect(screen.getByText("painel")).toBeTruthy();
  });

  it("troca a página em branco por uma tela de recuperação", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><Quebra /></ErrorBoundary>);
    expect(screen.getByRole("alert").textContent).toContain("Algo deu errado");
    expect(screen.getByRole("button", { name: "Recarregar a página" })).toBeTruthy();
    erro.mockRestore();
  });
});
