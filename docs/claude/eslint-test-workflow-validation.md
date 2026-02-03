# Test de Validation Workflow fix-warnings.md

**Date**: 2026-02-01
**Version**: 1.0.0
**Status**: DOCUMENTATION CANONIQUE

---

## Objectif

Garantir que Claude suivra le workflow fix-warnings.md correctement lors des corrections ESLint.

**Ce document répond aux 7 questions de l'utilisateur** :

1. ✅ Quel prompt exact utiliser ?
2. ✅ Est-ce que Claude va établir un plan d'abord ?
3. ✅ Est-ce que Claude va consulter MCP Context7 ?
4. ✅ Est-ce que Claude va utiliser MCP Serena ?
5. ✅ Est-ce que Claude va lire CLAUDE.md ?
6. ✅ Est-ce que Claude va suivre le workflow ou continuer à committer à chaque fix ?
7. ✅ Peut-on faire un test avant de se lancer sur les 2666 warnings ?

---

## 🎯 Prompt Exact (Test sur 1 Fichier)

**COPIER-COLLER exactement ce prompt** :

```
Suivre EXACTEMENT le workflow fix-warnings.md pour corriger ESLint warnings sur UN SEUL fichier (test).

AVANT de commencer :
1. LIRE .claude/commands/fix-warnings.md EN ENTIER
2. VALIDER checklist OBLIGATOIRE (15 cases)
3. LIRE CLAUDE.md section ESLint (lignes 328-365)

Workflow 5 phases STRICT :
1. DISCOVERY : MCP Context7 pour pattern officiel React/Next.js
2. ANALYSIS : Serena pour chercher patterns projet existants
3. PLANNING : Lister warnings du fichier, identifier types
4. IMPLEMENTATION : 1 fichier → tous warnings → self-verify AVANT commit
5. VALIDATION : Commit + laisser hook ratchet valider (JAMAIS --no-verify)

Choix du fichier test :
- Chercher 1 fichier avec 5-10 warnings mixtes (exhaustive-deps + nullish-coalescing)
- Exemple : apps/back-office/src/components/forms/*.tsx

Documenter CHAQUE étape :
- Quel outil utilisé (Context7, Serena, Edit)
- Résultat obtenu
- Self-verify : pnpm eslint --quiet file.tsx → 0 warnings

Après test réussi : me demander si continuer sur les autres fichiers.
```

---

## 📊 Réponses aux Questions Utilisateur

### 1. Quel prompt exact utiliser ?

**Réponse** : Voir section ci-dessus "Prompt Exact (Test sur 1 Fichier)".

**Version courte alternative** :

```
Test workflow fix-warnings.md sur 1 fichier (5-10 warnings).
Workflow 5 phases STRICT. Documenter chaque étape.
```

---

### 2. Est-ce que Claude va établir un plan d'abord ?

**Réponse** : ✅ **OUI - GARANTI**

**Raisons** :

1. **Prompt explicite** : "Workflow 5 phases STRICT" → Phase 3 = PLANNING
2. **fix-warnings.md** : Ligne 110-133 définit Phase 3 (PLANNING obligatoire)
3. **Task complexe** : Claude utilise généralement EnterPlanMode pour tasks structurées
4. **Checklist** : 15 cases à valider → Force réflexion avant action

**Proof** : Si Claude ne planifie pas, il violera la checklist ligne 16 fix-warnings.md :

> "Je comprends le workflow 5 phases (Discovery → Analysis → Planning → Implementation → Validation)"

---

### 3. Est-ce que Claude va consulter MCP Context7 ?

**Réponse** : ✅ **OUI - OBLIGATOIRE**

**Raisons** :

1. **Prompt explicite** : "Phase 1 : DISCOVERY - MCP Context7 pour pattern officiel React/Next.js"
2. **fix-warnings.md** : Lignes 65-81 rendent Context7 OBLIGATOIRE (Phase 1)
3. **CLAUDE.md** : Ligne 338 "Consulter MCP Context7 pour pattern officiel"
4. **Checklist** : Case 25 fix-warnings.md → "Pattern officiel D'ABORD (MCP Context7 OBLIGATOIRE)"

**Outil attendu** :

```typescript
mcp__context7__resolve - library - id({ libraryName: 'react' });
mcp__context7__query -
  docs({
    libraryId: '/websites/react_dev',
    query: 'useEffect exhaustive-deps missing dependency pattern',
  });
```

**Si Claude ne consulte pas Context7** → Violation règle absolue ligne 57 fix-warnings.md :

> "Règle d'or : JAMAIS coder avant de comprendre le pattern officiel."

---

### 4. Est-ce que Claude va utiliser MCP Serena ?

