// O que cada papel (`app_role`) vê no painel. Desde 24/10/2026 o produto atende só químicos: o papel
// `tenant_external_client` (empresa contratante) continua no banco, mas o acesso dele fica desligado (ver acessoDesligado).
// O menu, o redirecionamento por URL e a página inicial saem daqui.
// É regra de tela: quem protege os dados é o RLS do banco.
import type { Page } from "../types";

export type Papel = "superadmin" | "tenant_admin" | "tenant_member" | "tenant_external_client";

export const ROTULO_PAPEL: Record<Papel, string> = {
  superadmin: "Gestão do produto",
  tenant_admin: "Responsável técnico · titular",
  tenant_member: "Responsável técnico · equipe",
  tenant_external_client: "Empresa contratante",
};

const PAGINAS_DO_QUIMICO: Page[] = ["dashboard", "rts", "alertas", "radar", "acoes", "checklist", "pops", "financeiro"];

const PAGINAS: Record<Papel, Page[]> = {
  // Gestor do RTQuímico: não é químico, não abre o painel de RTs; cuida de quem usa a plataforma
  superadmin: ["plataforma", "perfil"],
  tenant_admin: [...PAGINAS_DO_QUIMICO, "equipe", "assinatura", "perfil"],
  tenant_member: [...PAGINAS_DO_QUIMICO, "assinatura", "perfil"],
  tenant_external_client: ["perfil"],
};

/** Papel conhecido ou `null` (modo demonstração, perfil ainda carregando ou valor inesperado). */
export function papelDe(role: string | null | undefined): Papel | null {
  return role && role in PAGINAS ? (role as Papel) : null;
}

/** Sem papel (demo) o painel é o do químico da equipe. */
export function paginasDoPapel(papel: Papel | null): Page[] {
  return PAGINAS[papel ?? "tenant_member"];
}

export function paginaInicial(papel: Papel | null): Page {
  return paginasDoPapel(papel)[0];
}

/** Empresa contratante: papel guardado para o futuro, sem acesso ao painel por enquanto. */
export const acessoDesligado = (papel: Papel | null) => papel === "tenant_external_client";

/** Com a assinatura bloqueada, o químico só abre estas páginas (os dados ficam guardados). */
export const PAGINAS_SEM_ASSINATURA: Page[] = ["assinatura", "perfil"];

export const ehQuimico = (papel: Papel | null) => papel !== "superadmin" && papel !== "tenant_external_client";
