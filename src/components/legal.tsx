// Política de Privacidade, Termos de Uso e Política de Cookies. Abertas com ou sem login.
// O texto descreve o que o app faz hoje: mudou a coleta, um fornecedor ou o preço? Atualize aqui e troque VERSAO_TERMOS.
import { ArrowLeft } from "lucide-react";
import { useState, type ReactNode } from "react";
import { EMPRESA, VERSAO_TERMOS_EXTENSO } from "../lib/legal";
import { ROTA_COOKIES, ROTA_PRIVACIDADE, ROTA_TERMOS, type TipoLegal } from "../lib/rotas";
import { abrirAvisoCookies } from "../lib/cookies";
import { Brand, LinkInterno } from "./primitives";
import { SiteFooter } from "./site-footer";

type Tipo = TipoLegal;

const TITULOS: Record<Tipo, string> = {
  privacidade: "Política de Privacidade",
  termos: "Termos de Uso",
  cookies: "Política de Cookies",
};

const Contato = () => <a href={`mailto:${EMPRESA.contato}`}>{EMPRESA.contato}</a>;

function Identificacao() {
  return (
    <dl className="legal-identificacao">
      <div><dt>Serviço</dt><dd>{EMPRESA.produto} (rtquimico.web.app)</dd></div>
      <div><dt>CNPJ</dt><dd>{EMPRESA.cnpj}</dd></div>
      <div><dt>Sede</dt><dd>{EMPRESA.cidade}</dd></div>
      <div><dt>Desenvolvimento e operação</dt><dd>{EMPRESA.desenvolvedora}</dd></div>
      <div><dt>Contato e encarregado de dados (LGPD)</dt><dd><Contato /></dd></div>
    </dl>
  );
}

