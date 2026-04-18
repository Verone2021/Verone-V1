# Queue — Tâches à faire

**Format** : 1 fichier Markdown par tâche. Nom du fichier = Task ID (ex : `BO-UI-RESP-LISTS.md`).

**Métadonnées** dans YAML frontmatter en tête. **Contenu** en Markdown libre en dessous.

**Workflow** :
1. Agent crée un fichier avec `status: todo`
2. Quand il le prend, il passe à `status: in-progress`
3. Quand la PR est mergée, il déplace le fichier dans `.claude/done/` et passe à `status: done`
4. Si bloqué, il passe à `status: blocked` et documente `blockers:`

**Statuts valides** : `todo | in-progress | blocked | done`

---

## Fichiers spéciaux

- `TEMPLATE.md` — modèle pour créer une nouvelle tâche
- `README.md` — ce fichier

---

## Comment ajouter une tâche

```bash
# 1. Copier le template
cp .claude/queue/TEMPLATE.md .claude/queue/BO-DOMAIN-NNN.md

# 2. Éditer :
#    - YAML frontmatter (id, title, priority, etc.)
#    - Contenu Markdown (contexte, livrable, critères de succès)

# 3. L'agent consommera la tâche quand il cherche la prochaine TODO
#    (par priorité P1 > P2 > P3)
```

## Comment déplacer une tâche

```bash
# De queue → done (après merge)
mv .claude/queue/BO-DOMAIN-NNN.md .claude/done/

# Modifier le YAML : status: done, merged_at, pr_number
```

## Comment l'agent sait quoi faire

Commandes à terme (Phase 3) :
- `bash .claude/scripts/next-task.sh` → affiche la prochaine tâche TODO priorité haute

En attendant, l'agent lit `.claude/queue/` et trie mentalement par priorité.

---

## Conventions YAML frontmatter

```yaml
---
id: BO-DOMAIN-NNN              # Task ID unique, format [APP-DOMAIN-NNN]
title: "Titre court descriptif"
app: back-office | linkme | site-internet | all
domain: FIN | STOCK | UI | TECH | SHIP | AUTH | etc.
priority: P1 | P2 | P3         # P1 = urgent, P3 = nice-to-have
status: todo | in-progress | blocked | done
estimated: 30m | 1h | 2h | 4h | 1d | 2d
blockers: []                   # Liste de Task IDs bloquants, ou motif texte
depends_on: []                 # Liste de Task IDs qui doivent être done avant
playbook: migrate-page-responsive | fix-bug | add-new-page | etc.
branch: feat/name-or-empty     # Branche git si créée
can_agent_act_alone: true | false  # Selon autonomy-boundaries.md
created: 2026-04-19
---
```
