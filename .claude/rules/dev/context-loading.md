# Chargement de Contexte (OBLIGATOIRE)

## CRITICAL : Triple Lecture

Avant TOUTE modification de code, lire au minimum **3 fichiers ou references similaires** pour garantir l'alignement sur les patterns existants du projet. Cela empeche la creation de doublons fonctionnels et force la coherence.

## CRITICAL : NE JAMAIS coder sans contexte

### Etapes obligatoires

1. **Lire ACTIVE.md** (`.claude/work/ACTIVE.md`) — taches en cours, sprints, bugs connus
2. **Lire le CLAUDE.md de l'app concernee** — regles specifiques, documentation par tache
3. **Consulter la memoire persistante** — feedbacks, bugs connus, decisions passees
4. **Verifier Serena memories pertinentes** — workflows, schemas, patterns metier
5. **Explorer le code existant** — patterns, hooks, composants similaires AVANT de creer
6. **Lire 3 fichiers similaires** — composants, hooks ou pages qui font la meme chose

### Sources par domaine

| Domaine | Sources a consulter |
|---|---|
| LinkMe | `apps/linkme/CLAUDE.md`, Serena `linkme-*` memories, `docs/current/linkme/` |
| Back-office | `apps/back-office/CLAUDE.md`, Serena `business-entities-*`, `docs/current/modules/` |
| Site-internet | `apps/site-internet/CLAUDE.md`, `docs/current/site-internet/` |
| Database | `.claude/rules/database/`, Serena `database-tables-by-domain`, schema SQL |
| Finance | Serena `qonto-invoicing-system`, `docs/current/finance/` |
| Stock | Serena `stock-triggers-alerts-complete`, `docs/current/database/triggers-stock-reference.md` |

### INTERDIT

- Coder sans avoir lu le CLAUDE.md de l'app
- Supposer qu'un fichier/fonction/table existe sans verifier
- Creer un nouveau composant sans chercher s'il existe deja
- Modifier une API sans lire la regle backend/api.md
- Modifier du code sans avoir lu 3 fichiers similaires d'abord
