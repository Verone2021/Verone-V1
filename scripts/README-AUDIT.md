# Scripts d'Audit de Composants

Scripts pour détecter et nettoyer le code mort (dead code) dans le monorepo Verone.

---

## Scripts Disponibles

### 1. `audit-component-advanced.sh`

**Usage:** Auditer un composant spécifique

```bash
./scripts/audit-component-advanced.sh <component-file-path>
```

**Exemple:**
```bash
./scripts/audit-component-advanced.sh apps/back-office/src/components/forms/image-upload.tsx
```

**Vérifie:**
- ✅ Marqueurs `@deprecated` dans le code
- ✅ Imports statiques (grep dans codebase)
- ✅ Imports dynamiques (next/dynamic, React.lazy)
- ✅ Références dans API routes
- ✅ Références dans tests E2E
- ✅ Git history (dernier commit, nombre de commits)

**Verdicts:**
- **Exit 0:** ✅ **KEEP** - Composant activement utilisé
- **Exit 1:** ⚠️ **REVIEW REQUIRED** - Peu de références
- **Exit 2:** 🗑️ **SAFE TO DELETE** - Aucune référence

---

### 2. `audit-all-components.sh`

**Usage:** Auditer tous les composants détectés par Knip

```bash
# Générer rapport Knip + auditer tous les composants
./scripts/audit-all-components.sh

# Utiliser rapport Knip existant
./scripts/audit-all-components.sh knip-report.json
```

**Génère:**
- Logs détaillés dans `reports/audit-YYYYMMDD-HHMMSS/`
- Liste des fichiers safe to delete: `safe-to-delete.txt`
- Résumé final avec statistiques

**Exemple de sortie:**
```
SUMMARY
=========================================
Total files audited: 25
✅ KEEP: 15
⚠️  REVIEW REQUIRED: 7
🗑️  SAFE TO DELETE: 3

Files safe to delete:
  - image-upload.tsx
  - LeafletMapView.tsx
  - ABCAnalysisView.tsx
```

---

## Prérequis

### Installation

**macOS:**
```bash
# ShellCheck (validation scripts Bash)
brew install shellcheck

# jq (parsing JSON pour batch script)
brew install jq
```

**Ubuntu/Debian:**
```bash
sudo apt-get install shellcheck jq
```

### Validation Scripts

```bash
# Valider syntaxe Bash
shellcheck scripts/audit-component-advanced.sh
shellcheck scripts/audit-all-components.sh
```

---

## Workflow Complet

### Étape 1: Scanner avec Knip

```bash
# Scan complet monorepo
pnpm audit:deadcode

# ou par workspace
npx knip --workspace apps/back-office

# Exporter JSON
npx knip --reporter json > knip-report.json
```

### Étape 2: Audit Manuel (Composant Spécifique)

```bash
./scripts/audit-component-advanced.sh apps/back-office/src/components/ui/phase-indicator.tsx
```

### Étape 3: Audit Batch (Tous les Composants)

```bash
./scripts/audit-all-components.sh knip-report.json
```

### Étape 4: Revue & Suppression

```bash
# Lire rapport
cat reports/audit-YYYYMMDD-HHMMSS/safe-to-delete.txt

# Supprimer manuellement après validation
git rm apps/back-office/src/components/forms/image-upload.tsx
git commit -m "[NO-TASK] chore: remove unused component image-upload"
```

---

## Logs

Les logs sont sauvegardés dans:
- **Audit simple:** `.audit-component.log` (racine projet)
- **Audit batch:** `reports/audit-YYYYMMDD-HHMMSS/*.log`

**Voir logs récents:**
```bash
tail -50 .audit-component.log
```

---

## Troubleshooting

### Problème: "No static imports found" mais le composant est utilisé

**Cause:** Imports dynamiques non détectés par grep

**Solution:**
1. Vérifier manuellement avec:
   ```bash
   grep -r "ComponentName" apps/ packages/
   ```
2. Chercher dans fichiers JSON/config
3. Vérifier tests E2E (sélecteurs Playwright)

### Problème: Script trop lent

**Cause:** Grep récursifs sur large codebase

**Solutions:**
1. Utiliser Knip d'abord (AST-based, rapide)
2. Limiter scope avec `relative_path`
3. Exclure node_modules/.next (déjà fait dans script)

### Problème: Faux positifs Knip

**Cause:** Composants chargés dynamiquement ou via feature flags

**Solution:**
Ajouter exception dans `knip.json`:
```json
{
  "ignoredIssues": {
    "files": ["path/to/component.tsx"]
  }
}
```

---

## Références

- **Documentation complète:** `docs/current/component-audit-guidelines.md`
- **Configuration Knip:** `knip.json` (racine projet)
- **Best Practices:** [Knip Official Docs](https://knip.dev)

---

## Support

- **Slack:** #dev-verone
- **Lead Dev:** @romeo
- **Issues:** Créer issue dans `.tasks/`