function Privacidade() {
  return (
    <>
      <p>Esta política explica quais dados pessoais o {EMPRESA.produto} trata, para quê, com quem compartilha e como você exerce os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).</p>
      <Identificacao />

      <h2>1. Dados que tratamos</h2>
      <h3>Sua conta</h3>
      <ul>
        <li>Nome, e-mail e senha. A senha é guardada cifrada pelo serviço de autenticação; ninguém da equipe consegue lê-la.</li>
        <li>Número e UF do registro no CRQ, telefone e foto do perfil, quando você informa.</li>
        <li>Se você entra com o Google: nome, e-mail e foto da sua conta Google.</li>
        <li>Data e versão em que você aceitou estes termos e esta política.</li>
      </ul>
      <h3>O que você cadastra no trabalho de responsável técnico</h3>
      <ul>
        <li>Empresas em que você é RT: razão social, nome fantasia, CNPJ, CNAE, cidade, documentos de responsabilidade (TRT, ART, CRT), vigência e protocolos de comunicação ao CRQ.</li>
        <li>Registros do diário técnico, fotos e laudos anexados, checklists e POPs.</li>
        <li>Financeiro: honorários e despesas, nome e CPF ou CNPJ de quem paga, comprovantes e seu regime de recebimento, usados para calcular o carnê-leão e montar o guia do IR.</li>
        <li>Equipe: nome e e-mail das pessoas que você convida.</li>
      </ul>
      <h3>Uso do serviço</h3>
      <ul>
        <li>Assinatura: situação, e-mail da compra e código da assinatura, que a Kiwify nos envia. Não recebemos nem guardamos dados do seu cartão.</li>
        <li>Google Agenda, se você conectar: o e-mail da conta Google e uma autorização para criar eventos apenas na agenda "RTQuímico". Não lemos as suas outras agendas.</li>
        <li>Inteligência artificial: data, tipo de operação e quantidade de texto processado, para controlar o limite mensal.</li>
        <li>Registros técnicos de acesso (endereço IP, data e navegador), mantidos pelos provedores de infraestrutura para segurança.</li>
      </ul>

      <h2>2. Para que usamos e com qual base legal</h2>
      <ul>
        <li><b>Prestar o serviço que você contratou</b> (execução de contrato, art. 7º, V): manter sua conta, mostrar prazos e alertas, gerar relatórios, PDFs, o carnê-leão e o guia do IR, sincronizar a Google Agenda quando você pede.</li>
        <li><b>Cobrança da assinatura</b> (execução de contrato): liberar ou suspender o acesso conforme a situação do pagamento.</li>
        <li><b>Segurança e prevenção de abuso</b> (legítimo interesse, art. 7º, IX): registros de acesso e limites de uso.</li>
        <li><b>Cumprir obrigações legais</b> (art. 7º, II): guardar registros de cobrança e atender a ordens de autoridades.</li>
      </ul>
      <p>Não vendemos dados, não usamos seus dados para publicidade e não montamos perfil de marketing.</p>

      <h2>3. Dados de outras pessoas que você cadastra</h2>
      <p>Quando você cadastra dados de terceiros (pessoas de contato das empresas, quem paga seus honorários, colegas convidados), você decide o que entra e para quê; o {EMPRESA.produto} trata esses dados só para executar o serviço, em seu nome. Cadastre apenas o necessário para a sua atuação profissional.</p>

      <h2>4. Com quem compartilhamos</h2>
      <p>Só com os fornecedores necessários para o serviço funcionar, cada um limitado ao que precisa:</p>
      <ul>
        <li><b>Supabase</b>: banco de dados, login, arquivos e funções do servidor. Servidores nos Estados Unidos.</li>
        <li><b>Google Firebase</b>: entrega das páginas do site.</li>
        <li><b>Google</b>: login com o Google e Google Agenda, apenas se você usar esses recursos.</li>
        <li><b>DeepSeek</b>: só quando você clica em "Redigir com IA", "Explicar com IA" ou "Gerar rascunho com IA". Vão o texto da sua anotação ou do modelo e o nome, o CNAE e a cidade da empresa; seu nome, e-mail e CPF não vão. Servidores fora do Brasil.</li>
        <li><b>Kiwify</b>: pagamento da assinatura. A compra é feita no site da Kiwify, sob a política dela.</li>
        <li><b>BrasilAPI e CNPJ.ws</b>: o CNPJ que você digita, para preencher os dados públicos da empresa na Receita Federal.</li>
        <li><b>Autoridades públicas</b>, quando houver obrigação legal ou ordem judicial.</li>
      </ul>

      <h2>5. Transferência internacional</h2>
      <p>Supabase, Google e DeepSeek processam dados fora do Brasil. A transferência ocorre para executar o contrato com você (art. 33, IX, da LGPD) e com fornecedores que adotam medidas de segurança, como conexão cifrada e controle de acesso.</p>

      <h2>6. Por quanto tempo guardamos</h2>
      <ul>
        <li>Enquanto a sua conta existir.</li>
        <li>Depois do pedido de exclusão, apagamos os dados em até 30 dias, exceto os registros de cobrança, guardados pelo prazo que a lei exigir.</li>
        <li>Se a assinatura acabar e você não pedir a exclusão, os dados ficam guardados para quando você voltar, e você pode pedir a exclusão a qualquer momento.</li>
      </ul>

      <h2>7. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados; acesso a eles; correção; anonimização, bloqueio ou eliminação do que for desnecessário; portabilidade; informação sobre com quem compartilhamos; e revisão de decisões automatizadas.</p>
      <ul>
        <li><b>Baixar seus dados</b>: no painel, em Configurações → Privacidade e dados → "Baixar meus dados".</li>
        <li><b>Corrigir</b>: em Configurações, ou na própria tela de cada cadastro.</li>
        <li><b>Excluir a conta</b>: em Configurações → Privacidade e dados → "Pedir exclusão da conta", ou por e-mail para <Contato />.</li>
      </ul>
      <p>Respondemos em até 15 dias. Se não ficar satisfeito, você pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.</p>

      <h2>8. Segurança</h2>
      <p>Cada escritório só enxerga os próprios dados (isolamento no banco de dados), documentos e fotos ficam em pastas privadas, toda conexão é cifrada (HTTPS) e as autorizações do Google ficam só no servidor. Nenhum sistema é totalmente imune; se houver um incidente que possa causar risco relevante, avisamos você e a ANPD.</p>

      <h2>9. Cookies</h2>
      <p>Usamos apenas armazenamento essencial no navegador. Os detalhes estão na <LinkInterno to={ROTA_COOKIES}>Política de Cookies</LinkInterno>.</p>

      <h2>10. Menores de idade</h2>
      <p>O serviço é destinado a profissionais da Química maiores de 18 anos.</p>

      <h2>11. Mudanças nesta política</h2>
      <p>Quando houver mudança relevante, atualizamos a data no topo e pedimos o seu aceite de novo ao entrar no painel.</p>
    </>
  );
}

