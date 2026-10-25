import { AlertTriangle, ArrowRight, BellRing, BookOpenCheck, CheckCircle2, ClipboardCheck, Clock3, FileText, FlaskConical, Radar, Search, Send, Wallet } from "lucide-react";
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
  { icon: Send, title: "Quadro do CRQ", text: "Comunicação de início e de baixa de cada RT num kanban. Só sai da coluna pendente com o protocolo." },
  { icon: BellRing, title: "Vigência de TRT, ART e CRT", text: "Alerta no painel e lembrete na sua Google Agenda 28 e 7 dias antes de vencer." },
  { icon: BookOpenCheck, title: "Diário técnico com IA", text: "Visita, coleta, laudo e orientação registrados por empresa, com data e evidências anexadas." },
  { icon: ClipboardCheck, title: "Conformidade", text: "Checklist por empresa, item a item, com a porcentagem de cada RT." },
  { icon: FileText, title: "15 POPs com fonte normativa", text: "Procedimentos completos que citam RDC, CONAMA, NBR e NR. Adapte à empresa com IA." },
  { icon: Radar, title: "Radar regulatório", text: "CRQ, CONAMA, MMA e Ibama num lugar só, e a IA explica o que muda para as suas empresas." },
  { icon: Wallet, title: "Financeiro e imposto de renda", text: "Honorários por empresa, despesas dedutíveis, carnê-leão do mês e guia do IR campo a campo." },
  { icon: Search, title: "Busca geral", text: "Digite CNPJ, empresa, CRQ ou nome do POP e abra o que precisa em um clique." },
];

// A dor de quem é RT, em uma linha, e o que o RTQuímico faz com ela
const DORES = [
  { dor: "A TRT venceu e ninguém avisou.", solucao: "Vigência de TRT, ART e CRT monitorada, com alerta no painel e lembrete na Google Agenda 28 e 7 dias antes." },
  { dor: "Assumiu a RT e esqueceu de comunicar o CRQ.", solucao: "Toda RT nova entra no Quadro do CRQ como \"Comunicar início\" e só sai de lá com o número do protocolo." },
  { dor: "A fiscalização pediu prova da orientação.", solucao: "Diário técnico datado, por empresa, com fotos e laudos anexados. Você anota do seu jeito e a IA redige o registro formal." },
  { dor: "Houve derramamento e o POP era genérico.", solucao: "15 POPs com objetivo, procedimento passo a passo e registros, citando RDC 275, CONAMA 430, NBR 14725, NR-20 e outras." },
  { dor: "Saiu resolução nova e você soube depois.", solucao: "Radar regulatório com CRQ, CONAMA, MMA e Ibama. A IA lê a notícia e diz quais empresas suas são afetadas pelo CNAE." },
  { dor: "Honorário no CPF e o carnê-leão no fim do mês.", solucao: "Carnê-leão calculado com a tabela vigente e guia do IR em PDF dizendo em qual ficha e em qual campo digitar." },
];

