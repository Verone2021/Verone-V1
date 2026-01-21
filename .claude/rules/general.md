# Règles Générales Verone Back Office

## Langue

Toujours répondre en français sauf pour :
- Code (commentaires en anglais)
- Commits (format anglais conventionnel)
- Documentation technique (anglais si standard industrie)

## Workflow

- TOUJOURS utiliser `/plan` avant implémentation complexe
- Commits fréquents (save points) sur feature branch
- UNE PR par feature (N commits → 1 PR)
- Tests obligatoires avant PR

## Format Commits

`[APP-DOMAIN-NNN] type: description`

Exemples :
- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`
