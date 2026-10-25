// Texto da comunicação de início ou encerramento de responsabilidade técnica ao CRQ. Montado por modelo, sem IA:
// é documento enviado ao conselho, então não pode ter nada inventado. O químico revisa e envia pelo canal do CRQ.

export type TipoComunicacao = "inicio" | "encerramento";

export interface DadosComunicacao {
  tipo: TipoComunicacao;
  quimico: { nome: string; crq: string | null };
  regional: string;
  empresa: { nome: string; razaoSocial: string | null; cnpj: string; cidade: string | null; uf: string | null };
  documento: { tipo: string; numero: string | null; inicio: string; vigencia: string };
  /** Data do encerramento (AAAA-MM-DD); no início vale a data de início do documento */
  dataEncerramento?: string;
  hoje?: Date;
}

const dataBr = (valor: string) => (/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor.split("-").reverse().join("/") : valor);
const porExtenso = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function textoComunicacao(d: DadosComunicacao): string {
  const inicio = d.tipo === "inicio";
  const empresa = d.empresa.razaoSocial && d.empresa.razaoSocial.toLowerCase() !== d.empresa.nome.toLowerCase()
    ? `${d.empresa.razaoSocial} (${d.empresa.nome})`
    : d.empresa.razaoSocial ?? d.empresa.nome;
  const local = d.empresa.cidade ? `, estabelecida em ${d.empresa.cidade}${d.empresa.uf ? `/${d.empresa.uf}` : ""}` : "";
  const documento = `${d.documento.tipo}${d.documento.numero && d.documento.numero !== "Sem número" ? ` nº ${d.documento.numero}` : ""}`;
  const registro = d.quimico.crq ? `com registro no ${d.regional} sob o nº ${d.quimico.crq}` : `com registro no ${d.regional} sob o nº [informar]`;
  const datas = inicio
    ? `Data de início: ${dataBr(d.documento.inicio)}. Vigência do documento: até ${dataBr(d.documento.vigencia)}.`
    : `Data de encerramento: ${dataBr(d.dataEncerramento ?? "[informar]")}.`;
  return [
    `Ao Conselho Regional de Química (${d.regional})`,
    "",
    `Assunto: Comunicação de ${inicio ? "início" : "encerramento"} de responsabilidade técnica`,
    "",
    `Eu, ${d.quimico.nome}, profissional da Química ${registro}, comunico a este Conselho o ${inicio ? "início" : "encerramento"} da minha responsabilidade técnica pela empresa ${empresa}, inscrita no CNPJ sob o nº ${d.empresa.cnpj}${local}.`,
    "",
    `Documento de referência: ${documento}. ${datas}`,
    "",
    "Coloco-me à disposição para os esclarecimentos necessários.",
    "",
    `${d.empresa.cidade ?? "[cidade]"}, ${porExtenso(d.hoje ?? new Date())}.`,
    "",
    "",
    "______________________________",
    d.quimico.nome,
    d.quimico.crq ? `CRQ ${d.quimico.crq}` : "CRQ [informar]",
  ].join("\n");
}

/** Em que ponto está a comunicação ao CRQ de uma RT (as colunas do quadro) */
export type EtapaCrq = "comunicar-inicio" | "inicio-comunicado" | "comunicar-encerramento" | "encerramento-comunicado";

export const ETAPAS_CRQ: Array<{ id: EtapaCrq; titulo: string; dica: string }> = [
  { id: "comunicar-inicio", titulo: "Comunicar início", dica: "RT nova: comunique ao CRQ em até 24 horas." },
  { id: "inicio-comunicado", titulo: "Início comunicado", dica: "RT em andamento, comunicação feita." },
  { id: "comunicar-encerramento", titulo: "Comunicar encerramento", dica: "RT encerrada: comunique a baixa ao CRQ." },
  { id: "encerramento-comunicado", titulo: "Encerramento comunicado", dica: "Ciclo completo." },
];

export function etapaCrq(rt: { status: string; crqInicioEm?: string | null; crqFimEm?: string | null }): EtapaCrq {
  if (rt.status === "Cancelada") return rt.crqFimEm ? "encerramento-comunicado" : "comunicar-encerramento";
  return rt.crqInicioEm ? "inicio-comunicado" : "comunicar-inicio";
}

/** Dias desde o cadastro de uma RT com início ainda não comunicado (o prazo do CRQ é de 24 horas) */
export function diasSemComunicar(rt: { criadoEm?: string; crqInicioEm?: string | null }, agora = Date.now()): number | null {
  if (rt.crqInicioEm || !rt.criadoEm) return null;
  return Math.floor((agora - new Date(rt.criadoEm).getTime()) / 86_400_000);
}

/** O que acontece ao mover um cartão do quadro de uma etapa para outra (como as transições do Jira) */
export type TransicaoCrq =
  | { tipo: "comunicar"; comunicacao: TipoComunicacao }
  | { tipo: "desfazer"; comunicacao: TipoComunicacao }
  | { tipo: "encerrar" }
  | { tipo: "bloqueada"; motivo: string };

export function transicaoCrq(de: EtapaCrq, para: EtapaCrq): TransicaoCrq | null {
  if (de === para) return null;
  if (de === "comunicar-inicio" && para === "inicio-comunicado") return { tipo: "comunicar", comunicacao: "inicio" };
  if (de === "inicio-comunicado" && para === "comunicar-inicio") return { tipo: "desfazer", comunicacao: "inicio" };
  if ((de === "comunicar-inicio" || de === "inicio-comunicado") && para === "comunicar-encerramento") return { tipo: "encerrar" };
  if (de === "comunicar-encerramento" && para === "encerramento-comunicado") return { tipo: "comunicar", comunicacao: "encerramento" };
  if (de === "encerramento-comunicado" && para === "comunicar-encerramento") return { tipo: "desfazer", comunicacao: "encerramento" };
  if (para === "encerramento-comunicado") return { tipo: "bloqueada", motivo: "Primeiro encerre a RT (coluna \"Comunicar encerramento\") e depois comunique o encerramento." };
  return { tipo: "bloqueada", motivo: "RT encerrada não volta a ficar ativa. Para assumir a empresa de novo, cadastre uma nova RT." };
}
