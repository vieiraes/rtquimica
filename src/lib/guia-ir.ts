// Guia do imposto de renda: transforma os lançamentos do Financeiro de um ano em "onde clicar e o que digitar"
// no programa da Receita (IRPF). Código puro; o PDF é desenhado em guia-ir-pdf.ts.
// Estrutura do programa conferida em 25/10/2026 com a versão IRPF 2026 (ano-calendário 2025), por guias de
// terceiros; o manual oficial não foi encontrado. Se a Receita mudar um nome no ano seguinte, o guia já avisa para
// procurar pela ficha de título mais parecido. Os valores são os do RTQuímico; o informe oficial de cada empresa vale mais.
import { calcularCarneLeao } from "./impostos";

export interface LancamentoIr {
  kind: "receita" | "despesa";
  payerType: "pf" | "pj" | null;
  payerName: string | null;
  payerDocument: string | null;
  category: string | null;
  deductible: boolean;
  valor: number;
  retido: number;
  pagoEm: string | null;
}

export interface LinhaCampo {
  campo: string;
  valor: string;
  obs?: string;
}

export interface SecaoGuia {
  titulo: string;
  explicacao: string;
  passos: string[];
  /** Uma tabela por item (ex.: uma por empresa pagadora) */
  /** Uma tabela por item; `colunas` troca o cabeçalho padrão "Campo no programa / O que digitar / Observação" */
  tabelas: Array<{ titulo: string; linhas: LinhaCampo[]; colunas?: [string, string, string] }>;
  /** Tabela mês a mês (carnê-leão) */
  meses?: Array<{ mes: string; rendimentos: string; livroCaixa: string; estimado: string }>;
  avisos: string[];
}

export interface GuiaIr {
  ano: number;
  anoEntrega: number;
  quimico: { nome: string; crq: string | null };
  regime: "pf" | "pj" | null;
  resumo: Array<[string, string]>;
  secoes: SecaoGuia[];
  emitidoEm: string;
}

export const CATEGORIAS_LIVRO_CAIXA: Record<string, string> = {
  anuidade_crq: "Anuidade do CRQ", curso: "Cursos e congressos", material: "Material de consumo",
  escritorio: "Aluguel e contas do escritório", contador: "Contador", deslocamento: "Deslocamento e combustível", outros: "Outros",
};

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\s/g, " ");
const soma = (ls: LancamentoIr[], campo: "valor" | "retido" = "valor") => ls.reduce((t, l) => t + l[campo], 0);

const ABRIR_PROGRAMA = (anoEntrega: number) =>
  `Abra o programa da declaração IRPF ${anoEntrega} no computador (baixe em gov.br/receitafederal, menu "Meu Imposto de Renda") e entre na sua declaração de ${anoEntrega} ("Nova declaração" ou "Abrir declaração"). As fichas citadas abaixo ficam na lista da coluna da esquerda.`;

