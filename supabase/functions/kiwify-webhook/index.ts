// Webhook da Kiwify: liga, atrasa ou cancela a assinatura do escritório. Público (verify_jwt = false); a prova é o
// segredo KIWIFY_WEBHOOK_SECRET, por ?token= na URL ou pela assinatura HMAC-SHA1 do corpo (?signature=, padrão Kiwify).
// Cada evento é gravado uma vez (event_id único): reentrega da Kiwify não aplica de novo.
import { aplicarEvento, iguais, lerEvento } from "../_shared/kiwify.ts";
import { admin, respostaJson } from "../_shared/comum.ts";

async function hmacSha1Hex(segredo: string, corpo: string) {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(corpo));
  return [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return respostaJson(405, { erro: "método não permitido" });
  const segredo = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
  if (!segredo) return respostaJson(503, { erro: "webhook não configurado" });

  const corpo = await req.text();
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const assinatura = (url.searchParams.get("signature") ?? req.headers.get("x-kiwify-signature") ?? "").toLowerCase();
  const valido = (token && iguais(token, segredo)) || (assinatura && iguais(assinatura, await hmacSha1Hex(segredo, corpo)));
  if (!valido) return respostaJson(401, { erro: "assinatura inválida" });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(corpo);
  } catch {
    return respostaJson(400, { erro: "JSON inválido" });
  }

  const evento = lerEvento(payload);
  const db = admin();
  const { data: repetido } = await db.from("billing_events").select("id").eq("event_id", evento.eventId).maybeSingle();
  if (repetido) return respostaJson(200, { repetido: true });

  // Escritório: o código que o app pôs no checkout (sck); senão, o titular com o e-mail da compra
  let tenantId = evento.tenantId;
  if (tenantId) {
    const { data } = await db.from("tenants").select("id").eq("id", tenantId).maybeSingle();
    tenantId = data?.id ?? null;
  }
  if (!tenantId && evento.email) {
    const { data } = await db.from("profiles").select("tenant_id").eq("email", evento.email).eq("role", "tenant_admin").limit(1).maybeSingle();
    tenantId = data?.tenant_id ?? null;
  }

  const mudanca = aplicarEvento(evento);
  const status = !tenantId ? "sem_escritorio" : mudanca ? "aplicado" : "ignorado";
  if (tenantId && mudanca) {
    const { error } = await db.from("tenants").update({
      subscription_status: mudanca.status,
      ...(mudanca.paidUntil ? { paid_until: mudanca.paidUntil } : {}),
      ...(evento.assinaturaId ? { kiwify_subscription_id: evento.assinaturaId } : {}),
      ...(evento.email ? { billing_email: evento.email } : {}),
    }).eq("id", tenantId);
    if (error) {
      console.error(error);
      return respostaJson(500, { erro: "não consegui atualizar o escritório" });
    }
  }
  await db.from("billing_events").insert({ event_id: evento.eventId, event_type: evento.tipoOriginal || "desconhecido", buyer_email: evento.email, tenant_id: tenantId, status, payload });
  return respostaJson(200, { status, tenant_id: tenantId, assinatura: mudanca?.status ?? null });
});
