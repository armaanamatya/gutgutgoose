"""
Core analytics: CLR transform, Shannon diversity, gut score, percentile lookup, enterotype, deficits.
All functions are pure (no side effects) — they take dicts and return dicts.
"""

import json
import math
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
REF_DIR = DATA_DIR / "reference"

with open(REF_DIR / "hmp_percentiles.json") as f:
    HMP = json.load(f)

with open(REF_DIR / "species_metadata.json") as f:
    SPECIES_META = json.load(f)

with open(REF_DIR / "enterotype_centroids.json") as f:
    ENTEROTYPES = json.load(f)

with open(REF_DIR / "interventions.json") as f:
    INTERVENTIONS = json.load(f)


def clr_transform(abundances: dict[str, float]) -> dict[str, float]:
    """Centered Log-Ratio transform. Adds pseudocount 0.01 for zeros."""
    vals = {k: v + 0.01 for k, v in abundances.items()}
    gm = math.exp(sum(math.log(v) for v in vals.values()) / len(vals))
    return {k: math.log(v / gm) for k, v in vals.items()}


def shannon_diversity(abundances: dict[str, float]) -> float:
    """Shannon entropy H = -sum(p * log(p)) for non-zero abundances."""
    total = sum(abundances.values())
    h = 0.0
    for v in abundances.values():
        if v > 0:
            p = v / total
            h -= p * math.log(p)
    return round(h, 4)


def shannon_percentile(h: float) -> int:
    """
    Approximate percentile rank of Shannon H relative to curatedMetagenomicData healthy adults.
    Reference range (stool, MetaPhlAn4): p10=2.1, p25=2.4, p50=2.7, p75=3.0, p90=3.3
    """
    breakpoints = [(2.1, 10), (2.4, 25), (2.7, 50), (3.0, 75), (3.3, 90)]
    for threshold, pct in breakpoints:
        if h < threshold:
            return max(1, pct - 5)
    return 95


def percentile_rank(species_key: str, value: float, subgroup: str = "female_40_50") -> dict:
    """Return percentile position and direction for a species."""
    species = HMP.get("species", {}).get(species_key)
    if not species:
        return {"available": False}

    pctiles = species.get(subgroup) or species.get("all_healthy_adults")
    direction = species.get("direction", "neutral")

    rank = 5
    for label, threshold in [("p10", 10), ("p25", 25), ("p50", 50), ("p75", 75), ("p90", 90)]:
        if value >= pctiles.get(label, 0):
            rank = threshold

    return {
        "available": True,
        "value": value,
        "percentile": rank,
        "direction": direction,
        "p10": pctiles.get("p10"),
        "p25": pctiles.get("p25"),
        "p50": pctiles.get("p50"),
        "p75": pctiles.get("p75"),
        "p90": pctiles.get("p90"),
    }


def assign_enterotype(abundances: dict[str, float]) -> dict:
    """
    Assign enterotype by nearest centroid in CLR space using genus-level aggregation.
    Returns best match ET label + distances.
    """
    genus_totals: dict[str, float] = {}
    for species, pct in abundances.items():
        # Extract genus from s__Genus_species
        parts = species.replace("s__", "").split("_")
        genus = parts[0] if parts else "Unknown"
        genus_totals[genus] = genus_totals.get(genus, 0) + pct

    clr_genus = clr_transform(genus_totals)

    distances = {}
    for et_key, et_data in ENTEROTYPES.items():
        if et_key.startswith("_"):
            continue
        centroid = et_data["centroid"]
        centroid_clr = clr_transform(centroid)
        genera_used = ENTEROTYPES["_meta"]["genera_used"]

        dist = 0.0
        for g in genera_used:
            sample_val = clr_genus.get(g, clr_transform({"x": 0.01})["x"])
            centroid_val = centroid_clr.get(g, clr_transform({"x": 0.01})["x"])
            dist += (sample_val - centroid_val) ** 2
        distances[et_key] = round(math.sqrt(dist), 3)

    best = min(distances, key=distances.get)
    return {
        "assigned": best,
        "name": ENTEROTYPES[best]["name"],
        "description": ENTEROTYPES[best]["description"],
        "distances": distances,
        "confidence": "high" if min(distances.values()) < 3.0 else "moderate",
    }


