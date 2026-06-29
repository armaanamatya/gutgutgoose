"""
Orchestrates analytics + pre-computed (or live) narrative into a final report dict.
Pre-computed narratives in data/susan_narratives.json are used when present.
Set ANTHROPIC_API_KEY and delete that file to switch to live API calls.
"""

import json
import os
from pathlib import Path
from backend.analytics import run_full_analytics

DATA_DIR = Path(__file__).parent.parent / "data"
REF_DIR = DATA_DIR / "reference"
NARRATIVES_FILE = DATA_DIR / "susan_narratives.json"


def load_profile(profile_path: str | None = None) -> dict:
    path = Path(profile_path) if profile_path else DATA_DIR / "susan_profile.json"
    with open(path) as f:
        return json.load(f)


def load_papers() -> dict:
    with open(REF_DIR / "papers.json") as f:
        return json.load(f)


def load_narratives(analytics: dict, papers: dict) -> dict:
    """Return pre-computed narratives if available, otherwise call live API."""
    if NARRATIVES_FILE.exists():
        with open(NARRATIVES_FILE) as f:
            return json.load(f)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "No pre-computed narratives found and ANTHROPIC_API_KEY is not set. "
            "Either add data/susan_narratives.json or set the API key."
        )
    from backend.interpret import generate_full_narrative
    return generate_full_narrative(analytics, papers)


def generate_report(profile_path: str | None = None) -> dict:
    """
    Full pipeline:
    1. Load Susan's profile
    2. Run analytics (pure math, no API)
    3. Load narratives (pre-computed file, or live Claude API as fallback)
    4. Return structured report dict ready for JSON serialisation
    """
    profile = load_profile(profile_path)
    papers = load_papers()

    analytics = run_full_analytics(profile)
    narrative = load_narratives(analytics, papers)

    narrative_by_species = {n["species_key"]: n["narrative"] for n in narrative.get("findings", [])}

    top_deficits = [
        {
            "species_key": f["species_key"],
            "display_name": f["display_name"],
            "flag": f["flag"],
            "value_pct": f["value_pct"],
            "percentile_data": f["percentile_data"],
            "sex_specific_note": f["sex_specific_note"],
            "papers": f.get("papers", []),
            "narrative": narrative_by_species.get(f["species_key"]),
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
        "gut_age": analytics["gut_age"],
        "top_abundances": analytics["top_abundances"],
        "species_detail": analytics["species_detail"],
        "papers": papers,
    }
