import { Activity, AlertTriangle, Bell, CalendarClock, Check, CheckCircle2, ChevronRight, ClipboardCheck, FileText, MessageSquareText, Paperclip, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Empty, Field, MenuAcoes, PanelHeader } from "./primitives";
import { supabase } from "../lib/supabase";
import { MONTHS_PT, daysUntil, parseBrDate } from "../lib/format";
import { checklistItems } from "../data/mock";
import type { Alert, Page, RT, TechnicalAction } from "../types";

export function Dashboard({ rts, alerts, onNavigate, onNewRt }: { rts: RT[]; alerts: Alert[]; onNavigate: (page: Page) => void; onNewRt: () => void }) {
  const active = rts.filter((rt) => rt.status === "Ativa").length;
  const expired = rts.filter((rt) => rt.status === "Vencida").length;
  const expiringSoon = rts.filter((rt) => {
    const days = daysUntil(rt.vigencia);
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const revisadas = rts.filter((rt) => rt.progresso !== null);
  const avgCompliance = revisadas.length
    ? Math.round(revisadas.reduce((sum, rt) => sum + (rt.progresso ?? 0), 0) / revisadas.length)
    : null;
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
    { label: "Conformidade média", value: avgCompliance === null ? "—" : `${avgCompliance}%`, detail: avgCompliance === null ? "Nenhuma RT revisada ainda" : `Média de ${revisadas.length} ${revisadas.length === 1 ? "RT revisada" : "RTs revisadas"}`, icon: ClipboardCheck, tone: "green" },
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
          <PanelHeader title="Próximas renovações" subtitle="Prazos mais próximos" />
          <div className="renewal-list">
            {upcomingRenewals.map(({ rt, days }) => {
              const date = parseBrDate(rt.vigencia);
              const monthLabel = date ? MONTHS_PT[date.getMonth()] : "--";
              const isUrgent = days !== null && days <= 30;
              return (
                <div className="renewal-item" key={rt.id}>
                  <div className={`date-block ${isUrgent ? "urgent" : ""}`}><b>{rt.vigencia.slice(0, 2)}</b><span>{monthLabel}</span></div>
                  <div><b>{rt.empresa}</b><span>{rt.documento} • {days === null ? rt.vigencia : days < 0 ? `venceu há ${-days} dias` : days === 0 ? "vence hoje" : `${days} dias`}</span></div>
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

export function Responsibilities({ rts, onNew, acoes }: { rts: RT[]; onNew: () => void; acoes: AcoesRt }) {
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
        {filtered.map((rt) => <RtRow key={rt.id} rt={rt} detailed acoes={acoes} />)}
      </div>
      {filtered.length === 0 && <Empty title="Nenhuma RT encontrada" text="Ajuste a busca ou cadastre uma nova responsabilidade técnica." action={onNew} />}
    </article>
  );
}

export interface AcoesRt {
  onComunicar: (rt: RT) => void;
  onEncerrar: (rt: RT) => void;
}

function RtRow({ rt, detailed = false, acoes }: { rt: RT; detailed?: boolean; acoes?: AcoesRt }) {
  return (
    <div className={`rt-row ${detailed ? "detailed" : ""}`}>
      <div className="company-cell"><span className="company-logo">{rt.empresa.slice(0, 2).toUpperCase()}</span><span><b>{rt.empresa}</b><small>{rt.cnpj}</small></span></div>
      <div><b>{rt.documento}</b><small>{rt.numero}</small></div>
      {detailed && <div><b>{rt.vigencia}</b><small>Vigência anual</small></div>}
      <div className="compliance-cell">{rt.progresso === null ? <small className="sem-revisao">Sem revisão</small> : <><span><b>{rt.progresso}%</b></span><div className="progress"><i style={{ width: `${rt.progresso}%` }} /></div></>}</div>
      <span className={`status ${rt.status.toLowerCase()}`}>{rt.status}</span>
      {acoes ? (
        <MenuAcoes rotulo={rt.empresa} acoes={[
          { texto: "Comunicação ao CRQ", fazer: () => acoes.onComunicar(rt) },
          ...(rt.status === "Ativa" || rt.status === "Pendente" ? [{ texto: "Encerrar RT", perigo: true, fazer: () => acoes.onEncerrar(rt) }] : []),
        ]} />
      ) : <span />}
    </div>
  );
}

export function Alerts({ alerts, onMarkRead, onNavigate }: { alerts: Alert[]; onMarkRead: (ids?: Array<string | number>) => Promise<void>; onNavigate: (page: Page) => void }) {
  const unread = alerts.filter((alert) => !alert.read).length;
  const urgentes = alerts.filter((alert) => !alert.read && alert.level === "danger").length;
  return (
    <section className="content-grid alerts-layout">
      <article className="panel">
        <div className="alert-summary">
          <div><span className="stat-icon red"><Bell size={21} /></span><span><b>{unread} {unread === 1 ? "pendente" : "pendentes"}</b><small>{urgentes ? `${urgentes} ${urgentes === 1 ? "aviso urgente" : "avisos urgentes"}` : "Nada urgente agora"}</small></span></div>
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
        <PanelHeader title="Como você é avisado" subtitle="Onde os prazos aparecem" />
        <ul className="canais-aviso">
          <li><b>Aqui no painel</b><small>Comunicação ao CRQ pendente, vencimentos e o número no menu.</small></li>
          <li><b>Na sua Google Agenda</b><small>Vencimentos com lembrete 28 e 7 dias antes, honorários e carnê-leão.</small><button className="button secondary" onClick={() => onNavigate("perfil")}>Conectar ou ver a agenda</button></li>
          <li><b>Radar regulatório</b><small>Novidades do CFQ, CRQ, CONAMA, MMA e Ibama.</small><button className="button ghost" onClick={() => onNavigate("radar")}>Abrir o radar</button></li>
        </ul>
      </aside>
    </section>
  );
}

const PERIODOS: Array<[string, string, number | null]> = [["30", "Últimos 30 dias", 30], ["90", "Últimos 90 dias", 90], ["365", "Últimos 12 meses", 365], ["tudo", "Todo o histórico", null]];

export function TechnicalDiary({ actions, onNew, quimico }: { actions: TechnicalAction[]; onNew: () => void; quimico: { nome: string; crq: string | null } }) {
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("tudo");
  const dias = PERIODOS.find(([id]) => id === periodo)?.[2] ?? null;
  const limite = dias ? Date.now() - dias * 86_400_000 : null;
  const termo = busca.trim().toLowerCase();
  const visiveis = actions.filter((a) =>
    (!limite || !a.dataIso || new Date(a.dataIso).getTime() >= limite) &&
    (!termo || `${a.company} ${a.category} ${a.description}`.toLowerCase().includes(termo)));
  const ultimos30 = actions.filter((a) => a.dataIso && new Date(a.dataIso).getTime() >= Date.now() - 30 * 86_400_000).length;

  const abrirAnexo = async (path: string) => {
    if (!supabase) return;
    const aba = window.open("", "_blank");
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 120);
    if (data && aba) { aba.opener = null; aba.location.href = data.signedUrl; } else aba?.close();
  };

  // Relatório para imprimir ou salvar em PDF pelo navegador (o que está filtrado na tela)
  const exportar = () => {
    const janela = window.open("", "_blank");
    if (!janela) return;
    const d = janela.document;
    d.title = `Diário técnico - ${quimico.nome}`;
    const estilo = d.createElement("style");
    estilo.textContent = "body{font:14px/1.55 Georgia,serif;max-width:760px;margin:40px auto;color:#111}h1{font-size:22px;margin:0 0 4px}.meta{color:#555;margin:0 0 24px}article{border-top:1px solid #ccc;padding:12px 0;break-inside:avoid}article b{display:block}small{color:#555}";
    d.head.appendChild(estilo);
    const h1 = d.createElement("h1"); h1.textContent = "Diário técnico"; d.body.appendChild(h1);
    const meta = d.createElement("p"); meta.className = "meta";
    meta.textContent = `${quimico.nome}${quimico.crq ? ` · CRQ ${quimico.crq}` : ""} · ${PERIODOS.find(([id]) => id === periodo)?.[1]}${termo ? ` · busca "${busca.trim()}"` : ""} · ${visiveis.length} registros · emitido em ${new Date().toLocaleString("pt-BR")}`;
    d.body.appendChild(meta);
    for (const a of visiveis) {
      const art = d.createElement("article");
      const t = d.createElement("b"); t.textContent = `${a.date} · ${a.company} · ${a.category}`;
      const p = d.createElement("p"); p.textContent = a.description;
      art.append(t, p);
      if (a.evidence) { const ev = d.createElement("small"); ev.textContent = `Evidências: ${(a.anexos ?? []).map((x) => x.name).join(", ") || a.evidence}`; art.append(ev); }
      d.body.appendChild(art);
    }
    janela.print();
  };

  return (
    <section className="content-grid diary-layout">
      <article className="panel">
        <div className="toolbar">
          <div className="search-field"><Search size={18} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no diário..." aria-label="Buscar no diário" /></div>
          <select className="diario-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período">
            {PERIODOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
          <button className="button primary" onClick={onNew}><Plus size={17} /> Registrar</button>
        </div>
        {visiveis.length === 0 && <p className="table-empty">{actions.length ? "Nenhum registro com esse filtro." : "Nenhuma ação registrada ainda."}</p>}
        <div className="timeline">
          {visiveis.map((action) => (
            <div className="timeline-item" key={action.id}>
              <span className="timeline-icon"><Activity size={18} /></span>
              <div className="timeline-card">
                <div><span className="category">{action.category}</span><time>{action.date}</time></div>
                <h3>{action.company}</h3><p>{action.description}</p>
                {action.anexos && action.anexos.length > 0
                  ? <span className="evidence">{action.anexos.map((x) => <button key={x.path} type="button" onClick={() => void abrirAnexo(x.path)}><Paperclip size={14} /> {x.name}</button>)}</span>
                  : <span className="evidence"><Paperclip size={15} /> {action.evidence} evidência{action.evidence === 1 ? "" : "s"}</span>}
              </div>
            </div>
          ))}
        </div>
      </article>
      <aside className="panel legal-card">
        <span className="legal-icon"><ShieldCheck size={26} /></span>
        <h3>Seu histórico técnico é sua proteção</h3>
        <p>Registros consistentes demonstram diligência, orientações e decisões ao longo da atuação.</p>
        <button className="button secondary full" onClick={exportar} disabled={!visiveis.length}><FileText size={17} /> Exportar relatório (PDF)</button>
        <div className="record-count"><b>{ultimos30}</b><span>ações registradas<br />nos últimos 30 dias</span></div>
      </aside>
    </section>
  );
}

const CHECKLIST_PADRAO = [
  "Documento de RT (TRT, ART ou CRT) vigente e assinado",
  "Comunicação ao CRQ protocolada",
  "Documentos cadastrais da empresa (CNPJ, alvará e licenças)",
  "FISPQs dos produtos disponíveis para a equipe",
  "POPs disponíveis e revisados",
  "Livro de ocorrências ou diário técnico atualizado",
];
type ItemChecklist = { name: string; done: boolean; proprio?: boolean };

/** Checklist de conformidade por RT, salvo em checklists (um por RT). O % alimenta a lista de RTs e o painel. */
export function Compliance({ rts, tenantId, showToast, onSalvo }: { rts: RT[]; tenantId?: string; showToast: (message: string) => void; onSalvo: (rtId: RT["id"], progresso: number) => void }) {
  const ativas = rts.filter((rt) => rt.status !== "Cancelada");
  // As RTs podem chegar depois da tela montar (link direto): sem escolha válida, vale a primeira ativa
  const [escolhida, setRtId] = useState("");
  const rtId = ativas.some((r) => String(r.id) === escolhida) ? escolhida : ativas[0] ? String(ativas[0].id) : "";
  const [items, setItems] = useState<ItemChecklist[]>([]);
  const [revisadoEm, setRevisadoEm] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const rt = ativas.find((r) => String(r.id) === rtId);

  useEffect(() => {
    if (!rtId) return;
    if (!supabase) {
      setItems(checklistItems.map((i) => ({ ...i })));
      return;
    }
    setCarregando(true);
    void supabase.from("checklists").select("items, updated_at").eq("rt_id", rtId).maybeSingle().then(({ data }) => {
      const salvos = Array.isArray(data?.items) ? (data.items as ItemChecklist[]) : null;
      setItems(salvos ?? CHECKLIST_PADRAO.map((name) => ({ name, done: false })));
      setRevisadoEm(data?.updated_at ?? null);
      setCarregando(false);
    });
  }, [rtId]);

  if (!rt) {
    return <article className="panel"><Empty title="Nenhuma RT ativa" text="Cadastre uma responsabilidade técnica para revisar a conformidade da empresa." /></article>;
  }
  const feitos = items.filter((i) => i.done).length;
  const progress = items.length ? Math.round((feitos / items.length) * 100) : 0;
  const pendentes = items.filter((i) => !i.done);

  const salvar = async () => {
    setSalvando(true);
    try {
      if (supabase && tenantId) {
        const { data, error } = await supabase.from("checklists").upsert(
          { tenant_id: tenantId, rt_id: rt.id, status: progress === 100 ? "conforme" : "pendente", items, progress, updated_at: new Date().toISOString() },
          { onConflict: "rt_id" },
        ).select("updated_at").single();
        if (error) { showToast("Não consegui salvar a revisão."); return; }
        setRevisadoEm(data.updated_at);
      }
      onSalvo(rt.id, progress);
      showToast(`Revisão da ${rt.empresa} salva: ${progress}% conforme.`);
    } finally {
      setSalvando(false);
    }
  };

  const adicionarItem = () => {
    const nome = novoItem.trim();
    if (!nome || items.some((i) => i.name.toLowerCase() === nome.toLowerCase())) return;
    setItems((atual) => [...atual, { name: nome, done: false, proprio: true }]);
    setNovoItem("");
  };

  return (
    <section className="compliance-layout">
      <article className="panel compliance-hero">
        <label className="company-selector">
          <span className="company-logo">{rt.empresa.slice(0, 2).toUpperCase()}</span>
          <span><small>EMPRESA</small>
            <select value={rtId} onChange={(e) => setRtId(e.target.value)} aria-label="Empresa">
              {ativas.map((r) => <option key={r.id} value={String(r.id)}>{r.empresa}</option>)}
            </select>
          </span>
        </label>
        <div className="score-ring" style={{ "--score": `${progress * 3.6}deg` } as CSSProperties}><div><b>{progress}%</b><span>conforme</span></div></div>
        <div><span className="eyebrow">NÍVEL DE CONFORMIDADE</span><h2>{progress === 100 ? "Tudo em dia" : progress >= 80 ? "Ótimo andamento" : "Precisa de atenção"}</h2><p>{revisadoEm ? `Última revisão salva em ${new Date(revisadoEm).toLocaleDateString("pt-BR")}.` : "Esta empresa ainda não tem revisão salva."} Marque o que está em dia e salve.</p></div>
      </article>
      <article className="panel checklist-panel">
        <PanelHeader title="Itens da revisão" subtitle={`${feitos} de ${items.length} em dia`} />
        {carregando ? <p className="table-empty">Carregando...</p> : (
          <div className="checklist-list">
            {items.map((item, index) => (
              <label key={item.name} className={item.done ? "done" : ""}>
                <input type="checkbox" checked={item.done} onChange={() => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, done: !entry.done } : entry))} />
                <span className="custom-check">{item.done && <Check size={16} />}</span>
                <span><b>{item.name}</b><small>{item.done ? "Em dia" : "Pendente"}{item.proprio ? " · item seu" : ""}</small></span>
                {!item.done && <span className="priority">Pendente</span>}
              </label>
            ))}
          </div>
        )}
        <div className="checklist-novo">
          <input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarItem(); } }} placeholder="Acrescentar item (ex.: Licença da CETESB)" aria-label="Novo item" maxLength={140} />
          <button type="button" className="button ghost" onClick={adicionarItem} disabled={!novoItem.trim()}><Plus size={16} /> Acrescentar</button>
          <button type="button" className="button primary" onClick={salvar} disabled={salvando || carregando}>{salvando ? "Salvando..." : "Salvar revisão"}</button>
        </div>
      </article>
      <aside className="panel suggestions">
        <span className="stat-icon amber"><Sparkles size={21} /></span><h3>Próximos passos</h3>
        {pendentes.length ? (
          <>
            <p>O que falta na {rt.empresa}:</p>
            <ol>{pendentes.slice(0, 5).map((i) => <li key={i.name}>{i.name}</li>)}</ol>
          </>
        ) : <p>Nenhuma pendência nesta empresa. Revise de novo quando algo mudar (documento novo, visita, fiscalização).</p>}
      </aside>
    </section>
  );
}

