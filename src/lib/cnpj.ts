// Consulta de CNPJ para preencher a empresa no cadastro de RT. Direto do navegador: a BrasilAPI aceita CORS e
// o limite fica por IP de cada químico. Reserva: CNPJ.ws pública (3 consultas por minuto por IP; dado pode ter
// semanas de atraso). Nenhuma das duas tem garantia de serviço, então falhar aqui nunca impede o cadastro manual.

export interface DadosCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacao: string;
  ativa: boolean;
  cnae: string | null;
  cnaeDescricao: string | null;
  municipio: string | null;
  uf: string | null;
}

export const soDigitos = (valor: string) => valor.replace(/\D/g, "");

export function formatarCnpj(valor: string) {
  const d = soDigitos(valor).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

/** Dígitos verificadores do CNPJ (evita consultar número digitado errado). */
export function cnpjValido(valor: string) {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const digito = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = base.split("").reduce((soma, n, i) => soma + Number(n) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(d.slice(0, 12)) === Number(d[12]) && digito(d.slice(0, 13)) === Number(d[13]);
}

export const formatarCnae = (codigo: string | number | null | undefined) => {
  const d = codigo == null ? "" : String(codigo).replace(/\D/g, "").padStart(7, "0");
  return d.length === 7 ? `${d.slice(0, 4)}-${d[4]}/${d.slice(5)}` : null;
};

type Json = Record<string, unknown>;
const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export function deBrasilApi(j: Json): DadosCnpj {
  const situacao = texto(j.descricao_situacao_cadastral) ?? "DESCONHECIDA";
  return {
    cnpj: formatarCnpj(String(j.cnpj ?? "")),
    razaoSocial: texto(j.razao_social) ?? "",
    nomeFantasia: texto(j.nome_fantasia),
    situacao,
    ativa: situacao.toUpperCase() === "ATIVA",
    cnae: formatarCnae(j.cnae_fiscal as string | number | null),
    cnaeDescricao: texto(j.cnae_fiscal_descricao),
    municipio: texto(j.municipio),
    uf: texto(j.uf),
  };
}

export function deCnpjWs(j: Json): DadosCnpj {
  const e = (j.estabelecimento ?? {}) as Json;
  const atividade = (e.atividade_principal ?? {}) as Json;
  const situacao = texto(e.situacao_cadastral) ?? "DESCONHECIDA";
  return {
    cnpj: formatarCnpj(String(e.cnpj ?? "")),
    razaoSocial: texto(j.razao_social) ?? "",
    nomeFantasia: texto(e.nome_fantasia),
    situacao: situacao.toUpperCase(),
    ativa: situacao.toUpperCase() === "ATIVA",
    cnae: formatarCnae(atividade.id as string | null) ?? texto(atividade.subclasse),
    cnaeDescricao: texto(atividade.descricao),
    municipio: texto((e.cidade as Json | undefined)?.nome),
    uf: texto((e.estado as Json | undefined)?.sigla),
  };
}

const cache = new Map<string, DadosCnpj>();

/** null quando o CNPJ não existe; lança erro quando as duas consultas falham (sem internet, fora do ar, limite). */
export async function consultarCnpj(valor: string): Promise<DadosCnpj | null> {
  const d = soDigitos(valor);
  const guardado = cache.get(d);
  if (guardado) return guardado;
  const fontes: Array<[string, (j: Json) => DadosCnpj]> = [
    [`https://brasilapi.com.br/api/cnpj/v1/${d}`, deBrasilApi],
    [`https://publica.cnpj.ws/cnpj/${d}`, deCnpjWs],
  ];
  let naoExiste = false;
  for (const [url, ler] of fontes) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (r.status === 404) { naoExiste = true; continue; }
      if (!r.ok) continue;
      const dados = ler(await r.json());
      if (!dados.razaoSocial) continue;
      cache.set(d, dados);
      return dados;
    } catch {
      // tenta a próxima fonte
    }
  }
  if (naoExiste) return null;
  throw new Error("consulta de CNPJ indisponível");
}
