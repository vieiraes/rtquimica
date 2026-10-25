import { ChevronRight, EllipsisVertical, FlaskConical, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><FlaskConical size={24} /></span>
      <span>RT<b>Químico</b></span>
    </div>
  );
}

export function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return <header className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button onClick={onAction}>{action} <ChevronRight size={16} /></button>}</header>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Empty({ title, text, action }: { title: string; text: string; action?: () => void }) {
  return <div className="empty"><Search size={32} /><h3>{title}</h3><p>{text}</p>{action && <button className="button primary" onClick={action}>Cadastrar RT</button>}</div>;
}

export function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span className="eyebrow">RTQUÍMICO</span><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

/** Menu ⋮ de ações da linha (padrão dos projetos: ações de linha num menu "Mais detalhes"). */
export function MenuAcoes({ rotulo, acoes }: { rotulo: string; acoes: Array<{ texto: string; perigo?: boolean; fazer: () => void }> }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  return (
    <div className="menu-acoes" ref={raiz}>
      <button className="icon-button" aria-label={`Mais detalhes: ${rotulo}`} aria-expanded={aberto} onClick={() => setAberto(!aberto)}><EllipsisVertical size={18} /></button>
      {aberto && (
        <div className="menu-acoes-lista" role="menu">
          {acoes.map((a) => <button key={a.texto} role="menuitem" className={a.perigo ? "perigo" : ""} onClick={() => { setAberto(false); a.fazer(); }}>{a.texto}</button>)}
        </div>
      )}
    </div>
  );
}
