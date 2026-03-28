# LinkMe Expert — Memoire Persistante

## Patterns decouverts

- Formulaire actif = `orders/steps/`, PAS `order-form/`
- 2 types commissions : Verone (marge variable 0-15%) + affilie
- Prix verrouilles a la creation de commande (price locking)
- Canal = "linkme" (jamais "affilie" ou "affiliate")

## Bugs recurrents

- Contacts auto-copies depuis Responsable (defaults schema)
- Logo organisation non herite (double URL getPublicUrl)
- returnUrl manquant sur bouton Modifier organisation

## Decisions architecturales

- Isolation RLS stricte : enseigne_id XOR organisation_id
- Middleware self-contained (pas d'imports workspace — Edge Runtime)
- Selections publiques = coeur du revenu