// Telas reais do produto, cada uma com a dor que resolve
const TELAS = [
  { img: "quadro-crq", rotulo: "Quadro do CRQ", titulo: "Nenhuma comunicação ao conselho esquecida.", texto: "Cada RT aparece na coluna da etapa em que está. Arraste de \"Comunicar início\" para \"Início comunicado\" e informe o protocolo. Encerrou o vínculo? A RT vai para \"Comunicar encerramento\" até você dar a baixa. Atraso fica em vermelho, com os dias contados.", itens: ["Prazo de 24 h à vista", "Protocolo guardado em cada RT", "Lista e quadro sempre iguais"] },
  { img: "diario-ia", rotulo: "Diário técnico", titulo: "Sua anotação vira registro formal.", texto: "Escreva como você fala: \"conferi o armazenamento, orientei a separar ácidos das bases\". A IA redige em linguagem técnica e aponta o que faltou, como quem acompanhou a visita. Você revisa e salva. O registro fica datado, por empresa, com fotos e laudos anexados.", itens: ["Prova da sua atuação", "Relatório em PDF por período", "Nada é salvo sem a sua revisão"] },
  { img: "pops", rotulo: "Biblioteca de POPs", titulo: "POP com objetivo, procedimento e fonte.", texto: "Calibração de pHmetro, coleta e preservação de amostras, operação de ETE, gestão de resíduos, armazenamento de inflamáveis, controle de pragas. Cada modelo cita as normas em que se baseia. Escolha a empresa e a IA adapta ao CNAE dela.", itens: ["RDC 275, CONAMA 430, NBR 9898, NBR 14725, NR-06, NR-20", "Adaptação por IA para cada empresa", "POPs do escritório salvos à parte"] },
  { img: "radar", rotulo: "Radar regulatório", titulo: "A leitura do dia, sem garimpar site de órgão.", texto: "As novidades do CRQ, do CONAMA, do MMA e do Ibama chegam juntas, com o título grande e o resumo legível. Em \"Explicar com IA\", você recebe o resumo e a lista das suas empresas que podem ser afetadas, pelo CNAE de cada uma.", itens: ["Fontes oficiais, link para o texto original", "Marca o que você já leu", "Explicação guardada, ver de novo não gasta"] },
  { img: "financeiro-ir", rotulo: "Financeiro e IR", titulo: "Honorário recebido, imposto resolvido.", texto: "Lance os honorários por empresa e as despesas da atividade com foto do comprovante. Se você recebe no CPF, o carnê-leão do mês sai calculado. Em março, o guia do IR em PDF mostra em qual ficha do programa da Receita clicar e o que digitar em cada campo.", itens: ["Recebimento no CPF ou pela sua empresa", "Despesas dedutíveis do livro-caixa", "Planilha para o seu contador"] },
  { img: "busca", rotulo: "Busca geral", titulo: "CNPJ, empresa, CRQ ou POP: digitou, achou.", texto: "A busca do topo procura em tudo: RTs, razão social, CNPJ com ou sem pontuação, pessoas da equipe pelo CRQ, POPs, honorários e registros do diário. O resultado abre a página já filtrada.", itens: ["Resultados enquanto você digita", "Setas e Enter para abrir", "No celular, pela lupa"] },
];

const DUVIDAS = [
  { q: "Para quem é o RTQuímico?", a: "Para o profissional da Química que assina como responsável técnico por uma ou mais empresas e precisa controlar vigências, comunicações ao CRQ, registros e procedimentos." },
  { q: "Quantas empresas posso acompanhar?", a: "Até seis responsabilidades técnicas ativas ao mesmo tempo, o limite que o CRQ aplica. O menu mostra quantas você já usa (por exemplo, \"RT 3/6\")." },
  { q: "Os POPs são documentos oficiais?", a: "Não. São modelos de referência escritos a partir das normas citadas em cada um. Você adapta à empresa e confere a versão vigente de cada norma antes de assinar." },
  { q: "A IA escreve no meu lugar?", a: "Ela redige o rascunho a partir da sua anotação e aponta o que faltou. Nada vai para o diário ou para o POP sem a sua revisão: a responsabilidade técnica continua sendo sua." },
  { q: "Preciso de cartão para testar?", a: "Não. São 7 dias grátis com todos os recursos, sem cartão de crédito." },
  { q: "Meus dados ficam seguros?", a: "Cada conta só enxerga os próprios dados, com isolamento no banco de dados, e os documentos ficam em pasta privada." },
  { q: "Posso usar no celular?", a: "Sim. O painel funciona no navegador do celular, inclusive para registrar uma visita na hora, com foto." },
];

