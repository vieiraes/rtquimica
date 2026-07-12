import { ChevronRight, FlaskConical, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

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

export function Toggle({ label, description, checked = false, onChange }: { label: string; description: string; checked?: boolean; onChange?: () => void }) {
  const [internal, setInternal] = useState(checked);
  const value = onChange ? checked : internal;
  return <label className="toggle-row"><span><b>{label}</b><small>{description}</small></span><button type="button" role="switch" aria-checked={value} className={`switch ${value ? "on" : ""}`} onClick={(event) => { event.preventDefault(); if (onChange) onChange(); else setInternal(!internal); }}><i /></button></label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function Empty({ title, text, action }: { title: string; text: string; action: () => void }) {
  return <div className="empty"><Search size={32} /><h3>{title}</h3><p>{text}</p><button className="button primary" onClick={action}>Cadastrar RT</button></div>;
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
