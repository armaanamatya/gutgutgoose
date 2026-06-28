/**
 * Horizontal bar chart of top species abundances.
 * Bars colour-coded by finding flag (critically_low, low, elevated, critically_elevated, ok).
 */

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const FLAG_COLORS = {
  critically_low:      "#ef4444",
  low:                 "#f59e0b",
  elevated:            "#f97316",
  critically_elevated: "#dc2626",
  ok:                  "#22c55e",
  neutral:             "#6b7280",
};

function flagColor(speciesKey, deficits) {
  const deficit = deficits?.find((d) => d.species_key === speciesKey);
  if (!deficit) return FLAG_COLORS.ok;
  return FLAG_COLORS[deficit.flag] || FLAG_COLORS.neutral;
}

export default function AbundanceChart({ topAbundances = [], deficits = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = topAbundances.map((s) =>
      s.species.replace("s__", "").replace(/_/g, " ")
    );
    const values = topAbundances.map((s) => s.pct);
    const colors = topAbundances.map((s) => flagColor(s.species, deficits));

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Relative Abundance (%)",
            data: values,
            backgroundColor: colors,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.x.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Relative abundance (%)" },
            min: 0,
          },
          y: {
            ticks: {
              font: { size: 11, family: "'Inter', sans-serif" },
              color: "#374151",
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [topAbundances, deficits]);

  return (
    <div className="abundance-chart">
      <canvas ref={canvasRef} />
      <div className="chart-legend">
        {Object.entries(FLAG_COLORS).map(([flag, color]) => (
          <span key={flag} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {flag.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
