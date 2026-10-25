import { Activity, AlertTriangle, Bell, CalendarClock, Camera, Check, CheckCircle2, ClipboardCheck, FileText, MessageSquareText, Paperclip, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Avatar, Empty, Field, MenuAcoes, PanelHeader } from "./primitives";
import { supabase } from "../lib/supabase";
import { termoDaUrl } from "../lib/rotas";
import { MONTHS_PT, daysUntil, parseBrDate } from "../lib/format";
import { checklistItems } from "../data/mock";
import { LIMITE_RTS } from "../lib/limites";
import { diasSemComunicar, ETAPAS_CRQ, etapaCrq, transicaoCrq, type EtapaCrq, type TipoComunicacao } from "../lib/comunicacao-crq";
import type { Alert, Page, RT, TechnicalAction } from "../types";

const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ResumoFinanceiro { recebidoMes: number; aReceberMes: number; atrasados: number; atrasadoValor: number; recebidoAno: number }

/** Honorários do ano corrente para o dashboard (só leitura) */
function useResumoFinanceiro() {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const agora = new Date();
    const hoje = agora.toLocaleDateString("sv-SE");
    const inicioMes = hoje.slice(0, 8) + "01";
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toLocaleDateString("sv-SE");
    void supabase
      .from("financial_entries")
      .select("amount_cents, due_date, paid_on")
      .eq("kind", "receita")
      .or(`paid_on.gte.${agora.getFullYear()}-01-01,paid_on.is.null`)
      .then(({ data }) => {
        const r: ResumoFinanceiro = { recebidoMes: 0, aReceberMes: 0, atrasados: 0, atrasadoValor: 0, recebidoAno: 0 };
        for (const e of data ?? []) {
          if (e.paid_on) {
            r.recebidoAno += e.amount_cents;
            if (e.paid_on >= inicioMes) r.recebidoMes += e.amount_cents;
          } else if (e.due_date < hoje) {
            r.atrasados += 1;
            r.atrasadoValor += e.amount_cents;
          } else if (e.due_date <= fimMes) r.aReceberMes += e.amount_cents;
        }
        setResumo(r);
      });
  }, []);
  return resumo;
}

