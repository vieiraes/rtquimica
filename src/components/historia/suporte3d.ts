// O que o navegador oferece para o palco 3D da landing: WebGL e a preferência de movimento reduzido.
import { useSyncExternalStore } from "react";

/** Há WebGL? Testa sem deixar contexto aberto. */
export function temWebGL(): boolean {
  try {
    if (typeof window === "undefined" || typeof window.WebGLRenderingContext === "undefined") return false;
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const ler = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(CONSULTA).matches : false);

/** `prefers-reduced-motion: reduce` do sistema, atualizado se a pessoa mudar com a página aberta. */
export const useReduzirMovimento = () => useSyncExternalStore(assinar, ler, () => false);
