import { describe, expect, it } from "vitest";
import { eventosDaAgenda, ultimoDiaUtil } from "../../supabase/functions/_shared/agenda-eventos";

const rt = { id: "d1111111-1111-1111-1111-111111111111", company_name: "BioLab Análises", document_type: "TRT", document_number: "TRT-2026-0182", end_date: "2027-01-10", status: "active" };
const honorario = { id: "0f0e0d0c-0b0a-0908-0706-050403020100", payer_name: "Aqua Pura", description: "Honorários de RT", amount_cents: 150000, due_date: "2026-11-05", paid_on: null };
const userId = "22222222-2222-2222-2222-222222222222";

describe("eventos da agenda do Google", () => {
  it("vencimento da RT vira evento de dia inteiro com lembretes de 28 e 7 dias", () => {
    const [e] = eventosDaAgenda({ rts: [rt], honorarios: [], carneLeao: false, userId });
    expect(e.summary).toBe("Vence a TRT da BioLab Análises");
    expect(e.start).toEqual({ date: "2027-01-10" });
    expect(e.end).toEqual({ date: "2027-01-11" });
    expect(e.reminders.overrides.map((r) => r.minutes)).toEqual([40320, 10080]);
  });

  it("ids aceitos pelo Google (só a-v e 0-9) e fixos: sincronizar de novo não duplica", () => {
    const a = eventosDaAgenda({ rts: [rt], honorarios: [honorario], carneLeao: true, userId });
    const b = eventosDaAgenda({ rts: [rt], honorarios: [honorario], carneLeao: true, userId });
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
    for (const e of a) expect(e.id).toMatch(/^[a-v0-9]{5,1024}$/);
  });

  it("honorário recebido, RT vencida ou cancelada não entram", () => {
    const eventos = eventosDaAgenda({
      rts: [{ ...rt, status: "expired" }, { ...rt, id: "d2222222-2222-2222-2222-222222222222", status: "canceled" }],
      honorarios: [{ ...honorario, paid_on: "2026-11-01" }],
      carneLeao: false,
      userId,
    });
    expect(eventos).toHaveLength(0);
  });

  it("honorário em aberto mostra pagador e valor", () => {
    const [e] = eventosDaAgenda({ rts: [], honorarios: [honorario], carneLeao: false, userId });
    expect(e.summary.replace(/\s/g, " ")).toBe("Receber: Aqua Pura (R$ 1.500,00)");
  });

  it("carnê-leão é uma série mensal no último dia útil, só para quem recebe no CPF", () => {
    expect(eventosDaAgenda({ rts: [], honorarios: [], carneLeao: false, userId })).toHaveLength(0);
    const [e] = eventosDaAgenda({ rts: [], honorarios: [], carneLeao: true, userId, hoje: new Date("2026-05-10T12:00:00Z") });
    expect(e.recurrence).toEqual(["RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1"]);
    expect(e.start.date).toBe("2026-05-29"); // 31/05/2026 é domingo
    expect(ultimoDiaUtil(new Date("2026-10-24T12:00:00Z"))).toBe("2026-10-30");
  });
});
