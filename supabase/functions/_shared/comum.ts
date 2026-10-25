// Peças comuns das Edge Functions: variáveis de ambiente, cliente admin (service role) e CORS.
import { createClient } from "jsr:@supabase/supabase-js@2";

export const env = (nome: string, padrao?: string) => {
  const valor = Deno.env.get(nome) ?? padrao;
  if (!valor) throw new Error(`variável ${nome} não configurada`);
  return valor;
};

export const admin = () => createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const respostaJson = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Usuário do JWT e o papel dele; null se não autenticado. */
export async function quemChama(req: Request) {
  const db = admin();
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  const { data: { user } } = await db.auth.getUser(jwt);
  if (!user) return null;
  const { data: perfil } = await db.from("profiles").select("role, tenant_id").eq("id", user.id).single();
  return { user, papel: perfil?.role as string | undefined, tenantId: perfil?.tenant_id as string | undefined, db };
}

export const ehQuimico = (papel?: string) => papel === "tenant_admin" || papel === "tenant_member";
