# Site Internet Verone

Vitrine publique. Affiche les selections de produits publiees.

## Documentation par Tache

| Tache                | Lire AVANT                                            |
| -------------------- | ----------------------------------------------------- |
| Selections publiques | Serena memory `linkme-public-selections-architecture` |
| Architecture         | `docs/current/architecture.md`                        |
| Vue d'ensemble       | `docs/current/serena/project-overview.md`             |

## Build Filtre

```bash
pnpm --filter @verone/site-internet build
pnpm --filter @verone/site-internet type-check
```

## Port

`localhost:3001`

## Acces DB

- Lecture seule via RLS `anon` sur selections publiques (`is_public = true AND status = 'active'`)
- Pattern RLS : `.claude/rules/database/rls-patterns.md` (section Site-Internet)
