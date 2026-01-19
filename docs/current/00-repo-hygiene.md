# Repository Hygiene Guide

Guide for maintaining a clean and sustainable codebase.

## Quick Reference

### Cleanup Commands

```bash
# Find large files
find . -type f -size +100k -not -path "./.git/*" -not -path "./node_modules/*" | head -20

# Find orphan scripts (not referenced anywhere)
for f in .claude/scripts/*.sh; do
  name=$(basename "$f")
  count=$(grep -r "$name" --include="*.json" --include="*.md" --include="*.yml" . 2>/dev/null | wc -l)
  [ "$count" -eq 0 ] && echo "Orphan: $f"
done

# List archived files
ls -la docs/archive/*/
```

### Archive Convention

```
docs/archive/
├── 2026-01/          # Year-Month of archival
│   ├── scripts/      # Archived scripts
│   ├── configs/      # Archived configs
│   └── README.md     # Archive manifest
```

## What to Keep vs Archive

### Keep in Repository

| Type | Location | Criteria |
|------|----------|----------|
| Active scripts | `.claude/scripts/` | Referenced in workflows, hooks, or CI |
| Current docs | `docs/current/` | Actively maintained, < 6 months old |
| CI workflows | `.github/workflows/` | Running in CI pipeline |
| Type definitions | `src/types/` | Imported by application code |

### Archive (Not Delete)

| Type | When to Archive |
|------|-----------------|
| Historical scripts | No references in 30+ days |
| Legacy docs | Superseded by new docs |
| Audit reports | Older than 90 days |
| Migration notes | Post-migration success |

### Delete (Caution)

Only delete if:
1. File is duplicated elsewhere
2. File contains sensitive data (credentials, tokens)
3. File is auto-generated and can be recreated

## CI/CD Hygiene

### Required Checks

All required CI checks must report status even when skipped:

```yaml
# BAD - check won't report if skipped
on:
  pull_request:
    paths:
      - 'supabase/**'

# GOOD - check always reports
jobs:
  check-changes:
    name: My Required Check
    runs-on: ubuntu-latest
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            relevant:
              - 'supabase/**'
      - name: Skip (no changes)
        if: steps.filter.outputs.relevant == 'false'
        run: echo "No relevant changes - check passes"
```

### Workflow Organization

```
.github/workflows/
├── ci.yml              # Main CI (tests, build, type-check)
├── database-audit.yml  # Database schema validation
├── deploy-*.yml        # Deployment workflows
└── scheduled-*.yml     # Scheduled jobs (cron)
```

## .gitignore Best Practices

### Always Ignore

```gitignore
# AI/Agent workspace
.claude/scratch/
.claude/reports/**
.serena/

# Local configs
*.local.json
.env.local

# Build artifacts
dist/
.next/
node_modules/
```

### Never Ignore

```
# Tracked for team
.claude/settings.json      # Shared permissions/MCP config
.github/workflows/*.yml    # CI/CD definitions
docs/current/**            # Current documentation
```

## Monthly Hygiene Checklist

- [ ] Review `docs/archive/` - delete files older than 1 year
- [ ] Audit `.claude/scripts/` - archive orphan scripts
- [ ] Check CI workflows - remove deprecated jobs
- [ ] Verify `.gitignore` - no sensitive files tracked
- [ ] Review Serena memories - delete outdated ones

## Emergency Cleanup

If repository grows too large (> 500MB):

```bash
# 1. Find large files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | sort -rnk2 | head -20

# 2. Check for accidentally committed binaries
find . -type f \( -name "*.zip" -o -name "*.tar.gz" -o -name "*.dmg" \) -not -path "./.git/*"

# 3. Clear git cache for removed large files (requires force push)
# WARNING: Destructive - coordinate with team
git filter-branch --force --tree-filter 'rm -f path/to/large/file' HEAD
```

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-19
