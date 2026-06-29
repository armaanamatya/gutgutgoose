import { useState } from "react";

const FOODS = [
  // GREEN — actively beneficial for Susan's specific deficits
  { color: "green", emoji: "🍎", name: "Pomegranate juice",
    why: "Ellagitannins → urolithins → directly feeds YOUR Akkermansia. The most evidence-backed single food for your #1 deficit.",
    how: "240 mL daily before breakfast" },
  { color: "green", emoji: "🍵", name: "Green tea",
    why: "EGCG promotes Akkermansia AND protects the mucus layer it lives in — dual action for your most critical species.",
    how: "2–3 cups daily" },
  { color: "green", emoji: "🥛", name: "Kefir",
    why: "Live Lactobacillus compete directly with YOUR E. coli (26× median) and lower gut pH — an environment E. coli dislikes.",
    how: "200 mL daily, with or after breakfast" },
  { color: "green", emoji: "🥬", name: "Kimchi",
    why: "High-diversity Lactobacillus + pH lowering — the two mechanisms that suppress YOUR elevated Proteobacteria.",
    how: "2–3 tablespoons daily" },
  { color: "green", emoji: "🫙", name: "Live-culture yoghurt",
    why: "Bifidobacterium transiently colonises your gut, outcompetes E. coli, and rebuilds your below-optimal Bifidobacterium longum.",
    how: "150 g daily — check label says 'live cultures'" },
  { color: "green", emoji: "🌾", name: "Oats",
    why: "Beta-glucan fermented by Lachnospiraceae → butyrate. Direct fuel for the pathway YOUR Faecalibacterium is supposed to drive.",
    how: "1 cup cooked daily, morning is best" },
  { color: "green", emoji: "🧅", name: "Leeks, garlic, onions (cooked)",
    why: "Natural FOS — the direct prebiotic substrate for YOUR Faecalibacterium prausnitzii. Cooking cuts gas without losing prebiotics.",
    how: "1 serving daily in cooking" },
  { color: "green", emoji: "🌿", name: "Jerusalem artichoke",
    why: "Highest natural inulin source — the most direct Faecalibacterium fuel. Start small: your E. coli level will cause gas at first.",
    how: "Start: 50 g 2×/week → build to 150 g over 3 weeks" },
  { color: "green", emoji: "🫐", name: "Unsweetened cranberry juice",
    why: "A-type proanthocyanidins specifically promote Akkermansia — one of only three foods with direct species-level evidence.",
    how: "240 mL unsweetened daily" },
  { color: "green", emoji: "🫘", name: "Lentils / chickpeas",
    why: "GOS is the primary prebiotic for YOUR Bifidobacterium longum — and legumes also suppress E. coli via gut pH lowering.",
    how: "3–4 servings per week" },

  // YELLOW — good, but introduce carefully given Susan's current balance
  { color: "yellow", emoji: "🍞", name: "Whole grain bread",
    why: "Better than white (less E. coli fuel) but gas is likely in the first 2 weeks. Introduce after fermented foods are established.",
    how: "1–2 slices daily, start after week 2" },
  { color: "yellow", emoji: "🥗", name: "Cooled potato / rice salad",
    why: "Cooling converts starch to RS3 (resistant starch) — fermented for butyrate. Hot versions give E. coli a fast sugar hit instead.",
    how: "Cold potato salad or cold rice — never freshly hot" },
  { color: "yellow", emoji: "🫐", name: "Blueberries",
    why: "Anthocyanins have modest prebiotic effect and are anti-inflammatory. Good, but secondary to your priority interventions.",
    how: "Handful daily as a snack or with oats" },
  { color: "yellow", emoji: "🍫", name: "Dark chocolate (85%+)",
    why: "Polyphenols feed beneficial bacteria. High cocoa = minimal added sugar (your E. coli's main fuel). Milk chocolate is red.",
    how: "1–2 squares daily" },
  { color: "yellow", emoji: "🍌", name: "Unripe (green-tipped) banana",
    why: "Resistant starch RS2 when green feeds butyrate producers. Ripe banana is mostly fast-digesting sugar that E. coli prefers.",
    how: "1 daily, only when still green-tipped" },
  { color: "yellow", emoji: "🫘", name: "Hummus",
    why: "Prebiotic benefit from chickpeas, but high-fermentation at your E. coli level means initial gas. Add after week 3.",
    how: "2 tablespoons max until E. coli comes down" },

  // RED — actively harmful for Susan's specific profile
  { color: "red", emoji: "🍝", name: "White bread / white pasta",
    why: "Fast-digesting starch = E. coli's preferred fuel. Every serving actively feeds the imbalance driving your bloating and hormone recycling.",
    how: "Avoid for 8 weeks; swap for whole grain or legume-based" },
  { color: "red", emoji: "🍚", name: "Hot freshly-cooked white rice",
    why: "High glycaemic, quickly fermented by E. coli. Cold rice (resistant starch) is yellow — the preparation matters.",
    how: "Let it cool completely, or choose whole grains" },
  { color: "red", emoji: "🍬", name: "Added sugar / sweets",
    why: "Simple sugars are E. coli's primary competitive advantage. Every 10 g of added sugar fuels the species disrupting your hormones.",
    how: "Target < 25 g added sugar daily" },
  { color: "red", emoji: "🥤", name: "Diet sodas (saccharin or sucralose)",
    why: "Saccharin and sucralose directly reduce Akkermansia — the species you're trying to rebuild. Stevia is acceptable.",
    how: "Avoid entirely. Switch to sparkling water + lemon." },
  { color: "red", emoji: "🍪", name: "Ultra-processed snacks",
    why: "Emulsifiers (CMC, polysorbate-80) physically erode the mucus layer where YOUR Akkermansia lives. Check E471, E433 on labels.",
    how: "Replace with nuts, fruit, dark chocolate, or live yoghurt" },
  { color: "red", emoji: "🧃", name: "Fruit juice (with added sugar)",
    why: "High fructose without fibre = fast E. coli fermentation. Pomegranate juice is the one exception (see green).",
    how: "Eat whole fruit; or choose unsweetened pomegranate" },
];

