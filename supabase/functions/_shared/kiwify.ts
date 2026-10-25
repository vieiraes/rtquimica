// Regras puras do webhook da Kiwify (sem Deno, sem banco): a Edge Function kiwify-webhook usa e o Vitest testa.
// Padrão do Chef Suite, simplificado: o RTQuímico tem um plano só e a assinatura é do escritório (tenant).

export type StatusAssinatura = "trial" | "active" | "past_due" | "canceled";

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const primeiro = (vs: unknown[]) => vs.map((v) => String(v ?? "").trim()).find(Boolean) ?? "";

const EVENTOS: Record<string, string> = {
  purchase_approved: "aprovado", order_approved: "aprovado", sale_approved: "aprovado", payment_approved: "aprovado", paid: "aprovado",
  subscription_renewal: "renovado", subscription_renewed: "renovado", recurring_payment_approved: "renovado",
  payment_failed: "atrasado", recurring_payment_failed: "atrasado", subscription_payment_failed: "atrasado", subscription_late: "atrasado", invoice_overdue: "atrasado",
  purchase_canceled: "cancelado", order_canceled: "cancelado", subscription_canceled: "cancelado",
  purchase_refunded: "reembolsado", order_refunded: "reembolsado", refunded: "reembolsado", chargeback: "reembolsado", chargedback: "reembolsado",
  subscription_expired: "cancelado", access_expired: "cancelado",
};

export interface EventoKiwify {
  tipo: "aprovado" | "renovado" | "atrasado" | "cancelado" | "reembolsado" | "outro";
  tipoOriginal: string;
  eventId: string;
  email: string | null;
  /** Código do escritório que o app põe no link do checkout (?sck=) */
  tenantId: string | null;
  assinaturaId: string | null;
  proximaCobranca: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lerEvento(payload: Record<string, unknown>): EventoKiwify {
  const cliente = asRecord(payload.Customer ?? payload.customer);
  const assinatura = asRecord(payload.Subscription ?? payload.subscription);
  const rastreio = asRecord(payload.TrackingParameters ?? payload.tracking_parameters ?? payload.tracking);
  const tipoOriginal = primeiro([payload.webhook_event_type, payload.event, payload.event_type, payload.order_status]).toLowerCase();
  const sck = primeiro([rastreio.sck, rastreio.s1, payload.sck]);
  return {
    tipo: (EVENTOS[tipoOriginal] as EventoKiwify["tipo"]) ?? "outro",
    tipoOriginal,
    eventId: primeiro([payload.order_id, payload.transaction_id, payload.sale_id, payload.id]) + (tipoOriginal ? `:${tipoOriginal}` : ""),
    email: primeiro([cliente.email, payload.email, payload.buyer_email]).toLowerCase() || null,
    tenantId: UUID.test(sck) ? sck : null,
    assinaturaId: primeiro([payload.subscription_id, assinatura.id]) || null,
    proximaCobranca: primeiro([assinatura.next_payment, assinatura.charges_next_payment]) || null,
  };
}

/** Novo estado do escritório para um evento. `agora` em ms. Pagamento vale até a próxima cobrança (ou 31 dias). */
export function aplicarEvento(evento: EventoKiwify, agora = Date.now()): { status: StatusAssinatura; paidUntil?: string } | null {
  if (evento.tipo === "aprovado" || evento.tipo === "renovado") {
    const proxima = evento.proximaCobranca ? new Date(evento.proximaCobranca) : null;
    const ate = proxima && !Number.isNaN(proxima.getTime()) && proxima.getTime() > agora ? proxima : new Date(agora + 31 * 86_400_000);
    return { status: "active", paidUntil: ate.toISOString() };
  }
  if (evento.tipo === "atrasado") return { status: "past_due" };
  if (evento.tipo === "cancelado" || evento.tipo === "reembolsado") return { status: "canceled" };
  return null;
}

/** Comparação em tempo constante (token e assinatura). */
export function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
