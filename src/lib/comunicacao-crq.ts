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
