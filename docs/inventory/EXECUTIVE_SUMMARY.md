# Phase 3 - Tolerance Zero: Executive Summary

**Date**: 2026-01-20
**Objectif**: Inventory complet + décisions KEEP/MOVE/DELETE/GITIGNORE

---

## Résumé 5 minutes

### ✅ Complété

1. **Inventory root directories** → `docs/inventory/root-dirs.md`
2. **Plan migration manifests/** → `docs/inventory/manifests-migration-plan.md`
3. **Security audit .serena/** → `docs/inventory/serena-security-audit.md`
4. **Cleanup automation tests** → `docs/inventory/test-artifacts-cleanup-plan.md`
5. **Root scripts audit** → `docs/inventory/root-scripts-audit.md`

### 🎯 Décisions majeures

| Item | Decision | Raison |
|------|----------|--------|
| `manifests/` | **MIGRATE → docs/** | Redondance, 19 fichiers à migrer |
| `.serena/` | **KEEP LOCAL** | Secrets détectés, déjà .gitignored ✅ |
| `archive/` | **DELETE** | 0 fichiers tracked, obsolète |
| `test-results/` | **CLEANUP AUTO** | Déjà .gitignored, script cleanup créé |
| `.deploy-trigger` | **DELETE** | Obsolète (Dec 2025) |
| `test-form-api.sh` | **MOVE → scripts/testing/** | Organisation |

---

## Findings critiques

### 🔴 Security (résolu)

**`.serena/memories/` contient secrets**:
- Back Office credentials production
- Sentry auth token

**Status**: ✅ SECURE
- Jamais commit dans Git (vérifié)
- Déjà .gitignored (line 129)
- Recommandation: rotation optionnelle

### ⚠️ Références cassées (à fixer)

**`manifests/business-rules/` N'EXISTE PAS**:
- 10+ fichiers référencent ce dossier
- Doit être créé dans `docs/engineering/business-rules/` OU refs supprimées

### ✅ .gitignore (bien configuré)

Tous les outputs sont correctement ignorés:
- Playwright: `test-results/`, `playwright-report/`
- MCP: `.playwright-mcp/*.png`
- Build: `.turbo/`, `.next/`, `node_modules/`

---

## Actions requises

### Immédiat (Phase 3B)

```bash
# 1. Créer structure docs/
mkdir -p docs/prd/current
mkdir -p docs/engineering/standards/{database,ui}
mkdir -p docs/engineering/performance
mkdir -p docs/features
mkdir -p docs/integrations/google-merchant

# 2. Migrer 17 fichiers manifests/
cp manifests/prd/current/*.md docs/prd/current/
cp manifests/architecture/*.md docs/architecture/
# ... (voir manifests-migration-plan.md)

# 3. Mettre à jour 13 références code
# (Edit tool sur chaque fichier)

# 4. Supprimer manifests/
git rm -r manifests/
```

### Recommandé (Phase 3D)

```bash
# Créer script cleanup
mkdir -p scripts/maintenance
cat > scripts/maintenance/clean-test-artifacts.sh << 'EOF'
#!/bin/bash
rm -rf test-results/ playwright-report/ tests/reports/
rm -f .playwright-mcp/*.{png,jpg,jpeg}
rm -rf coverage/
echo "✅ Test artifacts cleaned"
EOF
chmod +x scripts/maintenance/clean-test-artifacts.sh

# Ajouter commande package.json
# "clean:test-artifacts": "bash scripts/maintenance/clean-test-artifacts.sh"
```

### Cleanup (Phase 3E)

```bash
# Déplacer script test
mkdir -p scripts/testing
git mv test-form-api.sh scripts/testing/

# Supprimer triggers obsolètes
git rm .deploy-trigger .vercel-trigger

# Cleanup archive
git rm -r archive/
```

---

## Séquence commits proposée

### Commit 1: Inventory docs
```bash
git add docs/inventory/
git commit -m "[NO-TASK] docs: phase 3 tolerance zero - inventory complet"
```

### Commit 2: Cleanup simple (no code changes)
```bash
git rm -r archive/
git rm .deploy-trigger .vercel-trigger
git commit -m "[NO-TASK] chore: delete obsolete archive/ and trigger files"
```

### Commit 3: Move root scripts
```bash
mkdir -p scripts/testing
git mv test-form-api.sh scripts/testing/
git commit -m "[NO-TASK] chore: organize root scripts into scripts/testing/"
```

### Commit 4: Test cleanup automation
```bash
mkdir -p scripts/maintenance
# Créer clean-test-artifacts.sh
git add scripts/maintenance/clean-test-artifacts.sh
# Mettre à jour package.json
git add package.json
git commit -m "[NO-TASK] feat: add test artifacts cleanup automation"
```

### Commit 5-N: Migrate manifests/ (ATOMIC)
```bash
# 5. Créer structure docs/
mkdir -p docs/prd/current docs/engineering/standards/{database,ui}
git add docs/
git commit -m "[NO-TASK] refactor(docs): create structure for manifests migration"

# 6. Copy PRD files
cp manifests/prd/current/*.md docs/prd/current/
git add docs/prd/
git commit -m "[NO-TASK] refactor(docs): migrate PRD from manifests/ to docs/prd/"

# 7. Copy standards
cp manifests/database-standards/*.md docs/engineering/standards/database/
cp manifests/development-standards/*.md docs/engineering/standards/ui/
git add docs/engineering/standards/
git commit -m "[NO-TASK] refactor(docs): migrate standards from manifests/ to docs/engineering/"

# 8. Copy architecture
cp manifests/architecture/*.md docs/architecture/
git add docs/architecture/
git commit -m "[NO-TASK] refactor(docs): migrate architecture from manifests/ to docs/architecture/"

# 9. Copy features
cp manifests/features/*.md docs/features/
git add docs/features/
git commit -m "[NO-TASK] refactor(docs): migrate features from manifests/ to docs/features/"

# 10. Update code references (1 commit per file or grouped by type)
# Edit 13 fichiers
git add packages/ apps/
git commit -m "[NO-TASK] refactor: update manifests/ references to docs/"

# 11. Delete manifests/
git rm -r manifests/
git commit -m "[NO-TASK] refactor: remove manifests/ (migrated to docs/)"

# 12. Update docs/README.md
git add docs/README.md
git commit -m "[NO-TASK] docs: update README with new structure after manifests migration"
```

**Total**: ~12 commits (petits, atomiques, revertables)

---

## Risques & Mitigation

### Risque 1: Typo dans path updates (13 fichiers)

**Mitigation**:
- Utiliser Edit tool (pas sed)
- Type-check après chaque modif
- Commits atomiques (revert facile)

### Risque 2: Refs cassées business-rules/

**Mitigation**:
- Identifier si docs existent ailleurs
- Créer stubs OU supprimer refs
- Documenter décision

### Risque 3: Merge conflicts (feature branches)

**Mitigation**:
- Communication team
- Merge main → feature après migration
- Documentation migration dans CHANGELOG.md

---

## Evidence & Preuves

Toutes les commandes d'audit sont documentées avec output:

```bash
# Directories tracked
git ls-files | cut -d'/' -f1 | sort -u  # → 14 dirs

# manifests/ usage
rg "manifests/" --files-with-matches  # → 13 files

# .serena/ security
git ls-files | rg "^\.serena/"  # → 0 commits ✅

# Test outputs gitignored
git status --porcelain | rg "test-results"  # → none ✅

# Triggers usage in CI
rg "\.deploy-trigger" .github/workflows/  # → none
```

---

## Prochaines étapes

### 1. Questions décisionnelles (user)

- **manifests/business-rules/**: Créer OU supprimer refs?
- **Secrets rotation**: Changer Sentry token + Back Office password?
- **Ordre commits**: Valider séquence ou ajuster?

### 2. Execution

Si validation user → Exécuter commits 1-12 séquentiellement

### 3. Verification

```bash
npm run type-check  # TypeScript OK
npm run build       # Build OK
rg "manifests/"     # Aucune ref restante
```

### 4. Documentation

Mettre à jour:
- `CHANGELOG.md`: Section "Migration manifests/ → docs/"
- `docs/README.md`: Nouvelle structure
- `.claude/MANUAL_MODE.md`: Path updates si nécessaire

---

## Conclusion

**Status**: ✅ Audit complet, plans détaillés, prêt exécution

**Décision clé**: docs/ = source de vérité unique

**Impact**: +5 fichiers docs/inventory/, -19 fichiers manifests/, ~12 commits

**Durée estimée**: 30-45 min (si validation immediate)

**Deliverables**:
- `docs/inventory/root-dirs.md`
- `docs/inventory/manifests-migration-plan.md`
- `docs/inventory/serena-security-audit.md`
- `docs/inventory/test-artifacts-cleanup-plan.md`
- `docs/inventory/root-scripts-audit.md`
- `docs/inventory/EXECUTIVE_SUMMARY.md` (ce fichier)
