/**
 * Evidence-backed food and lifestyle recommendations prioritised by finding severity.
 */

export default function RecommendationList({ deficits = [], recommendationsNarrative = "" }) {
  const actionable = deficits
    .filter((d) => d.interventions)
    .slice(0, 4);

  return (
    <div className="recommendation-list">
      <h2 className="section-title">Your personalised action plan</h2>

      {recommendationsNarrative && (
        <p className="recommendations-intro">{recommendationsNarrative}</p>
      )}

      {actionable.map((finding) => {
        const iv = finding.interventions;
        const items = iv.increase_with || iv.reduce_with || [];
        const action = iv.increase_with ? "Increase" : "Reduce";

        return (
          <div key={finding.species_key} className="rec-group">
            <h3 className="rec-group-title">
              {action}: <em>{finding.display_name}</em>
            </h3>
            <div className="rec-items">
              {items.slice(0, 3).map((item, i) => (
                <div key={i} className="rec-item">
                  <div className="rec-item-header">
                    <span className="rec-item-name">{item.name}</span>
                    <span className="rec-timeline">{item.timeline}</span>
                  </div>
                  <p className="rec-dose">{item.dose}</p>
                  <p className="rec-mechanism">{item.mechanism}</p>
                  {item.evidence && (
                    <p className="rec-evidence">📄 {item.evidence}</p>
                  )}
                </div>
              ))}
            </div>
            {iv.avoid && (
              <div className="rec-avoid">
                <p className="avoid-label">Things to limit:</p>
                <ul>
                  {iv.avoid.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
