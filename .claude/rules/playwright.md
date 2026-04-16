# Playwright MCP

## REGLES IMPERATIVES

- Ne JAMAIS utiliser `browser_snapshot` — crash "Request too large (max 20MB)"
- TOUJOURS sauvegarder les screenshots dans `.playwright-mcp/screenshots/`
- TOUJOURS nommer : `.playwright-mcp/screenshots/[context]-[description]-[YYYYMMDD].png`

## STANDARDS

### Mode actif

`--snapshot-mode none --caps vision` : mode vision uniquement (screenshots + coordonnees).

### Workflow standard

1. `browser_navigate` vers la page
2. `browser_take_screenshot` pour voir
3. Interagir : `browser_click` / `browser_fill_form` / `browser_press_key`
4. `browser_take_screenshot` pour verifier
5. `browser_console_messages` pour 0 erreur

### Lire une valeur precise

```javascript
// Utiliser evaluate au lieu de snapshot
browser_evaluate({ expression: "document.querySelector('#input').value" });
```

### Outils autorises

`browser_take_screenshot`, `browser_click`, `browser_fill_form`, `browser_press_key`,
`browser_select_option`, `browser_navigate`, `browser_console_messages`,
`browser_evaluate`, `browser_network_requests`

### Nettoyage

```bash
rm -rf .playwright-mcp/snapshots .playwright-mcp/*.yml .playwright-mcp/*.log
```
