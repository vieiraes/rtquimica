// Busca geral do topo: procura em tudo o que a pessoa pode ver (RTs, diário, POPs, financeiro, equipe, alertas e páginas)
// e mostra os resultados numa lista logo abaixo, enquanto digita. Clicar abre a página já filtrada pelo termo (?q=).
import { Bell, BookOpen, Building2, FileText, LayoutDashboard, Search, ShieldCheck, UsersRound, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { paginasDoPapel, ehQuimico, type Papel } from "../lib/papeis";
import type { Alert, Page, RT, TechnicalAction } from "../types";

type Grupo = "Páginas" | "RTs" | "Diário técnico" | "POPs" | "Financeiro" | "Pessoas" | "Escritórios" | "Alertas";
interface Resultado { grupo: Grupo; titulo: string; detalhe: string; busca: string; pagina: Page; termo?: string }

const ICONE: Record<Grupo, typeof Search> = {
  "Páginas": LayoutDashboard, "RTs": ShieldCheck, "Diário técnico": BookOpen, "POPs": FileText,
  "Financeiro": Wallet, "Pessoas": UsersRound, "Escritórios": Building2, "Alertas": Bell,
};
const ORDEM: Grupo[] = ["RTs", "Pessoas", "Escritórios", "Diário técnico", "POPs", "Financeiro", "Alertas", "Páginas"];

const PAGINAS: Array<{ pagina: Page; titulo: string; detalhe: string; extra?: string }> = [
  { pagina: "dashboard", titulo: "Dashboard", detalhe: "Panorama das RTs, honorários e alertas", extra: "inicio painel visao geral" },
  { pagina: "rts", titulo: "RT", detalhe: "Responsabilidades técnicas e Quadro do CRQ", extra: "responsabilidades nova rt quadro crq comunicacao kanban" },
  { pagina: "acoes", titulo: "Diário técnico", detalhe: "Registros de visitas, orientações e evidências", extra: "registrar acao relatorio pdf" },
  { pagina: "checklist", titulo: "Conformidade", detalhe: "Checklist por empresa", extra: "checklist" },
  { pagina: "pops", titulo: "Biblioteca de POPs", detalhe: "Modelos de procedimento com fontes oficiais", extra: "procedimento operacional padrao" },
  { pagina: "financeiro", titulo: "Financeiro", detalhe: "Honorários, despesas, carnê-leão e imposto de renda", extra: "honorarios despesas carne leao imposto de renda ir darf receita" },
  { pagina: "radar", titulo: "Radar regulatório", detalhe: "Novidades do CFQ, CRQ, CONAMA, MMA e Ibama", extra: "noticias normas" },
  { pagina: "alertas", titulo: "Alertas", detalhe: "Todos os avisos", extra: "notificacoes avisos" },
  { pagina: "equipe", titulo: "Equipe", detalhe: "Pessoas do escritório e convites", extra: "convidar quimico" },
  { pagina: "assinatura", titulo: "Assinatura", detalhe: "Plano do escritório e pagamento", extra: "plano pagamento kiwify" },
  { pagina: "perfil", titulo: "Perfil e configurações", detalhe: "Seus dados, foto e Google Agenda", extra: "configuracoes foto google agenda crq" },
  { pagina: "plataforma", titulo: "Usuários da plataforma", detalhe: "Químicos e escritórios", extra: "usuarios escritorios" },
];

/** Minúsculas e sem acento, para "química" achar "quimica" */
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const soDigitos = (t: string) => t.replace(/\D/g, "");

function combina(r: Resultado, termos: string[], digitos: string) {
  const alvo = normalizar(`${r.titulo} ${r.detalhe} ${r.busca}`);
  if (termos.every((t) => alvo.includes(t))) return true;
  // CNPJ e CRQ com ou sem pontuação
  return digitos.length >= 3 && soDigitos(`${r.titulo} ${r.detalhe} ${r.busca}`).includes(digitos);
}

/** Destaca o trecho digitado no título */
function Destaque({ texto, termo }: { texto: string; termo: string }): ReactNode {
  const t = normalizar(termo.trim().split(/\s+/)[0] ?? "");
  const i = t ? normalizar(texto).indexOf(t) : -1;
  if (i < 0) return texto;
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + t.length)}</mark>{texto.slice(i + t.length)}</>;
}

