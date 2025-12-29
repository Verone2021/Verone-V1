#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
DOCS="$ROOT/docs"
DAYS_STALE="${DAYS_STALE:-60}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/reports"
REPORT="$OUT_DIR/docs-audit-v4-$TS.md"
JSON_OUT="$OUT_DIR/docs-audit-v4-$TS.json"

mkdir -p "$OUT_DIR"

python3 - "$ROOT" "$DOCS" "$REPORT" "$JSON_OUT" "$DAYS_STALE" <<'PY'
import os, re, sys, json, hashlib, datetime, subprocess
from pathlib import Path
from difflib import SequenceMatcher

root_dir = Path(sys.argv[1]).resolve()
docs_dir = Path(sys.argv[2]).resolve()
report_path = Path(sys.argv[3]).resolve()
json_path = Path(sys.argv[4]).resolve()
days_stale = int(sys.argv[5])

now = datetime.datetime.now(datetime.timezone.utc)

OLD_SIGNALS = [
  r"\bmonorepo\b", r"\blerna\b", r"\byarn\b", r"\bnpm-only\b",
  r"\bpackages/\b", r"\bsrc/\b", r"\bapps/back-office/apps/back-office\b",
]
CURRENT_SIGNALS = [
  r"\bturborepo\b", r"\bturbo\.json\b", r"\bpnpm\b", r"\bpnpm-workspace\.yaml\b",
  r"\bapps/\b", r"\bpackages/@verone\b", r"\bsupabase/migrations\b",
]

TOPIC_RULES = [
  ("database",  [r"\bsupabase\b", r"\btrigger\b", r"\brls\b", r"\bmigration\b", r"\bpostgres\b", r"\brpc\b"]),
  ("auth",      [r"\bauth\b", r"\bpermission\b", r"\brole\b", r"\brls\b", r"\bmiddleware\b"]),
  ("deployment",[r"\bvercel\b", r"\bgithub actions\b", r"\bworkflow\b", r"\bci/cd\b"]),
  ("api",       [r"\bapi\b", r"\bwebhook\b", r"\brpc\b", r"\brest\b"]),
  ("ui",        [r"\bshadcn\b", r"\bdesign system\b", r"\bcomponent\b", r"\bui\b"]),
  ("business",  [r"\bpricing\b", r"\bstock\b", r"\bcommande\b", r"\bproduit\b", r"\brègle\b", r"\bbusiness\b"]),
  ("monitoring",[r"\bmonitoring\b", r"\bobservability\b", r"\blog\b", r"\berror\b", r"\bsentry\b"]),
  ("security",  [r"\bsecurity\b", r"\bsecret\b", r"\brgpd\b", r"\bpii\b", r"\brls\b"]),
  ("integrations", [r"\bqonto\b", r"\brevolut\b", r"\babby\b", r"\bstripe\b", r"\bmerchant\b", r"\bintegration\b"]),
  ("architecture", [r"\barchitecture\b", r"\bmonorepo\b", r"\bturborepo\b", r"\bworkspace\b"]),
  ("testing",   [r"\bplaywright\b", r"\be2e\b", r"\btest\b", r"\bvitest\b", r"\bjest\b"]),
]

MD_EXT = {".md", ".mdx"}

def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8", errors="ignore")).hexdigest()

def norm_text(s: str) -> str:
    s = s.lower()
    s = re.sub(r"```.*?```", "", s, flags=re.S)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def extract_links(md: str):
    return re.findall(r"\[[^\]]+\]\(([^)]+)\)", md)

def is_external(link: str) -> bool:
    return link.startswith("http://") or link.startswith("https://") or link.startswith("mailto:")

def resolve_link(base: Path, link: str):
    link = link.split("#")[0].split("?")[0].strip()
    if not link or is_external(link):
        return None
    if link.startswith("#"):
        return None
    return (base.parent / link).resolve()

def score_topic(path: Path, text: str):
    t = text.lower()
    best = ("misc", 0)
    for topic, pats in TOPIC_RULES:
        score = 0
        for pat in pats:
            if re.search(pat, t):
                score += 1
        if topic in str(path).lower():
            score += 1
        if score > best[1]:
            best = (topic, score)
    return best[0]