/** Só informação: as ações ficam em cada menu (RT, Diário, Financeiro...). */
export function Dashboard({ rts, alerts, actions }: { rts: RT[]; alerts: Alert[]; actions: TechnicalAction[] }) {
  const financeiro = useResumoFinanceiro();
  const contar = (status: RT["status"]) => rts.filter((rt) => rt.status === status).length;
  const active = contar("Ativa");
  const pending = contar("Pendente");
  const expired = contar("Vencida");
  const vagas = Math.max(0, LIMITE_RTS - active);
  const vigentes = rts.filter((rt) => rt.status === "Ativa" || rt.status === "Pendente");
  const expiringSoon = vigentes.filter((rt) => {
    const days = daysUntil(rt.vigencia);
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const revisadas = vigentes.filter((rt) => rt.progresso !== null);
  const semRevisao = vigentes.length - revisadas.length;
  const avgCompliance = revisadas.length
    ? Math.round(revisadas.reduce((sum, rt) => sum + (rt.progresso ?? 0), 0) / revisadas.length)
    : null;
  const pendentes = alerts.filter((a) => !a.read);
  const semCrq = rts.filter((rt) => etapaCrq(rt) === "comunicar-inicio" || etapaCrq(rt) === "comunicar-encerramento");
  const priorityAlerts = pendentes.filter((a) => a.level === "danger").length;
  const upcomingRenewals = vigentes
    .map((rt) => ({ rt, days: daysUntil(rt.vigencia) }))
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    })
    .slice(0, 5);

  // Diário: registros recentes e RTs ativas sem nenhum registro nos últimos 30 dias
  const limite30 = Date.now() - 30 * 86_400_000;
  const recentes = actions.filter((a) => a.dataIso && new Date(a.dataIso).getTime() >= limite30);
  const comRegistro = new Set(recentes.map((a) => String(a.rtId ?? a.company)));
  const semRegistro = vigentes.filter((rt) => !comRegistro.has(String(rt.id)) && !comRegistro.has(rt.empresa));
  const ultimo = [...actions].sort((a, b) => (b.dataIso ?? "").localeCompare(a.dataIso ?? ""))[0];

  // Fatias reais do gráfico: ativas, pendentes, vencidas e vagas livres
  const fatias = [[active, "var(--green)"], [pending, "var(--amber)"], [expired, "var(--red)"], [vagas, "#dce5eb"]] as const;
  const total = fatias.reduce((s, [n]) => s + n, 0) || 1;
  let acumulado = 0;
  const gradiente = fatias.map(([n, cor]) => {
    const de = (acumulado / total) * 100;
    acumulado += n;
    return `${cor} ${de}% ${(acumulado / total) * 100}%`;
  }).join(", ");

  const stats = [
    { label: "RTs ativas", value: `${active} de ${LIMITE_RTS}`, detail: vagas ? `Você ainda pode assumir ${vagas} ${vagas === 1 ? "empresa" : "empresas"}` : "Limite do CRQ atingido", icon: ShieldCheck, tone: "blue" },
    { label: "Vencem em 30 dias", value: expiringSoon, detail: expired ? `${expired} ${expired === 1 ? "já vencida" : "já vencidas"}` : "Nenhuma vencida", icon: CalendarClock, tone: "amber" },
    { label: "Alertas pendentes", value: pendentes.length, detail: priorityAlerts ? `${priorityAlerts} ${priorityAlerts === 1 ? "urgente" : "urgentes"}` : "Nada urgente", icon: Bell, tone: "red" },
    { label: "Conformidade média", value: avgCompliance === null ? "—" : `${avgCompliance}%`, detail: avgCompliance === null ? "Nenhuma RT revisada ainda" : semRevisao ? `${semRevisao} ${semRevisao === 1 ? "RT sem revisão" : "RTs sem revisão"}` : "Todas as RTs revisadas", icon: ClipboardCheck, tone: "green" },
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
          <PanelHeader title="Panorama das RTs" subtitle="Situação atual da sua carteira" />
          <div className="overview-chart">
            <div className="donut" style={{ background: `conic-gradient(${gradiente})` }}><div><b>{active + pending + expired}</b><span>{active + pending + expired === 1 ? "RT na carteira" : "RTs na carteira"}</span></div></div>
            <div className="legend">
              <div><i className="dot active" /><span>Ativas</span><b>{active}</b></div>
              <div><i className="dot pending" /><span>Pendentes</span><b>{pending}</b></div>
              <div><i className="dot expired" /><span>Vencidas</span><b>{expired}</b></div>
              <div><i className="dot available" /><span>Vagas livres</span><b>{vagas}</b></div>
            </div>
          </div>
        </article>
        <article className="panel">
          <PanelHeader title="Próximos vencimentos" subtitle="RTs ativas e pendentes" />
          <div className="renewal-list">
            {upcomingRenewals.length === 0 && <p className="dash-vazio">Nenhuma RT em andamento.</p>}
            {upcomingRenewals.map(({ rt, days }) => {
              const date = parseBrDate(rt.vigencia);
              const monthLabel = date ? MONTHS_PT[date.getMonth()] : "--";
              const isUrgent = days !== null && days <= 30;
              return (
                <div className="renewal-item" key={rt.id}>
                  <div className={`date-block ${isUrgent ? "urgent" : ""}`}><b>{rt.vigencia.slice(0, 2)}</b><span>{monthLabel}</span></div>
                  <div><b>{rt.empresa}</b><span>{rt.documento} • {days === null ? rt.vigencia : days < 0 ? `venceu há ${-days} dias` : days === 0 ? "vence hoje" : `faltam ${days} dias`}</span></div>
                </div>
              );
            })}
          </div>
        </article>
        <article className="panel">
          <PanelHeader title="Honorários" subtitle={`${new Date().toLocaleDateString("pt-BR", { month: "long" })} de ${new Date().getFullYear()}`} />
          <dl className="dash-numeros">
            <div><dt>Recebido no mês</dt><dd>{financeiro ? reais(financeiro.recebidoMes) : "—"}</dd></div>
            <div><dt>A receber até o fim do mês</dt><dd>{financeiro ? reais(financeiro.aReceberMes) : "—"}</dd></div>
            <div className={financeiro?.atrasados ? "alerta" : ""}><dt>Em atraso</dt><dd>{financeiro ? (financeiro.atrasados ? `${reais(financeiro.atrasadoValor)} (${financeiro.atrasados})` : "Nenhum") : "—"}</dd></div>
            <div><dt>Recebido no ano</dt><dd>{financeiro ? reais(financeiro.recebidoAno) : "—"}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <PanelHeader title="Diário técnico" subtitle="Últimos 30 dias" />
          <dl className="dash-numeros">
            <div><dt>Registros</dt><dd>{recentes.length}</dd></div>
            <div><dt>Último registro</dt><dd>{ultimo ? `${ultimo.company} · ${ultimo.dataIso ? new Date(ultimo.dataIso).toLocaleDateString("pt-BR") : ultimo.date}` : "Nenhum ainda"}</dd></div>
            <div className={semRegistro.length ? "alerta" : ""}><dt>RTs sem registro no período</dt><dd>{semRegistro.length}</dd></div>
          </dl>
          {semRegistro.length > 0 && <p className="dash-dica"><FileText size={15} /> {semRegistro.slice(0, 3).map((rt) => rt.empresa).join(", ")}{semRegistro.length > 3 ? ` e mais ${semRegistro.length - 3}` : ""}</p>}
        </article>
        <article className="panel attention-panel">
          <PanelHeader title="Comunicação ao CRQ" subtitle="RTs com comunicação pendente" />
          <div className="attention-list">
            {semCrq.length === 0 && <p className="dash-vazio">Todas as RTs estão comunicadas ao CRQ.</p>}
            {semCrq.slice(0, 4).map((rt) => {
              const dias = diasSemComunicar(rt);
              return <div key={rt.id}><span className="alert-symbol danger"><Send size={17} /></span><span><b>{rt.empresa}</b><small>{etapaCrq(rt) === "comunicar-inicio" ? `Comunicar início${dias !== null && dias >= 1 ? `: atrasada há ${dias} ${dias === 1 ? "dia" : "dias"}` : " (até 24 h após o cadastro)"}` : "Comunicar encerramento"}</small></span></div>;
            })}
          </div>
        </article>
      </section>
    </>
  );
}

