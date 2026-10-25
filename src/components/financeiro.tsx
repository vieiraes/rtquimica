import { AlertTriangle, CalendarClock, Download, ScanText, FileText, Info, Paperclip, Plus, Receipt, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Field, MenuAcoes, Modal, PanelHeader } from "./primitives";
import { supabase } from "../lib/supabase";
import { calcularCarneLeao, DESCONTO_SIMPLIFICADO, vencimentoDarf } from "../lib/impostos";
import { lancamentosDemo } from "../data/mock";
import type { RT } from "../types";

export interface Lancamento {
  id: string;
  kind: "receita" | "despesa";
  rtId: string | null;
  payerType: "pf" | "pj" | null;
  payerName: string | null;
  payerDocument: string | null;
  category: string | null;
  deductible: boolean;
  description: string;
  valor: number;
  retido: number;
  vencimento: string; // AAAA-MM-DD
  pagoEm: string | null;
  comprovante: string | null;
}

interface Linha {
  id: string;
  kind: string;
  rt_id: string | null;
  payer_type: "pf" | "pj" | null;
  payer_name: string | null;
  payer_document: string | null;
  category: string | null;
  deductible: boolean;
  description: string;
  amount_cents: number;
  withheld_tax_cents: number;
  due_date: string;
  paid_on: string | null;
  receipt_path: string | null;
}

const daLinha = (l: Linha): Lancamento => ({
  id: l.id, kind: l.kind as Lancamento["kind"], rtId: l.rt_id, payerType: l.payer_type, payerName: l.payer_name, payerDocument: l.payer_document,
  category: l.category, deductible: l.deductible, description: l.description, valor: l.amount_cents / 100, retido: l.withheld_tax_cents / 100,
  vencimento: l.due_date, pagoEm: l.paid_on, comprovante: l.receipt_path,
});

// Livro-caixa: só despesa necessária à atividade e paga no ano. Locomoção não entra (salvo representante comercial).
const CATEGORIAS: Record<string, { rotulo: string; dedutivel: boolean }> = {
  anuidade_crq: { rotulo: "Anuidade do CRQ", dedutivel: true },
  curso: { rotulo: "Cursos e congressos", dedutivel: true },
  material: { rotulo: "Material de consumo", dedutivel: true },
  escritorio: { rotulo: "Aluguel e contas do escritório", dedutivel: true },
  contador: { rotulo: "Contador", dedutivel: true },
  deslocamento: { rotulo: "Deslocamento e combustível", dedutivel: false },
  outros: { rotulo: "Outros", dedutivel: false },
};

const reais = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (iso: string) => iso.split("-").reverse().join("/");
const hojeIso = () => new Date().toLocaleDateString("sv-SE");
const mesAtual = () => hojeIso().slice(0, 7);
const lerValor = (texto: string) => Number(texto.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) || 0;
const nomeDoMes = (mes: string) => { const [a, m] = mes.split("-").map(Number); const t = new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); };

type Situacao = "recebido" | "aberto" | "atrasado";
const situacao = (l: Lancamento): Situacao => (l.pagoEm ? "recebido" : l.vencimento < hojeIso() ? "atrasado" : "aberto");
const ROTULO_SITUACAO: Record<Situacao, string> = { recebido: "Recebido", aberto: "Em aberto", atrasado: "Em atraso" };

