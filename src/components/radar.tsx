import { CheckCheck, ExternalLink, Info, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelHeader } from "./primitives";
import { supabase } from "../lib/supabase";
import { radarDemo } from "../data/mock";
import { desde } from "../lib/format";
import { explicarRadar, type ExplicacaoRadar } from "../lib/ia";

export interface ItemRadar {
  id: string;
  source_id: string;
  title: string;
  link: string;
  summary: string | null;
  published_at: string;
}
interface Fonte {
  id: string;
  name: string;
  last_error: string | null;
}

const JANELA_DIAS = 90;
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Novidades dos órgãos (CFQ, CRQ, CONAMA, MMA, Ibama) num lugar só. O texto oficial é sempre o do link. */
export function Radar({ userId, showToast, onMudou }: { userId?: string; showToast: (m: string) => void; onMudou?: () => void }) {
  const [itens, setItens] = useState<ItemRadar[]>(supabase ? [] : radarDemo.itens);
  const [fontes, setFontes] = useState<Fonte[]>(supabase ? [] : radarDemo.fontes);
  const [lidos, setLidos] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(Boolean(supabase));
  const [atualizando, setAtualizando] = useState(false);
  const [fonte, setFonte] = useState("todas");
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [explicacoes, setExplicacoes] = useState<Record<string, { carregando?: boolean; erro?: string; resultado?: ExplicacaoRadar; aberta?: boolean }>>({});
  // O App passa uma função nova a cada render; pela ref, o carregamento não roda de novo por causa disso
  const mudou = useRef(onMudou);
  useEffect(() => { mudou.current = onMudou; }, [onMudou]);

  const carregar = useCallback(async () => {
    if (!supabase || !userId) return;
    const [i, f, l, e] = await Promise.all([
      supabase.from("regulatory_items").select("id, source_id, title, link, summary, published_at").gte("published_at", desde(JANELA_DIAS)).order("published_at", { ascending: false }).limit(300),
      supabase.from("regulatory_sources").select("id, name, last_error").eq("active", true).order("name"),
      supabase.from("regulatory_reads").select("item_id").eq("user_id", userId),
      supabase.from("ai_radar_explanations").select("item_id, result").eq("user_id", userId),
    ]);
    if (i.error || f.error || l.error) showToast("Não consegui carregar o radar.");
    setItens(i.data ?? []);
    setFontes(f.data ?? []);
    setLidos(new Set((l.data ?? []).map((r) => r.item_id)));
    setExplicacoes((atual) => {
      const novo = { ...atual };
      for (const x of e.data ?? []) novo[x.item_id] = { ...novo[x.item_id], resultado: x.result as ExplicacaoRadar };
      return novo;
    });
    setCarregando(false);
  }, [userId, showToast]);

  const atualizar = useCallback(async (forcar: boolean) => {
    if (!supabase) return;
    setAtualizando(true);
    const { error } = await supabase.functions.invoke("radar", { body: { forcar } });
    if (error && forcar) showToast("Não consegui buscar as novidades agora.");
    await carregar();
    mudou.current?.();
    setAtualizando(false);
  }, [carregar, showToast]);

  // Abre com o que já está guardado e, em segundo plano, busca o que for novo (a função respeita o intervalo)
  useEffect(() => {
    void carregar().then(() => atualizar(false));
  }, [carregar, atualizar]);

  const marcar = async (ids: string[]) => {
    const novos = ids.filter((id) => !lidos.has(id));
    if (!novos.length) return;
    setLidos((atual) => new Set([...atual, ...novos]));
    if (supabase && userId) {
      const { error } = await supabase.from("regulatory_reads").upsert(novos.map((item_id) => ({ user_id: userId, item_id })), { onConflict: "user_id,item_id", ignoreDuplicates: true });
      if (error) showToast("Não consegui marcar como lido.");
      mudou.current?.();
    }
  };

  const explicar = async (item: ItemRadar) => {
    const atual = explicacoes[item.id];
    if (atual?.resultado) { setExplicacoes((x) => ({ ...x, [item.id]: { ...atual, aberta: !atual.aberta } })); return; }
    setExplicacoes((x) => ({ ...x, [item.id]: { carregando: true } }));
    try {
      const resultado = await explicarRadar(item.id);
      setExplicacoes((x) => ({ ...x, [item.id]: { resultado, aberta: true } }));
      void marcar([item.id]);
    } catch (erro) {
      setExplicacoes((x) => ({ ...x, [item.id]: { erro: erro instanceof Error ? erro.message : "Não consegui falar com a IA agora." } }));
    }
  };

  const nomeDa = useMemo(() => new Map(fontes.map((f) => [f.id, f.name])), [fontes]);
  const visiveis = itens.filter((i) => (fonte === "todas" || i.source_id === fonte) && (!soNaoLidas || !lidos.has(i.id)));
  const naoLidas = itens.filter((i) => !lidos.has(i.id)).length;
  const comErro = fontes.filter((f) => f.last_error);

  return (
    <div className="radar">
      <div className="fin-topo">
        <div className="radar-filtros">
          <select value={fonte} onChange={(e) => setFonte(e.target.value)} aria-label="Fonte">
            <option value="todas">Todas as fontes</option>
            {fontes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <label className="check-row"><input type="checkbox" checked={soNaoLidas} onChange={(e) => setSoNaoLidas(e.target.checked)} /> Só as não lidas ({naoLidas})</label>
        </div>
        <div className="radar-acoes">
          <button className="button ghost" onClick={() => void marcar(visiveis.map((i) => i.id))} disabled={!visiveis.some((i) => !lidos.has(i.id))}><CheckCheck size={17} /> Marcar todas como lidas</button>
          <button className="button secondary" onClick={() => void atualizar(true)} disabled={atualizando}><RefreshCw size={16} /> {atualizando ? "Buscando..." : "Buscar novidades"}</button>
        </div>
      </div>

      <article className="panel table-panel">
        <PanelHeader title="Novidades dos órgãos" subtitle={`Últimos ${JANELA_DIAS} dias. Clique para abrir o texto oficial.`} />
        {carregando ? <p className="table-empty">Carregando...</p> : visiveis.length === 0 ? (
          <p className="table-empty">{itens.length === 0 ? (atualizando ? "Buscando as primeiras novidades..." : "Nenhuma novidade ainda.") : "Nada por aqui com esse filtro."}</p>
        ) : (
          <ul className="radar-lista">
            {visiveis.map((i) => {
              const lido = lidos.has(i.id);
              return (
                <li key={i.id} className={lido ? "lido" : ""}>
                  <span className="radar-meta"><b>{nomeDa.get(i.source_id) ?? i.source_id}</b> · {dataCurta(i.published_at)}{!lido && <i>Nova</i>}</span>
                  <a href={i.link} target="_blank" rel="noopener noreferrer" onClick={() => void marcar([i.id])}>{i.title} <ExternalLink size={14} /></a>
                  {i.summary && <p>{i.summary}</p>}
                  <div className="radar-botoes">
                    <button className="radar-lida" onClick={() => void explicar(i)} disabled={explicacoes[i.id]?.carregando}><Sparkles size={14} /> {explicacoes[i.id]?.carregando ? "Analisando..." : explicacoes[i.id]?.resultado ? (explicacoes[i.id]?.aberta ? "Esconder explicação" : "Ver explicação") : "Explicar com IA"}</button>
                    {!lido && <button className="radar-lida" onClick={() => void marcar([i.id])}>Marcar como lida</button>}
                  </div>
                  {explicacoes[i.id]?.erro && <p className="ia-diario-erro radar-ia" role="alert">{explicacoes[i.id]?.erro}</p>}
                  {explicacoes[i.id]?.resultado && explicacoes[i.id]?.aberta && <Explicacao e={explicacoes[i.id]!.resultado!} />}
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <p className="fin-aviso"><Info size={18} /> O RTQuímico junta as novidades publicadas pelos órgãos; o texto que vale é sempre o oficial, no link. As resoluções do CFQ vêm da página pública de resoluções; o Diário Oficial da União ainda não entra.</p>
      {comErro.length > 0 && <p className="radar-erro">Fora do ar na última busca: {comErro.map((f) => f.name).join(", ")}.</p>}
    </div>
  );
}

const ROTULO_RELEVANCIA: Record<ExplicacaoRadar["relevancia"], string> = { alta: "Afeta suas empresas", media: "Pode afetar", baixa: "Informativa", nenhuma: "Sem relação com suas empresas" };

function Explicacao({ e }: { e: ExplicacaoRadar }) {
  return (
    <div className={`radar-explicacao ${e.relevancia}`} role="status">
      <span className="radar-relevancia">{ROTULO_RELEVANCIA[e.relevancia]}</span>
      <p>{e.resumo}</p>
      {e.empresas.length > 0 && (
        <ul>{e.empresas.map((x) => <li key={x.nome}><b>{x.nome}</b>{x.motivo ? `: ${x.motivo}` : ""}</li>)}</ul>
      )}
      {e.acao_sugerida && <p className="radar-acao"><b>Próximo passo:</b> {e.acao_sugerida}</p>}
      <small>Análise da IA a partir do resumo e da página do órgão. Confira no texto oficial antes de agir.</small>
    </div>
  );
}
