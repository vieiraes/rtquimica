import { Component, type ReactNode } from "react";

/** Se o 3D quebrar ao abrir (WebGL, contexto perdido, chunk que não baixou), avisa a seção e some. */
export class Falha3D extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
