import {
  Bell,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Radar,
  Settings,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, Brand } from "./primitives";
import { ehQuimico, paginaInicial, paginasDoPapel, type Papel } from "../lib/papeis";
import type { Alert, Page, RT, TechnicalAction } from "../types";
import { BuscaGeral } from "./busca-geral";
import { LIMITE_RTS } from "../lib/limites";

const nav: Array<{ id: Page; label: string; icon: typeof Bell }> = [
  { id: "plataforma", label: "Usuários da plataforma", icon: UsersRound },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "rts", label: "RT", icon: ShieldCheck },
  { id: "acoes", label: "Diário técnico", icon: BookOpen },
  { id: "checklist", label: "Conformidade", icon: ClipboardCheck },
  { id: "pops", label: "Biblioteca de POPs", icon: FileText },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
];
// Ficam no menu do nome (canto superior direito), não no menu lateral
const navConta: Array<{ id: Page; label: string; icon: typeof Bell }> = [
  { id: "perfil", label: "Perfil e configurações", icon: Settings },
  { id: "equipe", label: "Equipe", icon: UsersRound },
  { id: "assinatura", label: "Assinatura", icon: CreditCard },
];

const GRUPO: Record<Papel, string> = { superadmin: "PLATAFORMA", tenant_admin: "GESTÃO", tenant_member: "GESTÃO", tenant_external_client: "CONTA" };

const pageTitles: Record<Page, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: "", title: "", description: "Aqui está o panorama das suas responsabilidades técnicas." },
  rts: { eyebrow: "", title: "RT", description: "Acompanhe vínculos, documentos, vigências e conformidade." },
  alertas: { eyebrow: "", title: "Alertas e notificações", description: "Priorize prazos críticos e mantenha as empresas regulares." },
  acoes: { eyebrow: "", title: "Diário técnico", description: "Documente orientações, visitas, análises e evidências." },
  checklist: { eyebrow: "", title: "Conformidade", description: "Revise as exigências e acompanhe a evolução de cada empresa." },
  pops: { eyebrow: "", title: "Biblioteca de POPs", description: "Parta de procedimentos estruturados e adapte à sua operação." },
  radar: { eyebrow: "", title: "Radar regulatório", description: "Novidades do CFQ, do CRQ, do CONAMA, do MMA e do Ibama num lugar só." },
  assinatura: { eyebrow: "", title: "Assinatura", description: "Situação do plano do escritório e pagamento." },
  financeiro: { eyebrow: "", title: "Financeiro", description: "Honorários, despesas dedutíveis, carnê-leão e o resumo para o imposto de renda." },
  plataforma: { eyebrow: "", title: "Usuários da plataforma", description: "Quem usa o RTQuímico: químicos e escritórios." },
  equipe: { eyebrow: "", title: "Equipe", description: "Pessoas com acesso ao workspace do escritório." },
  perfil: { eyebrow: "", title: "Perfil e configurações", description: "Seus dados e preferências." },
};

function saudacao(nome: string) {
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  return `${periodo}, ${nome.split(" ")[0]}`;
}

const hoje = () => {
  const texto = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export function Sidebar({
  page,
  open,
  onNavigate,
  onClose,
  rtsAtivas,
  atrasados,
  radarNovas,
  papel,
  restringir,
}: {
  page: Page;
  open: boolean;
  onNavigate: (page: Page) => void;
  onClose: () => void;
  /** RTs ativas: "3/6" ao lado de RT (limite do CRQ) */
  rtsAtivas: number;
  atrasados: number;
  radarNovas: number;
  papel: Papel | null;
  /** Assinatura bloqueada: só estas páginas aparecem no menu */
  restringir?: Page[];
}) {
  const permitidas = paginasDoPapel(papel).filter((p) => !restringir || restringir.includes(p));
  const item = ({ id, label, icon: Icon }: (typeof nav)[number]) => (
    <button key={id} className={page === id ? "active" : ""} onClick={() => onNavigate(id)}>
      <Icon size={19} />
      <span>{label}</span>
      {id === "rts" && <b className="nav-uso" title={`RTs ativas: ${rtsAtivas} de ${LIMITE_RTS} permitidas pelo CRQ`}>{rtsAtivas}/{LIMITE_RTS}</b>}
      {id === "financeiro" && atrasados > 0 && <b className="nav-badge" title="Honorários em atraso">{atrasados}</b>}
    </button>
  );
  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Fechar menu" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand"><Brand /><button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button></div>
        {permitidas.includes("radar") && (
          <button className={`radar-destaque ${page === "radar" ? "active" : ""} ${radarNovas > 0 ? "tem-novidade" : ""}`} onClick={() => onNavigate("radar")}>
            <span className="radar-destaque-icone"><Radar size={19} />{radarNovas > 0 && <i />}</span>
            <span>
              <small>Leitura do dia</small>
              <b>Radar regulatório</b>
              <em>{radarNovas > 0 ? `${radarNovas > 99 ? "99+" : radarNovas} ${radarNovas === 1 ? "novidade para ler" : "novidades para ler"}` : "Tudo lido por hoje"}</em>
            </span>
          </button>
        )}
        <nav className="nav-list">
          <small>{GRUPO[papel ?? "tenant_member"]}</small>
          {nav.filter((n) => permitidas.includes(n.id)).map(item)}
        </nav>
      </aside>
    </>
  );
}

