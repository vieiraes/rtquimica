// Radar regulatório: coleta os RSS das fontes ativas e guarda os itens novos (sem duplicar pelo link).
// Disparado quando o químico abre o Radar; cada fonte só é lida de novo depois de 3 horas.
import { lerFeed, lerResolucoesCfq } from "../_shared/radar-rss.ts";
import { cors, ehQuimico, quemChama, respostaJson } from "../_shared/comum.ts";

const INTERVALO_MS = 3 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respostaJson(405, { erro: "método não permitido" });
  const quem = await quemChama(req);
  if (!quem) return respostaJson(401, { erro: "não autenticado" });
  if (!ehQuimico(quem.papel)) return respostaJson(403, { erro: "disponível só para químicos" });

  const { forcar } = await req.json().catch(() => ({ forcar: false }));
  const { db } = quem;
  const { data: fontes, error } = await db.from("regulatory_sources").select("id, url, kind, last_fetched_at").eq("active", true);
  if (error) return respostaJson(500, { erro: "Não consegui ler as fontes." });

  const vencidas = (fontes ?? []).filter((f) => forcar || !f.last_fetched_at || Date.now() - new Date(f.last_fetched_at).getTime() > INTERVALO_MS);
  const resultado = await Promise.all(vencidas.map(async (f) => {
    try {
      const r = await fetch(f.url, { headers: { "User-Agent": "RTQuimico-Radar/1.0 (+https://rtquimico.web.app)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html" }, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const corpo = await r.text();
      const itens = (f.kind === "cfq-resolucoes" ? lerResolucoesCfq(corpo, f.url) : lerFeed(corpo)).slice(0, 50);
      if (itens.length) {
        const { error: e } = await db.from("regulatory_items").upsert(itens.map((i) => ({ ...i, source_id: f.id })), { onConflict: "link", ignoreDuplicates: true });
        if (e) throw e;
      }
      await db.from("regulatory_sources").update({ last_fetched_at: new Date().toISOString(), last_error: null }).eq("id", f.id);
      return { fonte: f.id, itens: itens.length };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      // Marca a tentativa para não martelar uma fonte fora do ar a cada abertura
      await db.from("regulatory_sources").update({ last_fetched_at: new Date().toISOString(), last_error: mensagem.slice(0, 300) }).eq("id", f.id);
      return { fonte: f.id, erro: mensagem };
    }
  }));
  return respostaJson(200, { lidas: resultado.length, resultado });
});
