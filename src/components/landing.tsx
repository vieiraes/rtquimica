import { ArrowRight, Bell, BellRing, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardCheck, Clock3, FileText, FlaskConical, Send, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { HistoriaDoRT } from "./historia/HistoriaDoRT";
import { Brand } from "./primitives";
import { navegar, ROTA_CRIAR_CONTA, ROTA_ENTRAR } from "../lib/rotas";

/** Link interno que troca de página sem recarregar. */
function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const ir = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navegar(to);
  };
  return <a className={className} href={to} onClick={ir}>{children}</a>;
}

const RECURSOS = [
  { icon: BellRing, title: "Alertas de vigência", text: "Avisos 30 e 7 dias antes de cada documento vencer, no painel e no e-mail." },
  { icon: BookOpenCheck, title: "Diário técnico", text: "Cada visita, coleta, laudo e orientação registrados com data, empresa e evidências." },
  { icon: ClipboardCheck, title: "Conformidade e FISPQ", text: "Checklists por empresa e fichas de segurança conferidas item a item." },
  { icon: FileText, title: "Biblioteca de POPs", text: "Modelos de procedimentos prontos para adaptar à realidade de cada empresa." },
  { icon: Wallet, title: "Financeiro e imposto de renda", text: "Honorários por empresa, despesas dedutíveis, carnê-leão do mês e o resumo pronto para a declaração." },
  { icon: Send, title: "Comunicação ao CRQ", text: "Nova RT cadastrada vira lembrete de comunicação ao conselho em até 24 horas." },
];

const DUVIDAS = [
  { q: "Para quem é o RTQuímico?", a: "Para profissionais da Química que respondem tecnicamente por uma ou mais empresas e precisam controlar prazos, documentos e registros da atuação." },
  { q: "Quantas empresas posso acompanhar?", a: "O plano profissional cobre até seis responsabilidades técnicas ativas ao mesmo tempo." },
  { q: "Preciso de cartão para testar?", a: "Não. São 7 dias grátis com todos os recursos, sem cartão de crédito." },
  { q: "Meus dados ficam seguros?", a: "Cada conta só enxerga os próprios dados, com isolamento no banco de dados, e os documentos ficam em pasta privada." },
  { q: "Posso usar no celular?", a: "Sim. O painel funciona no navegador do celular, inclusive para registrar uma visita na hora." },
];

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Principal">
        <Link to="/"><Brand /></Link>
        <div className="landing-links">
          <a href="#historia">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#planos">Plano</a>
          <a href="#duvidas">Dúvidas</a>
        </div>
        <div className="landing-actions">
          <Link to={ROTA_ENTRAR} className="button ghost">Entrar</Link>
          <Link to={ROTA_CRIAR_CONTA} className="button primary">Teste grátis <ArrowRight size={17} /></Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="pill"><Sparkles size={14} /> Gestão técnica sem improviso</span>
          <h1>Suas RTs organizadas. Sua atuação <em>protegida.</em></h1>
          <p>Centralize responsabilidades técnicas, prazos, documentos e registros profissionais em uma plataforma feita para químicos.</p>
          <div className="hero-actions">
            <Link to={ROTA_CRIAR_CONTA} className="button primary large">Começar teste grátis <ArrowRight size={18} /></Link>
            <a className="button secondary large" href="#historia">Ver como funciona</a>
          </div>
          <div className="trust-row">
            <span><CheckCircle2 size={16} /> 7 dias grátis, sem cartão</span>
            <span><CheckCircle2 size={16} /> Até 6 empresas</span>
            <span><CheckCircle2 size={16} /> Registros auditáveis</span>
          </div>
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
          <div className="floating-card secure"><ShieldCheck /><span><b>Dados protegidos</b>Cada conta só vê o que é dela</span></div>
          <div className="floating-card deadline"><Clock3 /><span><b>Prazo monitorado</b>18 dias restantes</span></div>
        </div>
      </section>

      <section className="pain-strip" aria-label="O problema">
        <p><b>Planilha, pasta de e-mail e lembrete no celular</b> não protegem o seu registro profissional. Um certificado vencido ou uma visita sem registro pesam no CRQ, não na empresa.</p>
      </section>

      <HistoriaDoRT cta={<Link to={ROTA_CRIAR_CONTA} className="button primary large">Começar teste grátis <ArrowRight size={18} /></Link>} />

      <section className="features" id="recursos" aria-labelledby="recursos-titulo">
        <div className="section-head">
          <span className="pill">Recursos</span>
          <h2 id="recursos-titulo">Tudo o que a sua responsabilidade técnica pede, num lugar só.</h2>
        </div>
        <div className="feature-grid">
          {RECURSOS.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span className="feature-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing" id="planos" aria-labelledby="plano-titulo">
        <div className="pricing-copy">
          <span className="pill">Plano</span>
          <h2 id="plano-titulo">Um plano, sem surpresa.</h2>
          <p>Feito para quem responde por várias empresas e não pode perder um prazo. Cancele quando quiser.</p>
        </div>
        <div className="pricing-card">
          <span>Profissional</span>
          <p className="pricing-price">R$ 79<small>/mês</small></p>
          <ul>
            <li><CheckCircle2 size={17} /> Até 6 responsabilidades técnicas ativas</li>
            <li><CheckCircle2 size={17} /> Alertas de vigência no painel e no e-mail</li>
            <li><CheckCircle2 size={17} /> Diário técnico e documentos ilimitados</li>
            <li><CheckCircle2 size={17} /> Checklists, FISPQ e biblioteca de POPs</li>
            <li><CheckCircle2 size={17} /> Financeiro com carnê-leão e resumo do IR</li>
          </ul>
          <Link to={ROTA_CRIAR_CONTA} className="button primary full large">Começar 7 dias grátis</Link>
        </div>
      </section>

      <section className="faq" id="duvidas" aria-labelledby="duvidas-titulo">
        <div className="section-head">
          <span className="pill">Dúvidas</span>
          <h2 id="duvidas-titulo">Perguntas frequentes</h2>
        </div>
        <div className="faq-list">
          {DUVIDAS.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-titulo">
        <span className="pill">7 dias grátis • sem cartão de crédito</span>
        <h2 id="cta-titulo">Menos planilhas. Mais segurança para exercer sua profissão.</h2>
        <Link to={ROTA_CRIAR_CONTA} className="button light large">Criar minha conta <ArrowRight size={18} /></Link>
      </section>

      <footer className="landing-footer">
        <Brand />
        <span>Gestão profissional de responsabilidade técnica.</span>
        <span className="landing-footer-links"><Link to={ROTA_ENTRAR}>Entrar</Link> · © 2026 RTQuímico</span>
      </footer>
    </div>
  );
}
