// Equipe e papéis. Titular (tenant_admin): convida químico para o próprio escritório e desativa/reativa quem é da
// equipe. Superadmin: muda o papel (titular/equipe) e desativa/reativa qualquer químico.
// Papel e escritório vão em app_metadata (o trigger handle_new_user só confia nele); o convite é o e-mail de
// "definir senha" do Auth, que cai em /definir-senha no app.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { cors, env, quemChama, respostaJson } from "../_shared/comum.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAPEIS_QUIMICO = ["tenant_admin", "tenant_member"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respostaJson(405, { erro: "método não permitido" });
  const quem = await quemChama(req);
  if (!quem) return respostaJson(401, { erro: "não autenticado" });
  const { db, user, papel, tenantId } = quem;
  const superadmin = papel === "superadmin";
  const titular = papel === "tenant_admin";
  if (!superadmin && !titular) return respostaJson(403, { erro: "Só o titular do escritório gerencia a equipe." });

  const corpo = await req.json().catch(() => ({}));
  const { acao } = corpo as { acao?: string };

  if (acao === "convidar") {
    if (!titular || !tenantId) return respostaJson(403, { erro: "Só o titular convida para o escritório." });
    const email = String(corpo.email ?? "").trim().toLowerCase();
    const nome = String(corpo.nome ?? "").trim().slice(0, 120);
    if (!EMAIL.test(email)) return respostaJson(400, { erro: "E-mail inválido." });
    if (nome.length < 2) return respostaJson(400, { erro: "Informe o nome da pessoa." });
    const { data: existente } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existente) return respostaJson(409, { erro: "Esse e-mail já tem conta no RTQuímico." });
    const { data: criado, error } = await db.auth.admin.createUser({
      email, email_confirm: true,
      app_metadata: { tenant_id: tenantId, role: "tenant_member" },
      user_metadata: { nome },
    });
    if (error || !criado.user) {
      console.error(error);
      return respostaJson(500, { erro: "Não consegui criar o acesso." });
    }
    // O Auth grava o app_metadata depois do INSERT, então o trigger handle_new_user não o vê e cria um workspace
    // avulso: aqui o perfil vai para o escritório do titular, como equipe, e o workspace avulso é apagado
    const { data: perfil } = await db.from("profiles").select("tenant_id").eq("id", criado.user.id).single();
    const { error: erroPerfil } = await db.from("profiles").update({ tenant_id: tenantId, role: "tenant_member" }).eq("id", criado.user.id);
    if (erroPerfil) {
      console.error(erroPerfil);
      await db.auth.admin.deleteUser(criado.user.id);
      return respostaJson(500, { erro: "Não consegui colocar a pessoa no escritório." });
    }
    if (perfil?.tenant_id && perfil.tenant_id !== tenantId) await db.from("tenants").delete().eq("id", perfil.tenant_id);
    // E-mail com o link para a pessoa criar a senha (sai pelo SMTP do Auth; no local, a caixa do Mailpit)
    const publico = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { auth: { persistSession: false } });
    const { error: erroEmail } = await publico.auth.resetPasswordForEmail(email, { redirectTo: `${env("APP_URL", "https://rtquimico.web.app")}/definir-senha` });
    if (erroEmail) console.error(erroEmail);
    return respostaJson(200, { convidado: email, emailEnviado: !erroEmail });
  }

  if (acao === "ativar" || acao === "desativar" || acao === "mudar_papel") {
    const alvoId = String(corpo.user_id ?? "");
    if (alvoId === user.id) return respostaJson(400, { erro: "Você não pode mudar o próprio acesso." });
    const { data: alvo } = await db.from("profiles").select("id, role, tenant_id").eq("id", alvoId).maybeSingle();
    if (!alvo || !PAPEIS_QUIMICO.includes(alvo.role)) return respostaJson(404, { erro: "Pessoa não encontrada." });
    // Titular só mexe na equipe do próprio escritório e não mexe em outro titular
    if (titular && (alvo.tenant_id !== tenantId || alvo.role !== "tenant_member")) return respostaJson(403, { erro: "Você só gerencia a equipe do seu escritório." });

    if (acao === "mudar_papel") {
      if (!superadmin) return respostaJson(403, { erro: "Só a gestão do produto muda papéis." });
      const novo = String(corpo.papel ?? "");
      if (!PAPEIS_QUIMICO.includes(novo)) return respostaJson(400, { erro: "Papel inválido." });
      const { error } = await db.from("profiles").update({ role: novo }).eq("id", alvoId);
      if (error) return respostaJson(500, { erro: "Não consegui mudar o papel." });
      await db.auth.admin.updateUserById(alvoId, { app_metadata: { role: novo } });
      return respostaJson(200, { papel: novo });
    }

    const ativo = acao === "ativar";
    const { error } = await db.auth.admin.updateUserById(alvoId, { ban_duration: ativo ? "none" : "876000h" });
    if (error) return respostaJson(500, { erro: "Não consegui mudar o acesso." });
    await db.from("profiles").update({ active: ativo }).eq("id", alvoId);
    return respostaJson(200, { ativo });
  }

  return respostaJson(400, { erro: "ação desconhecida" });
});
