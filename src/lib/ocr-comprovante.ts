// Leitura de comprovante por foto: o OCR (Tesseract, no navegador, sem serviço pago) devolve o texto e aqui saem
// valor, data, CNPJ e uma sugestão de categoria. É sugestão: o químico confere antes de salvar.

export interface DadosComprovante {
  valor: number | null;
  data: string | null; // AAAA-MM-DD
  cnpj: string | null;
  categoria: string | null;
  descricao: string | null;
}

const PALAVRAS: Array<[RegExp, string]> = [
  [/conselho regional de qu[ií]mica|\bcrq\b|anuidade/i, "anuidade_crq"],
  [/curso|congresso|semin[aá]rio|inscri[cç][aã]o|treinamento|workshop/i, "curso"],
  [/combust[ií]vel|gasolina|etanol|diesel|posto|estacionamento|ped[aá]gio|uber|99 ?pop|t[aá]xi/i, "deslocamento"],
  [/cont[aá]bil|contabilidade|contador/i, "contador"],
  [/aluguel|energia|eletricidade|internet|telefon|condom[ií]nio|[aá]gua e esgoto/i, "escritorio"],
  [/reagente|vidraria|laborat[oó]rio|material|papelaria|epi\b|luva|jaleco/i, "material"],
];

const numero = (t: string) => Number(t.replace(/\./g, "").replace(",", "."));

/** Valor: o da linha de total, se houver; senão o maior valor em reais do texto. */
function valorDe(texto: string): number | null {
  const linhas = texto.split(/\n/);
  const moeda = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})\b/g;
  for (const linha of linhas) {
    if (/total|valor (a )?pag|valor pago|valor cobrado/i.test(linha)) {
      const m = [...linha.matchAll(moeda)].map((x) => numero(x[1]));
      if (m.length) return Math.max(...m);
    }
  }
  const todos = [...texto.matchAll(moeda)].map((x) => numero(x[1])).filter((v) => v > 0);
  return todos.length ? Math.max(...todos) : null;
}

function dataDe(texto: string, hoje: Date): string | null {
  for (const m of texto.matchAll(/\b(\d{2})[/.-](\d{2})[/.-](\d{2}|\d{4})\b/g)) {
    const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3].length === 2 ? `20${m[3]}` : m[3])];
    const data = new Date(Date.UTC(a, mes - 1, d));
    // Data impossível ou no futuro não serve (pode ser validade, vencimento de cartão etc.)
    if (data.getUTCDate() !== d || data.getUTCMonth() !== mes - 1 || data.getTime() > hoje.getTime() + 86_400_000 || a < 2000) continue;
    return data.toISOString().slice(0, 10);
  }
  return null;
}

export function lerComprovante(texto: string, hoje = new Date()): DadosComprovante {
  const cnpj = texto.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/)?.[0] ?? null;
  const categoria = PALAVRAS.find(([re]) => re.test(texto))?.[1] ?? null;
  // Descrição: a primeira linha com letras de verdade (costuma ser o nome do estabelecimento)
  const descricao = texto.split(/\n/).map((l) => l.trim()).find((l) => /[a-zà-ú]{3,}/i.test(l) && l.length >= 4 && !/cnpj|cpf|cupom|nota fiscal|data|hora/i.test(l)) ?? null;
  return { valor: valorDe(texto), data: dataDe(texto, hoje), cnpj, categoria, descricao: descricao ? descricao.slice(0, 80) : null };
}

/** Roda o OCR em português no navegador. O motor e o idioma são baixados na primeira vez (precisa de internet). */
export async function ocrDaImagem(arquivo: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  try {
    const { data } = await worker.recognize(arquivo);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
