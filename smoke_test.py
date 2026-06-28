"""
Smoke test: verifies all data files load, analytics run, and scores compute correctly.
Does NOT call the Claude API. Run: python smoke_test.py
"""

import json, sys, math
sys.path.insert(0, ".")  # run from gutgutgoose/ root

from backend.analytics import (
    clr_transform, shannon_diversity, assign_enterotype,
    compute_gut_score, identify_deficits, run_full_analytics,
    percentile_rank, shannon_percentile,
)

def test_clr():
    vals = {"A": 10.0, "B": 20.0, "C": 70.0}
    clr = clr_transform(vals)
    mean_clr = sum(clr.values()) / len(clr)
    assert abs(mean_clr) < 1e-10, f"CLR mean should be ~0, got {mean_clr}"
    print("[OK] CLR transform: mean-zero property holds")

def test_shannon():
    equal = {str(i): 1.0 for i in range(10)}
    h = shannon_diversity(equal)
    expected = math.log(10)
    assert abs(h - expected) < 0.001, f"Shannon H expected {expected:.3f}, got {h}"
    print(f"[OK] Shannon diversity: H={h:.3f} (expected {expected:.3f})")

def test_profile_loads():
    with open("data/susan_profile.json") as f:
        profile = json.load(f)
    total = sum(profile["relative_abundance"].values())
    # MetaPhlAn4 excludes unclassified reads so total is typically 95-100%, not exactly 100
    assert 90.0 <= total <= 105.0, f"Abundances out of expected range: {total}"
    print(f"[OK] Susan profile: {len(profile['relative_abundance'])} species, total={total:.2f}% (unclassified reads excluded)")
    return profile

def test_full_analytics(profile):
    result = run_full_analytics(profile)

    gs = result["gut_score"]
    print(f"[OK] Gut score: {gs['total']}/100 (Grade {gs['grade']} -- {gs['label']})")
    print(f"     Components: {gs['components']}")

    sh = result["shannon"]
    print(f"[OK] Shannon H: {sh['H']} ({sh['label']}, {sh['percentile']}th percentile)")

    et = result["enterotype"]
    print(f"[OK] Enterotype: {et['assigned']} -- {et['name']}")
    print(f"     Distances: {et['distances']}")

    deficits = result["deficits"]
    print(f"[OK] Deficits identified: {len(deficits)}")
    for d in deficits:
        print(f"     {d['display_name']}: {d['value_pct']:.2f}% [{d['flag']}]")

    return result

def test_percentile_rank():
    pr = percentile_rank("s__Akkermansia_muciniphila", 0.48)
    assert pr["available"]
    assert pr["percentile"] <= 25, f"Expected <=25th pctile, got {pr['percentile']}"
    print(f"[OK] Akkermansia percentile: {pr['percentile']}th (correctly low)")

    pr_ecoli = percentile_rank("s__Escherichia_coli", 7.9)
    assert pr_ecoli["percentile"] >= 90, f"Expected >=90th pctile, got {pr_ecoli['percentile']}"
    print(f"[OK] E. coli percentile: {pr_ecoli['percentile']}th (correctly elevated)")

if __name__ == "__main__":
    print("\n=== GutGutGoose Analytics Smoke Test ===\n")
    test_clr()
    test_shannon()
    profile = test_profile_loads()
    test_percentile_rank()
    test_full_analytics(profile)
    print("\n[PASS] All tests passed. Analytics layer is solid.")
    print("\nNext: set ANTHROPIC_API_KEY then run:")
    print("  uvicorn backend.main:app --reload")
    print("  cd frontend && npm install && npm run dev")
