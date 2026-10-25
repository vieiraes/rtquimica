import { CalendarCheck2, CalendarDays, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PanelHeader } from "./primitives";
import { supabase } from "../lib/supabase";
import { chamarAgenda } from "../lib/agenda";

interface Ligacao {
  google_email: string | null;
  last_sync_at: string | null;
  last_error: string | null;
}

const RETORNOS: Record<string, string> = {
  conectado: "Google Agenda conectada. Os prazos já estão na agenda RTQuímico.",
  cancelado: "Conexão com o Google cancelada.",
  expirado: "O tempo para conectar acabou. Tente de novo.",
  erro: "Não consegui conectar ao Google. Tente de novo.",
};

/** Um clique: entra com a conta Google e o RTQuímico mantém a agenda "RTQuímico" atualizada sozinho. */
export function GoogleAgenda({ showToast }: { showToast: (m: string) => void }) {
  const [ligacao, setLigacao] = useState<Ligacao | null>(null);
  const [carregando, setCarregando] = useState(Boolean(supabase));
  const [ocupado, setOcupado] = useState<"" | "conectar" | "sincronizar" | "desconectar">("");

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("google_calendar_links").select("google_email, last_sync_at, last_error").maybeSingle();
    setLigacao(data);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
    // Volta do login do Google: /configuracoes?google=conectado|cancelado|expirado|erro
    const retorno = new URLSearchParams(window.location.search).get("google");
    if (retorno) {
      showToast(RETORNOS[retorno] ?? RETORNOS.erro);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [carregar, showToast]);

  const conectar = async () => {
    setOcupado("conectar");
    try {
      const { url } = await chamarAgenda<{ url: string }>("conectar");
      window.location.assign(url);
    } catch {
      showToast("Não consegui abrir o login do Google.");
      setOcupado("");
    }
  };

  const sincronizar = async () => {
    setOcupado("sincronizar");
    try {
      await chamarAgenda("sincronizar");
      showToast("Agenda atualizada.");
    } catch {
      showToast("Não consegui atualizar a agenda.");
    }
    await carregar();
    setOcupado("");
  };

  const desconectar = async () => {
    if (!window.confirm("Desconectar a Google Agenda? A agenda RTQuímico sai do seu Google.")) return;
    setOcupado("desconectar");
    try {
      await chamarAgenda("desconectar");
      showToast("Google Agenda desconectada.");
    } catch {
      showToast("Não consegui desconectar.");
    }
    await carregar();
    setOcupado("");
  };

  return (
    <article className="panel google-agenda">
      <PanelHeader title="Google Agenda" subtitle="Vencimentos de RT, honorários a receber e o prazo do carnê-leão na sua agenda do Google" />
      <div className="google-agenda-corpo">
        {!supabase ? (
          <p className="google-agenda-texto">Disponível com a conta conectada (no modo demonstração não há Google).</p>
        ) : carregando ? (
          <p className="google-agenda-texto">Carregando...</p>
        ) : ligacao ? (
          <>
            <p className="google-agenda-status"><CalendarCheck2 size={20} /> Conectada{ligacao.google_email ? <> como <b>{ligacao.google_email}</b></> : null}</p>
            <p className="google-agenda-texto">
              Procure a agenda <b>RTQuímico</b> no seu Google. Ela se atualiza sozinha quando você muda uma RT ou um honorário.
              {ligacao.last_sync_at && <> Última atualização: {new Date(ligacao.last_sync_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.</>}
            </p>
            {ligacao.last_error && <p className="google-agenda-erro">A última atualização falhou: {ligacao.last_error}</p>}
            <div className="google-agenda-acoes">
              <button className="button secondary" onClick={sincronizar} disabled={Boolean(ocupado)}><RefreshCw size={16} /> {ocupado === "sincronizar" ? "Atualizando..." : "Atualizar agora"}</button>
              <button className="button ghost" onClick={desconectar} disabled={Boolean(ocupado)}>{ocupado === "desconectar" ? "Desconectando..." : "Desconectar"}</button>
            </div>
          </>
        ) : (
          <>
            <p className="google-agenda-texto">Entre com a sua conta Google uma vez. O RTQuímico cria a agenda <b>RTQuímico</b> e mantém lá, com lembretes, tudo o que tem prazo. Ele não mexe nas suas outras agendas.</p>
            <button className="button primary" onClick={conectar} disabled={Boolean(ocupado)}><CalendarDays size={18} /> {ocupado === "conectar" ? "Abrindo o Google..." : "Conectar Google Agenda"}</button>
          </>
        )}
      </div>
    </article>
  );
}
