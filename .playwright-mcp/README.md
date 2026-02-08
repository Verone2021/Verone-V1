# Playwright MCP - Configuration Screenshots

## Structure

```
.playwright-mcp/
├── README.md                  # Ce fichier
├── profiles/                  # Profils browser (lane-1, lane-2)
└── screenshots/               # OUTPUT DIRECTORY (tous les screenshots ici)
    ├── .gitkeep
    ├── audit-login-page-20260208.png
    └── test-logout-flow.png
```

## Utilisation

### Pattern Correct (OBLIGATOIRE)

```typescript
// Toujours préfixer avec .playwright-mcp/screenshots/
await mcp__playwright-lane-1__browser_take_screenshot({
  filename: ".playwright-mcp/screenshots/mon-test.png"
})
```

### Conventions Nommage

- **Format** : `[context]-[description]-[YYYYMMDD].png`
- **Exemples** :
  - `audit-login-page-20260208.png`
  - `test-order-creation-success.png`
  - `debug-modal-state.png`

## Maintenance

### Nettoyage Automatique

```bash
# Supprimer screenshots > 7 jours
pnpm clean:screenshots
```

### Voir tous les screenshots

```bash
ls -lh .playwright-mcp/screenshots/
```

## Références

- CLAUDE.md section "Règles MCP Playwright"
- Hook validation : `.claude/scripts/validate-playwright-screenshot.sh`
