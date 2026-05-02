---
description: Guide de Travail — Romeo + Claude Code
---

# Guide de Travail — Romeo + Claude Code

## Demarrer une session

Dis simplement ce que tu veux faire. Claude lit ACTIVE.md et choisit le bon workflow.

**Exemples :**

- "On continue" → Claude lit ACTIVE.md, resume l'etat, propose la suite
- "Le logo ne s'affiche pas" → Bug fix rapide (oneshot)
- "Ajoute un champ date de livraison" → Feature (dev-agent)
- "Fais un audit du code" → Audit (reviewer-agent)
- "PR" → Pipeline PR (ops-agent)

## Les agents

| Agent            | Role                          | Quand                                         |
| ---------------- | ----------------------------- | --------------------------------------------- |
| `dev-agent`      | Code, TDD, changelog          | Gros sprint > 5 outils ou > 10 fichiers       |
| `reviewer-agent` | Audit qualite read-only       | Avant gros merge, apres implementation        |
| `ops-agent`      | PR, push, deploy              | Optionnel — gros bloc, release main, recovery |
| `perf-optimizer` | Audit perf, dead code, bundle | Audit periodique, perf degradee               |

Note : `verify-agent` supprime en `[INFRA-LEAN-002]` (CI couvre type-check + build + tests).

## Commandes disponibles

| Commande            | Usage                                           |
| ------------------- | ----------------------------------------------- |
| `/search <domaine>` | Explorer DB + code + RLS                        |
| `/review <app>`     | Audit qualite code                              |
| `/pr`               | Commit + push + PR staging                      |
| `/status`           | Resume etat projet                              |
| `/fix-warnings`     | Workflow 6 phases pour corriger warnings ESLint |
| `/db <op>`          | Operations Supabase rapides (query, logs, RLS)  |
| `/teach <concept>`  | Mode pedagogique : explique avant d'implementer |

## Skills disponibles

| Skill           | Usage                             |
| --------------- | --------------------------------- |
| `oneshot`       | Fix rapide (typo, CSS, renommage) |
| `new-component` | Creer composant React standard    |
| `schema-sync`   | Reference rapide schema DB        |

## Pipeline scratchpad

`dev-plan → dev-report → review-report → verify-report → deploy-report`

Tous les rapports dans `docs/scratchpad/`.

## Regles automatiques (tu n'as rien a faire)

| Regle           | Effet                                               |
| --------------- | --------------------------------------------------- |
| Triple Lecture  | Claude lit 3 fichiers similaires avant modification |
| Type-check auto | Verification TypeScript apres chaque edit           |
| Protection main | Bloque commit/push sur main                         |
| Format commit   | Impose `[APP-DOMAIN-NNN] type: desc`                |
| Zero any        | Bloque si TypeScript `any` detecte                  |
