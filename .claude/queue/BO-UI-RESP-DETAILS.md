---
id: BO-UI-RESP-DETAILS
title: "Migration responsive Patterns C + D (73 pages détail + dashboards)"
app: back-office
domain: UI-RESP
priority: P1
status: todo
estimated: 2-3 jours
blockers: []
depends_on: [BO-UI-RESP-LISTS]
playbook: migrate-page-responsive
branch: feat/responsive-details
can_agent_act_alone: false
created: 2026-04-19
---

# BO-UI-RESP-DETAILS — Migration responsive Patterns C + D

## Contexte

Suite de la migration responsive. Pattern A + B (listes) est traité dans BO-UI-RESP-LISTS sur `feat/responsive-lists`. Cette tâche couvre :
- **Pattern C** : 35 pages détail (pages produit, commande, facture, contact)
- **Pattern D** : 38 pages dashboard (`/dashboard`, hubs modules stocks/finance/produits/contacts/messages/parametres)

Référence audit : `docs/scratchpad/audit-responsive-global-2026-04-19.md`.

## Livrable

73 pages migrées responsives aux 5 tailles (375/768/1024/1440/1920). 1 branche `feat/responsive-details`. 1 PR finale `[BO-UI-RESP-DETAILS]`.

## Critères de succès

- [ ] Pattern C : pages détail utilisent le layout 2 colonnes responsive (stack mobile, side-by-side desktop)
- [ ] Pattern D : KPIs en `KpiGrid` avec breakpoints responsive (1 col mobile / 2 cols md / 4 cols xl)
- [ ] Aucun `w-auto` ni `max-w-[NNNpx]` artificiel dans les fichiers migrés
- [ ] Tous les fichiers migrés < 400 lignes (décomposition si besoin)
- [ ] Zero `eslint-disable`, zero `any`, zero cast unsafe
- [ ] Type-check PASS sur back-office
- [ ] Build PASS sur back-office
- [ ] Playwright runtime sur 10 pages échantillon : 0 erreur console
- [ ] Reviewer-agent Axe 4 Responsive : PASS
- [ ] Screenshots 5 tailles joints en commentaire PR

## Playbook à utiliser

Voir `.claude/playbooks/migrate-page-responsive.md`.

Pour Pattern C (détail), pas de `ResponsiveDataView` nécessaire — c'est un layout, pas une table. Utiliser les classes responsive Tailwind directement.

Pour Pattern D (dashboard), `KpiGrid` de `@verone/ui-business` existe et est responsive natif. Vérifier qu'il est utilisé partout.

## Notes

- Branche séparée de `feat/responsive-lists` → attendre merge de LISTS avant de créer DETAILS
- Décomposition des pages détail : `[Entity]Header.tsx`, `[Entity]Body.tsx`, `[Entity]Sidebar.tsx` si besoin
- Modals de détail (ex: `OrderDetailsModal`) : appliquer `h-screen md:h-auto md:max-w-2xl` pattern
