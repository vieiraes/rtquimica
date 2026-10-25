// OAuth e Calendar do Google para as Edge Functions. Os endereços vêm do ambiente para o local apontar para o mock
// (scripts/mock-google.mjs); sem variável, valem os do Google.
// GOOGLE_AUTH_URL é aberto pelo navegador; os demais são chamados pelo servidor.
import { admin, cors, env } from "./comum.ts";
import { eventosDaAgenda, type EventoGoogle } from "./agenda-eventos.ts";

export const google = {
  authUrl: () => env("GOOGLE_AUTH_URL", "https://accounts.google.com/o/oauth2/v2/auth"),
  tokenUrl: () => env("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com/token"),
  revokeUrl: () => env("GOOGLE_REVOKE_URL", "https://oauth2.googleapis.com/revoke"),
  userinfoUrl: () => env("GOOGLE_USERINFO_URL", "https://openidconnect.googleapis.com/v1/userinfo"),
  calendarUrl: () => env("GOOGLE_CALENDAR_URL", "https://www.googleapis.com/calendar/v3"),
  clientId: () => env("GOOGLE_CLIENT_ID"),
  clientSecret: () => env("GOOGLE_CLIENT_SECRET"),
  // Endereço público das functions (no local o SUPABASE_URL de dentro do container não é o que o navegador vê)
  retorno: () => `${env("PUBLIC_FUNCTIONS_URL", `${Deno.env.get("SUPABASE_URL")}/functions/v1`)}/google-retorno`,
  appUrl: () => env("APP_URL", "https://rtquimico.web.app"),
};

// Agenda própria do app: o químico vê e apaga à vontade, e o RTQuímico não toca nas outras agendas dele
export const ESCOPOS = ["openid", "email", "https://www.googleapis.com/auth/calendar.app.created"];

const tempo = () => AbortSignal.timeout(15000);

async function pedir(url: string, init: RequestInit & { token?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
  return await fetch(url, { ...init, headers, signal: tempo() });
}

async function json<T>(resposta: Response, contexto: string): Promise<T> {
  if (!resposta.ok) throw new Error(`${contexto}: HTTP ${resposta.status} ${(await resposta.text()).slice(0, 200)}`);
  return await resposta.json() as T;
}

export async function trocarCodigo(code: string) {
  const r = await fetch(google.tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: google.clientId(), client_secret: google.clientSecret(), redirect_uri: google.retorno(), grant_type: "authorization_code" }),
    signal: tempo(),
  });
  return await json<{ access_token: string; refresh_token?: string }>(r, "troca do código");
}

export async function tokenDeAcesso(refreshToken: string) {
  const r = await fetch(google.tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: google.clientId(), client_secret: google.clientSecret(), grant_type: "refresh_token" }),
    signal: tempo(),
  });
  return (await json<{ access_token: string }>(r, "renovação do acesso")).access_token;
}

export async function emailDaConta(accessToken: string) {
  return (await json<{ email?: string }>(await pedir(google.userinfoUrl(), { token: accessToken }), "e-mail da conta")).email ?? null;
}

export async function criarAgenda(accessToken: string) {
  const r = await pedir(`${google.calendarUrl()}/calendars`, {
    method: "POST", token: accessToken,
    body: JSON.stringify({ summary: "RTQuímico", description: "Vencimentos de RT, honorários e carnê-leão, mantidos pelo RTQuímico.", timeZone: "America/Sao_Paulo" }),
  });
  return (await json<{ id: string }>(r, "criação da agenda")).id;
}

/** A agenda ainda existe no Google? (o químico pode ter apagado) */
export async function agendaExiste(accessToken: string, calendarId: string) {
  const r = await pedir(`${google.calendarUrl()}/calendars/${encodeURIComponent(calendarId)}`, { token: accessToken });
  if (r.ok) return true;
  if (r.status === 404 || r.status === 410) return false;
  throw new Error(`consulta da agenda: HTTP ${r.status}`);
}