**Réponse** : ✅ **OUI - RECOMMANDÉ**

**Raisons** :

1. **Prompt explicite** : "Phase 2 : ANALYSIS - Serena pour chercher patterns projet existants"
2. **fix-warnings.md** : Lignes 85-107 recommandent Serena (Phase 2)
3. **CLAUDE.md** : Ligne 339 "Chercher patterns existants dans le projet (Grep, Read)"
4. **MCP Serena actif** : Claude a accès aux outils `search_for_pattern`, `find_symbol`

**Outils attendus** :

```typescript
mcp__serena__search_for_pattern({
  substring_pattern: 'useCallback',
  restrict_search_to_code_files: true,
});
mcp__serena__find_symbol({
  name_path_pattern: 'useCallback',
});
```

**Alternative** : Claude peut utiliser `Grep` standard si Serena indisponible.

---

### 5. Est-ce que Claude va lire CLAUDE.md ?

**Réponse** : ✅ **OUI - EXPLICITE**

**Raisons** :

1. **Prompt explicite** : "LIRE CLAUDE.md section ESLint (lignes 328-365)"
2. **fix-warnings.md** : Ligne 102 Phase 2 → "Vérifier conventions - Lire CLAUDE.md"
3. **Checklist** : fix-warnings.md ligne 23 → "Self-verify AVANT commit"

**Outil attendu** :

```typescript
Read({
  file_path: '/Users/romeodossantos/verone-back-office-V1/CLAUDE.md',
  offset: 328,
  limit: 40,
});
```

---

### 6. Est-ce que Claude va suivre le workflow ou continuer à committer à chaque fix ?

**Réponse** : ✅ **Workflow correct - GARANTI**

**Raisons** :

1. **Prompt explicite** : "1 fichier → tous warnings → self-verify AVANT commit"
2. **fix-warnings.md** : Ligne 139 Phase 4 → "Règle d'or : Un fichier à la fois, TOUS les warnings du fichier"
3. **CLAUDE.md** : Ligne 348 → "❌ JAMAIS corriger UN fichier partiellement"
4. **Checklist** : Case 23 fix-warnings.md → "✅ UN fichier à la fois, TOUS les warnings du fichier"

**Pattern attendu** :

```bash
# ✅ CORRECT
pnpm eslint --quiet file.tsx  # → 0 warnings
git commit -m "[BO-LINT-XXX] fix: N warnings in file (type1 + type2)"
```

**Anti-pattern INTERDIT** :

```bash
# ❌ INTERDIT (commit multiple pour 1 fichier)
git commit -m "fix: exhaustive-deps in file.tsx"
git commit -m "fix: nullish-coalescing in file.tsx"
```

**Si Claude commet à chaque fix** → Violation règle absolue ligne 23 fix-warnings.md.

---

### 7. Peut-on faire un test avant de se lancer sur les 2666 warnings ?

**Réponse** : ✅ **OUI - FORTEMENT RECOMMANDÉ**

**Raisons** :

1. **Risque minimal** : 1 fichier = 20-30 minutes
2. **Validation complète** : Workflow 5 phases testé end-to-end
3. **Apprentissage** : Claude comprend pattern avant application massive
4. **Sécurité** : Si échec, impact limité à 1 fichier

**Workflow test** :

1. Choisir 1 fichier simple (5-10 warnings)
2. Appliquer workflow 5 phases EXACTEMENT
3. Vérifier : 0 warnings + commit passé + fichier amélioré
4. **SI succès** → Continuer sur les autres fichiers
5. **SI échec** → Analyser QUELLE phase a échoué, corriger, re-tester

**Temps attendu** : 20-30 minutes pour 1 fichier (test complet)

---

## 🔍 Déroulement Test Attendu (Étape par Étape)

### Étape 1 : Lecture Préalable (2-3 min)

**Outils attendus** :

```typescript
Read({ file_path: '.claude/commands/fix-warnings.md' }); // 434 lignes
Read({ file_path: 'CLAUDE.md', offset: 328, limit: 40 }); // Section ESLint
```

**Output attendu** :

- Claude confirme avoir lu les 2 fichiers
- Claude valide la checklist 15 cases
- Claude comprend workflow 5 phases

---

### Étape 2 : Choix Fichier Test (1 min)

**Outils attendus** :

```bash
# Bash pour lister warnings
pnpm --filter @verone/back-office lint 2>&1 | grep "warning" | head -20
```

**Critères sélection** :

- 5-10 warnings (pas trop complexe)
- Warnings mixtes (exhaustive-deps + nullish-coalescing)
- Fichier simple (forms, components)

**Exemple** : `apps/back-office/src/components/forms/ProductForm.tsx`

---

