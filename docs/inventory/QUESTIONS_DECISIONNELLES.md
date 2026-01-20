# Questions Décisionnelles - Phase 3

**Date**: 2026-01-20
**Statut**: BLOQUANT pour exécution

---

## Questions critiques (réponses requises)

### 1. manifests/business-rules/ N'EXISTE PAS

**Contexte**: 10+ fichiers référencent `manifests/business-rules/*.md` mais ce dossier n'existe pas

**Fichiers référencés (non existants)**:
- `manifests/business-rules/WORKFLOWS.md`
- `manifests/business-rules/catalogue.md`
- `manifests/business-rules/stock-movements-workflow.md`
- `manifests/business-rules/stock-traceability-rules.md`
- `manifests/business-rules/orders-lifecycle-management.md`
- `manifests/business-rules/pricing-multi-canaux-clients.md`

**Question**: Ces business rules existent-elles ailleurs? Si non, que faire?

**Options**:
- **A)** Créer stubs dans `docs/engineering/business-rules/` avec TODO
- **B)** Supprimer toutes les références (obsolètes)
- **C)** Ces docs existent sous autre nom (identifier et mettre à jour refs)

**Votre décision**: _____________

---

### 2. Source de vérité unique: docs/

**Contexte**: Migration manifests/ → docs/ = docs/ devient LA référence canonique

**Question**: Confirmes-tu que docs/ est la seule source de vérité documentation?

**Implications**:
- ✅ Toute nouvelle doc va dans docs/ uniquement
- ✅ manifests/ sera supprimé définitivement
- ✅ Aucun autre dossier doc à la racine (sauf .claude/ pour agent config)

**Votre décision**: OUI / NON / AJUSTER

---

### 3. Rotation secrets .serena/

**Contexte**: 2 fichiers avec secrets détectés (jamais commit, local only)

**Secrets exposés**:
1. Back Office credentials: `veronebyromeo@gmail.com` / `Abc123456`
2. Sentry Auth Token: `sntrys_eyJpYXQi...`

**Question**: Ces secrets sont-ils utilisés en production publique?

**Si OUI (production)**:
- **Action requise**: Rotation immédiate
  - Changer password Supabase
  - Révoquer + recréer Sentry token
  - Mettre à jour Vercel env vars

**Si NON (test/dev only)**:
- **Action**: Aucune (garder local)

**Votre décision**: PRODUCTION / TEST-ONLY / NE SAIS PAS

---

### 4. Ordre commits & atomicité

**Contexte**: ~12 commits proposés (voir EXECUTIVE_SUMMARY.md)

**Question**: Valides-tu cette séquence ou préfères-tu:
- **A)** Séquence proposée (12 commits atomiques)
- **B)** Regrouper en 3-4 commits thématiques
- **C)** Un seul commit "refactor: tolerance zero cleanup"

**Trade-offs**:
- Atomique (12) = revert facile, historique clair, revue compliquée
- Groupé (3-4) = bon compromis
- Mono (1) = rapide, mais revert = tout casser

**Votre décision**: A / B / C

---

### 5. test-form-api.sh utilité

**Contexte**: Script test API LinkMe (177 lignes), non utilisé dans CI/CD

**Question**: Ce script est-il encore utilisé par l'équipe?

**Options**:
- **A)** Utile → MOVE vers `scripts/testing/` + doc
- **B)** Obsolète → DELETE
- **C)** À moderniser → MOVE + refactor en Playwright test

**Votre décision**: A / B / C

---

### 6. Contrat outputs tests (où, durée, cleanup)

**Contexte**: test-results/, .playwright-mcp/*.png s'accumulent localement

**Question**: Quel est le workflow souhaité pour test outputs?

**Options**:
- **A)** Manuel: dev cleanup quand ça le gêne (`npm run clean:test-artifacts`)
- **B)** Auto: pre-test hook cleanup systématique
- **C)** Hybride: pre-test cleanup CI uniquement, manuel en local

**Implications**:
- A = Flexibilité debug (garder traces après échec)
- B = Toujours propre, mais perte traces entre runs
- C = Meilleur compromis (CI propre, local flexible)

**Votre décision**: A / B / C

---

## Questions secondaires (non bloquantes)

### 7. archive/ déjà gitignored

**Status**: 0 fichiers tracked, contient `archive/2026-01/` (local)

**Action recommandée**: DELETE (`git rm -r archive/`)

**Confirmation**: OK / GARDER LOCAL

---

### 8. Documentation deployment moderne

**Contexte**: .deploy-trigger + .vercel-trigger = pattern obsolète

**Question**: Créer doc "deployment moderne" dans `docs/runbooks/deployment.md`?

**Contenu**:
- `vercel --force` (CLI)
- GitHub redeploy via UI
- Empty commit trigger: `git commit --allow-empty`

**Votre décision**: OUI / NON / PLUS TARD

---

### 9. Migration RLS audit vers docs/

**Contexte**: `.serena/memories/rls-performance-audit-2026-01-11.md` = technique, non sensible

**Question**: Migrer vers `docs/engineering/performance/rls-audit-2026-01-11.md`?

**Raison**: Partage connaissance équipe (pas juste cache MCP local)

**Votre décision**: MIGRER / GARDER LOCAL

---

### 10. Tests après migration

**Question**: Niveau validation souhaité après migration manifests/?

**Options**:
- **A)** Minimal: `npm run type-check` + `npm run build`
- **B)** Standard: A + `npm run test:e2e:smoke`
- **C)** Complet: B + revue manuelle 13 fichiers modifiés

**Votre décision**: A / B / C

---

## Format réponse

Réponds en format compact:

```
1. manifests/business-rules/: [A/B/C]
2. docs/ source unique: [OUI/NON]
3. Secrets rotation: [PRODUCTION/TEST-ONLY]
4. Ordre commits: [A/B/C]
5. test-form-api.sh: [A/B/C]
6. Cleanup tests: [A/B/C]
7. archive/: [DELETE/GARDER]
8. Doc deployment: [OUI/NON/PLUS TARD]
9. RLS audit migration: [MIGRER/LOCAL]
10. Tests validation: [A/B/C]
```

**Une fois réponses fournies → exécution immédiate des commits**