function NovoLancamento({ kind, rts, onClose, onSave }: { kind: Lancamento["kind"]; rts: RT[]; onClose: () => void; onSave: (l: Omit<Lancamento, "id" | "comprovante">, arquivo: File | null) => Promise<void> }) {
  const receita = kind === "receita";
  const [rtId, setRtId] = useState<string>(rts[0] ? String(rts[0].id) : "outro");
  const [payerType, setPayerType] = useState<"pf" | "pj">(rts[0] ? "pj" : "pf");
  const [categoria, setCategoria] = useState("anuidade_crq");
  const [dedutivel, setDedutivel] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [ocr, setOcr] = useState<{ lendo: boolean; mensagem: string }>({ lendo: false, mensagem: "" });

  // Foto do comprovante → OCR no navegador → preenche os campos (o químico confere antes de salvar)
  const lerFoto = async () => {
    if (!foto || !formRef.current) return;
    setOcr({ lendo: true, mensagem: "" });
    try {
      const { lerComprovante, ocrDaImagem } = await import("../lib/ocr-comprovante");
      const dados = lerComprovante(await ocrDaImagem(foto));
      const campo = (nome: string) => formRef.current!.elements.namedItem(nome) as HTMLInputElement | null;
      const achados: string[] = [];
      if (dados.valor !== null && campo("valor")) { campo("valor")!.value = dados.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); achados.push("valor"); }
      if (dados.data && campo("data")) { campo("data")!.value = dados.data; achados.push("data"); }
      if (dados.descricao && campo("descricao") && !campo("descricao")!.value) { campo("descricao")!.value = dados.descricao; achados.push("descrição"); }
      if (dados.categoria && CATEGORIAS[dados.categoria]) { setCategoria(dados.categoria); setDedutivel(CATEGORIAS[dados.categoria].dedutivel); achados.push("categoria"); }
      setOcr({ lendo: false, mensagem: achados.length ? `Preenchido pela foto: ${achados.join(", ")}. Confira antes de salvar.` : "Não consegui ler valores nesta foto. Preencha à mão." });
    } catch (erro) {
      console.error(erro);
      setOcr({ lendo: false, mensagem: "Não consegui ler a foto agora (a leitura precisa de internet na primeira vez). Preencha à mão." });
    }
  };
  const rt = rts.find((r) => String(r.id) === rtId);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const texto = (c: string) => String(f.get(c) ?? "").trim();
    const valor = lerValor(texto("valor"));
    if (valor <= 0) return;
    const data = texto("data");
    const arquivo = f.get("comprovante");
    setSalvando(true);
    try {
      await onSave({
        kind,
        rtId: receita && rt ? String(rt.id) : null,
        payerType: receita ? payerType : null,
        payerName: receita ? (rt ? rt.empresa : texto("pagador") || null) : null,
        payerDocument: receita ? (rt ? rt.cnpj : texto("documento") || null) : null,
        category: receita ? null : categoria,
        deductible: receita ? false : dedutivel,
        description: texto("descricao") || (receita ? "Honorários de RT" : CATEGORIAS[categoria].rotulo),
        valor,
        retido: receita && payerType === "pj" ? lerValor(texto("retido")) : 0,
        vencimento: data,
        pagoEm: receita ? (f.get("recebido") ? data : null) : data,
      }, arquivo instanceof File && arquivo.size > 0 ? arquivo : null);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal title={receita ? "Novo honorário" : "Nova despesa"} subtitle={receita ? "O que uma empresa paga (ou vai pagar) pela sua RT" : "Gasto da atividade, com o comprovante para o livro-caixa"} onClose={onClose}>
      <form ref={formRef} onSubmit={enviar}>
        <div className="form-grid">
          {receita ? (
            <>
              <Field label="Empresa">
                <select value={rtId} onChange={(e) => { setRtId(e.target.value); if (e.target.value !== "outro") setPayerType("pj"); }}>
                  {rts.map((r) => <option key={r.id} value={String(r.id)}>{r.empresa}</option>)}
                  <option value="outro">Outro pagador (sem RT cadastrada)</option>
                </select>
              </Field>
              <Field label="Quem paga">
                <select value={payerType} onChange={(e) => setPayerType(e.target.value as "pf" | "pj")}>
                  <option value="pj">Empresa (CNPJ)</option>
                  <option value="pf">Pessoa física (CPF)</option>
                </select>
              </Field>
              {!rt && <Field label="Nome do pagador"><input name="pagador" required placeholder="Ex.: Sítio Boa Água" /></Field>}
              {!rt && <Field label={payerType === "pj" ? "CNPJ" : "CPF"}><input name="documento" inputMode="numeric" /></Field>}
              <Field label="Descrição"><input name="descricao" placeholder="Honorários de RT" /></Field>
              <Field label="Valor (R$)"><input name="valor" required inputMode="decimal" placeholder="1.500,00" /></Field>
              <Field label="Vencimento"><input name="data" type="date" required defaultValue={hojeIso()} /></Field>
              {payerType === "pj" && <Field label="IR retido pela empresa (R$)"><input name="retido" inputMode="decimal" placeholder="0,00" /></Field>}
              <label className="check-row"><input type="checkbox" name="recebido" /> Já recebi este valor</label>
            </>
          ) : (
            <>
              <Field label="Categoria">
                <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setDedutivel(CATEGORIAS[e.target.value].dedutivel); }}>
                  {Object.entries(CATEGORIAS).map(([id, c]) => <option key={id} value={id}>{c.rotulo}</option>)}
                </select>
              </Field>
              <Field label="Descrição"><input name="descricao" placeholder={CATEGORIAS[categoria].rotulo} /></Field>
              <Field label="Valor (R$)"><input name="valor" required inputMode="decimal" placeholder="450,00" /></Field>
              <Field label="Data do pagamento"><input name="data" type="date" required defaultValue={hojeIso()} /></Field>
              <Field label="Comprovante"><input name="comprovante" type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFoto(f && f.type.startsWith("image/") ? f : null); setOcr({ lendo: false, mensagem: "" }); }} /></Field>
              {foto && (
                <div className="ocr-linha">
                  <button type="button" className="button secondary" onClick={() => void lerFoto()} disabled={ocr.lendo}><ScanText size={16} /> {ocr.lendo ? "Lendo a foto..." : "Ler valores da foto"}</button>
                  <small>Lê valor, data e o tipo do gasto na foto do comprovante.</small>
                </div>
              )}
              {ocr.mensagem && <p className="form-hint ocr-mensagem" role="status">{ocr.mensagem}</p>}
              <label className="check-row"><input type="checkbox" checked={dedutivel} onChange={(e) => setDedutivel(e.target.checked)} /> Dedutível no livro-caixa</label>
              <p className="form-hint">Entra no livro-caixa o gasto necessário à atividade, pago e com comprovante. Deslocamento não entra. Na dúvida, confirme com o contador.</p>
            </>
          )}
        </div>
        <footer>
          <button type="button" className="button ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="button primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
        </footer>
      </form>
    </Modal>
  );
}

