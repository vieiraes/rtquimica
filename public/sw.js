// Service worker do RTQuímico: deixa o app instalável no celular (PWA) e abre a casca do painel mais rápido.
// Não guarda dados: Supabase, Google, Kiwify e qualquer outro endereço de fora vão sempre direto pela rede.
// Mudou a estratégia? Troque CACHE: na ativação as caches antigas são apagadas.
const CACHE = "rtq-v1";

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.add("/app.html")));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;

  // JS e CSS do build têm o hash no nome: a cópia guardada nunca fica velha
  if (url.pathname.startsWith("/assets/")) {
    evento.respondWith(
      caches.match(pedido).then((guardado) => guardado ?? fetch(pedido).then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          void caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      })),
    );
    return;
  }

  // Páginas: sempre a versão nova da rede; sem rede, a casca do painel guardada
  if (pedido.mode === "navigate") {
    evento.respondWith(fetch(pedido).catch(() => caches.match("/app.html")));
  }
});
