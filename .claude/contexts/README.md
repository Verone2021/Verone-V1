# Contextes Claude Code

Index des contextes spécialisés à charger selon la tâche.

## Contextes Disponibles

| Tâche                        | Contexte           | Commande                                    |
| ---------------------------- | ------------------ | ------------------------------------------- |
| 🎨 UI, Composants, Storybook | `design-system.md` | `Read('.claude/contexts/design-system.md')` |
| 🏗️ Architecture Turborepo    | `monorepo.md`      | `Read('.claude/contexts/monorepo.md')`      |

> **Note**: `database.md` et `deployment.md` ont été supprimés en v3.0.0 (doublons avec Serena memories et docs/current/).

## Principe

- **Ne charger que le contexte nécessaire** (éviter surcharge tokens)
- **Maintenus à jour** avec la réalité du projet

## Archivés

- `kpi.md` → `docs/_archive/kpi-context-2025-10.md` (obsolète, non utilisé)

---

**Dernière mise à jour** : 2026-01-09
