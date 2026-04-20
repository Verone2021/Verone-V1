# Playwright — Artefacts et Screenshots

**Source de vérité** pour organiser les sorties Playwright (MCP runtime + tests
automatisés E2E). À lire avant de capturer un screenshot, lire un log, ou
ajouter un pattern `.gitignore` lié à Playwright.

Complète `.claude/rules/playwright.md` (usage du MCP) — ce fichier-ci traite
uniquement du **rangement** et du **cycle de vie** des fichiers produits.

---

## Principe : séparer baseline versionné et runtime éphémère

Règle absolue : les artefacts temporaires (screenshots de debug, logs, dumps
réseau, rapports HTML) **ne doivent jamais être commités**. Les baselines
Playwright (captures de référence pour visual regression) sont **les seules
images versionnées**, et elles vivent à un endroit unique.

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

---

## Convention de nommage (MCP runtime)

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

**INTERDIT** : capturer un screenshot à la racine du repo, dans `apps/`, ou dans
tout autre dossier hors `.playwright-mcp/screenshots/` ou `docs/scratchpad/`.

---

## Patterns `.gitignore` en place

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

Si un nouveau besoin émerge (vidéos, traces zip, exports JSON de tests), ajouter
la règle **dans ce fichier avant de modifier `.gitignore`**.

---

## Anti-patterns interdits

- Capturer un screenshot sans le préfixer par `.playwright-mcp/screenshots/YYYYMMDD/`
- Commiter un `.log`, `.webm`, `.trace`, `.zip` de test
- Stocker un secret (OAuth, clé API, token) dans `.playwright-mcp/` (même si gitignored, il traîne sur disque)
- Laisser `test-results/` grossir indéfiniment localement (vider manuellement ou via le script de nettoyage)
- Créer un dossier de screenshots parallèle (`screenshots/`, `captures/`, `debug/`) hors de l'arborescence officielle

---

## Config `playwright.config.ts` — règles d'output

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

- `screenshot: 'only-on-failure'` : ne capture **que** sur échec. Un green run ne laisse aucun artefact.
- `trace: 'on-first-retry'` : trace Zip uniquement si retry. Coût disque maîtrisé.
- `video: 'retain-on-failure'` : vidéo conservée seulement en cas d'échec.

**Ne pas** activer `screenshot: 'on'` ou `video: 'on'` en continu — explosion disque garantie.

---

## Nettoyage périodique

Quand la taille de `.playwright-mcp/` dépasse 100 MB ou 1000 fichiers,
exécuter manuellement :

```bash
# Supprime screenshots > 7 jours et logs > 1 jour
find .playwright-mcp/screenshots -type f -mtime +7 -delete 2>/dev/null
find .playwright-mcp -maxdepth 1 -type f \( -name "*.log" -o -name "*.yml" \) -mtime +1 -delete 2>/dev/null
# Purge test-results et playwright-report (toujours éphémères)
rm -rf test-results/ playwright-report/
```

Ce nettoyage ne touche **aucun fichier versionné** (grâce aux exceptions
`.gitignore` ci-dessus).

---

## En cas de doute

1. Un fichier est-il dans un dossier marqué ❌ Non (table ci-dessus) ? Il **ne doit pas** être commité.
2. Un fichier dans `.playwright-mcp/` contient-il un secret ? Le **supprimer immédiatement** et alerter Romeo pour révocation du secret côté fournisseur.
3. Un screenshot doit-il être versionné pour documentation ? Le déplacer dans `docs/scratchpad/` avec nommage explicite.

Référence complémentaire : `.claude/rules/playwright.md` (usage MCP) et la
documentation officielle Playwright (https://playwright.dev/docs/api/class-testconfig).
