import { Building2, Search, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Field, MenuAcoes, Modal, PanelHeader } from "./primitives";
import { chamarFuncao } from "../lib/funcoes";
import { supabase } from "../lib/supabase";
import { papelDe, ROTULO_PAPEL, type Papel } from "../lib/papeis";
import { usuariosDemo } from "../data/mock";

export interface UsuarioPlataforma {
  id: string;
  name: string;
  email: string;
  role: string;
  crq_number: string | null;
  crq_state: string | null;
  created_at: string;
  active?: boolean;
  tenant_id: string | null;
  tenants: { name: string; plan: string } | null;
}

interface Escritorio {
  id: string;
  name: string;
  plan: string;
}

const ROTULO_PLANO: Record<string, string> = { basic: "Básico", pro: "Profissional", enterprise: "Empresarial" };

const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const rotuloPapel = (role: string) => { const papel = papelDe(role); return papel ? ROTULO_PAPEL[papel] : role; };
const registro = (u: UsuarioPlataforma) => (u.crq_number ? `CRQ${u.crq_state ? `-${u.crq_state}` : ""} ${u.crq_number}` : "Sem CRQ");

type Filtro = "todos" | "quimicos" | "gestao";
const FILTROS: Array<[Filtro, string, (p: Papel | null) => boolean]> = [
  ["todos", "Todos", () => true],
  ["quimicos", "Químicos", (p) => p === "tenant_admin" || p === "tenant_member"],
  ["gestao", "Gestão", (p) => p === "superadmin"],
];

type Acao = { texto: string; perigo?: boolean; fazer: () => void };

function TabelaUsuarios({ usuarios, mostrarEscritorio, acoesDe }: { usuarios: UsuarioPlataforma[]; mostrarEscritorio: boolean; acoesDe?: (u: UsuarioPlataforma) => Acao[] }) {
  if (usuarios.length === 0) return <p className="table-empty">Nenhum usuário encontrado.</p>;
  return (
    <div className="user-table">
      {usuarios.map((u) => (
        <div key={u.id}>
          <span className="avatar small">{iniciais(u.name)}</span>
          <span><b>{u.name}</b><small>{u.email}</small></span>
          <span><b>{rotuloPapel(u.role)}</b><small>{registro(u)}</small></span>
          {mostrarEscritorio ? <span><b>{u.tenants?.name ?? "—"}</b><small>{u.tenants ? `Plano ${ROTULO_PLANO[u.tenants.plan] ?? u.tenants.plan}` : "Sem escritório"}</small></span> : <span />}
          <span className="user-date">{u.active === false ? <i className="status vencida">Acesso desativado</i> : `Desde ${dataCurta(u.created_at)}`}</span>
          {acoesDe && acoesDe(u).length > 0 ? <MenuAcoes rotulo={u.name} acoes={acoesDe(u)} /> : <span />}
        </div>
      ))}
    </div>
  );
}

