# Playwright MCP

## REGLES IMPERATIVES

- Ne JAMAIS utiliser `browser_snapshot` — crash "Request too large (max 20MB)"
- Ne JAMAIS utiliser `browser_resize` pour élargir au-delà du viewport de référence (1440×900). Le viewport est defini dans `.mcp.json` pour garder une captation cohérente entre les sessions. Si un élément est hors viewport, scroller avec `browser_press_key("PageDown")` ou cliquer directement via ref (Playwright scroll automatiquement). Régression vue le 2026-04-24 : un `browser_resize(1920, 1080)` avait généré des screenshots tronqués dans `.playwright-mcp/screenshots/`.
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

## TESTS E2E AUTOMATISES

### Structure

```
tests/                          # Dossier racine tests
  e2e/                          # Tests end-to-end
    *.spec.ts                   # Fichiers de test
playwright.config.ts            # Config Playwright (racine)
packages/e2e-linkme/            # Tests E2E LinkMe (separes)
```

### Conventions

- 1 parcours long = 1 fichier `.spec.ts`
- Nommage : `{module}-{workflow}.spec.ts` (ex: `stocks-expedition.spec.ts`)
- Auth partagee via `storageState` (pas de login dans chaque test)
- Helpers partages dans `tests/` (auth, navigation)

### Regles

- TOUJOURS verifier `browser_console_messages(level: "error")` → 0 erreur
- TOUJOURS tester les modals/wizards : ouverture + fermeture Escape + soumission
- TOUJOURS tester avec le bon role (owner pour /admin/\*, sales pour le reste)
- Ne JAMAIS modifier de donnees en production pendant les tests
- Timeout : 30s par test, 2 retries en CI, 0 localement
- Workers : 1 (pour coherence des donnees)

### Lancer les tests

```bash
# Tous les tests
npx playwright test

# Un fichier specifique
npx playwright test tests/e2e/stocks-expedition.spec.ts

# Mode debug (UI visible)
npx playwright test --headed --debug

# Generer le rapport HTML
npx playwright show-report
```

### Checklist des pages a tester

Voir `docs/current/TESTS-CHECKLIST-PAGES.md` pour la liste complete
classee par priorite (P0/P1/P2/P3).
