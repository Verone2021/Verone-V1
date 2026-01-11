# MCP Playwright Browser - Bonnes Pratiques (2025-12-15)

## Problème Résolu : Réponses MCP de 25000+ tokens

### Sources du Problème

1. **Logs DEBUG excessifs** : `logger.debug()` pour chaque produit (50+ par page)
2. **Screenshots obsolètes** : Accumulation dans `.playwright-mcp/`
3. **`browser_console_messages()`** : Retourne TOUS les logs sans filtre

### Solutions Appliquées

#### 1. Filtre de Niveau de Log (logger.ts)

```typescript
// Par défaut : 'info' en dev (ignore debug), 'warn' en prod
this.minLevel =
  process.env.LOG_LEVEL ||
  (this.environment === 'production' ? 'warn' : 'info');
```

**Niveaux disponibles** : debug < info < warn < error < fatal

**Pour activer DEBUG** : `LOG_LEVEL=debug npm run dev`

#### 2. Nettoyage Régulier .playwright-mcp/

```bash
# Garder seulement les screenshots récents (< 1 jour)
find .playwright-mcp/ -type f -mtime +1 -delete
```

#### 3. Utiliser `onlyErrors: true` pour vérifications rapides

```typescript
// Éviter
browser_console_messages(); // 25000+ tokens potentiels

// Préférer
browser_console_messages({ onlyErrors: true }); // Seulement les erreurs
```

### Commandes MCP Playwright Optimisées

| Action                   | Commande                                                        |
| ------------------------ | --------------------------------------------------------------- |
| Vérifier erreurs console | `browser_console_messages({ onlyErrors: true })`                |
| Screenshot rapide        | `browser_take_screenshot({ filename: "nom.png" })`              |
| Snapshot UI              | `browser_snapshot()` (préférer au screenshot pour interactions) |

### Fichiers Modifiés

- `packages/@verone/utils/src/logger.ts` : Ajout filtre niveau LOG_LEVEL
- `.playwright-mcp/` : Nettoyé (7.2M → 216KB)

### Configuration

- `.gitignore` : `.playwright-mcp/` déjà ignoré (ligne 87)