export function Responsibilities({ rts, onNew, acoes }: { rts: RT[]; onNew: () => void; acoes: AcoesRt }) {
  const [query, setQuery] = useState(termoDaUrl);
  const [filter, setFilter] = useState("Todas");
  const [visao, setVisao] = useState<"lista" | "quadro">("lista");
  const filtered = rts.filter((rt) => (filter === "Todas" || rt.status === filter) && rt.empresa.toLowerCase().includes(query.toLowerCase()));
  const pendentesCrq = rts.filter((rt) => etapaCrq(rt) === "comunicar-inicio" || etapaCrq(rt) === "comunicar-encerramento").length;
  return (
    <>
      <div className="rt-visoes" role="tablist" aria-label="Como ver as RTs">
        <button role="tab" aria-selected={visao === "lista"} className={visao === "lista" ? "active" : ""} onClick={() => setVisao("lista")}><ShieldCheck size={17} /> Lista</button>
        <button role="tab" aria-selected={visao === "quadro"} className={visao === "quadro" ? "active" : ""} onClick={() => setVisao("quadro")}><Send size={17} /> Quadro do CRQ{pendentesCrq > 0 && <b>{pendentesCrq}</b>}</button>
      </div>
      {visao === "quadro" ? <QuadroCrq rts={rts} acoes={acoes} /> : (
        <article className="panel table-panel">
          <div className="toolbar">
            <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa..." /></div>
            <div className="filter-tabs">{["Todas", "Ativa", "Pendente", "Vencida"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
            <button className="button primary so-celular" onClick={onNew}><Plus size={17} /> Nova RT</button>
          </div>
          <div className="rt-table">
            <div className="table-head"><span>Empresa</span><span>Documento</span><span>Vigência</span><span>Conformidade</span><span>Status</span><span /></div>
            {filtered.map((rt) => <RtRow key={rt.id} rt={rt} detailed acoes={acoes} />)}
          </div>
          {filtered.length === 0 && <Empty title="Nenhuma RT encontrada" text={rts.length ? "Ajuste a busca ou o filtro." : "Cadastre a primeira RT em \"Nova RT\", no topo da página."} />}
        </article>
      )}
    </>
  );
}

/** Kanban da comunicação ao CRQ: arrastar o cartão entre colunas faz a mudança de verdade (como as transições do Jira).
 *  No celular (sem arrastar), o menu ⋮ do cartão tem "Mover para...". */
function QuadroCrq({ rts, acoes }: { rts: RT[]; acoes: AcoesRt }) {
  const [arrastando, setArrastando] = useState<RT | null>(null);
  const [sobre, setSobre] = useState<EtapaCrq | null>(null);

  const mover = (rt: RT, para: EtapaCrq) => {
    const t = transicaoCrq(etapaCrq(rt), para);
    if (!t) return;
    if (t.tipo === "comunicar") acoes.onComunicar(rt, t.comunicacao);
    else if (t.tipo === "desfazer") acoes.onDesfazerCrq(rt, t.comunicacao);
    else if (t.tipo === "encerrar") acoes.onEncerrar(rt, false);
    else acoes.onAviso(t.motivo);
  };
  const destinoOk = (para: EtapaCrq) => {
    if (!arrastando) return null;
    const t = transicaoCrq(etapaCrq(arrastando), para);
    return t === null ? null : t.tipo !== "bloqueada";
  };

  return (
    <section className="quadro-crq">
      {ETAPAS_CRQ.map((etapa) => {
        const cartoes = rts.filter((rt) => etapaCrq(rt) === etapa.id);
        const pendente = etapa.id === "comunicar-inicio" || etapa.id === "comunicar-encerramento";
        const ok = destinoOk(etapa.id);
        return (
          <div key={etapa.id} data-etapa={etapa.id}
            className={`quadro-coluna ${pendente ? "pendente" : "feito"} ${arrastando && sobre === etapa.id ? (ok ? "pode-soltar" : ok === false ? "nao-pode" : "") : ""} ${arrastando && ok ? "destino" : ""}`}
            onDragOver={(e) => { if (arrastando) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setSobre(etapa.id); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSobre((s) => (s === etapa.id ? null : s)); }}
            onDrop={(e) => { e.preventDefault(); if (arrastando) mover(arrastando, etapa.id); setArrastando(null); setSobre(null); }}>
            <header><b>{etapa.titulo}</b><span>{cartoes.length}</span><small>{etapa.dica}</small></header>
            {cartoes.length === 0 && <p className="quadro-vazio">{arrastando && ok ? "Solte aqui" : pendente ? "Nada pendente aqui." : "Nenhuma RT nesta etapa."}</p>}
            {cartoes.map((rt) => {
              const dias = etapa.id === "comunicar-inicio" ? diasSemComunicar(rt) : null;
              const em = etapa.id === "inicio-comunicado" ? rt.crqInicioEm : rt.crqFimEm;
              const protocolo = etapa.id === "inicio-comunicado" ? rt.crqInicioProtocolo : rt.crqFimProtocolo;
              const destinos = ETAPAS_CRQ.filter((d) => { const t = transicaoCrq(etapa.id, d.id); return t && t.tipo !== "bloqueada"; });
              return (
                <article key={rt.id} className={`quadro-cartao ${arrastando?.id === rt.id ? "arrastando" : ""}`} draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(rt.id)); setArrastando(rt); }}
                  onDragEnd={() => { setArrastando(null); setSobre(null); }}>
                  <div className="quadro-cartao-topo">
                    <b>{rt.empresa}</b>
                    <MenuAcoes rotulo={rt.empresa} acoes={destinos.map((d) => ({ texto: `Mover para "${d.titulo}"`, perigo: d.id === "comunicar-encerramento", fazer: () => mover(rt, d.id) }))} />
                  </div>
                  <small>{rt.documento} {rt.numero} · {rt.regional}</small>
                  {pendente ? (
                    <>
                      {dias !== null && <span className={`quadro-prazo ${dias >= 1 ? "atrasado" : ""}`}>{dias >= 1 ? `Atrasada: cadastrada há ${dias} ${dias === 1 ? "dia" : "dias"}` : "Prazo: até 24 h após o cadastro"}</span>}
                      <button className="button primary" onClick={() => acoes.onComunicar(rt, etapa.id === "comunicar-inicio" ? "inicio" : "encerramento")}><Send size={15} /> Comunicar ao CRQ</button>
                    </>
                  ) : (
                    <span className="quadro-feito"><CheckCircle2 size={15} /> {em ? `Comunicada em ${new Date(em).toLocaleDateString("pt-BR")}` : "Comunicada"}{protocolo ? ` · protocolo ${protocolo}` : ""}</span>
                  )}
                </article>
              );
            })}
          </div>
        );
      })}
      <p className="quadro-ajuda">Arraste o cartão para a coluna da próxima etapa. No celular, use o menu ⋮ do cartão e escolha "Mover para".</p>
    </section>
  );
}

