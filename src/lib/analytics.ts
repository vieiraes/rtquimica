// Google Analytics 4 (gtag.js), ligado ao Firebase do projeto rtquimico.
// Regras: só carrega depois do "Aceitar" no aviso de cookies e só mede as páginas públicas (ROTAS_PUBLICAS);
// o painel nunca é medido. Sem VITE_GA_MEASUREMENT_ID (local e testes), nada é carregado.
// Vai só o caminho da página (sem ?query nem #hash, onde o retorno do login traz tokens). Sem Google Signals nem anúncios.
import { lerConsentimento } from "./cookies";
import { rotaPublica } from "./rotas";

const ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").trim();
/** 13 meses, em segundos: o padrão do Google é 2 anos. */
const VALIDADE_COOKIE = 60 * 60 * 24 * 395;

type Gtag = (...args: unknown[]) => void;
type JanelaComGtag = Window & { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;
const janela = () => window as unknown as JanelaComGtag;

let carregado = false;
/** Última página contada: o App chama de novo quando muda estado sem mudar de página, e isso não é visita nova. */
let ultima = "";

export const analyticsConfigurado = () => ID !== "";

function carregar() {
  const w = janela();
  w[`ga-disable-${ID}`] = false;
  if (carregado) {
    w.gtag?.("consent", "update", { analytics_storage: "granted" });
    return;
  }
  carregado = true;
  w.dataLayer = w.dataLayer ?? [];
  // O gtag.js espera o objeto `arguments`, não um array
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  w.gtag("js", new Date());
  w.gtag("config", ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: VALIDADE_COOKIE,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
  document.head.appendChild(script);
}

/** Conta a visita à página, se ela for pública e a pessoa tiver aceitado. Chamar depois de trocar o título. */
export function registrarVisita(caminho: string) {
  const rota = rotaPublica(caminho);
  if (!rota) {
    ultima = "";
    // Trava extra: se a "medição otimizada" do GA4 estiver ligada, ela contaria a troca de URL para o painel sozinha
    if (carregado) janela()[`ga-disable-${ID}`] = true;
    return;
  }
  if (!analyticsConfigurado() || rota === ultima || lerConsentimento() !== "aceito") return;
  ultima = rota;
  carregar();
  janela().gtag?.("event", "page_view", {
    page_location: `${window.location.origin}${rota}`,
    page_path: rota,
    page_title: document.title,
  });
}

/** Recusou depois de ter aceitado: para de medir nesta aba e apaga os cookies do Analytics. */
export function desligarAnalytics() {
  if (!analyticsConfigurado()) return;
  const w = janela();
  w[`ga-disable-${ID}`] = true;
  ultima = "";
  w.gtag?.("consent", "update", { analytics_storage: "denied" });
  const dominios = ["", window.location.hostname, `.${window.location.hostname}`];
  for (const nome of document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_ga" || n.startsWith("_ga_"))) {
    for (const dominio of dominios) {
      document.cookie = `${nome}=; Max-Age=0; path=/${dominio ? `; domain=${dominio}` : ""}`;
    }
  }
}