export function montarGuiaIr({ ano, regime, quimico, lancamentos, hoje = new Date() }: {
  ano: number;
  regime: "pf" | "pj" | null;
  quimico: { nome: string; crq: string | null };
  lancamentos: LancamentoIr[];
  hoje?: Date;
}): GuiaIr {
  const doAno = (l: LancamentoIr) => Boolean(l.pagoEm?.startsWith(String(ano)));
  const receitas = lancamentos.filter((l) => l.kind === "receita" && doAno(l));
  const despesasDedutiveis = lancamentos.filter((l) => l.kind === "despesa" && l.deductible && doAno(l));
  const anoEntrega = ano + 1;
  const secoes: SecaoGuia[] = [];

  // Empresas pagadoras (PJ), uma linha por CNPJ
  const porFonte = new Map<string, { nome: string; cnpj: string | null; total: number; retido: number }>();
  for (const l of receitas.filter((x) => x.payerType === "pj")) {
    const chave = (l.payerDocument ?? l.payerName ?? "sem identificação").replace(/\D/g, "") || (l.payerName ?? "sem identificação");
    const f = porFonte.get(chave) ?? { nome: l.payerName ?? "Empresa sem nome", cnpj: l.payerDocument, total: 0, retido: 0 };
    f.total += l.valor;
    f.retido += l.retido;
    porFonte.set(chave, f);
  }
  const fontes = [...porFonte.values()].sort((a, b) => b.total - a.total);

  // Mês a mês do que veio de pessoa física (carnê-leão) e do livro-caixa
  const meses = MESES.map((nome, i) => {
    const mes = `${ano}-${String(i + 1).padStart(2, "0")}`;
    const rend = soma(receitas.filter((l) => l.payerType === "pf" && l.pagoEm!.startsWith(mes)));
    const lc = soma(despesasDedutiveis.filter((l) => l.pagoEm!.startsWith(mes)));
    return { nome, rend, lc, estimado: calcularCarneLeao(rend, lc).imposto };
  });
  const totalPf = meses.reduce((t, m) => t + m.rend, 0);
  const totalLivroCaixa = meses.reduce((t, m) => t + m.lc, 0);
  const totalEstimado = meses.reduce((t, m) => t + m.estimado, 0);

  if (regime !== "pj") {
    secoes.push({
      titulo: "Rendimentos recebidos de empresas (pessoa jurídica)",
      explicacao: "O que as empresas pagaram a você pela RT no ano. Faça um lançamento para cada empresa da tabela.",
      passos: [
        ABRIR_PROGRAMA(anoEntrega),
        'Na coluna da esquerda, clique na ficha "Rendimentos Tributáveis Recebidos de Pessoa Jurídica pelo Titular".',
        'Clique no botão "Novo".',
        "Preencha cada campo com o valor da tabela da empresa (abaixo) e clique em \"OK\".",
        "Repita os passos 3 e 4 para cada empresa.",
      ],
      tabelas: fontes.map((f) => ({
        titulo: f.nome,
        linhas: [
          { campo: "CPF/CNPJ da fonte pagadora", valor: f.cnpj ?? "[CNPJ não cadastrado no RTQuímico: pegue no informe da empresa]" },
          { campo: "Nome da fonte pagadora", valor: f.nome },
          { campo: "Rendimentos recebidos de pessoa jurídica", valor: reais(f.total) },
          { campo: "Contribuição previdenciária oficial", valor: reais(0), obs: "O RTQuímico não registra INSS. Se a empresa reteve, use o valor do informe dela." },
          { campo: "Imposto retido na fonte", valor: reais(f.retido) },
          { campo: "13º salário", valor: reais(0), obs: "Não se aplica a autônomo." },
          { campo: "IRRF sobre o 13º salário", valor: reais(0), obs: "Não se aplica a autônomo." },
        ],
      })),
      avisos: fontes.length
        ? ["Cada empresa é obrigada a te mandar o informe de rendimentos até o fim de fevereiro. Compare: se o valor do informe for diferente do RTQuímico, digite o do informe (ou peça à empresa para corrigir)."]
        : [`Nenhum recebimento de empresa lançado em ${ano}. Se você recebeu, lance no Financeiro antes de gerar o guia.`],
    });

    secoes.push({
      titulo: "Recebimentos de pessoas físicas e livro-caixa (carnê-leão)",
      explicacao: "O que você recebeu direto de pessoas físicas no CPF, mês a mês, e as despesas da atividade que reduzem o imposto (livro-caixa).",
      passos: [
        'Na coluna da esquerda, clique na ficha "Rendimentos Tributáveis Recebidos de Pessoa Física e do Exterior pelo Titular".',
        'Se você lançou os meses no Carnê-Leão Web durante o ano: clique no botão "Importar dados do Carnê-Leão", entre com a sua conta gov.br e escolha "Titular". O programa preenche os meses sozinho; confira com a tabela abaixo.',
        'Se você não usou o Carnê-Leão Web: preencha à mão cada mês da ficha. Na coluna "Trabalho não assalariado", o valor de "Recebido de PF"; na coluna "Livro caixa", o valor de "Livro-caixa". Deixe as outras colunas em zero, a não ser que você saiba que se aplicam.',
        'Na coluna "Imposto pago" (ou "DARF pago"), digite o que você pagou de fato em DARF (código 0190) em cada mês. O "Imposto estimado" do RTQuímico serve só para conferir.',
      ],
      tabelas: [],
      meses: meses.map((m) => ({ mes: m.nome, rendimentos: reais(m.rend), livroCaixa: reais(m.lc), estimado: reais(m.estimado) })),
      avisos: [
        `Totais do ano: recebido de pessoas físicas ${reais(totalPf)}, livro-caixa ${reais(totalLivroCaixa)}, imposto estimado ${reais(totalEstimado)}.`,
        "O livro-caixa só vale com comprovante. Guarde os comprovantes por 5 anos: eles estão anexados no Financeiro do RTQuímico.",
        "O livro-caixa não pode ser maior que o que você recebeu de pessoas físicas no mês; o que sobrar passa para o mês seguinte (o Carnê-Leão Web faz essa conta).",
      ],
    });
  } else {
    secoes.push({
      titulo: "Pró-labore e lucros da sua empresa",
      explicacao: "Você recebe pela sua empresa, então na declaração da pessoa física entram o pró-labore e os lucros que a empresa te pagou. Esses valores vêm do informe de rendimentos que o contador da empresa emite, não do RTQuímico.",
      passos: [
        ABRIR_PROGRAMA(anoEntrega),
        'Pró-labore: clique na ficha "Rendimentos Tributáveis Recebidos de Pessoa Jurídica pelo Titular", depois em "Novo". Em "CPF/CNPJ da fonte pagadora" e "Nome da fonte pagadora", os dados da sua empresa; em "Rendimentos recebidos de pessoa jurídica", "Contribuição previdenciária oficial" e "Imposto retido na fonte", os valores do informe. Clique em "OK".',
        'Lucros: clique na ficha "Rendimentos Isentos e Não Tributáveis", depois em "Novo". Em "Tipo de rendimento", escolha "Lucros e dividendos recebidos" (código 09 na versão de 2026). Informe o CNPJ e o nome da sua empresa e o valor do informe. Clique em "OK".',
        "Leve a tabela abaixo ao contador: ela mostra o que cada cliente pagou à sua empresa no ano, pelo RTQuímico.",
      ],
      tabelas: [{
        titulo: "Recebimentos da sua empresa por cliente (para o contador)",
        colunas: ["Cliente", "Recebido no ano", "Observação"],
        linhas: fontes.length ? fontes.map((f) => ({ campo: f.nome + (f.cnpj ? ` (${f.cnpj})` : ""), valor: reais(f.total), obs: f.retido ? `Retido: ${reais(f.retido)}` : undefined })) : [{ campo: "Nenhum recebimento lançado", valor: reais(0) }],
      }],
      avisos: ["Se a empresa é do Simples e você presta o próprio serviço por ela, confirme com o contador se os lucros são isentos antes de declarar."],
    });
  }

  // Comprovação do livro-caixa por categoria
  const porCategoria = new Map<string, number>();
  for (const l of despesasDedutiveis) porCategoria.set(l.category ?? "outros", (porCategoria.get(l.category ?? "outros") ?? 0) + l.valor);
  if (regime !== "pj" && porCategoria.size) {
    secoes.push({
      titulo: "Detalhe do livro-caixa (para conferência e comprovação)",
      explicacao: "Não vai para nenhum campo novo: é o detalhe do total da coluna \"Livro caixa\". Mostre ao contador ou guarde com os comprovantes.",
      passos: [],
      tabelas: [{ titulo: "Despesas dedutíveis pagas no ano, por categoria", colunas: ["Categoria", "Total pago", ""], linhas: [...porCategoria.entries()].map(([c, v]) => ({ campo: CATEGORIAS_LIVRO_CAIXA[c] ?? c, valor: reais(v) })) }],
      avisos: [],
    });
  }

  secoes.push({
    titulo: "Para terminar",
    explicacao: "Antes de entregar, confira tudo.",
    passos: [
      'No menu do programa, clique em "Verificar Pendências" e resolva o que aparecer.',
      'Clique em "Entregar Declaração" e guarde o recibo.',
      "Na dúvida sobre qualquer campo, leve este guia e os informes das empresas ao contador.",
    ],
    tabelas: [],
    avisos: [`O prazo de entrega costuma ir de março ao fim de maio de ${anoEntrega}. Confira as datas oficiais no site da Receita.`],
  });

  return {
    ano, anoEntrega, quimico, regime,
    resumo: regime === "pj"
      ? [["Recebido pela sua empresa no ano", reais(soma(receitas))], ["Clientes", String(fontes.length)]]
      : [["Recebido de empresas", reais(soma(receitas.filter((l) => l.payerType === "pj")))], ["Imposto retido pelas empresas", reais(soma(receitas.filter((l) => l.payerType === "pj"), "retido"))], ["Recebido de pessoas físicas", reais(totalPf)], ["Livro-caixa (despesas dedutíveis)", reais(totalLivroCaixa)], ["Carnê-leão estimado no ano", reais(totalEstimado)]],
    secoes,
    emitidoEm: hoje.toLocaleString("pt-BR"),
  };
}
