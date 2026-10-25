// Acesso pela assinatura do escritório (Kiwify). A cobrança só vale quando o link do checkout está configurado
// (VITE_KIWIFY_CHECKOUT_URL): antes disso ninguém é bloqueado.

export type StatusAssinatura = "trial" | "active" | "past_due" | "canceled";

export interface Assinatura {
  status: StatusAssinatura;
  trialEndsAt: string | null;
  paidUntil: string | null;
}

/** Dias de tolerância depois do vencimento, para o pagamento atrasado não cortar o acesso na hora. */
export const TOLERANCIA_DIAS = 5;

export const checkoutUrl = (import.meta.env.VITE_KIWIFY_CHECKOUT_URL as string | undefined)?.trim() || null;
export const cobrancaAtiva = () => Boolean(checkoutUrl);

const dias = (iso: string, agora: number) => Math.ceil((new Date(iso).getTime() - agora) / 86_400_000);

export function situacao(a: Assinatura | null, agora = Date.now()): { liberado: boolean; diasTeste: number | null; mensagem: string } {
  if (!a) return { liberado: true, diasTeste: null, mensagem: "" };
  if (a.status === "active" && (!a.paidUntil || new Date(a.paidUntil).getTime() + TOLERANCIA_DIAS * 86_400_000 > agora)) {
    return { liberado: true, diasTeste: null, mensagem: "Assinatura ativa." };
  }
  if (a.status === "trial" && a.trialEndsAt && new Date(a.trialEndsAt).getTime() > agora) {
    const d = dias(a.trialEndsAt, agora);
    return { liberado: true, diasTeste: d, mensagem: `Teste grátis: ${d === 1 ? "falta 1 dia" : `faltam ${d} dias`}.` };
  }
  if (a.status === "past_due" && a.paidUntil && new Date(a.paidUntil).getTime() + TOLERANCIA_DIAS * 86_400_000 > agora) {
    return { liberado: true, diasTeste: null, mensagem: "O último pagamento não passou. Atualize o pagamento para não perder o acesso." };
  }
  const motivo = a.status === "trial" ? "O teste grátis terminou." : a.status === "canceled" ? "A assinatura foi cancelada." : "A assinatura está com pagamento pendente.";
  return { liberado: false, diasTeste: null, mensagem: motivo };
}

/** Link do checkout com o e-mail preenchido e o código do escritório (sck), que volta no webhook. */
export function linkCheckout(base: string, email: string | null | undefined, tenantId: string) {
  const url = new URL(base);
  if (email) url.searchParams.set("email", email);
  url.searchParams.set("sck", tenantId);
  return url.toString();
}
