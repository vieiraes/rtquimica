import { Clock3, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Modal } from "./primitives";
import type { ActionInsertPayload, RT, RtInsertPayload } from "../types";

export function NewRtModal({ onClose, onSave }: { onClose: () => void; onSave: (rt: RtInsertPayload) => void | Promise<void> }) {
  const [company, setCompany] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [documento, setDocumento] = useState<"TRT" | "ART" | "CRT">("TRT");
  const [regional, setRegional] = useState("CRQ-IV");
  const [inicio, setInicio] = useState("2026-06-10");
  const [vigencia, setVigencia] = useState("2027-06-10");
  const [observacoes, setObservacoes] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!company || !cnpj) return;
    void onSave({
      empresa: company,
      cnpj,
      documento,
      numero: `${documento}-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      inicio,
      vigencia,
      regional,
      observacoes,
    });
  };
  return (
    <Modal title="Nova responsabilidade técnica" subtitle="Cadastre o vínculo e gere os próximos passos automaticamente." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Nome da empresa"><input autoFocus value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Razão social ou nome fantasia" required /></Field>
          <Field label="CNPJ"><input value={cnpj} onChange={(event) => setCnpj(event.target.value)} placeholder="00.000.000/0001-00" required /></Field>
          <Field label="Tipo de documento"><select value={documento} onChange={(event) => setDocumento(event.target.value as "TRT" | "ART" | "CRT")}><option>TRT</option><option>ART</option><option>CRT</option></select></Field>
          <Field label="Regional"><select value={regional} onChange={(event) => setRegional(event.target.value)}><option value="CRQ-IV">CRQ-IV • São Paulo</option><option value="CRQ-III">CRQ-III • Rio de Janeiro</option><option value="CRQ-II">CRQ-II • Minas Gerais</option></select></Field>
          <Field label="Data de início"><input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} /></Field>
          <Field label="Data de vigência"><input type="date" value={vigencia} onChange={(event) => setVigencia(event.target.value)} /></Field>
        </div>
        <Field label="Observações"><textarea rows={3} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Informações complementares sobre o vínculo..." /></Field>
        <div className="info-box"><Clock3 size={19} /><span><b>Lembrete automático</b>Ao salvar, criaremos um alerta para comunicação ao CRQ em até 24 horas.</span></div>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary">Cadastrar responsabilidade</button></footer>
      </form>
    </Modal>
  );
}

export function NewActionModal({ rts, onClose, onSave }: { rts: RT[]; onClose: () => void; onSave: (action: ActionInsertPayload) => void | Promise<void> }) {
  const [description, setDescription] = useState("");
  const [rtId, setRtId] = useState<string | number>(rts[0]?.id ?? "");
  const [category, setCategory] = useState("Visita técnica");
  const selectedRt = rts.find((rt) => String(rt.id) === String(rtId)) ?? rts[0];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!description || !selectedRt) return;
    void onSave({ rtId: selectedRt.id, category, company: selectedRt.empresa, description });
  };
  return (
    <Modal title="Registrar ação técnica" subtitle="Crie um registro claro, datado e vinculado à empresa." onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Empresa"><select value={String(rtId)} onChange={(event) => setRtId(event.target.value)}>{rts.map((rt) => <option key={rt.id} value={String(rt.id)}>{rt.empresa}</option>)}</select></Field>
          <Field label="Categoria"><select value={category} onChange={(event) => setCategory(event.target.value)}>{["Visita técnica", "Coleta", "Análise", "Laudo", "Orientação", "Outro"].map((name) => <option key={name}>{name}</option>)}</select></Field>
        </div>
        <Field label="Descrição da ação"><textarea autoFocus rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva o que foi realizado, orientações fornecidas e decisões tomadas..." required /></Field>
        <button type="button" className="upload-zone"><Upload size={22} /><span><b>Adicionar fotos ou documentos</b><small>PDF, JPG ou PNG • até 10 MB</small></span></button>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary">Salvar no diário</button></footer>
      </form>
    </Modal>
  );
}

export function PopModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  return (
    <Modal title="Personalizar POP" subtitle="Adapte o modelo à realidade da empresa antes de publicar." onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <Field label="Título"><input defaultValue="Coleta de amostras de água" /></Field>
        <Field label="Conteúdo"><textarea className="editor" rows={12} defaultValue={"1. OBJETIVO\nEstabelecer o procedimento para coleta, identificação e preservação de amostras.\n\n2. RESPONSABILIDADES\nO responsável pela coleta deve verificar os frascos, registros e condições de transporte.\n\n3. PROCEDIMENTO\nIdentificar cada amostra, registrar data e hora e manter a cadeia de custódia."} /></Field>
        <footer><button type="button" className="button ghost" onClick={onClose}>Cancelar</button><button className="button primary">Salvar na biblioteca</button></footer>
      </form>
    </Modal>
  );
}
