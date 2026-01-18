# Configuration MCP Playwright - Verone Back Office

Documentation de la configuration Playwright MCP basée sur les emplacements officiels Claude Code.

---

## Emplacements de Configuration Officiels

### Project Scope (Recommandé)
**Fichier**: `.mcp.json` (racine du projet)
**Usage**: Configuration spécifique au projet, versionnée dans Git
**Activation**: `.claude/settings.json` avec `"enableAllProjectMcpServers": true`

### User/Local Scope
**Fichier**: `~/.claude.json` (home directory)
**Usage**: Configuration globale utilisateur, non versionnée
**Priorité**: Overrides project scope

---

## Configuration Actuelle (Project Scope)

Notre configuration dans `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright-lane-1": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser",
        "chrome",
        "--user-data-dir=.playwright-mcp/profiles/lane-1",
        "--output-dir=.playwright-mcp/output/lane-1"
      ]
    },
    "playwright-lane-2": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser",
        "chrome",
        "--isolated",
        "--output-dir=.playwright-mcp/output/lane-2"
      ]
    }
  }
}
```

### Stratégie des Lanes

| Lane | Type | Profil | Use Case |
|------|------|--------|----------|
| **lane-1** | Persistant | `.playwright-mcp/profiles/lane-1` | Sessions avec login (Vercel Dashboard, Supabase, etc.) |
| **lane-2** | Isolated | Aucun (--isolated) | Tests reproductibles, sessions clean |

**Pourquoi 2 lanes ?**
- Évite les conflits "fighting over the same tab" ([Microsoft Issue #893](https://github.com/microsoft/playwright-mcp/issues/893))
- Permet tests parallèles sans interférence
- Chaque lane = instance navigateur isolée

---

## Activation dans .claude/settings.json

```json
{
  "enableAllProjectMcpServers": true,
  "forceLoginMethod": "claudeai"
}
```

**Note**: `forceLoginMethod` résout le conflit auth token + API key.

---

## Paramètres Disponibles

### Navigateur
```bash
--browser=chromium       # chromium|firefox|webkit|chrome|msedge
--headless              # Mode sans interface (défaut: headed)
--executable-path       # Chemin custom du navigateur
```

### Session & Stockage
```bash
--user-data-dir=<path>  # Profil persistant (cookies, sessions)
--isolated              # Session clean, pas de profil (⚠️ incompatible avec --user-data-dir)
--output-dir=<path>     # Dossier screenshots/traces
```

### Réseau
```bash
--allowed-hosts=example.com,*.github.com  # Hosts autorisés
--blocked-origins=https://ads.example.com # Bloquer domaines
--proxy-server=http://proxy:3128         # Proxy HTTP
```

### Debug
```bash
--save-trace            # Enregistrer Playwright trace (⚠️ Fichiers volumineux)
--save-video=800x600    # Capturer vidéo (⚠️ Très lourd)
--console-level=error   # error|warning|info|debug
```

---

## Bonnes Pratiques

### ✅ À Faire
- Utiliser `.mcp.json` (project scope) pour config versionnée
- Limiter à 2-3 lanes maximum (évite surcharge système)
- Spécifier `--output-dir` dans le projet (`.playwright-mcp/`)
- Garder timeouts par défaut (fiabilité > speed)
- Séparer lane persistante (login) et lane isolated (tests)

### ❌ À Éviter
- Mélanger `--isolated` avec `--user-data-dir` (incompatible)
- Lancer > 3 lanes (overload système)
- Optimiser timeouts agressivement (risque de flakiness)
- Utiliser `--save-trace` systématiquement (fichiers énormes)
- Référencer `~/.claude/mcp-config.json` (n'existe pas officiellement)

---

## Vérification & Debug

### Lister les serveurs MCP actifs
```bash
claude mcp list
```

### Vérifier les profils créés
```bash
ls -la .playwright-mcp/profiles/
ls -la .playwright-mcp/output/
```

### Tester une lane
```bash
# Dans Claude Code, utiliser une commande simple:
# "Navigate to https://example.com using lane-1"
```

---

## Maintenance Screenshots

### Stratégie Actuelle
- **Gitignore**: Tout `.playwright-mcp/*` sauf README
- **Cleanup manuel**: `rm -rf .playwright-mcp/output/*` si besoin
- **Guard CI** (optionnel): Job qui échoue si un PNG est commité

### Workflow GitHub Optionnel
Le workflow `.github/workflows/cleanup-screenshots.yml` peut être utilisé pour cleanup automatique, mais n'est pas requis si gitignore est bien configuré.

---

## Résolution Auth Conflict

Si erreur "Auth conflict: token + API key":

1. Ajouter dans `.claude/settings.json`:
```json
{
  "forceLoginMethod": "claudeai"  // OU "console"
}
```

2. Nettoyer la session:
```bash
claude /logout
claude /login
```

---

## Sources & Références

- [Claude Code MCP Docs](https://docs.claudecode.com/mcp)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Issue #893 - Parallel agents interference](https://github.com/microsoft/playwright-mcp/issues/893)

---

**Date**: 2026-01-18
**Version**: 2.0 (Config officielle alignée avec Claude Code)