/** Superadmin: quem usa a plataforma, escritório por escritório. Não mostra o conteúdo das RTs, só contagens. */
export function Plataforma({ showToast }: { showToast: (m: string) => void }) {
  const [usuarios, setUsuarios] = useState<UsuarioPlataforma[]>(supabase ? [] : usuariosDemo);
  const [escritorios, setEscritorios] = useState<Escritorio[]>([]);
  const [rtsPorEscritorio, setRtsPorEscritorio] = useState<Map<string, { total: number; ativas: number }>>(new Map());
  const [carregando, setCarregando] = useState(Boolean(supabase));
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const client = supabase;
    {
      const [perfis, tenants, rts] = await Promise.all([
        client.from("profiles").select("id, name, email, role, crq_number, crq_state, created_at, active, tenant_id, tenants(name, plan)").order("created_at", { ascending: false }),
        client.from("tenants").select("id, name, plan").order("name"),
        client.from("technical_responsibilities").select("tenant_id, status"),
      ]);
      const falha = perfis.error ?? tenants.error ?? rts.error;
      if (falha) {
        console.error(falha);
        setErro("Não consegui carregar os usuários da plataforma.");
      } else {
        setUsuarios((perfis.data ?? []) as unknown as UsuarioPlataforma[]);
        setEscritorios(tenants.data ?? []);
        const contagem = new Map<string, { total: number; ativas: number }>();
        for (const rt of rts.data ?? []) {
          const c = contagem.get(rt.tenant_id) ?? { total: 0, ativas: 0 };
          c.total += 1;
          if (rt.status === "active") c.ativas += 1;
          contagem.set(rt.tenant_id, c);
        }
        setRtsPorEscritorio(contagem);
      }
      setCarregando(false);
    }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  const agir = async (corpo: Record<string, unknown>, ok: string) => {
    try {
      await chamarFuncao("equipe", corpo);
      showToast(ok);
      await carregar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Não consegui concluir.");
    }
  };
  // Gestão do produto: papel e acesso dos químicos (a gestão e as empresas ficam de fora)
  const acoesDe = (u: UsuarioPlataforma): Acao[] => {
    const p = papelDe(u.role);
    if (p !== "tenant_admin" && p !== "tenant_member") return [];
    return [
      p === "tenant_member"
        ? { texto: "Tornar titular do escritório", fazer: () => void agir({ acao: "mudar_papel", user_id: u.id, papel: "tenant_admin" }, `${u.name} agora é titular.`) }
        : { texto: "Tornar químico da equipe", fazer: () => void agir({ acao: "mudar_papel", user_id: u.id, papel: "tenant_member" }, `${u.name} agora é da equipe.`) },
      u.active === false
        ? { texto: "Reativar acesso", fazer: () => void agir({ acao: "ativar", user_id: u.id }, `Acesso de ${u.name} reativado.`) }
        : { texto: "Desativar acesso", perigo: true, fazer: () => window.confirm(`Desativar o acesso de ${u.name}? Os dados ficam guardados.`) && void agir({ acao: "desativar", user_id: u.id }, `Acesso de ${u.name} desativado.`) },
    ];
  };

  const visiveis = useMemo(() => {
    const teste = FILTROS.find(([id]) => id === filtro)![2];
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => teste(papelDe(u.role)) && (!termo || `${u.name} ${u.email}`.toLowerCase().includes(termo)));
  }, [usuarios, filtro, busca]);

  // Escritório = tenant com algum químico (o tenant da própria gestão não conta)
  const escritoriosDeRt = escritorios.filter((e) => usuarios.some((u) => u.tenant_id === e.id && papelDe(u.role) !== "superadmin"));
  const quimicos = usuarios.filter((u) => FILTROS[1][2](papelDe(u.role))).length;
  const rtsAtivas = [...rtsPorEscritorio.values()].reduce((soma, c) => soma + c.ativas, 0);

  return (
    <>
      {carregando && <div className="loading-strip">Carregando usuários da plataforma...</div>}
      {erro && <div className="loading-strip erro">{erro}</div>}
      <section className="stat-grid">
        {([
          ["Usuários", usuarios.length, "contas na plataforma", UsersRound],
          ["Químicos", quimicos, "titulares e equipe", ShieldCheck],
          ["Escritórios de RT", escritoriosDeRt.length, "assinaturas", Building2],
          ["RTs ativas", rtsAtivas, "em todos os escritórios", ShieldCheck],
        ] as const).map(([rotulo, valor, detalhe, Icone]) => (
          <article className="stat-card" key={rotulo}><div className="stat-icon blue"><Icone size={21} /></div><span>{rotulo}</span><strong>{valor}</strong><small>{detalhe}</small></article>
        ))}
      </section>

      <article className="panel table-panel">
        <PanelHeader title="Usuários da plataforma" subtitle="Quem tem conta no RTQuímico, com papel e escritório" />
        <div className="toolbar">
          <label className="search-field"><Search size={17} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar usuário" /></label>
          <div className="filter-tabs">
            {FILTROS.map(([id, rotulo]) => <button key={id} className={filtro === id ? "active" : ""} onClick={() => setFiltro(id)}>{rotulo}</button>)}
          </div>
        </div>
        <TabelaUsuarios usuarios={visiveis} mostrarEscritorio acoesDe={supabase ? acoesDe : undefined} />
      </article>

      {escritoriosDeRt.length > 0 && (
        <article className="panel table-panel">
          <PanelHeader title="Escritórios" subtitle="Assinaturas, usuários e RTs de cada escritório" />
          <div className="office-table">
            {escritoriosDeRt.map((e) => {
              const rts = rtsPorEscritorio.get(e.id) ?? { total: 0, ativas: 0 };
              return (
                <div key={e.id}>
                  <span className="avatar small">{iniciais(e.name)}</span>
                  <b>{e.name}</b>
                  <span className="plan-chip">{ROTULO_PLANO[e.plan] ?? e.plan}</span>
                  <span>{plural(usuarios.filter((u) => u.tenant_id === e.id).length, "usuário", "usuários")}</span>
                  <span>{rts.ativas} de {rts.total} RTs ativas</span>
                </div>
              );
            })}
          </div>
        </article>
      )}
    </>
  );
}

