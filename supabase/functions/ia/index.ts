// IA do RTQuímico (DeepSeek). O navegador manda a operação e os dados; prompt, modelo e limites ficam aqui.
// Só químicos. Cada chamada reserva cota antes (reservar_uso_ia) e registra tokens em ai_usage_log; falha não conta.
// Operações: diario_redigir (anotação → registro formal), radar_explicar (novidade em linguagem simples + empresas
// afetadas; fica guardada por pessoa) e pop_adaptar (modelo da biblioteca → POP da empresa, como rascunho).
import { corpoDeepseek, lerResposta, montarMensagens, validarEntrada } from "../_shared/ia-diario.ts";
import { lerExplicacao, montarMensagensRadar, textoDaPagina } from "../_shared/ia-radar.ts";
import { lerPop, montarMensagensPop, popEmTexto, validarEntradaPop } from "../_shared/ia-pop.ts";
import { admin, cors, ehQuimico, env, quemChama, respostaJson } from "../_shared/comum.ts";

const MOTIVOS: Record<string, [number, string]> = {
  desligada: [503, "A IA está desligada no momento."],
  por_minuto: [429, "Muitos pedidos seguidos. Espere um minuto e tente de novo."],
  por_mes: [429, "Você usou todos os pedidos à IA deste mês."],
  orcamento: [503, "A IA atingiu o limite de uso do mês. Volta no próximo mês."],
};

type Preparo =
  | { erro: [number, string] }
  | { pronto: unknown }
  | { mensagens: unknown[]; maxTokens: number; ler: (conteudo: string) => unknown | null; depois?: (resultado: unknown) => Promise<unknown> };

type Db = ReturnType<typeof admin>;

