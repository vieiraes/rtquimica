import { Clock3, Copy, Paperclip, Printer, Sparkles, Undo2, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Modal } from "./primitives";
import { redigirDiario } from "../lib/ia";
import { textoComunicacao, type TipoComunicacao } from "../lib/comunicacao-crq";
import { cnpjValido, consultarCnpj, formatarCnpj, soDigitos, type DadosCnpj } from "../lib/cnpj";
import type { ActionInsertPayload, RT, RtInsertPayload } from "../types";

const hojeIso = () => new Date().toLocaleDateString("sv-SE");
const daquiUmAno = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("sv-SE"); };

type Consulta = { estado: "parado" | "buscando" | "achou" | "nao-existe" | "indisponivel" | "invalido"; dados?: DadosCnpj };

// Os 21 conselhos regionais; a UF só onde é certa (os demais aparecem pelo número)
const CRQS: Array<[string, string]> = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"]
  .map((n) => [`CRQ-${n}`, ({ II: "Minas Gerais", III: "Rio de Janeiro", IV: "São Paulo" } as Record<string, string>)[n] ?? ""]);

export function NewRtModal({ onClose, onSave }: { onClose: () => void; onSave: (rt: RtInsertPayload) => void | Promise<void> }) {
  const [company, setCompany] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [consulta, setConsulta] = useState<Consulta>({ estado: "parado" });
  const [documento, setDocumento] = useState<"TRT" | "ART" | "CRT">("TRT");
  const [numero, setNumero] = useState("");
  const [regional, setRegional] = useState("CRQ-IV");
  const [salvando, setSalvando] = useState(false);
  const [inicio, setInicio] = useState(hojeIso);
  const [vigencia, setVigencia] = useState(daquiUmAno);
  const [observacoes, setObservacoes] = useState("");

  // CNPJ completo e válido: busca a empresa e preenche o nome (o químico pode trocar)
  const mudarCnpj = async (valor: string) => {
    const formatado = formatarCnpj(valor);
    setCnpj(formatado);
    if (soDigitos(formatado).length < 14) { setConsulta({ estado: "parado" }); return; }
    if (!cnpjValido(formatado)) { setConsulta({ estado: "invalido" }); return; }
    setConsulta({ estado: "buscando" });
    try {
      const dados = await consultarCnpj(formatado);
      if (!dados) { setConsulta({ estado: "nao-existe" }); return; }
      setConsulta({ estado: "achou", dados });
      setCompany((atual) => atual || dados.nomeFantasia || dados.razaoSocial);
    } catch {
      setConsulta({ estado: "indisponivel" });
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!company || !cnpj || salvando) return;
    const d = consulta.estado === "achou" ? consulta.dados : undefined;
    setSalvando(true);
    try { await onSave({
      empresa: company,
      cnpj,
      documento,
      numero: numero.trim(),
      inicio,
      vigencia,
      regional,
      observacoes,
      empresaDados: d && { razaoSocial: d.razaoSocial, cnae: d.cnae, cnaeDescricao: d.cnaeDescricao, municipio: d.municipio, uf: d.uf },
    }); } finally { setSalvando(false); }
  };
  const d = consulta.dados;
  return (
    <Modal title="Nova RT" subtitle="Digite o CNPJ: a empresa é preenchida sozinha." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="CNPJ"><input autoFocus inputMode="numeric" value={cnpj} onChange={(event) => void mudarCnpj(event.target.value)} placeholder="00.000.000/0001-00" required /></Field>
          <Field label="Nome da empresa"><input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Preenchido pelo CNPJ" required /></Field>
          <div className={`cnpj-consulta ${consulta.estado}`} aria-live="polite">
            {consulta.estado === "buscando" && "Buscando a empresa na Receita..."}
            {consulta.estado === "invalido" && "Esse CNPJ não é válido. Confira os números."}
            {consulta.estado === "nao-existe" && "Não achei esse CNPJ na Receita. Confira os números."}
            {consulta.estado === "indisponivel" && "A consulta de CNPJ não respondeu agora. Preencha o nome da empresa à mão."}
            {consulta.estado === "achou" && d && (
              <>
                <b>{d.razaoSocial}</b>
                <span>
                  <i className={d.ativa ? "ativa" : "inativa"}>{d.ativa ? "Ativa" : `Situação: ${d.situacao.toLowerCase()}`}</i>
                  {d.cnae && <> · CNAE {d.cnae}{d.cnaeDescricao ? ` ${d.cnaeDescricao}` : ""}</>}
                  {d.municipio && <> · {d.municipio}{d.uf ? `/${d.uf}` : ""}</>}
                </span>
                {!d.ativa && <small>Empresa sem situação ativa na Receita: confirme antes de assumir a RT.</small>}
              </>
            )}
          </div>
          <Field label="Tipo de documento"><select value={documento} onChange={(event) => setDocumento(event.target.value as "TRT" | "ART" | "CRT")}><option>TRT</option><option>ART</option><option>CRT</option></select></Field>
          <Field label="Número do documento (opcional)"><input value={numero} onChange={(event) => setNumero(event.target.value)} placeholder="Ex.: TRT-2026-0182" /></Field>
          <Field label="Regional"><select value={regional} onChange={(event) => setRegional(event.target.value)}>{CRQS.map(([id, uf]) => <option key={id} value={id}>{uf ? `${id} • ${uf}` : id}</option>)}</select></Field>
          <Field label="Data de início"><input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></Field>
          <Field label="Data de vigência"><input type="date" value={vigencia} onChange={(event) => setVigencia(event.target.value)} /></Field>
        </div>
        <Field label="Observações"><textarea rows={3} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Informações complementares sobre o vínculo..." /></Field>
        <div className="info-box"><Clock3 size={19} /><span><b>Lembrete automático</b>Ao salvar, criaremos um alerta para comunicação ao CRQ em até 24 horas.</span></div>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={salvando}>{salvando ? "Cadastrando..." : "Cadastrar RT"}</button></footer>
      </form>
    </Modal>
  );
}

