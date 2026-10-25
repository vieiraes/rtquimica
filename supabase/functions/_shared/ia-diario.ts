// Operação "diario_redigir": a anotação solta da visita vira o registro formal do diário técnico.
// Código puro (sem Deno): a Edge Function usa e o Vitest testa. O prompt mora aqui, no servidor; o navegador manda só os dados.

export const CATEGORIAS_DIARIO = ["Visita técnica", "Coleta", "Análise", "Laudo", "Orientação", "Outro"] as const;
export type CategoriaDiario = (typeof CATEGORIAS_DIARIO)[number];

export interface EntradaDiario {
  anotacao: string;
  empresa: string;
  categoria: CategoriaDiario;
}

export interface RascunhoDiario {
  texto: string;
  categoria: CategoriaDiario;
  avisos: string[];
}

const LIMITE_ANOTACAO = 4000;

/** Confere o que veio do navegador. Devolve a mensagem de erro ou null. */
export function validarEntrada(dados: unknown): { ok: true; entrada: EntradaDiario } | { ok: false; erro: string } {
  const d = (dados ?? {}) as Record<string, unknown>;
  const anotacao = typeof d.anotacao === "string" ? d.anotacao.trim() : "";
  const empresa = typeof d.empresa === "string" ? d.empresa.trim().slice(0, 200) : "";
  const categoria = CATEGORIAS_DIARIO.includes(d.categoria as CategoriaDiario) ? (d.categoria as CategoriaDiario) : "Outro";
  if (anotacao.length < 10) return { ok: false, erro: "Escreva pelo menos uma frase sobre o que foi feito." };
  if (anotacao.length > LIMITE_ANOTACAO) return { ok: false, erro: `A anotação passa de ${LIMITE_ANOTACAO} caracteres.` };
  if (!empresa) return { ok: false, erro: "Escolha a empresa." };
  return { ok: true, entrada: { anotacao, empresa, categoria } };
}

const SISTEMA = `Operação: diario_redigir.
Você ajuda um químico responsável técnico (RT) no Brasil a registrar o diário técnico, que serve de prova da atuação dele perante o CRQ e a empresa.
Transforme a anotação solta em um registro formal, em português do Brasil, na primeira pessoa ("Realizei", "Orientei").
Regras:
- Use só o que está na anotação. Não invente medições, resultados, normas, nomes, datas ou providências.
- Mantenha números, unidades e nomes exatamente como vieram.
- Organize em frases claras: o que foi feito, o que foi constatado, o que foi orientado e o que ficou pendente (só os itens que existirem na anotação).
- Sem saudação, sem título, sem markdown. Até 1.500 caracteres.
- Em "avisos", liste em frases curtas o que faltou e costuma importar no diário (ex.: "Não informou quem recebeu a orientação."). Lista vazia se nada faltar.
- Em "categoria", escolha a que melhor descreve a ação entre: ${CATEGORIAS_DIARIO.join(", ")}.
Responda só com JSON no formato {"texto": "...", "categoria": "...", "avisos": ["..."]}.`;

export function montarMensagens(e: EntradaDiario) {
  return [
    { role: "system", content: SISTEMA },
    // A anotação vai delimitada: o que estiver dentro é dado, não instrução
    { role: "user", content: `Empresa: ${e.empresa}\nCategoria escolhida: ${e.categoria}\nAnotação (entre as marcas):\n<<<\n${e.anotacao}\n>>>` },
  ];
}

/** Valida a resposta da IA. Resposta fora do formato conta como falha (a chamada não é cobrada). */
export function lerResposta(conteudo: string, categoriaPadrao: CategoriaDiario): RascunhoDiario | null {
  let json: unknown;
  try {
    json = JSON.parse(conteudo);
  } catch {
    return null;
  }
  const r = json as Record<string, unknown>;
  const texto = typeof r.texto === "string" ? r.texto.trim() : "";
  if (texto.length < 10 || texto.length > 3000) return null;
  const categoria = CATEGORIAS_DIARIO.includes(r.categoria as CategoriaDiario) ? (r.categoria as CategoriaDiario) : categoriaPadrao;
  const avisos = Array.isArray(r.avisos) ? r.avisos.filter((a): a is string => typeof a === "string" && a.trim() !== "").map((a) => a.trim().slice(0, 200)).slice(0, 5) : [];
  return { texto, categoria, avisos };
}

/** Corpo da chamada (Chat Completions). Sem raciocínio: tarefa de redação, mais rápida e barata; saída em JSON. */
export function corpoDeepseek(model: string, mensagens: unknown[]) {
  return { model, messages: mensagens, max_tokens: 1200, temperature: 0.3, thinking: { type: "disabled" }, response_format: { type: "json_object" } };
}
