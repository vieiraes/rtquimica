// Texto dos cartões da história (um por capítulo, na mesma ordem de CAPITULOS em historia.ts).
import type { IdCapitulo } from "./historia";

export const HISTORIA_TITULO = "Um dia de responsável técnico, da primeira visita ao último registro.";
export const HISTORIA_INTRO =
  "Role a página e acompanhe o dia de quem responde por várias empresas: a visita, o laudo, o prazo que vence, o checklist e a comunicação ao CRQ.";

export type CartaoHistoria = { id: IdCapitulo; rotulo: string; titulo: string; texto: string };

export const HISTORIA: readonly CartaoHistoria[] = [
  {
    id: "abertura",
    rotulo: "Suas empresas",
    titulo: "Cada empresa, cada RT, cada prazo.",
    texto:
      "O RTQuímico monta sua atuação como ela é: até seis empresas sob sua responsabilidade técnica, cada uma com seus documentos, vigências e registros, em um painel só.",
  },
  {
    id: "visita",
    rotulo: "Visita técnica",
    titulo: "A visita vira registro no diário.",
    texto:
      "Você sai do escritório, passa na Cosmética Lume e anota a orientação dada ali mesmo, pelo celular. O diário técnico guarda data, empresa, categoria e evidências: seu histórico profissional, auditável.",
  },
  {
    id: "laudo",
    rotulo: "Laboratório",
    titulo: "O laudo sai e já fica anexado à RT.",
    texto:
      "A análise do lote da Tintas Alfa termina, o laudo é emitido e vai para a pasta da empresa certa, com versão e data. Sem procurar PDF em e-mail antigo quando o fiscal pedir.",
  },
  {
    id: "prazo",
    rotulo: "Prazos",
    titulo: "Faltam 18 dias. Você já sabe.",
    texto:
      "O certificado de RT da Aqua Vale vence em 18 dias. O alerta chegou 30 dias antes, no painel e no e-mail, e volta a avisar aos 7. Nenhuma vigência pega você de surpresa.",
  },
  {
    id: "checklist",
    rotulo: "Conformidade",
    titulo: "FISPQ em dia, tambor por tambor.",
    texto:
      "No galpão da distribuidora, o checklist de conformidade confere cada item e cada ficha de segurança. Ao fim, 12 de 12 atualizadas e o relatório pronto para a empresa.",
  },
  {
    id: "noite",
    rotulo: "Fim do dia",
    titulo: "Quatro RTs em dia. O CRQ comunicado.",
    texto:
      "No fim do dia tudo está registrado: visitas, laudos, vigências e a comunicação ao conselho. Amanhã começa com o painel dizendo o que precisa de você. Quer ver com as suas empresas?",
  },
];