def compute_gut_score(abundances: dict[str, float], shannon_h: float) -> dict:
    """
    Composite gut health score 0-100 based on:
    - Shannon diversity (weight 30)
    - Butyrate producers panel (weight 35): F. prausnitzii + Roseburia + E. rectale
    - Akkermansia (weight 20)
    - Proteobacteria penalty (weight 15): E. coli elevated = negative
    """
    # --- Diversity component (30 pts) ---
    div_score = min(30, (shannon_h / 3.3) * 30)

    # --- Butyrate producer component (35 pts) ---
    butyrate_producers = [
        "s__Faecalibacterium_prausnitzii",
        "s__Roseburia_intestinalis",
        "s__Eubacterium_rectale",
        "s__Blautia_obeum",
    ]
    butyrate_total = sum(abundances.get(sp, 0) for sp in butyrate_producers)
    # Healthy target: butyrate producers ~18-22% combined
    butyrate_score = min(35, (butyrate_total / 20.0) * 35)

    # --- Akkermansia component (20 pts) ---
    akk = abundances.get("s__Akkermansia_muciniphila", 0)
    # Healthy target: ≥1.2%; critically low <0.5%; max score at ≥2%
    akk_score = min(20, (akk / 2.0) * 20)

    # --- Proteobacteria penalty (15 pts) ---
    ecoli = abundances.get("s__Escherichia_coli", 0)
    # Full 15 pts when E. coli ≤0.3% (median); loses all when ≥8%
    ecoli_penalty = max(0, 15 - (ecoli / 8.0) * 15)

    total = div_score + butyrate_score + akk_score + ecoli_penalty

    return {
        "total": round(total, 1),
        "components": {
            "diversity": round(div_score, 1),
            "butyrate_producers": round(butyrate_score, 1),
            "akkermansia": round(akk_score, 1),
            "proteobacteria_penalty": round(ecoli_penalty, 1),
        },
        "grade": "A" if total >= 80 else "B" if total >= 65 else "C" if total >= 50 else "D",
        "label": (
            "Excellent" if total >= 80 else
            "Good" if total >= 65 else
            "Needs attention" if total >= 50 else
            "Significant imbalance"
        ),
    }


def identify_deficits(abundances: dict[str, float]) -> list[dict]:
    """
    Return ordered list of clinically significant findings (deficits and elevations).
    Each entry includes severity, percentile context, and reference to interventions.
    """
    findings = []

    for species_key, meta in SPECIES_META.items():
        value = abundances.get(species_key, 0)
        direction = meta.get("direction")
        severity = meta.get("finding_severity")

        pct_data = percentile_rank(species_key, value)

        finding = {
            "species_key": species_key,
            "display_name": meta["display_name"],
            "value_pct": value,
            "direction": direction,
            "severity": severity,
            "what_it_does": meta.get("what_it_does_plain"),
            "primary_function": meta.get("primary_function"),
            "sex_specific_note": meta.get("sex_specific_note"),
            "papers": meta.get("papers", []),
            "percentile_data": pct_data,
            "interventions": INTERVENTIONS.get(species_key),
            "flag": None,
        }

        if direction == "higher_is_better":
            hmp_data = HMP["species"].get(species_key, {})
            threshold_low = hmp_data.get("threshold_low", 0)
            threshold_concern = hmp_data.get("threshold_concern", 0)
            if value < threshold_concern:
                finding["flag"] = "critically_low"
            elif value < threshold_low:
                finding["flag"] = "low"

        elif direction == "lower_is_better":
            hmp_data = HMP["species"].get(species_key, {})
            threshold_concern = hmp_data.get("threshold_concern", 0)
            threshold_elevated = hmp_data.get("threshold_elevated", 0)
            if value > threshold_concern:
                finding["flag"] = "critically_elevated"
            elif value > threshold_elevated:
                finding["flag"] = "elevated"

        if finding["flag"]:
            findings.append(finding)

    priority_order = {"critically_low": 0, "critically_elevated": 1, "low": 2, "elevated": 3}
    findings.sort(key=lambda f: (priority_order.get(f["flag"], 9), -abs(f["value_pct"])))

    return findings


def run_full_analytics(profile: dict) -> dict:
    """Entry point: takes a loaded susan_profile.json dict, returns full analytics."""
    abundances = profile["relative_abundance"]
    user = profile["user"]

    shannon_h = shannon_diversity(abundances)
    clr = clr_transform(abundances)
    enterotype = assign_enterotype(abundances)
    gut_score = compute_gut_score(abundances, shannon_h)
    deficits = identify_deficits(abundances)

    species_detail = {}
    for sp in SPECIES_META:
        species_detail[sp] = {
            **SPECIES_META[sp],
            "value_pct": abundances.get(sp, 0),
            "percentile": percentile_rank(sp, abundances.get(sp, 0)),
        }

    return {
        "user": user,
        "gut_score": gut_score,
        "shannon": {
            "H": shannon_h,
            "percentile": shannon_percentile(shannon_h),
            "label": (
                "High diversity" if shannon_h >= 3.0 else
                "Moderate diversity" if shannon_h >= 2.4 else
                "Low diversity"
            ),
        },
        "enterotype": enterotype,
        "species_detail": species_detail,
        "deficits": deficits,
        "top_abundances": sorted(
            [{"species": k, "pct": v} for k, v in abundances.items()],
            key=lambda x: -x["pct"]
        )[:10],
    }
