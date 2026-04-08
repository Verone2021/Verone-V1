# @verone/customers — DEPRECATED pour les formulaires organisation

## ATTENTION : CustomerFormModal est DEPRECATED

Le formulaire `CustomerFormModal` dans ce package est un DOUBLON de `UnifiedOrganisationForm`
dans `@verone/organisations`. Il sera supprime.

**Utiliser a la place :** `CustomerOrganisationFormModal` depuis `@verone/organisations`

## Ce qui reste valide dans ce package

- Hooks de lecture/recherche clients (`useCustomers`, etc.)
- Composants d'affichage (tables, cartes, badges)
- Logique metier specifique aux clients

## INTERDIT

- Ajouter de nouveaux formulaires de creation/edition organisation ici
- Modifier `CustomerFormModal` — il sera supprime
