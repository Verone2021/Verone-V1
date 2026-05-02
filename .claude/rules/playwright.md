# Playwright MCP + Artefacts

**Source de vérité unique** pour Playwright : usage du MCP, tests E2E
automatisés, rangement des artefacts (screenshots, logs, rapports). À lire
avant toute capture, exécution de test, ou modification de pattern
`.gitignore` lié à Playwright.

> Fusionne l'ancien `playwright-artifacts.md` (supprimé `[INFRA-LEAN-001]`).

---

## REGLES IMPERATIVES

- Ne JAMAIS utiliser `browser_snapshot` — crash "Request too large (max 20MB)"
- Ne JAMAIS utiliser `browser_resize` pour élargir au-delà du viewport de référence (1440×900). Le viewport est defini dans `.mcp.json` pour garder une captation cohérente entre les sessions. Si un élément est hors viewport, scroller avec `browser_press_key("PageDown")` ou cliquer directement via ref (Playwright scroll automatiquement). Régression vue le 2026-04-24 : un `browser_resize(1920, 1080)` avait généré des screenshots tronqués dans `.playwright-mcp/screenshots/`.
- TOUJOURS sauvegarder les screenshots dans `.playwright-mcp/screenshots/YYYYMMDD/`
- TOUJOURS nommer : `.playwright-mcp/screenshots/YYYYMMDD/[context]-[description]-[HHmmss].png`
- INTERDIT : capturer un screenshot à la racine du repo, dans `apps/`, ou dans tout autre dossier hors `.playwright-mcp/screenshots/` ou `docs/scratchpad/`.

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

---

## Artefacts — rangement et cycle de vie

Principe : séparer baseline versionné et runtime éphémère. Les artefacts
temporaires (screenshots de debug, logs, dumps réseau, rapports HTML) **ne
doivent jamais être commités**. Les baselines Playwright (visual regression)
sont les seules images versionnées, et elles vivent à un endroit unique.

| Type d'artefact                    | Emplacement                             | Versionné ? | Durée de vie         |
| ---------------------------------- | --------------------------------------- | ----------- | -------------------- |
| Baseline visual regression         | `tests/__snapshots__/…`                 | ✅ Oui      | Permanent            |
| Test results (traces, fails CI)    | `test-results/`                         | ❌ Non      | Jusqu'au run suivant |
| Rapport HTML Playwright            | `playwright-report/`                    | ❌ Non      | Jusqu'au run suivant |
| Blob report (CI sharded)           | `blob-report/`                          | ❌ Non      | Mergé puis supprimé  |
| Screenshots MCP runtime            | `.playwright-mcp/screenshots/YYYYMMDD/` | ❌ Non      | Nettoyage 7 jours    |
| Logs console MCP                   | `.playwright-mcp/console-*.log`         | ❌ Non      | Nettoyage 1 jour     |
| Screenshots documentation (stitch) | `docs/scratchpad/stitch/`               | ✅ Oui      | Permanent (design)   |
| Assets produit (logos, icônes)     | `apps/*/public/`, `docs/assets/`        | ✅ Oui      | Permanent            |

### Convention de nommage MCP runtime

Format obligatoire pour tout screenshot capturé via `browser_take_screenshot` :

```
.playwright-mcp/screenshots/YYYYMMDD/[context]-[description]-[HHmmss].png
```

Exemples :

```
.playwright-mcp/screenshots/20260420/packlink-step4-empty-145230.png
.playwright-mcp/screenshots/20260420/factures-list-mobile-375-091530.png
.playwright-mcp/screenshots/20260420/inventory-alert-desktop-1440-161022.png
```

Composants :

- `YYYYMMDD` : date de la session (dossier de regroupement)
- `[context]` : feature ou page concernée (kebab-case, sans slash)
- `[description]` : état ou action capturée (breakpoint si pertinent)
- `[HHmmss]` : heure locale pour unicité et tri

### Patterns `.gitignore` en place

Déjà configurés (ne pas dupliquer) :

```gitignore
# Test artefacts éphémères
/test-results/
/playwright-report/
/playwright/.cache/
.claude/playwright-profiles/

# Playwright MCP (runtime dev, lanes Chrome persistantes)
.playwright-mcp/**
!.playwright-mcp/README.md
!.playwright-mcp/screenshots/.gitkeep

# Screenshots racine (toujours temporaires)
/*.png
# Exceptions : assets documentés et assets apps
!docs/**/*.png
!apps/**/public/**/*.png
```

Si un nouveau besoin émerge (vidéos, traces zip, exports JSON de tests),
ajouter la règle **dans ce fichier avant de modifier `.gitignore`**.

### Config `playwright.config.ts` — règles d'output

Les chemins suivants doivent rester **dans** le repo mais **ignorés par git** :

```ts
{
  testDir: './tests/e2e',
  outputDir: './test-results',           // traces, videos, fails
  snapshotDir: './tests/__snapshots__',  // baselines visual regression versionnées
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
}
```

- `screenshot: 'only-on-failure'` : un green run ne laisse aucun artefact.
- `trace: 'on-first-retry'` : trace Zip uniquement si retry. Coût disque maîtrisé.
- `video: 'retain-on-failure'` : vidéo conservée seulement en cas d'échec.

**Ne pas** activer `screenshot: 'on'` ou `video: 'on'` en continu — explosion disque garantie.

### Anti-patterns artefacts interdits

- Commiter un `.log`, `.webm`, `.trace`, `.zip` de test
- Stocker un secret (OAuth, clé API, token) dans `.playwright-mcp/` (même si gitignored, il traîne sur disque)
- Laisser `test-results/` grossir indéfiniment localement
- Créer un dossier de screenshots parallèle (`screenshots/`, `captures/`, `debug/`) hors de l'arborescence officielle

### Nettoyage périodique

Quand la taille de `.playwright-mcp/` dépasse 100 MB ou 1000 fichiers, exécuter manuellement :

```bash
# Supprime screenshots > 7 jours et logs > 1 jour
find .playwright-mcp/screenshots -type f -mtime +7 -delete 2>/dev/null
find .playwright-mcp -maxdepth 1 -type f \( -name "*.log" -o -name "*.yml" \) -mtime +1 -delete 2>/dev/null
# Purge test-results et playwright-report (toujours éphémères)
rm -rf test-results/ playwright-report/
```

Ce nettoyage ne touche **aucun fichier versionné**.

### En cas de doute artefacts

1. Un fichier est-il dans un dossier marqué ❌ Non (table ci-dessus) ? Il **ne doit pas** être commité.
2. Un fichier dans `.playwright-mcp/` contient-il un secret ? Le **supprimer immédiatement** et alerter Romeo pour révocation du secret côté fournisseur.
3. Un screenshot doit-il être versionné pour documentation ? Le déplacer dans `docs/scratchpad/` avec nommage explicite.

---

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

Voir `docs/current/TESTS-CHECKLIST-PAGES.md` pour la liste complete classee
par priorite (P0/P1/P2/P3).

---

## Référence

- ADR-012 (2026-04-20) : création de l'ancienne règle `playwright-artifacts.md` — fusionnée dans ce fichier en `[INFRA-LEAN-001]` (2026-05-02).
- Documentation officielle Playwright : https://playwright.dev/docs/api/class-testconfig
