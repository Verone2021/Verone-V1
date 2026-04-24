#!/usr/bin/env python3
"""
supabase-advisors-check.py — interroge le Supabase Management API pour
lister les advisors (security ou performance) du projet.

Source officielle :
  https://supabase.com/docs/guides/database/database-advisors
  https://supabase.com/docs/reference/api/v1-list-project-lints-types

Usage :
  SUPABASE_ACCESS_TOKEN=<PAT> SUPABASE_PROJECT_REF=<ref> \\
    python3 scripts/supabase-advisors-check.py --type security --baseline scripts/supabase-advisors-baseline.json

Comportement :
  - Récupère les lints actuels via GET /v1/projects/{ref}/advisors/lints?type=security
  - Compte par `name` (ex: rls_policy_always_true, function_search_path_mutable)
  - Compare au baseline committé en repo (dict {name: expected_count})
  - Écrit advisors-summary.md (pour comment PR)
  - Exit code :
      0 = OK (count ≤ baseline pour chaque name)
      1 = nouveaux lints introduits (count > baseline)
      2 = erreur technique
  - En mode CI (continue-on-error), l'exit 1 passe en informational.

Setup secrets GitHub Actions :
  - SUPABASE_ACCESS_TOKEN : créé dans https://supabase.com/dashboard/account/tokens
  - SUPABASE_PROJECT_REF  : le ref du projet (ex. aorroydfjsrygmosnzrl)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from collections import Counter
from typing import Dict, List
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent.parent
SUMMARY_PATH = ROOT / "advisors-summary.md"


def fetch_advisors(project_ref: str, token: str, advisor_type: str) -> List[Dict]:
    # Endpoint officiel confirmé via OpenAPI spec :
    #   https://api.supabase.com/api/v1-json → /v1/projects/{ref}/advisors/security
    # (NB : l'URL plus intuitive /advisors/lints?type=security n'existe pas.)
    #
    # Note : Cloudflare (devant api.supabase.com) bloque les User-Agents
    # Python-urllib par défaut (error code 1010). On envoie un UA
    # identifiable pour traçabilité côté Supabase.
    url = f"https://api.supabase.com/v1/projects/{project_ref}/advisors/{advisor_type}"
    req = Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "verone-ci-advisors-check/1.0 (+https://github.com/Verone2021/Verone-V1)",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        print(f"ERROR: API returned {e.code}: {e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
        sys.exit(2)
    except URLError as e:
        print(f"ERROR: cannot reach Supabase API: {e}", file=sys.stderr)
        sys.exit(2)

    # Réponse possible :
    #   { "lints": [ { "name": "...", "level": "...", "title": "...", ... } ] }
    # OU directement une liste selon la version de l'API.
    if isinstance(data, dict) and "lints" in data:
        return data["lints"]
    if isinstance(data, list):
        return data
    print(f"WARN: unexpected API shape: {list(data)[:5]}", file=sys.stderr)
    return []


def load_baseline(path: Path) -> Dict[str, int]:
    if not path.exists():
        return {}
    try:
        with path.open() as f:
            obj = json.load(f)
        if isinstance(obj, dict):
            return {k: int(v) for k, v in obj.items()}
    except Exception as e:
        print(f"WARN: cannot parse baseline {path}: {e}", file=sys.stderr)
    return {}


def write_summary(
    advisor_type: str,
    current: Counter,
    baseline: Dict[str, int],
    regressions: List[tuple],
) -> None:
    lines = [f"## Supabase {advisor_type} advisors"]
    total = sum(current.values())
    base_total = sum(baseline.values()) if baseline else None

    if base_total is not None:
        delta = total - base_total
        emoji = "✅" if delta <= 0 else "⚠️"
        lines.append(f"**Total : {total}** ({emoji} baseline = {base_total}, delta = {delta:+d})")
    else:
        lines.append(f"**Total : {total}** (aucun baseline — cette mesure devient le baseline)")

    lines.append("")
    lines.append("| Lint | Count | Baseline | Δ |")
    lines.append("|------|------:|---------:|--:|")
    for name in sorted(set(list(current.keys()) + list(baseline.keys()))):
        c = current.get(name, 0)
        b = baseline.get(name, 0)
        delta = c - b
        marker = "🔴" if delta > 0 else ("✅" if delta < 0 else "—")
        lines.append(f"| `{name}` | {c} | {b} | {marker} {delta:+d} |")

    if regressions:
        lines.append("")
        lines.append("### ⚠️ Régressions (lints dépassant le baseline)")
        for name, current_count, base_count in regressions:
            lines.append(f"- `{name}` : {current_count} (baseline = {base_count}, +{current_count - base_count})")
        lines.append("")
        lines.append(f"**Action** : revoir le diff — les nouvelles issues ont été introduites par cette PR (ou par un changement DB hors migration). Soit corriger, soit mettre à jour le baseline avec justification dans le commit message.")
    else:
        lines.append("")
        lines.append("✅ Aucune régression par rapport au baseline.")

    lines.append("")
    lines.append(f"_Docs : https://supabase.com/docs/guides/database/database-advisors_")

    SUMMARY_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Supabase advisors check.")
    parser.add_argument("--type", choices=["security", "performance"], default="security")
    parser.add_argument("--baseline", default="scripts/supabase-advisors-baseline.json")
    parser.add_argument(
        "--write-baseline",
        action="store_true",
        help="Écrit le résultat actuel comme baseline (ne fait pas de check).",
    )
    args = parser.parse_args()

    token = os.environ.get("SUPABASE_ACCESS_TOKEN")
    project_ref = os.environ.get("SUPABASE_PROJECT_REF")
    if not token or not project_ref:
        print("ERROR: SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis.", file=sys.stderr)
        sys.exit(2)

    advisors = fetch_advisors(project_ref, token, args.type)
    current = Counter(a.get("name", "unknown") for a in advisors)
    print(f"Fetched {len(advisors)} {args.type} advisors across {len(current)} distinct names.")

    baseline_path = (ROOT / args.baseline).resolve() if not os.path.isabs(args.baseline) else Path(args.baseline)

    if args.write_baseline:
        baseline_path.parent.mkdir(parents=True, exist_ok=True)
        baseline_path.write_text(
            json.dumps(dict(sorted(current.items())), indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Baseline written to {baseline_path}.")
        return 0

    baseline = load_baseline(baseline_path)

    regressions = []
    for name, c in current.items():
        b = baseline.get(name, 0)
        if c > b:
            regressions.append((name, c, b))

    write_summary(args.type, current, baseline, regressions)
    print(f"Summary written to {SUMMARY_PATH}.")

    if regressions:
        print(f"❌ {len(regressions)} régression(s) détectée(s) :")
        for name, c, b in regressions:
            print(f"  {name} : {c} (baseline = {b})")
        return 1

    print(f"✅ Aucune régression vs baseline ({sum(baseline.values())} issues connues).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
