# Contextes Claude Code

Index des contextes spécialisés à charger selon la tâche.

## Quand charger quoi

| Tâche                        | Contexte           | Commande                                    |
| ---------------------------- | ------------------ | ------------------------------------------- |
| 🗄️ DB, Migrations, RLS       | `database.md`      | `Read('.claude/contexts/database.md')`      |
| 🚀 CI/CD, Vercel, Rollback   | `deployment.md`    | `Read('.claude/contexts/deployment.md')`    |
| 🎨 UI, Composants, Storybook | `design-system.md` | `Read('.claude/contexts/design-system.md')` |
| 🏗️ Architecture Turborepo    | `monorepo.md`      | `Read('.claude/contexts/monorepo.md')`      |

## Principe

- **Ne charger que le contexte nécessaire** (éviter surcharge tokens)
- **Référencés dans CLAUDE.md** (lignes 510-522)
- **Maintenus à jour** avec la réalité du projet

## Archivés

- `kpi.md` → `docs/_archive/kpi-context-2025-10.md` (obsolète, non utilisé)

---

**Dernière mise à jour** : 2025-12-17