interface Extras { pops: Resultado[]; financeiro: Resultado[]; pessoas: Resultado[]; escritorios: Resultado[] }
const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** O que não está carregado no App: busca uma vez quando a caixa recebe o foco */
async function carregarExtras(papel: Papel | null, tenantId?: string): Promise<Extras> {
  const vazio: Extras = { pops: [], financeiro: [], pessoas: [], escritorios: [] };
  if (!supabase) return vazio;
  if (papel === "superadmin") {
    const [perfis, tenants] = await Promise.all([
      supabase.from("profiles").select("name, email, crq_number, crq_state, tenants(name)"),
      supabase.from("tenants").select("name, plan"),
    ]);
    return {
      ...vazio,
      pessoas: (perfis.data ?? []).map((p) => ({ grupo: "Pessoas" as const, titulo: p.name, detalhe: `${p.email}${p.crq_number ? ` · CRQ ${p.crq_number}${p.crq_state ? `/${p.crq_state}` : ""}` : ""}`, busca: String((p.tenants as { name?: string } | null)?.name ?? ""), pagina: "plataforma" as const, termo: p.email })),
      escritorios: (tenants.data ?? []).map((t) => ({ grupo: "Escritórios" as const, titulo: t.name, detalhe: `Plano ${t.plan ?? "—"}`, busca: "", pagina: "plataforma" as const, termo: t.name })),
    };
  }
  const [pops, fin, pessoas] = await Promise.all([
    supabase.from("sop_templates").select("title, segment, summary, tenant_id"),
    supabase.from("financial_entries").select("kind, description, payer_name, category, amount_cents, due_date"),
    tenantId ? supabase.from("profiles").select("name, email, crq_number, crq_state").eq("tenant_id", tenantId) : Promise.resolve({ data: [] as Array<{ name: string; email: string; crq_number: string | null; crq_state: string | null }> }),
  ]);
  return {
    ...vazio,
    pops: (pops.data ?? []).map((p) => ({ grupo: "POPs" as const, titulo: p.title, detalhe: p.tenant_id ? "Do meu escritório" : p.segment, busca: p.summary ?? "", pagina: "pops" as const, termo: p.title })),
    financeiro: (fin.data ?? []).map((f) => ({ grupo: "Financeiro" as const, titulo: f.description, detalhe: `${f.kind === "receita" ? "Honorário" : "Despesa"} · ${reais(f.amount_cents)} · ${new Date(`${f.due_date}T12:00:00`).toLocaleDateString("pt-BR")}`, busca: `${f.payer_name ?? ""} ${f.category ?? ""}`, pagina: "financeiro" as const })),
    pessoas: (pessoas.data ?? []).map((p) => ({ grupo: "Pessoas" as const, titulo: p.name, detalhe: `${p.email}${p.crq_number ? ` · CRQ ${p.crq_number}${p.crq_state ? `/${p.crq_state}` : ""}` : ""}`, busca: "", pagina: "equipe" as const })),
  };
}

