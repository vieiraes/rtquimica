// Mock do Google (OAuth + Calendar) para o desenvolvimento local, no lugar de accounts.google.com e googleapis.com.
// Sobe pelo portal infraestrutura-local (cartão RTQuímico) em localhost:5330. Guarda tudo em memória.
// GET /__estado mostra agendas e eventos (os testes conferem por aí); POST /__limpar zera.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORTA = Number(process.env.PORT ?? 5330);
const CONTA = process.env.MOCK_GOOGLE_EMAIL ?? "quimico.teste@gmail.com";
let estado = { codigos: {}, tokens: {}, agendas: {}, revogados: [] };

const json = (res, status, corpo) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(corpo)); };
const corpo = (req) => new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => ok(d)); });
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const acesso = (req) => {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  return estado.tokens[token]?.tipo === "acesso" ? token : null;
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  const p = url.pathname;
  try {
    if (p === "/__estado") return json(res, 200, { agendas: estado.agendas, revogados: estado.revogados });
    if (p === "/__limpar" && req.method === "POST") { estado = { codigos: {}, tokens: {}, agendas: {}, revogados: [] }; return json(res, 200, { ok: true }); }

    // Tela de consentimento: Permitir volta com ?code, Cancelar volta com ?error
    if (p === "/o/oauth2/v2/auth") {
      const volta = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state") ?? "";
      const code = randomUUID();
      estado.codigos[code] = { escopo: url.searchParams.get("scope") };
      const permitir = `${volta}?${new URLSearchParams({ code, state })}`;
      const negar = `${volta}?${new URLSearchParams({ error: "access_denied", state })}`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Google (mock)</title>
<body style="font-family:sans-serif;max-width:420px;margin:60px auto;line-height:1.5">
<h1 style="font-size:22px">Google (mock local)</h1>
<p>Entrando como <b>${escapar(CONTA)}</b>.</p>
<p>O <b>RTQuímico</b> quer criar uma agenda própria e gerenciar os eventos dela.</p>
<p style="color:#555;font-size:13px">Escopos: ${escapar(url.searchParams.get("scope"))}</p>
<a id="permitir" href="${escapar(permitir)}" style="display:inline-block;padding:10px 18px;background:#1a73e8;color:#fff;border-radius:6px;text-decoration:none">Permitir</a>
<a id="cancelar" href="${escapar(negar)}" style="margin-left:12px">Cancelar</a></body></html>`);
    }

    if (p === "/token" && req.method === "POST") {
      const f = new URLSearchParams(await corpo(req));
      if (f.get("grant_type") === "authorization_code") {
        if (!estado.codigos[f.get("code")]) return json(res, 400, { error: "invalid_grant" });
        delete estado.codigos[f.get("code")];
        const refresh = `rt-${randomUUID()}`;
        const access = `at-${randomUUID()}`;
        estado.tokens[refresh] = { tipo: "refresh" };
        estado.tokens[access] = { tipo: "acesso" };
        return json(res, 200, { access_token: access, refresh_token: refresh, expires_in: 3599, token_type: "Bearer" });
      }
      if (f.get("grant_type") === "refresh_token") {
        if (estado.tokens[f.get("refresh_token")]?.tipo !== "refresh") return json(res, 400, { error: "invalid_grant" });
        const access = `at-${randomUUID()}`;
        estado.tokens[access] = { tipo: "acesso" };
        return json(res, 200, { access_token: access, expires_in: 3599, token_type: "Bearer" });
      }
      return json(res, 400, { error: "unsupported_grant_type" });
    }

    if (p === "/revoke" && req.method === "POST") {
      const t = new URLSearchParams(await corpo(req)).get("token");
      delete estado.tokens[t];
      estado.revogados.push(t);
      return json(res, 200, {});
    }

    if (!acesso(req)) return json(res, 401, { error: { code: 401, message: "Invalid Credentials" } });

    if (p === "/v1/userinfo") return json(res, 200, { email: CONTA, email_verified: true });

    // Calendar v3: /calendar/v3/calendars[/:id[/events[/:eventId]]]
    const m = p.match(/^\/calendar\/v3\/calendars(?:\/([^/]+))?(?:\/events(?:\/([^/]+))?)?$/);
    if (!m) return json(res, 404, { error: { code: 404, message: "Not Found" } });
    const agendaId = m[1] && decodeURIComponent(m[1]);
    const eventoId = m[2];
    const ehEventos = p.includes("/events");

    if (!agendaId && req.method === "POST") {
      const dados = JSON.parse(await corpo(req));
      const id = `${randomUUID().replace(/-/g, "")}@group.calendar.google.com`;
      estado.agendas[id] = { ...dados, id, eventos: {} };
      return json(res, 200, { id, summary: dados.summary });
    }
    const agenda = estado.agendas[agendaId];
    if (!agenda) return json(res, 404, { error: { code: 404, message: "Not Found" } });

    if (!ehEventos) {
      if (req.method === "GET") return json(res, 200, { id: agenda.id, summary: agenda.summary });
      if (req.method === "DELETE") { delete estado.agendas[agendaId]; res.writeHead(204); return res.end(); }
    }
    if (ehEventos && !eventoId) {
      if (req.method === "GET") return json(res, 200, { items: Object.values(agenda.eventos).filter((e) => e.status !== "cancelled") });
      if (req.method === "POST") {
        const ev = JSON.parse(await corpo(req));
        if (agenda.eventos[ev.id]) return json(res, 409, { error: { code: 409, message: "The requested identifier already exists." } });
        agenda.eventos[ev.id] = { ...ev, status: "confirmed" };
        return json(res, 200, agenda.eventos[ev.id]);
      }
    }
    if (ehEventos && eventoId) {
      if (req.method === "PUT") {
        if (!agenda.eventos[eventoId]) return json(res, 404, { error: { code: 404, message: "Not Found" } });
        agenda.eventos[eventoId] = { ...JSON.parse(await corpo(req)), id: eventoId, status: "confirmed" };
        return json(res, 200, agenda.eventos[eventoId]);
      }
      if (req.method === "DELETE") {
        if (!agenda.eventos[eventoId] || agenda.eventos[eventoId].status === "cancelled") return json(res, 410, { error: { code: 410, message: "Resource has been deleted" } });
        agenda.eventos[eventoId].status = "cancelled";
        res.writeHead(204);
        return res.end();
      }
    }
    return json(res, 405, { error: { code: 405, message: "Method Not Allowed" } });
  } catch (erro) {
    json(res, 500, { error: String(erro) });
  }
}).listen(PORTA, () => console.log(`mock do Google em http://localhost:${PORTA}`));