const CONFIG = {
  green:  { label: "Eat freely",       bg: "#f0fdf4", border: "#22c55e", dot: "#16a34a", text: "#14532d" },
  yellow: { label: "Introduce slowly", bg: "#fefce8", border: "#eab308", dot: "#ca8a04", text: "#713f12" },
  red:    { label: "Avoid for 8 weeks",bg: "#fef2f2", border: "#ef4444", dot: "#dc2626", text: "#7f1d1d" },
};

function FoodRow({ food }) {
  const [open, setOpen] = useState(false);
  const c = CONFIG[food.color];
  return (
    <button
      className="food-row"
      style={{ borderLeftColor: c.border }}
      onClick={() => setOpen(o => !o)}
    >
      <span className="food-dot" style={{ background: c.dot }} />
      <span className="food-emoji">{food.emoji}</span>
      <span className="food-name">{food.name}</span>
      <span className="food-chevron">{open ? "▲" : "▼"}</span>
      {open && (
        <div className="food-detail">
          <p className="food-why">{food.why}</p>
          <p className="food-how"><strong>How:</strong> {food.how}</p>
        </div>
      )}
    </button>
  );
}

export default function FoodTrafficLight() {
  const [activeTab, setActiveTab] = useState("green");
  const foods = FOODS.filter(f => f.color === activeTab);
  const c = CONFIG[activeTab];

  return (
    <div className="ftl-wrap">
      <div className="ftl-tabs">
        {["green", "yellow", "red"].map(col => (
          <button
            key={col}
            className={`ftl-tab ftl-tab--${col}${activeTab === col ? " ftl-tab--active" : ""}`}
            onClick={() => setActiveTab(col)}
          >
            <span className="ftl-tab-dot" style={{ background: CONFIG[col].dot }} />
            {CONFIG[col].label}
          </button>
        ))}
      </div>
      <div className="ftl-list" style={{ background: c.bg, borderColor: c.border }}>
        {foods.map(food => <FoodRow key={food.name} food={food} />)}
      </div>
      <p className="ftl-note">
        Tap any food to see why it specifically matters for YOUR microbiome profile.
      </p>
    </div>
  );
}
