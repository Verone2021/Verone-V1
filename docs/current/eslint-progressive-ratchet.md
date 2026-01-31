# ESLint Ratchet Effect Progressif

**Date** : 2026-01-31
**Status** : MODE ACTUEL (Migration ESLint 5,690 warnings en cours)
**Documentation Plan** : `.plans/eslint-5690-warnings-plan.md`

---

## 🎯 Objectif

Permettre la correction graduelle des **5,690 warnings ESLint** sans bloquer chaque commit à 0 warnings.

**Problème résolu** : Le mode strict `--max-warnings=0` bloquait les commits sur gros fichiers partiellement corrigés (ex: 215 warnings → 182 warnings = commit bloqué malgré 33 corrections).

---

## 🔧 Mode Actuel : Progressive (Migration en cours)

### Principe

Autorise les commits tant qu'on **RÉDUIT ou MAINTIENT** les warnings (pas obligé d'atteindre 0).

**Règles** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- ✅ Commit autorisé si `warnings_après <= warnings_avant`
- ❌ Commit bloqué si `warnings_après > warnings_avant`
- 📊 Baseline mise à jour après chaque commit réussi

### Bénéfices

1. **Commits intermédiaires possibles** - Fichiers de 200+ warnings peuvent être corrigés par étapes
2. **Sauvegarde progressive** - Travail sauvegardé au fur et à mesure (pas de perte si rollback)
3. **Ratchet Effect maintenu** - Aucune régression permise (warnings ne peuvent qu'augmenter ou baisser)
4. **Transition douce** - Migration graduelle vers 0 warnings sans friction

---

## 📂 Baseline Locale

### Fichier `.eslint-baseline.json` (gitignored)

Stocke le nombre de warnings par fichier. Format JSON :

```json
{
  "apps/back-office/src/app/(protected)/finance/transactions/page.tsx": 182,
  "apps/linkme/src/lib/hooks/use-user-selection.ts": 312,
  "apps/back-office/src/hooks/base/use-supabase-query.ts": 45
}
```

### Comportement

- **Auto-généré au 1er commit** - Si baseline n'existe pas, le script compte les warnings actuels
- **Mis à jour après chaque commit réussi** - Nouveau total enregistré si warnings réduits
- **Si perdu** - Régénéré automatiquement (pas de panique)
- **Gitignored** - Chaque développeur a sa propre baseline locale (pas de conflits Git)

---

## 🔄 Workflow Développeur

### Scénario 1 : Progrès (Warnings Réduits)

```bash
# Fichier a 50 warnings dans baseline
# Corriger 10 warnings → Reste 40 warnings

git add file.tsx
git commit -m "[BO-LINT-001] fix: 10 nullish warnings in file.tsx"

# ✅ Hook pre-commit :
# - AVANT: 50 warnings (baseline)
# - APRÈS: 40 warnings (lint actuel)
# - PROGRÈS: -10 warnings
# - Baseline mise à jour: 40 warnings
# - Commit autorisé ✅
```

### Scénario 2 : Stable (Warnings Inchangés)

```bash
# Fichier a 30 warnings dans baseline
# Modifier code sans corriger warnings → Toujours 30 warnings

git add file.tsx
git commit -m "refactor: rename variable"

# ✅ Hook pre-commit :
# - AVANT: 30 warnings (baseline)
# - APRÈS: 30 warnings (lint actuel)
# - STABLE: 0 changement
# - Commit autorisé ✅
```

### Scénario 3 : Régression (Warnings Augmentés)

```bash
# Fichier a 40 warnings dans baseline
# Ajouter code avec 2 nouveaux `any` → 42 warnings

git add file.tsx
git commit -m "feat: add feature"

# ❌ Hook pre-commit :
# - AVANT: 40 warnings (baseline)
# - APRÈS: 42 warnings (lint actuel)
# - RÉGRESSION: +2 warnings
# - Commit BLOQUÉ ❌
#
# → Corriger les 2 warnings ajoutés avant de commit
```

### Scénario 4 : Clean (0 Warnings Atteint)

```bash
# Fichier a 12 warnings dans baseline
# Tout corriger → 0 warnings

git add file.tsx
git commit -m "[BO-LINT-001] fix: all 12 warnings in file.tsx"

# 🎉 Hook pre-commit :
# - AVANT: 12 warnings (baseline)
# - APRÈS: 0 warnings (lint actuel)
# - CLEAN: Fichier 100% propre
# - Baseline mise à jour: Fichier retiré (0 warnings)
# - Commit autorisé ✅
```

---

## 🛠️ Implémentation Technique

### Fichiers Modifiés

1. **`.lintstagedrc.js`** - Configuration lint-staged (remplace `--max-warnings=0` par script progressif)
2. **`scripts/eslint-ratchet-progressive.sh`** - Script validation progressive
3. **`.gitignore`** - Ajoute `.eslint-baseline.json`
4. **`scripts/eslint-restore-strict.sh`** - Script retour au mode strict (après 0 warnings)

### Script Validation Progressive

**Fichier** : `scripts/eslint-ratchet-progressive.sh`

**Logique** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```bash
Pour chaque fichier staged:
  1. Lire baseline (warnings_avant)
  2. Linter fichier (warnings_après)
  3. Comparer:
     - Si après <= avant → ✅ Commit OK
     - Si après > avant  → ❌ Commit bloqué
  4. Mettre à jour baseline si progrès
```

**Appelé automatiquement** par lint-staged dans le hook pre-commit.

---

## 🎯 Retour au Mode Strict

### Quand ?

Une fois **0 warnings atteint globalement** dans tous les packages :

```bash
pnpm lint
# ✅ @verone/back-office: 0 errors, 0 warnings
# ✅ @verone/linkme: 0 errors, 0 warnings
# ✅ @verone/site-internet: 0 errors, 0 warnings
```

### Comment ?

Exécuter le script de restauration :

```bash
bash scripts/eslint-restore-strict.sh
```

**Actions automatiques** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
1. Vérifie 0 warnings globalement
2. Restaure `.lintstagedrc.js` au mode strict (`--max-warnings=0`)
3. Supprime `.eslint-baseline.json` (plus nécessaire)
4. Supprime `scripts/eslint-ratchet-progressive.sh` (plus nécessaire)
5. Stage changements pour commit final

**Commit final** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```bash
git commit -m "[NO-TASK] chore: restore strict ESLint ratchet (0 warnings achieved)"
```

---

## 📊 Monitoring Progression

### Vérifier Warnings Restants

```bash
# Global
pnpm lint 2>&1 | grep "problems"

# Par package
pnpm --filter @verone/back-office lint 2>&1 | grep "problems"
pnpm --filter @verone/linkme lint 2>&1 | grep "problems"
```

### Vérifier Baseline Locale

```bash
# Nombre de fichiers avec warnings
cat .eslint-baseline.json | jq 'keys | length'

# Top 10 fichiers avec le plus de warnings
cat .eslint-baseline.json | jq -r 'to_entries | sort_by(.value) | reverse | .[0:10] | .[] | "\(.value) warnings → \(.key)"'
```

---

## ⚠️ Dépannage

### "Baseline n'existe pas"

**Normal** - Baseline créée automatiquement au 1er commit. Pas d'action nécessaire.

### "Commit bloqué malgré corrections"

**Vérifier** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
1. Warnings réellement réduits ? `pnpm eslint file.tsx`
2. Baseline à jour ? `cat .eslint-baseline.json | jq '."file.tsx"'`
3. Script exécutable ? `ls -la scripts/eslint-ratchet-progressive.sh`

**Régénérer baseline** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```bash
rm .eslint-baseline.json
git commit  # Baseline régénérée automatiquement
```

### "Conflit Git sur baseline"

**Impossible** - `.eslint-baseline.json` est gitignored (jamais commité).

---

## 📚 Références

- **Plan de migration** : `.plans/eslint-5690-warnings-plan.md`
- **Workflow correction** : `.claude/commands/fix-warnings.md`
- **Template composant** : `.claude/templates/component.tsx`
- **Article Ratcheting** : https://martinfowler.com/articles/qa-in-production.html#ratcheting

---

## 📈 État Migration (Live)

**Total départ** : 5,690 warnings (2026-01-30)
**Total actuel** : Voir `pnpm lint`

**Objectif** : 0 warnings → Retour mode strict

**Timeline estimée** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- Phase A (Quick Wins) : 600-800 warnings (4-6h)
- Phase B (Type Safety) : 1,000-1,200 warnings (10-15h)
- Phase C (UI Components) : 800-1,000 warnings (8-10h)
- Phase D (Cleanup) : Reste (migration graduelle)

**Dernière mise à jour** : 2026-01-31
