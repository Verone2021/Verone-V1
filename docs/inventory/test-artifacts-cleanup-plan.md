# Phase 3D - Test Artifacts Cleanup Automation

**Date**: 2026-01-20
**Objectif**: Automatiser nettoyage des outputs Playwright/tests (tolerance zero)

## Contexte

**Problème**: Outputs tests s'accumulent localement (screenshots, videos, reports)

**Solution**: Script cleanup + .gitignore robuste + commande package.json

---

## Artifacts à nettoyer

### 1. Playwright outputs (déjà .gitignored)

**Config `playwright.config.ts`**:
```typescript
reporter: [
  ['html', { outputFolder: 'tests/reports/html' }],
  ['json', { outputFile: 'tests/reports/results.json' }],
],

use: {
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

**Dossiers générés**:
- `test-results/` (Playwright default output)
- `tests/reports/html/` (HTML report)
- `tests/reports/results.json` (JSON results)
- `tests/reports/*.mp4` (videos)
- `tests/reports/*.png` (screenshots)
- `playwright-report/` (si run via npx)
- `blob-report/` (si distributed tests)

### 2. Playwright MCP outputs

**Config `.playwright-mcp/`**:
- `*.png` (screenshots MCP)
- `*.jpg`, `*.jpeg` (screenshots)
- `lane-*/**` (multi-lane browser states)
- `profiles/` (browser profiles)

**Déjà .gitignored** (lines 100-107) ✅

### 3. Autres test artifacts

- `.last-run.json` (Playwright cache)
- `coverage/` (Jest coverage)
- `*.trace.zip` (Playwright traces)

---

## État actuel .gitignore

**Lines 70-76** (Playwright):
```gitignore
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/

# Jest coverage
/coverage/
```

**Lines 100-107** (Playwright MCP):
```gitignore
# Playwright MCP Browser screenshots (temporary files)
.playwright-mcp/*.png
.playwright-mcp/*.jpg
.playwright-mcp/*.jpeg
.playwright-mcp/lane-*/**
.playwright-mcp/profiles/

# Keep Playwright MCP documentation
!.playwright-mcp/README.md
```

**Lines 132** (Test reports):
```gitignore
# Project-specific temporary files
/tests/reports/
```

### ✅ État: Bien configuré

Tous les outputs sont déjà .gitignored correctement.

---

## Script cleanup

**Créer**: `scripts/maintenance/clean-test-artifacts.sh`

```bash
#!/bin/bash
# Clean all test artifacts (Playwright, Jest, MCP)
# Usage: npm run clean:test-artifacts

set -e

echo "🧹 Cleaning test artifacts..."

# Playwright outputs
rm -rf test-results/
rm -rf playwright-report/
rm -rf blob-report/
rm -rf tests/reports/
echo "  ✓ Playwright outputs cleaned"

# Playwright MCP screenshots
rm -f .playwright-mcp/*.png
rm -f .playwright-mcp/*.jpg
rm -f .playwright-mcp/*.jpeg
rm -rf .playwright-mcp/lane-*/
rm -rf .playwright-mcp/profiles/
echo "  ✓ Playwright MCP screenshots cleaned"

# Jest coverage
rm -rf coverage/
echo "  ✓ Jest coverage cleaned"

# Other test artifacts
find . -name ".last-run.json" -delete
find . -name "*.trace.zip" -delete
echo "  ✓ Misc test artifacts cleaned"

echo "✅ All test artifacts cleaned successfully"
```

**Permissions**:
```bash
chmod +x scripts/maintenance/clean-test-artifacts.sh
```

---

## Commande package.json

**Ajouter dans `package.json`** (root):

```json
{
  "scripts": {
    "clean:test-artifacts": "bash scripts/maintenance/clean-test-artifacts.sh",
    "clean:all": "npm run clean:test-artifacts && rm -rf .turbo .next node_modules/.cache",
    "test:e2e:clean": "npm run clean:test-artifacts && npm run test:e2e"
  }
}
```

**Usage**:
```bash
npm run clean:test-artifacts  # Nettoyer uniquement test artifacts
npm run clean:all             # Nettoyer tout (tests + build cache)
npm run test:e2e:clean        # Nettoyer puis run tests E2E
```

---

## Vérification Playwright config

**Fichier**: `playwright.config.ts`

**Outputs actuels**:
- ✅ `outputFolder: 'tests/reports/html'` → .gitignored (/tests/reports/)
- ✅ `outputFile: 'tests/reports/results.json'` → .gitignored
- ✅ `trace: 'retain-on-failure'` → .gitignored (test-results/)
- ✅ `screenshot: 'only-on-failure'` → .gitignored
- ✅ `video: 'retain-on-failure'` → .gitignored

**Conclusion**: Config correcte, outputs bien gitignored ✅

---

## Documentation

**Créer**: `tests/README.md` (ou mettre à jour si existe)

Section à ajouter:

```markdown
## Cleanup Test Artifacts

Test outputs (screenshots, videos, reports) are automatically ignored by Git.

To clean up local test artifacts:

\`\`\`bash
# Clean all test artifacts
npm run clean:test-artifacts

# Clean everything (tests + build cache)
npm run clean:all

# Run tests with fresh cleanup
npm run test:e2e:clean
\`\`\`

### Manual cleanup

\`\`\`bash
rm -rf test-results/ playwright-report/ tests/reports/
rm -f .playwright-mcp/*.{png,jpg,jpeg}
rm -rf coverage/
\`\`\`

### What gets cleaned

- `test-results/` - Playwright test results
- `playwright-report/` - HTML reports
- `tests/reports/` - JSON results + videos + screenshots
- `.playwright-mcp/*.png` - MCP browser screenshots
- `coverage/` - Jest coverage reports
- `*.trace.zip` - Playwright traces
```

---

## CI/CD Integration (optionnel)

**GitHub Actions** (`.github/workflows/test.yml`):

```yaml
- name: Clean test artifacts before run
  run: npm run clean:test-artifacts

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test artifacts on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      tests/reports/
    retention-days: 7
```

**Bénéfice**: CI upload artifacts uniquement si tests échouent

---

## Checklist exécution

- [ ] Créer `scripts/maintenance/clean-test-artifacts.sh`
- [ ] Rendre exécutable (`chmod +x`)
- [ ] Ajouter commandes dans `package.json`
- [ ] Tester le script: `npm run clean:test-artifacts`
- [ ] Documenter dans `tests/README.md`
- [ ] Commit: `[NO-TASK] chore: add test artifacts cleanup automation`

---

## Impact

**Bénéfices**:
- ✅ Commande simple pour cleanup
- ✅ Évite accumulation artifacts (GB)
- ✅ CI/CD peut réutiliser
- ✅ Documentation claire

**Risques**:
- Aucun (outputs regenerables)

**Maintenance**:
- Script à run manuellement (ou avant tests si souhaité)
- Pas de cleanup auto (risque suppression pendant debug)
