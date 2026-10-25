import { describe, expect, it } from "vitest";
import { linkCheckout, situacao } from "./assinatura";
import { aplicarEvento, iguais, lerEvento } from "../../supabase/functions/_shared/kiwify";

const agora = new Date("2026-10-25T12:00:00Z").getTime();
const dia = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("acesso pela assinatura", () => {
  it("teste grátis conta os dias e libera; vencido bloqueia", () => {
    expect(situacao({ status: "trial", trialEndsAt: iso(agora + 3 * dia), paidUntil: null }, agora)).toMatchObject({ liberado: true, diasTeste: 3, mensagem: "Teste grátis: faltam 3 dias." });
    expect(situacao({ status: "trial", trialEndsAt: iso(agora - dia), paidUntil: null }, agora)).toMatchObject({ liberado: false, mensagem: "O teste grátis terminou." });
  });

  it("ativa libera; pagamento atrasado tem 5 dias de tolerância; cancelada bloqueia", () => {
    expect(situacao({ status: "active", trialEndsAt: null, paidUntil: iso(agora + 10 * dia) }, agora).liberado).toBe(true);
    expect(situacao({ status: "past_due", trialEndsAt: null, paidUntil: iso(agora - 2 * dia) }, agora).liberado).toBe(true);
    expect(situacao({ status: "past_due", trialEndsAt: null, paidUntil: iso(agora - 6 * dia) }, agora).liberado).toBe(false);
    expect(situacao({ status: "canceled", trialEndsAt: null, paidUntil: iso(agora - dia) }, agora).mensagem).toBe("A assinatura foi cancelada.");
    expect(situacao(null, agora).liberado).toBe(true);
  });

  it("link do checkout leva e-mail e o código do escritório", () => {
    const url = new URL(linkCheckout("https://pay.kiwify.com.br/abc123", "mariana@exemplo.com", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
    expect(url.searchParams.get("email")).toBe("mariana@exemplo.com");
    expect(url.searchParams.get("sck")).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });
});

describe("webhook da Kiwify", () => {
  const compra = {
    webhook_event_type: "order_approved", order_id: "ord-1",
    Customer: { email: "Mariana@Exemplo.com" },
    Subscription: { id: "sub-9", next_payment: "2026-11-25T00:00:00Z" },
    TrackingParameters: { sck: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
  };

  it("lê tipo, e-mail, escritório (sck), assinatura e próxima cobrança", () => {
    expect(lerEvento(compra)).toEqual({ tipo: "aprovado", tipoOriginal: "order_approved", eventId: "ord-1:order_approved", email: "mariana@exemplo.com", tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", assinaturaId: "sub-9", proximaCobranca: "2026-11-25T00:00:00Z" });
    expect(lerEvento({ ...compra, TrackingParameters: { sck: "qualquer" } }).tenantId).toBeNull();
  });

  it("aprovado vale até a próxima cobrança; sem data, 31 dias; atrasado, cancelado e reembolso mudam o status", () => {
    expect(aplicarEvento(lerEvento(compra), agora)).toEqual({ status: "active", paidUntil: "2026-11-25T00:00:00.000Z" });
    expect(aplicarEvento(lerEvento({ ...compra, Subscription: {} }), agora)?.paidUntil).toBe(iso(agora + 31 * dia));
    expect(aplicarEvento(lerEvento({ ...compra, webhook_event_type: "subscription_late" }), agora)).toEqual({ status: "past_due" });
    expect(aplicarEvento(lerEvento({ ...compra, webhook_event_type: "order_refunded" }), agora)).toEqual({ status: "canceled" });
    expect(aplicarEvento(lerEvento({ ...compra, webhook_event_type: "pix_created" }), agora)).toBeNull();
  });

  it("comparação de segredo em tempo constante", () => {
    expect(iguais("abc", "abc")).toBe(true);
    expect(iguais("abc", "abd")).toBe(false);
    expect(iguais("abc", "abcd")).toBe(false);
  });
});