export interface AcoesRt {
  onComunicar: (rt: RT, tipo?: TipoComunicacao) => void;
  /** abrirComunicacao = false quando vem do quadro (o cartão só muda de coluna) */
  onEncerrar: (rt: RT, abrirComunicacao?: boolean) => void;
  onDesfazerCrq: (rt: RT, tipo: TipoComunicacao) => void;
  onAviso: (mensagem: string) => void;
}

function RtRow({ rt, detailed = false, acoes }: { rt: RT; detailed?: boolean; acoes?: AcoesRt }) {
  return (
    <div className={`rt-row ${detailed ? "detailed" : ""}`}>
      <div className="company-cell"><span className="company-logo">{rt.empresa.slice(0, 2).toUpperCase()}</span><span><b>{rt.empresa}</b><small>{rt.cnpj}</small></span></div>
      <div><b>{rt.documento}</b><small>{rt.numero}</small></div>
      {detailed && <div><b>{rt.vigencia}</b><small>Vigência anual</small></div>}
      <div className="compliance-cell">{rt.progresso === null ? <small className="sem-revisao">Sem revisão</small> : <><span><b>{rt.progresso}%</b></span><div className="progress"><i style={{ width: `${rt.progresso}%` }} /></div></>}</div>
      <span className="status-celula"><span className={`status ${rt.status.toLowerCase()}`}>{rt.status}</span>{detailed && <CrqChip rt={rt} />}</span>
      {acoes ? (
        <MenuAcoes rotulo={rt.empresa} acoes={[
          { texto: "Comunicação ao CRQ", fazer: () => acoes.onComunicar(rt) },
          ...(rt.crqInicioEm && rt.status !== "Cancelada" ? [{ texto: "Desfazer comunicação do início", fazer: () => acoes.onDesfazerCrq(rt, "inicio") }] : []),
          ...(rt.crqFimEm && rt.status === "Cancelada" ? [{ texto: "Desfazer comunicação do encerramento", fazer: () => acoes.onDesfazerCrq(rt, "encerramento") }] : []),
          ...(rt.status === "Ativa" || rt.status === "Pendente" ? [{ texto: "Encerrar RT", perigo: true, fazer: () => acoes.onEncerrar(rt) }] : []),
        ]} />
      ) : <span />}
    </div>
  );
}

