/**
 * Collapsible card for a single microbiome finding.
 * Shows species name, flag badge, narrative, percentile bar, and sex-specific note.
 */

import { useState } from "react";

const FLAG_META = {
  critically_low:      { label: "Critically Low",      bg: "#fef2f2", border: "#fca5a5", badge: "#ef4444" },
  low:                 { label: "Below Optimal",        bg: "#fffbeb", border: "#fcd34d", badge: "#f59e0b" },
  elevated:            { label: "Elevated",             bg: "#fff7ed", border: "#fdba74", badge: "#f97316" },
  critically_elevated: { label: "Critically Elevated",  bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626" },
  positive:            { label: "Healthy",              bg: "#f0fdf4", border: "#86efac", badge: "#22c55e" },
};

function PercentileBar({ pctData }) {
  if (!pctData?.available) return null;
  const { value_pct, p10, p25, p50, p75, p90, direction } = pctData;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const toPos = (v) => clamp(((v - 0) / (p90 * 1.2)) * 100, 0, 100);

  return (
    <div className="percentile-bar-wrap">
      <div className="percentile-track">
        {[p10, p25, p50, p75, p90].map((v, i) => (
          <div
            key={i}
            className="percentile-marker"
            style={{ left: `${toPos(v)}%` }}
            title={`p${[10, 25, 50, 75, 90][i]}: ${v}%`}
          />
        ))}
        <div
          className="percentile-value-pin"
          style={{ left: `${toPos(value_pct)}%` }}
          title={`Your level: ${value_pct}%`}
        />
      </div>
      <div className="percentile-labels">
        <span>Low</span>
        <span>p50 ({p50}%)</span>
        <span>High</span>
      </div>
    </div>
  );
}

export default function FindingCard({ finding, papers = {} }) {
  const [open, setOpen] = useState(true);
  const meta = FLAG_META[finding.flag] || FLAG_META.positive;

  return (
    <div
      className="finding-card"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <button className="finding-header" onClick={() => setOpen(!open)}>
        <div className="finding-title-row">
          <span className="finding-name">{finding.display_name}</span>
          <span className="finding-badge" style={{ background: meta.badge }}>
            {meta.label}
          </span>
          <span className="finding-value">{finding.value_pct?.toFixed(2)}%</span>
        </div>
        <span className="finding-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="finding-body">
          {finding.narrative && (
            <p className="finding-narrative">{finding.narrative}</p>
          )}

          <PercentileBar pctData={finding.percentile_data} />

          {finding.sex_specific_note && (
            <div className="sex-note">
              <span className="sex-note-icon">♀</span>
              <p>{finding.sex_specific_note}</p>
            </div>
          )}

          {finding.papers?.length > 0 && (
            <div className="finding-papers">
              <p className="papers-label">Research backing:</p>
              {finding.papers.map((pid) => {
                const p = papers[pid];
                return p ? (
                  <p key={pid} className="paper-ref">
                    {p.authors} ({p.year}) — <em>{p.title}</em>
                  </p>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
