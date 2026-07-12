import type { Alert, RT, TechnicalAction } from "../types";

export const initialRts: RT[] = [
  { id: 1, empresa: "BioLab Análises", cnpj: "12.345.678/0001-90", documento: "TRT", numero: "TRT-2026-0182", inicio: "10/01/2026", vigencia: "10/01/2027", status: "Ativa", regional: "CRQ-IV", progresso: 92 },
  { id: 2, empresa: "Aqua Pura Ambiental", cnpj: "28.491.730/0001-44", documento: "ART", numero: "ART-2025-0941", inicio: "22/07/2025", vigencia: "22/07/2026", status: "Ativa", regional: "CRQ-IV", progresso: 76 },
  { id: 3, empresa: "QuimNova Indústria", cnpj: "43.981.275/0001-08", documento: "CRT", numero: "CRT-2025-2210", inicio: "28/06/2025", vigencia: "28/06/2026", status: "Pendente", regional: "CRQ-IV", progresso: 58 },
  { id: 4, empresa: "Verde Ciclo Efluentes", cnpj: "09.441.875/0001-31", documento: "TRT", numero: "TRT-2025-0672", inicio: "14/09/2025", vigencia: "14/09/2026", status: "Ativa", regional: "CRQ-IV", progresso: 84 },
];

export const initialAlerts: Alert[] = [
  { id: 1, level: "danger", title: "CRT vence em 18 dias", text: "QuimNova Indústria precisa iniciar a renovação.", time: "Hoje, 08:40", read: false },
  { id: 2, level: "warning", title: "Comunicação ao CRQ pendente", text: "Confirme o protocolo da nova responsabilidade técnica.", time: "Ontem, 16:20", read: false },
  { id: 3, level: "info", title: "Documento solicitado", text: "Aqua Pura Ambiental solicitou acesso ao relatório mensal.", time: "8 jun, 10:05", read: false },
  { id: 4, level: "success", title: "Renovação concluída", text: "A TRT da BioLab Análises foi atualizada com sucesso.", time: "5 jun, 14:30", read: true },
];

export const initialActions: TechnicalAction[] = [
  { id: 1, category: "Visita técnica", company: "BioLab Análises", description: "Inspeção das rotinas de preparo de amostras e atualização do livro de registros.", date: "10 jun 2026, 09:30", evidence: 3 },
  { id: 2, category: "Orientação", company: "Aqua Pura Ambiental", description: "Treinamento da equipe sobre armazenamento e identificação de reagentes.", date: "7 jun 2026, 14:00", evidence: 1 },
  { id: 3, category: "Laudo", company: "Verde Ciclo Efluentes", description: "Emissão de parecer técnico sobre os resultados do monitoramento de efluentes.", date: "3 jun 2026, 11:20", evidence: 2 },
];

export const checklistItems = [
  { name: "TRT vigente e assinada", done: true },
  { name: "ART atualizada", done: true },
  { name: "Comunicação ao CRQ protocolada", done: false },
  { name: "Documentos cadastrais da empresa", done: true },
  { name: "POPs disponíveis e revisados", done: false },
  { name: "Livro de ocorrências atualizado", done: true },
];

export const popTemplates = [
  { title: "Coleta de amostras de água", segment: "Coleta de Amostras", description: "Padroniza identificação, preservação, transporte e cadeia de custódia.", time: "8 min" },
  { title: "Calibração de pHmetro", segment: "Calibração", description: "Rotina de verificação, calibração e registro para medidores de pH.", time: "6 min" },
  { title: "Controle de qualidade interno", segment: "Controle de Qualidade", description: "Define controles, critérios de aceitação e tratamento de desvios.", time: "12 min" },
  { title: "Gestão de resíduos químicos", segment: "Segurança", description: "Segregação, acondicionamento, rotulagem e destinação de resíduos.", time: "10 min" },
  { title: "Operação de sistema de efluentes", segment: "Efluentes", description: "Procedimentos operacionais e parâmetros críticos da estação.", time: "15 min" },
  { title: "Resposta a derramamentos", segment: "Segurança", description: "Ações imediatas, contenção, limpeza e documentação do incidente.", time: "7 min" },
];
