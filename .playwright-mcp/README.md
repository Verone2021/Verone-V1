# Screenshots Playwright MCP

Ce dossier contient des screenshots temporaires générés par MCP Playwright lors des tests et du développement.

## État Actuel

- **Fichiers** : ~176 screenshots PNG
- **Taille** : ~78 MB
- **Dernière maintenance** : 2026-01-17 (nettoyage de 71 MB)

## Convention d'Usage

**NE PAS versionner** les screenshots dans Git (voir `.gitignore` - ligne 90).

### Que Capturer

- ✅ Screenshots de debug pour issues actives
- ✅ Documentation visuelle de bugs critiques
- ✅ Captures de pages du back-office pour référence

### À Éviter

- ❌ Dashboards externes (Vercel, GitHub, Resend, etc.)
- ❌ Sites web externes (maps, sites tiers)
- ❌ Prototypage UI (21st.dev)
- ❌ Variants/Duplicats (zoom, hover, before/after)
- ❌ Tests temporaires déjà résolus

## Nettoyage Automatique

Les screenshots de plus de **30 jours** sont supprimés automatiquement chaque **dimanche à minuit UTC** via GitHub Actions.

Workflow: `.github/workflows/cleanup-screenshots.yml`

## Structure Recommandée

Avec la configuration MCP Playwright optimale :

```
.playwright-mcp/
├── lane-1/           # Outputs de playwright-lane-1
├── lane-2/           # Outputs de playwright-lane-2
├── *.png            # Screenshots temporaires (gitignored)
└── README.md        # Ce fichier (versionné)
```

## Configuration MCP Recommandée

Pour éviter les conflits entre agents parallèles, utiliser 2 lanes isolées :

```json
{
  "mcpServers": {
    "playwright-lane-1": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--isolated",
        "--timeout-action=3000",
        "--timeout-navigation=30000",
        "--viewport-size=1280x720",
        "--output-dir=/path/to/project/.playwright-mcp/lane-1"
      ]
    },
    "playwright-lane-2": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--isolated",
        "--timeout-action=3000",
        "--timeout-navigation=30000",
        "--viewport-size=1280x720",
        "--output-dir=/path/to/project/.playwright-mcp/lane-2"
      ]
    }
  }
}
```

## Bonnes Pratiques

1. **Nommage Descriptif** : `back-office-dashboard.png`, `catalogue-bug-123.png`
2. **Supprimer Après Usage** : Une fois le bug résolu, supprimer la capture
3. **Backup Local** : Si besoin de conserver, déplacer hors du projet
4. **Taille Limite** : Garder le dossier sous 100 MB

## Historique

- **2026-01-17** : Nettoyage initial (149 MB → 78 MB, -71 MB)
  - Supprimé : services externes, 21st.dev, tests temporaires, duplicats
  - Conservé : documentation back-office, captures utiles

## Liens Utiles

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Screenshot Cleanup Issue](https://github.com/microsoft/playwright/issues/23644)
- [Fast Playwright MCP](https://github.com/tontoko/fast-playwright-mcp)
