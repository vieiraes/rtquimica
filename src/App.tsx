import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { initialActions, initialAlerts, initialRts } from "./data/mock";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { desde, formatDate } from "./lib/format";
import { categoryToDb, mapAction, mapAlert, mapRt } from "./lib/mappers";
import { navegar, paginaDaUrl, ROTA_CRIAR_CONTA, ROTA_DEFINIR_SENHA, ROTAS, useCaminho, usePagina } from "./lib/rotas";
import { Brand } from "./components/primitives";
import { ComunicacaoModal, NewActionModal, NewRtModal } from "./components/modals";
import type { TipoComunicacao } from "./lib/comunicacao-crq";
import { Pops } from "./components/pops";
import { Header, PageHeading, Sidebar } from "./components/layout";
import { Landing } from "./components/landing";
import { AuthPage, DefinirSenha } from "./components/auth-page";
import { traduzirErroAuth } from "./lib/auth-erros";
import { Alerts, Compliance, Dashboard, Profile, Responsibilities, TechnicalDiary, type PerfilEditavel } from "./components/pages";
import { Financeiro } from "./components/financeiro";
import { GoogleAgenda } from "./components/google-agenda";
import { Radar } from "./components/radar";
import { Assinatura } from "./components/assinatura";
import { cobrancaAtiva, situacao, type Assinatura as DadosAssinatura } from "./lib/assinatura";
import { atualizarAgendaEmSegundoPlano } from "./lib/agenda";
import { Equipe, GestaoIa, Plataforma } from "./components/gestao";
import { acessoDesligado, ehQuimico, PAGINAS_SEM_ASSINATURA, papelDe, paginaInicial, paginasDoPapel, ROTULO_PAPEL } from "./lib/papeis";
import type { ActionInsertPayload, Alert, AuthPayload, Page, RT, RtInsertPayload, TechnicalAction } from "./types";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  tenant_id: string;
  role: string;
  email: string;
  name: string;
  crq_number: string | null;
  crq_state: string | null;
  tax_regime: "pf" | "pj" | null;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // booting: primeira leitura da sessão; authLoading: um login/cadastro em andamento
  const [booting, setBooting] = useState(isSupabaseConfigured);
  const [authLoading, setAuthLoading] = useState(false);
  const caminho = useCaminho();
  const [dataLoading, setDataLoading] = useState(false);
  const { pagina: page, ir, substituir } = usePagina();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rts, setRts] = useState<RT[]>(isSupabaseConfigured ? [] : initialRts);
  const [alerts, setAlerts] = useState<Alert[]>(isSupabaseConfigured ? [] : initialAlerts);
  const [actions, setActions] = useState<TechnicalAction[]>(isSupabaseConfigured ? [] : initialActions);
  const [modal, setModal] = useState<"rt" | "action" | null>(null);
  const [comunicacao, setComunicacao] = useState<{ rt: RT; tipo: TipoComunicacao } | null>(null);
  const [toast, setToast] = useState("");
  // Estável: Financeiro e Google Agenda dependem dela para carregar (recriada a cada render, recarregavam a cada aviso)
  const showToast = useCallback((message: string) => setToast(message), []);
  const [perfilFalhou, setPerfilFalhou] = useState(false);
  const [honorariosAtrasados, setHonorariosAtrasados] = useState(isSupabaseConfigured ? 0 : 1);
  const [radarNovas, setRadarNovas] = useState(isSupabaseConfigured ? 0 : 3);
  const [assinatura, setAssinatura] = useState<DadosAssinatura | null>(null);

  // Objeto estável: o Financeiro recarrega quando o perfil muda, não a cada render do App
  const perfilFinanceiro = useMemo(
    () => (profile ? { id: profile.id, tenantId: profile.tenant_id, regime: profile.tax_regime } : null),
    [profile],
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    const client = supabase;

    // Perfil primeiro: o papel decide o que carregar (superadmin e empresa não carregam RTs)
    const loadData = async () => {
      setDataLoading(true);
      setPerfilFalhou(false);
      try {
        const profileResult = await client.from("profiles").select("*").eq("id", session.user.id).single();
        if (profileResult.error) throw profileResult.error;
        const perfil = profileResult.data as Profile;
        setProfile(perfil);
        const papel = papelDe(perfil.role);
        if (!ehQuimico(papel)) return;
        void carregarAssinatura(perfil.tenant_id);

        const [rtsResult, checklistsResult] = await Promise.all([
          client.from("technical_responsibilities").select("*").order("created_at", { ascending: false }),
          client.from("checklists").select("rt_id, progress"),
        ]);
        if (rtsResult.error) throw rtsResult.error;
        const progressoPorRt = new Map((checklistsResult.data ?? []).map((c) => [c.rt_id, c.progress as number]));
        setRts((rtsResult.data ?? []).map((row) => ({ ...mapRt(row), progresso: progressoPorRt.get(row.id) ?? null })));

        const [alertsResult, actionsResult] = await Promise.all([
          client.from("alerts").select("*").order("created_at", { ascending: false }),
          client
            .from("technical_actions")
            .select("*, technical_responsibilities(company_name)")
            .order("action_date", { ascending: false }),
        ]);
        if (alertsResult.error) throw alertsResult.error;
        if (actionsResult.error) throw actionsResult.error;
        setAlerts((alertsResult.data ?? []).map((row) => mapAlert(row)));
        setActions((actionsResult.data ?? []).map((row) => mapAction(row)));
        await Promise.all([contarAtrasados(), contarRadar(session.user.id)]);
      } catch (error) {
        console.error(error);
        setPerfilFalhou(true);
        showToast("Não consegui carregar seus dados. Tente de novo em instantes.");
      } finally {
        setDataLoading(false);
      }
    };

    void loadData();
  }, [session, showToast]);

  // Assinatura do escritório (Kiwify): situação, fim do teste e até quando está pago
  async function carregarAssinatura(tenantId: string) {
    if (!supabase) return;
    const { data } = await supabase.from("tenants").select("subscription_status, trial_ends_at, paid_until").eq("id", tenantId).maybeSingle();
    if (data) setAssinatura({ status: data.subscription_status, trialEndsAt: data.trial_ends_at, paidUntil: data.paid_until });
  }

  // Honorários vencidos e não recebidos: badge no menu Financeiro
  async function contarAtrasados() {
    if (!supabase) return;
    const { count } = await supabase
      .from("financial_entries")
      .select("id", { count: "exact", head: true })
      .eq("kind", "receita")
      .is("paid_on", null)
      .lt("due_date", new Date().toLocaleDateString("sv-SE"));
    setHonorariosAtrasados(count ?? 0);
  }

  // Novidades do radar dos últimos 30 dias que a pessoa ainda não leu: badge no menu
  async function contarRadar(userId: string) {
    if (!supabase) return;
    const [itens, lidos] = await Promise.all([
      supabase.from("regulatory_items").select("id").gte("published_at", desde(30)),
      supabase.from("regulatory_reads").select("item_id").eq("user_id", userId),
    ]);
    const jaLidos = new Set((lidos.data ?? []).map((r) => r.item_id));
    setRadarNovas((itens.data ?? []).filter((i) => !jaLidos.has(i.id)).length);
  }

  const goTo = (next: Page) => {
    ir(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const displayName = profile?.name ?? session?.user.email?.split("@")[0] ?? "Mariana Vieira";
  const crq = isSupabaseConfigured ? profile?.crq_number ?? null : "04289123";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RT";
  const loggedIn = isSupabaseConfigured ? Boolean(session) : authenticated;
  const papel = papelDe(profile?.role);
  const quimico = ehQuimico(papel);
  const subtitulo = !isSupabaseConfigured ? "Modo demonstração" : quimico && crq ? `CRQ ${crq}` : papel ? ROTULO_PAPEL[papel] : "";
  const perfilCarregado = !isSupabaseConfigured || profile !== null;
  // Cobrança só vale com o checkout da Kiwify configurado; sem pagamento, só Assinatura e Configurações
  const estadoAssinatura = situacao(assinatura);
  const bloqueado = cobrancaAtiva() && ehQuimico(papel) && !estadoAssinatura.liberado;

  // Página fora do papel (ex.: superadmin em /painel, empresa em /diario) vai para a inicial do papel;
  // logado numa URL que não é do painel (ex.: "/" da landing), fixa a URL da página atual.
  useEffect(() => {
    if (!loggedIn || !perfilCarregado || caminho === ROTA_DEFINIR_SENHA) return;
    if (!paginasDoPapel(papel).includes(page)) substituir(paginaInicial(papel));
    else if (bloqueado && !PAGINAS_SEM_ASSINATURA.includes(page)) substituir("assinatura");
    else if (paginaDaUrl(window.location.pathname) === null) substituir(page);
  }, [loggedIn, page, perfilCarregado, papel, substituir, caminho, bloqueado]);

  const handleAuth = async (payload: AuthPayload) => {
    if (!supabase) {
      setAuthenticated(true);
      return;
    }

    setAuthLoading(true);
    try {
      const result = payload.mode === "login"
        ? await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        })
        : await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              nome: payload.name,
              numero_crq: payload.crq,
              crq_estado: "SP",
            },
          },
        });

      if (result.error) throw result.error;
      // Com confirmação de e-mail ligada (produção), o cadastro volta sem sessão até a pessoa clicar no link
      if (payload.mode === "signup" && !result.data.session) showToast("Conta criada. Confirme pelo link que enviamos para o seu e-mail.");
      else showToast(payload.mode === "login" ? "Login realizado." : "Conta criada e conectada.");
    } catch (error) {
      console.error(error);
      showToast(traduzirErroAuth(error instanceof Error ? error.message : undefined));
    } finally {
      setAuthLoading(false);
    }
  };

  const esqueciSenha = async (email: string) => {
    if (!supabase) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Digite o seu e-mail no campo acima e clique de novo."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${ROTA_DEFINIR_SENHA}` });
    showToast(error ? traduzirErroAuth(error.message) : `Se ${email} tiver conta, chega um e-mail com o link para criar uma nova senha.`);
  };

  const definirSenha = async (senha: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) throw new Error(traduzirErroAuth(error.message));
    showToast("Senha salva. Bem-vindo ao RTQuímico.");
    navegar(ROTAS[paginaInicial(papel)], { substituir: true });
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setRts([]);
      setAlerts([]);
      setActions([]);
    }
    setAuthenticated(false);
    navegar("/", { substituir: true });
  };

  const refreshAlerts = async () => {
    if (!supabase || !session?.user) return;
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setAlerts((data ?? []).map((row) => mapAlert(row)));
  };

  const saveRt = async (payload: RtInsertPayload) => {
    if (!supabase || !session?.user) {
      const rt: RT = {
        id: Date.now(),
        empresa: payload.empresa,
        cnpj: payload.cnpj,
        documento: payload.documento,
        numero: payload.numero || "Sem número",
        inicio: formatDate(payload.inicio),
        vigencia: formatDate(payload.vigencia),
        status: "Pendente",
        regional: payload.regional,
        progresso: null,
      };
      setRts((current) => [rt, ...current]);
      setAlerts((current) => [
        { id: Date.now(), level: "warning", title: "Comunicação ao CRQ pendente", text: `Comunique a nova RT de ${rt.empresa} em até 24 horas.`, time: "Agora", read: false },
        ...current,
      ]);
      return;
    }

    const { data, error } = await supabase
      .from("technical_responsibilities")
      .insert({
        tenant_id: profile?.tenant_id,
        user_id: session.user.id,
        company_name: payload.empresa,
        company_cnpj: payload.cnpj,
        document_type: payload.documento,
        document_number: payload.numero || null,
        start_date: payload.inicio,
        end_date: payload.vigencia,
        status: "pending",
        crq_region: payload.regional,
        notes: payload.observacoes,
        company_legal_name: payload.empresaDados?.razaoSocial ?? null,
        company_cnae: payload.empresaDados?.cnae ?? null,
        company_cnae_description: payload.empresaDados?.cnaeDescricao ?? null,
        company_city: payload.empresaDados?.municipio ?? null,
        company_state: payload.empresaDados?.uf ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    setRts((current) => [mapRt(data), ...current]);
    await refreshAlerts();
    atualizarAgendaEmSegundoPlano();
  };

  const saveAction = async (payload: ActionInsertPayload) => {
    if (!supabase || !session?.user) {
      setActions((current) => [{
        id: Date.now(),
        rtId: payload.rtId,
        category: payload.category,
        company: payload.company,
        description: payload.description,
        date: "agora",
        dataIso: new Date().toISOString(),
        evidence: payload.arquivos?.length ?? 0,
      }, ...current]);
      return;
    }

    // Evidências primeiro: vão para a pasta do escritório no bucket documentos (o RLS do Storage exige o tenant na pasta)
    const anexos: Array<{ path: string; name: string; size: number; type: string }> = [];
    for (const arquivo of payload.arquivos ?? []) {
      const path = `${profile?.tenant_id}/diario/${crypto.randomUUID()}-${arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_")}`;
      const { error: erroEnvio } = await supabase.storage.from("documentos").upload(path, arquivo);
      if (erroEnvio) {
        if (anexos.length) await supabase.storage.from("documentos").remove(anexos.map((x) => x.path));
        throw new Error(`Não consegui enviar ${arquivo.name}.`);
      }
      anexos.push({ path, name: arquivo.name, size: arquivo.size, type: arquivo.type });
    }

    const { data, error } = await supabase
      .from("technical_actions")
      .insert({
        tenant_id: profile?.tenant_id,
        rt_id: payload.rtId,
        category: categoryToDb[payload.category] ?? "outro",
        description: payload.description,
        attachments: anexos,
      })
      .select("*, technical_responsibilities(company_name)")
      .single();

    if (error) throw error;
    setActions((current) => [mapAction(data), ...current]);
  };

  const saveProfile = async (dados: PerfilEditavel) => {
    if (supabase && profile) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ name: dados.name, crq_number: dados.crq, crq_state: dados.crqState?.toUpperCase() ?? null, tax_regime: dados.regime })
        .eq("id", profile.id)
        .select()
        .single();
      if (error) {
        console.error(error);
        showToast("Não consegui salvar. Tente de novo.");
        return;
      }
      setProfile(data as Profile);
    }
    showToast("Alterações salvas.");
  };

  // Encerrar a RT: o trigger do banco cria o alerta de comunicação do encerramento; em seguida abre a comunicação
  const encerrarRt = async (rt: RT) => {
    if (!window.confirm(`Encerrar a RT da ${rt.empresa}? Ela sai das RTs ativas e fica o alerta para comunicar o CRQ.`)) return;
    if (supabase && session?.user) {
      const { data, error } = await supabase.from("technical_responsibilities").update({ status: "canceled" }).eq("id", rt.id).select().single();
      if (error) { showToast("Não consegui encerrar a RT."); return; }
      const atualizada = mapRt(data);
      setRts((atual) => atual.map((x) => (x.id === rt.id ? atualizada : x)));
      await refreshAlerts();
      atualizarAgendaEmSegundoPlano();
      setComunicacao({ rt: atualizada, tipo: "encerramento" });
    } else {
      const atualizada = { ...rt, status: "Cancelada" as const };
      setRts((atual) => atual.map((x) => (x.id === rt.id ? atualizada : x)));
      setComunicacao({ rt: atualizada, tipo: "encerramento" });
    }
    showToast("RT encerrada. Comunique o CRQ.");
  };

  // Comunicação feita: fecha o alerta pendente da RT e deixa o registro (com protocolo) no diário técnico
  const registrarComunicacao = async (rt: RT, { tipo, protocolo }: { tipo: TipoComunicacao; protocolo: string; data: string }) => {
    const descricao = `Comunicação de ${tipo === "inicio" ? "início" : "encerramento"} da responsabilidade técnica (${rt.documento} ${rt.numero}) enviada ao ${rt.regional}${protocolo ? `, protocolo ${protocolo}` : ""}.`;
    if (supabase && session?.user) {
      const [{ error: e1 }, { data, error: e2 }] = await Promise.all([
        supabase.from("alerts").update({ is_read: true }).eq("rt_id", rt.id).eq("type", "comunicacao_pendente"),
        supabase.from("technical_actions").insert({ tenant_id: profile?.tenant_id, rt_id: rt.id, category: "outro", description: descricao, attachments: [] }).select("*, technical_responsibilities(company_name)").single(),
      ]);
      if (e1 || e2) { showToast("Não consegui registrar a comunicação."); return; }
      setActions((atual) => [mapAction(data), ...atual]);
      await refreshAlerts();
    } else {
      setActions((atual) => [{ id: Date.now(), rtId: rt.id, category: "Outro", company: rt.empresa, description: descricao, date: "agora", evidence: 0 }, ...atual]);
    }
    setComunicacao(null);
    showToast("Comunicação registrada no diário técnico.");
  };

  const markAlertsRead = async (ids?: Array<string | number>) => {
    if (!supabase || !session?.user) {
      setAlerts((current) => current.map((alert) => ids && !ids.includes(alert.id) ? alert : { ...alert, read: true }));
      return;
    }

    const query = supabase.from("alerts").update({ is_read: true });
    const { error } = ids?.length ? await query.in("id", ids as string[]) : await query.eq("tenant_id", profile?.tenant_id);
    if (error) throw error;
    setAlerts((current) => current.map((alert) => ids && !ids.includes(alert.id) ? alert : { ...alert, read: true }));
  };

  if (booting) {
    return <div className="boot-screen"><Brand /><span>Conectando...</span></div>;
  }

  const aviso = toast && (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      {toast}
    </div>
  );

  if (!loggedIn) {
    return (
      <>
        {/* Landing só na raiz; /entrar, /criar-conta e qualquer página do painel pedem login */}
        {caminho === "/" || (paginaDaUrl(caminho) === null && !caminho.startsWith("/entrar") && caminho !== ROTA_CRIAR_CONTA)
          ? <Landing />
          : <AuthPage mode={caminho === ROTA_CRIAR_CONTA ? "signup" : "login"} onAuth={handleAuth} loading={authLoading} onDemo={() => setAuthenticated(true)} onEsqueci={(email) => void esqueciSenha(email)} />}
        {aviso}
      </>
    );
  }

  // Atendimento só a químicos: conta de empresa contratante existe no banco, mas não entra no painel
  if (perfilCarregado && acessoDesligado(papel)) {
    return (
      <div className="boot-screen">
        <Brand />
        <span>O acesso de empresas contratantes está desligado por enquanto. Fale com a sua responsável técnica.</span>
        <button className="button secondary" onClick={handleLogout}>Sair</button>
        {aviso}
      </div>
    );
  }

  if (!perfilCarregado) {
    return (
      <div className="boot-screen">
        <Brand />
        <span>{perfilFalhou ? "Não consegui abrir seu perfil." : "Carregando seu painel..."}</span>
        {perfilFalhou && <button className="button secondary" onClick={handleLogout}>Sair e tentar de novo</button>}
        {aviso}
      </div>
    );
  }

  // Chegou pelo link do convite ou de "esqueci a senha": cria a senha antes de usar o painel
  if (caminho === ROTA_DEFINIR_SENHA) {
    return <><DefinirSenha onDefinir={definirSenha} />{aviso}</>;
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        open={sidebarOpen}
        onNavigate={goTo}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        name={displayName}
        subtitle={subtitulo}
        initials={initials}
        activeCount={rts.filter((rt) => rt.status === "Ativa").length}
        unread={alerts.filter((alert) => !alert.read).length}
        atrasados={honorariosAtrasados}
        radarNovas={radarNovas}
        restringir={bloqueado ? PAGINAS_SEM_ASSINATURA : undefined}
        papel={papel}
      />
      <div className="main-column">
        <Header
          onMenu={() => setSidebarOpen(true)}
          onProfile={() => goTo("perfil")}
          unread={alerts.filter((alert) => !alert.read).length}
          onAlerts={() => goTo("alertas")}
          name={displayName}
          subtitle={subtitulo}
          initials={initials}
          papel={papel}
        />
        <main className="page">
          {dataLoading && <div className="loading-strip">Sincronizando seus dados...</div>}
          {cobrancaAtiva() && ehQuimico(papel) && page !== "assinatura" && (estadoAssinatura.diasTeste !== null || assinatura?.status === "past_due") && (
            <button className="faixa-assinatura" onClick={() => goTo("assinatura")}>{estadoAssinatura.mensagem} {papel === "tenant_admin" ? "Assinar agora" : "Fale com o titular"}</button>
          )}
          <PageHeading page={page} name={displayName} onPrimary={() => setModal(page === "acoes" ? "action" : "rt")} />
          {page === "dashboard" && <Dashboard rts={rts} alerts={alerts} onNavigate={goTo} onNewRt={() => setModal("rt")} />}
          {page === "rts" && <Responsibilities rts={rts} onNew={() => setModal("rt")} acoes={{ onComunicar: (rt) => setComunicacao({ rt, tipo: rt.status === "Cancelada" ? "encerramento" : "inicio" }), onEncerrar: (rt) => void encerrarRt(rt) }} />}
          {page === "alertas" && <Alerts alerts={alerts} onMarkRead={markAlertsRead} onNavigate={goTo} />}
          {page === "acoes" && <TechnicalDiary actions={actions} onNew={() => setModal("action")} quimico={{ nome: displayName, crq }} />}
          {page === "checklist" && <Compliance rts={rts} tenantId={profile?.tenant_id} showToast={showToast} onSalvo={(rtId, progresso) => setRts((atual) => atual.map((r) => (r.id === rtId ? { ...r, progresso } : r)))} />}
          {page === "pops" && <Pops rts={rts} tenantId={profile?.tenant_id} showToast={showToast} />}
          {page === "financeiro" && <Financeiro rts={rts} perfil={perfilFinanceiro} quimico={{ nome: displayName, crq }} showToast={showToast} onMudou={() => { void contarAtrasados(); atualizarAgendaEmSegundoPlano(); }} />}
          {page === "radar" && <Radar userId={session?.user.id} showToast={showToast} onMudou={() => session && void contarRadar(session.user.id)} />}
          {page === "assinatura" && <Assinatura assinatura={assinatura} titular={papel === "tenant_admin"} email={profile?.email ?? null} tenantId={profile?.tenant_id} onAtualizar={() => { if (profile) void carregarAssinatura(profile.tenant_id).then(() => showToast("Situação atualizada.")); }} />}
          {page === "plataforma" && <><Plataforma showToast={showToast} /><GestaoIa showToast={showToast} /></>}
          {page === "equipe" && <Equipe tenantId={profile?.tenant_id} euId={profile?.id} showToast={showToast} />}
          {page === "perfil" && (
            <Profile
              dados={{ name: displayName, email: profile?.email ?? session?.user.email ?? "", crq, crqState: profile?.crq_state ?? null, papel: papel ? ROTULO_PAPEL[papel] : "Responsável técnico", quimico, regime: profile?.tax_regime ?? null }}
              onSave={saveProfile}
            />
          )}
          {page === "perfil" && quimico && <GoogleAgenda showToast={showToast} />}
        </main>
      </div>
      {modal === "rt" && (
        <NewRtModal
          onClose={() => setModal(null)}
          onSave={async (rt) => {
            try {
              await saveRt(rt);
              setModal(null);
              showToast("RT cadastrada. Alerta de comunicação ao CRQ criado.");
            } catch (error) {
              console.error(error);
              showToast(error instanceof Error ? error.message : "Falha ao salvar RT.");
            }
          }}
        />
      )}
      {modal === "action" && (
        <NewActionModal
          rts={rts}
          onClose={() => setModal(null)}
          onSave={async (action) => {
            try {
              await saveAction(action);
              setModal(null);
              showToast("Ação técnica registrada no diário.");
            } catch (error) {
              console.error(error);
              showToast(error instanceof Error ? error.message : "Falha ao salvar ação técnica.");
            }
          }}
        />
      )}
      {comunicacao && (
        <ComunicacaoModal
          rt={comunicacao.rt}
          tipoInicial={comunicacao.tipo}
          quimico={{ nome: displayName, crq }}
          onClose={() => setComunicacao(null)}
          onFeita={(dados) => registrarComunicacao(comunicacao.rt, dados)}
        />
      )}
      {aviso}
    </div>
  );
}

export default App;