/** Captura de tela real numa moldura de navegador */
function Tela({ img, alt, prioridade = false }: { img: string; alt: string; prioridade?: boolean }) {
  return (
    <figure className="tela-moldura">
      <div className="tela-barra"><span /><span /><span /><b>rtquimico.web.app</b></div>
      <img src={`/telas/${img}.jpg`} alt={alt} loading={prioridade ? "eager" : "lazy"} decoding="async" />
    </figure>
  );
}

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Principal">
        <Link to="/"><Brand /></Link>
        <div className="landing-links">
          <a href="#dores">Por que usar</a>
          <a href="#telas">Telas</a>
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
          <span className="pill"><FlaskConical size={14} /> Para químicos responsáveis técnicos</span>
          <h1>Você assina pela empresa. O RTQuímico <em>protege a sua assinatura.</em></h1>
          <p>Vigência de TRT e ART, comunicação de início e baixa ao CRQ, registro de cada orientação dada, POP com fonte normativa e o carnê-leão dos honorários. Tudo num painel só, feito para quem responde tecnicamente por várias empresas.</p>
          <div className="hero-actions">
            <Link to={ROTA_CRIAR_CONTA} className="button primary large">Começar teste grátis <ArrowRight size={18} /></Link>
            <a className="button secondary large" href="#telas">Ver as telas</a>
          </div>
          <div className="trust-row">
            <span><CheckCircle2 size={16} /> 7 dias grátis, sem cartão</span>
            <span><CheckCircle2 size={16} /> Até 6 RTs ativas</span>
            <span><CheckCircle2 size={16} /> Funciona no celular</span>
          </div>
        </div>
        <div className="hero-visual">
          <Tela img="dashboard" alt="Dashboard do RTQuímico com RTs ativas, vencimentos, honorários e comunicação ao CRQ" prioridade />
          <div className="floating-card deadline"><Clock3 /><span><b>CRT vence em 18 dias</b>QuimNova Indústria</span></div>
          <div className="floating-card secure"><Send /><span><b>CRQ: comunicar início</b>Aqua Pura Ambiental</span></div>
        </div>
      </section>

      <section className="dores" id="dores" aria-labelledby="dores-titulo">
        <div className="section-head">
          <span className="pill">A dor de quem é RT</span>
          <h2 id="dores-titulo">Quando algo dá errado, o CRQ olha para o seu registro, não para a empresa.</h2>
          <p>Planilha, pasta de e-mail e lembrete no celular não seguram uma fiscalização. Veja o que mais tira o sono de quem é responsável técnico e o que o RTQuímico faz com cada coisa.</p>
        </div>
        <div className="dores-grade">
          {DORES.map(({ dor, solucao }) => (
            <article key={dor}>
              <h3><AlertTriangle size={18} /> {dor}</h3>
              <p><CheckCircle2 size={18} /> {solucao}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vitrine" id="telas" aria-labelledby="telas-titulo">
        <div className="section-head">
          <span className="pill">As telas</span>
          <h2 id="telas-titulo">Veja como fica o seu dia a dia de RT.</h2>
        </div>
        {TELAS.map((t, i) => (
          <article key={t.img} className={`vitrine-linha ${i % 2 ? "invertida" : ""}`}>
            <div className="vitrine-texto">
              <span className="vitrine-rotulo">{t.rotulo}</span>
              <h3>{t.titulo}</h3>
              <p>{t.texto}</p>
              <ul>{t.itens.map((x) => <li key={x}><CheckCircle2 size={17} /> {x}</li>)}</ul>
            </div>
            <Tela img={t.img} alt={`Tela ${t.rotulo} do RTQuímico`} />
          </article>
        ))}
        <article className="vitrine-celular">
          <div className="vitrine-texto">
            <span className="vitrine-rotulo">No celular</span>
            <h3>Registre a visita ainda dentro da empresa.</h3>
            <p>O painel abre no navegador do celular. Tire a foto do rótulo, da FDS na parede ou do ponto de coleta e anexe ao registro na hora, antes de esquecer o detalhe.</p>
          </div>
          <div className="celular-moldura"><img src="/telas/celular-dashboard.jpg" alt="RTQuímico no celular" loading="lazy" decoding="async" /></div>
        </article>
      </section>

      <HistoriaDoRT cta={<Link to={ROTA_CRIAR_CONTA} className="button primary large">Começar teste grátis <ArrowRight size={18} /></Link>} />

      <section className="features" id="recursos" aria-labelledby="recursos-titulo">
        <div className="section-head">
          <span className="pill">Recursos</span>
          <h2 id="recursos-titulo">Tudo o que vem no plano.</h2>
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
          <p>Por escritório: quem assina é o titular e vale para a equipe toda. Feito para quem responde por várias empresas e não pode perder um prazo. Cancele quando quiser.</p>
        </div>
        <div className="pricing-card">
          <span>Profissional</span>
          <p className="pricing-price">R$ 79<small>/mês</small></p>
          <ul>
            <li><CheckCircle2 size={17} /> Até 6 responsabilidades técnicas ativas</li>
            <li><CheckCircle2 size={17} /> Quadro do CRQ e alertas de vigência na Google Agenda</li>
            <li><CheckCircle2 size={17} /> Diário técnico com IA e anexos</li>
            <li><CheckCircle2 size={17} /> 15 POPs com fonte normativa e conformidade por empresa</li>
            <li><CheckCircle2 size={17} /> Radar regulatório com explicação por IA</li>
            <li><CheckCircle2 size={17} /> Financeiro, carnê-leão e guia do IR em PDF</li>
            <li><CheckCircle2 size={17} /> Equipe: convide outros químicos do escritório</li>
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
        <h2 id="cta-titulo">Sua assinatura vale o seu registro. Trate os prazos dela com o mesmo cuidado.</h2>
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
