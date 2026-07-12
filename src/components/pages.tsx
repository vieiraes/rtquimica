import { Activity, AlertTriangle, ArrowRight, Bell, CalendarClock, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock3, FileCheck2, FileText, History, MessageSquareText, MoreHorizontal, Paperclip, PencilLine, Plus, Search, ShieldCheck, Sparkles, Upload, UsersRound } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Empty, Field, PanelHeader, Toggle } from "./primitives";
import { MONTHS_PT, daysUntil, parseBrDate } from "../lib/format";
import { checklistItems, popTemplates } from "../data/mock";
import type { Alert, Page, RT, TechnicalAction } from "../types";

export function Dashboard({ rts, alerts, onNavigate, onNewRt }: { rts: RT[]; alerts: Alert[]; onNavigate: (page: Page) => void; onNewRt: () => void }) {
  const active = rts.filter((rt) => rt.status === "Ativa").length;
  const expired = rts.filter((rt) => rt.status === "Vencida").length;
  const expiringSoon = rts.filter((rt) => {
    const days = daysUntil(rt.vigencia);
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const avgCompliance = rts.length
    ? Math.round(rts.reduce((sum, rt) => sum + rt.progresso, 0) / rts.length)
    : 0;
  const priorityAlerts = alerts.filter((a) => a.level === "danger" && !a.read).length;
  const upcomingRenewals = [...rts]
    .map((rt) => ({ rt, days: daysUntil(rt.vigencia) }))
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    })
    .slice(0, 3);
  const stats = [
    { label: "RTs ativas", value: active, detail: `${6 - active} vagas disponíveis`, icon: ShieldCheck, tone: "blue" },
    { label: "Documentos a vencer", value: expiringSoon, detail: "Nos próximos 30 dias", icon: CalendarClock, tone: "amber" },
    { label: "Alertas pendentes", value: alerts.filter((a) => !a.read).length, detail: priorityAlerts ? `${priorityAlerts} requer prioridade` : "Sem prioridade crítica", icon: Bell, tone: "red" },
    { label: "Conformidade média", value: `${avgCompliance}%`, detail: "Média entre as RTs", icon: ClipboardCheck, tone: "green" },
  ];
  return (
    <>
      <section className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <article className="stat-card" key={stat.label}><div className={`stat-icon ${stat.tone}`}><Icon size={21} /></div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>;
        })}
      </section>
      <section className="dashboard-grid">
        <article className="panel span-two">
          <PanelHeader title="Panorama das RTs" subtitle="Distribuição e situação atual" action="Ver todas" onAction={() => onNavigate("rts")} />
          <div className="overview-chart">
            <div className="donut"><div><b>{rts.length}</b><span>RTs totais</span></div></div>
            <div className="legend">
              <div><i className="dot active" /><span>Ativas</span><b>{active}</b></div>
              <div><i className="dot pending" /><span>Pendente</span><b>{rts.filter((rt) => rt.status === "Pendente").length}</b></div>
              <div><i className="dot expired" /><span>Vencidas</span><b>{expired}</b></div>
              <div><i className="dot available" /><span>Limite disponível</span><b>{6 - active}</b></div>
            </div>
            <div className="chart-note"><Sparkles size={18} /><span><b>Boa gestão de capacidade</b>Você está usando {Math.round((active / 6) * 100)}% do limite de RTs ativas.</span></div>
          </div>
        </article>
        <article className="panel">
          <PanelHeader title="Próximas renovações" subtitle="Prazos mais próximos" action="Calendário" />
          <div className="renewal-list">
            {upcomingRenewals.map(({ rt, days }) => {
              const date = parseBrDate(rt.vigencia);
              const monthLabel = date ? MONTHS_PT[date.getMonth()] : "--";
              const isUrgent = days !== null && days <= 30;
              return (
                <div className="renewal-item" key={rt.id}>
                  <div className={`date-block ${isUrgent ? "urgent" : ""}`}><b>{rt.vigencia.slice(0, 2)}</b><span>{monthLabel}</span></div>
                  <div><b>{rt.empresa}</b><span>{rt.documento} • {days !== null ? `${days} dias` : rt.vigencia}</span></div>
                  <ChevronRight size={17} />
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel span-two">
          <PanelHeader title="Responsabilidades recentes" subtitle="Acompanhamento por empresa" action="Gerenciar RTs" onAction={() => onNavigate("rts")} />
          <div className="rt-list compact">
            {rts.slice(0, 3).map((rt) => <RtRow key={rt.id} rt={rt} />)}
          </div>
        </article>
        <article className="panel attention-panel">
          <PanelHeader title="Requer atenção" subtitle="Prioridades para hoje" />
          <div className="attention-list">
            {alerts.filter((alert) => !alert.read).slice(0, 3).map((alert) => (
              <button key={alert.id} onClick={() => onNavigate("alertas")}><span className={`alert-symbol ${alert.level}`}><AlertTriangle size={17} /></span><span><b>{alert.title}</b><small>{alert.text}</small></span><ChevronRight size={16} /></button>
            ))}
          </div>
        </article>
      </section>
      <button className="mobile-fab" onClick={onNewRt}><Plus size={22} /><span>Nova RT</span></button>
    </>
  );
}

export function Responsibilities({ rts, onNew, showToast }: { rts: RT[]; onNew: () => void; showToast: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const filtered = rts.filter((rt) => (filter === "Todas" || rt.status === filter) && rt.empresa.toLowerCase().includes(query.toLowerCase()));
  return (
    <article className="panel table-panel">
      <div className="toolbar">
        <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa..." /></div>
        <div className="filter-tabs">{["Todas", "Ativa", "Pendente", "Vencida"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
        <button className="button secondary" onClick={onNew}><Plus size={17} /> Adicionar</button>
      </div>
      <div className="rt-table">
        <div className="table-head"><span>Empresa</span><span>Documento</span><span>Vigência</span><span>Conformidade</span><span>Status</span><span /></div>
        {filtered.map((rt) => <RtRow key={rt.id} rt={rt} detailed showToast={showToast} />)}
      </div>
      {filtered.length === 0 && <Empty title="Nenhuma RT encontrada" text="Ajuste a busca ou cadastre uma nova responsabilidade técnica." action={onNew} />}
    </article>
  );
}

function RtRow({ rt, detailed = false, showToast }: { rt: RT; detailed?: boolean; showToast?: (message: string) => void }) {
  return (
    <div className={`rt-row ${detailed ? "detailed" : ""}`}>
      <div className="company-cell"><span className="company-logo">{rt.empresa.slice(0, 2).toUpperCase()}</span><span><b>{rt.empresa}</b><small>{rt.cnpj}</small></span></div>
      <div><b>{rt.documento}</b><small>{rt.numero}</small></div>
      {detailed && <div><b>{rt.vigencia}</b><small>Vigência anual</small></div>}
      <div className="compliance-cell"><span><b>{rt.progresso}%</b></span><div className="progress"><i style={{ width: `${rt.progresso}%` }} /></div></div>
      <span className={`status ${rt.status.toLowerCase()}`}>{rt.status}</span>
      <button className="icon-button" onClick={() => showToast?.(`Detalhes de ${rt.empresa} abertos.`)} aria-label={`Mais opções para ${rt.empresa}`}><MoreHorizontal size={19} /></button>
    </div>
  );
}

export function Alerts({ alerts, onMarkRead }: { alerts: Alert[]; onMarkRead: (ids?: Array<string | number>) => Promise<void> }) {
  const unread = alerts.filter((alert) => !alert.read).length;
  return (
    <section className="content-grid alerts-layout">
      <article className="panel">
        <div className="alert-summary">
          <div><span className="stat-icon red"><Bell size={21} /></span><span><b>{unread} pendentes</b><small>1 aviso requer ação hoje</small></span></div>
          <button className="button secondary" onClick={() => void onMarkRead()}><Check size={17} /> Marcar como lidos</button>
        </div>
        <div className="full-alert-list">
          {alerts.map((alert) => (
            <button key={alert.id} className={alert.read ? "read" : ""} onClick={() => void onMarkRead([alert.id])}>
              <span className={`alert-symbol ${alert.level}`}>{alert.level === "success" ? <CheckCircle2 size={19} /> : alert.level === "info" ? <MessageSquareText size={19} /> : <AlertTriangle size={19} />}</span>
              <span><b>{alert.title}</b><small>{alert.text}</small><time>{alert.time}</time></span>
              {!alert.read && <i className="unread-dot" />}
            </button>
          ))}
        </div>
      </article>
      <aside className="panel notification-settings">
        <PanelHeader title="Preferências" subtitle="Canais de notificação" />
        <Toggle label="E-mail" description="Alertas e resumos semanais" checked />
        <Toggle label="Notificação push" description="Avisos no navegador" checked />
        <Toggle label="SMS" description="Somente prazos críticos" />
        <hr />
        <Toggle label="Antecedência de 30 dias" description="Criar alerta automático" checked />
        <Toggle label="Lembrete em 7 dias" description="Reforçar alertas pendentes" checked />
      </aside>
    </section>
  );
}

export function TechnicalDiary({ actions, onNew }: { actions: TechnicalAction[]; onNew: () => void }) {
  return (
    <section className="content-grid diary-layout">
      <article className="panel">
        <div className="toolbar">
          <div className="search-field"><Search size={18} /><input placeholder="Buscar no diário..." /></div>
          <button className="button secondary"><CalendarClock size={17} /> Período</button>
          <button className="button primary" onClick={onNew}><Plus size={17} /> Registrar</button>
        </div>
        <div className="timeline">
          {actions.map((action) => (
            <div className="timeline-item" key={action.id}>
              <span className="timeline-icon"><Activity size={18} /></span>
              <div className="timeline-card">
                <div><span className="category">{action.category}</span><time>{action.date}</time></div>
                <h3>{action.company}</h3><p>{action.description}</p>
                <span className="evidence"><Paperclip size={15} /> {action.evidence} evidência{action.evidence > 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
      <aside className="panel legal-card">
        <span className="legal-icon"><ShieldCheck size={26} /></span>
        <h3>Seu histórico técnico é sua proteção</h3>
        <p>Registros consistentes demonstram diligência, orientações e decisões ao longo da atuação.</p>
        <button className="button secondary full"><FileText size={17} /> Exportar relatório PDF</button>
        <div className="record-count"><b>{actions.length}</b><span>ações registradas<br />nos últimos 30 dias</span></div>
      </aside>
    </section>
  );
}

export function Compliance({ showToast }: { showToast: (message: string) => void }) {
  const [items, setItems] = useState(checklistItems);
  const progress = Math.round((items.filter((item) => item.done).length / items.length) * 100);
  return (
    <section className="compliance-layout">
      <article className="panel compliance-hero">
        <div className="company-selector"><span className="company-logo">QN</span><span><small>EMPRESA SELECIONADA</small><b>QuimNova Indústria</b></span><ChevronDown size={18} /></div>
        <div className="score-ring" style={{ "--score": `${progress * 3.6}deg` } as CSSProperties}><div><b>{progress}%</b><span>conforme</span></div></div>
        <div><span className="eyebrow">NÍVEL DE CONFORMIDADE</span><h2>{progress >= 80 ? "Ótimo andamento" : "Sua operação precisa de atenção"}</h2><p>Conclua os itens prioritários para reduzir riscos de fiscalização e pendências documentais.</p></div>
      </article>
      <article className="panel checklist-panel">
        <PanelHeader title="Itens obrigatórios" subtitle={`${items.filter((item) => item.done).length} de ${items.length} concluídos`} action="Salvar revisão" onAction={() => showToast("Checklist atualizado com sucesso.")} />
        <div className="checklist-list">
          {items.map((item, index) => (
            <label key={item.name} className={item.done ? "done" : ""}>
              <input type="checkbox" checked={item.done} onChange={() => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, done: !entry.done } : entry))} />
              <span className="custom-check">{item.done && <Check size={16} />}</span>
              <span><b>{item.name}</b><small>{item.done ? "Documento verificado" : "Pendente de regularização"}</small></span>
              {!item.done && <span className="priority">Prioritário</span>}
            </label>
          ))}
        </div>
      </article>
      <aside className="panel suggestions">
        <span className="stat-icon amber"><Sparkles size={21} /></span><h3>Próximos passos</h3>
        <p>Com base nas pendências atuais:</p>
        <ol><li>Protocole a comunicação ao CRQ.</li><li>Revise e publique os POPs obrigatórios.</li></ol>
        <button className="button primary full">Ver plano de ação</button>
      </aside>
    </section>
  );
}

export function Pops({ onUse }: { onUse: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = popTemplates.filter((pop) => pop.title.toLowerCase().includes(query.toLowerCase()) || pop.segment.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <div className="library-toolbar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título ou segmento..." /></div><button className="button secondary"><FileText size={17} /> Meus POPs</button></div>
      <section className="pop-grid">
        {filtered.map((pop, index) => (
          <article className="panel pop-card" key={pop.title}>
            <span className={`pop-icon tone-${index % 4}`}><FileText size={23} /></span>
            <span className="category">{pop.segment}</span><h3>{pop.title}</h3><p>{pop.description}</p>
            <div><span><Clock3 size={14} /> {pop.time} de leitura</span><button onClick={onUse}>Usar modelo <ArrowRight size={16} /></button></div>
          </article>
        ))}
      </section>
    </>
  );
}

export function CompanyPortal({ rts, showToast }: { rts: RT[]; showToast: (message: string) => void }) {
  const rt = rts[0];
  if (!rt) {
    return (
      <article className="panel">
        <Empty title="Nenhuma empresa vinculada" text="Cadastre uma RT para liberar o portal da empresa contratante." action={() => showToast("Abra Gestão de RTs para cadastrar a primeira empresa.")} />
      </article>
    );
  }
  return (
    <div className="company-portal">
      <section className="portal-hero">
        <div><span className="eyebrow">BIOLAB ANÁLISES</span><h2>Documentação técnica sob controle</h2><p>Acompanhe o vínculo com sua responsável técnica e acesse os documentos compartilhados.</p></div>
        <span className="portal-status"><CheckCircle2 size={19} /> Regular</span>
      </section>
      <section className="portal-grid">
        <article className="panel responsible-card"><span className="avatar large">MV</span><div><small>RESPONSÁVEL TÉCNICA</small><h3>Mariana Vieira</h3><p>Química Industrial • CRQ-IV 04289123</p></div><button className="button secondary" onClick={() => showToast("Canal de contato aberto.")}><MessageSquareText size={17} /> Enviar mensagem</button></article>
        <article className="panel"><PanelHeader title="Situação da RT" subtitle={rt.numero} /><div className="document-health"><FileCheck2 size={28} /><span><b>Documento vigente</b><small>Válido até {rt.vigencia}</small></span></div><div className="progress"><i style={{ width: "86%" }} /></div><small>214 dias restantes</small></article>
        <article className="panel span-two"><PanelHeader title="Documentos compartilhados" subtitle="Arquivos disponibilizados pela responsável técnica" action="Ver todos" /><div className="shared-docs">{["TRT vigente 2026.pdf", "Relatório técnico — Maio.pdf", "Checklist de conformidade.pdf"].map((doc) => <button key={doc}><span className="file-icon"><FileText size={19} /></span><span><b>{doc}</b><small>PDF • Atualizado recentemente</small></span><Upload size={17} /></button>)}</div></article>
      </section>
    </div>
  );
}

export function Admin() {
  return (
    <>
      <section className="stat-grid admin-stats">
        {[
          ["Usuários ativos", "1.284", "+12,4%", UsersRound],
          ["RTs cadastradas", "3.916", "+8,7%", ShieldCheck],
          ["Receita mensal", "R$ 84,2 mil", "+16,1%", Activity],
          ["Taxa de renovação", "94,6%", "+2,3%", History],
        ].map(([label, value, detail, Icon]) => <article className="stat-card" key={label as string}><div className="stat-icon blue"><Icon size={21} /></div><span>{label as string}</span><strong>{value as string}</strong><small className="positive">{detail as string} no mês</small></article>)}
      </section>
      <article className="panel table-panel">
        <PanelHeader title="Usuários recentes" subtitle="Novos cadastros e situação da conta" action="Exportar" />
        <div className="user-table">
          {[
            ["Camila Andrade", "Química", "CRQ-III 03122091", "Profissional", "Ativo"],
            ["Rafael Moura", "Técnico químico", "CRQ-IV 04411820", "Básico", "Ativo"],
            ["BioSintética Ltda.", "Empresa", "CNPJ 41.229.810/0001", "Empresa", "Pendente"],
            ["Luciana Ramos", "Química industrial", "CRQ-II 02561277", "Profissional", "Ativo"],
          ].map((user) => <div key={user[0]}><span className="avatar small">{user[0].slice(0, 2).toUpperCase()}</span><span><b>{user[0]}</b><small>{user[1]}</small></span><span><b>{user[2]}</b><small>Registro</small></span><span className="plan-chip">{user[3]}</span><span className={`status ${user[4].toLowerCase()}`}>{user[4]}</span><button className="icon-button"><MoreHorizontal size={18} /></button></div>)}
        </div>
      </article>
    </>
  );
}

export function Profile({ dark, setDark, showToast }: { dark: boolean; setDark: (value: boolean) => void; showToast: (message: string) => void }) {
  return (
    <section className="profile-grid">
      <article className="panel profile-card">
        <span className="avatar xlarge">MV</span><button className="edit-avatar"><PencilLine size={15} /></button>
        <h2>Mariana Vieira</h2><p>Química Industrial</p><span className="verified"><ShieldCheck size={15} /> CRQ verificado</span>
        <hr /><div><span>Plano atual</span><b>Profissional</b></div><small>Próxima cobrança em 2 de julho de 2026</small><button className="button secondary full">Gerenciar assinatura</button>
      </article>
      <article className="panel settings-form">
        <PanelHeader title="Dados profissionais" subtitle="Informações usadas em relatórios e documentos" />
        <div className="form-grid">
          <Field label="Nome completo"><input defaultValue="Mariana Vieira da Silva" /></Field>
          <Field label="Número CRQ"><input defaultValue="04289123" /></Field>
          <Field label="E-mail"><input defaultValue="mariana@rtquimico.com.br" /></Field>
          <Field label="Telefone"><input defaultValue="(11) 99842-1180" /></Field>
          <Field label="Regional"><select defaultValue="SP"><option value="SP">CRQ-IV • São Paulo</option></select></Field>
          <Field label="Especialidade"><input defaultValue="Química Industrial" /></Field>
        </div>
        <hr />
        <PanelHeader title="Aparência" subtitle="Personalize a experiência no painel" />
        <Toggle label="Modo escuro" description="Reduz o brilho da interface" checked={dark} onChange={() => setDark(!dark)} />
        <div className="form-actions"><button className="button primary" onClick={() => showToast("Alterações salvas.")}>Salvar alterações</button></div>
      </article>
    </section>
  );
}
