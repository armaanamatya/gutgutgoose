import { useState, useEffect } from "react";

const METRICS = [
  { key: "energy",   label: "Energy",   icons: ["😩","😔","😐","😊","🌟"], higherBetter: true },
  { key: "bloating", label: "Bloating", icons: ["😫","😣","😐","🙂","😊"], higherBetter: false,
    note: "5 = no bloating" },
  { key: "mood",     label: "Mood",     icons: ["😢","😕","😐","🙂","😄"], higherBetter: true },
];

const STORAGE_KEY = "gggoose_checkins";

function getCheckins() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveCheckin(date, values) {
  const all = getCheckins();
  all[date] = values;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function last7(checkins) {
  const days = Object.keys(checkins).sort().slice(-7);
  return days.map(d => ({ date: d, ...checkins[d] }));
}

function avg(entries, key) {
  if (!entries.length) return 0;
  return entries.reduce((s, e) => s + (e[key] ?? 0), 0) / entries.length;
}

function Sparkline({ data, metricKey, color }) {
  if (data.length < 2) return null;
  const vals = data.map(d => d[metricKey] ?? 0);
  const max = 5, min = 1;
  const W = 240, H = 48, pad = 6;
  const xStep = (W - pad * 2) / (vals.length - 1);
  const yScale = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const points = vals.map((v, i) => `${pad + i * xStep},${yScale(v)}`).join(" ");

  return (
    <svg width={W} height={H} className="sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={pad + i * xStep} cy={yScale(v)} r="3" fill={color} />
      ))}
    </svg>
  );
}

function getInsight(history) {
  if (history.length < 6) return null;
  const first3 = history.slice(0, 3);
  const last3  = history.slice(-3);
  const insights = [];

  const energyTrend = avg(last3, "energy") - avg(first3, "energy");
  const bloatTrend  = avg(last3, "bloating") - avg(first3, "bloating");
  const moodTrend   = avg(last3, "mood") - avg(first3, "mood");

  if (energyTrend >= 0.5) insights.push("Your energy is trending up — the protocol is working.");
  if (bloatTrend  >= 0.5) insights.push("Bloating is reducing as gut balance shifts.");
  if (moodTrend   >= 0.5) insights.push("Mood scores are improving — gut-brain axis responding.");
  if (energyTrend < -0.3) insights.push("Energy dipped recently — check for sleep quality or hidden sugar intake.");

  return insights.length ? insights[0] : "Keep logging — patterns emerge after 7 days.";
}

export default function DailyCheckIn() {
  const today = new Date().toISOString().slice(0, 10);
  const [checkins, setCheckins] = useState(getCheckins);
  const [values, setValues] = useState({ energy: 0, bloating: 0, mood: 0 });
  const [saved, setSaved] = useState(false);

  const alreadyLogged = !!checkins[today];
  const history = last7(checkins);

  useEffect(() => {
    if (alreadyLogged) setValues(checkins[today]);
  }, []);

  function handleSelect(key, val) {
    if (alreadyLogged) return;
    setValues(v => ({ ...v, [key]: val }));
  }

  function handleSave() {
    if (!values.energy || !values.bloating || !values.mood) return;
    saveCheckin(today, values);
    setCheckins(getCheckins());
    setSaved(true);
  }

  const insight = getInsight(history);

  return (
    <div className="checkin-wrap">
      <div className="checkin-header">
        <h3 className="checkin-title">Daily gut check-in</h3>
        <p className="checkin-sub">
          3 taps. Over time we surface what's actually driving your symptoms.
        </p>
      </div>

      <div className="checkin-metrics">
        {METRICS.map(m => (
          <div key={m.key} className="checkin-metric">
            <div className="checkin-metric-label">
              {m.label}
              {m.note && <span className="checkin-note"> ({m.note})</span>}
            </div>
            <div className="checkin-icons">
              {m.icons.map((icon, idx) => {
                const val = idx + 1;
                const active = values[m.key] === val;
                return (
                  <button
                    key={val}
                    className={`checkin-icon-btn${active ? " checkin-icon-btn--active" : ""}`}
                    onClick={() => handleSelect(m.key, val)}
                    disabled={alreadyLogged}
                    title={`${m.label}: ${val}/5`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!alreadyLogged && (
        <button
          className="checkin-save"
          disabled={!values.energy || !values.bloating || !values.mood}
          onClick={handleSave}
        >
          {saved ? "Saved ✓" : "Log today"}
        </button>
      )}
      {alreadyLogged && (
        <p className="checkin-done">Today's check-in logged ✓</p>
      )}

      {history.length >= 2 && (
        <div className="checkin-trends">
          <div className="checkin-trend-title">
            7-day trend {history.length < 7 && `(${history.length} days so far)`}
          </div>
          <div className="checkin-sparklines">
            {METRICS.map(m => (
              <div key={m.key} className="checkin-spark-row">
                <span className="checkin-spark-label">{m.label}</span>
                <Sparkline
                  data={history}
                  metricKey={m.key}
                  color={m.key === "energy" ? "#3b82f6" : m.key === "bloating" ? "#f97316" : "#22c55e"}
                />
                <span className="checkin-spark-avg">
                  {avg(history, m.key).toFixed(1)}/5
                </span>
              </div>
            ))}
          </div>
          {insight && (
            <div className="checkin-insight">
              <span className="checkin-insight-icon">💡</span> {insight}
            </div>
          )}
        </div>
      )}

      {history.length === 0 && (
        <p className="checkin-empty">Log your first entry above — patterns emerge after a few days.</p>
      )}
    </div>
  );
}
