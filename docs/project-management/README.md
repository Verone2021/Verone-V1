# 📊 Project Management - Gestion Projet Vérone

**Date création** : 2025-11-19
**Mainteneur** : Romeo Dos Santos

---

## 🎯 Objectif

Centraliser toute la documentation gestion projet : roadmap, sprints, retrospectives, métriques.

---

## 📂 Structure

```
project-management/
├── README.md                          # Ce fichier
├── roadmap-developpement.md           # Roadmap stratégique
├── sprint-planning/                   # Plans de sprints
├── retrospectives/                    # Rétrospectives équipe
└── metrics/                           # Métriques projet (velocity, burndown)
```

---

## 📋 Fichiers Principaux

### Roadmap

- **[roadmap-developpement.md](./roadmap-developpement.md)** - Roadmap stratégique Vérone (Q4 2025 - Q4 2026)

### Sprints Planning

**Dossier** : `sprint-planning/`

_À créer au fur et à mesure des sprints_

**Template** :

```
sprint-XX-YYYY-MM.md
Exemple : sprint-01-2025-11.md
```

### Retrospectives

**Dossier** : `retrospectives/`

_À créer après chaque sprint_

**Template** :

```
retro-sprint-XX-YYYY-MM.md
retro-phase-X-nom-phase.md
Exemples :
- retro-sprint-01-2025-11.md
- retro-phase-4-multi-frontends.md
```

### Métriques

**Dossier** : `metrics/`

**À créer** :

- `velocity-tracking.md` - Suivi vélocité équipe
- `burndown-charts/` - Burndown charts par sprint
- `kpi-projet.md` - KPI projet (SLOs, qualité, etc.)

---

## 🚀 Workflow Sprint

### 1. Sprint Planning

```bash
# Créer plan sprint
cp docs/project-management/templates/sprint-template.md \
   docs/project-management/sprint-planning/sprint-XX-YYYY-MM.md

# Éditer objectifs, user stories, estimations
```

### 2. Sprint Execution

- Daily standups (oral, pas documentés)
- Tracking progrès (GitHub Projects, Jira, ou simple TODO.md)

### 3. Sprint Review

- Démo features complétées
- Validation stakeholders

### 4. Sprint Retrospective

```bash
# Créer retrospective
cp docs/project-management/templates/retro-template.md \
   docs/project-management/retrospectives/retro-sprint-XX-YYYY-MM.md

# Documenter :
# - Ce qui a bien fonctionné
# - Ce qui a mal fonctionné
# - Actions d'amélioration
```

---

## 📊 Métriques Clés

### Vélocité

**Définition** : Nombre de story points complétés par sprint

**Objectif** : Stabiliser vélocité sur 3-4 sprints pour prédictibilité

### Burndown

**Définition** : Graphique travail restant vs temps

**Objectif** : Trend linéaire descendant (pas de variations brutales)

### Qualité

**Métriques** :

- **Console errors** : 0 (tolérance zéro)
- **TypeScript errors** : 0
- **Build success rate** : 100%
- **Test coverage** : >80% (nouveaux modules)

---

## 🔗 Liens Connexes

**Architecture** :

- [TURBOREPO-FINAL-CHECKLIST.md](/docs/architecture/TURBOREPO-FINAL-CHECKLIST.md) - Checklist Phase 4
- [MIGRATION-TURBOREPO-TODO.md](/docs/architecture/MIGRATION-TURBOREPO-TODO.md) - Archive TODO migration

**Documentation** :

- [CLAUDE.md](/CLAUDE.md) - Instructions Claude Code
- [docs/README.md](/docs/README.md) - Index documentation

**ADR** :

- [ADR-0001](/docs/architecture/decisions/0001-turborepo-monorepo.md) - Turborepo Monorepo

---

## 📝 Templates

### Sprint Planning Template

```markdown
# Sprint XX - [Mois YYYY]

**Dates** : DD/MM/YYYY - DD/MM/YYYY
**Objectif Sprint** : [Objectif principal]
**Vélocité cible** : XX story points

## User Stories

| ID   | User Story                | Story Points | Status |
| ---- | ------------------------- | ------------ | ------ |
| US-1 | En tant que... je veux... | 5            | ⏸️     |
| US-2 | En tant que... je veux... | 3            | ⏸️     |

## Critères de Succès

- [ ] [Critère 1]
- [ ] [Critère 2]

## Risques Identifiés

- [Risque 1] → Mitigation : [...]
```

### Retrospective Template

```markdown
# Retrospective Sprint XX - [Mois YYYY]

**Date** : DD/MM/YYYY
**Participants** : [Liste équipe]

## 🎉 Ce qui a bien fonctionné

- [Point positif 1]
- [Point positif 2]

## 😕 Ce qui a mal fonctionné

- [Point négatif 1] → Action : [...]
- [Point négatif 2] → Action : [...]

## 💡 Actions d'Amélioration

| Action     | Responsable | Date cible |
| ---------- | ----------- | ---------- |
| [Action 1] | [Nom]       | DD/MM/YYYY |
| [Action 2] | [Nom]       | DD/MM/YYYY |

## 📊 Métriques Sprint

- **Vélocité** : XX story points (vs XX cible)
- **Quality** : X console errors, X TypeScript errors
- **Build time** : XX secondes
```

---

**Retour** : [Index Principal Documentation](/docs/README.md)
**Date création** : 2025-11-19
**Statut** : ✅ Structuré Phase 4
