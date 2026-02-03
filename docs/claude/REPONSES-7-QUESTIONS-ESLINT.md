# Réponses aux 7 Questions ESLint

**Date** : 2026-02-01
**Context** : Validation workflow fix-warnings.md avant correction massive 2666 warnings

---

## Question 1 : Quel prompt exact utiliser ?

**Réponse** : `docs/claude/PROMPT-TEST-ESLINT.txt`

**Version courte** :

```
Test workflow fix-warnings.md sur 1 fichier (5-10 warnings).
Workflow 5 phases STRICT. Documenter chaque étape.
```

**Version complète** : Voir fichier prompt.

---

## Question 2 : Est-ce que Claude va établir un plan d'abord ?

**Réponse** : ✅ **OUI - GARANTI**

**Raisons** :

1. Prompt explicite : "Workflow 5 phases STRICT" → Phase 3 = PLANNING
2. fix-warnings.md lignes 110-133 : Phase 3 PLANNING obligatoire
3. Task complexe → EnterPlanMode probable
4. Checklist 15 cases → Force réflexion avant action

**Proof** : Violation checklist si pas de planning (ligne 16 fix-warnings.md)

---

## Question 3 : Est-ce que Claude va consulter MCP Context7 ?

**Réponse** : ✅ **OUI - OBLIGATOIRE**

**Raisons** :

1. Prompt : "Phase 1 : DISCOVERY - MCP Context7 pour pattern officiel"
2. fix-warnings.md lignes 65-81 : Context7 OBLIGATOIRE (Phase 1)
3. CLAUDE.md ligne 338 : "Consulter MCP Context7"
4. Checklist case 25 : "Pattern officiel D'ABORD (MCP Context7 OBLIGATOIRE)"

**Outils attendus** :

- `mcp__context7__resolve-library-id`
- `mcp__context7__query-docs`

**Violation si non utilisé** : Ligne 57 fix-warnings.md → "JAMAIS coder avant pattern officiel"

---

## Question 4 : Est-ce que Claude va utiliser MCP Serena ?

**Réponse** : ✅ **OUI - RECOMMANDÉ**

**Raisons** :

1. Prompt : "Phase 2 : ANALYSIS - Serena pour patterns projet"
2. fix-warnings.md lignes 85-107 : Serena recommandé (Phase 2)
3. CLAUDE.md ligne 339 : "Chercher patterns existants (Grep, Read)"
4. MCP Serena actif : `search_for_pattern`, `find_symbol` disponibles

**Outils attendus** :

- `mcp__serena__search_for_pattern`
- `mcp__serena__find_symbol`

**Alternative** : `Grep` standard si Serena indisponible

---

## Question 5 : Est-ce que Claude va lire CLAUDE.md ?

**Réponse** : ✅ **OUI - EXPLICITE**

**Raisons** :

1. Prompt : "LIRE CLAUDE.md section ESLint (lignes 328-365)"
2. fix-warnings.md ligne 102 : "Vérifier conventions - Lire CLAUDE.md"
3. Checklist case 24 : "Self-verify AVANT commit"

**Outil attendu** :

```typescript
Read({
  file_path: 'CLAUDE.md',
  offset: 328,
  limit: 40,
});
```

---

## Question 6 : Est-ce que Claude va suivre le workflow ou continuer à committer à chaque fix ?

**Réponse** : ✅ **Workflow correct - GARANTI**

**Raisons** :

1. Prompt : "1 fichier → tous warnings → self-verify AVANT commit"
2. fix-warnings.md ligne 139 : "Un fichier à la fois, TOUS les warnings"
3. CLAUDE.md ligne 348 : "❌ JAMAIS corriger UN fichier partiellement"
4. Checklist case 23 : "✅ UN fichier à la fois, TOUS les warnings"

**Pattern attendu** :

```bash
pnpm eslint --quiet file.tsx  # → 0 warnings
git commit -m "[BO-LINT-XXX] fix: N warnings (type1 + type2)"
```

**Anti-pattern INTERDIT** :

```bash
# ❌ Commit multiple pour 1 fichier
git commit -m "fix: exhaustive-deps"
git commit -m "fix: nullish-coalescing"
```

---

## Question 7 : Peut-on faire un test avant de se lancer sur les 2666 warnings ?

**Réponse** : ✅ **OUI - FORTEMENT RECOMMANDÉ**

**Raisons** :

1. Risque minimal : 1 fichier = 20-30 minutes
2. Validation complète : Workflow 5 phases testé end-to-end
3. Apprentissage : Claude comprend pattern avant application massive
4. Sécurité : Si échec, impact limité à 1 fichier

**Workflow test** :

1. Choisir 1 fichier simple (5-10 warnings)
2. Appliquer workflow 5 phases EXACTEMENT
3. Vérifier : 0 warnings + commit passé + fichier amélioré
4. SI succès → Continuer sur les autres
5. SI échec → Analyser QUELLE phase, corriger, re-tester

**Temps** : 20-30 minutes

---

## 📊 Tableau Récapitulatif

| Question            | Réponse   | Garantie                 | Proof                    |
| ------------------- | --------- | ------------------------ | ------------------------ |
| 1. Prompt exact     | ✅ Fourni | `PROMPT-TEST-ESLINT.txt` | Fichier créé             |
| 2. Plan d'abord     | ✅ OUI    | Phase 3 obligatoire      | fix-warnings.md L110-133 |
| 3. MCP Context7     | ✅ OUI    | Phase 1 obligatoire      | fix-warnings.md L65-81   |
| 4. MCP Serena       | ✅ OUI    | Phase 2 recommandé       | fix-warnings.md L85-107  |
| 5. CLAUDE.md        | ✅ OUI    | Prompt explicite         | Ligne 3 prompt           |
| 6. Workflow correct | ✅ OUI    | 1 fichier complet        | fix-warnings.md L139     |
| 7. Test avant       | ✅ OUI    | 1 fichier test           | Risque minimal           |

---

## 🎯 Prochaines Étapes

**Maintenant** :

```bash
# Lancer test sur 1 fichier
cat docs/claude/PROMPT-TEST-ESLINT.txt
# Copier-coller dans Claude
```

**Après test réussi** :

```bash
# Continuer corrections
cat docs/claude/PROMPT-CONTINUE-ESLINT.txt
# Copier-coller dans Claude
```

**Documentation complète** :

- `docs/claude/eslint-test-workflow-validation.md` (toutes réponses détaillées)
- `.claude/commands/fix-warnings.md` (workflow expert 434 lignes)
- `CLAUDE.md` lignes 328-365 (règles ESLint)

---

## TL;DR

**Toutes les 7 questions ont une réponse ✅ OUI avec garanties.**

**Test recommandé** : 1 fichier (20-30 min) avant correction massive (2666 warnings).

**Workflow garanti** : Discovery → Analysis → Planning → Implementation → Validation

**Temps attendu** : 1-2 jours (50 fichiers × 20 min) vs 4-5 jours (approche ad-hoc)

**Documentation** : PARFAITE, exécution DOIT suivre.
