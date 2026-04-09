# LinkMe - Plateforme B2B Affilies

Canal de vente **linkme** (PAS "affilie"). Plateforme B2B ou les affilies (enseignes/organisations) passent des commandes depuis les selections Verone.

## CRITICAL : Index a consulter AVANT toute modification

- Pages, routes, formulaires LinkMe : @docs/current/INDEX-LINKME-COMPLET.md
- Composants et hooks partages : @docs/current/INDEX-COMPOSANTS-FORMULAIRES.md

## Source de Verite Unique

**TOUJOURS lire en premier** : `docs/current/linkme/GUIDE-COMPLET-LINKME.md`

## Documentation par Tache

| Tache                | Lire AVANT                                                |
| -------------------- | --------------------------------------------------------- |
| Guide complet        | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`             |
| Commissions          | `docs/current/linkme/commission-reference.md`             |
| Commissions/Prix     | `docs/current/linkme/commission-reference.md`             |
| Formulaires commande | `docs/current/linkme/formulaires-commande-comparaison.md` |
| RLS affilies         | `.claude/rules/database/rls-patterns.md` (section LinkMe) |

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

## Documentation Complementaire

- Guide complet : `docs/current/linkme/GUIDE-COMPLET-LINKME.md`
- Commissions : `docs/current/linkme/commission-reference.md`
- Glossaire prix : `docs/current/linkme/GLOSSAIRE-CHAMPS-PRIX.md`
- Formulaires : `docs/current/linkme/formulaires-commande-comparaison.md`
