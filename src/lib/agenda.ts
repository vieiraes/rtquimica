// Chamadas à Edge Function google-agenda (conectar, sincronizar, desconectar).
import { chamarFuncao } from "./funcoes";
import { supabase } from "./supabase";

export async function chamarAgenda<T = unknown>(acao: "conectar" | "sincronizar" | "desconectar"): Promise<T> {
  return chamarFuncao<T>("google-agenda", { acao });
}

/** Depois de mudar RT ou honorário: atualiza a agenda do Google em segundo plano (sem conexão, a função só responde que não está conectada). */
export function atualizarAgendaEmSegundoPlano() {
  if (!supabase) return;
  chamarAgenda("sincronizar").catch((erro) => console.warn("Google Agenda não atualizada", erro));
}
