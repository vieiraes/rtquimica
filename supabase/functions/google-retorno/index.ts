// Volta do login do Google (redirect_uri). Pública (verify_jwt = false): quem prova o usuário é o "state" gravado
// por google-agenda no clique em Conectar. Guarda o refresh token, cria a agenda "RTQuímico", sincroniza e volta ao app.
import { admin, agendaExiste, criarAgenda, emailDaConta, ESCOPO_AGENDA, google, revogar, sincronizar, trocarCodigo } from "../_shared/google.ts";

const voltar = (resultado: string) => Response.redirect(`${google.appUrl()}/configuracoes?google=${resultado}`, 302);

Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const state = params.get("state");
  const code = params.get("code");
  if (params.get("error")) return voltar("cancelado");
  if (!state || !code) return voltar("erro");

  const db = admin();
  // O state vale uma vez só e por 10 minutos
  const { data: estado } = await db.from("google_oauth_states").delete().eq("state", state).select("user_id, created_at").maybeSingle();
  if (!estado || Date.now() - new Date(estado.created_at).getTime() > 10 * 60_000) return voltar("expirado");

  try {
    const tokens = await trocarCodigo(code);
    // O Google mostra a permissão da agenda como caixa de marcar: se o químico não marcou, o token vem sem ela
    if (!tokens.scope?.split(" ").includes(ESCOPO_AGENDA)) {
      await revogar(tokens.refresh_token ?? tokens.access_token);
      return voltar("sem-permissao");
    }
    const { data: anterior } = await db.from("google_calendar_links").select("calendar_id, refresh_token").eq("user_id", estado.user_id).maybeSingle();
    const refreshToken = tokens.refresh_token ?? anterior?.refresh_token;
    if (!refreshToken) throw new Error("o Google não devolveu o refresh token");
    const email = await emailDaConta(tokens.access_token);
    // Reconectar reaproveita a agenda, se o químico não a apagou no Google
    const calendarId = anterior?.calendar_id && await agendaExiste(tokens.access_token, anterior.calendar_id)
      ? anterior.calendar_id
      : await criarAgenda(tokens.access_token);
    const { error } = await db.from("google_calendar_links").upsert({ user_id: estado.user_id, google_email: email, calendar_id: calendarId, refresh_token: refreshToken, last_error: null });
    if (error) throw error;
    await sincronizar(estado.user_id).catch((e) => console.error("primeira sincronização", e));
    return voltar("conectado");
  } catch (erro) {
    console.error(erro);
    return voltar("erro");
  }
});
