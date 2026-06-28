/**
 * Radar chart comparing Susan's microbiome against the healthy reference range
 * for women aged 40-50 (HMP + curatedMetagenomicData).
 *
 * All axes normalised to 0-100 where:
 *   100 = at or above p75 (optimal)
 *    70 = at healthy median (p50)
 *    40 = at p25 (below average)
 *     0 = at or below concern threshold
 *
 * For E. coli (lower-is-better), the scale is inverted.
 */

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// ── Normalisation helpers ────────────────────────────────────────────────────

function scoreHigherBetter(value, p25, p50, p75, concern) {
  if (value <= concern) return Math.max(0, (value / concern) * 20);
  if (value <= p25)    return 20 + ((value - concern) / (p25 - concern)) * 20;
  if (value <= p50)    return 40 + ((value - p25) / (p50 - p25)) * 30;
  if (value <= p75)    return 70 + ((value - p50) / (p75 - p50)) * 20;
  return Math.min(100, 90 + ((value - p75) / p75) * 10);
}

function scoreLowerBetter(value, medianHealthy, concern) {
  if (value <= medianHealthy) return 90;
  if (value <= concern)        return Math.max(30, 90 - ((value - medianHealthy) / (concern - medianHealthy)) * 60);
  return Math.max(0, 30 - ((value - concern) / concern) * 30);
}

// ── Axis definitions ─────────────────────────────────────────────────────────

function buildAxes(report) {
  const abund  = Object.fromEntries(
    (report.top_abundances || []).map((s) => [s.species, s.pct])
  );
  const detail = report.species_detail || {};

  const get = (key) => abund[key] ?? detail[key]?.value_pct ?? detail[key]?.susan_value_pct ?? 0;

  const butyrateTotal =
    get("s__Faecalibacterium_prausnitzii") +
    get("s__Roseburia_intestinalis") +
    get("s__Eubacterium_rectale");

  const shannonH    = report.shannon?.H ?? 2.6;
  const shannonRef  = 2.7;
  const shannonP25  = 2.4;
  const shannonP75  = 3.0;
  const shannonCrit = 2.1;

  return [
    {
      label: "Akkermansia\n(gut barrier)",
      susan: scoreHigherBetter(get("s__Akkermansia_muciniphila"), 0.25, 1.0, 2.4, 0.5),
      ref:   scoreHigherBetter(1.0, 0.25, 1.0, 2.4, 0.5),
    },
    {
      label: "Faecalibacterium\n(anti-inflam.)",
      susan: scoreHigherBetter(get("s__Faecalibacterium_prausnitzii"), 4.5, 7.9, 11.8, 3.0),
      ref:   scoreHigherBetter(7.9, 4.5, 7.9, 11.8, 3.0),
    },
    {
      label: "Butyrate\nproducers",
      susan: scoreHigherBetter(butyrateTotal, 7.1, 14.2, 21.6, 4.0),
      ref:   scoreHigherBetter(14.2, 7.1, 14.2, 21.6, 4.0),
    },
    {
      label: "E. coli\n(dysbiosis ↓)",
      susan: scoreLowerBetter(get("s__Escherichia_coli"), 0.25, 3.0),
      ref:   scoreLowerBetter(0.25, 0.25, 3.0),
    },
    {
      label: "Bifidobacterium\n(immune)",
      susan: scoreHigherBetter(get("s__Bifidobacterium_longum"), 1.1, 2.5, 4.8, 0.5),
      ref:   scoreHigherBetter(2.5, 1.1, 2.5, 4.8, 0.5),
    },
    {
      label: "Diversity\n(Shannon H)",
      susan: scoreHigherBetter(shannonH, shannonP25, shannonRef, shannonP75, shannonCrit),
      ref:   scoreHigherBetter(shannonRef, shannonP25, shannonRef, shannonP75, shannonCrit),
    },
    {
      label: "Roseburia\n(butyrate)",
      susan: scoreHigherBetter(get("s__Roseburia_intestinalis"), 0.7, 1.9, 4.0, 0.3),
      ref:   scoreHigherBetter(1.9, 0.7, 1.9, 4.0, 0.3),
    },
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MicrobiomeRadar({ report }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !report) return;
    if (chartRef.current) chartRef.current.destroy();

    const axes  = buildAxes(report);
    const labels = axes.map((a) => a.label);
    const susanScores = axes.map((a) => Math.round(a.susan));
    const refScores   = axes.map((a) => Math.round(a.ref));

    chartRef.current = new Chart(canvasRef.current, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Healthy reference (women 40–50)",
            data: refScores,
            borderColor: "rgba(34,197,94,0.9)",
            backgroundColor: "rgba(34,197,94,0.12)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(34,197,94,0.9)",
            pointRadius: 4,
            borderDash: [6, 3],
          },
          {
            label: "Susan (your result)",
            data: susanScores,
            borderColor: "rgba(245,158,11,1)",
            backgroundColor: "rgba(245,158,11,0.18)",
            borderWidth: 2.5,
            pointBackgroundColor: "rgba(245,158,11,1)",
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              display: true,
              font: { size: 10 },
              color: "#9ca3af",
              backdropColor: "transparent",
              callback: (v) => (v === 70 ? "optimal" : v === 0 ? "critical" : ""),
            },
            grid: { color: "rgba(0,0,0,0.07)" },
            angleLines: { color: "rgba(0,0,0,0.1)" },
            pointLabels: {
              font: { size: 11, family: "'Inter', sans-serif" },
              color: "#374151",
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 12 },
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.r}/100`,
            },
          },
        },
      },
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [report]);

  return (
    <div className="radar-wrap">
      <canvas ref={canvasRef} />
      <p className="radar-note">
        Score 0–100 per axis · 70 = healthy median for women 40–50 · E. coli axis is inverted (lower = healthier)
      </p>
    </div>
  );
}
