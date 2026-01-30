# Archive MCP Chrome DevTools

**Date suppression**: 2026-01-30
**Raison**: MCP jamais utilisé, processus orphelins, conflit avec Playwright

## Réinstallation Si Besoin

```bash
# Dans .claude/settings.json, ajouter:
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools@0.5.0"]
    }
  }
}

# Lancer Chrome remote debugging:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```
