# LinkMe - Plateforme B2B Affilies

Canal de vente **linkme** (PAS "affilie"). Plateforme B2B ou les affilies (enseignes/organisations) passent des commandes depuis les selections Verone.

## CRITICAL : Index a consulter AVANT toute modification

- Pages, routes, formulaires LinkMe : @docs/current/INDEX-LINKME-COMPLET.md
- Index auto-genere (pages, API, composants) : @docs/current/INDEX-LINKME-APP.md
- Composants et hooks partages : @docs/current/INDEX-COMPOSANTS-FORMULAIRES.md

## Source de Verite Unique

**TOUJOURS lire en premier** : `docs/current/linkme/GUIDE-COMPLET-LINKME.md`

## Documentation par Tache

| Tache                | Lire AVANT                                                |
| -------------------- | --------------------------------------------------------- |
| Guide complet        | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`             |
| Commissions          | `docs/current/linkme/commission-reference.md`             |
| Commandes affilies   | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`             |
| Auth/Roles           | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`             |
| Selections publiques | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`             |
| Prix/Corrections     | `docs/current/linkme/commission-reference.md`             |
| RLS affilies         | `.claude/rules/database/rls-patterns.md` (section LinkMe) |
| Formulaires commande | `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`            |
| Facture verification | `docs/current/finance/invoicing-system-reference.md`      |

## Regles Specifiques LinkMe

1. **Isolation RLS stricte** : Chaque affilie voit UNIQUEMENT ses donnees via `enseigne_id` XOR `organisation_id`
2. **2 types commissions** : commission Verone (marge) + commission affilie. Details dans `docs/current/linkme/commission-reference.md`
3. **TOUJOURS verifier `linkme_affiliates`** : Table centrale de liaison affilie ↔ enseigne/organisation
4. **Canal = `linkme`** : JAMAIS "affilie", "affiliate", ou autre variante
5. **Prefix commandes** : Les commandes LinkMe ont un prefix specifique par affilie

## Build Filtre

```bash
pnpm --filter @verone/linkme build
pnpm --filter @verone/linkme type-check
```

## Port

`localhost:3002`

## Roles Affilies

- `enseigne_admin` : Admin d'une enseigne (voit toutes les orgs de son enseigne)
- `org_independante` : Organisation independante (voit uniquement sa propre org)
- Table : `user_app_roles` (app='linkme')

## Documentation Projet

- `docs/current/linkme/GUIDE-COMPLET-LINKME.md` — Guide complet LinkMe
- `docs/current/linkme/commission-reference.md` — Regles de commission
- `docs/current/database/schema/` — Schema DB par domaine
- `.claude/rules/database/rls-patterns.md` — Patterns RLS (section LinkMe)
