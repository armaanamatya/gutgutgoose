export default function CascadeDiagram({ report }) {
  const sd = report?.species_detail ?? {};
  const akk   = (sd["s__Akkermansia_muciniphila"]?.value_pct   ?? 0.48).toFixed(2);
  const ecoli  = (sd["s__Escherichia_coli"]?.value_pct          ?? 7.9).toFixed(1);
  const fp     = (sd["s__Faecalibacterium_prausnitzii"]?.value_pct ?? 4.1).toFixed(1);

  return (
    <div className="cascade-wrap">
      <svg viewBox="0 0 760 528" style={{ width: "100%", overflow: "visible" }}>
        <defs>
          <marker id="c-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>

        {/* ── Connectors ─────────────────────────────────────────── */}
        {/* Akkermansia → Mucus (left) */}
        <line x1="330" y1="72" x2="195" y2="122" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* Akkermansia → FP (right) */}
        <line x1="430" y1="72" x2="575" y2="122" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* Mucus → E.coli */}
        <line x1="185" y1="174" x2="175" y2="234" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* FP → Butyrate */}
        <line x1="575" y1="186" x2="585" y2="244" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* E.coli → Oestrogen */}
        <line x1="110" y1="298" x2="92"  y2="358" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* E.coli → LPS */}
        <line x1="205" y1="298" x2="278" y2="358" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* Butyrate → Permeability */}
        <line x1="585" y1="296" x2="590" y2="358" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        {/* All → Symptoms */}
        <line x1="92"  y1="422" x2="240" y2="470" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        <line x1="278" y1="422" x2="330" y2="470" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />
        <line x1="590" y1="422" x2="480" y2="470" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#c-arrow)" />

        {/* ── Row 1: Akkermansia ─────────────────────────────────── */}
        <rect x="230" y="10" width="300" height="62" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
        <text x="380" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill="#991b1b">Akkermansia muciniphila</text>
        <text x="380" y="54" textAnchor="middle" fontSize="12" fill="#dc2626">{akk}% — critically low  (healthy ≥ 1.2%)</text>

        {/* ── Row 2: Mucus + FP ──────────────────────────────────── */}
        <rect x="75"  y="122" width="220" height="52" rx="7" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" />
        <text x="185" y="144" textAnchor="middle" fontSize="12" fontWeight="600" fill="#713f12">Mucus barrier weakens</text>
        <text x="185" y="162" textAnchor="middle" fontSize="11" fill="#854d0e">Less habitat for beneficial bacteria</text>

        <rect x="460" y="122" width="230" height="64" rx="7" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="575" y="146" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">Faecalibacterium prausnitzii</text>
        <text x="575" y="166" textAnchor="middle" fontSize="12" fill="#b45309">{fp}% — below optimal  (healthy ≥ 7.9%)</text>

        {/* ── Row 3: E.coli + Butyrate ───────────────────────────── */}
        <rect x="50"  y="234" width="250" height="64" rx="7" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
        <text x="175" y="258" textAnchor="middle" fontSize="13" fontWeight="700" fill="#991b1b">E. coli expands</text>
        <text x="175" y="278" textAnchor="middle" fontSize="12" fill="#dc2626">{ecoli}% — 26× healthy median</text>

        <rect x="480" y="244" width="210" height="52" rx="7" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="585" y="266" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">Butyrate production ↓</text>
        <text x="585" y="284" textAnchor="middle" fontSize="11" fill="#b45309">Colon lining integrity at risk</text>

        {/* ── Row 4: Three outcomes ───────────────────────────────── */}
        {/* Oestrogen */}
        <rect x="4"   y="358" width="176" height="64" rx="7" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1.5" />
        <text x="92"  y="380" textAnchor="middle" fontSize="11" fontWeight="600" fill="#7e22ce">Oestrogen recycling ↑</text>
        <text x="92"  y="396" textAnchor="middle" fontSize="10" fill="#7e22ce">β-glucuronidase elevates</text>
        <text x="92"  y="411" textAnchor="middle" fontSize="10" fill="#7e22ce">circulating oestrogens</text>

        {/* LPS / Inflammation */}
        <rect x="190" y="358" width="176" height="64" rx="7" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
        <text x="278" y="380" textAnchor="middle" fontSize="11" fontWeight="600" fill="#c2410c">LPS ↑</text>
        <text x="278" y="396" textAnchor="middle" fontSize="10" fill="#ea580c">Systemic low-grade</text>
        <text x="278" y="411" textAnchor="middle" fontSize="10" fill="#ea580c">inflammation</text>

        {/* Permeability */}
        <rect x="482" y="358" width="216" height="64" rx="7" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
        <text x="590" y="380" textAnchor="middle" fontSize="11" fontWeight="600" fill="#c2410c">Gut permeability ↑</text>
        <text x="590" y="396" textAnchor="middle" fontSize="10" fill="#ea580c">Inflammatory signals</text>
        <text x="590" y="411" textAnchor="middle" fontSize="10" fill="#ea580c">cross into bloodstream</text>

        {/* ── Row 5: Symptoms ────────────────────────────────────── */}
        <rect x="110" y="468" width="540" height="52" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        <text x="380" y="488" textAnchor="middle" fontSize="12" fontWeight="700" fill="#f1f5f9">YOUR SYMPTOMS</text>
        <text x="380" y="508" textAnchor="middle" fontSize="11" fill="#94a3b8">Bloating · Post-meal fatigue · Hormonal variability · Energy crashes</text>
      </svg>

      <p className="cascade-caption">
        All three deficits trace back to one root node: Akkermansia. Restoring it first breaks the cascade.
      </p>
    </div>
  );
}
