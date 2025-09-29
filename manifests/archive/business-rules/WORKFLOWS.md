# WORKFLOWS — États & transitions (présentation)

## Commande (vente)
```mermaid
stateDiagram-v2
  [*] --> BROUILLON
  BROUILLON --> ENVOYEE : submit
  ENVOYEE --> VALIDEE : approve
  VALIDEE --> EXPEDIEE : ship
  EXPEDIEE --> LIVREE : deliver
  VALIDEE --> ANNULEE : cancel
  ENVOYEE --> REFUSEE : reject
```
**Horodatages** : validated_at, shipped_at, delivered_at, cancelled_at

## Facture (vente/achat)
```mermaid
stateDiagram-v2
  [*] --> BROUILLON
  BROUILLON --> EMIS : issue
  EMIS --> PAYE : settle
  EMIS --> ANNULE : void
```
**Horodatages** : issued_at, paid_at, voided_at

## Stock (mouvements)
- Types : IN, OUT, ADJUST, TRANSFER
- Règles : réserve à VALIDEE, décrémente à EXPEDIEE.
