// Confere se o Supabase local e o remoto estão iguais: migrations, edge functions (e verify_jwt), configuração do Auth,
// provedores ligados no local que está rodando e secrets que as funções exigem.
// Fonte da verdade: supabase/config.toml + supabase/migrations + supabase/functions. Sai com código 1 se algo divergir.
// Uso: npm run paridade (lê SUPABASE_TOKEN e VITE_SUPABASE_* do .env.local)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const REF = "qbmocwoqkqazoclmxmsh";
const lerEnv = (arquivo) =>
  existsSync(arquivo)
    ? Object.fromEntries(
        readFileSync(arquivo, "utf8")
          .split("\n")
          .filter((l) => /^[A-Z_]+=/.test(l))
          .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
      )
    : {};
const envLocal = lerEnv(path.join(RAIZ, ".env.local"));
const envSupabase = lerEnv(path.join(RAIZ, "supabase/.env"));
if (!envLocal.SUPABASE_TOKEN) throw new Error("Falta SUPABASE_TOKEN no .env.local");

// TOML só no que o config.toml usa: [seção], chave = valor (string, número, booleano ou lista)
const lerToml = (texto) => {
  const out = {};
  let secao = "";
  for (const linha of texto.split("\n")) {
    const s = linha.match(/^\[([^\]]+)\]/);
    if (s) { secao = s[1]; continue; }
    const kv = linha.match(/^([a-z_]+)\s*=\s*(.+?)\s*$/);
    if (!kv) continue;
    let valor = kv[2];
    try { valor = JSON.parse(valor); } catch { /* fica como texto */ }
    out[`${secao}.${kv[1]}`] = valor;
  }
  return out;
};
const toml = lerToml(readFileSync(path.join(RAIZ, "supabase/config.toml"), "utf8"));
const resolver = (v) => (typeof v === "string" && /^env\((.+)\)$/.test(v) ? envSupabase[v.slice(4, -1)] ?? "" : v);
const segundos = (d) => [...String(d).matchAll(/(\d+)([hms])/g)].reduce((t, [, n, u]) => t + Number(n) * { h: 3600, m: 60, s: 1 }[u], 0);

