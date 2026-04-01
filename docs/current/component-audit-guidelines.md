# Component Audit Guidelines (2026)

**Version:** 1.0.0
**Date:** 2026-01-23
**Statut:** Actif

---

## Vue d'ensemble

Ce document définit les standards et processus pour auditer et nettoyer le code mort (dead code) dans le monorepo Verone.

**Stack d'audit:**

- **Knip v5.66.2** - Détection automatisée (AST-based)
- **Script Bash avancé** - Validation contextuelle manuelle
- **ShellCheck** - Validation scripts Bash

---

## Outils Obligatoires

### 1. Knip (Automatisé)

**Commandes disponibles:**

```bash
# Scan complet monorepo
pnpm audit:deadcode

# ou directement
npx knip

# Scan par workspace
npx knip --workspace apps/back-office

# Export JSON pour analyse
npx knip --reporter json > knip-report.json

# Mode CI/CD (exit code 1 si issues)
npx knip --no-exit-code
```

**Knip détecte:**

- ✅ Unused exports (composants, fonctions, types)
- ✅ Unused dependencies (package.json)
- ✅ Unused devDependencies
- ✅ Unused files (jamais importés)
- ✅ Unused class members
- ✅ Duplicate exports
- ✅ Missing dependencies

**Configuration:** Voir `knip.json` à la racine du projet.

### 2. Script Bash (Manuel)

**Usage:**

```bash
./scripts/audit-component-advanced.sh <component-file-path>
```

**Exemple:**

```bash
./scripts/audit-component-advanced.sh apps/back-office/src/components/forms/image-upload.tsx
```

**Le script vérifie:**

- ✅ Marqueurs `@deprecated` dans le code
- ✅ Imports statiques (grep dans codebase)
- ✅ Imports dynamiques (next/dynamic, React.lazy)
- ✅ Références dans API routes
- ✅ Références dans tests E2E
- ✅ Git history (dernier commit, nombre de commits)

**Verdict automatique:**

- 🗑️ **SAFE TO DELETE** - Aucune référence trouvée
- ⚠️ **REVIEW REQUIRED** - Peu de références (possiblement déprécié)
- ✅ **KEEP** - Composant activement utilisé

---

## Workflow Standard

### Avant de supprimer un composant

**Checklist obligatoire:**

1. ✅ **Exécuter Knip**

   ```bash
   npx knip --workspace apps/back-office
   ```

2. ✅ **Exécuter script audit**

   ```bash
   ./scripts/audit-component-advanced.sh <file>
   ```

3. ✅ **Vérifier git blame**

   ```bash
   git log --oneline -- <file>
   git blame <file>
   ```