export function BuscaGeral({ papel, tenantId, rts, actions, alerts, onAbrir }: {
  papel: Papel | null;
  tenantId?: string;
  rts: RT[];
  actions: TechnicalAction[];
  alerts: Alert[];
  onAbrir: (pagina: Page, termo?: string) => void;
}) {
  const [termo, setTermo] = useState("");
  const [aberta, setAberta] = useState(false);
  const [noCelular, setNoCelular] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [extras, setExtras] = useState<Extras | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const carregado = useRef(false);

  const aoFocar = () => {
    setAberta(true);
    if (carregado.current) return;
    carregado.current = true;
    void carregarExtras(papel, tenantId).then(setExtras);
  };

  useEffect(() => {
    if (!aberta) return;
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) { setAberta(false); setNoCelular(false); } };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberta]);

  const permitidas = paginasDoPapel(papel);
  const base = useMemo<Resultado[]>(() => {
    const paginas = PAGINAS.filter((p) => permitidas.includes(p.pagina)).map((p) => ({ grupo: "Páginas" as const, titulo: p.titulo, detalhe: p.detalhe, busca: p.extra ?? "", pagina: p.pagina }));
    if (!ehQuimico(papel)) return paginas;
    return [
      ...paginas,
      ...rts.map((rt) => ({ grupo: "RTs" as const, titulo: rt.empresa, detalhe: `${rt.documento} ${rt.numero} · ${rt.status} · CNPJ ${rt.cnpj}`, busca: `${rt.razaoSocial ?? ""} ${rt.cidade ?? ""} ${rt.uf ?? ""} ${rt.regional}`, pagina: "rts" as const, termo: rt.empresa })),
      ...actions.map((a) => ({ grupo: "Diário técnico" as const, titulo: `${a.company}: ${a.category}`, detalhe: a.description.length > 90 ? `${a.description.slice(0, 87)}...` : a.description, busca: a.description, pagina: "acoes" as const, termo: a.company })),
      ...alerts.map((a) => ({ grupo: "Alertas" as const, titulo: a.title, detalhe: a.text, busca: "", pagina: "alertas" as const })),
    ];
  }, [papel, permitidas, rts, actions, alerts]);

  const resultados = useMemo(() => {
    const limpo = termo.trim();
    if (!limpo) return [];
    const termos = normalizar(limpo).split(/\s+/);
    const digitos = soDigitos(limpo);
    const todos = [...base, ...(extras ? [...extras.pops, ...extras.financeiro, ...extras.pessoas, ...extras.escritorios] : [])];
    const achados = todos.filter((r) => combina(r, termos, digitos));
    // No máximo 5 por grupo, na ordem dos grupos
    return ORDEM.flatMap((g) => achados.filter((r) => r.grupo === g).slice(0, 5));
  }, [termo, base, extras]);

  useEffect(() => { setAtivo(0); }, [termo]);

  const abrir = (r: Resultado) => {
    setAberta(false);
    setNoCelular(false);
    setTermo("");
    campo.current?.blur();
    onAbrir(r.pagina, r.termo);
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && resultados[ativo]) { e.preventDefault(); abrir(resultados[ativo]); }
    else if (e.key === "Escape") { setAberta(false); setNoCelular(false); campo.current?.blur(); }
  };

  const placeholder = papel === "superadmin" ? "Buscar usuário, e-mail, CRQ ou escritório..." : "Buscar RT, CNPJ, pessoa, CRQ, POP, honorário...";
  let indice = -1;
  return (
    <div className={`busca-geral ${noCelular ? "no-celular" : ""}`} ref={caixa}>
      <button className="icon-button busca-geral-abrir" onClick={() => { setNoCelular(true); setTimeout(() => campo.current?.focus(), 0); }} aria-label="Buscar"><Search size={19} /></button>
      <div className="global-search">
        <Search size={18} />
        <input ref={campo} value={termo} onChange={(e) => { setTermo(e.target.value); setAberta(true); }} onFocus={aoFocar} onKeyDown={teclas}
          placeholder={placeholder} aria-label="Buscar em tudo" role="combobox" aria-expanded={aberta && termo.trim().length > 0} aria-controls="busca-geral-lista" autoComplete="off" />
        {(termo || noCelular) && <button className="busca-geral-limpar" onClick={() => { setTermo(""); if (noCelular) { setNoCelular(false); setAberta(false); } else campo.current?.focus(); }} aria-label="Limpar busca"><X size={16} /></button>}
      </div>
      {aberta && termo.trim().length > 0 && (
        <div className="busca-geral-lista" id="busca-geral-lista" role="listbox">
          {resultados.length === 0 && <p className="busca-geral-vazio">Nada encontrado para "{termo.trim()}".{!extras && " Buscando no restante..."}</p>}
          {ORDEM.filter((g) => resultados.some((r) => r.grupo === g)).map((g) => {
            const Icone = ICONE[g];
            return (
              <div key={g} className="busca-geral-grupo">
                <small><Icone size={14} /> {g}</small>
                {resultados.filter((r) => r.grupo === g).map((r) => {
                  indice += 1;
                  const meu = indice;
                  return (
                    <button key={`${g}-${r.titulo}-${r.detalhe}`} role="option" aria-selected={meu === ativo} className={meu === ativo ? "ativo" : ""} onMouseEnter={() => setAtivo(meu)} onClick={() => abrir(r)}>
                      <b><Destaque texto={r.titulo} termo={termo} /></b>
                      <span>{r.detalhe}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {resultados.length > 0 && <footer>Setas ↑ ↓ para escolher · Enter para abrir</footer>}
        </div>
      )}
    </div>
  );
}
