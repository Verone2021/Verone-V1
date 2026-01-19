#!/usr/bin/env bash
# ==============================================================================
# repo-hygiene.sh - Weekly repo hygiene script
# ==============================================================================
# This script moves/archives repo noise safely. NO destructive deletes.
# All operations use git mv to preserve history.
# If a file doesn't exist, the operation is skipped (safe fallback).
# ==============================================================================

set -euo pipefail

MONTH="$(date +%Y-%m)"
ARCHIVE_DIR="archive/${MONTH}/claude"

echo "🧹 Starting repo hygiene for ${MONTH}..."

# ==============================================================================
# 1) Ensure target directories exist
# ==============================================================================
mkdir -p "${ARCHIVE_DIR}/agents" "${ARCHIVE_DIR}/commands" "${ARCHIVE_DIR}/memories" "${ARCHIVE_DIR}/plans"
mkdir -p docs/claude docs/runbooks docs/architecture scripts/claude .tasks/plans scripts/maintenance

# ==============================================================================
# 2) Move repo-specific docs out of .claude
# ==============================================================================
if [ -f ".claude/WORKFLOW-CHECKLIST.md" ]; then
  echo "  → Moving WORKFLOW-CHECKLIST.md to docs/claude/"
  git mv ".claude/WORKFLOW-CHECKLIST.md" "docs/claude/WORKFLOW-CHECKLIST.md" || true
fi

if [ -f ".claude/mcp-playwright-config.md" ]; then
  echo "  → Moving mcp-playwright-config.md to docs/claude/"
  git mv ".claude/mcp-playwright-config.md" "docs/claude/mcp-playwright-config.md" || true
fi

# ==============================================================================
# 3) Move plans out of .claude
# ==============================================================================
if [ -d ".claude/plans" ] && [ "$(ls -A .claude/plans 2>/dev/null)" ]; then
  echo "  → Moving .claude/plans/* to .tasks/plans/"
  for f in .claude/plans/*; do
    [ -f "$f" ] && git mv "$f" ".tasks/plans/" || true
  done
fi

# ==============================================================================
# 4) Archive memories (history, not standard)
# ==============================================================================
if [ -d ".claude/memories" ] && [ "$(ls -A .claude/memories 2>/dev/null)" ]; then
  echo "  → Archiving .claude/memories/* to ${ARCHIVE_DIR}/memories/"
  for f in .claude/memories/*; do
    [ -f "$f" ] && git mv "$f" "${ARCHIVE_DIR}/memories/" || true
  done
fi

# ==============================================================================
# 5) Move non-wrapper scripts to project scripts area
# Note: Keep wrappers (task-completed.sh, session-token-report.sh) in .claude/scripts
# ==============================================================================
if [ -d ".claude/scripts" ]; then
  for f in .claude/scripts/*; do
    filename=$(basename "$f")
    # Skip wrappers - they must stay in .claude/scripts
    if [[ "$filename" == "task-completed.sh" ]] || [[ "$filename" == "session-token-report.sh" ]]; then
      continue
    fi
    if [ -f "$f" ]; then
      echo "  → Moving $filename to scripts/claude/"
      git mv "$f" "scripts/claude/" || true
    fi
  done
fi

# ==============================================================================
# 6) Archive non-core agents (keep only the core set in repo)
# ==============================================================================
for f in action.md audit-governor.md data-layer-auditor.md; do
  if [ -f ".claude/agents/${f}" ]; then
    echo "  → Archiving agent: ${f}"
    git mv ".claude/agents/${f}" "${ARCHIVE_DIR}/agents/${f}" || true
  fi
done

# ==============================================================================
# 7) Move/archive non-core commands
# ==============================================================================
if [ -f ".claude/commands/senior-stabilization-protocol.md" ]; then
  echo "  → Moving senior-stabilization-protocol.md to docs/runbooks/incident.md"
  git mv ".claude/commands/senior-stabilization-protocol.md" "docs/runbooks/incident.md" || true
fi

if [ -f ".claude/commands/arch.md" ]; then
  echo "  → Moving arch.md to docs/architecture/README.md"
  git mv ".claude/commands/arch.md" "docs/architecture/README.md" || true
fi

for f in write.md commit.md; do
  if [ -f ".claude/commands/${f}" ]; then
    echo "  → Archiving command: ${f}"
    git mv ".claude/commands/${f}" "${ARCHIVE_DIR}/commands/${f}" || true
  fi
done

# ==============================================================================
# 8) Ensure .gitignore covers generated noise
# ==============================================================================
GITIGNORE_ENTRIES=(
  ".claude/reports/"
  ".claude/logs/"
  ".claude/settings.local.json"
)

for entry in "${GITIGNORE_ENTRIES[@]}"; do
  if ! grep -qF "${entry}" .gitignore 2>/dev/null; then
    echo "  → Adding ${entry} to .gitignore"
    echo "${entry}" >> .gitignore
  fi
done
git add .gitignore 2>/dev/null || true

# ==============================================================================
# 9) Create/update archive index if archive has content
# ==============================================================================
if [ -d "${ARCHIVE_DIR}" ] && [ "$(ls -A "${ARCHIVE_DIR}" 2>/dev/null)" ]; then
  INDEX="${ARCHIVE_DIR}/README.md"
  if [ ! -f "${INDEX}" ]; then
    echo "  → Creating archive index"
    cat > "${INDEX}" <<EOF
# Archive ${MONTH} (Claude hygiene)

This folder contains items moved out of \`.claude/\` to keep the repo clean and portable.

**Policy**: No destructive deletes — only moves with git history preserved.

## Contents

- \`agents/\` - Archived non-core agents
- \`commands/\` - Archived non-core commands
- \`memories/\` - Historical memories (not standard)
- \`plans/\` - Historical plans (now in .tasks/)

## Restore

To restore an archived item:
\`\`\`bash
git mv archive/${MONTH}/claude/<path> .claude/<path>
\`\`\`
EOF
    git add "${INDEX}" 2>/dev/null || true
  fi
fi

# ==============================================================================
# 10) Cleanup empty directories (safe)
# ==============================================================================
for dir in .claude/memories .claude/plans; do
  if [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
    echo "  → Removing empty directory: $dir"
    rmdir "$dir" 2>/dev/null || true
  fi
done

echo "✅ Repo hygiene complete. Review changes with 'git status'."
exit 0