export function Header({
  onMenu,
  onNavigate,
  restringir,
  onLogout,
  email,
  tenantId,
  rts,
  actions,
  onBuscaAbrir,
  alerts,
  onMarkRead,
  onAlerts,
  name,
  subtitle,
  initials,
  foto,
  papel,
}: {
  onMenu: () => void;
  onNavigate: (page: Page) => void;
  restringir?: Page[];
  onLogout: () => void;
  email: string;
  tenantId?: string;
  rts: RT[];
  actions: TechnicalAction[];
  onBuscaAbrir: (pagina: Page, termo?: string) => void;
  alerts: Alert[];
  onMarkRead: (ids?: Array<string | number>) => Promise<void>;
  onAlerts: () => void;
  name: string;
  subtitle: string;
  initials: string;
  foto: string | null;
  papel: Papel | null;
}) {
  const quimico = ehQuimico(papel);
  const permitidas = paginasDoPapel(papel).filter((p) => !restringir || restringir.includes(p));
  const itensConta = navConta.filter((n) => permitidas.includes(n.id));
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
      <BuscaGeral papel={papel} tenantId={tenantId} rts={rts} actions={actions} alerts={alerts} onAbrir={onBuscaAbrir} />
      <div className="topbar-actions">
        {quimico && <SinoAlertas alerts={alerts} onMarkRead={onMarkRead} onVerTodos={onAlerts} />}
        <MenuConta name={name} subtitle={subtitle} email={email} initials={initials} foto={foto} itens={itensConta} onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </header>
  );
}

const ROTULO: Partial<Record<Page, string>> = { alertas: "Alertas", radar: "Radar regulatório" };
const rotuloDa = (page: Page) => [...nav, ...navConta].find((n) => n.id === page)?.label ?? ROTULO[page] ?? pageTitles[page].title;

/** Início › seção › página. "Início" leva à página inicial do papel (Dashboard ou Usuários da plataforma). */
function Breadcrumb({ page, papel, onNavigate }: { page: Page; papel: Papel | null; onNavigate: (page: Page) => void }) {
  const inicio = paginaInicial(papel);
  const secao = navConta.some((n) => n.id === page) ? "Conta" : GRUPO[papel ?? "tenant_member"].charAt(0) + GRUPO[papel ?? "tenant_member"].slice(1).toLowerCase();
  return (
    <nav className="breadcrumb" aria-label="Você está em">
      <ol>
        <li>{page === inicio ? <span aria-current="page"><Home size={14} /> {rotuloDa(inicio)}</span> : <button onClick={() => onNavigate(inicio)}><Home size={14} /> {rotuloDa(inicio)}</button>}</li>
        {page !== inicio && <li><span>{secao}</span></li>}
        {page !== inicio && <li><span aria-current="page">{rotuloDa(page)}</span></li>}
      </ol>
    </nav>
  );
}

export function PageHeading({ page, name, papel, onNavigate, onPrimary }: { page: Page; name: string; papel: Papel | null; onNavigate: (page: Page) => void; onPrimary: () => void }) {
  const meta = page === "dashboard"
    ? { ...pageTitles.dashboard, eyebrow: hoje(), title: saudacao(name) }
    : pageTitles[page];
  const hasPrimary = page === "rts" || page === "acoes";
  return (
    <div className="page-heading">
      <div><Breadcrumb page={page} papel={papel} onNavigate={onNavigate} />{page === "dashboard" && <span className="eyebrow">{meta.eyebrow}</span>}<h1>{meta.title}</h1><p>{meta.description}</p></div>
      {hasPrimary && <button className="button primary" onClick={onPrimary}><Plus size={18} /> {page === "acoes" ? "Registrar ação" : "Nova RT"}</button>}
    </div>
  );
}

