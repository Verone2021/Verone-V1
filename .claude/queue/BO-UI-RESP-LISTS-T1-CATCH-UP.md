---
id: BO-UI-RESP-LISTS-T1-CATCH-UP
title: "Catch-up T1 pour 4 tables T2-only KO à 375px"
app: back-office
domain: UI-RESP
priority: P2
status: todo
estimated: 2h
blockers: []
depends_on: [BO-UI-RESP-LISTS]
playbook: migrate-page-responsive
branch: feat/responsive-lists-t1-catchup
can_agent_act_alone: false
created: 2026-04-19
---

# BO-UI-RESP-LISTS-T1-CATCH-UP — Catch-up T1 pour 4 tables KO

## Contexte

L'audit runtime à 375px (`docs/scratchpad/audit-t2-only-375px-2026-04-19.md`) a identifié 4 composants classés 🔴 KO :
- `expeditions-tab-to-ship` : seulement N° Commande visible à 375px
- `expeditions-tab-packlink` : pattern identique suspecté (non testé data vide)
- `expeditions-tab-history` : pattern identique suspecté
- `CommissionsTable` (LinkMe) : seulement Date + N° Commande visibles

Ces tables violent T1 de `.claude/rules/responsive.md` ("Sous md, tableau INTERDIT → cartes obligatoires").

Accepté dans PR #651 via ADR-008 (dette technique documentée). Cette tâche ferme la dette.

## Scope

Appliquer pattern complet 3-fichiers (Table + MobileCard + Actions) comme pour `/factures` / `/commandes/fournisseurs` / `/stocks/inventaire`.

## Fichiers à migrer

1. **Expeditions** (3 composants, partagent `expeditions-order-row`) :
   - `apps/back-office/src/app/(protected)/stocks/expeditions/expeditions-tab-to-ship.tsx`
   - `apps/back-office/src/app/(protected)/stocks/expeditions/expeditions-tab-packlink.tsx`
   - `apps/back-office/src/app/(protected)/stocks/expeditions/expeditions-tab-history.tsx`
   - `apps/back-office/src/app/(protected)/stocks/expeditions/expeditions-order-row.tsx` (partagé)
   
   Stratégie : créer `ExpeditionMobileCard.tsx` commun + wrapper chaque tab avec `ResponsiveDataView`.

2. **CommissionsTable LinkMe** :
   - `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/commissions/CommissionsTable.tsx`
   
   Stratégie : créer `CommissionMobileCard.tsx` + wrapper avec `ResponsiveDataView`.

## Critères de succès

- [ ] 4 composants migrés avec pattern 3-fichiers
- [ ] Runtime Playwright à 375px : chaque tab/table affiche des **cartes** empilées lisibles (pas de scroll horizontal, actions accessibles)
- [ ] Type-check PASS
- [ ] Runtime console : 0 erreur
- [ ] Screenshots avant/après joints en PR

## Playbook

Voir `.claude/playbooks/migrate-page-responsive.md` — approche identique au pilote v2 `/factures` (commit `51bced9e5`).

## Notes

- Les tables partagent probablement `SalesOrderDataTable` ou utilisent des composants enfants similaires. Vérifier avant création pour éviter duplication.
- La classification "P2" reflète que ces tables sont utilisées par staff admin, pas par les users mobile en priorité. Mais la dette doit se fermer à terme.

## Références

- Audit source : `docs/scratchpad/audit-t2-only-375px-2026-04-19.md`
- ADR-008 : `.claude/DECISIONS.md`
- PR parente : #651 (fermée/mergée)
