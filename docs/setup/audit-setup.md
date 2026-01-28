# 🚀 Système d'Audit de Composants - Setup Guide

**Version:** 1.0.0
**Date:** 2026-01-23
**Statut:** ✅ Implémenté

---

## 📋 Ce qui a été créé

### Fichiers Créés

1. **`knip.json`** - Configuration Knip pour monorepo
2. **`scripts/audit-component-advanced.sh`** - Script Bash avancé (best practices 2026)
3. **`scripts/audit-all-components.sh`** - Script de batch processing
4. **`scripts/README-AUDIT.md`** - Documentation scripts
5. **`docs/current/component-audit-guidelines.md`** - Guidelines équipe
6. **Ce fichier** - Setup guide

### Commandes NPM Ajoutées

```json
"audit:deadcode": "knip",
"audit:deadcode:json": "knip --reporter json > knip-report.json",
"audit:component": "./scripts/audit-component-advanced.sh",
"audit:batch": "./scripts/audit-all-components.sh"
```

---

## 🛠️ Installation Prérequis

### macOS

```bash
# ShellCheck (validation scripts Bash)
brew install shellcheck

# jq (parsing JSON pour batch script)
brew install jq
```

### Ubuntu/Debian

```bash
sudo apt-get install shellcheck jq
```

### Validation Installation

```bash
# Vérifier ShellCheck
shellcheck --version

# Vérifier jq
jq --version

# Valider scripts
shellcheck scripts/audit-component-advanced.sh
shellcheck scripts/audit-all-components.sh
```

---

## 🎯 Quick Start

### 1. Scan Complet avec Knip

```bash
# Scanner tout le monorepo
pnpm audit:deadcode

# Scanner un workspace spécifique
npx knip --workspace apps/back-office

# Exporter rapport JSON
pnpm audit:deadcode:json
```

### 2. Auditer un Composant Spécifique

```bash
# Via commande NPM
pnpm audit:component apps/back-office/src/components/ui/phase-indicator.tsx

# Directement
./scripts/audit-component-advanced.sh apps/back-office/src/components/ui/phase-indicator.tsx
```

**Exemple de sortie:**
```
=========================================
AUDIT: phase-indicator.tsx
=========================================
File: apps/back-office/src/components/ui/phase-indicator.tsx

ℹ️  Checking deprecated markers...
✅ No deprecated markers

ℹ️  Checking static imports...
⚠️  WARNING: No static imports found

ℹ️  Checking dynamic imports...
⚠️  WARNING: No dynamic imports found

ℹ️  Checking git history...
ℹ️  Last modified: 2026-01-04 23:01:35 +0100
ℹ️  Total commits: 2

=========================================
VERDICT
=========================================
⚠️  REVIEW REQUIRED (may be deprecated)
```

### 3. Audit Batch (Tous les Composants)

```bash
# Générer rapport Knip + auditer tous
pnpm audit:batch

# Utiliser rapport existant
pnpm audit:batch knip-report.json
```

**Génère:**
- Logs: `reports/audit-YYYYMMDD-HHMMSS/*.log`
- Liste safe to delete: `reports/audit-YYYYMMDD-HHMMSS/safe-to-delete.txt`

---

## 📊 Comprendre les Verdicts

| Verdict | Exit Code | Signification | Action |
|---------|-----------|---------------|--------|
| ✅ **KEEP** | 0 | Composant activement utilisé | Garder tel quel |
| ⚠️ **REVIEW REQUIRED** | 1 | Peu de références trouvées | Revue manuelle nécessaire |
| 🗑️ **SAFE TO DELETE** | 2 | Aucune référence trouvée | Supprimer après validation |

---

## 🔍 Workflow de Suppression

### Étape 1: Identifier Composants Inutilisés

```bash
# Scanner avec Knip
pnpm audit:deadcode:json

# Auditer batch
pnpm audit:batch knip-report.json
```

### Étape 2: Revue Manuelle

```bash
# Lire rapport
cat reports/audit-YYYYMMDD-HHMMSS/safe-to-delete.txt

# Vérifier git history
git log --oneline -- apps/back-office/src/components/forms/image-upload.tsx

# Chercher dans communications (Slack, Jira)
```

### Étape 3: Marquer `@deprecated` (1 Sprint)