/** Desconectar apaga a agenda "RTQuímico" (o app só mexe nela) e revoga o acesso. */
export async function apagarAgenda(refreshToken: string, calendarId: string) {
  const token = await tokenDeAcesso(refreshToken).catch(() => null);
  if (token) await pedir(`${google.calendarUrl()}/calendars/${encodeURIComponent(calendarId)}`, { method: "DELETE", token }).catch(() => {});
}

export async function revogar(token: string) {
  await fetch(google.revokeUrl(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }), signal: tempo() }).catch(() => {});
}

/** Deixa a agenda "RTQuímico" igual ao RTQuímico: grava o que falta ou mudou e apaga o que não existe mais. */
export async function sincronizar(userId: string) {
  const db = admin();
  const { data: link } = await db.from("google_calendar_links").select("calendar_id, refresh_token").eq("user_id", userId).maybeSingle();
  if (!link) return { conectado: false as const };

  try {
    const { data: perfil, error: e1 } = await db.from("profiles").select("tenant_id, tax_regime").eq("id", userId).single();
    if (e1) throw e1;
    const [{ data: rts, error: e2 }, { data: honorarios, error: e3 }] = await Promise.all([
      db.from("technical_responsibilities").select("id, company_name, document_type, document_number, end_date, status").eq("tenant_id", perfil.tenant_id),
      db.from("financial_entries").select("id, payer_name, description, amount_cents, due_date, paid_on").eq("user_id", userId).eq("kind", "receita"),
    ]);
    if (e2 || e3) throw e2 ?? e3;

    const desejados = eventosDaAgenda({ rts: rts ?? [], honorarios: honorarios ?? [], carneLeao: perfil.tax_regime === "pf", userId });
    const token = await tokenDeAcesso(link.refresh_token);
    const base = `${google.calendarUrl()}/calendars/${encodeURIComponent(link.calendar_id)}/events`;

    const existentes = new Set<string>();
    let pagina: string | undefined;
    do {
      const r = await pedir(`${base}?showDeleted=false&maxResults=2500${pagina ? `&pageToken=${pagina}` : ""}`, { token });
      if (r.status === 404) throw new Error("a agenda RTQuímico foi apagada no Google; desconecte e conecte de novo");
      const lista = await json<{ items?: Array<{ id: string; status?: string }>; nextPageToken?: string }>(r, "lista de eventos");
      for (const e of lista.items ?? []) if (e.status !== "cancelled") existentes.add(e.id);
      pagina = lista.nextPageToken;
    } while (pagina);

    let gravados = 0;
    for (const e of desejados) {
      await gravarEvento(base, token, e);
      gravados += 1;
      existentes.delete(e.id);
    }
    for (const id of existentes) {
      const r = await pedir(`${base}/${id}`, { method: "DELETE", token });
      if (!r.ok && r.status !== 404 && r.status !== 410) throw new Error(`remoção de evento: HTTP ${r.status}`);
    }

    await db.from("google_calendar_links").update({ last_sync_at: new Date().toISOString(), last_error: null }).eq("user_id", userId);
    return { conectado: true as const, gravados, removidos: existentes.size };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    await db.from("google_calendar_links").update({ last_error: mensagem.slice(0, 300) }).eq("user_id", userId);
    throw erro;
  }
}

// Atualiza pelo id; se o evento ainda não existe, cria com o mesmo id (um evento apagado no Google volta pelo PUT)
async function gravarEvento(base: string, token: string, e: EventoGoogle) {
  const corpo = JSON.stringify(e);
  const r = await pedir(`${base}/${e.id}`, { method: "PUT", token, body: corpo });
  if (r.ok) return;
  if (r.status !== 404) throw new Error(`gravação de evento: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  await json(await pedir(base, { method: "POST", token, body: corpo }), "criação de evento");
}

export { admin, cors };