const api = async (caminho, opcoes = {}) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}${caminho}`, {
    ...opcoes,
    headers: { Authorization: `Bearer ${envLocal.SUPABASE_TOKEN}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`${caminho}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

const falhas = [];
const avisos = [];
const conferir = (nome, local, remoto) => {
  if (JSON.stringify(local) !== JSON.stringify(remoto)) falhas.push(`${nome}: local ${JSON.stringify(local)} × remoto ${JSON.stringify(remoto)}`);
};

// 1. Migrations
const remotas = (await api("/database/query", { method: "POST", body: JSON.stringify({ query: "select version from supabase_migrations.schema_migrations order by 1" }) })).map((m) => m.version);
const locais = readdirSync(path.join(RAIZ, "supabase/migrations")).filter((f) => f.endsWith(".sql")).map((f) => f.split("_")[0]).sort();
for (const v of locais.filter((v) => !remotas.includes(v))) falhas.push(`migration ${v} ainda não aplicada no remoto`);
for (const v of remotas.filter((v) => !locais.includes(v))) falhas.push(`migration ${v} existe no remoto e não no repositório`);

// 2. Edge functions e verify_jwt
const funcoesRemotas = Object.fromEntries((await api("/functions")).map((f) => [f.slug, f.verify_jwt]));
const funcoesLocais = readdirSync(path.join(RAIZ, "supabase/functions"), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_")).map((d) => d.name);
for (const slug of funcoesLocais) {
  if (!(slug in funcoesRemotas)) { falhas.push(`função ${slug} não publicada no remoto`); continue; }
  conferir(`função ${slug} verify_jwt`, toml[`functions.${slug}.verify_jwt`] ?? true, funcoesRemotas[slug]);
}
for (const slug of Object.keys(funcoesRemotas).filter((s) => !funcoesLocais.includes(s))) falhas.push(`função ${slug} existe no remoto e não no repositório`);

// 3. Auth: chave do config.toml → campo da Management API (com conversão quando o sentido ou a unidade muda)
const auth = await api("/config/auth");
const MAPA = [
  ["auth.jwt_expiry", "jwt_exp"],
  ["auth.enable_refresh_token_rotation", "refresh_token_rotation_enabled"],
  ["auth.refresh_token_reuse_interval", "security_refresh_token_reuse_interval"],
  ["auth.enable_signup", "disable_signup", (v) => !v],
  ["auth.enable_anonymous_sign_ins", "external_anonymous_users_enabled"],
  ["auth.enable_manual_linking", "security_manual_linking_enabled"],
  ["auth.minimum_password_length", "password_min_length"],
  ["auth.rate_limit.email_sent", "rate_limit_email_sent"],
  ["auth.rate_limit.anonymous_users", "rate_limit_anonymous_users"],
  ["auth.rate_limit.token_refresh", "rate_limit_token_refresh"],
  ["auth.rate_limit.token_verifications", "rate_limit_verify"],
  ["auth.email.enable_signup", "external_email_enabled"],
  ["auth.email.double_confirm_changes", "mailer_secure_email_change_enabled"],
  ["auth.email.enable_confirmations", "mailer_autoconfirm", (v) => !v],
  ["auth.email.secure_password_change", "security_update_password_require_reauthentication"],
  ["auth.email.max_frequency", "smtp_max_frequency", segundos],
  ["auth.email.smtp.host", "smtp_host"],
  ["auth.email.smtp.port", "smtp_port", String],
  ["auth.email.smtp.user", "smtp_user", resolver],
  ["auth.email.smtp.admin_email", "smtp_admin_email"],
  ["auth.email.smtp.sender_name", "smtp_sender_name"],
  ["auth.email.otp_length", "mailer_otp_length"],
  ["auth.email.otp_expiry", "mailer_otp_exp"],
  ["auth.mfa.max_enrolled_factors", "mfa_max_enrolled_factors"],
  ["auth.mfa.totp.enroll_enabled", "mfa_totp_enroll_enabled"],
  ["auth.mfa.totp.verify_enabled", "mfa_totp_verify_enabled"],
  ["auth.external.google.enabled", "external_google_enabled"],
  ["auth.external.google.client_id", "external_google_client_id", resolver],
];
for (const [chave, campo, converter = (v) => v] of MAPA) conferir(`auth ${chave}`, converter(toml[chave]), auth[campo] ?? false);

// 4. O local que está rodando reflete o config.toml? (pega o caso de mudar o config e não reiniciar o portal)
try {
  const r = await fetch(`${envLocal.VITE_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: envLocal.VITE_SUPABASE_ANON_KEY ?? envLocal.VITE_SUPABASE_PUBLISHABLE_KEY } });
  const { external } = await r.json();
  conferir("Supabase local rodando: login com Google", external.google, auth.external_google_enabled);
  conferir("Supabase local rodando: cadastro por e-mail", external.email, auth.external_email_enabled);
} catch {
  avisos.push("Supabase local desligado: não deu para conferir o que está rodando (ligue no portal)");
}

// 5. Secrets que as funções leem (env("X") sem valor padrão ou Deno.env.get) precisam existir no remoto; os SUPABASE_* o Supabase põe sozinho
const segredos = new Set((await api("/secrets")).map((s) => s.name));
const exigidos = new Set();
const varrer = (dir) => {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) varrer(p);
    else if (/\.ts$/.test(d.name)) for (const [, nome] of readFileSync(p, "utf8").matchAll(/\b(?:env|Deno\.env\.get)\("([A-Z_]+)"\)/g)) if (!nome.startsWith("SUPABASE_")) exigidos.add(nome);
  }
};
varrer(path.join(RAIZ, "supabase/functions"));
const PENDENTES = {};
for (const nome of exigidos) {
  if (segredos.has(nome)) continue;
  if (PENDENTES[nome]) avisos.push(`secret ${nome} ainda não existe no remoto: ${PENDENTES[nome]}`);
  else falhas.push(`secret ${nome} exigido pelas funções e ausente no remoto`);
}

console.log(`Migrations: ${locais.length} no repositório, ${remotas.length} no remoto`);
console.log(`Funções: ${funcoesLocais.length} no repositório, ${Object.keys(funcoesRemotas).length} no remoto`);
console.log(`Auth: ${MAPA.length} configurações comparadas`);
console.log("Diferenças esperadas (não conferidas): site_url e URLs de retorno (localhost × rtquimico.web.app). Google e DeepSeek são os reais nos dois lados.");
for (const a of avisos) console.log(`aviso: ${a}`);
if (falhas.length) {
  console.log(`\n${falhas.length} diferença(s):`);
  for (const f of falhas) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("\nLocal e remoto iguais.");
