// Aviso de cookies: a escolha guardada no navegador e o evento que reabre o aviso (rodapé, Configurações, Política de Cookies).
// O essencial (sessão de login e esta escolha) não depende de consentimento; a medição de audiência (Google Analytics) depende.
export const CHAVE_AVISO_COOKIES = "rtq-aviso-cookies";
/** Versão do aviso. A 2 passou a pedir consentimento para a medição: quem só viu a 1 é perguntado de novo. */
export const VERSAO_AVISO_COOKIES = "2";
export const EVENTO_ABRIR_AVISO_COOKIES = "rtq:abrir-aviso-cookies";

export type Consentimento = "aceito" | "recusado";

export function abrirAvisoCookies() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_AVISO_COOKIES));
}

/** Escolha da versão atual do aviso; `null` se a pessoa ainda não escolheu (ou o navegador não guarda). */
export function lerConsentimento(): Consentimento | null {
  try {
    const valor = localStorage.getItem(CHAVE_AVISO_COOKIES);
    if (valor === `${VERSAO_AVISO_COOKIES}:aceito`) return "aceito";
    if (valor === `${VERSAO_AVISO_COOKIES}:recusado`) return "recusado";
    return null;
  } catch {
    return null;
  }
}

export function gravarConsentimento(escolha: Consentimento) {
  try {
    localStorage.setItem(CHAVE_AVISO_COOKIES, `${VERSAO_AVISO_COOKIES}:${escolha}`);
  } catch {
    /* navegador sem armazenamento: vale só nesta visita, e o aviso volta na próxima */
  }
}
