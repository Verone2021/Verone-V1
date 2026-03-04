# Regles MCP Playwright (Screenshots)

**OBLIGATOIRE** : Tous les screenshots Playwright doivent etre sauvegardes dans `.playwright-mcp/screenshots/`

## Pattern Standard

```typescript
// INTERDIT (sauvegarde a la racine)
mcp__playwright-lane-1__browser_take_screenshot({
  filename: "audit-login.png"
})

// OBLIGATOIRE (sauvegarde dans dossier dedie)
mcp__playwright-lane-1__browser_take_screenshot({
  filename: ".playwright-mcp/screenshots/audit-login.png"
})
```

## Conventions Nommage

- **Format** : `.playwright-mcp/screenshots/[context]-[description]-[YYYYMMDD].png`
- **Exemples** :
  - `.playwright-mcp/screenshots/audit-login-page-20260208.png`
  - `.playwright-mcp/screenshots/test-logout-flow-success.png`
  - `.playwright-mcp/screenshots/debug-modal-state.png`

## Pourquoi ?

1. **Organisation** : Screenshots groupes, faciles a retrouver
2. **Gitignore** : Patterns `.playwright-mcp/*.png` evitent commits accidentels
3. **Cleanup automatique** : Script `pnpm clean:screenshots` nettoie dossier
4. **Best Practice 2026** : Standard industrie (Playwright, Cypress, Puppeteer)
