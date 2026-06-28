import { useState } from "react";
import GutScoreGauge from "./components/GutScoreGauge";
import AbundanceChart from "./components/AbundanceChart";
import FindingCard from "./components/FindingCard";
import RecommendationList from "./components/RecommendationList";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      setReport(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <span className="logo">🦠 GutGutGoose</span>
          <p className="header-tagline">Your personalised microbiome report</p>
        </div>
      </header>

      {/* Landing / trigger */}
      {!report && !loading && (
        <div className="landing">
          <div className="landing-card">
            <h1>Hi, Susan 👋</h1>
            <p className="landing-sub">
              We've analysed your shotgun metagenomic sequencing data from your stool sample.
              Your report takes about 15 seconds to generate — we're asking our AI to read
              the science and explain it in plain English just for you.
            </p>
            <button className="btn-primary" onClick={runAnalysis}>
              Generate my gut report →
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Analysing your microbiome… reading the science…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn-secondary" onClick={runAnalysis}>Retry</button>
        </div>
      )}

      {report && (
        <main className="report">
          {/* Section 1: Score + summary */}
          <section className="report-section score-section">
            <div className="score-left">
              <GutScoreGauge
                score={report.gut_score.total}
                label={report.gut_score.label}
                grade={report.gut_score.grade}
              />
              <div className="score-breakdown">
                {Object.entries(report.gut_score.components).map(([k, v]) => (
                  <div key={k} className="score-component">
                    <span className="comp-label">{k.replace(/_/g, " ")}</span>
                    <div className="comp-bar">
                      <div
                        className="comp-fill"
                        style={{ width: `${(v / (k === "diversity" ? 30 : k === "butyrate_producers" ? 35 : k === "akkermansia" ? 20 : 15)) * 100}%` }}
                      />
                    </div>
                    <span className="comp-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="score-right">
              <h2>Your Gut Health Score</h2>
              <p className="score-narrative">{report.score_narrative}</p>
              <div className="diversity-badge">
                <span>Diversity (Shannon H): <strong>{report.shannon?.H?.toFixed(2)}</strong></span>
                <span className="pct-badge">{report.shannon?.percentile}th percentile</span>
                <span className="div-label">{report.shannon?.label}</span>
              </div>
              <div className="enterotype-badge">
                <span>Gut type: <strong>{report.enterotype?.name}</strong></span>
                <p className="enterotype-sub">{report.enterotype?.narrative}</p>
              </div>
            </div>
          </section>

          {/* Section 2: Abundance chart */}
          <section className="report-section chart-section">
            <h2 className="section-title">Your top 10 species by abundance</h2>
            <AbundanceChart
              topAbundances={report.top_abundances}
              deficits={report.top_deficits}
            />
          </section>

          {/* Section 3: Findings */}
          <section className="report-section findings-section">
            <h2 className="section-title">Key findings</h2>
            <p className="section-subtitle">
              We identified {report.top_deficits?.length} areas that explain your symptoms
              and offer the biggest opportunity for improvement.
            </p>
            {report.top_deficits?.map((finding) => (
              <FindingCard
                key={finding.species_key}
                finding={finding}
                papers={report.papers}
              />
            ))}
          </section>

          {/* Section 4: Estrobolome (female-specific) */}
          {report.estrobolome_narrative && (
            <section className="report-section estrobolome-section">
              <h2 className="section-title">Your gut & hormonal health</h2>
              <div className="estrobolome-card">
                <p>{report.estrobolome_narrative}</p>
              </div>
            </section>
          )}

          {/* Section 5: Recommendations */}
          <section className="report-section recs-section">
            <RecommendationList
              deficits={report.top_deficits}
              recommendationsNarrative={report.recommendations_narrative}
            />
          </section>

          {/* Footer */}
          <footer className="report-footer">
            <p>
              This report is for educational purposes and does not constitute medical advice.
              Always consult a healthcare professional before making significant dietary changes.
            </p>
            <p className="footer-brand">
              Powered by GutGutGoose · Shotgun metagenomics × AI interpretation
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}
