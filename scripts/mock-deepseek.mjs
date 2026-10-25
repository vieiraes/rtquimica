// Mock da DeepSeek (POST /chat/completions) para o desenvolvimento local: responde na hora, sem custo.
// Sobe pelo portal infraestrutura-local em localhost:5331. Para testar falhas, escreva na anotação:
// "[erro-ia]" → HTTP 500; "[fora-do-formato]" → resposta que não é JSON.
import { createServer } from "node:http";

const PORTA = Number(process.env.PORT ?? 5331);
let chamadas = 0;

const json = (res, status, corpo) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(corpo)); };

createServer((req, res) => {
  if (req.url === "/__estado") return json(res, 200, { chamadas });
  if (req.method !== "POST" || req.url !== "/chat/completions") return json(res, 404, { error: { message: "Not Found" } });
  if (!(req.headers.authorization ?? "").startsWith("Bearer ")) return json(res, 401, { error: { message: "Authentication Fails" } });
  let dados = "";
  req.on("data", (c) => (dados += c));
  req.on("end", () => {
    chamadas += 1;
    const corpo = JSON.parse(dados || "{}");
    const usuario = String(corpo.messages?.findLast?.((m) => m.role === "user")?.content ?? "");
    const operacao = String(corpo.messages?.[0]?.content ?? "").match(/^Operação: (\w+)/)?.[1];
    const responder = (conteudo) => json(res, 200, {
      id: `mock-${chamadas}`, object: "chat.completion", model: corpo.model,
      choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify(conteudo) }, finish_reason: "stop" }],
      usage: { prompt_tokens: 400, completion_tokens: 200, total_tokens: 600 },
    });
    if (operacao === "radar_explicar") {
      // Cita a primeira empresa da lista, como faria a análise real
      const empresa = usuario.match(/^- ([^|]+?) \|/m)?.[1];
      const titulo = usuario.match(/Título: (.+)/)?.[1] ?? "a novidade";
      return responder({
        resumo: `Resumo do mock local: "${titulo}" foi publicada pelo órgão. Leia o texto oficial para os detalhes.`,
        relevancia: empresa ? "media" : "nenhuma",
        empresas: empresa ? [{ nome: empresa, motivo: "Atividade relacionada ao tema (análise do mock)." }, { nome: "Empresa Inventada SA", motivo: "não deveria aparecer" }] : [],
        acao_sugerida: empresa ? `Ler o texto oficial e conferir o impacto na ${empresa}.` : null,
      });
    }
    if (operacao === "pop_adaptar") {
      const modelo = usuario.match(/Modelo: (.+?) \(/)?.[1] ?? "Procedimento";
      const empresa = usuario.match(/Empresa: ([^|]+?) \|/)?.[1] ?? "a empresa";
      return responder({
        titulo: `${modelo} · ${empresa}`,
        objetivo: `Padronizar ${modelo.toLowerCase()} na ${empresa} (texto do mock local).`,
        aplicacao: `Aplica-se às atividades de ${modelo.toLowerCase()} da ${empresa}.`,
        responsabilidades: ["Responsável técnico: aprovar e revisar este POP.", "Operador: executar e registrar."],
        materiais: ["Frascos identificados", "EPI adequado [confirmar: conforme FISPQ]"],
        procedimento: ["Separe os materiais e confira a identificação.", "Execute a etapa principal conforme o modelo.", "Registre o resultado na planilha."],
        registros: ["Planilha de registro assinada pelo operador"],
        pontos_a_confirmar: ["EPI exigido pela FISPQ do produto"],
      });
    }
    const anotacao = (usuario.match(/<<<\n([\s\S]*)\n>>>/)?.[1] ?? usuario).trim();
    const categoria = usuario.match(/Categoria escolhida: (.+)/)?.[1]?.trim() ?? "Outro";
    if (anotacao.includes("[erro-ia]")) return json(res, 500, { error: { message: "mock: erro forçado" } });
    const conteudo = anotacao.includes("[fora-do-formato]")
      ? "Claro! Aqui está o registro:"
      : JSON.stringify({
          texto: `Realizei a atividade descrita a seguir. ${anotacao.charAt(0).toUpperCase()}${anotacao.slice(1).replace(/\s+/g, " ")}${/[.!?]$/.test(anotacao) ? "" : "."} (texto do mock local)`,
          categoria,
          avisos: ["Não informou quem acompanhou a visita (aviso do mock)."],
        });
    json(res, 200, {
      id: `mock-${chamadas}`,
      object: "chat.completion",
      model: corpo.model,
      choices: [{ index: 0, message: { role: "assistant", content: conteudo }, finish_reason: "stop" }],
      usage: { prompt_tokens: 300 + usuario.length / 4 | 0, completion_tokens: 120, total_tokens: 420 + usuario.length / 4 | 0 },
    });
  });
}).listen(PORTA, () => console.log(`mock da DeepSeek em http://localhost:${PORTA}`));
