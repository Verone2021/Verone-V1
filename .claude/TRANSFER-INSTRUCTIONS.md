# Instructions de Transfert - Workflow Enforcement Plan

**Date**: 2026-01-17
**Pour**: Nouvelle conversation Claude
**Objectif**: Implémenter l'enforcement du workflow professionnel CLAUDE.md v9.0.0

---

## 📦 Package Créé

### Fichiers à Transférer (Déjà Committés)

1. **Plan Principal**: `.claude/plans/enforce-professional-workflow-2026.md`
   - Plan complet 700+ lignes
   - Diagnostique problèmes Claude Code
   - 4 actions d'implémentation
   - Checklist de complétion

2. **Checklist**: `.claude/WORKFLOW-CHECKLIST.md`
   - Aide-mémoire phase par phase
   - Anti-patterns à éviter
   - Référence rapide

3. **Script Validation**: `.claude/scripts/validate-pr-ready.sh`
   - Valide pre-PR (type-check, build, commits)
   - Exécutable, prêt à utiliser

4. **Mémoire Serena**: `workflow-enforcement-rules`
   - Règles absolues avec exemples
   - Workflows correct vs incorrect
   - Actions si violations

### Fichiers de Référence (Déjà Existants)

- **CLAUDE.md v9.0.0**: Source de vérité workflow
- **workflow-professionnel-2026**: Mémoire recherches complètes

---

## 🎯 Message à Copier-Coller dans Nouvelle Conversation

```
Bonjour Claude,

Je te transfère un plan pour corriger les problèmes de workflow causés par Claude Code qui créait des PRs anarchiques sans commits ni push.

**CONTEXTE**:
Claude Code violait le workflow professionnel:
- ❌ Créait plusieurs PRs pour une seule feature (ex: PR #56, #57, #58)
- ❌ PRs créées AVANT commits/push
- ❌ Pas de commits intermédiaires (risque perte travail)
- ❌ Pas de phase Research/Plan avant code

**TON TRAVAIL**:
1. Lire le plan complet: `.claude/plans/enforce-professional-workflow-2026.md`
2. Lire CLAUDE.md v9.0.0 sections "Workflow" et "Git/PR"
3. Lire mémoire Serena: workflow-professionnel-2026
4. Lire mémoire Serena: workflow-enforcement-rules
5. Implémenter les 4 actions du plan:
   - Action 1: Nettoyer PRs anarchiques actuelles
   - Action 2: Créer hooks Git/PR validation
   - Action 3: Documenter workflow (déjà fait)
   - Action 4: Créer mémoire de rappel (déjà fait)

**RÈGLES À FAIRE RESPECTER** (CLAUDE.md v9.0.0):
- ✅ Commits toutes les 10-20 min (save points)
- ✅ UNE SEULE PR par feature (tous commits inclus)
- ✅ Workflow: Research → Plan → Test → Execute → Verify → Commit → PR
- ✅ Validation pre-PR: `.claude/scripts/validate-pr-ready.sh`

**ORDRE D'EXÉCUTION**:
1. Lire plan + références
2. Auditer état actuel (PRs ouvertes, branches)
3. Nettoyer PRs anarchiques
4. Créer hooks manquants
5. Tester workflow sur feature test
6. Valider avec moi

Commence par lire le plan complet et me confirmer ta compréhension.
```

---

## 📋 Checklist de Transfert

Avant de transférer à nouvelle conversation, vérifier:

- [x] Plan créé: enforce-professional-workflow-2026.md
- [x] Checklist créée: WORKFLOW-CHECKLIST.md
- [x] Script créé: validate-pr-ready.sh
- [x] Mémoire créée: workflow-enforcement-rules
- [x] Tout committé et pushé
- [ ] Copier message ci-dessus dans nouvelle conversation
- [ ] Vérifier que nouvelle Claude lit le plan
- [ ] Vérifier que nouvelle Claude comprend objectif

---

## 🎓 Ce que la Nouvelle Claude Doit Savoir

### Problème à Résoudre
Claude Code créait des PRs anarchiques:
- Plusieurs PRs pour une feature au lieu d'une
- PRs créées avant d'avoir fini le travail
- Pas de commits intermédiaires (risque perte)
- Pas de workflow structuré

### Solution (CLAUDE.md v9.0.0)
Workflow professionnel 7 phases:
1. **RESEARCH**: Lire existant AVANT coder
2. **PLAN**: EnterPlanMode si complexe
3. **TEST**: TDD (tests avant code)
4. **EXECUTE**: Code minimal
5. **VERIFY**: type-check + build
6. **COMMIT**: Toutes les 10-20 min + push
7. **PR**: UNE SEULE à la fin

### Métriques de Succès
- ✅ Commits toutes les 10-20 min
- ✅ 1 PR par feature
- ✅ CI success rate > 95%
- ✅ Pas de perte de travail

---

## 📚 Références pour Nouvelle Claude

### Documents Critiques (Ordre de lecture)
1. `.claude/plans/enforce-professional-workflow-2026.md` (PLAN PRINCIPAL)
2. `CLAUDE.md` v9.0.0 sections "Workflow" et "Git/PR"
3. Mémoire `workflow-professionnel-2026` (recherches)
4. Mémoire `workflow-enforcement-rules` (règles absolues)
5. `.claude/WORKFLOW-CHECKLIST.md` (aide-mémoire)

### Scripts et Outils
- `.claude/scripts/validate-pr-ready.sh` - Validation pre-PR

### Sources Externes (Optionnel)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [TDD with AI - Kent Beck](https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent)
- [Trunk-based Development](https://trunkbaseddevelopment.com/)

---

**Créé le**: 2026-01-17
**Commits**: ae21d1b4 (CLAUDE.md v9.0.0) + 53e41b33 (enforcement plan)
**Branch**: docs/claude-autonomy-guidelines
**Prêt pour**: Transfert à nouvelle conversation