4. ✅ **Chercher dans communications**
   - Slack (channel #dev-verone)
   - Jira (features planifiées)
   - Confluence (documentation)

5. ✅ **Marquer `@deprecated` pendant 1 sprint**
   - Ajouter JSDoc `@deprecated` dans le code
   - Commenter export dans `index.ts`
   - Attendre 2 semaines (1 sprint)

6. ✅ **Supprimer proprement**
   - Supprimer fichier source
   - Supprimer export dans `index.ts`
   - Supprimer imports inutilisés
   - Supprimer tests associés
   - Commit avec format: `[APP-DOMAIN-NNN] chore: remove deprecated ComponentName`

---

## Marqueurs de Statut

### Component déprécié (JSDoc)

```tsx
/**
 * @deprecated Use ComponentV2 instead (apps/back-office/src/components/ComponentV2.tsx)
 * Will be removed in v2.0.0 (Sprint 42 - 2026-02-15)
 */
export const ComponentV1 = () => {
  // ... implementation
};
```

### Export commenté (index.ts)

```tsx
// ============================================================
// DEPRECATED EXPORTS (to be removed)
// ============================================================

// @deprecated Use ComponentV2 instead (see ComponentV2.tsx)
// Will be removed: Sprint 42 (2026-02-15)
// export { ComponentV1 } from './ComponentV1.legacy';
```

### Marqueur TODO/FIXME

```tsx
// TODO [2026-02-15]: Remove after ComponentV2 migration complete
// FIXME: Obsolete component, migrate users to ComponentV2
```

---

## Safety Net (Filet de Sécurité)

### Règles strictes

1. **JAMAIS supprimer sans marquage `@deprecated` préalable**
   - Période minimum: 1 sprint (2 semaines)
   - Exception: composants créés dans les 48h (rollback rapide)

2. **TOUJOURS vérifier les tests**

   ```bash
   pnpm type-check
   pnpm build
   pnpm test:e2e:critical
   ```

3. **TOUJOURS créer un commit séparé**
   - Format: `[NO-TASK] chore: remove deprecated ComponentName`
   - Body: Raison de suppression + alternatives
   - Un composant = un commit (facilite rollback)

4. **JAMAIS supprimer pendant:**
   - Période de release (freeze code)
   - Vendredi après-midi (risque incident weekend)
   - Vacances (équipe réduite)

### Rollback Plan

Si un composant supprimé était encore utilisé:

```bash
# Restaurer le fichier
git checkout HEAD~1 -- <file-path>

# Commit restauration
git add <file-path>
git commit -m "[HOTFIX] restore: ComponentName (still in use)"

# Push immédiat
git push
```

---

## CI/CD Integration

### GitHub Actions (Optionnel)

Knip s'exécute automatiquement sur chaque PR:

- Workflow: `.github/workflows/knip.yml`
- Bloque PR si > 10 unused exports
- Poste commentaire avec rapport

**Désactiver temporairement:**

```yaml
# .github/workflows/knip.yml
# Commenter le job si besoin (période de nettoyage massif)
# jobs:
#   knip:
#     ...
```

---

## Métriques & KPI

### Objectifs 2026

- **Unused exports:** < 50 (total monorepo)
- **Unused files:** 0
- **Unused dependencies:** 0
- **Code coverage:** > 80% (packages critiques)

### Suivi mensuel

Générer rapport:

```bash
npx knip --reporter json > reports/knip-$(date +%Y-%m).json
```

Comparer avec mois précédent:

```bash
# Exemple: janvier vs décembre
diff reports/knip-2025-12.json reports/knip-2026-01.json
```

---

## Cas Particuliers

### Composants chargés dynamiquement

**Pattern Next.js:**

```tsx
// Le composant est bien utilisé, mais Knip peut ne pas le détecter
const DynamicComponent = dynamic(() => import('./ComponentName'));
```

**Solution:**

- Vérifier avec script Bash (`check_dynamic_imports`)
- Ajouter commentaire dans `knip.json` (`ignoredIssues`)

### Feature flags

```tsx
// Composant activé via feature flag
if (featureFlags.newCheckout) {
  return <CheckoutV2 />;
}
```

**Solution:**

- Marquer avec commentaire `// FEATURE FLAG: newCheckout`
- Ne PAS supprimer tant que feature flag existe

### Composants legacy (migration en cours)

```tsx
/**
 * @legacy Migration to V2 in progress (Jira: BO-123)
 * - Phase 1: 80% migrated (2026-01-15)
 - Phase 2: Complete migration (2026-02-01)
 */
export const LegacyComponent = () => { ... }
```

**Solution:**

- Suivre avancement dans Jira
- Supprimer seulement quand migration 100% complète

---

## Installation ShellCheck (Validation Scripts)

**macOS:**

```bash
brew install shellcheck
```

**Ubuntu/Debian:**

```bash
sudo apt-get install shellcheck
```

**Usage:**

```bash
shellcheck scripts/audit-component-advanced.sh
```

---

## FAQ

### Q: Knip détecte un faux positif, que faire ?

**R:** Ajouter une exception dans `knip.json`:

```json
{
  "ignoredIssues": {
    "files": ["apps/back-office/src/components/SpecialComponent.tsx"]
  }
}
```

### Q: Le script Bash est trop lent, pourquoi ?

**R:** Le script fait des `grep -r` récursifs. Pour accélérer:

- Utiliser Knip d'abord (AST-based, rapide)
- Script Bash seulement pour edge cases

### Q: Peut-on automatiser la suppression ?

**R:** NON. Toujours validation manuelle avant suppression:

1. Revue humaine du rapport Knip
2. Exécution script Bash
3. Validation métier (PM/Lead Dev)

### Q: Que faire avec les types TypeScript inutilisés ?

**R:** Knip les détecte aussi. Supprimer si:

- Type défini mais jamais utilisé
- Type dupliqué (existe ailleurs)
- Type legacy (remplacé par nouveau type)

### Q: Fréquence d'audit recommandée ?

**R:**

- **Quotidien:** CI/CD (automatique sur PR)
- **Hebdomadaire:** Lead Dev (revue rapport Knip)
- **Mensuel:** Tech Lead (nettoyage massif)
- **Trimestriel:** CTO (audit stratégique)

---

## Références

- [Knip Official Documentation](https://knip.dev)
- [Dead Code Detection: Knip vs ts-prune](https://levelup.gitconnected.com/dead-code-detection-in-typescript-projects-why-we-chose-knip-over-ts-prune-8feea827da35)
- [Effective TypeScript: Use Knip](https://effectivetypescript.com/2023/07/29/knip/)
- [Bash Best Practices](https://bertvv.github.io/cheat-sheets/Bash.html)
- [Writing Robust Shell Scripts](https://www.davidpashley.com/articles/writing-robust-shell-scripts/)

---

## Changelog

| Version | Date       | Auteur      | Changements                |
| ------- | ---------- | ----------- | -------------------------- |
| 1.0.0   | 2026-01-23 | Claude Code | Création initiale du guide |

---

**Contact Support:**

- Slack: #dev-verone
- Lead Dev: @romeo
- Documentation: `docs/current/component-audit-guidelines.md`
