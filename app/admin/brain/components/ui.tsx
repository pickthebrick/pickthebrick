// Shared presentational primitives for the /admin/brain workspace. These
// replace the design handoff's per-element inline styles with a handful of
// reusable, styled (see ../brain.css) building blocks used across almost
// every screen.

export type Tone = "green" | "gold" | "red" | "grey" | "blue" | "coral";

export function Pill({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`brain-pill brain-pill--${tone}`}>{label}</span>;
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`brain-chip ${active ? "brain-chip--active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function SectionCard({
  title,
  accent,
  children,
  className = "",
}: {
  title?: string;
  accent?: "gold" | "blue";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`brain-card ${accent ? `brain-card--accent-${accent}` : ""} ${className}`}>
      {title && <div className="brain-card-label">{title}</div>}
      {children}
    </div>
  );
}

export function RowList({ children }: { children: React.ReactNode }) {
  return <div className="brain-row-list">{children}</div>;
}

export function KpiGrid({ kpis, cols = 4 }: { kpis: { label: string; value: string; delta?: string; deltaGood?: boolean; deltaArrow?: string }[]; cols?: number }) {
  return (
    <div className="brain-grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>
      {kpis.map((k) => (
        <div className="brain-card brain-kpi" key={k.label}>
          <div className="brain-kpi-label">{k.label}</div>
          <div className="brain-kpi-value">{k.value}</div>
          {k.delta && (
            <div className={`brain-kpi-delta ${k.deltaGood ? "good" : "bad"}`}>
              {k.deltaArrow} {k.delta} vs prev.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function InsightList({ items, title }: { items: string[]; title: string }) {
  return (
    <SectionCard accent="gold">
      <div className="brain-insight-title">{title}</div>
      <div className="brain-insight-list">
        {items.map((line, i) => (
          <div className="brain-insight-item" key={i}>
            {line}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="brain-table-wrap">
      <table className="brain-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="brain-progress-track">
      <div className="brain-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  target,
  block = true,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  target?: string;
  block?: boolean;
}) {
  const className = `brain-btn brain-btn--primary ${block ? "brain-btn--block" : ""}`;
  if (href) {
    return (
      <a href={href} target={target} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="brain-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function StatusDot({ tone }: { tone: "green" | "gold" }) {
  return <span className={`brain-status-dot brain-status-dot--${tone}`} />;
}
