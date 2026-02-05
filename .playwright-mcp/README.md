# Screenshots Playwright MCP

## État Actuel (2026-02-05)

- **Fichiers** : ~400 screenshots PNG + profiles navigateur
- **Taille totale** : ~158 MB (optimisé depuis 229 MB)
- **Maintenance** : Nettoyage automatique tous les 7 jours

## Structure

```
.playwright-mcp/
├── profiles/           # Profiles navigateur (requis pour tests)
│   ├── lane-1/        # Lane 1 (principale)
│   └── lane-2/        # Lane 2 (parallélisation)
├── page-*.png         # Screenshots horodatés (temporaires)
├── linkme-*.png       # Screenshots LinkMe (documentation)
├── back-office-*.png  # Screenshots Back-Office (documentation)
└── *.pdf              # PDFs de tests (temporaires)
```

## Rétention

### Conservés Indéfiniment

- ✅ **Screenshots documentés** : Noms descriptifs (ex: `linkme-dashboard-after-fix.png`)
- ✅ **Profiles navigateur** : Cache requis pour exécution tests (`profiles/`)
- ✅ **Screenshots bugs** : Documentation issues (ex: `back-office-login-form.png`)

### Nettoyés Automatiquement

- ❌ **Screenshots horodatés** : Supprimés après 7 jours (ex: `page-2026-01-23T15-42-12.png`)
- ❌ **Logs console** : Supprimés immédiatement (régénérables)
- ❌ **PDFs temporaires** : Supprimés immédiatement (noms UUID)
- ❌ **Dossiers imbriqués** : Anomalies supprimées automatiquement

## Nettoyage

### Manuel

```bash
# Exécuter nettoyage manuel
pnpm playwright:cleanup

# Vérifier taille actuelle
du -sh .playwright-mcp
```

### Automatique

Le script `scripts/playwright-cleanup.sh` nettoie automatiquement :
- Logs console (100% temporaires)
- Screenshots horodatés > 7 jours
- PDFs UUID (temporaires)
- Dossiers imbriqués anomaux

### CI/CD

Le workflow GitHub Actions `.github/workflows/cleanup-screenshots.yml` nettoie automatiquement chaque dimanche à 2h du matin (si configuré).

## Conventions de Nommage

### ✅ BON (Noms Descriptifs)

Ces fichiers sont conservés indéfiniment car ils documentent des features/bugs :

```
linkme-dashboard-after-fix.png
back-office-login-form-error.png
catalogue-produits-pagination.png
facture-invoice-layout.png
bubble-facture-template.png
```

### ❌ MAUVAIS (Noms Horodatés)

Ces fichiers sont supprimés après 7 jours (temporaires) :

```
page-2026-01-23T15-42-12.png
page-2026-02-05T11-38-40.png
```

## Recommandation

Lors de la création de screenshots pour documentation :
1. **Utiliser noms descriptifs** : `linkme-bug-LM-001-order-form.png`
2. **Éviter horodatage** : `page-2026-*T*.png` = temporaire
3. **Documenter dans commit** : "Add screenshot for bug LM-001 fix"

## Notes Techniques

- Les profiles navigateur (`profiles/`) **NE DOIVENT PAS** être supprimés (requis tests)
- La structure `.playwright-mcp/.playwright-mcp/` (imbriquée) est une anomalie (legacy)
- Les logs console > 5 MB indiquent potentiellement une boucle infinie dans les tests

## Historique Optimisation

- **2026-02-05** : Nettoyage initial (229 MB → 158 MB, gain 31%)
  - Suppression 165 screenshots horodatés (> 7j)
  - Suppression 4 logs console
  - Suppression 2 PDFs UUID
  - Suppression dossier imbriqué anomal
  - Création script `playwright-cleanup.sh`
