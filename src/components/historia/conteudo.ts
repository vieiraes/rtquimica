// Texto dos cartões da história (um por capítulo, na mesma ordem de CAPITULOS em historia.ts).
import type { IdCapitulo } from "./historia";

export const HISTORIA_TITULO = "Um dia de responsável técnico, da primeira visita ao último registro.";
export const HISTORIA_INTRO =
  "Role a página e acompanhe o dia de quem responde por várias empresas: a leitura do Radar, a visita, o laudo, o prazo que vence, o checklist com o POP e a comunicação ao CRQ.";

export type CartaoHistoria = { id: IdCapitulo; rotulo: string; titulo: string; texto: string };

export const HISTORIA: readonly CartaoHistoria[] = [
  {
    id: "abertura",
    rotulo: "Suas empresas",
    titulo: "Cada empresa, cada RT, cada prazo.",
    texto:
      "Até seis empresas sob sua responsabilidade técnica, cada uma com vigências e registros, num painel só. Antes de sair, a leitura do dia: o Radar regulatório junta as novidades do CRQ, do CONAMA, do MMA e do Ibama.",
  },
  {
    id: "visita",
    rotulo: "Visita técnica",
    titulo: "A visita vira registro no diário.",
    texto:
      "Na Cosmética Lume, você anota do seu jeito, pelo celular: \"orientei a separar ácidos das bases\". A IA redige o registro formal, você revisa e salva com a foto anexada. Data, empresa e evidência: prova da sua atuação.",
  },
  {
    id: "laudo",
    rotulo: "Laboratório",
    titulo: "O laudo sai e já fica anexado à RT.",
    texto:
      "A análise do lote da Tintas Alfa termina, o laudo é emitido e anexado ao diário técnico da empresa, com data. Sem procurar PDF em e-mail antigo quando o fiscal pedir.",
  },
  {
    id: "prazo",
    rotulo: "Prazos",
    titulo: "Faltam 18 dias. Você já sabe.",
    texto:
      "O certificado de RT da Aqua Vale vence em 18 dias. O alerta apareceu no painel e o lembrete está na Google Agenda, 28 e 7 dias antes. Nenhuma vigência pega você de surpresa.",
  },
  {
    id: "checklist",
    rotulo: "Conformidade",
    titulo: "Conformidade em dia, item por item.",
    texto:
      "No galpão da distribuidora, o checklist confere rotulagem GHS, FDS, armazenagem e EPIs. O POP de armazenamento sai da biblioteca, com a NBR 14725 e a NR-20 citadas, adaptado à empresa.",
  },
  {
    id: "noite",
    rotulo: "Fim do dia",
    titulo: "Quatro RTs em dia. O CRQ comunicado. O leão calculado.",
    texto:
      "No Quadro do CRQ, a RT nova passou para \"Início comunicado\" com o protocolo. O honorário da Aqua Vale entrou e o carnê-leão do mês já está calculado. Amanhã começa com o painel dizendo o que precisa de você.",
  },
];
