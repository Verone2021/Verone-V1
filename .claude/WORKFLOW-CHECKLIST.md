# Workflow Checklist - À Suivre Pour CHAQUE Feature

## ✅ Phase 1: RESEARCH (2-5 min)
- [ ] Lire fichiers pertinents (Read, Glob, Grep)
- [ ] Comprendre architecture actuelle
- [ ] Identifier patterns existants
- [ ] Documenter dépendances

## ✅ Phase 2: PLAN (3-10 min)
- [ ] EnterPlanMode si task complexe (multi-fichiers)
- [ ] Identifier 2+ approches possibles
- [ ] Lister edge cases
- [ ] Obtenir approbation utilisateur

## ✅ Phase 3: TEST (5-15 min)
- [ ] Écrire tests qui échouent (RED)
- [ ] Valider que tests capturent bien le comportement attendu

## ✅ Phase 4-6: EXECUTE + VERIFY + COMMIT (Boucle)

Pour CHAQUE étape logique (toutes les 10-20 min):

- [ ] Écrire code minimal pour passer tests (GREEN)
- [ ] Refactorer si nécessaire (REFACTOR)
- [ ] Vérifier qualité:
  ```bash
  npm run type-check
  npm run build
  npm run e2e:smoke  # Si UI modifiée
  ```
- [ ] Commit atomique + push:
  ```bash
  git add .
  git commit -m "[APP-DOMAIN-NNN] step N: description"
  git push  # ← OBLIGATOIRE
  ```
- [ ] CI passe (vérifier GitHub Actions)

Répéter jusqu'à feature complète.

## ✅ Phase 7: PR (Une fois feature 100% complète)

- [ ] Tous les tests passent
- [ ] Build production OK
- [ ] Au moins 2-3 commits atomiques
- [ ] Branche à jour avec main
- [ ] Valider pre-PR:
  ```bash
  ./.claude/scripts/validate-pr-ready.sh
  ```
- [ ] Créer UNE SEULE PR:
  ```bash
  gh pr create \
    --title "[APP-DOMAIN-NNN] feat: description" \
    --body "Summary + Test Plan + Liste commits"
  ```

## ❌ Anti-Patterns à ÉVITER

- ❌ Coder sans avoir lu l'existant (skip RESEARCH)
- ❌ Pas de plan pour task complexe (skip PLAN)
- ❌ Tests après le code (pas de TDD)
- ❌ Commits rares ou absents (pas de backup)
- ❌ PR créée avant d'avoir fini (feature incomplète)
- ❌ Plusieurs PRs pour une feature (fragmenter le travail)

## 📚 Références

- CLAUDE.md v9.0.0 (sections "Workflow" et "Git/PR")
- Mémoire: workflow-professionnel-2026
- Plan: enforce-professional-workflow-2026.md
