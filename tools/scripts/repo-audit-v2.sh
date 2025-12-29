#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
DAYS="${DAYS:-90}"                 # seuil "stale" (jours) => override: DAYS=60 ./...
TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/reports"
REPORT="$OUT_DIR/repo-audit-$TS.md"

mkdir -p "$OUT_DIR"

IS_GIT=0
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_GIT=1
fi

python3 - "$ROOT" "$REPORT" "$DAYS" "$IS_GIT" <<'PY'
import os, sys, time, re, hashlib, subprocess
from collections import defaultdict

root, report, days, is_git = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
now = time.time()
cutoff = now - days*86400

# Dossiers très lourds / générés : on les "mesure" mais on évite de les scanner en profondeur.
PRUNE_DIRS = {
  ".git", "node_modules", ".next", "dist", "build", "coverage", "playwright-report",
  "test-results", ".turbo", ".vercel", ".cache", ".pnpm-store"
}

GENERATED_PATTERNS = [
  r"^\.turbo/cache/", r"^\.next/", r"^dist/", r"^build/", r"^coverage/",
  r"^playwright-report/", r"^test-results/", r"^\.vercel/", r"^\.DS_Store$"
]

DOC_ARCHIVE_HINTS = (
  "docs/archives", "docs/_archive", "docs/audits", "docs/audit"
)

DATE_IN_NAME = re.compile(r"(20\d{2})[-_](0[1-9]|1[0-2])(?:[-_](0[1-9]|[12]\d|3[01]))?")

def md(s: str) -> str:
  return s.replace("\n", " ").strip()

def rel(p: str) -> str:
  return os.path.relpath(p, root).replace("\\", "/")

def safe_run(cmd):
  try:
    return subprocess.check_output(cmd, cwd=root, stderr=subprocess.STDOUT, text=True)
  except Exception as e:
    return f"[error] {e}"

# --- Collecte fichiers (sans plonger dans les gros dossiers générés) ---
total_files = 0
total_size = 0
topdir_sizes = defaultdict(int)
by_basename = defaultdict(list)
stale_files = []
big_files = []  # (size, path)
md_files = []
docs_md_files = []

for cur, dirs, files in os.walk(root):
  rcur = rel(cur)
  # prune
  dirs[:] = [d for d in dirs if d not in PRUNE_DIRS]
  for f in files:
    p = os.path.join(cur, f)
    rp = rel(p)
    try:
      st = os.stat(p)
    except OSError:
      continue
    total_files += 1
    total_size += st.st_size

    # top-level bucket
    first = rp.split("/", 1)[0]
    topdir_sizes[first] += st.st_size

    by_basename[f].append(rp)

    if st.st_mtime < cutoff and ".git/" not in rp and "node_modules/" not in rp:
      stale_files.append((st.st_mtime, rp))

    if st.st_size >= 1_000_000 and "node_modules/" not in rp and ".git/" not in rp:
      big_files.append((st.st_size, rp))

    if rp.endswith(".md"):
      md_files.append(rp)
      if rp.startswith("docs/"):
        docs_md_files.append(rp)

stale_files.sort(key=lambda x: x[0])     # oldest first
big_files.sort(key=lambda x: x[0], reverse=True)

dup_names = {k:v for k,v in by_basename.items() if len(v) > 1}

# --- Git: fichiers générés accidentellement trackés ---
tracked_generated = []
git_status = ""
git_branch = ""
if is_git:
  git_branch = safe_run(["git", "rev-parse", "--abbrev-ref", "HEAD"]).strip()
  git_status = safe_run(["git", "status", "--porcelain=v1"])
  tracked = safe_run(["git", "ls-files"]).splitlines()
  for t in tracked:
    for pat in GENERATED_PATTERNS:
      if re.search(pat, t):
        tracked_generated.append(t)
        break

# --- Docs drift: classement "archive-like" + dates dans noms + orphelins (approx) ---
archive_like = [p for p in docs_md_files if p.startswith(DOC_ARCHIVE_HINTS)]
dated_docs = [p for p in docs_md_files if DATE_IN_NAME.search(os.path.basename(p))]

# orphelins approximatifs : doc jamais mentionnée par chemin relatif OU par basename dans d'autres md
mentions = defaultdict(int)
# Scan uniquement des .md (hors gros dossiers déjà prunés) => OK
for mdp in md_files:
  ap = os.path.join(root, mdp)
  try:
    txt = open(ap, "r", encoding="utf-8", errors="ignore").read()
  except Exception:
    continue
  # normalisation light
  txt_low = txt.lower()
  for dp in docs_md_files:
    base = os.path.basename(dp).lower()
    # deux heuristiques: mention du basename ou mention du chemin docs/...
    if base in txt_low:
      mentions[dp] += 1
    if dp.lower() in txt_low:
      mentions[dp] += 2

orphans = [p for p in docs_md_files if mentions[p] == 0]
# On ignore les archives dans les orphelins, sinon ça crie trop
orphans_non_archive = [p for p in orphans if not p.startswith(DOC_ARCHIVE_HINTS)]

# --- Écriture rapport ---
def human(n):
  for unit in ["B","KB","MB","GB","TB"]:
    if n < 1024:
      return f"{n:.1f}{unit}" if unit!="B" else f"{int(n)}B"
    n /= 1024
  return f"{n:.1f}PB"

