import { ArrowLeft, BellRing, BookOpenCheck, ShieldCheck } from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Brand, Field } from "./primitives";
import { isSupabaseConfigured } from "../lib/supabase";
import { navegar, ROTA_CRIAR_CONTA, ROTA_ENTRAR } from "../lib/rotas";
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
}: {
  mode: "login" | "signup";
  onAuth: (payload: AuthPayload) => Promise<void>;
  loading: boolean;
  onDemo: () => void;
  /** Envia o e-mail de "definir senha" para o endereço digitado */
  onEsqueci?: (email: string) => void;
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

          <form onSubmit={submit}>
            {signup && (
              <>
                <Field label="Nome completo"><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field>
                <Field label="Número do CRQ"><input value={crq} onChange={(event) => setCrq(event.target.value)} inputMode="numeric" required /></Field>
              </>
            )}
            <Field label="E-mail"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></Field>
            <Field label="Senha"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={signup ? "new-password" : "current-password"} minLength={6} required /></Field>
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
    </div>
  );
}
