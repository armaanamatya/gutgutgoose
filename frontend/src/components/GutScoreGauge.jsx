/**
 * SVG arc gauge displaying the gut health score 0-100.
 * Color: red < 50, amber 50-65, green-yellow 65-80, green >= 80.
 */

const RADIUS = 80;
const STROKE_WIDTH = 14;
const CX = 100;
const CY = 100;
const START_ANGLE = -210;
const END_ANGLE = 30;
const ARC_SPAN = END_ANGLE - START_ANGLE;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function scoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export default function GutScoreGauge({ score = 0, label = "", grade = "" }) {
  const pct = Math.min(Math.max(score / 100, 0), 1);
  const fillEnd = START_ANGLE + ARC_SPAN * pct;
  const color = scoreColor(score);

  const trackPath = describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE);
  const fillPath = pct > 0 ? describeArc(CX, CY, RADIUS, START_ANGLE, fillEnd) : null;

  return (
    <div className="gut-score-gauge">
      <svg viewBox="0 0 200 160" width="240" height="192">
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        )}
        {/* Score number */}
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          fontSize="36"
          fontWeight="700"
          fill={color}
        >
          {Math.round(score)}
        </text>
        {/* /100 */}
        <text x={CX} y={CY + 28} textAnchor="middle" fontSize="12" fill="#9ca3af">
          / 100
        </text>
        {/* Grade */}
        <text x={CX} y={CY + 52} textAnchor="middle" fontSize="14" fill="#374151" fontWeight="600">
          Grade {grade}
        </text>
      </svg>
      <p className="gauge-label">{label}</p>
    </div>
  );
}
