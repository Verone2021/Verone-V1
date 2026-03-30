# Guide de Travail — Romeo + Claude Code

## Demarrer une session

Dis simplement ce que tu veux faire. Claude lit automatiquement ACTIVE.md et choisit le bon workflow.

**Exemples :**

- "On continue" → Claude lit ACTIVE.md, resume l'etat, propose la suite
- "Le logo ne s'affiche pas sur la page organisations" → Bug fix (oneshot)
- "Je veux ajouter un champ date de livraison" → Feature (implement)
- "Fais un audit du module stock" → Audit (perf-optimizer ou review)
- "Explique-moi comment marchent les commissions" → Pedagogie (teach)

## Comment Claude choisit le workflow

| Ce que tu dis                    | Workflow                                      | Commande            |
| -------------------------------- | --------------------------------------------- | ------------------- |
| Bug simple, typo, ajustement CSS | **Oneshot** — fix rapide sans exploration     | Skill `oneshot`     |
| Feature complete                 | **Implement** — search → plan → code → verify | `/implement`        |
| "Explique-moi..."                | **Teach** — explication avant code            | `/teach`            |
| "Fais un plan pour..."           | **Plan** — checklist dans ACTIVE.md           | `/plan`             |
| "Review le code avant PR"        | **Review** — audit qualite                    | `/review`           |
| "PR" ou "push"                   | **PR** — commit + push + PR staging           | `/pr`               |
| "Verifie la DB pour..."          | **Schema Sync** — reference schema rapide     | Skill `schema-sync` |

## Les agents

Tu n'as pas besoin de les appeler. Claude choisit le bon automatiquement :

| Si tu parles de...                                  | Agent utilise          |
| --------------------------------------------------- | ---------------------- |
| Commandes LinkMe, commissions, selections, affilies | `linkme-expert`        |
| Produits, stock, factures, finance, dashboard       | `back-office-expert`   |
| Site e-commerce, catalogue, panier, checkout        | `site-internet-expert` |
| Migration DB, RLS, triggers                         | `database-architect`   |
| Performance, dead code, optimisation                | `perf-optimizer`       |
| Composant UI, design system                         | `frontend-architect`   |
| Qualite code avant PR                               | `code-reviewer`        |

## ACTIVE.md — qui le met a jour ?

**Claude le met a jour.** Apres chaque tache terminee :

1. Claude marque la tache `[x]` dans ACTIVE.md
2. Claude ajoute les nouvelles taches si necessaire
3. Claude supprime les taches mergees

**Toi** tu decides quelles taches ajouter et dans quel ordre les faire.

## Playwright MCP

Pour tester visuellement, il faut que le serveur dev tourne.
**Toi** tu lances : `pnpm dev` (ou `pnpm dev:bo` pour back-office seul)
**Claude** utilise Playwright pour naviguer, verifier les pages, prendre des screenshots.

## Regles automatiques (tu n'as rien a faire)

| Regle            | Quand                      | Effet                                      |
| ---------------- | -------------------------- | ------------------------------------------ |
| Triple Lecture   | Avant toute modification   | Claude lit 3 fichiers similaires           |
| Type-check auto  | Apres chaque edit .ts/.tsx | Verification TypeScript immediate          |
| Protection main  | Commit/push                | Bloque si on est sur main                  |
| Format commit    | Chaque commit              | Impose [APP-DOMAIN-NNN] type: desc         |
| Zero any         | Chaque edit                | Bloque si TypeScript `any` detecte         |
| Verif historique | Avant implementation       | Claude verifie git log si ca a deja echoue |
| TEACH-FIRST      | Toujours                   | Claude dit NON si best practice violee     |
