import type { Alert, RT, TechnicalAction } from "../types";
import type { UsuarioPlataforma } from "../components/gestao";
import type { Lancamento } from "../components/financeiro";
import type { ItemRadar } from "../components/radar";

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

// Modo demonstração: usuários de exemplo da tela Plataforma (superadmin) e Equipe (tenant "demo")
const escritorioDemo = { name: "Assessoria Mariana Vieira", plan: "pro" };
export const usuariosDemo: UsuarioPlataforma[] = [
  { id: "u1", name: "Mariana Vieira", email: "mariana@exemplo.com.br", role: "tenant_admin", crq_number: "04289123", crq_state: "SP", created_at: "2026-01-10T12:00:00Z", tenant_id: "demo", tenants: escritorioDemo },
  { id: "u2", name: "Carla Souza", email: "carla@exemplo.com.br", role: "tenant_member", crq_number: "04311876", crq_state: "SP", created_at: "2026-02-03T12:00:00Z", tenant_id: "demo", tenants: escritorioDemo },
  { id: "u4", name: "João Química", email: "joao@exemplo.com.br", role: "tenant_admin", crq_number: "05120034", crq_state: "RJ", created_at: "2026-04-22T12:00:00Z", tenant_id: "demo2", tenants: { name: "João Química Ltda", plan: "basic" } },
];

// Modo demonstração: financeiro de quem recebe no CPF, com datas relativas a hoje
const diaRelativo = (dias: number) => { const d = new Date(); d.setDate(d.getDate() + dias); return d.toLocaleDateString("sv-SE"); };
const base = { rtId: null, payerDocument: null, category: null, deductible: false, retido: 0, comprovante: null };
export const lancamentosDemo: Lancamento[] = [
  { ...base, id: "f1", kind: "receita", payerType: "pj", payerName: "BioLab Análises", payerDocument: "12.345.678/0001-90", description: "Honorários de RT", valor: 1800, retido: 27, vencimento: diaRelativo(-12), pagoEm: diaRelativo(-12) },
  { ...base, id: "f2", kind: "receita", payerType: "pj", payerName: "Aqua Pura Ambiental", payerDocument: "28.491.730/0001-44", description: "Honorários de RT", valor: 1500, vencimento: diaRelativo(-6), pagoEm: null },
  { ...base, id: "f3", kind: "receita", payerType: "pf", payerName: "Sítio Boa Água (José Pereira)", description: "Laudo de potabilidade do poço", valor: 2400, vencimento: diaRelativo(-3), pagoEm: diaRelativo(-3) },
  { ...base, id: "f4", kind: "receita", payerType: "pj", payerName: "Verde Ciclo Efluentes", payerDocument: "09.441.875/0001-31", description: "Honorários de RT", valor: 2200, vencimento: diaRelativo(9), pagoEm: null },
  { ...base, id: "f5", kind: "despesa", payerType: null, payerName: null, category: "anuidade_crq", deductible: true, description: "Anuidade CRQ-IV", valor: 780, vencimento: diaRelativo(-20), pagoEm: diaRelativo(-20) },
  { ...base, id: "f6", kind: "despesa", payerType: null, payerName: null, category: "curso", deductible: true, description: "Curso de atualização em efluentes", valor: 450, vencimento: diaRelativo(-4), pagoEm: diaRelativo(-4) },
  { ...base, id: "f7", kind: "despesa", payerType: null, payerName: null, category: "deslocamento", deductible: false, description: "Combustível das visitas", valor: 320, vencimento: diaRelativo(-2), pagoEm: diaRelativo(-2) },
];

// Modo demonstração: radar regulatório de exemplo (títulos ilustrativos, links para as páginas dos órgãos)
const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
export const radarDemo: { itens: ItemRadar[]; fontes: Array<{ id: string; name: string; last_error: string | null }> } = {
  fontes: [
    { id: "cfq-noticias", name: "CFQ · notícias", last_error: null },
    { id: "crqsp-noticias", name: "CRQ-IV (SP) · notícias", last_error: null },
    { id: "conama-pauta", name: "CONAMA em pauta", last_error: null },
  ],
  itens: [
    { id: "r1", source_id: "cfq-noticias", title: "Exemplo: plenário do CFQ aprova nova resolução normativa", link: "https://cfq.org.br/noticia/", summary: "Item de demonstração. Com a conta conectada, aparecem as notícias reais do CFQ.", published_at: horasAtras(5) },
    { id: "r2", source_id: "crqsp-noticias", title: "Exemplo: CRQ-IV divulga calendário de fiscalização", link: "https://crqsp.org.br/category/noticias/", summary: "Item de demonstração.", published_at: horasAtras(30) },
    { id: "r3", source_id: "conama-pauta", title: "Exemplo: CONAMA publica pauta da próxima reunião plenária", link: "https://conama.mma.gov.br/conama-em-pauta", summary: null, published_at: horasAtras(80) },
  ],
};
