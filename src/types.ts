export type Page =
  | "dashboard"
  | "rts"
  | "alertas"
  | "acoes"
  | "checklist"
  | "pops"
  | "empresa"
  | "admin"
  | "perfil";

export type RtStatus = "Ativa" | "Pendente" | "Vencida" | "Cancelada";

export interface RT {
  id: string | number;
  empresa: string;
  cnpj: string;
  documento: "TRT" | "ART" | "CRT";
  numero: string;
  inicio: string;
  vigencia: string;
  status: RtStatus;
  regional: string;
  progresso: number;
}

export interface Alert {
  id: string | number;
  level: "danger" | "warning" | "success" | "info";
  title: string;
  text: string;
  time: string;
  read: boolean;
}

export interface TechnicalAction {
  id: string | number;
  rtId?: string | number;
  category: string;
  company: string;
  description: string;
  date: string;
  evidence: number;
}

export interface RtInsertPayload {
  empresa: string;
  cnpj: string;
  documento: "TRT" | "ART" | "CRT";
  numero: string;
  inicio: string;
  vigencia: string;
  regional: string;
  observacoes: string;
}

export interface ActionInsertPayload {
  rtId: string | number;
  category: string;
  company: string;
  description: string;
}

export interface AuthPayload {
  mode: "login" | "signup";
  name: string;
  email: string;
  crq: string;
  password: string;
}
