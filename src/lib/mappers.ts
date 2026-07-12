import type { Alert, RT, TechnicalAction } from "../types";
import { formatDate, formatDateTime } from "./format";

export const statusToUi = {
  active: "Ativa",
  pending: "Pendente",
  expired: "Vencida",
  canceled: "Cancelada",
} as const;

export const categoryToDb: Record<string, string> = {
  "Visita técnica": "visita",
  Coleta: "coleta",
  "Análise": "analise",
  Laudo: "laudo",
  "Orientação": "orientacao",
  Outro: "outro",
};

export const categoryToUi: Record<string, string> = {
  visita: "Visita técnica",
  coleta: "Coleta",
  analise: "Análise",
  laudo: "Laudo",
  orientacao: "Orientação",
  outro: "Outro",
};

export function alertLevel(type: string): Alert["level"] {
  if (type === "vencimento_7") return "danger";
  if (type === "vencimento_30" || type === "comunicacao_pendente") return "warning";
  if (type === "renovacao") return "success";
  return "info";
}

export function mapRt(row: Record<string, unknown>): RT {
  return {
    id: row.id as string,
    empresa: row.company_name as string,
    cnpj: row.company_cnpj as string,
    documento: row.document_type as RT["documento"],
    numero: (row.document_number as string | null) ?? "Sem número",
    inicio: formatDate(row.start_date as string),
    vigencia: formatDate(row.end_date as string),
    status: statusToUi[row.status as keyof typeof statusToUi] ?? "Pendente",
    regional: row.crq_region as string,
    progresso: row.status === "active" ? 80 : 35,
  };
}

export function mapAlert(row: Record<string, unknown>): Alert {
  return {
    id: row.id as string,
    level: alertLevel(row.type as string),
    title: row.title as string,
    text: row.message as string,
    time: formatDateTime(row.created_at as string),
    read: Boolean(row.is_read),
  };
}

export function mapAction(row: Record<string, unknown>): TechnicalAction {
  const rt = row.technical_responsibilities as { company_name?: string } | null;
  return {
    id: row.id as string,
    rtId: row.rt_id as string,
    category: categoryToUi[row.category as string] ?? "Outro",
    company: rt?.company_name ?? "Empresa não encontrada",
    description: row.description as string,
    date: formatDateTime(row.action_date as string),
    evidence: Array.isArray(row.attachments) ? row.attachments.length : 0,
  };
}
