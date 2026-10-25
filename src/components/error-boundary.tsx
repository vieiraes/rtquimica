import { Component, type ErrorInfo, type ReactNode } from "react";
import { Brand } from "./primitives";

/** Rede de segurança do app inteiro: um erro de renderização mostra uma tela de recuperação em vez da página em branco. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="boot-screen" role="alert">
        <Brand />
        <span>Algo deu errado nesta tela. Seus dados não foram perdidos.</span>
        <button className="button primary" onClick={() => window.location.reload()}>Recarregar a página</button>
      </div>
    );
  }
}
