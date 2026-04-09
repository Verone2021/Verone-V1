# Playwright MCP : Guide Complet

## Configuration active (.mcp.json)

`--snapshot-mode none --caps vision` : snapshots DESACTIVES, mode vision (screenshots + coordonnees).

## CRITICAL : ZERO SNAPSHOT

Les snapshots (`browser_snapshot`) sont **DEFINITIVEMENT INTERDITS**.
Raison : crash systematique "Request too large (max 20MB)" qui detruit les conversations.

### Outils INTERDITS

- `browser_snapshot` — **JAMAIS**, quel que soit la page

### Outils AUTORISES

- `browser_take_screenshot` — toujours safe (quelques Ko)
- `browser_click` — interactions
- `browser_fill_form` — formulaires
- `browser_press_key` — clavier
- `browser_select_option` — dropdowns
- `browser_navigate` — navigation
- `browser_console_messages` — debug
- `browser_evaluate` — JS evaluation
- `browser_network_requests` — debug reseau

## Workflow standard (toutes pages)

1. `browser_navigate` vers la page
2. `browser_take_screenshot` pour voir la page
3. Interagir via `browser_click`/`browser_fill_form`/`browser_press_key`
4. `browser_take_screenshot` pour verifier le resultat
5. `browser_console_messages` pour verifier 0 erreur

## Screenshots : dossier obligatoire

Tous les screenshots dans `.playwright-mcp/screenshots/`
Format : `.playwright-mcp/screenshots/[context]-[description]-[YYYYMMDD].png`

## Lire du texte exact sans snapshot

```javascript
browser_evaluate({ expression: "document.querySelector('#mon-input').value" });
```

## Verification Post-Deploiement

Apres chaque merge staging → main, tester avec Playwright :

| Page              | URL                     | Verifier                             |
| ----------------- | ----------------------- | ------------------------------------ |
| Dashboard         | `/dashboard`            | KPIs charges, pas de NaN             |
| Commandes clients | `/commandes/clients`    | Table chargee, ouvrir 1 modal        |
| Factures/Devis    | `/factures`             | Onglets, montants, PDF               |
| Expeditions       | `/stocks/expeditions`   | Statuts coherents avec les commandes |
| Finance           | `/finance/transactions` | Transactions chargees                |

Console : `browser_console_messages(level: "error")` → 0 erreur toleree.
