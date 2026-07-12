import {
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { Brand } from "./primitives";
import type { Page } from "../types";

const nav = [
  { id: "dashboard" as Page, label: "Visão geral", icon: LayoutDashboard },
  { id: "rts" as Page, label: "Responsabilidades", icon: ShieldCheck },
  { id: "alertas" as Page, label: "Alertas", icon: Bell, badge: 3 },
  { id: "acoes" as Page, label: "Diário técnico", icon: BookOpen },
  { id: "checklist" as Page, label: "Conformidade", icon: ClipboardCheck },
  { id: "pops" as Page, label: "Biblioteca de POPs", icon: FileText },
  { id: "empresa" as Page, label: "Portal da empresa", icon: Building2 },
];

const pageTitles: Record<Page, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: "Quarta-feira, 10 de junho", title: "Bom dia, Mariana", description: "Aqui está o panorama das suas responsabilidades técnicas." },
  rts: { eyebrow: "Gestão técnica", title: "Responsabilidades técnicas", description: "Acompanhe vínculos, documentos, vigências e conformidade." },
  alertas: { eyebrow: "Central de avisos", title: "Alertas e notificações", description: "Priorize prazos críticos e mantenha as empresas regulares." },
  acoes: { eyebrow: "Proteção profissional", title: "Diário técnico", description: "Documente orientações, visitas, análises e evidências." },
  checklist: { eyebrow: "CRQ-IV • São Paulo", title: "Checklist de conformidade", description: "Revise as exigências e acompanhe a evolução de cada empresa." },
  pops: { eyebrow: "Modelos editáveis", title: "Biblioteca de POPs", description: "Parta de procedimentos estruturados e adapte à sua operação." },
  empresa: { eyebrow: "Visão compartilhada", title: "Portal da empresa", description: "Uma experiência simples para a empresa contratante." },
  admin: { eyebrow: "Super administração", title: "Painel administrativo", description: "Métricas gerais, usuários, receita e atividade do sistema." },
  perfil: { eyebrow: "Minha conta", title: "Perfil e configurações", description: "Dados profissionais, preferências e assinatura." },
};

export function Sidebar({
  page,
  open,
  onNavigate,
  onClose,
  onLogout,
  name,
  crq,
  initials,
  activeCount,
  role,
}: {
  page: Page;
  open: boolean;
  onNavigate: (page: Page) => void;
  onClose: () => void;
  onLogout: () => void;
  name: string;
  crq: string;
  initials: string;
  activeCount: number;
  role?: string;
}) {
  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Fechar menu" />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand"><Brand /><button className="mobile-close" onClick={onClose}><X size={20} /></button></div>
        <div className="workspace-switch">
          <span className="avatar small">{initials}</span>
          <span><b>{name}</b><small>CRQ-IV {crq}</small></span>
          <ChevronDown size={16} />
        </div>
        <nav className="nav-list">
          <small>GESTÃO</small>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => onNavigate(item.id)}>
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge && <b className="nav-badge">{item.badge}</b>}
              </button>
            );
          })}
          <small>SISTEMA</small>
          { (role === "superadmin" || role === "tenant_admin") && <button className={page === "admin" ? "active" : ""} onClick={() => onNavigate("admin")}><UsersRound size={19} /><span>Administração</span></button> }
          <button className={page === "perfil" ? "active" : ""} onClick={() => onNavigate("perfil")}><Settings size={19} /><span>Configurações</span></button>
        </nav>
        <div className="sidebar-limit">
          <div><span>RTs em uso</span><b>{activeCount} de 6</b></div>
          <div className="progress"><i style={{ width: `${Math.min(100, (activeCount / 6) * 100)}%` }} /></div>
          <small>Você ainda pode cadastrar {Math.max(0, 6 - activeCount)} empresas.</small>
        </div>
        <button className="logout" onClick={onLogout}><LogOut size={18} /> Sair da conta</button>
      </aside>
    </>
  );
}

export function Header({
  onMenu,
  onProfile,
  dark,
  setDark,
  unread,
  onAlerts,
  name,
  initials,
}: {
  onMenu: () => void;
  onProfile: () => void;
  dark: boolean;
  setDark: (value: boolean) => void;
  unread: number;
  onAlerts: () => void;
  name: string;
  initials: string;
}) {
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Abrir menu"><Menu size={21} /></button>
      <div className="global-search"><Search size={18} /><input placeholder="Buscar empresa, documento ou ação..." /><kbd>⌘ K</kbd></div>
      <div className="topbar-actions">
        <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
        <button className="icon-button notification-button" onClick={onAlerts} aria-label="Ver alertas"><Bell size={19} />{unread > 0 && <i />}</button>
        <button className="profile-button" onClick={onProfile}><span className="avatar">{initials}</span><span><b>{name}</b><small>Plano Profissional</small></span><ChevronDown size={16} /></button>
      </div>
    </header>
  );
}

export function PageHeading({ page, onPrimary }: { page: Page; onPrimary: () => void }) {
  const meta = pageTitles[page];
  const hasPrimary = page === "dashboard" || page === "rts" || page === "acoes";
  return (
    <div className="page-heading">
      <div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p></div>
      {hasPrimary && <button className="button primary" onClick={onPrimary}><Plus size={18} /> {page === "acoes" ? "Registrar ação" : "Nova RT"}</button>}
    </div>
  );
}