```tsx
/**
 * @deprecated Use ComponentV2 instead
 * Will be removed in v2.0.0 (Sprint 42 - 2026-02-15)
 */
export const ComponentV1 = () => { ... }
```

### Étape 4: Supprimer Proprement

```bash
# Après 2 semaines (1 sprint)
git rm apps/back-office/src/components/forms/image-upload.tsx

# Commit format
git commit -m "[NO-TASK] chore: remove deprecated image-upload component"

# Push
git push
```

---

## 📚 Documentation Complète

- **Guidelines Équipe:** `docs/current/component-audit-guidelines.md`
- **Scripts README:** `scripts/README-AUDIT.md`
- **Configuration Knip:** `knip.json`
- **Best Practices:** [Knip Official Docs](https://knip.dev)

---

## 🐛 Troubleshooting

### Problème: Knip échoue avec "Invalid input"

**Cause:** Possible problème de configuration ou version

**Solutions:**
1. Vérifier version Knip: `npx knip --version`
2. Regénérer node_modules: `pnpm install`
3. Vérifier knip.json syntaxe: `jq . knip.json`

### Problème: Script dit "No static imports" mais composant utilisé

**Cause:** Imports dynamiques ou références indirectes

**Solutions:**
1. Chercher manuellement: `grep -r "ComponentName" apps/`
2. Vérifier fichiers JSON/config
3. Vérifier tests E2E (sélecteurs)
4. Ajouter exception dans knip.json

### Problème: jq not found

**Solution:**
```bash
# macOS
brew install jq

# Ubuntu
sudo apt-get install jq
```

---

## 🎯 Métriques Cibles 2026

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Unused exports | < 50 | À mesurer |
| Unused files | 0 | À mesurer |
| Unused dependencies | 0 | À mesurer |
| Code coverage | > 80% | À mesurer |

**Baseline:** Exécuter premier audit pour établir baseline

```bash
# Générer baseline
pnpm audit:deadcode:json
mv knip-report.json reports/baseline-2026-01-23.json
```

---

## 🚀 Prochaines Étapes

### Immédiat (Aujourd'hui)

- [x] ✅ Créer configuration Knip
- [x] ✅ Créer scripts Bash
- [x] ✅ Créer documentation
- [ ] Installer ShellCheck et jq (utilisateur)
- [ ] Exécuter premier audit baseline

### Court Terme (Cette Semaine)

- [ ] Valider scripts avec ShellCheck
- [ ] Exécuter audit complet monorepo
- [ ] Identifier top 10 composants à supprimer
- [ ] Marquer composants avec `@deprecated`

### Moyen Terme (Ce Mois)

- [ ] Supprimer composants dépréciés (après 1 sprint)
- [ ] Configurer CI/CD avec Knip (optionnel)
- [ ] Former équipe sur workflow audit
- [ ] Établir routine audit mensuelle

### Long Terme (Ce Trimestre)

- [ ] Atteindre < 50 unused exports
- [ ] Zero unused files
- [ ] Zero unused dependencies
- [ ] Automatiser cleanup dans CI/CD

---

## 💡 Conseils d'Utilisation

### Ne PAS

- ❌ Supprimer sans marquer `@deprecated` d'abord
- ❌ Supprimer pendant période de release
- ❌ Supprimer le vendredi après-midi
- ❌ Automatiser suppression sans validation humaine
- ❌ Ignorer verdicts "REVIEW REQUIRED"

### TOUJOURS

- ✅ Exécuter Knip avant audit manuel
- ✅ Vérifier git history (git log, git blame)
- ✅ Chercher dans communications (Slack, Jira)
- ✅ Marquer `@deprecated` pendant 1 sprint
- ✅ Tests passent après suppression
- ✅ Commit séparé par composant (facilite rollback)

---

## 📞 Support

- **Slack:** #dev-verone
- **Lead Dev:** @romeo
- **Documentation:** `docs/current/component-audit-guidelines.md`
- **Scripts:** `scripts/README-AUDIT.md`

---

## 🎉 Succès!

Le système d'audit moderne est maintenant prêt à l'emploi !

**Prochaine action recommandée:**
```bash
# Installer prérequis
brew install shellcheck jq

# Valider scripts
shellcheck scripts/audit-component-advanced.sh

# Exécuter premier audit
pnpm audit:deadcode
```

---

**Fin du Setup Guide**