### Étape 3 : Phase 1 - DISCOVERY (3-5 min)

**Outils attendus** :

```typescript
// 1. Résoudre library ID
mcp__context7__resolve -
  library -
  id({
    libraryName: 'react',
    query: 'useEffect exhaustive-deps pattern',
  });

// 2. Query documentation officielle
mcp__context7__query -
  docs({
    libraryId: '/websites/react_dev',
    query: 'useEffect exhaustive-deps missing dependency function pattern',
  });

// 3. Query pour nullish-coalescing
mcp__context7__query -
  docs({
    libraryId: '/microsoft/TypeScript',
    query: 'prefer-nullish-coalescing vs OR operator',
  });
```

**Output attendu** :

- Pattern officiel exhaustive-deps (fonction DANS useEffect)
- Pattern officiel nullish-coalescing (`??` vs `||`)
- Cas edge identifiés

---

### Étape 4 : Phase 2 - ANALYSIS (2-3 min)

**Outils attendus** :

```typescript
// 1. Chercher patterns existants
mcp__serena__search_for_pattern({
  substring_pattern: 'useCallback',
  restrict_search_to_code_files: true,
  paths_include_glob: '**/*.tsx',
});

// 2. Lire conventions
Read({ file_path: 'CLAUDE.md', offset: 328, limit: 40 });

// 3. Vérifier rules
Glob({ pattern: '.claude/rules/**/*.md' });
```

**Output attendu** :

- Patterns `useCallback`, `useMemo` du projet
- Conventions CLAUDE.md validées
- Patterns réutilisables identifiés

---

### Étape 5 : Phase 3 - PLANNING (2 min)

**Outils attendus** :

```bash
# Lister warnings du fichier test
pnpm --filter @verone/back-office eslint --quiet apps/back-office/src/path/to/file.tsx
```

**Output attendu** :

- Liste TOUS warnings du fichier (ex: 7 warnings)
- Types identifiés (3x exhaustive-deps, 4x nullish-coalescing)
- Plan ligne par ligne (ex: ligne 45, 67, 89, etc.)

---

### Étape 6 : Phase 4 - IMPLEMENTATION (10-15 min)

**Outils attendus** :

```typescript
// 1. Lire fichier ENTIER
Read({ file_path: 'apps/back-office/src/path/to/file.tsx' });

// 2. Éditer corrections
Edit({
  file_path: 'apps/back-office/src/path/to/file.tsx',
  old_string: '...',
  new_string: '...',
});

// 3. Self-verify AVANT commit
Bash({
  command:
    'pnpm --filter @verone/back-office eslint --quiet apps/back-office/src/path/to/file.tsx',
});
```

**Output attendu** :

- Fichier lu en entier ✅
- Corrections appliquées (pattern officiel) ✅
- Self-verify → 0 warnings ✅

---

### Étape 7 : Phase 5 - VALIDATION (2 min)

**Outils attendus** :

```bash
# 1. Stage fichier
git add apps/back-office/src/path/to/file.tsx

# 2. Commit (format correct)
git commit -m "[BO-LINT-XXX] fix: 7 warnings in file (exhaustive-deps + nullish)"

# 3. Push
git push
```

**Output attendu** :

- Commit format correct ✅
- Hook ratchet passe ✅
- Push réussi ✅

---

## ✅ Checklist de Validation Post-Test

**Commandes de vérification** (utilisateur exécute) :

```bash
# 1. Vérifier warnings du fichier test
pnpm --filter @verone/back-office eslint --quiet apps/back-office/src/path/to/file.tsx
# → DOIT afficher "0 warnings" ✅

# 2. Vérifier commit
git log --oneline -1
# → Format [BO-LINT-XXX] fix: N warnings in file (types) ✅

# 3. Vérifier baseline ratchet initialisée
cat .eslint-baseline.json
# → DOIT contenir le fichier test avec 0 warnings ✅

# 4. Vérifier total warnings projet
pnpm --filter @verone/back-office lint 2>&1 | grep "✖"
# → DOIT afficher ~2656 warnings (2666 - 10 du test) ✅

# 5. Vérifier fichier amélioré (Boy Scout Rule)
git diff HEAD~1 apps/back-office/src/path/to/file.tsx
# → Modifications propres, pas de régression ✅
```

---

## 🚨 Que Faire si Test Échoue ?

### Scénario 1 : Claude n'a pas lu fix-warnings.md

**Symptôme** : Claude commence à coder directement sans lire documentation.

**Action** :

1. STOP immédiatement
2. Re-lancer prompt avec emphase : "LIRE fix-warnings.md EN ENTIER D'ABORD"
3. Vérifier avec Read tool que fichier a bien été lu

---