function Termos() {
  return (
    <>
      <p>Estes termos regem o uso do {EMPRESA.produto}. Ao criar a conta, você declara que leu e aceita estes Termos e a <LinkInterno to={ROTA_PRIVACIDADE}>Política de Privacidade</LinkInterno>.</p>
      <Identificacao />

      <h2>1. O serviço</h2>
      <p>O {EMPRESA.produto} é uma ferramenta de organização para profissionais da Química que atuam como responsáveis técnicos: cadastro das responsabilidades técnicas, prazos e alertas, acompanhamento da comunicação ao CRQ, diário técnico, checklists, modelos de POP, radar de normas e controle financeiro dos honorários.</p>

      <h2>2. O que o serviço não faz</h2>
      <ul>
        <li>Não substitui o seu julgamento profissional nem as suas obrigações perante o CRQ e o CFQ. A responsabilidade técnica continua sendo sua.</li>
        <li>Os POPs são modelos de referência: confira a versão vigente de cada norma e adapte à empresa antes de assinar.</li>
        <li>O texto gerado por inteligência artificial é sempre um rascunho; você revisa antes de salvar e responde pelo que salvar.</li>
        <li>O Radar reúne publicações de fontes oficiais, mas pode haver atraso ou falha na coleta; consulte o texto original.</li>
        <li>Alertas, carnê-leão e guia do IR dependem dos dados que você informa. O guia do IR orienta o preenchimento, não substitui um contador.</li>
        <li>O serviço não envia comunicações ao CRQ por você: você registra o que comunicou e o protocolo.</li>
      </ul>

      <h2>3. Conta</h2>
      <ul>
        <li>Para usar, você precisa ser maior de 18 anos e informar dados verdadeiros.</li>
        <li>Você é responsável pela guarda da senha e pelo que é feito na sua conta. Avise-nos em <Contato /> se suspeitar de uso indevido.</li>
        <li>O titular do escritório pode convidar pessoas da equipe e responde pelo uso que elas fazem.</li>
        <li>Cada escritório pode manter até 6 responsabilidades técnicas ativas ao mesmo tempo.</li>
      </ul>

      <h2>4. Assinatura, teste e cancelamento</h2>
      <ul>
        <li>Plano único de R$ 79,90 por mês, por escritório, cobrado pela Kiwify. A equipe do escritório está incluída.</li>
        <li>Os primeiros 7 dias, contados da criação da conta, são grátis e não pedem cartão.</li>
        <li>Sem assinatura ativa depois do teste, o acesso fica limitado às telas de Assinatura e Configurações; seus dados continuam guardados.</li>
        <li>Você pode cancelar a qualquer momento pela Kiwify; o acesso segue até o fim do período já pago.</li>
        <li>Arrependimento: você pode pedir o reembolso em até 7 dias da compra, pela Kiwify (art. 49 do Código de Defesa do Consumidor).</li>
        <li>Mudança de preço é avisada com pelo menos 30 dias de antecedência e vale a partir da renovação seguinte.</li>
      </ul>

      <h2>5. Uso permitido</h2>
      <p>Não é permitido: usar o serviço para fins ilícitos; cadastrar dados de terceiros sem necessidade ou sem base legal; tentar acessar dados de outros escritórios; sobrecarregar, copiar ou fazer engenharia reversa do sistema; revender o acesso.</p>

      <h2>6. Seus dados</h2>
      <p>O conteúdo que você cadastra é seu. Você pode baixá-lo a qualquer momento em Configurações → Privacidade e dados, e pedir a exclusão da conta.</p>

      <h2>7. Disponibilidade</h2>
      <p>Trabalhamos para manter o serviço no ar, mas não garantimos funcionamento ininterrupto: pode haver manutenções e falhas de fornecedores. Faça cópias dos documentos importantes.</p>

      <h2>8. Responsabilidade</h2>
      <p>Respondemos pelos danos que causarmos nos termos da lei. Não respondemos por decisões técnicas tomadas por você, por dados informados de forma incorreta ou por indisponibilidade causada por terceiros. Nada nestes termos limita direitos garantidos pelo Código de Defesa do Consumidor.</p>

      <h2>9. Suspensão e encerramento</h2>
      <p>Podemos suspender a conta que violar estes termos, com aviso prévio sempre que possível. Você pode encerrar a conta a qualquer momento.</p>

      <h2>10. Mudanças nestes termos</h2>
      <p>Quando houver mudança relevante, atualizamos a data no topo e pedimos o seu aceite de novo ao entrar no painel.</p>

      <h2>11. Lei e foro</h2>
      <p>Valem as leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP, ressalvado o seu direito, como consumidor, de propor ação no foro do seu domicílio.</p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <p>Cookies e armazenamento local são pequenos dados que um site guarda no seu navegador. O {EMPRESA.produto} usa apenas o essencial para funcionar.</p>

      <h2>O que guardamos no seu navegador</h2>
      <div className="legal-tabela" role="table" aria-label="Itens guardados no navegador">
        <div role="row" className="legal-tabela-cabeca"><span role="columnheader">Item</span><span role="columnheader">Para quê</span><span role="columnheader">Por quanto tempo</span></div>
        <div role="row"><span role="cell">Sessão de login (sb-…-auth-token)</span><span role="cell">Manter você conectado ao painel</span><span role="cell">Até você clicar em Sair</span></div>
        <div role="row"><span role="cell">Aviso de cookies (rtq-aviso-cookies)</span><span role="cell">Não mostrar este aviso de novo</span><span role="cell">Até você limpar os dados do site</span></div>
      </div>
      <p>Todos são essenciais: sem eles o login não funciona. Por isso não dependem de consentimento (LGPD, art. 7º, V e IX), mas você deve saber que existem.</p>

      <h2>O que não usamos</h2>
      <ul>
        <li>Cookies de publicidade ou de remarketing.</li>
        <li>Ferramentas de análise de audiência (como Google Analytics) ou mapas de calor.</li>
        <li>Botões ou rastreadores de redes sociais.</li>
        <li>Fontes ou scripts carregados de terceiros ao abrir o site: as fontes são servidas pelo próprio {EMPRESA.produto}.</li>
      </ul>
      <p>Se algum dia passarmos a usar algo opcional, ele só será ativado depois do seu consentimento, e esta página será atualizada.</p>

      <h2>Sites de terceiros</h2>
      <p>Ao entrar com o Google, conectar a Google Agenda ou pagar a assinatura, você vai para os sites do Google ou da Kiwify, que têm suas próprias políticas de cookies.</p>

      <h2>Como apagar</h2>
      <p>Nas configurações do navegador, apague os dados do site rtquimico.web.app. Você será desconectado e o aviso de cookies aparecerá de novo.</p>
      <p><button type="button" className="button secondary" onClick={abrirAvisoCookies}>Ver o aviso de cookies</button></p>
    </>
  );
}