export function NewActionModal({ rts, onClose, onSave }: { rts: RT[]; onClose: () => void; onSave: (action: ActionInsertPayload) => void | Promise<void> }) {
  const [description, setDescription] = useState("");
  const [rtId, setRtId] = useState<string | number>(rts[0]?.id ?? "");
  const [category, setCategory] = useState("Visita técnica");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erroArquivo, setErroArquivo] = useState("");
  const adicionar = (lista: FileList | null) => {
    const novos = Array.from(lista ?? []);
    const grande = novos.find((f) => f.size > 10 * 1024 * 1024);
    const tipoErrado = novos.find((f) => !["application/pdf", "image/jpeg", "image/png"].includes(f.type));
    setErroArquivo(grande ? `${grande.name} passa de 10 MB.` : tipoErrado ? `${tipoErrado.name}: use PDF, JPG ou PNG.` : "");
    setArquivos((atual) => [...atual, ...novos.filter((f) => f.size <= 10 * 1024 * 1024 && ["application/pdf", "image/jpeg", "image/png"].includes(f.type))].slice(0, 10));
  };
  const [ia, setIa] = useState<{ carregando: boolean; erro: string; original: string | null; avisos: string[]; restantes: number | null }>({ carregando: false, erro: "", original: null, avisos: [], restantes: null });
  const selectedRt = rts.find((rt) => String(rt.id) === String(rtId)) ?? rts[0];
  const [salvando, setSalvando] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!description || !selectedRt || salvando) return;
    setSalvando(true);
    try { await onSave({ rtId: selectedRt.id, category, company: selectedRt.empresa, description, arquivos }); } finally { setSalvando(false); }
  };
  // A anotação solta vira o registro formal; o original fica guardado para desfazer
  const redigir = async () => {
    if (!selectedRt || ia.carregando) return;
    setIa((atual) => ({ ...atual, carregando: true, erro: "" }));
    try {
      const r = await redigirDiario({ anotacao: description, empresa: selectedRt.empresa, categoria: category });
      setIa({ carregando: false, erro: "", original: description, avisos: r.avisos, restantes: r.restantes });
      setDescription(r.texto);
      setCategory(r.categoria);
    } catch (erro) {
      setIa((atual) => ({ ...atual, carregando: false, erro: erro instanceof Error ? erro.message : "Não consegui falar com a IA agora." }));
    }
  };
  const desfazer = () => {
    if (ia.original !== null) setDescription(ia.original);
    setIa({ carregando: false, erro: "", original: null, avisos: [], restantes: ia.restantes });
  };
  return (
    <Modal title="Registrar ação técnica" subtitle="Crie um registro claro, datado e vinculado à empresa." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Empresa"><select value={String(rtId)} onChange={(event) => setRtId(event.target.value)}>{rts.length ? rts.map((rt) => <option key={rt.id} value={String(rt.id)}>{rt.empresa}</option>) : <option value="">Cadastre uma RT primeiro (menu RT)</option>}</select></Field>
          <Field label="Categoria"><select value={category} onChange={(event) => setCategory(event.target.value)}>{["Visita técnica", "Coleta", "Análise", "Laudo", "Orientação", "Outro"].map((name) => <option key={name}>{name}</option>)}</select></Field>
        </div>
        <Field label="Descrição da ação"><textarea autoFocus rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva o que foi realizado, orientações fornecidas e decisões tomadas. Pode ser em tópicos: a IA organiza." required /></Field>
        <div className="ia-diario">
          <button type="button" className="button secondary" onClick={redigir} disabled={ia.carregando || description.trim().length < 10}><Sparkles size={16} /> {ia.carregando ? "Redigindo..." : ia.original === null ? "Redigir com IA" : "Redigir de novo"}</button>
          {ia.original !== null && <button type="button" className="button ghost" onClick={desfazer}><Undo2 size={16} /> Voltar ao meu texto</button>}
          {ia.restantes !== null && <small>{ia.restantes} {ia.restantes === 1 ? "rascunho restante" : "rascunhos restantes"} este mês</small>}
        </div>
        {ia.erro && <p className="ia-diario-erro" role="alert">{ia.erro}</p>}
        {ia.original !== null && (
          <div className="ia-diario-aviso" role="status">
            <b>Rascunho da IA: revise antes de salvar.</b> O registro é seu e vale como prova da sua atuação; confira se nada foi acrescentado.
            {ia.avisos.length > 0 && <ul>{ia.avisos.map((a) => <li key={a}>{a}</li>)}</ul>}
          </div>
        )}
        <label className="upload-zone">
          <Upload size={22} /><span><b>Adicionar fotos ou documentos</b><small>PDF, JPG ou PNG • até 10 MB cada</small></span>
          <input type="file" multiple accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(event) => { adicionar(event.target.files); event.target.value = ""; }} />
        </label>
        {arquivos.length > 0 && (
          <ul className="anexos-lista">
            {arquivos.map((f, i) => <li key={`${f.name}-${i}`}><Paperclip size={14} /> {f.name} <small>{Math.ceil(f.size / 1024)} KB</small><button type="button" onClick={() => setArquivos((atual) => atual.filter((_, k) => k !== i))} aria-label={`Remover ${f.name}`}>Remover</button></li>)}
          </ul>
        )}
        {erroArquivo && <p className="ia-diario-erro" role="alert">{erroArquivo}</p>}
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary" disabled={salvando || !selectedRt}>{salvando ? "Salvando..." : "Salvar no diário"}</button></footer>
      </form>
    </Modal>
  );
}