/** Titular do escritório: as pessoas do workspace, o convite de químico e o acesso de quem é da equipe. */
export function Equipe({ tenantId, euId, showToast }: { tenantId?: string; euId?: string; showToast: (m: string) => void }) {
  const [pessoas, setPessoas] = useState<UsuarioPlataforma[]>(supabase ? [] : usuariosDemo.filter((u) => u.tenant_id === "demo"));
  const [carregando, setCarregando] = useState(Boolean(supabase && tenantId));
  const [convidando, setConvidando] = useState(false);

  const carregar = useCallback(async () => {
    if (!supabase || !tenantId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, crq_number, crq_state, created_at, active, tenant_id")
      .eq("tenant_id", tenantId)
      .order("created_at");
    if (error) console.error(error);
    setPessoas(((data ?? []) as Omit<UsuarioPlataforma, "tenants">[]).map((p) => ({ ...p, tenants: null })));
    setCarregando(false);
  }, [tenantId]);
  useEffect(() => { void carregar(); }, [carregar]);

  const agir = async (corpo: Record<string, unknown>, ok: string) => {
    try {
      await chamarFuncao("equipe", corpo);
      showToast(ok);
      await carregar();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Não consegui concluir.");
    }
  };
  const acoesDe = (u: UsuarioPlataforma): Acao[] =>
    u.role !== "tenant_member" || u.id === euId ? [] : [
      u.active === false
        ? { texto: "Reativar acesso", fazer: () => void agir({ acao: "ativar", user_id: u.id }, `Acesso de ${u.name} reativado.`) }
        : { texto: "Desativar acesso", perigo: true, fazer: () => window.confirm(`Desativar o acesso de ${u.name}? Os registros dela ficam guardados.`) && void agir({ acao: "desativar", user_id: u.id }, `Acesso de ${u.name} desativado.`) },
    ];

  return (
    <article className="panel table-panel">
      <header className="panel-header">
        <div><h2>Pessoas do escritório</h2><p>Químicos com acesso ao workspace. O financeiro de cada um é pessoal.</p></div>
        {supabase && <button className="button primary" onClick={() => setConvidando(true)}><UserPlus size={17} /> Convidar químico</button>}
      </header>
      {carregando ? <p className="table-empty">Carregando...</p> : <TabelaUsuarios usuarios={pessoas} mostrarEscritorio={false} acoesDe={supabase ? acoesDe : undefined} />}
      <p className="table-note">Quem você convida entra como químico da equipe: vê e registra as RTs do escritório, sem a tela Equipe. Para tornar alguém titular, fale com o suporte do RTQuímico.</p>
      {convidando && <ConviteModal onClose={() => setConvidando(false)} onConvidar={async (nome, email) => {
        try {
          const r = await chamarFuncao<{ emailEnviado: boolean }>("equipe", { acao: "convidar", nome, email });
          showToast(r.emailEnviado ? `Convite enviado para ${email}.` : `Acesso criado, mas o e-mail não saiu. Peça para ${nome} usar "Esqueci a senha".`);
          setConvidando(false);
          await carregar();
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Não consegui convidar.");
        }
      }} />}
    </article>
  );
}

function ConviteModal({ onClose, onConvidar }: { onClose: () => void; onConvidar: (nome: string, email: string) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try { await onConvidar(nome.trim(), email.trim()); } finally { setEnviando(false); }
  };
  return (
    <Modal title="Convidar químico" subtitle="A pessoa recebe um e-mail para criar a senha e já entra no seu escritório." onClose={onClose}>
      <form onSubmit={enviar}>
        <div className="form-grid">
          <Field label="Nome completo"><input value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} /></Field>
          <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        </div>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={enviando}>{enviando ? "Enviando..." : "Enviar convite"}</button></footer>
      </form>
    </Modal>
  );
}

