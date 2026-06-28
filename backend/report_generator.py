"""
Orchestrates analytics + LLM interpretation into a final report dict.
"""

import json
from pathlib import Path
from backend.analytics import run_full_analytics
from backend.interpret import generate_full_narrative

DATA_DIR = Path(__file__).parent.parent / "data"
REF_DIR = DATA_DIR / "reference"


def load_profile(profile_path: str | None = None) -> dict:
    path = Path(profile_path) if profile_path else DATA_DIR / "susan_profile.json"
    with open(path) as f:
        return json.load(f)


def load_papers() -> dict:
    with open(REF_DIR / "papers.json") as f:
        return json.load(f)


def generate_report(profile_path: str | None = None) -> dict:
    """
    Full pipeline:
    1. Load Susan's profile
    2. Run analytics (pure math, no API)
    3. Call Claude API for narrative interpretation
    4. Return structured report dict ready for JSON serialisation
    """
    profile = load_profile(profile_path)
    papers = load_papers()

    analytics = run_full_analytics(profile)
    narrative = generate_full_narrative(analytics, papers)

    top_deficits = [
        {
            "species_key": f["species_key"],
            "display_name": f["display_name"],
            "flag": f["flag"],
            "value_pct": f["value_pct"],
            "percentile_data": f["percentile_data"],
            "sex_specific_note": f["sex_specific_note"],
            "narrative": next(
                (n["narrative"] for n in narrative["findings"] if n["species_key"] == f["species_key"]),
                None,
            ),
            "interventions": f.get("interventions"),
        }
        for f in analytics["deficits"][:4]
    ]

    return {
        "user": analytics["user"],
        "gut_score": analytics["gut_score"],
        "shannon": analytics["shannon"],
        "enterotype": {
            **analytics["enterotype"],
            "narrative": narrative["enterotype_narrative"],
        },
        "score_narrative": narrative["score_narrative"],
        "top_deficits": top_deficits,
        "recommendations_narrative": narrative["recommendations_narrative"],
        "estrobolome_narrative": narrative["estrobolome_narrative"],
        "top_abundances": analytics["top_abundances"],
        "species_detail": analytics["species_detail"],
        "papers": papers,
    }
