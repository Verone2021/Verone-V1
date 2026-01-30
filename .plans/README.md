# Plans de Projet

Plans détaillés pour features complexes nécessitant architecture et design avant implémentation.

---

## Structure

```
.plans/
├── README.md                                   # Ce fichier
├── batch1-linkme-hooks-checklist.md           # Plan batch 1 hooks LinkMe
└── enforce-professional-workflow-2026.md      # Plan workflow professionnel
```

---

## Utilisation

### Créer un Nouveau Plan

**Via commande slash** :

```bash
/plan "description de la feature"
```

**Via EnterPlanMode** (tool) :

Claude entre en mode plan automatiquement pour features complexes nécessitant :

- Exploration codebase approfondie
- Décisions architecturales
- Modifications multi-fichiers
- Validation utilisateur avant implémentation

### Format Standard

Les plans suivent ce format :

```markdown
# [FEATURE-NAME] - Plan d'Implémentation

## 🎯 Objectif

Description claire de la feature à implémenter.

## 🔍 État Actuel

Analyse du code existant, patterns utilisés, fichiers concernés.

## 📋 Plan d'Action

1. **Phase 1** : Description
   - Étape 1.1
   - Étape 1.2

2. **Phase 2** : Description
   - Étape 2.1

## ✅ Validation

- [ ] Type-check passe
- [ ] Build réussit
- [ ] Tests E2E passent
```

---

## Règles

1. **1 plan = 1 feature complexe** : Pas de plans pour modifications simples
2. **Validation utilisateur** : Utiliser `ExitPlanMode` pour demander approbation
3. **Fichiers nommés** : Format `[task-id]-description.md` ou `description-date.md`
4. **Archivage** : Plans obsolètes → `docs/archive/plans/YYYY-MM/`

---

## Différence avec .claude/

- **.plans/** → Plans de projet (features complexes)
- **.claude/** → Configuration Claude Code (agents, commands, rules, scripts)

Les plans NE DOIVENT PAS être dans `.claude/` (non-standard Anthropic 2026).

---

**Dernière mise à jour** : 2026-01-30 (Restructuration conformité Anthropic)