/** Comunicação de início ou encerramento ao CRQ: texto pronto para copiar ou imprimir e o registro de que foi feita. */
export function ComunicacaoModal({ rt, quimico, tipoInicial, onClose, onFeita }: {
  rt: RT;
  quimico: { nome: string; crq: string | null };
  tipoInicial: TipoComunicacao;
  onClose: () => void;
  onFeita: (dados: { tipo: TipoComunicacao; protocolo: string; data: string }) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<TipoComunicacao>(tipoInicial);
  const [dataEncerramento, setDataEncerramento] = useState(hojeIso);
  const [protocolo, setProtocolo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const texto = textoComunicacao({
    tipo, quimico, regional: rt.regional, dataEncerramento,
    empresa: { nome: rt.empresa, razaoSocial: rt.razaoSocial ?? null, cnpj: rt.cnpj, cidade: rt.cidade ?? null, uf: rt.uf ?? null },
    documento: { tipo: rt.documento, numero: rt.numero, inicio: rt.inicio, vigencia: rt.vigencia },
  });
  const [editado, setEditado] = useState<string | null>(null);
  const final = editado ?? texto;

  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(final); setCopiado(true); } catch { setCopiado(false); }
  };
  const imprimir = () => {
    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.title = `Comunicação ao CRQ - ${rt.empresa}`;
    const pre = janela.document.createElement("pre");
    pre.textContent = final;
    pre.style.cssText = "font: 14px/1.6 Georgia, serif; white-space: pre-wrap; max-width: 680px; margin: 48px auto;";
    janela.document.body.appendChild(pre);
    janela.print();
  };
  const feita = async () => {
    setSalvando(true);
    try { await onFeita({ tipo, protocolo: protocolo.trim(), data: tipo === "encerramento" ? dataEncerramento : hojeIso() }); } finally { setSalvando(false); }
  };

  return (
    <Modal title="Comunicação ao CRQ" subtitle={`${rt.empresa} · ${rt.documento} ${rt.numero}`} onClose={onClose}>
      <div className="form-grid">
        <Field label="O que comunicar">
          <select value={tipo} onChange={(e) => { setTipo(e.target.value as TipoComunicacao); setEditado(null); }}>
            <option value="inicio">Início da responsabilidade técnica</option>
            <option value="encerramento">Encerramento da responsabilidade técnica</option>
          </select>
        </Field>
        {tipo === "encerramento" && <Field label="Data do encerramento"><input type="date" value={dataEncerramento} onChange={(e) => { setDataEncerramento(e.target.value); setEditado(null); }} /></Field>}
      </div>
      <Field label="Texto (revise e ajuste se precisar)"><textarea className="editor" rows={14} value={final} onChange={(e) => setEditado(e.target.value)} /></Field>
      <div className="ia-diario">
        <button type="button" className="button secondary" onClick={copiar}><Copy size={16} /> {copiado ? "Copiado" : "Copiar texto"}</button>
        <button type="button" className="button ghost" onClick={imprimir}><Printer size={16} /> Imprimir</button>
      </div>
      <p className="form-hint comunicacao-dica">Envie pelo canal do seu CRQ (serviços online ou protocolo). Depois, informe o protocolo e marque como comunicada: o alerta fecha e o registro vai para o diário técnico.</p>
      <div className="form-grid">
        <Field label="Número do protocolo (opcional)"><input value={protocolo} onChange={(e) => setProtocolo(e.target.value)} placeholder="Ex.: 2026/123456" /></Field>
      </div>
      <footer><button type="button" className="button ghost" onClick={onClose}>Fechar</button><button type="button" className="button primary" onClick={feita} disabled={salvando}>{salvando ? "Registrando..." : "Marcar como comunicada"}</button></footer>
    </Modal>
  );
}
