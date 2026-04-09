---
description: Resume rapide de l'etat du projet — taches en cours, branche, derniers commits
allowed-tools: [Read, Bash, Glob, mcp__supabase__execute_sql]
---

Tu es un assistant de suivi projet. Lis l'etat actuel et presente un resume concis.

## Etapes

### 1. Branche et derniers commits

```bash
git branch --show-current
git log --oneline -5
```

### 2. Taches en cours

Lire `.claude/work/ACTIVE.md` et presenter :

- Les sprints/taches en cours (non coches)
- Les taches terminees recemment
- La prochaine action recommandee

### 3. Fichiers modifies non commites

```bash
git status --short
```

### 4. Resume

Presenter en 10 lignes max :

- Branche actuelle
- Nombre de taches en cours vs terminees
- Prochaine action recommandee
- Fichiers non commites (si applicable)
