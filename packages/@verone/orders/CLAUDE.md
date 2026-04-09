# @verone/orders — Commandes (SO + PO)

## Ce package gere les workflows commande, PAS les formulaires d'entites

Les modals de creation/edition d'entites (organisations, contacts) ne doivent PAS etre dans ce package.
Ils doivent etre IMPORTES depuis leur package source de verite :

| Entite       | Importer depuis         | Composant                       |
| ------------ | ----------------------- | ------------------------------- |
| Organisation | `@verone/organisations` | `CustomerOrganisationFormModal` |
| Fournisseur  | `@verone/organisations` | `SupplierFormModal`             |
| Prestataire  | `@verone/organisations` | `PartnerFormModal`              |

## INTERDIT

- Creer un formulaire de creation organisation dans ce package
- Creer un CustomerCreateForm ou CreateOrganisationModal local
- Dupliquer de la logique de creation d'entites — utiliser les hooks de `@verone/organisations`

## Composants legitimes de ce package

- `SalesOrderFormModal` — wizard creation commande client
- `PurchaseOrderFormModal` — formulaire commande fournisseur
- `CreateLinkMeOrderModal` — wizard commande LinkMe
- `CustomerSelector` — selecteur client (utilise les modals importes)
- Tables, filtres, details commande