/** Sininho do topo: o número de alertas não lidos, balança enquanto houver algum e abre a lista. */
function SinoAlertas({ alerts, onMarkRead, onVerTodos }: { alerts: Alert[]; onMarkRead: (ids?: Array<string | number>) => Promise<void>; onVerTodos: () => void }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useFechaAoClicarFora(aberto, () => setAberto(false));
  const naoLidos = alerts.filter((a) => !a.read);
  const lista = [...naoLidos, ...alerts.filter((a) => a.read)].slice(0, 6);

  return (
    <div className="sino" ref={caixa}>
      <button
        className={`icon-button notification-button ${naoLidos.length ? "tem-alerta" : ""}`}
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidos.length ? `Alertas: ${naoLidos.length} não ${naoLidos.length === 1 ? "lido" : "lidos"}` : "Alertas"}
        aria-expanded={aberto}
      >
        <Bell size={19} />
        {naoLidos.length > 0 && <b className="sino-contador">{naoLidos.length > 99 ? "99+" : naoLidos.length}</b>}
      </button>
      {aberto && (
        <div className="sino-painel" role="dialog" aria-label="Alertas">
          <header>
            <b>Alertas</b>
            <small>{naoLidos.length ? `${naoLidos.length} não ${naoLidos.length === 1 ? "lido" : "lidos"}` : "Tudo lido"}</small>
            {naoLidos.length > 0 && <button onClick={() => void onMarkRead()}>Marcar todos como lidos</button>}
          </header>
          <div className="sino-lista">
            {lista.length === 0 && <p>Nenhum alerta por enquanto.</p>}
            {lista.map((alert) => (
              <button key={alert.id} className={alert.read ? "read" : ""} onClick={() => !alert.read && void onMarkRead([alert.id])} title={alert.read ? "" : "Clique para marcar como lido"}>
                <span className={`alert-symbol ${alert.level}`}>{alert.level === "success" ? <CheckCircle2 size={17} /> : alert.level === "info" ? <MessageSquareText size={17} /> : <AlertTriangle size={17} />}</span>
                <span><b>{alert.title}</b><small>{alert.text}</small><time>{alert.time}</time></span>
                {!alert.read && <i className="unread-dot" />}
              </button>
            ))}
          </div>
          <footer><button onClick={() => { setAberto(false); onVerTodos(); }}>Ver todos os alertas</button></footer>
        </div>
      )}
    </div>
  );
}

/** Clique no nome (canto superior direito): menu com o perfil e o Sair. */
function MenuConta({ name, subtitle, email, initials, foto, itens, onNavigate, onLogout }: { name: string; subtitle: string; email: string; initials: string; foto: string | null; itens: typeof navConta; onNavigate: (page: Page) => void; onLogout: () => void }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useFechaAoClicarFora(aberto, () => setAberto(false));
  return (
    <div className="menu-conta" ref={caixa}>
      <button className="profile-button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} aria-haspopup="menu">
        <Avatar foto={foto} iniciais={initials} />
        <span><b>{name}</b><small>{subtitle}</small></span>
        <ChevronDown size={16} className="menu-conta-seta" />
      </button>
      {aberto && (
        <div className="menu-conta-painel" role="menu">
          <div className="menu-conta-quem"><Avatar foto={foto} iniciais={initials} /><span><b>{name}</b><small>{email}</small></span></div>
          {itens.map(({ id, label, icon: Icon }) => <button key={id} role="menuitem" onClick={() => { setAberto(false); onNavigate(id); }}><Icon size={17} /> {label}</button>)}
          <button role="menuitem" className="logout" onClick={() => { setAberto(false); onLogout(); }}><LogOut size={17} /> Sair da conta</button>
        </div>
      )}
    </div>
  );
}

/** Fecha um painel suspenso ao clicar fora dele ou apertar Esc */
function useFechaAoClicarFora(aberto: boolean, fechar: () => void) {
  const caixa = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(fechar);
  useEffect(() => { fecharRef.current = fechar; });
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) fecharRef.current(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") fecharRef.current(); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  return caixa;
}

/** Botão flutuante no canto inferior direito: aparece depois de rolar a página e volta ao topo */
export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const ver = () => setVisivel(window.scrollY > 500);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, []);
  if (!visivel) return null;
  return (
    <button className="voltar-topo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo" title="Voltar ao topo">
      <ChevronUp size={22} />
    </button>
  );
}
