# Guide Rapide : Test Workflow ESLint

**🎯 Objectif** : Valider que Claude suivra le workflow fix-warnings.md correctement AVANT de lancer la correction massive des 2666 warnings.

---

## 📋 Étapes (5 minutes utilisateur)

### Étape 1 : Copier le prompt

```bash
# Ouvrir le fichier prompt
cat docs/claude/PROMPT-TEST-ESLINT.txt
```

### Étape 2 : Coller dans Claude

**Copier-coller EXACTEMENT le contenu dans Claude.**

### Étape 3 : Observer l'exécution

**Claude DOIT** :

- ✅ Lire fix-warnings.md (434 lignes)
- ✅ Valider checklist (15 cases)
- ✅ Utiliser MCP Context7 (documentation officielle)
- ✅ Utiliser MCP Serena (patterns projet)
- ✅ Self-verify AVANT commit : `pnpm eslint --quiet file.tsx` → 0 warnings

**Temps attendu** : 20-30 minutes

### Étape 4 : Vérifier résultat

**Commandes de validation** :

```bash
# 1. Vérifier warnings du fichier test (DOIT être 0)
pnpm --filter @verone/back-office eslint --quiet apps/back-office/src/path/to/file.tsx

# 2. Vérifier commit (format correct)
git log --oneline -1
# Format attendu: [BO-LINT-XXX] fix: N warnings in file (types)

# 3. Vérifier baseline ratchet initialisée
cat .eslint-baseline.json
# Doit contenir le fichier test avec 0 warnings

# 4. Vérifier total warnings projet (DOIT avoir diminué)
pnpm --filter @verone/back-office lint 2>&1 | grep "✖"
# Attendu: ~2656 warnings (2666 - 10 du test)
```

### Étape 5 : Continuer ou corriger

**Si test ✅ RÉUSSI** :

```bash
# Copier le prompt suivant
cat docs/claude/PROMPT-CONTINUE-ESLINT.txt
# Coller dans Claude
```

**Si test ❌ ÉCHOUE** :

1. Consulter `docs/claude/eslint-test-workflow-validation.md` section "Que Faire si Test Échoue"
2. Identifier QUELLE phase a échoué (Discovery, Analysis, Planning, Implementation, Validation)
3. Re-lancer le test sur le MÊME fichier après correction

---

## 🎯 Checklist Rapide

**AVANT de lancer le prompt** :

- [ ] Branch feature créée : `git checkout -b fix/eslint-warnings-batch-XXX`
- [ ] Serveurs arrêtés (pas de conflit port 3000-3002)
- [ ] Git clean : `git status` → No changes

**APRÈS test réussi** :

- [ ] Fichier à 0 warnings ✅
- [ ] Commit format correct ✅
- [ ] Hook ratchet passé ✅
- [ ] Baseline ratchet initialisée ✅
- [ ] Prêt à continuer sur les autres fichiers ✅

---

## 📖 Documentation Complète

**Toutes les réponses détaillées** : `docs/claude/eslint-test-workflow-validation.md`

**Workflow complet** : `.claude/commands/fix-warnings.md` (434 lignes)

**Section CLAUDE.md** : Lignes 328-365

---

## TL;DR

1. **Copier** : `docs/claude/PROMPT-TEST-ESLINT.txt`
2. **Coller** dans Claude
3. **Attendre** 20-30 minutes (Claude corrige 1 fichier)
4. **Vérifier** : 0 warnings + commit passé + baseline initialisée
5. **Continuer** avec `PROMPT-CONTINUE-ESLINT.txt` si succès

**Temps total** : 5 min (utilisateur) + 20-30 min (Claude)

**Risque** : Minimal (1 seul fichier)

**Gain** : Garantie que workflow expert sera suivi pour les 2666 warnings
