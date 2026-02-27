# Finance v2 - Validation Checklist

**URL**: `http://localhost:3000/finance/transactions?v2=true`

## Tests manuels (3 actions)

- [ ] **Ouvrir side panel**: Clic sur une transaction → panel s'ouvre a droite
- [ ] **Ouvrir modal classification**: Bouton "Classer PCG" → modal avec categories
- [ ] **Classer une transaction**: Selectionner categorie + Classifier → toast succes

## Criteres de validation

- [ ] KPIs coherents (total = somme des autres statuts)
- [ ] 0 erreurs console (DevTools > Console, filtrer "error")
- [ ] Table affiche les transactions
- [ ] Bouton "Revenir a l'ancienne version" fonctionne

**GO Phase B** = tous les items coches.
