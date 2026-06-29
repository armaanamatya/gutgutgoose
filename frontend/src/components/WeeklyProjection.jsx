const MILESTONES = [
  {
    week: 0,
    icon: "🔴",
    title: "Your baseline",
    score: "52",
    items: ["High E. coli (7.9%)", "Critically low Akkermansia", "Butyrate deficit", "Hormonal recycling elevated"],
  },
  {
    week: 2,
    icon: "🟠",
    title: "E. coli starts declining",
    score: "~55",
    items: ["Fermented foods lower gut pH", "E. coli loses competitive advantage", "Bloating may temporarily worsen as balance shifts"],
  },
  {
    week: 4,
    icon: "🟡",
    title: "Bloating noticeably improves",
    score: "~59",
    items: ["Butyrate producers recovering", "Gut wall integrity improving", "Energy more stable post-meals", "First Akkermansia signals"],
  },
  {
    week: 6,
    icon: "🟢",
    title: "Akkermansia measurably increases",
    score: "~63",
    items: ["Mucus layer starting to rebuild", "Oestrogen recycling reducing", "Faecalibacterium anchoring", "Hormonal variability improving"],
  },
  {
    week: 8,
    icon: "✅",
    title: "Retest window",
    score: "63–71",
    items: ["Akkermansia target: > 0.8%", "E. coli target: < 2.0%", "Gut score: C → B grade", "Book follow-up sequencing"],
  },
];

export default function WeeklyProjection({ report }) {
  const startScore = report?.gut_score?.total ?? 52;

  return (
    <div className="proj-wrap">
      <div className="proj-track">
        {/* horizontal connector line */}
        <div className="proj-line" />

        {MILESTONES.map((m, i) => (
          <div key={m.week} className="proj-milestone">
            <div className="proj-icon">{m.icon}</div>
            <div className="proj-dot" />
            <div className="proj-card">
              <div className="proj-week">Week {m.week}</div>
              <div className="proj-score">{m.week === 0 ? startScore : m.score}</div>
              <div className="proj-title">{m.title}</div>
              <ul className="proj-items">
                {m.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="proj-footer">
        <p>
          Predicted range at week 8: <strong>63–71</strong> (grade C → B).
          {" "}Consistency matters more than perfection — 80% adherence outperforms 100% for 3 days then nothing.
        </p>
        <p className="proj-retest-note">
          Book your follow-up sequencing at week 8 to measure the real change and refine your next phase.
        </p>
      </div>
    </div>
  );
}