/** Situação da comunicação ao CRQ na linha da RT */
function CrqChip({ rt }: { rt: RT }) {
  const etapa = etapaCrq(rt);
  const pendente = etapa === "comunicar-inicio" || etapa === "comunicar-encerramento";
  return <small className={`crq-chip ${pendente ? "pendente" : ""}`}>{pendente ? (etapa === "comunicar-inicio" ? "CRQ: comunicar início" : "CRQ: comunicar encerramento") : "CRQ: comunicado"}</small>;
}

export function Alerts({ alerts, onMarkRead, onNavigate }: { alerts: Alert[]; onMarkRead: (ids?: Array<string | number>) => Promise<void>; onNavigate: (page: Page) => void }) {
  const unread = alerts.filter((alert) => !alert.read).length;
  const urgentes = alerts.filter((alert) => !alert.read && alert.level === "danger").length;
  return (
    <section className="content-grid alerts-layout">
      <article className="panel">
        <div className="alert-summary">
          <div><span className="stat-icon red"><Bell size={21} /></span><span><b>{unread} {unread === 1 ? "pendente" : "pendentes"}</b><small>{urgentes ? `${urgentes} ${urgentes === 1 ? "aviso urgente" : "avisos urgentes"}` : "Nada urgente agora"}</small></span></div>
          <button className="button secondary" onClick={() => void onMarkRead()} disabled={unread === 0}><Check size={17} /> Marcar todos como lidos</button>
        </div>
        <div className="full-alert-list">
          {alerts.map((alert) => (
            <button key={alert.id} className={alert.read ? "read" : ""} disabled={alert.read} title={alert.read ? "" : "Clique para marcar como lido"} onClick={() => void onMarkRead([alert.id])}>
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
  const [busca, setBusca] = useState(termoDaUrl);
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
          <button className="button primary so-celular" onClick={onNew}><Plus size={17} /> Registrar ação</button>
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
                  : action.evidence > 0 && <span className="evidence"><Paperclip size={15} /> {action.evidence} {action.evidence === 1 ? "evidência" : "evidências"}</span>}
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
    return <article className="panel"><Empty title="Nenhuma RT ativa" text={'Cadastre uma RT (menu RT, botão "Nova RT") para revisar a conformidade da empresa.'} /></article>;
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
                <span><b>{item.name}</b>{(item.done || item.proprio) && <small>{item.done ? "Em dia" : ""}{item.done && item.proprio ? " · " : ""}{item.proprio ? "item seu" : ""}</small>}</span>
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
        <span className="stat-icon amber"><ClipboardCheck size={21} /></span><h3>Como revisar</h3>
        <p>{pendentes.length ? `Faltam ${pendentes.length} ${pendentes.length === 1 ? "item" : "itens"} na ${rt.empresa}.` : `Nenhuma pendência na ${rt.empresa}.`}</p>
        <ol>
          <li>Marque o que está em dia.</li>
          <li>Acrescente itens próprios da empresa, se precisar.</li>
          <li>Clique em "Salvar revisão": a porcentagem vai para a lista de RTs e para o Dashboard.</li>
        </ol>
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
  foto: string | null;
}

export interface PerfilEditavel {
  name: string;
  crq: string | null;
  crqState: string | null;
  regime: "pf" | "pj" | null;
}

export function Profile({ dados, onSave, onFoto }: { dados: DadosPerfil; onSave: (dados: PerfilEditavel) => Promise<void>; onFoto: (arquivo: File | null) => Promise<void> }) {
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const trocarFoto = async (arquivo: File | null) => {
    setEnviandoFoto(true);
    await onFoto(arquivo);
    setEnviandoFoto(false);
  };
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
        <Avatar className="xlarge" foto={dados.foto} iniciais={iniciaisDe(dados.name) || "RT"} />
        <h2>{dados.name}</h2><p>{dados.papel}</p>
        {dados.quimico && dados.crq && <span className="verified"><ShieldCheck size={15} /> CRQ {dados.crq}</span>}
        <div className="foto-acoes">
          <label className={`button secondary ${enviandoFoto ? "disabled" : ""}`}>
            <Camera size={16} /> {enviandoFoto ? "Enviando..." : dados.foto ? "Trocar foto" : "Adicionar foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={enviandoFoto} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void trocarFoto(f); }} />
          </label>
          {dados.foto && !enviandoFoto && <button type="button" className="button ghost" onClick={() => void trocarFoto(null)}>Remover foto</button>}
          <small>JPG, PNG ou WebP. A foto é cortada em quadrado, pelo centro.</small>
        </div>
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