const CONTEUDO: Record<Tipo, () => ReactNode> = { privacidade: Privacidade, termos: Termos, cookies: Cookies };

export function PaginaLegal({ tipo, logado }: { tipo: Tipo; logado: boolean }) {
  const Conteudo = CONTEUDO[tipo];
  return (
    <div className="landing legal-pagina">
      <nav className="landing-nav" aria-label="Principal">
        <LinkInterno to="/"><Brand /></LinkInterno>
        <LinkInterno to={logado ? "/painel" : "/"} className="button ghost"><ArrowLeft size={17} /> {logado ? "Voltar ao painel" : "Voltar ao site"}</LinkInterno>
      </nav>
      <main className="legal-conteudo">
        <nav className="legal-abas" aria-label="Documentos legais">
          {(Object.keys(TITULOS) as Tipo[]).map((t) => (
            <LinkInterno key={t} to={{ privacidade: ROTA_PRIVACIDADE, termos: ROTA_TERMOS, cookies: ROTA_COOKIES }[t]} className={t === tipo ? "ativa" : ""}>{TITULOS[t]}</LinkInterno>
          ))}
        </nav>
        <article>
          <h1>{TITULOS[tipo]}</h1>
          <p className="legal-versao">Versão de {VERSAO_TERMOS_EXTENSO}</p>
          <Conteudo />
          <p className="legal-duvidas">Dúvidas sobre este documento? Escreva para <Contato />.</p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Pedido de aceite ao entrar: contas criadas pelo Google, contas antigas e mudança de versão dos termos. */
export function AceiteTermos({ onAceitar, onSair }: { onAceitar: () => Promise<void>; onSair: () => void }) {
  const [marcado, setMarcado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const aceitar = async () => {
    setSalvando(true);
    try {
      await onAceitar();
    } finally {
      setSalvando(false);
    }
  };
  return (
    <div className="modal-backdrop aceite-termos">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="aceite-titulo">
        <header><div><h2 id="aceite-titulo">Termos de Uso e Privacidade</h2></div></header>
        <div className="modal-corpo">
          <div className="aceite-corpo">
            <p>Para continuar usando o {EMPRESA.produto}, leia e aceite os documentos abaixo. Eles explicam quais dados guardamos, com quem compartilhamos e como você baixa ou apaga os seus dados.</p>
            <ul className="aceite-links">
              <li><a href={ROTA_TERMOS} target="_blank" rel="noopener">Termos de Uso</a></li>
              <li><a href={ROTA_PRIVACIDADE} target="_blank" rel="noopener">Política de Privacidade</a></li>
              <li><a href={ROTA_COOKIES} target="_blank" rel="noopener">Política de Cookies</a></li>
            </ul>
            <label className="auth-aceite">
              <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />
              <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
            </label>
          </div>
          <footer>
            <button type="button" className="button ghost" onClick={onSair}>Sair</button>
            <button type="button" className="button primary" disabled={!marcado || salvando} onClick={() => void aceitar()}>{salvando ? "Salvando..." : "Aceitar e continuar"}</button>
          </footer>
        </div>
      </section>
    </div>
  );
}
