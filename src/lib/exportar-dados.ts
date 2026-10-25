// LGPD (art. 18, II e V): cópia dos dados da conta em JSON, montada no navegador com o que a própria pessoa já
// pode ler (as policies do banco limitam ao escritório dela). Segredos ficam de fora: o token do Google não tem grant.
import type { SupabaseClient } from "@supabase/supabase-js";

const TABELAS: { tabela: string; colunas?: string; chave: string }[] = [
  { tabela: "profiles", chave: "perfis_do_escritorio" },
  { tabela: "tenants", chave: "escritorio" },
  { tabela: "technical_responsibilities", chave: "responsabilidades_tecnicas" },
  { tabela: "documents", chave: "documentos" },
  { tabela: "technical_actions", chave: "diario_tecnico" },
  { tabela: "checklists", chave: "checklists" },
  { tabela: "sop_templates", chave: "pops" },
  { tabela: "financial_entries", chave: "financeiro" },
  { tabela: "alerts", chave: "alertas" },
  { tabela: "google_calendar_links", colunas: "google_email, calendar_id, last_sync_at, created_at", chave: "google_agenda" },
  { tabela: "ai_usage_log", colunas: "operation, model, status, total_tokens, created_at", chave: "uso_da_ia" },
  { tabela: "regulatory_reads", chave: "radar_lidos" },
];

export async function montarExportacao(client: SupabaseClient, email: string) {
  const dados: Record<string, unknown> = {
    gerado_em: new Date().toISOString(),
    conta: email,
    observacao: "Cópia dos dados da sua conta no RTQuímico (LGPD, art. 18). Fotos e anexos aparecem como caminho do arquivo; baixe cada um pelo painel.",
  };
  const falhas: string[] = [];
  for (const { tabela, colunas, chave } of TABELAS) {
    const { data, error } = await client.from(tabela).select(colunas ?? "*");
    if (error) falhas.push(chave);
    else dados[chave] = data;
  }
  if (falhas.length) dados.nao_exportado = falhas;
  return dados;
}

export function baixarJson(dados: unknown, nome: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