def count_signals(text: str, patterns):
    t = text.lower()
    c = 0
    hits = []
    for pat in patterns:
        if re.search(pat, t):
            c += 1
            hits.append(pat)
    return c, hits

def git_last_modified_epoch(repo: Path, file_path: Path) -> int:
    """Get last modified timestamp from git, fallback to mtime."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%ct", "--", str(file_path)],
            cwd=str(repo), capture_output=True, text=True
        )
        if out.returncode == 0 and out.stdout.strip():
            return int(out.stdout.strip())
    except Exception:
        pass
    return int(file_path.stat().st_mtime)

# === NEW: Canonical topics from docs/current/ ===
current_dir = docs_dir / "current"
canonical_topics = set()
current_files = []
current_contents = {}

if current_dir.exists():
    current_files = list(current_dir.glob("*.md"))
    for f in current_files:
        name = f.stem.lower()
        # "02-architecture" -> architecture
        m = re.match(r"^\d{2}-(.+)$", name)
        if m:
            canonical_topics.add(m.group(1))
        current_contents[f] = read_text(f)

# === Build file list with enhanced metadata ===
files = []
path_to_file = {}

for p in docs_dir.rglob("*"):
    if p.is_file() and p.suffix.lower() in MD_EXT:
        rel = str(p.relative_to(docs_dir)).replace("\\", "/")
        st = p.stat()

        # Use git date for more accurate age
        epoch = git_last_modified_epoch(root_dir, p)
        mtime = datetime.datetime.fromtimestamp(epoch, tz=datetime.timezone.utc)
        age_days = (now - mtime).days

        txt = read_text(p)
        ntxt = norm_text(txt)
        exact_hash = sha256(txt)
        norm_hash = sha256(ntxt)

        links = extract_links(txt)
        broken = 0
        broken_samples = []
        for lk in links:
            target = resolve_link(p, lk)
            if target is None:
                continue
            if not target.exists():
                broken += 1
                if len(broken_samples) < 5:
                    broken_samples.append(lk)

        old_score, old_hits = count_signals(txt, OLD_SIGNALS)
        cur_score, cur_hits = count_signals(txt, CURRENT_SIGNALS)
        topic = score_topic(p, txt)

        # === NEW: Reference counting ===
        ref_count = 0
        referenced_by_current = False

        # Count references in all docs
        for other_p in docs_dir.rglob("*.md"):
            if other_p == p:
                continue
            other_txt = read_text(other_p)
            # Check if this file is referenced (by path or basename)
            if rel in other_txt or p.name in other_txt:
                ref_count += 1

        # Check if referenced by canonical docs
        for cf, cf_content in current_contents.items():
            if rel in cf_content or p.name in cf_content:
                referenced_by_current = True
                break

        file_data = {
            "path": rel,
            "abs": str(p),
            "size": st.st_size,
            "mtime": mtime.isoformat(),
            "age_days": age_days,
            "topic": topic,
            "broken_links": broken,
            "broken_samples": broken_samples,
            "old_signals": old_score,
            "old_hits": old_hits[:8],
            "current_signals": cur_score,
            "exact_hash": exact_hash,
            "norm_hash": norm_hash,
            "ref_count": ref_count,
            "referenced_by_current": referenced_by_current,
            "newer_equivalent": "",
            "action": "KEEP",
            "reasons": [],
        }
        files.append(file_data)
        path_to_file[rel] = file_data

# === Duplicate detection with newer_equivalent ===
by_hash = {}
for f in files:
    by_hash.setdefault(f["norm_hash"], []).append(f)

exact_dupes = {}
for h, group in by_hash.items():
    if len(group) > 1:
        paths = [g["path"] for g in group]
        exact_dupes[h] = paths

        # Find newest in group (by git date)
        sorted_group = sorted(group, key=lambda x: x["age_days"])  # lowest age = newest
        newest = sorted_group[0]

        # Mark older ones with newer_equivalent
        for g in sorted_group[1:]:
            g["newer_equivalent"] = newest["path"]

# === ACTION DECISION LOGIC ===
for f in files:
    rel = f["path"]
    age_days = f["age_days"]
    ref_count = f["ref_count"]
    referenced_by_current = f["referenced_by_current"]
    topic = f["topic"]
    old_score = f["old_signals"]
    cur_score = f["current_signals"]
    broken = f["broken_links"]
    newer_eq = f["newer_equivalent"]

    action = "KEEP"
    reasons = []

    # Zone checks
    in_archives = "archives/" in rel
    in_current = rel.startswith("current/")
    in_decisions = "decisions/" in rel

    if in_current or in_decisions:
        action = "KEEP"
        reasons.append("canonical_or_decision")
    elif in_archives:
        action = "KEEP"
        reasons.append("already_archived")
    elif newer_eq:
        # Exact duplicate with a newer version
        action = "DELETE_CANDIDATE"
        reasons.append(f"duplicate_of_newer:{newer_eq}")
    else:
        # Stale + unreferenced = DELETE_CANDIDATE
        if age_days >= days_stale and ref_count == 0 and not referenced_by_current:
            action = "DELETE_CANDIDATE"
            reasons.append(f"stale_{age_days}d_unreferenced")
        # Stale but referenced = MERGE (content may be useful)
        elif age_days >= days_stale and (ref_count > 0 or referenced_by_current):
            action = "MERGE"
            reasons.append(f"stale_{age_days}d_but_referenced({ref_count})")
        # Topic covered by canonical doc = MERGE candidate
        elif topic in canonical_topics and age_days >= 14 and not in_current:
            action = "MERGE"
            reasons.append(f"topic_{topic}_covered_by_current")
        # Old tech signals without current signals = ARCHIVE
        elif old_score >= 2 and cur_score == 0:
            action = "ARCHIVE"
            reasons.append("old_tech_signals_only")
        # Many broken links = ARCHIVE
        elif broken >= 5:
            action = "ARCHIVE"
            reasons.append(f"many_broken_links({broken})")
        else:
            action = "KEEP"
            reasons.append("looks_good")

    f["action"] = action
    f["reasons"] = reasons

# === Near duplicates detection (unchanged) ===
topic_map = {}
for f in files:
    topic_map.setdefault(f["topic"], []).append(f)

near_dupes = []
for topic, items in topic_map.items():
    items_sorted = sorted(items, key=lambda x: x["age_days"])
    sample = items_sorted[:30] + items_sorted[-30:] if len(items_sorted) > 60 else items_sorted
    texts = []
    for it in sample:
        txt = norm_text(read_text(docs_dir / it["path"]))
        texts.append((it["path"], txt))
    for i in range(len(texts)):
        for j in range(i+1, len(texts)):
            a_path, a = texts[i]
            b_path, b = texts[j]
            if not a or not b:
                continue
            if min(len(a), len(b)) < 400:
                continue
            ratio = SequenceMatcher(None, a[:4000], b[:4000]).ratio()
            if ratio >= 0.92:
                near_dupes.append({"topic": topic, "a": a_path, "b": b_path, "similarity": round(ratio, 3)})

# === Stats by action ===
action_stats = {}
for f in files:
    action_stats[f["action"]] = action_stats.get(f["action"], 0) + 1

# === JSON Output ===
json_path.write_text(json.dumps({
    "generated_at": now.isoformat(),
    "root_dir": str(root_dir),
    "docs_dir": str(docs_dir),
    "days_stale": days_stale,
    "canonical_topics": list(canonical_topics),
    "stats": {
        "files": len(files),
        "exact_duplicate_groups": len(exact_dupes),
        "near_duplicate_pairs": len(near_dupes),
        "by_action": action_stats,
    },
    "files": files,
    "exact_duplicates": exact_dupes,
    "near_duplicates": near_dupes[:200],
}, ensure_ascii=False, indent=2), encoding="utf-8")

# === Markdown Report ===
def human_size(n):
    for u in ["B","KB","MB","GB"]:
        if n < 1024:
            return f"{n:.0f}{u}"
        n /= 1024
    return f"{n:.1f}TB"

lines = []
lines.append("# Docs Audit v4.1 (Enhanced)")
lines.append(f"_Generated: {now.strftime('%Y-%m-%d %H:%M UTC')}_")
lines.append("")
lines.append("## Configuration")
lines.append(f"- Days stale threshold: **{days_stale}**")
lines.append(f"- Canonical topics (from docs/current/): **{', '.join(sorted(canonical_topics)) or 'none'}**")
lines.append("")
lines.append("## Stats")
lines.append(f"- Total markdown files: **{len(files)}**")
lines.append(f"- Exact duplicate groups: **{len(exact_dupes)}**")
lines.append(f"- Near-duplicate pairs: **{len(near_dupes)}**")
lines.append("")
lines.append("## Actions Summary")
for action in ["KEEP", "MERGE", "ARCHIVE", "DELETE_CANDIDATE"]:
    count = action_stats.get(action, 0)
    lines.append(f"- **{action}**: {count}")
lines.append("")

# DELETE_CANDIDATE section
delete_cands = [f for f in files if f["action"] == "DELETE_CANDIDATE"]
if delete_cands:
    lines.append("## DELETE_CANDIDATE (review before deleting)")
    lines.append("| Age | Refs | File | Reason |")
    lines.append("|---:|---:|---|---|")
    for f in sorted(delete_cands, key=lambda x: (-x["age_days"], x["path"]))[:50]:
        lines.append(f"| {f['age_days']}d | {f['ref_count']} | `{f['path']}` | {', '.join(f['reasons'])} |")
    lines.append("")

# MERGE section
merge_cands = [f for f in files if f["action"] == "MERGE"]
if merge_cands:
    lines.append("## MERGE (consolidate into docs/current/)")
    lines.append("| Age | Refs | Topic | File | Reason |")
    lines.append("|---:|---:|---|---|---|")
    for f in sorted(merge_cands, key=lambda x: (-x["age_days"], x["path"]))[:50]:
        lines.append(f"| {f['age_days']}d | {f['ref_count']} | {f['topic']} | `{f['path']}` | {', '.join(f['reasons'])} |")
    lines.append("")

# ARCHIVE section
archive_cands = [f for f in files if f["action"] == "ARCHIVE"]
if archive_cands:
    lines.append("## ARCHIVE (move to docs/archives/)")
    lines.append("| Age | File | Reason |")
    lines.append("|---:|---|---|")
    for f in sorted(archive_cands, key=lambda x: (-x["age_days"], x["path"]))[:50]:
        lines.append(f"| {f['age_days']}d | `{f['path']}` | {', '.join(f['reasons'])} |")
    lines.append("")

# Duplicates section
if exact_dupes:
    lines.append("## Exact Duplicates (first 20 groups)")
    c = 0
    for h, paths in exact_dupes.items():
        c += 1
        if c > 20: break
        lines.append(f"- Group {c} ({len(paths)} files)")
        for p in paths[:10]:
            lines.append(f"  - `{p}`")
        if len(paths) > 10:
            lines.append(f"  - ... +{len(paths)-10}")
    lines.append("")

# Near duplicates
if near_dupes:
    lines.append("## Near-duplicates (≥92% similar, first 40)")
    for item in near_dupes[:40]:
        lines.append(f"- topic:{item['topic']} — sim:{item['similarity']} — `{item['a']}` ~~ `{item['b']}`")
    lines.append("")

# Topic distribution
lines.append("## Topic Distribution")
topic_counts = {}
for f in files:
    topic_counts.setdefault(f["topic"], 0)
    topic_counts[f["topic"]] += 1
for t, n in sorted(topic_counts.items(), key=lambda x: -x[1]):
    lines.append(f"- **{t}**: {n}")

lines.append("")
lines.append("---")
lines.append("_Use `docs-audit-apply.py --report <json>` to apply actions._")

report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Report: {report_path}")
print(f"JSON:   {json_path}")
PY

echo "Docs audit v4.1 generated:"
echo "   - $REPORT"
echo "   - $JSON_OUT"
echo ""
echo "Next: python3 tools/scripts/docs-audit-apply.py --report $JSON_OUT --dry-run"