with open(report, "w", encoding="utf-8") as out:
  out.write("# Repo Audit Report\n")
  out.write(f"_Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}_\n\n")
  out.write(f"**Root:** `{root}`\n\n")

  out.write("## 1) Vue d'ensemble\n")
  out.write(f"- Total fichiers (hors gros dossiers prunes) : **{total_files}**\n")
  out.write(f"- Taille estimee (hors gros dossiers prunes) : **{human(total_size)}**\n")
  if is_git:
    out.write(f"- Git branch : **{git_branch}**\n")
    dirty = len([l for l in git_status.splitlines() if l.strip()])
    out.write(f"- Git status : **{dirty}** fichiers modifies/non-trackes\n")
  out.write("\n")

  out.write("## 2) Top dossiers (par taille estimee)\n")
  for k,v in sorted(topdir_sizes.items(), key=lambda x: x[1], reverse=True)[:20]:
    out.write(f"- `{k}/` : {human(v)}\n")
  out.write("\n")

  out.write("## 3) Caches / generes potentiellement trackes par Git (CRITIQUE)\n")
  if not is_git:
    out.write("- (Repo pas detecte comme Git)\n\n")
  else:
    if tracked_generated:
      out.write("**Ces fichiers generes semblent commites** (a verifier / retirer / gitignore) :\n")
      for p in tracked_generated[:200]:
        out.write(f"- `{p}`\n")
      if len(tracked_generated) > 200:
        out.write(f"- ... +{len(tracked_generated)-200} autres\n")
    else:
      out.write("Aucun pattern genere evident n'est detecte dans `git ls-files`.\n")
    out.write("\n")

  out.write(f"## 4) Fichiers 'stale' (non modifies depuis {days} jours)\n")
  if stale_files:
    for ts, p in stale_files[:300]:
      out.write(f"- `{p}` ({time.strftime('%Y-%m-%d', time.localtime(ts))})\n")
    if len(stale_files) > 300:
      out.write(f"- ... +{len(stale_files)-300} autres\n")
  else:
    out.write("Aucun fichier stale detecte avec ce seuil.\n")
  out.write("\n")

  out.write("## 5) Doublons (meme nom de fichier a plusieurs endroits)\n")
  if dup_names:
    for name, paths in sorted(dup_names.items(), key=lambda x: len(x[1]), reverse=True)[:200]:
      out.write(f"- **{name}** ({len(paths)})\n")
      for p in paths[:10]:
        out.write(f"  - `{p}`\n")
      if len(paths) > 10:
        out.write(f"  - ... +{len(paths)-10} autres\n")
  else:
    out.write("Aucun doublon de nom detecte.\n")
  out.write("\n")

  out.write("## 6) Gros fichiers (>= 1MB)\n")
  if big_files:
    for sz, p in big_files[:50]:
      out.write(f"- `{p}` : {human(sz)}\n")
  else:
    out.write("Aucun gros fichier detecte.\n")
  out.write("\n")

  out.write("## 7) Docs drift (focus docs/)\n")
  out.write(f"- Total `.md` sous `docs/` : **{len(docs_md_files)}**\n")
  out.write(f"- Docs 'archive-like' (docs/audit*, docs/archives*, docs/_archive*) : **{len(archive_like)}**\n")
  out.write(f"- Docs avec date dans le nom : **{len(dated_docs)}**\n")
  out.write(f"- Orphelins (approx, hors archives) : **{len(orphans_non_archive)}**\n\n")

  if archive_like:
    out.write("### 7.a) Archive-like (echantillon)\n")
    for p in archive_like[:120]:
      out.write(f"- `{p}`\n")
    if len(archive_like) > 120:
      out.write(f"- ... +{len(archive_like)-120} autres\n")
    out.write("\n")

  if orphans_non_archive:
    out.write("### 7.b) Orphelins probables (non references)\n")
    for p in orphans_non_archive[:200]:
      out.write(f"- `{p}`\n")
    if len(orphans_non_archive) > 200:
      out.write(f"- ... +{len(orphans_non_archive)-200} autres\n")
    out.write("\n")

  out.write("## 8) Points de controle (presence des fichiers 'source of truth')\n")
  must = [".mcp.json", ".claude/settings.json", "CLAUDE.md", "turbo.json", "pnpm-workspace.yaml", "package.json"]
  for m in must:
    out.write(f"- `{m}` : {'OK' if os.path.exists(os.path.join(root,m)) else 'MANQUANT'}\n")
  out.write("\n")

  out.write("## 9) Reco express (quoi faire apres lecture)\n")
  out.write("- Si **.turbo/cache** ou **.vercel** est tracke -> priorite: nettoyer + gitignore (sinon repo gonfle + bugs 'fantomes').\n")
  out.write("- Unifier la doc: 1 seul 'current', 1 seul 'archive', et un index `docs/README.md`.\n")
  out.write("- Stopper la creation de nouveaux dossiers docs paralleles (`docs/audit` vs `docs/audits` vs `docs/archives`).\n")

print(f"Rapport genere: {report}")
PY

echo "Audit termine -> $REPORT"
echo "Tip: pour un seuil plus agressif: DAYS=45 ./tools/scripts/repo-audit-v2.sh"