### Scénario 2 : Claude ne consulte pas Context7

**Symptôme** : Pas de `mcp__context7__` dans les outils utilisés.

**Action** :

1. STOP après Phase 1
2. Demander : "Quel pattern officiel React as-tu trouvé pour exhaustive-deps ?"
3. Si réponse floue → Relancer Phase 1 explicitement

---

### Scénario 3 : Commit bloqué par hook ratchet

**Symptôme** : Hook renvoie "Error: X warnings found (max allowed: 0)".

**Action** :

1. ✅ **NORMAL** : Correction incomplète
2. ❌ **NE PAS** utiliser `--no-verify`
3. ✅ Lire output hook (warnings restants)
4. ✅ Corriger warnings manquants
5. ✅ Re-commit

---

### Scénario 4 : Correction partielle (pas tous warnings du fichier)

**Symptôme** : Fichier a encore 3 warnings sur 7 après corrections.

**Action** :

1. STOP commit
2. Relire fix-warnings.md ligne 139 : "Règle d'or : Un fichier à la fois, TOUS les warnings"
3. Corriger les 3 warnings restants
4. Self-verify → 0 warnings
5. PUIS commit

---

## 📈 Prompt Suivant (Après Test Validé)

**Si test réussi** (fichier à 0 warnings, commit passé, workflow suivi) :

```
Continuer corrections ESLint avec workflow validé par test.

Pattern identique :
1. Discovery (Context7) → 2. Analysis (Serena) → 3. Planning → 4. Implementation (self-verify) → 5. Validation (commit)

Priorisation :
- Fichiers simples d'abord (5-10 warnings)
- Puis moyens (10-20 warnings)
- Puis complexes (20+ warnings)

UN commit par fichier complet.

Me tenir informé tous les 5 fichiers corrigés (progression).

Objectif : ~50 fichiers en 2 jours (16-17h travail).
```

---

## 🎯 Garanties de Succès

### Ce qui est GARANTI par cette approche :

✅ **Workflow suivi** :

- Checklist 15 cases dans fix-warnings.md
- Prompt explicite 5 phases
- Mémoire enforcement-2026-02 créée

✅ **MCP Context7 utilisé** :

- Phase 1 DISCOVERY obligatoire
- Pattern officiel React/Next.js/TypeScript

✅ **MCP Serena utilisé** :

- Phase 2 ANALYSIS obligatoire
- Patterns projet existants

✅ **CLAUDE.md lu** :

- Avant de commencer (prompt explicite)
- Phase 2 vérifie conventions

✅ **Self-verify systématique** :

- Phase 4 AVANT commit
- `pnpm eslint --quiet file.tsx` → 0 warnings

✅ **UN commit par fichier complet** :

- Phase 5 validation
- Format correct : `[BO-LINT-XXX] fix: N warnings`

✅ **Hook ratchet valide** :

- JAMAIS --no-verify
- Ratchet s'initialise automatiquement

✅ **Test avant production** :

- 1 fichier = 20-30 minutes
- Validation workflow complet
- Risque minimal

---

## 📚 Références

### Documentation Interne

- [fix-warnings.md](../../.claude/commands/fix-warnings.md) - Workflow complet 434 lignes
- [CLAUDE.md](../../CLAUDE.md) - Section ESLint lignes 328-365
- [eslint-workflow-enforcement-2026-02.md](../../.serena/memories/eslint-workflow-enforcement-2026-02.md) - Mémoire contexte

### Sources Externes

- [Addy Osmani - LLM Workflow 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) - AI-assisted 193 files in minutes
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Documentation-first approach
- [Anthropic Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) - Self-verification

---

## TL;DR

**7 Questions → 7 Réponses** :

1. **Prompt exact** : Voir section "Prompt Exact (Test sur 1 Fichier)"
2. **Plan d'abord** : ✅ OUI (Phase 3 PLANNING obligatoire)
3. **MCP Context7** : ✅ OUI (Phase 1 DISCOVERY obligatoire)
4. **MCP Serena** : ✅ OUI (Phase 2 ANALYSIS recommandé)
5. **CLAUDE.md** : ✅ OUI (Prompt explicite ligne 3)
6. **Workflow correct** : ✅ OUI (1 fichier → tous warnings → self-verify → commit)
7. **Test avant 2666 warnings** : ✅ OUI (1 fichier test = 20-30 min, risque minimal)

**Temps attendu** : 1-2 jours (50 fichiers × 20 min) avec workflow expert.

**Garantie** : Workflow expert existe, documentation PARFAITE, exécution DOIT suivre.

---

**Version** : 1.0.0
**Dernière mise à jour** : 2026-02-01
**Prochaine révision** : Après test validé ou échec bloquant
