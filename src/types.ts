export type Page =
  | "dashboard"
  | "rts"
  | "alertas"
  | "acoes"
  | "checklist"
  | "pops"
  | "financeiro"
  | "radar"
  | "assinatura"
  | "plataforma"
  | "equipe"
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
  /** % do checklist de conformidade salvo; null = ainda sem revisão */
  progresso: number | null;
  /** Da consulta de CNPJ (quando houve) */
  razaoSocial?: string | null;
  cidade?: string | null;
  uf?: string | null;
  /** AAAA-MM-DD, para formulários */
  inicioIso?: string;
  /** Quando a RT foi cadastrada (ISO): conta o prazo de 24 h da comunicação ao CRQ */
  criadoEm?: string;
  /** Comunicação ao CRQ: data (ISO) e protocolo do início e do encerramento; sem data = pendente */
  crqInicioEm?: string | null;
  crqInicioProtocolo?: string | null;
  crqFimEm?: string | null;
  crqFimProtocolo?: string | null;
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
  /** ISO da data da ação (filtros e relatório) */
  dataIso?: string;
  /** Arquivos de evidência no Storage (bucket documentos, pasta do escritório) */
  anexos?: Array<{ path: string; name: string }>;
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
  /** Preenchidos pela consulta de CNPJ, quando ela responde */
  empresaDados?: { razaoSocial: string; cnae: string | null; cnaeDescricao: string | null; municipio: string | null; uf: string | null };
}

export interface ActionInsertPayload {
  rtId: string | number;
  category: string;
  company: string;
  description: string;
  arquivos?: File[];
}

export interface AuthPayload {
  mode: "login" | "signup";
  name: string;
  email: string;
  crq: string;
  password: string;
}
