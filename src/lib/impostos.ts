// Estimativa do carnê-leão (IR mensal de quem recebe de pessoa física no CPF). É estimativa para o químico se
// planejar; o valor que vale é o do Carnê-Leão Web (e-CAC). Regras de 2026:
// - tabela progressiva mensal em vigor desde maio/2025;
// - desconto simplificado mensal de R$ 607,20 (25% da faixa isenta), no lugar das deduções quando for maior;
// - redução da Lei 15.270/2025: zera o imposto até R$ 5.000 de rendimento; de R$ 5.000,01 a R$ 7.350 abate
//   R$ 978,62 − 0,133145 × rendimento. Conferido em 24/10/2026 (exemplo da Receita: R$ 6.000 → R$ 394,54).
// Mudou a lei? Troque as constantes abaixo e o teste do exemplo.

const FAIXAS: Array<{ ate: number; aliquota: number; deduzir: number }> = [
  { ate: 2428.8, aliquota: 0, deduzir: 0 },
  { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
  { ate: Infinity, aliquota: 0.275, deduzir: 908.73 },
];
export const DESCONTO_SIMPLIFICADO = 607.2;
const REDUCAO = { isentoAte: 5000, ate: 7350, fixo: 978.62, fator: 0.133145 };

const centavos = (valor: number) => Math.round(valor * 100) / 100;

export interface CarneLeao {
  rendimentos: number;
  deducoes: number;
  usouSimplificado: boolean;
  base: number;
  impostoTabela: number;
  reducao: number;
  imposto: number;
}

/** Rendimentos de pessoa física do mês e despesas dedutíveis (livro-caixa) pagas no mês, em reais. */
export function calcularCarneLeao(rendimentos: number, livroCaixa: number): CarneLeao {
  const usouSimplificado = DESCONTO_SIMPLIFICADO > livroCaixa;
  const deducoes = Math.min(rendimentos, usouSimplificado ? DESCONTO_SIMPLIFICADO : livroCaixa);
  const base = Math.max(0, rendimentos - deducoes);
  const faixa = FAIXAS.find((f) => base <= f.ate)!;
  const impostoTabela = centavos(Math.max(0, base * faixa.aliquota - faixa.deduzir));
  const reducao = rendimentos <= REDUCAO.isentoAte
    ? impostoTabela
    : rendimentos <= REDUCAO.ate
      ? Math.min(impostoTabela, centavos(REDUCAO.fixo - REDUCAO.fator * rendimentos))
      : 0;
  return { rendimentos, deducoes, usouSimplificado, base: centavos(base), impostoTabela, reducao, imposto: centavos(impostoTabela - reducao) };
}

/** O DARF do carnê-leão vence no último dia útil do mês seguinte (feriados não entram na conta). */
export function vencimentoDarf(ano: number, mes: number): Date {
  const dia = new Date(ano, mes + 2, 0); // último dia do mês seguinte (mes é 0-11)
  while (dia.getDay() === 0 || dia.getDay() === 6) dia.setDate(dia.getDate() - 1);
  return dia;
}
