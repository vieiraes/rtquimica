import { BookMarked, ChevronDown, FileText, Search, Sparkles, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Field, Modal } from "./primitives";
import { supabase } from "../lib/supabase";
import { termoDaUrl } from "../lib/rotas";
import { adaptarPop } from "../lib/ia";
import { popTemplates } from "../data/mock";
import type { RT } from "../types";

interface ModeloPop {
  id: string | null;
  title: string;
  segment: string;
  content: string;
  summary: string | null;
  sources: string[];
  /** null = modelo do RTQuímico; preenchido = POP do escritório */
  tenant_id: string | null;
}

const leitura = (texto: string) => `${Math.max(1, Math.round(texto.split(/\s+/).length / 180))} min`;

// Uma cor por seção do caderno (como as abas do OneNote)
const COR_SECAO: Record<string, string> = {
  "Laboratório": "#2563a8", "Amostragem": "#0e7c86", "Água e efluentes": "#0a6aa8", "Resíduos": "#7a5a14",
  "Segurança": "#b42318", "Armazenamento": "#b45309", "Alimentos": "#1d7f5a",
};
const ESCRITORIO = "Do meu escritório";
const corDa = (secao: string) => (secao === ESCRITORIO ? "#6d4fb3" : COR_SECAO[secao] ?? "#4a5a6a");

/** Texto do POP em blocos: título em MAIÚSCULAS, "- " vira lista, "1. " vira passo numerado */
function TextoPop({ texto }: { texto: string }) {
  const blocos: Array<{ tipo: "h" | "p" | "ul" | "ol"; itens: string[] }> = [];
  for (const linha of texto.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const tipo = /^[A-ZÀ-Ú ]{4,}$/.test(linha) ? "h" : linha.startsWith("- ") ? "ul" : /^\d+\.\s/.test(linha) ? "ol" : "p";
    const valor = tipo === "ul" ? linha.slice(2) : tipo === "ol" ? linha.replace(/^\d+\.\s/, "") : linha;
    const ultimo = blocos[blocos.length - 1];
    if ((tipo === "ul" || tipo === "ol") && ultimo?.tipo === tipo) ultimo.itens.push(valor);
    else blocos.push({ tipo, itens: [valor] });
  }
  return (
    <div className="pop-texto">
      {blocos.map((b, i) => b.tipo === "h" ? <h4 key={i}>{b.itens[0].charAt(0) + b.itens[0].slice(1).toLowerCase()}</h4>
        : b.tipo === "ul" ? <ul key={i}>{b.itens.map((x) => <li key={x}>{x}</li>)}</ul>
        : b.tipo === "ol" ? <ol key={i}>{b.itens.map((x) => <li key={x}>{x}</li>)}</ol>
        : <p key={i}>{b.itens[0]}</p>)}
    </div>
  );
}

