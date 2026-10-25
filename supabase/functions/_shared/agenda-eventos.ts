// Eventos que o RTQuímico mantém na agenda "RTQuímico" do Google de cada químico. Código puro (sem Deno nem
// navegador): a Edge Function usa para sincronizar e o Vitest testa direto.
// O id do evento é fixo por item (o Google aceita letras a-v e dígitos): sincronizar de novo atualiza, não duplica.

export interface RtAgenda {
  id: string;
  company_name: string;
  document_type: string;
  document_number: string | null;
  end_date: string;
  status: string;
}

export interface HonorarioAgenda {
  id: string;
  payer_name: string | null;
  description: string;
  amount_cents: number;
  due_date: string;
  paid_on: string | null;
}

export interface EventoGoogle {
  id: string;
  summary: string;
  description: string;
  start: { date: string };
  end: { date: string };
  recurrence?: string[];
  reminders: { useDefault: false; overrides: Array<{ method: "popup"; minutes: number }> };
  transparency: "transparent";
}

const DIA = 24 * 60;
const idDe = (prefixo: string, uuid: string) => prefixo + uuid.replace(/-/g, "").toLowerCase();
const diaSeguinte = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const evento = (id: string, summary: string, description: string, data: string, lembretes: number[]): EventoGoogle => ({
  id, summary, description, start: { date: data }, end: { date: diaSeguinte(data) },
  reminders: { useDefault: false, overrides: lembretes.map((minutes) => ({ method: "popup", minutes })) },
  transparency: "transparent",
});

/** Último dia útil (seg-sex) do mês de `hoje`, em AAAA-MM-DD: início da série mensal do carnê-leão. */
export function ultimoDiaUtil(hoje: Date): string {
  const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0, 12));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function eventosDaAgenda({ rts, honorarios, carneLeao, userId, hoje = new Date() }: {
  rts: RtAgenda[];
  honorarios: HonorarioAgenda[];
  carneLeao: boolean;
  userId: string;
  hoje?: Date;
}): EventoGoogle[] {
  const eventos: EventoGoogle[] = [];
  for (const rt of rts) {
    if (rt.status !== "active" && rt.status !== "pending") continue;
    // Lembretes de 28 dias (o máximo do Google) e 7 dias, como os alertas do painel
    eventos.push(evento(idDe("rt", rt.id), `Vence a ${rt.document_type} da ${rt.company_name}`,
      `${rt.document_type}${rt.document_number ? ` ${rt.document_number}` : ""} vence hoje. Renove e registre no RTQuímico.`, rt.end_date, [28 * DIA, 7 * DIA]));
  }
  for (const h of honorarios) {
    if (h.paid_on) continue;
    eventos.push(evento(idDe("fin", h.id), `Receber: ${h.payer_name ?? h.description} (${reais(h.amount_cents)})`,
      `${h.description}. Quando receber, marque como recebido no Financeiro do RTQuímico.`, h.due_date, [DIA]));
  }
  if (carneLeao) {
    eventos.push({
      ...evento(idDe("carneleao", userId), "Carnê-leão: lançar recebimentos e pagar o DARF",
        "Prazo do carnê-leão do mês anterior. Veja a estimativa no Financeiro do RTQuímico e lance no Carnê-Leão Web (e-CAC).", ultimoDiaUtil(hoje), [3 * DIA]),
      recurrence: ["RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"],
    });
  }
  return eventos;
}
