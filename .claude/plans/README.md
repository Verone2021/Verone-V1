# Plans Dynamiques

⚠️ **Ce dossier est normalement vide.**

## Pourquoi vide ?

Claude Code génère des plans temporaires dans `~/.claude/plans/` (répertoire utilisateur global) lors des sessions de planification. Ces plans sont exportés vers `.claude/handoff/` pour le workflow READ→WRITE.

## Source de Vérité

Le plan actif est **toujours** dans `.claude/work/ACTIVE.md`.

## Architecture

```
~/.claude/plans/          # Plans temporaires (session Claude Code)
~/.claude/handoff/        # Export handoff (LATEST.md)
.claude/work/ACTIVE.md    # Source de vérité (repo)
.claude/archive/plans/    # Archives permanentes (repo)
```

## Si ce dossier contient des fichiers

C'est probablement un résidu de session. Vous pouvez :
1. Les déplacer vers `.claude/archive/plans/YYYY-MM/` si importants
2. Les supprimer sinon
