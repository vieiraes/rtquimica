// App instalável (PWA): registro do service worker e as regras do banner "Instale no celular" do painel.
// Regras do owner (26/10/2026): só no celular, só depois do login; "Agora não" esconde por 30 dias; instalado, nunca mais.
// Android (Chrome, Edge, Samsung) dá o evento beforeinstallprompt e o banner abre o pedido de instalação de verdade;
// iPhone não tem esse evento, então o banner mostra o caminho no Safari (Compartilhar → Adicionar à Tela de Início).

export const CHAVE_INSTALAR_APP = "rtq-instalar-app";
export const DIAS_ADIAR = 30;
const EVENTO_MUDOU = "rtq:instalar-app";

/** O evento do Chrome que permite abrir o pedido de instalação (não está nos tipos do TypeScript). */
interface PedidoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let pedido: PedidoInstalacao | null = null;

/** Liga o service worker e guarda o pedido de instalação. Chamar uma vez, no main.tsx, antes de montar o app. */
export function iniciarApp() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault(); // o navegador não mostra a barra dele; o banner do painel oferece na hora certa
    pedido = evento as PedidoInstalacao;
    window.dispatchEvent(new Event(EVENTO_MUDOU));
  });
  window.addEventListener("appinstalled", () => {
    marcarInstalado();
    pedido = null;
    window.dispatchEvent(new Event(EVENTO_MUDOU));
  });
  // Só no build: no `npm run dev` o service worker guardaria arquivos que o Vite troca a cada edição
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}

export const aoMudarInstalacao = (cb: () => void) => {
  window.addEventListener(EVENTO_MUDOU, cb);
  return () => window.removeEventListener(EVENTO_MUDOU, cb);
};

export const temPedidoInstalacao = () => pedido !== null;

/** Abre o pedido de instalação do Android. `true` se a pessoa instalou. */
export async function pedirInstalacao() {
  if (!pedido) return false;
  const atual = pedido;
  pedido = null;
  await atual.prompt();
  const { outcome } = await atual.userChoice;
  if (outcome === "accepted") marcarInstalado();
  window.dispatchEvent(new Event(EVENTO_MUDOU));
  return outcome === "accepted";
}

export type Aparelho = "android" | "iphone" | "computador";

/** iPadOS se apresenta como Mac: o toque é o que denuncia. */
export function aparelhoDe(userAgent: string, toques = 0): Aparelho {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && toques > 1)) return "iphone";
  if (/Android|Mobile/i.test(userAgent)) return "android";
  return "computador";
}

/** Aberto pelo ícone da tela inicial (já instalado)? */
export function abertoComoApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function lerEscolha() {
  try {
    return localStorage.getItem(CHAVE_INSTALAR_APP);
  } catch {
    return null;
  }
}

function gravarEscolha(valor: string) {
  try {
    localStorage.setItem(CHAVE_INSTALAR_APP, valor);
  } catch {
    /* navegador sem armazenamento: o banner volta na próxima visita */
  }
}

function marcarInstalado() {
  gravarEscolha("instalado");
}

/** "Agora não": volta daqui a 30 dias. */
export function adiarBanner(agora = new Date()) {
  gravarEscolha(new Date(agora.getTime() + DIAS_ADIAR * 86_400_000).toISOString());
}

/** Mostrar o banner? Celular, fora do app instalado, nunca instalado e fora do prazo do "Agora não". */
export function deveMostrarBanner({ aparelho, comoApp, escolha, agora = new Date() }: { aparelho: Aparelho; comoApp: boolean; escolha: string | null; agora?: Date }) {
  if (aparelho === "computador" || comoApp || escolha === "instalado") return false;
  if (!escolha) return true;
  const ate = Date.parse(escolha);
  return Number.isNaN(ate) || agora.getTime() >= ate;
}

/** As mesmas regras, lidas do navegador atual. */
export function mostrarBannerAgora() {
  return deveMostrarBanner({ aparelho: aparelhoDe(navigator.userAgent, navigator.maxTouchPoints ?? 0), comoApp: abertoComoApp(), escolha: lerEscolha() });
}
