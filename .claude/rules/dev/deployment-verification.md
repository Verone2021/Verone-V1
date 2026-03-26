# Vérification Post-Déploiement

## Après chaque merge staging → main

### Pages à tester (Playwright MCP)

| Page              | URL                     | Vérifier                             |
| ----------------- | ----------------------- | ------------------------------------ |
| Dashboard         | `/dashboard`            | KPIs chargés, pas de NaN             |
| Commandes clients | `/commandes/clients`    | Table chargée, ouvrir 1 modal        |
| Factures/Devis    | `/factures`             | Onglets, montants, PDF               |
| Expéditions       | `/stocks/expeditions`   | Statuts cohérents avec les commandes |
| Consultations     | `/consultations`        | Liste + détail si données existent   |
| Finance           | `/finance/transactions` | Transactions chargées                |

### Console

Après chaque page : `browser_console_messages(level: "error")` → 0 erreur tolérée.

### Inputs numériques

Tester 1 champ `type="number"` (ex: ajustement stock, marge sélection) → pas de NaN.

### Encodage

Vérifier visuellement : pas de `\u00e9` dans les modals/formulaires.
