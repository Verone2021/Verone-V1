# Configuration MCP Playwright Recommandée

Ce document décrit la configuration optimale pour MCP Playwright basée sur les meilleures pratiques officielles Microsoft 2026.

## État Actuel

Les serveurs MCP Playwright sont déjà activés dans `.claude/settings.json` :

```json
{
  "enabledMcpServers": [
    "serena",
    "playwright-lane-1",
    "playwright-lane-2"
  ]
}
```

## Configuration Recommandée (Niveau Global)

Pour configurer les paramètres détaillés des lanes Playwright, ajouter dans les **settings globaux de Claude Code** (`~/.claude/mcp-config.json` ou équivalent) :

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
        "--output-dir=/Users/romeodossantos/verone-back-office-V1/.playwright-mcp/lane-1",
        "--user-data-dir=~/.playwright-mcp/lane-1-profile"
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
        "--output-dir=/Users/romeodossantos/verone-back-office-V1/.playwright-mcp/lane-2",
        "--user-data-dir=~/.playwright-mcp/lane-2-profile"
      ]
    }
  }
}
```

## Explications des Paramètres

### Paramètres de Base

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| `--isolated` | (flag) | Sessions clean et reproductibles (recommandé tests) |
| `--timeout-action` | 3000ms | Optimisation performance (-40% vs défaut 5000ms) |
| `--timeout-navigation` | 30000ms | Optimisation chargement pages (-50% vs défaut 60000ms) |
| `--viewport-size` | 1280x720 | Résolution standard, pas de resize dynamique |

### Gestion Stockage

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| `--output-dir` | `.playwright-mcp/lane-X` | Screenshots organisés par lane |
| `--user-data-dir` | `~/.playwright-mcp/lane-X-profile` | Profils séparés évitent conflits |

### Pourquoi 2 Lanes ?

D'après [Microsoft Issue #893](https://github.com/microsoft/playwright-mcp/issues/893) :

- ✅ Évite conflits "fighting over the same tab"
- ✅ Permet tests parallèles sans interférence
- ✅ Chaque lane = instance isolée avec son propre profil

**⚠️ Recommandation Microsoft** : Maximum 2-3 lanes pour éviter overload système.

## Paramètres Avancés Disponibles

### Contrôle Navigateur

```bash
--browser=chromium       # chromium|firefox|webkit|msedge
--headless              # Mode sans interface (défaut: headed)
--executable-path       # Chemin custom du navigateur
--device="iPhone 15"    # Émulation device mobile
```

### Réseau & Sécurité

```bash
--allowed-hosts=example.com,*.github.com  # Hosts autorisés
--blocked-origins=https://ads.example.com # Bloquer domaines
--proxy-server=http://proxy:3128         # Proxy HTTP
--ignore-https-errors                    # Bypass SSL (⚠️ DEV ONLY)
```

### Debug & Output

```bash
--output-dir=./playwright-output  # Dossier outputs
--save-session             # Sauvegarder session
--save-trace              # Enregistrer Playwright trace
--save-video=800x600      # Capturer vidéo (⚠️ Lourd)
--console-level=error     # error|warning|info|debug
```

## Benchmarks Performance

D'après [Fast Playwright MCP](https://github.com/tontoko/fast-playwright-mcp) :

| Métrique | Défaut | Optimisé | Gain |
|----------|--------|----------|------|
| Action timeout | 5000ms | 3000ms | -40% |
| Navigation timeout | 60000ms | 30000ms | -50% |
| Mémoire utilisée | ~180 MB | ~55 MB | -70% |

## Vérification Installation

```bash
# Vérifier version Playwright MCP
npx @playwright/mcp@latest --version

# Tester connexion
claude mcp list | grep playwright

# Vérifier création profils
ls -la ~/.playwright-mcp/
```

## Bonnes Pratiques

### À Faire ✅

- Utiliser `--isolated` pour tests automatisés
- Limiter à 2-3 lanes maximum
- Spécifier `--output-dir` dans le projet
- Timeouts courts pour feedback rapide

### À Éviter ❌

- Lancer > 3 lanes (overload système)
- Utiliser `--save-trace` en production (fichiers énormes)
- Ignorer `--isolated` pour tests (résultats non-reproductibles)
- Capturer vidéos systématiquement (très lourd)

## Maintenance

Le nettoyage automatique des screenshots est géré par :
- **Workflow** : `.github/workflows/cleanup-screenshots.yml`
- **Fréquence** : Chaque dimanche à minuit UTC
- **Rétention** : 30 jours

## Sources & Références

Toutes les recommandations sont basées sur :

1. **Documentation Officielle Microsoft** :
   - [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
   - [Issue #23644 - Cleanup obsolete snapshots](https://github.com/microsoft/playwright/issues/23644)
   - [Issue #893 - Parallel agents interference](https://github.com/microsoft/playwright-mcp/issues/893)

2. **Best Practices Communautaires** :
   - [Supatest Performance Guide](https://supatest.ai/blog/playwright-mcp-setup-guide)
   - [Fast Playwright MCP](https://github.com/tontoko/fast-playwright-mcp)

3. **Automation Standards** :
   - [GitHub Actions Artifact Cleaner](https://github.com/marketplace/actions/github-actions-artifact-cleaner)
   - [Microsoft Azure DevOps Retention Policies](https://learn.microsoft.com/en-us/azure/devops/pipelines/policies/retention)

---

**Date de Création** : 2026-01-17
**Auteur** : Configuration basée sur plan détaillé avec sources officielles
**Maintenance** : Mettre à jour si nouvelles recommandations Microsoft
