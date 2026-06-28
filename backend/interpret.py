"""
Claude API calls to generate plain-English interpretations of microbiome findings.
Each function constructs a targeted prompt, calls claude-sonnet-4-6, and returns structured text.
"""

import os
import json
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-sonnet-4-6"


def _call(system: str, user_msg: str, max_tokens: int = 600) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    return response.content[0].text.strip()


SYSTEM_BASE = """You are a gut health specialist writing a personalised microbiome report for a
non-technical user. Your tone is warm, clear, and science-backed but never alarming.
You explain mechanisms without jargon. You NEVER diagnose diseases or prescribe medication.
You recommend only diet and lifestyle changes. Keep responses concise — 2-4 sentences per finding.
Always relate findings back to the user's stated goals and demographic when relevant."""


def interpret_gut_score(gut_score: dict, user: dict) -> str:
    prompt = f"""
User: {user['name']}, {user['age']}F, goals: {', '.join(user['goals'])}.

Gut score: {gut_score['total']}/100 ({gut_score['label']}, Grade {gut_score['grade']})
Components:
- Diversity: {gut_score['components']['diversity']}/30
- Butyrate producers: {gut_score['components']['butyrate_producers']}/35
- Akkermansia: {gut_score['components']['akkermansia']}/20
- Proteobacteria (E. coli) penalty: {gut_score['components']['proteobacteria_penalty']}/15

Write 2-3 sentences introducing {user['name']}'s gut health score in a positive, motivating way.
Mention which component is the biggest opportunity for improvement without being alarming.
"""
    return _call(SYSTEM_BASE, prompt, max_tokens=200)


def interpret_enterotype(enterotype: dict, user: dict) -> str:
    prompt = f"""
User: {user['name']}, {user['age']}F.

Assigned enterotype: {enterotype['assigned']} — {enterotype['name']}
Description: {enterotype['description']}
Confidence: {enterotype['confidence']}

Explain in 2 sentences what this gut type means for {user['name']} in plain English.
What does this tell us about her gut ecology and diet history? Keep it positive and educational.
"""
    return _call(SYSTEM_BASE, prompt, max_tokens=150)


def interpret_finding(finding: dict, user: dict, paper_refs: dict) -> str:
    papers_text = ""
    for pid in finding.get("papers", []):
        p = paper_refs.get(pid)
        if p:
            papers_text += f"\n- {p['authors']} ({p['year']}): {p['plain_english']}"

    percentile_info = ""
    pct = finding.get("percentile_data", {})
    if pct.get("available"):
        percentile_info = f"Her level ({finding['value_pct']:.1f}%) is at the {pct['percentile']}th percentile for women aged 40-50. Healthy median is {pct['p50']}%."

    sex_note = f"\nSex/age context: {finding['sex_specific_note']}" if finding.get("sex_specific_note") else ""

    prompt = f"""
User: {user['name']}, {user['age']}F, goals: {', '.join(user['goals'])}.
Symptom relevance: {', '.join(user['symptoms'])}

Finding: {finding['display_name']} — {finding['flag'].replace('_', ' ')}
What it does: {finding['what_it_does']}
Value: {finding['value_pct']:.2f}%
{percentile_info}{sex_note}

Supporting research:{papers_text if papers_text else " General consensus in microbiome literature."}

Write 3-4 sentences explaining this finding to {user['name']}.
- First sentence: what this bacteria does in plain terms.
- Second sentence: why her level matters in the context of her symptoms/goals.
- Third+ sentence: relate to any sex/age context if provided.
Keep it factual, warm, and actionable in tone (the recommendations come separately).
"""
    return _call(SYSTEM_BASE, prompt, max_tokens=300)


