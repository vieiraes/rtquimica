import { AlertTriangle, ArrowRight, Bell, BookOpen, CalendarClock, CheckCircle2, Clock3, FlaskConical, Gauge, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Brand, Field } from "./primitives";
import { isSupabaseConfigured } from "../lib/supabase";
import type { AuthPayload } from "../types";

export function Landing({
  onEnter,
  onAuth,
  authLoading,
  dark,
  setDark,
}: {
  onEnter: () => void;
  onAuth: (payload: AuthPayload) => Promise<void>;
  authLoading: boolean;
  dark: boolean;
  setDark: (value: boolean) => void;
}) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand />
        <div className="landing-links">
          <a href="#beneficios">Benefícios</a>
          <a href="#planos">Planos</a>
          <a href="#seguranca">Segurança</a>
        </div>
        <div className="landing-actions">
          <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <a className="button ghost" href="#auth">Entrar</a>
          <a className="button primary" href="#auth">Teste grátis <ArrowRight size={17} /></a>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill"><Sparkles size={14} /> Gestão técnica sem improviso</span>
          <h1>Suas RTs organizadas. Sua atuação <em>protegida.</em></h1>
          <p>Centralize responsabilidades técnicas, prazos, documentos e registros profissionais em uma plataforma feita para químicos.</p>
          <div className="hero-actions">
            <a className="button primary large" href="#auth">Começar teste grátis <ArrowRight size={18} /></a>
            <span>7 dias grátis<br />sem cartão de crédito</span>
          </div>
          <div className="trust-row">
            <span><CheckCircle2 size={16} /> Alertas automáticos</span>
            <span><CheckCircle2 size={16} /> Até 6 empresas</span>
            <span><CheckCircle2 size={16} /> Registros auditáveis</span>
          </div>
          <AuthPanel onAuth={onAuth} loading={authLoading} onDemo={onEnter} />
        </div>
        <div className="hero-visual" aria-label="Prévia do painel RTQuímico">
          <div className="molecule molecule-one" />
          <div className="molecule molecule-two" />
          <div className="preview-window">
            <div className="preview-top"><span /><span /><span /><b>RTQuímico</b></div>
            <div className="preview-body">
              <div className="preview-side">
                <FlaskConical size={23} />
                {[1, 2, 3, 4, 5].map((item) => <i key={item} />)}
              </div>
              <div className="preview-content">
                <small>VISÃO GERAL</small>
                <h3>Bom dia, Mariana</h3>
                <div className="preview-cards">
                  <div><ShieldCheck /><b>4</b><span>RTs ativas</span></div>
                  <div><CalendarClock /><b>2</b><span>A vencer</span></div>
                  <div><Bell /><b>3</b><span>Alertas</span></div>
                </div>
                <div className="preview-chart">
                  <div className="bars"><i /><i /><i /><i /><i /><i /></div>
                  <div className="mini-list"><span /><span /><span /></div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-card secure"><ShieldCheck /><span><b>Dados protegidos</b>RLS por usuário</span></div>
          <div className="floating-card deadline"><Clock3 /><span><b>Prazo monitorado</b>18 dias restantes</span></div>
        </div>
      </section>
      <section className="benefits" id="beneficios">
        <div><AlertTriangle /><h3>Antecipe os prazos</h3><p>Alertas de 30 e 7 dias evitam surpresas com documentos vencidos.</p></div>
        <div><BookOpen /><h3>Documente sua atuação</h3><p>Construa um histórico técnico sólido com evidências e anexos.</p></div>
        <div><Gauge /><h3>Veja tudo em um lugar</h3><p>Acompanhe até seis empresas sem perder contexto ou prioridade.</p></div>
      </section>
      <section className="landing-cta" id="planos">
        <span className="pill">Plano profissional • R$ 79/mês</span>
        <h2>Menos planilhas. Mais segurança para exercer sua profissão.</h2>
        <a className="button light large" href="#auth">Conhecer o painel <ArrowRight size={18} /></a>
      </section>
      <footer className="landing-footer" id="seguranca"><Brand /><span>Gestão profissional de responsabilidade técnica.</span><span>© 2026 RTQuímico</span></footer>
    </div>
  );
}

function AuthPanel({ onAuth, loading, onDemo }: { onAuth: (payload: AuthPayload) => Promise<void>; loading: boolean; onDemo: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("Mariana Vieira");
  const [email, setEmail] = useState("mariana@rtquimico.local");
  const [crq, setCrq] = useState("04289123");
  const [password, setPassword] = useState("rtquimico123");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onAuth({ mode, name, email, crq, password });
  };

  return (
    <form className="auth-card" id="auth" onSubmit={submit}>
      <div className="auth-tabs">
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Criar conta</button>
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Entrar</button>
      </div>
      {mode === "signup" && (
        <>
          <Field label="Nome completo"><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
          <Field label="Número CRQ"><input value={crq} onChange={(event) => setCrq(event.target.value)} required /></Field>
        </>
      )}
      <Field label="E-mail"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
      <Field label="Senha"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></Field>
      <button className="button primary full" disabled={loading}>{loading ? "Conectando..." : mode === "signup" ? "Criar e entrar" : "Entrar no painel"}</button>
      {!isSupabaseConfigured && <button className="button ghost full" type="button" onClick={onDemo}>Abrir demo sem Supabase</button>}
      <small>Usa Supabase Auth local. O cadastro cria seu perfil via trigger no banco.</small>
    </form>
  );
}
