# Rapport de nettoyage racine — 2026-04-16

## Objectif

Archiver les fichiers markdown obsoletes a la racine du repo qui polluaient
le contexte de l'orchestrateur (references a d'anciens agents et a une
ancienne structure `.claude/rules/`).

## Fichiers deplaces

| Avant                             | Apres                                             | Taille | Raison                                                 |
| --------------------------------- | ------------------------------------------------- | ------ | ------------------------------------------------------ |
| `export-claude-config-complet.md` | `archive/2026-04/export-claude-config-complet.md` | 280 KB | Obsolete : ancienne config 7 agents                    |
| `diagnostic-verone.md`            | `archive/2026-04/diagnostic-verone.md`            | 56 KB  | Obsolete : ancienne structure `.claude/rules/backend/` |
| `AUDIT_16-04-26.md`               | `docs/scratchpad/audit-verone-2026-04-16.md`      | 52 KB  | Recent mais mal place (scratchpad est la bonne cible)  |

**Taille totale deplacee :** ~388 KB (280 + 56 + 52)

## Commit

- **Hash :** `f1e419aa7`
- **Branche :** `staging`
- **Push :** `origin/staging` (301b14fa4..f1e419aa7)
- **Message :** `[NO-TASK] chore: archive fichiers MD obsoletes de la racine`

## Modifications annexes

- `.gitignore` : ajout de 3 patterns pour eviter la recurrence
  - `/export-claude-config-*.md`
  - `/diagnostic-*.md`
  - `/AUDIT_*.md`
- `archive/2026-04/README.md` : cree pour expliquer l'archivage

## Etat final de la racine

Seuls les 3 fichiers canoniques subsistent :

- `CHANGELOG.md`
- `CLAUDE.md`
- `README.md`

## Methode

- `git mv` utilise pour les 2 fichiers trackes (historique preserve a 100%)
- `mv` simple pour `AUDIT_16-04-26.md` qui etait untracked
- Aucune suppression, aucune modification de contenu
- Travail en cours de Romeo preserve (non stage : `tests/auth.setup.ts`,
  `tests/e2e/smoke/smoke-147-pages.spec.ts`, scratchpads expedition)
