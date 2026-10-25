// Google Agenda do químico logado: conectar (devolve o endereço de login do Google), sincronizar e desconectar.
// Exige o JWT do Supabase (verify_jwt padrão). A volta do Google cai em google-retorno.
import { admin, apagarAgenda, cors, ESCOPOS, google, revogar, sincronizar } from "../_shared/google.ts";

const resposta = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return resposta(405, { erro: "método não permitido" });

  const db = admin();
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  const { data: { user } } = await db.auth.getUser(jwt);
  if (!user) return resposta(401, { erro: "não autenticado" });

  // Só químico: a gestão do produto e a empresa contratante não têm agenda de RT
  const { data: perfil } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (!perfil || !["tenant_admin", "tenant_member"].includes(perfil.role)) return resposta(403, { erro: "disponível só para químicos" });

  const { acao } = await req.json().catch(() => ({ acao: null }));
  try {
    if (acao === "conectar") {
      await db.from("google_oauth_states").delete().lt("created_at", new Date(Date.now() - 10 * 60_000).toISOString());
      const { data: estado, error } = await db.from("google_oauth_states").insert({ user_id: user.id }).select("state").single();
      if (error) throw error;
      const url = new URL(google.authUrl());
      url.search = new URLSearchParams({
        client_id: google.clientId(), redirect_uri: google.retorno(), response_type: "code", scope: ESCOPOS.join(" "),
        // offline + consent: o Google devolve o refresh token, que deixa sincronizar sem o químico logar de novo
        access_type: "offline", prompt: "consent", include_granted_scopes: "true", state: estado.state,
        login_hint: user.email ?? "",
      }).toString();
      return resposta(200, { url: url.toString() });
    }
    if (acao === "sincronizar") return resposta(200, await sincronizar(user.id));
    if (acao === "desconectar") {
      const { data: link } = await db.from("google_calendar_links").select("refresh_token, calendar_id").eq("user_id", user.id).maybeSingle();
      if (link) {
        await apagarAgenda(link.refresh_token, link.calendar_id);
        await revogar(link.refresh_token);
      }
      await db.from("google_calendar_links").delete().eq("user_id", user.id);
      return resposta(200, { conectado: false });
    }
    return resposta(400, { erro: "ação desconhecida" });
  } catch (erro) {
    console.error(erro);
    return resposta(502, { erro: erro instanceof Error ? erro.message : "falha ao falar com o Google" });
  }
});
