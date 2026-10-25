import { ArrowLeft, BellRing, BookOpenCheck, ShieldCheck } from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Brand, Field } from "./primitives";
import { isSupabaseConfigured } from "../lib/supabase";
import { navegar, ROTA_CRIAR_CONTA, ROTA_ENTRAR, ROTA_PRIVACIDADE, ROTA_TERMOS } from "../lib/rotas";
import { RodapeLegal } from "./site-footer";
import type { AuthPayload } from "../types";

const irPara = (caminho: string) => (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  navegar(caminho);
};

/** Página de acesso: `/entrar` (login) e `/criar-conta` (cadastro). */
export function AuthPage({
  mode,
  onAuth,
  loading,
  onDemo,
  onEsqueci,
  onGoogle,
}: {
  mode: "login" | "signup";
  onAuth: (payload: AuthPayload) => Promise<void>;
  loading: boolean;
  onDemo: () => void;
  /** Envia o e-mail de "definir senha" para o endereço digitado */
  onEsqueci?: (email: string) => void;
  /** Entrar ou criar conta com o Google (OAuth do Supabase) */
  onGoogle?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [crq, setCrq] = useState("");
  const [password, setPassword] = useState("");
  const signup = mode === "signup";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onAuth({ mode, name, email, crq, password });
  };

  return (
    <div className="auth-page">
      <header className="auth-page-top">
        <a href="/" onClick={irPara("/")} aria-label="RTQuímico, voltar para a página inicial"><Brand /></a>
        <a className="button ghost" href="/" onClick={irPara("/")}><ArrowLeft size={17} /> Voltar ao site</a>
      </header>

      <main className="auth-page-body">
        <section className="auth-page-form" aria-labelledby="auth-titulo">
          <h1 id="auth-titulo">{signup ? "Crie sua conta" : "Entre na sua conta"}</h1>
          <p>{signup ? "7 dias grátis, sem cartão de crédito. Leva menos de um minuto." : "Bom te ver de novo. Seus prazos e registros estão onde você deixou."}</p>

          <div className="auth-tabs" role="tablist" aria-label="Tipo de acesso">
            <a role="tab" aria-selected={!signup} className={signup ? "" : "active"} href={ROTA_ENTRAR} onClick={irPara(ROTA_ENTRAR)}>Entrar</a>
            <a role="tab" aria-selected={signup} className={signup ? "active" : ""} href={ROTA_CRIAR_CONTA} onClick={irPara(ROTA_CRIAR_CONTA)}>Criar conta</a>
          </div>

          {onGoogle && isSupabaseConfigured && (
            <>
              <button type="button" className="button secondary full large botao-google" onClick={onGoogle} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                {signup ? "Criar conta com o Google" : "Entrar com o Google"}
              </button>
              <small className="auth-google-dica">{signup ? "Um clique: a conta usa o seu e-mail do Google, sem senha nova. O CRQ você informa depois, no painel." : "Use a mesma conta Google do cadastro."}</small>
              {signup && <small className="auth-aceite-google">Ao continuar com o Google, você aceita os <a href={ROTA_TERMOS} target="_blank" rel="noopener">Termos de Uso</a> e a <a href={ROTA_PRIVACIDADE} target="_blank" rel="noopener">Política de Privacidade</a>.</small>}
              <div className="auth-ou"><span>ou com e-mail e senha</span></div>
            </>
          )}
          <form onSubmit={submit}>
            {signup && (
              <>
                <Field label="Nome completo"><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field>
                <Field label="Número do CRQ"><input value={crq} onChange={(event) => setCrq(event.target.value)} inputMode="numeric" required /></Field>
              </>
            )}
            <Field label="E-mail"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></Field>
            <Field label="Senha"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={signup ? "new-password" : "current-password"} minLength={6} required /></Field>
            {signup && (
              <label className="auth-aceite">
                <input type="checkbox" required />
                <span>Li e aceito os <a href={ROTA_TERMOS} target="_blank" rel="noopener">Termos de Uso</a> e a <a href={ROTA_PRIVACIDADE} target="_blank" rel="noopener">Política de Privacidade</a>.</span>
              </label>
            )}
            <button className="button primary full large" disabled={loading}>{loading ? "Conectando..." : signup ? "Criar conta e entrar" : "Entrar"}</button>
          </form>
          {!signup && onEsqueci && isSupabaseConfigured && (
            <button type="button" className="auth-esqueci" onClick={() => onEsqueci(email.trim())}>Esqueci minha senha</button>
          )}

          {!isSupabaseConfigured && (
            <>
              <button className="button secondary full" type="button" onClick={onDemo}>Abrir demo sem Supabase</button>
              <small>Modo demonstração: os dados são fictícios e somem ao recarregar a página.</small>
            </>
          )}
          <p className="auth-page-switch">
            {signup ? <>Já tem conta? <a href={ROTA_ENTRAR} onClick={irPara(ROTA_ENTRAR)}>Entrar</a></> : <>Ainda não tem conta? <a href={ROTA_CRIAR_CONTA} onClick={irPara(ROTA_CRIAR_CONTA)}>Criar conta grátis</a></>}
          </p>
        </section>

        <aside className="auth-page-aside" aria-label="Por que usar o RTQuímico">
          <h2>Sua responsabilidade técnica, em ordem.</h2>
          <ul>
            <li><BellRing size={20} /><span><b>Nenhum prazo esquecido</b>Alertas de vigência no painel e lembretes na sua Google Agenda.</span></li>
            <li><BookOpenCheck size={20} /><span><b>Histórico que se sustenta</b>Diário técnico com data, empresa e evidências de cada atuação.</span></li>
            <li><ShieldCheck size={20} /><span><b>Cada empresa no seu lugar</b>Até seis empresas, com dados isolados e documentos em pasta privada.</span></li>
          </ul>
        </aside>
      </main>
      <RodapeLegal />
    </div>
  );
}

/** Quem chegou pelo link do convite (ou de "esqueci a senha") cria a senha aqui. */
export function DefinirSenha({ onDefinir }: { onDefinir: (senha: string) => Promise<void> }) {
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) { setErro("A senha precisa de pelo menos 6 caracteres."); return; }
    if (senha !== confirma) { setErro("As duas senhas não são iguais."); return; }
    setErro("");
    setSalvando(true);
    try { await onDefinir(senha); } catch (x) { setErro(x instanceof Error ? x.message : "Não consegui salvar a senha."); } finally { setSalvando(false); }
  };
  return (
    <div className="auth-page">
      <header className="auth-page-top"><Brand /></header>
      <main className="auth-page-body definir-senha">
        <section className="auth-page-form">
          <h1>Crie sua senha</h1>
          <p>Você vai usar o seu e-mail e esta senha para entrar no RTQuímico.</p>
          <form onSubmit={enviar}>
            <Field label="Nova senha"><input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></Field>
            <Field label="Repita a senha"><input type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} required /></Field>
            {erro && <p className="ia-diario-erro" role="alert">{erro}</p>}
            <button className="button primary large full" disabled={salvando}>{salvando ? "Salvando..." : "Salvar senha e entrar"}</button>
          </form>
        </section>
      </main>
      <RodapeLegal />
    </div>
  );
}
