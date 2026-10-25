// Chamada a uma Edge Function com a mensagem de erro que a função devolve (para mostrar à pessoa).
import { supabase } from "./supabase";

export async function chamarFuncao<T>(nome: string, corpo: Record<string, unknown>, semConta = "Disponível só com a conta conectada."): Promise<T> {
  if (!supabase) throw new Error(semConta);
  const { data, error } = await supabase.functions.invoke(nome, { body: corpo });
  if (error) {
    const resposta = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(resposta?.erro ?? "Não consegui concluir agora. Tente de novo.");
  }
  return data as T;
}