type Aba = "honorarios" | "despesas" | "carne" | "ir";
const ABAS: Array<[Aba, string]> = [["honorarios", "Honorários"], ["despesas", "Despesas"], ["carne", "Carnê-leão"], ["ir", "Imposto de renda"]];

/** Finanças pessoais do químico: só quem lançou vê (RLS por user_id). */
export function Financeiro({ rts, perfil, quimico, showToast, onMudou }: { rts: RT[]; perfil: { id: string; tenantId: string; regime: "pf" | "pj" | null } | null; quimico: { nome: string; crq: string | null }; showToast: (m: string) => void; onMudou?: () => void }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(supabase ? [] : lancamentosDemo);
  const [carregando, setCarregando] = useState(Boolean(supabase && perfil));
  const [aba, setAba] = useState<Aba>("honorarios");
  const [modal, setModal] = useState<Lancamento["kind"] | null>(null);
  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(() => Number(hojeIso().slice(0, 4)));
  const regime = supabase ? perfil?.regime ?? null : "pf";

  const carregar = useCallback(async () => {
    if (!supabase || !perfil) return;
    const { data, error } = await supabase.from("financial_entries").select("*").order("due_date", { ascending: false });
    if (error) {
      console.error(error);
      showToast("Não consegui carregar o financeiro.");
    } else setLancamentos((data as Linha[]).map(daLinha));
    setCarregando(false);
  }, [perfil, showToast]);

  useEffect(() => { void carregar(); }, [carregar]);

  const empresaDe = (l: Lancamento) => l.payerName ?? rts.find((r) => String(r.id) === l.rtId)?.empresa ?? "—";

  const salvar = async (novo: Omit<Lancamento, "id" | "comprovante">, arquivo: File | null) => {
    if (!supabase || !perfil) {
      setLancamentos((atual) => [{ ...novo, id: String(Date.now()), comprovante: arquivo ? arquivo.name : null }, ...atual]);
    } else {
      let caminho: string | null = null;
      if (arquivo) {
        caminho = `${perfil.id}/${crypto.randomUUID()}-${arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_")}`;
        const envio = await supabase.storage.from("financeiro").upload(caminho, arquivo);
        if (envio.error) { console.error(envio.error); showToast("Não consegui enviar o comprovante."); return; }
      }
      const { error } = await supabase.from("financial_entries").insert({
        tenant_id: perfil.tenantId, kind: novo.kind, rt_id: novo.rtId, payer_type: novo.payerType, payer_name: novo.payerName, payer_document: novo.payerDocument,
        category: novo.category, deductible: novo.deductible, description: novo.description, amount_cents: Math.round(novo.valor * 100),
        withheld_tax_cents: Math.round(novo.retido * 100), due_date: novo.vencimento, paid_on: novo.pagoEm, receipt_path: caminho,
      });
      if (error) { console.error(error); showToast("Não consegui salvar o lançamento."); return; }
      await carregar();
      onMudou?.();
    }
    setModal(null);
    showToast(novo.kind === "receita" ? "Honorário registrado." : "Despesa registrada.");
  };

  const marcarRecebido = async (l: Lancamento) => {
    const hoje = hojeIso();
    if (supabase) {
      const { error } = await supabase.from("financial_entries").update({ paid_on: hoje }).eq("id", l.id);
      if (error) { console.error(error); showToast("Não consegui atualizar."); return; }
      onMudou?.();
    }
    setLancamentos((atual) => atual.map((x) => (x.id === l.id ? { ...x, pagoEm: hoje } : x)));
    showToast("Marcado como recebido.");
  };

  const excluir = async (l: Lancamento) => {
    if (!window.confirm(`Excluir "${l.description}" de ${reais(l.valor)}?`)) return;
    if (supabase) {
      const { error } = await supabase.from("financial_entries").delete().eq("id", l.id);
      if (error) { console.error(error); showToast("Não consegui excluir."); return; }
      if (l.comprovante) await supabase.storage.from("financeiro").remove([l.comprovante]);
      onMudou?.();
    }
    setLancamentos((atual) => atual.filter((x) => x.id !== l.id));
    showToast("Lançamento excluído.");
  };

  // A aba abre no clique (antes do await), senão o navegador bloqueia como pop-up; o link assinado chega depois
  const verComprovante = async (l: Lancamento) => {
    if (!supabase || !l.comprovante) { showToast("Comprovante disponível só com a conta conectada."); return; }
    const aba = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("financeiro").createSignedUrl(l.comprovante, 120);
    if (error || !data) { aba?.close(); showToast("Não consegui abrir o comprovante."); return; }
    if (aba) { aba.opener = null; aba.location.href = data.signedUrl; } else window.location.assign(data.signedUrl);
  };

  const receitas = lancamentos.filter((l) => l.kind === "receita");
  const despesas = lancamentos.filter((l) => l.kind === "despesa");
  const noMes = (iso: string | null, m: string) => Boolean(iso?.startsWith(m));
  const noAno = (iso: string | null, a: number) => Boolean(iso?.startsWith(String(a)));
  const soma = (ls: Lancamento[], campo: "valor" | "retido" = "valor") => ls.reduce((t, l) => t + l[campo], 0);
  const atrasados = receitas.filter((l) => situacao(l) === "atrasado");

  // Carnê-leão: dinheiro de pessoa física recebido no mês; livro-caixa: despesas dedutíveis pagas no mês
  const carne = useMemo(() => {
    const rec = receitas.filter((l) => l.payerType === "pf" && noMes(l.pagoEm, mes));
    const ded = despesas.filter((l) => l.deductible && noMes(l.pagoEm, mes));
    const [a, m] = mes.split("-").map(Number);
    return { rec, ded, calculo: calcularCarneLeao(soma(rec), soma(ded)), darf: vencimentoDarf(a, m - 1) };
  }, [receitas, despesas, mes]);

  // Resumo anual
  const resumo = useMemo(() => {
    const recAno = receitas.filter((l) => noAno(l.pagoEm, ano));
    const porFonte = new Map<string, { nome: string; documento: string | null; total: number; retido: number }>();
    for (const l of recAno.filter((x) => x.payerType === "pj")) {
      const chave = l.payerDocument ?? empresaDe(l);
      const f = porFonte.get(chave) ?? { nome: empresaDe(l), documento: l.payerDocument, total: 0, retido: 0 };
      f.total += l.valor;
      f.retido += l.retido;
      porFonte.set(chave, f);
    }
    const pf = recAno.filter((x) => x.payerType === "pf");
    const meses = Array.from(new Set(pf.map((l) => l.pagoEm!.slice(0, 7)))).sort();
    const carneAno = meses.map((m) => {
      const recM = pf.filter((l) => l.pagoEm!.startsWith(m));
      const dedM = despesas.filter((l) => l.deductible && noMes(l.pagoEm, m));
      return { mes: m, ...calcularCarneLeao(soma(recM), soma(dedM)) };
    });
    const porCategoria = new Map<string, number>();
    for (const l of despesas.filter((x) => x.deductible && noAno(x.pagoEm, ano))) porCategoria.set(l.category ?? "outros", (porCategoria.get(l.category ?? "outros") ?? 0) + l.valor);
    return { fontes: [...porFonte.values()].sort((a, b) => b.total - a.total), carneAno, porCategoria: [...porCategoria.entries()], totalPf: soma(pf) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receitas, despesas, ano, rts]);

  const baixarResumo = () => {
    const linhas: string[][] = [["Seção", "Item", "Documento", "Valor", "IR retido"]];
    for (const f of resumo.fontes) linhas.push(["Rendimentos de pessoa jurídica", f.nome, f.documento ?? "", f.total.toFixed(2), f.retido.toFixed(2)]);
    for (const c of resumo.carneAno) linhas.push(["Carnê-leão (pessoa física)", nomeDoMes(c.mes), "", c.rendimentos.toFixed(2), c.imposto.toFixed(2)]);
    for (const [cat, v] of resumo.porCategoria) linhas.push(["Livro-caixa (dedutível)", CATEGORIAS[cat]?.rotulo ?? cat, "", v.toFixed(2), ""]);
    const csv = linhas.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rtquimico-resumo-ir-${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [gerandoGuia, setGerandoGuia] = useState(false);
  // Guia em PDF: onde clicar e o que digitar no programa da Receita, com os valores do ano
  const baixarGuia = async () => {
    setGerandoGuia(true);
    try {
      const { montarGuiaIr } = await import("../lib/guia-ir");
      const { gerarPdfGuiaIr } = await import("../lib/guia-ir-pdf");
      const guia = montarGuiaIr({ ano, regime, quimico, lancamentos: lancamentos.map((l) => ({ ...l, payerName: l.payerName ?? empresaDe(l) })) });
      (await gerarPdfGuiaIr(guia)).salvar();
    } catch (erro) {
      console.error(erro);
      showToast("Não consegui gerar o guia em PDF.");
    } finally {
      setGerandoGuia(false);
    }
  };

  const anos = Array.from(new Set([Number(hojeIso().slice(0, 4)), ...lancamentos.map((l) => Number(l.vencimento.slice(0, 4)))])).sort((a, b) => b - a);

  return (
    <div className="financeiro">
      {carregando && <div className="loading-strip">Carregando o financeiro...</div>}
      {atrasados.length > 0 && (
        <button className="fin-alerta" onClick={() => setAba("honorarios")}>
          <AlertTriangle size={19} /> {atrasados.length === 1 ? "1 honorário em atraso" : `${atrasados.length} honorários em atraso`}, somando {reais(soma(atrasados))}.
        </button>
      )}

      <div className="fin-topo">
        <div className="filter-tabs" role="tablist" aria-label="Seções do financeiro">
          {ABAS.map(([id, rotulo]) => <button key={id} role="tab" aria-selected={aba === id} className={aba === id ? "active" : ""} onClick={() => setAba(id)}>{rotulo}</button>)}
        </div>
        {aba === "honorarios" && <button className="button primary" onClick={() => setModal("receita")}><Plus size={18} /> Novo honorário</button>}
        {aba === "despesas" && <button className="button primary" onClick={() => setModal("despesa")}><Plus size={18} /> Nova despesa</button>}
      </div>

      {aba === "honorarios" && (
        <>
          <section className="stat-grid">
            <article className="stat-card"><div className="stat-icon green"><Wallet size={21} /></div><span>Recebido no mês</span><strong>{reais(soma(receitas.filter((l) => noMes(l.pagoEm, mesAtual()))))}</strong><small>{nomeDoMes(mesAtual())}</small></article>
            <article className="stat-card"><div className="stat-icon blue"><CalendarClock size={21} /></div><span>A receber</span><strong>{reais(soma(receitas.filter((l) => situacao(l) === "aberto")))}</strong><small>dentro do prazo</small></article>
            <article className="stat-card"><div className="stat-icon red"><AlertTriangle size={21} /></div><span>Em atraso</span><strong>{reais(soma(atrasados))}</strong><small>{atrasados.length} {atrasados.length === 1 ? "cobrança" : "cobranças"}</small></article>
            <article className="stat-card"><div className="stat-icon green"><Receipt size={21} /></div><span>Recebido no ano</span><strong>{reais(soma(receitas.filter((l) => noAno(l.pagoEm, Number(mesAtual().slice(0, 4))))))}</strong><small>de janeiro até hoje</small></article>
          </section>
          <article className="panel table-panel">
            <PanelHeader title="Honorários por empresa" subtitle="O que cada empresa paga pela RT, com vencimento e situação" />
            {receitas.length === 0 ? <p className="table-empty">Nenhum honorário lançado ainda.</p> : (
              <div className="fin-table">
                {receitas.map((l) => {
                  const s = situacao(l);
                  return (
                    <div key={l.id}>
                      <span><b>{empresaDe(l)}</b><small>{l.description}{l.payerType === "pf" ? " · pessoa física" : ""}</small></span>
                      <span><b>{dataBr(l.vencimento)}</b><small>{l.pagoEm ? `recebido em ${dataBr(l.pagoEm)}` : "vencimento"}</small></span>
                      <span className="fin-valor">{reais(l.valor)}</span>
                      <span className={`status ${s}`}>{ROTULO_SITUACAO[s]}</span>
                      <MenuAcoes rotulo={`${empresaDe(l)} ${dataBr(l.vencimento)}`} acoes={[...(l.pagoEm ? [] : [{ texto: "Marcar como recebido", fazer: () => void marcarRecebido(l) }]), { texto: "Excluir", perigo: true, fazer: () => void excluir(l) }]} />
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </>
      )}

      {aba === "despesas" && (
        <>
          <section className="stat-grid two">
            <article className="stat-card"><div className="stat-icon amber"><Receipt size={21} /></div><span>Despesas no mês</span><strong>{reais(soma(despesas.filter((l) => noMes(l.pagoEm, mesAtual()))))}</strong><small>{nomeDoMes(mesAtual())}</small></article>
            <article className="stat-card"><div className="stat-icon green"><FileText size={21} /></div><span>Dedutíveis no ano</span><strong>{reais(soma(despesas.filter((l) => l.deductible && noAno(l.pagoEm, Number(mesAtual().slice(0, 4))))))}</strong><small>entram no livro-caixa</small></article>
          </section>
          <article className="panel table-panel">
            <PanelHeader title="Despesas da atividade" subtitle="Guarde o comprovante: sem ele a despesa não vale na declaração" />
            {despesas.length === 0 ? <p className="table-empty">Nenhuma despesa lançada ainda.</p> : (
              <div className="fin-table">
                {despesas.map((l) => (
                  <div key={l.id}>
                    <span><b>{l.description}</b><small>{CATEGORIAS[l.category ?? "outros"]?.rotulo ?? l.category}{l.comprovante ? <> · <Paperclip size={12} /> comprovante</> : " · sem comprovante"}</small></span>
                    <span><b>{dataBr(l.pagoEm ?? l.vencimento)}</b><small>pagamento</small></span>
                    <span className="fin-valor">{reais(l.valor)}</span>
                    <span className={`status ${l.deductible ? "recebido" : "neutro"}`}>{l.deductible ? "Dedutível" : "Não dedutível"}</span>
                    <MenuAcoes rotulo={l.description} acoes={[...(l.comprovante ? [{ texto: "Ver comprovante", fazer: () => void verComprovante(l) }] : []), { texto: "Excluir", perigo: true, fazer: () => void excluir(l) }]} />
                  </div>
                ))}
              </div>
            )}
          </article>
        </>
      )}

      {aba === "carne" && (
        <article className="panel fin-carne">
          <PanelHeader title="Carnê-leão do mês" subtitle="Imposto mensal sobre o que você recebeu de pessoa física no CPF" />
          {regime === "pj" ? (
            <p className="fin-aviso"><Info size={18} /> Você recebe pela sua empresa, então o carnê-leão não se aplica: os impostos saem na empresa (Simples ou outro regime). No imposto de renda da pessoa física entram o pró-labore e os lucros que o contador informar.</p>
          ) : (
            <>
              {regime === null && <p className="fin-aviso"><Info size={18} /> Informe em Configurações se você recebe no CPF ou pela sua empresa. A conta abaixo vale para quem recebe no CPF.</p>}
              <div className="fin-mes"><Field label="Mês"><input type="month" value={mes} onChange={(e) => setMes(e.target.value || mesAtual())} /></Field></div>
              <dl className="fin-calc">
                <div><dt>Recebido de pessoas físicas</dt><dd>{reais(carne.calculo.rendimentos)}</dd></div>
                <div><dt>{carne.calculo.usouSimplificado ? `Desconto simplificado (maior que o livro-caixa de ${reais(soma(carne.ded))})` : "Livro-caixa (despesas dedutíveis pagas no mês)"}</dt><dd>− {reais(carne.calculo.deducoes)}</dd></div>
                <div><dt>Base de cálculo</dt><dd>{reais(carne.calculo.base)}</dd></div>
                <div><dt>Imposto pela tabela</dt><dd>{reais(carne.calculo.impostoTabela)}</dd></div>
                {carne.calculo.reducao > 0 && <div><dt>Redução de 2026 (rendimento até R$ 7.350)</dt><dd>− {reais(carne.calculo.reducao)}</dd></div>}
                <div className="total"><dt>Imposto estimado</dt><dd>{reais(carne.calculo.imposto)}</dd></div>
              </dl>
              <p className="fin-darf">
                {carne.calculo.imposto > 0
                  ? <>Pague o DARF até <b>{carne.darf.toLocaleDateString("pt-BR")}</b> pelo Carnê-Leão Web, no e-CAC da Receita.</>
                  : <>Sem imposto a pagar neste mês. Mesmo assim, lance os recebimentos no Carnê-Leão Web até <b>{carne.darf.toLocaleDateString("pt-BR")}</b>.</>}
              </p>
              <p className="form-hint">Estimativa para você se planejar; o valor oficial é o do Carnê-Leão Web. Recebimentos de empresa não entram aqui: a empresa é quem retém o imposto. O desconto simplificado (até {reais(DESCONTO_SIMPLIFICADO)}) entra no lugar das deduções quando é maior.</p>
            </>
          )}
        </article>
      )}

      {aba === "ir" && (
        <>
          <div className="fin-topo">
            <Field label="Ano-calendário"><select value={ano} onChange={(e) => setAno(Number(e.target.value))}>{anos.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
            <div className="radar-acoes">
              <button className="button primary" onClick={() => void baixarGuia()} disabled={gerandoGuia}><FileText size={17} /> {gerandoGuia ? "Gerando..." : "Baixar guia do IR (PDF)"}</button>
              <button className="button secondary" onClick={baixarResumo}><Download size={17} /> Planilha</button>
            </div>
          </div>
          <p className="fin-aviso"><Info size={18} /> {regime === "pj"
            ? "Estes são os recebimentos da sua empresa no ano. Na declaração da pessoa física entram o pró-labore e os lucros distribuídos que o contador informar; leve este resumo para ele."
            : `Resumo de ${ano} para a declaração entregue em ${ano + 1}. O guia em PDF mostra, passo a passo, em qual ficha do programa da Receita clicar e o que digitar em cada campo. Os rendimentos de empresas também aparecem no informe que cada uma deve mandar até fevereiro: se algum valor for diferente, vale o do informe.`}</p>
          <article className="panel table-panel">
            <PanelHeader title="Rendimentos de empresas" subtitle="Ficha 'Rendimentos tributáveis recebidos de pessoa jurídica', uma linha por fonte pagadora" />
            {resumo.fontes.length === 0 ? <p className="table-empty">Nada recebido de empresas em {ano}.</p> : (
              <div className="fin-table resumo">
                {resumo.fontes.map((f) => <div key={f.nome}><span><b>{f.nome}</b><small>{f.documento ?? "CNPJ não informado"}</small></span><span className="fin-valor">{reais(f.total)}</span><span><b>{reais(f.retido)}</b><small>IR retido</small></span></div>)}
              </div>
            )}
          </article>
          <article className="panel table-panel">
            <PanelHeader title="Carnê-leão" subtitle={`Recebido de pessoas físicas: ${reais(resumo.totalPf)} no ano. No programa da declaração, importe os dados do Carnê-Leão Web.`} />
            {resumo.carneAno.length === 0 ? <p className="table-empty">Nada recebido de pessoas físicas em {ano}.</p> : (
              <div className="fin-table resumo">
                {resumo.carneAno.map((c) => <div key={c.mes}><span><b>{nomeDoMes(c.mes)}</b><small>base {reais(c.base)}</small></span><span className="fin-valor">{reais(c.rendimentos)}</span><span><b>{reais(c.imposto)}</b><small>imposto estimado</small></span></div>)}
              </div>
            )}
          </article>
          <article className="panel table-panel">
            <PanelHeader title="Livro-caixa" subtitle="Despesas dedutíveis pagas no ano, por categoria" />
            {resumo.porCategoria.length === 0 ? <p className="table-empty">Nenhuma despesa dedutível em {ano}.</p> : (
              <div className="fin-table resumo">
                {resumo.porCategoria.map(([cat, v]) => <div key={cat}><span><b>{CATEGORIAS[cat]?.rotulo ?? cat}</b></span><span className="fin-valor">{reais(v)}</span><span /></div>)}
              </div>
            )}
          </article>
        </>
      )}

      {modal && <NovoLancamento kind={modal} rts={rts} onClose={() => setModal(null)} onSave={salvar} />}
    </div>
  );
}
