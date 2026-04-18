# Done — Tâches terminées et mergées

Fichiers des tâches fermées. Conservés pour :
- Référence historique (qui a fait quoi, quand, quelle PR)
- Calcul de vélocité (tâches/semaine)
- Détection de régression (si un bug revient, quelle tâche l'a résolu)

**Archivage automatique** : après 30 jours, un workflow CI (Phase 3) déplacera les fichiers vers `docs/archive/tasks/YYYY-MM/`. Pour l'instant, pas d'archivage automatique.

---

## Convention de nommage

Identique à `.claude/queue/` : 1 fichier Markdown par tâche, nom = Task ID.

Le YAML frontmatter doit contenir :
- `status: done`
- `merged_at: YYYY-MM-DD`
- `pr_number: NNN` (numéro de PR GitHub)

Exemple :

```yaml
---
id: BO-UI-RESP-INFRA
title: "Infrastructure responsive + audit global"
status: done
merged_at: 2026-04-18
pr_number: 649
---
```

---

## Comment migrer une tâche depuis queue/

```bash
# 1. Éditer le YAML pour passer status: done + ajouter merged_at + pr_number

# 2. Déplacer le fichier
mv .claude/queue/BO-DOMAIN-NNN.md .claude/done/
```
