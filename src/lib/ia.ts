// Chamadas à Edge Function "ia". O que volta é sempre rascunho ou análise para o químico conferir.
import { chamarFuncao } from "./funcoes";

export interface RascunhoDiario {
  texto: string;
  categoria: string;
  avisos: string[];
  restantes: number;
}

export interface ExplicacaoRadar {
  resumo: string;
  relevancia: "alta" | "media" | "baixa" | "nenhuma";
  empresas: Array<{ nome: string; motivo: string }>;
  acao_sugerida: string | null;
  guardada?: boolean;
  restantes?: number;
}

export interface RascunhoPop {
  titulo: string;
  texto: string;
  pontos_a_confirmar: string[];
  restantes: number;
}

const chamarIa = <T>(operacao: string, dados: unknown) =>
  chamarFuncao<T>("ia", { operacao, dados }, "A IA funciona com a conta conectada (no modo demonstração não há IA).");

export const redigirDiario = (dados: { anotacao: string; empresa: string; categoria: string }) => chamarIa<RascunhoDiario>("diario_redigir", dados);
export const explicarRadar = (itemId: string) => chamarIa<ExplicacaoRadar>("radar_explicar", { item_id: itemId });
export const adaptarPop = (dados: { template_id: string; rt_id: string; detalhes: string }) => chamarIa<RascunhoPop>("pop_adaptar", dados);
