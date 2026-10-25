import { ArrowRight, Clock3, FileText, Search, Sparkles, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Field, Modal } from "./primitives";
import { supabase } from "../lib/supabase";
import { adaptarPop } from "../lib/ia";
import { popTemplates } from "../data/mock";
import type { RT } from "../types";

interface ModeloPop {
  id: string | null;
  title: string;
  segment: string;
  content: string;
  /** null = modelo do RTQuímico; preenchido = POP do escritório */
  tenant_id: string | null;
}

const leitura = (texto: string) => `${Math.max(2, Math.round(texto.split(/\s+/).length / 180))} min`;

/** Biblioteca: modelos do RTQuímico e os POPs do escritório, que nascem de um modelo (com ou sem IA). */
export function Pops({ rts, tenantId, showToast }: { rts: RT[]; tenantId?: string; showToast: (m: string) => void }) {
  const [modelos, setModelos] = useState<ModeloPop[]>(supabase ? [] : popTemplates.map((p) => ({ id: null, title: p.title, segment: p.segment, content: p.description, tenant_id: null })));
  const [query, setQuery] = useState("");
  const [soMeus, setSoMeus] = useState(false);
  const [aberto, setAberto] = useState<ModeloPop | null>(null);

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("sop_templates").select("id, title, segment, content, tenant_id").order("tenant_id", { nullsFirst: false }).order("title");
    if (error) showToast("Não consegui carregar a biblioteca.");
    setModelos(data ?? []);
  }, [showToast]);
  useEffect(() => { void carregar(); }, [carregar]);

  const termo = query.toLowerCase();
  const filtrados = modelos.filter((p) => (!soMeus || p.tenant_id) && (p.title.toLowerCase().includes(termo) || p.segment.toLowerCase().includes(termo)));
  const meus = modelos.filter((p) => p.tenant_id).length;

  const salvar = async (modelo: ModeloPop, titulo: string, texto: string) => {
    if (supabase && tenantId) {
      const meu = modelo.tenant_id === tenantId && modelo.id;
      const { error } = meu
        ? await supabase.from("sop_templates").update({ title: titulo, content: texto }).eq("id", modelo.id)
        : await supabase.from("sop_templates").insert({ tenant_id: tenantId, title: titulo, segment: modelo.segment, content: texto });
      if (error) { showToast("Não consegui salvar o POP."); return; }
      await carregar();
    }
    setAberto(null);
    showToast("POP salvo na biblioteca do escritório.");
  };

  return (
    <>
      <div className="library-toolbar">
        <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título ou segmento..." aria-label="Buscar POP" /></div>
        <button className={`button ${soMeus ? "primary" : "secondary"}`} onClick={() => setSoMeus(!soMeus)} aria-pressed={soMeus}><FileText size={17} /> Meus POPs ({meus})</button>
      </div>
      {filtrados.length === 0 && <p className="table-empty">{soMeus ? "O escritório ainda não tem POPs. Abra um modelo e salve a versão da empresa." : "Nenhum modelo com esse termo."}</p>}
      <section className="pop-grid">
        {filtrados.map((pop, index) => (
          <article className="panel pop-card" key={pop.id ?? pop.title}>
            <span className={`pop-icon tone-${index % 4}`}><FileText size={23} /></span>
            <span className="category">{pop.tenant_id ? "Do seu escritório" : pop.segment}</span><h3>{pop.title}</h3><p>{pop.content.length > 160 ? `${pop.content.slice(0, 157)}...` : pop.content}</p>
            <div><span><Clock3 size={14} /> {leitura(pop.content)} de leitura</span><button onClick={() => setAberto(pop)}>{pop.tenant_id ? "Abrir" : "Usar modelo"} <ArrowRight size={16} /></button></div>
          </article>
        ))}
      </section>
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