async function prepararRadar(db: Db, userId: string, tenantId: string, dados: Record<string, unknown>): Promise<Preparo> {
  const itemId = typeof dados?.item_id === "string" ? dados.item_id : "";
  const { data: guardada } = await db.from("ai_radar_explanations").select("result").eq("user_id", userId).eq("item_id", itemId).maybeSingle();
  if (guardada) return { pronto: { ...guardada.result, guardada: true } };
  const { data: item } = await db.from("regulatory_items").select("id, title, summary, link, regulatory_sources(name)").eq("id", itemId).maybeSingle();
  if (!item) return { erro: [404, "Novidade não encontrada."] };
  const { data: rts } = await db.from("technical_responsibilities").select("company_name, company_cnae, company_cnae_description, company_city, company_state").eq("tenant_id", tenantId).in("status", ["active", "pending"]);
  const empresas = (rts ?? []).map((r) => ({ nome: r.company_name, cnae: r.company_cnae, atividade: r.company_cnae_description, cidade: r.company_city ? `${r.company_city}/${r.company_state ?? ""}` : null }));
  // Contexto da página oficial; se não abrir, a IA trabalha só com título e resumo
  let pagina: string | null = null;
  // Só https público: um feed adulterado não pode fazer o servidor abrir endereço interno
  const publico = /^https:\/\/(?!localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[)/i.test(item.link);
  try {
    if (!publico) throw new Error("link não público");
    const r = await fetch(item.link, { headers: { "User-Agent": "RTQuimico-Radar/1.0" }, signal: AbortSignal.timeout(8000) });
    if (r.ok && (r.headers.get("content-type") ?? "").includes("html")) pagina = textoDaPagina(await r.text()) || null;
  } catch { /* segue sem a página */ }
  const fonte = (item.regulatory_sources as unknown as { name: string } | null)?.name ?? "órgão";
  const nomes = empresas.map((e) => e.nome);
  return {
    mensagens: montarMensagensRadar({ fonte, titulo: item.title, resumo: item.summary, pagina }, empresas),
    maxTokens: 900,
    ler: (c) => lerExplicacao(c, nomes),
    depois: async (resultado) => {
      await db.from("ai_radar_explanations").upsert({ user_id: userId, item_id: item.id, result: resultado });
      return resultado;
    },
  };
}

async function prepararPop(db: Db, tenantId: string, dados: unknown): Promise<Preparo> {
  const v = validarEntradaPop(dados);
  if (!v.ok) return { erro: [400, v.erro] };
  const [{ data: modelo }, { data: rt }] = await Promise.all([
    db.from("sop_templates").select("title, segment, content, tenant_id").eq("id", v.templateId).maybeSingle(),
    db.from("technical_responsibilities").select("company_name, company_cnae, company_cnae_description, tenant_id").eq("id", v.rtId).maybeSingle(),
  ]);
  // Modelo global ou do próprio escritório; RT só do próprio escritório
  if (!modelo || (modelo.tenant_id && modelo.tenant_id !== tenantId)) return { erro: [404, "Modelo não encontrado."] };
  if (!rt || rt.tenant_id !== tenantId) return { erro: [404, "Empresa não encontrada."] };
  return {
    mensagens: montarMensagensPop({ titulo: modelo.title, segmento: modelo.segment, conteudo: modelo.content }, { nome: rt.company_name, cnae: rt.company_cnae, atividade: rt.company_cnae_description }, v.detalhes),
    maxTokens: 2500,
    ler: (c) => {
      const pop = lerPop(c);
      return pop && { titulo: pop.titulo, texto: popEmTexto(pop), pontos_a_confirmar: pop.pontos_a_confirmar };
    },
  };
}

function prepararDiario(dados: unknown): Preparo {
  const entrada = validarEntrada(dados);
  if (!entrada.ok) return { erro: [400, entrada.erro] };
  return { mensagens: montarMensagens(entrada.entrada), maxTokens: 1200, ler: (c) => lerResposta(c, entrada.entrada.categoria) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respostaJson(405, { erro: "método não permitido" });

  const quem = await quemChama(req);
  if (!quem) return respostaJson(401, { erro: "não autenticado" });
  if (!ehQuimico(quem.papel) || !quem.tenantId) return respostaJson(403, { erro: "disponível só para químicos" });
  const { db, user, tenantId } = quem;

  const { operacao, dados } = await req.json().catch(() => ({}));
  const preparo: Preparo = operacao === "diario_redigir" ? prepararDiario(dados)
    : operacao === "radar_explicar" ? await prepararRadar(db, user.id, tenantId, dados)
    : operacao === "pop_adaptar" ? await prepararPop(db, tenantId, dados)
    : { erro: [400, "operação desconhecida"] };
  if ("erro" in preparo) return respostaJson(preparo.erro[0], { erro: preparo.erro[1] });
  if ("pronto" in preparo) return respostaJson(200, preparo.pronto);

  const { data: reserva, error: erroReserva } = await db.rpc("reservar_uso_ia", { p_user: user.id, p_operation: operacao }).single<{ log_id: string | null; motivo: string | null; restantes: number }>();
  if (erroReserva || !reserva) {
    console.error(erroReserva);
    return respostaJson(500, { erro: "Não consegui reservar o uso da IA." });
  }
  if (!reserva.log_id) {
    const [status, mensagem] = MOTIVOS[reserva.motivo ?? ""] ?? [429, "Limite de uso atingido."];
    return respostaJson(status, { erro: mensagem, motivo: reserva.motivo });
  }

  const { data: cfg } = await db.from("ai_config").select("model").eq("id", 1).single();
  try {
    const corpo = { ...corpoDeepseek(cfg?.model ?? "deepseek-flash", preparo.mensagens), max_tokens: preparo.maxTokens };
    const r = await fetch(`${env("DEEPSEEK_URL", "https://api.deepseek.com")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env("DEEPSEEK_API_KEY")}` },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`DeepSeek HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    const json = await r.json();
    const uso = json?.usage ?? {};
    let resultado = preparo.ler(String(json?.choices?.[0]?.message?.content ?? ""));
    await db.from("ai_usage_log").update({
      status: resultado ? "ok" : "erro", prompt_tokens: Number(uso.prompt_tokens ?? 0), completion_tokens: Number(uso.completion_tokens ?? 0),
      total_tokens: Number(uso.total_tokens ?? 0), error: resultado ? null : "resposta fora do formato",
    }).eq("id", reserva.log_id);
    if (!resultado) return respostaJson(502, { erro: "A IA respondeu fora do formato. Tente de novo (não contou no seu limite)." });
    if (preparo.depois) resultado = await preparo.depois(resultado);
    return respostaJson(200, { ...(resultado as object), restantes: reserva.restantes });
  } catch (erro) {
    console.error(erro);
    await db.from("ai_usage_log").update({ status: "erro", error: String(erro).slice(0, 300) }).eq("id", reserva.log_id);
    return respostaJson(502, { erro: "Não consegui falar com a IA agora. Tente de novo (não contou no seu limite)." });
  }
});