const iniciaisDe = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export interface DadosPerfil {
  name: string;
  email: string;
  crq: string | null;
  crqState: string | null;
  papel: string;
  quimico: boolean;
  regime: "pf" | "pj" | null;
}

export interface PerfilEditavel {
  name: string;
  crq: string | null;
  crqState: string | null;
  regime: "pf" | "pj" | null;
}

export function Profile({ dados, onSave }: { dados: DadosPerfil; onSave: (dados: PerfilEditavel) => Promise<void> }) {
  const [salvando, setSalvando] = useState(false);
  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const texto = (campo: string) => String(form.get(campo) ?? "").trim() || null;
    setSalvando(true);
    try {
      await onSave({ name: texto("name") ?? dados.name, crq: dados.quimico ? texto("crq") : dados.crq, crqState: dados.quimico ? texto("crqState") : dados.crqState, regime: dados.quimico ? (texto("regime") as "pf" | "pj" | null) : dados.regime });
    } finally {
      setSalvando(false);
    }
  };
  return (
    <section className="profile-grid">
      <article className="panel profile-card">
        <span className="avatar xlarge">{iniciaisDe(dados.name) || "RT"}</span>
        <h2>{dados.name}</h2><p>{dados.papel}</p>
        {dados.quimico && dados.crq && <span className="verified"><ShieldCheck size={15} /> CRQ {dados.crq}</span>}
      </article>
      <form className="panel settings-form" onSubmit={salvar}>
        <PanelHeader title={dados.quimico ? "Dados profissionais" : "Dados da conta"} subtitle={dados.quimico ? "Informações usadas em relatórios e documentos" : "Nome e contato da conta"} />
        <div className="form-grid">
          <Field label="Nome completo"><input name="name" defaultValue={dados.name} required /></Field>
          <Field label="E-mail"><input defaultValue={dados.email} disabled /></Field>
          {dados.quimico && <Field label="Número CRQ"><input name="crq" defaultValue={dados.crq ?? ""} /></Field>}
          {dados.quimico && <Field label="Estado do registro"><input name="crqState" defaultValue={dados.crqState ?? ""} maxLength={2} placeholder="SP" /></Field>}
          {dados.quimico && (
            <Field label="Como você recebe pela RT">
              <select name="regime" defaultValue={dados.regime ?? ""}>
                <option value="">Ainda não informei</option>
                <option value="pf">No meu CPF (autônomo, pessoa física)</option>
                <option value="pj">Pela minha empresa (CNPJ, pessoa jurídica)</option>
              </select>
            </Field>
          )}
        </div>
        <div className="form-actions"><button className="button primary" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</button></div>
      </form>
    </section>
  );
}
