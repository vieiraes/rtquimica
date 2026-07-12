import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { initialActions, initialAlerts, initialRts } from "./data/mock";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { formatDate } from "./lib/format";
import { categoryToDb, mapAction, mapAlert, mapRt } from "./lib/mappers";
import { Brand } from "./components/primitives";
import { NewActionModal, NewRtModal, PopModal } from "./components/modals";
import { Header, PageHeading, Sidebar } from "./components/layout";
import { Landing } from "./components/landing";
import { Admin, Alerts, CompanyPortal, Compliance, Dashboard, Pops, Profile, Responsibilities, TechnicalDiary } from "./components/pages";
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
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [rts, setRts] = useState<RT[]>(isSupabaseConfigured ? [] : initialRts);
  const [alerts, setAlerts] = useState<Alert[]>(isSupabaseConfigured ? [] : initialAlerts);
  const [actions, setActions] = useState<TechnicalAction[]>(isSupabaseConfigured ? [] : initialActions);
  const [modal, setModal] = useState<"rt" | "action" | "pop" | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    const client = supabase;

    const loadData = async () => {
      setDataLoading(true);
      try {
        const [profileResult, rtsResult, alertsResult, actionsResult] = await Promise.all([
          client.from("profiles").select("*").eq("id", session.user.id).single(),
          client.from("technical_responsibilities").select("*").order("created_at", { ascending: false }),
          client.from("alerts").select("*").order("created_at", { ascending: false }),
          client
            .from("technical_actions")
            .select("*, technical_responsibilities(company_name)")
            .order("action_date", { ascending: false }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (rtsResult.error) throw rtsResult.error;
        if (alertsResult.error) throw alertsResult.error;
        if (actionsResult.error) throw actionsResult.error;

        setProfile(profileResult.data as Profile);
        setRts((rtsResult.data ?? []).map((row) => mapRt(row)));
        setAlerts((alertsResult.data ?? []).map((row) => mapAlert(row)));
        setActions((actionsResult.data ?? []).map((row) => mapAction(row)));
      } catch (error) {
        console.error(error);
        showToast("Não consegui carregar os dados do Supabase.");
      } finally {
        setDataLoading(false);
      }
    };

    void loadData();
  }, [session]);

  const goTo = (next: Page) => {
    setPage(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (message: string) => setToast(message);

  const displayName = profile?.name ?? session?.user.email?.split("@")[0] ?? "Mariana Vieira";
  const crq = profile?.crq_number ?? "04289123";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RT";
  const loggedIn = isSupabaseConfigured ? Boolean(session) : authenticated;

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
      showToast(payload.mode === "login" ? "Login realizado." : "Conta criada e conectada.");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Falha na autenticação.");
    } finally {
      setAuthLoading(false);
    }
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
        numero: payload.numero,
        inicio: formatDate(payload.inicio),
        vigencia: formatDate(payload.vigencia),
        status: "Pendente",
        regional: payload.regional,
        progresso: 20,
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
        document_number: payload.numero,
        start_date: payload.inicio,
        end_date: payload.vigencia,
        status: "pending",
        crq_region: payload.regional,
        notes: payload.observacoes,
      })
      .select()
      .single();

    if (error) throw error;
    setRts((current) => [mapRt(data), ...current]);
    await refreshAlerts();
  };

  const saveAction = async (payload: ActionInsertPayload) => {
    if (!supabase || !session?.user) {
      setActions((current) => [{
        id: Date.now(),
        rtId: payload.rtId,
        category: payload.category,
        company: payload.company,
        description: payload.description,
        date: "10 jun 2026, agora",
        evidence: 0,
      }, ...current]);
      return;
    }

    const { data, error } = await supabase
      .from("technical_actions")
      .insert({
        tenant_id: profile?.tenant_id,
        rt_id: payload.rtId,
        category: categoryToDb[payload.category] ?? "outro",
        description: payload.description,
        attachments: [],
      })
      .select("*, technical_responsibilities(company_name)")
      .single();

    if (error) throw error;
    setActions((current) => [mapAction(data), ...current]);
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

  if (authLoading && !loggedIn) {
    return <div className="boot-screen"><Brand /><span>Conectando ao Supabase local...</span></div>;
  }

  if (!loggedIn) {
    return (
      <Landing
        onEnter={() => setAuthenticated(true)}
        onAuth={handleAuth}
        authLoading={authLoading}
        dark={dark}
        setDark={setDark}
      />
    );
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
        crq={crq}
        initials={initials}
        activeCount={rts.filter((rt) => rt.status === "Ativa").length}
        role={profile?.role}
      />
      <div className="main-column">
        <Header
          onMenu={() => setSidebarOpen(true)}
          onProfile={() => goTo("perfil")}
          dark={dark}
          setDark={setDark}
          unread={alerts.filter((alert) => !alert.read).length}
          onAlerts={() => goTo("alertas")}
          name={displayName}
          initials={initials}
        />
        <main className="page">
          {dataLoading && <div className="loading-strip">Sincronizando dados com o Supabase local...</div>}
          <PageHeading page={page} onPrimary={() => setModal(page === "acoes" ? "action" : "rt")} />
          {page === "dashboard" && <Dashboard rts={rts} alerts={alerts} onNavigate={goTo} onNewRt={() => setModal("rt")} />}
          {page === "rts" && <Responsibilities rts={rts} onNew={() => setModal("rt")} showToast={showToast} />}
          {page === "alertas" && <Alerts alerts={alerts} onMarkRead={markAlertsRead} />}
          {page === "acoes" && <TechnicalDiary actions={actions} onNew={() => setModal("action")} />}
          {page === "checklist" && <Compliance showToast={showToast} />}
          {page === "pops" && <Pops onUse={() => setModal("pop")} />}
          {page === "empresa" && <CompanyPortal rts={rts} showToast={showToast} />}
          {page === "admin" && <Admin />}
          {page === "perfil" && <Profile dark={dark} setDark={setDark} showToast={showToast} />}
        </main>
      </div>
      {modal === "rt" && (
        <NewRtModal
          onClose={() => setModal(null)}
          onSave={async (rt) => {
            try {
              await saveRt(rt);
              setModal(null);
              showToast("RT cadastrada no Supabase. Alerta de comunicação criado.");
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
              showToast("Ação técnica registrada no Supabase.");
            } catch (error) {
              console.error(error);
              showToast(error instanceof Error ? error.message : "Falha ao salvar ação técnica.");
            }
          }}
        />
      )}
      {modal === "pop" && <PopModal onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("POP salvo na sua biblioteca."); }} />}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
