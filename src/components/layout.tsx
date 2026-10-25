import {
  Bell,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "./primitives";
import { ehQuimico, paginasDoPapel, type Papel } from "../lib/papeis";
import type { Page } from "../types";

const nav: Array<{ id: Page; label: string; icon: typeof Bell }> = [
  { id: "plataforma", label: "Usuários da plataforma", icon: UsersRound },
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "rts", label: "Responsabilidades", icon: ShieldCheck },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "radar", label: "Radar regulatório", icon: Radar },
  { id: "acoes", label: "Diário técnico", icon: BookOpen },
  { id: "checklist", label: "Conformidade", icon: ClipboardCheck },
  { id: "pops", label: "Biblioteca de POPs", icon: FileText },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
];
const navConta: Array<{ id: Page; label: string; icon: typeof Bell }> = [
  { id: "equipe", label: "Equipe", icon: UsersRound },
  { id: "assinatura", label: "Assinatura", icon: CreditCard },
  { id: "perfil", label: "Configurações", icon: Settings },
];

const GRUPO: Record<Papel, string> = { superadmin: "PLATAFORMA", tenant_admin: "GESTÃO", tenant_member: "GESTÃO", tenant_external_client: "CONTA" };

const pageTitles: Record<Page, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: "", title: "", description: "Aqui está o panorama das suas responsabilidades técnicas." },
  rts: { eyebrow: "Gestão técnica", title: "Responsabilidades técnicas", description: "Acompanhe vínculos, documentos, vigências e conformidade." },
  alertas: { eyebrow: "Central de avisos", title: "Alertas e notificações", description: "Priorize prazos críticos e mantenha as empresas regulares." },
  acoes: { eyebrow: "Proteção profissional", title: "Diário técnico", description: "Documente orientações, visitas, análises e evidências." },
  checklist: { eyebrow: "CRQ-IV • São Paulo", title: "Checklist de conformidade", description: "Revise as exigências e acompanhe a evolução de cada empresa." },
  pops: { eyebrow: "Modelos editáveis", title: "Biblioteca de POPs", description: "Parta de procedimentos estruturados e adapte à sua operação." },
  radar: { eyebrow: "Sempre informado", title: "Radar regulatório", description: "Novidades do CFQ, do CRQ, do CONAMA, do MMA e do Ibama num lugar só." },
  assinatura: { eyebrow: "Seu escritório", title: "Assinatura", description: "Situação do plano do escritório e pagamento." },
  financeiro: { eyebrow: "Suas finanças", title: "Financeiro", description: "Honorários, despesas dedutíveis, carnê-leão e o resumo para o imposto de renda." },
  plataforma: { eyebrow: "Gestão do produto", title: "Usuários da plataforma", description: "Quem usa o RTQuímico: químicos e escritórios." },
  equipe: { eyebrow: "Seu escritório", title: "Equipe", description: "Pessoas com acesso ao workspace do escritório." },
  perfil: { eyebrow: "Minha conta", title: "Perfil e configurações", description: "Seus dados e preferências." },
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
  onLogout,
  name,
  subtitle,
  initials,
  activeCount,
  unread,
  atrasados,
  radarNovas,
  papel,
  restringir,
}: {
  page: Page;
  open: boolean;
  onNavigate: (page: Page) => void;
  onClose: () => void;
  onLogout: () => void;
  name: string;
  subtitle: string;
  initials: string;
  activeCount: number;
  unread: number;
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
      {id === "alertas" && unread > 0 && <b className="nav-badge">{unread}</b>}
      {id === "radar" && radarNovas > 0 && <b className="nav-badge info" title="Novidades não lidas">{radarNovas > 99 ? "99+" : radarNovas}</b>}
      {id === "financeiro" && atrasados > 0 && <b className="nav-badge" title="Honorários em atraso">{atrasados}</b>}
    </button>
  );
  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Fechar menu" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand"><Brand /><button className="mobile-close" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button></div>
        <div className="workspace-switch">
          <span className="avatar small">{initials}</span>
          <span><b>{name}</b><small>{subtitle}</small></span>
        </div>
        <nav className="nav-list">
          <small>{GRUPO[papel ?? "tenant_member"]}</small>
          {nav.filter((n) => permitidas.includes(n.id)).map(item)}
          <small>CONTA</small>
          {navConta.filter((n) => permitidas.includes(n.id)).map(item)}
        </nav>
        {ehQuimico(papel) && (
          <div className="sidebar-limit">
            <div><span>RTs em uso</span><b>{activeCount} de 6</b></div>
            <div className="progress"><i style={{ width: `${Math.min(100, (activeCount / 6) * 100)}%` }} /></div>
            <small>Você ainda pode cadastrar {Math.max(0, 6 - activeCount)} empresas.</small>
          </div>
        )}
        <button className="logout" onClick={onLogout}><LogOut size={18} /> Sair da conta</button>
      </aside>
    </>
  );
}

export function Header({
  onMenu,
  onProfile,
  unread,
  onAlerts,
  name,
  subtitle,
  initials,
  papel,
}: {
  onMenu: () => void;
  onProfile: () => void;
  unread: number;
  onAlerts: () => void;
  name: string;
  subtitle: string;
  initials: string;
  papel: Papel | null;
}) {
  const quimico = ehQuimico(papel);
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
      {quimico ? <div className="global-search"><Search size={18} /><input placeholder="Buscar empresa, documento ou ação..." aria-label="Buscar" /></div> : <span />}
      <div className="topbar-actions">
        {quimico && <button className="icon-button notification-button" onClick={onAlerts} aria-label="Ver alertas"><Bell size={19} />{unread > 0 && <i />}</button>}
        <button className="profile-button" onClick={onProfile}><span className="avatar">{initials}</span><span><b>{name}</b><small>{subtitle}</small></span></button>
      </div>
    </header>
  );
}

export function PageHeading({ page, name, onPrimary }: { page: Page; name: string; onPrimary: () => void }) {
  const meta = page === "dashboard"
    ? { ...pageTitles.dashboard, eyebrow: hoje(), title: saudacao(name) }
    : pageTitles[page];
  const hasPrimary = page === "dashboard" || page === "rts" || page === "acoes";
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p></div>
      {hasPrimary && <button className="button primary" onClick={onPrimary}><Plus size={18} /> {page === "acoes" ? "Registrar ação" : "Nova RT"}</button>}
    </div>
  );
}