def interpret_recommendations(deficits: list[dict], user: dict) -> str:
    priority_findings = [
        f for f in deficits
        if f.get("flag") in ("critically_low", "critically_elevated", "low", "elevated")
    ][:3]

    findings_summary = "\n".join([
        f"- {f['display_name']}: {f['flag'].replace('_', ' ')} ({f['value_pct']:.1f}%)"
        for f in priority_findings
    ])

    interventions_text = ""
    for f in priority_findings:
        iv = f.get("interventions")
        if not iv:
            continue
        increase_items = iv.get("increase_with", []) or iv.get("reduce_with", [])
        if increase_items:
            top = increase_items[0]
            interventions_text += f"\n- {f['display_name']}: {top['name']} ({top['dose']}) — {top['timeline']}"

    prompt = f"""
User: {user['name']}, {user['age']}F, goals: {', '.join(user['goals'])}, diet: {user.get('diet_type', 'omnivore')}.

Top priority findings:
{findings_summary}

Evidence-backed interventions available:
{interventions_text}

Write a concise, personalised action plan for {user['name']} (4-5 sentences total):
1. One opening sentence acknowledging her goals.
2. Two to three specific food/lifestyle recommendations (from the interventions above).
3. One closing sentence about timeline and mindset (gut change takes weeks, not days).
Be warm, specific, and practical. Name actual foods. No supplements unless already listed.
"""
    return _call(SYSTEM_BASE, prompt, max_tokens=350)


def interpret_estrobolome(ecoli_pct: float, akkermansia_pct: float, user: dict) -> str:
    prompt = f"""
User: {user['name']}, {user['age']}F, symptoms: {', '.join(user['symptoms'])}.

Estrobolome finding:
- E. coli at {ecoli_pct:.1f}% (healthy median: 0.3%, concern threshold: 3%).
  E. coli produces beta-glucuronidase, the enzyme that reactivates estrogens excreted in bile.
- Akkermansia muciniphila at {akkermansia_pct:.2f}% (critically low; healthy median: 1.2%).
  Estrogen maintains the gut mucus layer that Akkermansia lives in.
  Low estrogen (perimenopause context) → thin mucus → less Akkermansia.

Reference: Plottel & Blaser (2011) Cell Host & Microbe coined the term 'estrobolome' —
the gut bacteria that regulate estrogen recycling and thus circulating estrogen levels.

In 3-4 sentences, explain to {user['name']} how her gut bacteria are interacting with her
hormonal health in plain, non-alarming language. Explain what the estrobolome is.
Note the compounding feedback between low Akkermansia and the mucus layer.
Do NOT mention cancer risk. Do NOT mention perimenopause diagnosis — frame as 'as women approach midlife'.
"""
    return _call(SYSTEM_BASE, prompt, max_tokens=300)


def generate_full_narrative(analytics: dict, paper_refs: dict) -> dict:
    """
    Orchestrates all Claude API calls and returns a structured narrative dict.
    Called once per report generation.
    """
    user = analytics["user"]
    deficits = analytics["deficits"]
    abundances = {d["species_key"]: d["value_pct"] for d in analytics.get("deficits", [])}

    ecoli_pct = next((d["value_pct"] for d in deficits if "Escherichia" in d["species_key"]), 0)
    akk_pct = next((d["value_pct"] for d in deficits if "Akkermansia" in d["species_key"]), 0)

    score_narrative = interpret_gut_score(analytics["gut_score"], user)
    enterotype_narrative = interpret_enterotype(analytics["enterotype"], user)

    finding_narratives = []
    for finding in deficits[:4]:
        narrative = interpret_finding(finding, user, paper_refs)
        finding_narratives.append({
            "species_key": finding["species_key"],
            "display_name": finding["display_name"],
            "flag": finding["flag"],
            "value_pct": finding["value_pct"],
            "narrative": narrative,
            "interventions": finding.get("interventions"),
            "percentile_data": finding.get("percentile_data"),
            "sex_specific_note": finding.get("sex_specific_note"),
        })

    recommendations_narrative = interpret_recommendations(deficits, user)

    estrobolome_narrative = None
    if ecoli_pct > 3.0 or akk_pct < 1.0:
        estrobolome_narrative = interpret_estrobolome(ecoli_pct, akk_pct, user)

    return {
        "score_narrative": score_narrative,
        "enterotype_narrative": enterotype_narrative,
        "findings": finding_narratives,
        "recommendations_narrative": recommendations_narrative,
        "estrobolome_narrative": estrobolome_narrative,
    }
