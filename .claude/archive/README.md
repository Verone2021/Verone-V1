# Archives Claude Code

## Structure

```
archive/
└── plans/
    ├── 2025-12/  # Décembre 2025 (migration manuelle)
    └── 2026-01/  # Janvier 2026 (auto-créé par plan-sync.js)
```

## Politique d'Archivage

- **Automatique**: `plan-sync.js` archive les tâches complétées depuis ACTIVE.md quand > 200 lignes
- **Format**: `.claude/archive/plans-YYYY-MM/active-YYYY-MM-DD.md`
- **Manuel**: Plans stratégiques peuvent être archivés ici avec noms explicites

## Rétention

- **6 derniers mois**: Conservés localement
- **Au-delà**: Archiver dans Git ou supprimer

## Recherche

```bash
# Trouver un Task ID dans les archives
grep -r "BO-DASH-001" .claude/archive/plans/

# Lister archives par mois
ls -lh .claude/archive/plans/*/
```