/** Biblioteca em formato de caderno: seções à esquerda e POPs empilhados que se abrem no lugar. */
export function Pops({ rts, tenantId, showToast }: { rts: RT[]; tenantId?: string; showToast: (m: string) => void }) {
  const [modelos, setModelos] = useState<ModeloPop[]>(supabase ? [] : popTemplates.map((p) => ({ id: null, title: p.title, segment: p.segment, content: p.description, summary: p.description, sources: [], tenant_id: null })));
  const [query, setQuery] = useState(termoDaUrl);
  const [secao, setSecao] = useState("Todas");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [aberto, setAberto] = useState<ModeloPop | null>(null);

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("sop_templates").select("id, title, segment, content, summary, sources, tenant_id").order("segment").order("title");
    if (error) showToast("Não consegui carregar a biblioteca.");
    setModelos((data ?? []) as ModeloPop[]);
  }, [showToast]);
  useEffect(() => { void carregar(); }, [carregar]);

  const secaoDe = (p: ModeloPop) => (p.tenant_id ? ESCRITORIO : p.segment);
  const secoes = [...new Set(modelos.filter((p) => !p.tenant_id).map((p) => p.segment))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const contar = (nome: string) => modelos.filter((p) => secaoDe(p) === nome).length;
  const termo = query.trim().toLowerCase();
  const filtrados = modelos.filter((p) => (secao === "Todas" || secaoDe(p) === secao) &&
    (!termo || `${p.title} ${p.segment} ${p.summary ?? ""} ${p.content}`.toLowerCase().includes(termo)));

  const salvar = async (modelo: ModeloPop, titulo: string, texto: string) => {
    if (supabase && tenantId) {
      const meu = modelo.tenant_id === tenantId && modelo.id;
      const { error } = meu
        ? await supabase.from("sop_templates").update({ title: titulo, content: texto }).eq("id", modelo.id)
        : await supabase.from("sop_templates").insert({ tenant_id: tenantId, title: titulo, segment: modelo.segment, content: texto, summary: modelo.summary, sources: modelo.sources });
      if (error) { showToast("Não consegui salvar o POP."); return; }
      await carregar();
    }
    setAberto(null);
    showToast(`POP salvo em "${ESCRITORIO}".`);
  };

  const abaSecao = (nome: string, total: number) => (
    <button key={nome} className={secao === nome ? "active" : ""} onClick={() => { setSecao(nome); setExpandido(null); }} style={{ "--cor-secao": nome === "Todas" ? "var(--primary)" : corDa(nome) } as CSSProperties}>
      <i />{nome}<b>{total}</b>
    </button>
  );

  return (
    <>
      <section className="panel pop-como-usar">
        <h2>Como usar a biblioteca</h2>
        <ol>
          <li><b>Escolha a seção</b> à esquerda e clique num POP para ler o procedimento inteiro.</li>
          <li><b>Confira as fontes</b> no fim de cada POP: são as normas oficiais em que o modelo se baseia.</li>
          <li><b>Clique em "Usar este modelo"</b>, escolha a empresa e gere o rascunho com IA ou edite à mão. O POP salvo vai para "{ESCRITORIO}".</li>
        </ol>
        <p>Os modelos são do RTQuímico, escritos a partir das normas citadas. Não são documentos oficiais: adapte à empresa e confira a versão vigente de cada norma antes de assinar.</p>
      </section>
      <div className="pop-caderno">
        <nav className="pop-secoes" aria-label="Seções da biblioteca">
          {abaSecao("Todas", modelos.length)}
          {secoes.map((n) => abaSecao(n, contar(n)))}
          <hr />
          {abaSecao(ESCRITORIO, contar(ESCRITORIO))}
        </nav>
        <div className="pop-paginas">
          <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar POP por nome, assunto ou norma..." aria-label="Buscar POP" /></div>
          {filtrados.length === 0 && <p className="table-empty">{secao === ESCRITORIO ? "O escritório ainda não tem POPs. Abra um modelo, clique em \"Usar este modelo\" e salve a versão da empresa." : "Nenhum POP com esse termo."}</p>}
          <div className="pop-pilha">
            {filtrados.map((pop) => {
              const chave = pop.id ?? pop.title;
              const aberta = expandido === chave;
              const nomeSecao = secaoDe(pop);
              return (
                <article key={chave} className={`pop-folha ${aberta ? "aberta" : ""}`} style={{ "--cor-secao": corDa(nomeSecao) } as CSSProperties}>
                  <button className="pop-folha-topo" onClick={() => setExpandido(aberta ? null : chave)} aria-expanded={aberta}>
                    <span className="pop-folha-secao">{nomeSecao}</span>
                    <b>{pop.title}</b>
                    <small>{pop.summary ?? pop.content.split("\n").find((l) => l.trim() && !/^[A-ZÀ-Ú ]{4,}$/.test(l.trim()))}</small>
                    <span className="pop-folha-meta">{pop.sources.length > 0 && <><BookMarked size={14} /> {pop.sources.length} {pop.sources.length === 1 ? "fonte oficial" : "fontes oficiais"} · </>}{leitura(pop.content)} de leitura</span>
                    <ChevronDown size={20} className="pop-folha-seta" />
                  </button>
                  {aberta && (
                    <div className="pop-folha-corpo">
                      <TextoPop texto={pop.content} />
                      {pop.sources.length > 0 && (
                        <div className="pop-fontes">
                          <h4><BookMarked size={16} /> Fontes de referência</h4>
                          <ul>{pop.sources.map((f) => <li key={f}>{f}</li>)}</ul>
                          <small>Modelo de referência do RTQuímico, não é documento oficial. Confira a versão vigente de cada norma.</small>
                        </div>
                      )}
                      <div className="pop-folha-acoes">
                        <button className="button primary" onClick={() => setAberto(pop)}>{pop.tenant_id ? <><FileText size={16} /> Abrir e editar</> : <><Sparkles size={16} /> Usar este modelo</>}</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
      {aberto && <PopModal modelo={aberto} rts={rts} onClose={() => setAberto(null)} onSave={(t, x) => salvar(aberto, t, x)} />}
    </>
  );
}

function PopModal({ modelo, rts, onClose, onSave }: { modelo: ModeloPop; rts: RT[]; onClose: () => void; onSave: (titulo: string, texto: string) => Promise<void> }) {
  const doEscritorio = Boolean(modelo.tenant_id);
  const [titulo, setTitulo] = useState(modelo.title);
  const [texto, setTexto] = useState(modelo.content);
  const [rtId, setRtId] = useState(rts[0] ? String(rts[0].id) : "");
  const [detalhes, setDetalhes] = useState("");
  const [ia, setIa] = useState<{ carregando: boolean; erro: string; original: { titulo: string; texto: string } | null; pontos: string[] }>({ carregando: false, erro: "", original: null, pontos: [] });
  const [salvando, setSalvando] = useState(false);

  const gerar = async () => {
    if (!modelo.id || !rtId) return;
    setIa((x) => ({ ...x, carregando: true, erro: "" }));
    try {
      const r = await adaptarPop({ template_id: modelo.id, rt_id: rtId, detalhes });
      setIa({ carregando: false, erro: "", original: ia.original ?? { titulo, texto }, pontos: r.pontos_a_confirmar });
      setTitulo(r.titulo);
      setTexto(r.texto);
    } catch (erro) {
      setIa((x) => ({ ...x, carregando: false, erro: erro instanceof Error ? erro.message : "Não consegui falar com a IA agora." }));
    }
  };
  const desfazer = () => {
    if (ia.original) { setTitulo(ia.original.titulo); setTexto(ia.original.texto); }
    setIa({ carregando: false, erro: "", original: null, pontos: [] });
  };
  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (!titulo.trim() || !texto.trim()) return;
    setSalvando(true);
    try { await onSave(titulo.trim(), texto.trim()); } finally { setSalvando(false); }
  };

  return (
    <Modal title={doEscritorio ? "POP do escritório" : "Personalizar POP"} subtitle={doEscritorio ? "Revise e atualize o procedimento." : "Escolha a empresa e gere o rascunho com IA, ou edite à mão."} onClose={onClose}>
      <form onSubmit={enviar}>
        {!doEscritorio && (
          <div className="pop-ia">
            <div className="form-grid">
              <Field label="Empresa">
                <select value={rtId} onChange={(e) => setRtId(e.target.value)} disabled={!rts.length}>
                  {rts.length ? rts.map((r) => <option key={r.id} value={String(r.id)}>{r.empresa}</option>) : <option>Cadastre uma RT primeiro</option>}
                </select>
              </Field>
              <Field label="Detalhes da operação (opcional)"><input value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Ex.: pHmetro de bancada, coleta 2x por semana" maxLength={3000} /></Field>
            </div>
            <div className="ia-diario">
              <button type="button" className="button secondary" onClick={gerar} disabled={ia.carregando || !rtId || !modelo.id}><Sparkles size={16} /> {ia.carregando ? "Gerando..." : ia.original ? "Gerar de novo" : "Gerar rascunho com IA"}</button>
              {ia.original && <button type="button" className="button ghost" onClick={desfazer}><Undo2 size={16} /> Voltar ao modelo</button>}
            </div>
            {ia.erro && <p className="ia-diario-erro" role="alert">{ia.erro}</p>}
            {ia.original && (
              <div className="ia-diario-aviso" role="status">
                <b>Rascunho da IA: revise antes de salvar.</b> O POP vai com a sua responsabilidade técnica.
                {ia.pontos.length > 0 && <>{" "}Confira estes pontos:<ul>{ia.pontos.map((p) => <li key={p}>{p}</li>)}</ul></>}
              </div>
            )}
          </div>
        )}
        <Field label="Título"><input value={titulo} onChange={(e) => setTitulo(e.target.value)} required /></Field>
        <Field label="Conteúdo"><textarea className="editor" rows={14} value={texto} onChange={(e) => setTexto(e.target.value)} required /></Field>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar na biblioteca"}</button></footer>
      </form>
    </Modal>
  );
}
