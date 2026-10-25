// Aviso de cookies: chave guardada no navegador e o evento que reabre o aviso (rodapé, Configurações, Política de Cookies).
export const CHAVE_AVISO_COOKIES = "rtq-aviso-cookies";
export const VERSAO_AVISO_COOKIES = "1";
export const EVENTO_ABRIR_AVISO_COOKIES = "rtq:abrir-aviso-cookies";

export function abrirAvisoCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_AVISO_COOKIES));
}
