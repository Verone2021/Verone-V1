# @verone/organisations — SOURCE DE VERITE Organisations

## Ce package est la source unique pour TOUS les formulaires organisation

Que ce soit un client, un fournisseur ou un prestataire : le composant de creation/edition
est ICI et NULLE PART AILLEURS.

## Composants principaux

| Composant                        | Role                     | Utilise par                                    |
| -------------------------------- | ------------------------ | ---------------------------------------------- |
| `UnifiedOrganisationForm`        | Formulaire base          | Tous les wrappers ci-dessous                   |
| `SupplierFormModal`              | Wrapper fournisseur      | `/contacts-organisations/suppliers`, PO form   |
| `PartnerFormModal`               | Wrapper prestataire      | `/contacts-organisations/partners`             |
| `CustomerOrganisationFormModal`  | Wrapper client pro       | `/contacts-organisations/customers`, commandes |
| `OrganisationSelectorModal`      | Selecteur (pas creation) | Enseignes detail page                          |
| `ConfirmDeleteOrganisationModal` | Confirmation suppression | Toutes les pages org                           |

## INTERDIT

- Creer un formulaire organisation dans un autre package (`@verone/orders`, `@verone/customers`, `apps/`)
- Dupliquer `UnifiedOrganisationForm` — si un champ manque, l'AJOUTER ici
- Creer un formulaire inline/simplifie pour "gagner du temps" — ouvrir le modal complet

## Pour ajouter un nouveau type d'organisation

1. Creer un wrapper `XxxFormModal.tsx` dans `src/components/forms/`
2. Pattern : copier `SupplierFormModal.tsx`, changer `organisationType` et titre
3. Ajouter l'export dans `src/components/forms/index.ts`
4. Mettre a jour `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`
