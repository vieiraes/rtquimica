import { CheckCircle2, CreditCard, RefreshCw } from "lucide-react";
import { PanelHeader } from "./primitives";
import { checkoutUrl, linkCheckout, situacao, type Assinatura as DadosAssinatura } from "../lib/assinatura";

const INCLUI = [
  "Até 6 RTs ativas, com alertas de vencimento e comunicação ao CRQ",
  "Diário técnico com evidências e relatório em PDF",
  "Financeiro com carnê-leão e guia do imposto de renda",
  "Radar regulatório, IA no diário, nos POPs e no radar",
  "Google Agenda e equipe do escritório",
];

/** Assinatura do escritório: o titular assina pela Kiwify; quem é da equipe só vê a situação. */
export function Assinatura({ assinatura, titular, email, tenantId, onAtualizar }: {
  assinatura: DadosAssinatura | null;
  titular: boolean;
  email: string | null;
  tenantId?: string;
  onAtualizar: () => void;
}) {
  const s = situacao(assinatura);
  const ativa = assinatura?.status === "active" && s.liberado;
  const fimTeste = assinatura?.trialEndsAt ? new Date(assinatura.trialEndsAt).toLocaleDateString("pt-BR") : null;
  const pagoAte = assinatura?.paidUntil ? new Date(assinatura.paidUntil).toLocaleDateString("pt-BR") : null;

  return (
    <section className="assinatura-grid">
      <article className={`panel assinatura-status ${s.liberado ? "" : "bloqueada"}`}>
        <PanelHeader title="Situação do escritório" subtitle={s.mensagem || "Uso liberado."} />
        <dl className="fin-calc assinatura-dados">
          <div><dt>Situação</dt><dd>{ativa ? "Assinatura ativa" : assinatura?.status === "trial" ? (s.liberado ? "Teste grátis" : "Teste encerrado") : assinatura?.status === "past_due" ? "Pagamento pendente" : assinatura?.status === "canceled" ? "Cancelada" : "Liberado"}</dd></div>
          {assinatura?.status === "trial" && fimTeste && <div><dt>Teste grátis até</dt><dd>{fimTeste}</dd></div>}
          {pagoAte && assinatura?.status !== "trial" && <div><dt>Pago até</dt><dd>{pagoAte}</dd></div>}
        </dl>
        {!s.liberado && <p className="fin-aviso">Seus dados continuam guardados. Assim que o pagamento for confirmado, o acesso volta inteiro.</p>}
        {titular ? (
          checkoutUrl && tenantId ? (
            <div className="assinatura-acoes">
              {!ativa && <a className="button primary large" href={linkCheckout(checkoutUrl, email, tenantId)} target="_blank" rel="noopener noreferrer"><CreditCard size={18} /> Assinar por R$ 79/mês</a>}
              <button className="button secondary" onClick={onAtualizar}><RefreshCw size={16} /> Já paguei, atualizar</button>
            </div>
          ) : <p className="form-hint">A assinatura ainda não está aberta: o uso do RTQuímico está liberado.</p>
        ) : <p className="form-hint">Quem assina é o titular do escritório. Se o acesso estiver bloqueado, fale com ele.</p>}
        {titular && checkoutUrl && <p className="form-hint">O pagamento é feito na Kiwify (cartão, Pix ou boleto). A confirmação chega aqui sozinha em alguns minutos; depois clique em "Já paguei, atualizar". Para cancelar ou trocar o cartão, fale com o suporte do RTQuímico.</p>}
      </article>
      <article className="panel assinatura-plano">
        <span className="category">PLANO PROFISSIONAL</span>
        <p className="pricing-price">R$ 79<small>/mês</small></p>
        <ul>{INCLUI.map((i) => <li key={i}><CheckCircle2 size={17} /> {i}</li>)}</ul>
      </article>
    </section>
  );
}