const OPERACOES_IA: Record<string, string> = { diario_redigir: "Diário técnico", radar_explicar: "Radar explicado", pop_adaptar: "POP adaptado" };

interface ConfigIa {
  enabled: boolean;
  model: string;
  calls_per_month: number;
  calls_per_minute: number;
  monthly_token_budget: number;
}

/** Superadmin: uso da IA no mês e os controles (ligar/desligar, limites por químico, teto de tokens). */
export function GestaoIa({ showToast }: { showToast: (m: string) => void }) {
  const [cfg, setCfg] = useState<ConfigIa | null>(null);
  const [uso, setUso] = useState<Array<{ operation: string; status: string; total_tokens: number }>>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [c, u] = await Promise.all([
      supabase.from("ai_config").select("enabled, model, calls_per_month, calls_per_minute, monthly_token_budget").eq("id", 1).single(),
      supabase.from("ai_usage_log").select("operation, status, total_tokens").gte("created_at", inicioMes),
    ]);
    if (c.data) setCfg(c.data);
    setUso(u.data ?? []);
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  if (!supabase || !cfg) return null;
  const ok = uso.filter((u) => u.status === "ok");
  const tokens = uso.reduce((t, u) => t + (u.total_tokens ?? 0), 0);
  const porOperacao = Object.entries(OPERACOES_IA).map(([id, nome]) => {
    const da = uso.filter((u) => u.operation === id);
    return { nome, pedidos: da.filter((u) => u.status === "ok").length, falhas: da.filter((u) => u.status === "erro").length, tokens: da.reduce((t, u) => t + (u.total_tokens ?? 0), 0) };
  });
  const pctTeto = Math.min(100, Math.round((tokens / cfg.monthly_token_budget) * 100));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const { error } = await supabase!.from("ai_config").update({ enabled: cfg.enabled, calls_per_month: cfg.calls_per_month, calls_per_minute: cfg.calls_per_minute, monthly_token_budget: cfg.monthly_token_budget, updated_at: new Date().toISOString() }).eq("id", 1);
    setSalvando(false);
    showToast(error ? "Não consegui salvar a configuração da IA." : "Configuração da IA salva.");
    if (!error) await carregar();
  };
  const numero = (campo: keyof ConfigIa) => (e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, [campo]: Math.max(0, Number(e.target.value) || 0) });

  return (
    <article className="panel table-panel">
      <PanelHeader title="IA (DeepSeek)" subtitle={`Uso deste mês e controles · modelo ${cfg.model}`} />
      <div className="ia-gestao">
        <div className="ia-gestao-numeros">
          <span><b>{ok.length}</b> pedidos atendidos</span>
          <span><b>{uso.length - ok.length - uso.filter((u) => u.status === "pendente").length}</b> falhas (não contam no limite)</span>
          <span><b>{tokens.toLocaleString("pt-BR")}</b> de {cfg.monthly_token_budget.toLocaleString("pt-BR")} tokens ({pctTeto}% do teto)</span>
        </div>
        <div className="progress"><i style={{ width: `${pctTeto}%` }} /></div>
        <div className="office-table">
          {porOperacao.map((o) => <div key={o.nome}><span /><b>{o.nome}</b><span className="plan-chip">{o.pedidos} pedidos</span><span>{o.falhas} falhas</span><span>{o.tokens.toLocaleString("pt-BR")} tokens</span></div>)}
        </div>
        <form className="form-grid" onSubmit={salvar}>
          <label className="check-row"><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> IA ligada para todos os químicos</label>
          <Field label="Pedidos por químico no mês"><input type="number" min={0} value={cfg.calls_per_month} onChange={numero("calls_per_month")} /></Field>
          <Field label="Pedidos por químico por minuto"><input type="number" min={1} value={cfg.calls_per_minute} onChange={numero("calls_per_minute")} /></Field>
          <Field label="Teto de tokens no mês (todos juntos)"><input type="number" min={1} value={cfg.monthly_token_budget} onChange={numero("monthly_token_budget")} /></Field>
          <div className="form-actions"><button className="button primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar configuração"}</button></div>
        </form>
      </div>
    </article>
  );
}
