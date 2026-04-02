# Playwright MCP : Mode Hybride Intelligent

## Configuration active (.mcp.json)

`--snapshot-mode incremental` : snapshots legers (diff seulement, pas le DOM complet a chaque fois)

## CRITICAL : Regles d'utilisation hybride

### browser_snapshot — UNIQUEMENT pages legeres

| Page                                  | Snapshot OK ? | Pourquoi          |
| ------------------------------------- | ------------- | ----------------- |
| Login, formulaires                    | OUI           | < 50 elements DOM |
| Modals, dialogs                       | OUI           | Contenu isole     |
| Pages detail (1 entite)               | OUI           | Peu de donnees    |
| Dashboard KPIs (sans tableau expande) | OUI           | Widgets legers    |
| **Tableaux > 50 lignes**              | **NON**       | **Crash 20 Mo**   |
| **Listes non paginées**               | **NON**       | **Crash 20 Mo**   |

### browser_take_screenshot — OBLIGATOIRE pages lourdes

Pages connues comme lourdes (TOUJOURS screenshot, JAMAIS snapshot) :

- `/stocks/mouvements` (300+ lignes)
- `/stocks/ajustements`
- `/stocks/analytics`
- `/finance/transactions` (1000+ lignes)
- `/finance/documents/grand-livre`
- `/finance/documents/recettes`
- `/finance/documents/achats`
- `/finance/documents/tva`
- Toute page avec DataTable non paginee

## CRITICAL : Methode "Screenshot-First" (OBLIGATOIRE)

TOUJOURS commencer par un screenshot. JAMAIS de snapshot en premier appel sur une page.

### Workflow unique (toutes pages)

1. `browser_navigate` vers la page
2. `browser_take_screenshot` IMMEDIATEMENT (toujours safe, quelques Ko)
3. Analyser l'image :
   - Page legere (formulaire, modal, detail, < 50 elements) → `browser_snapshot` autorise pour lire valeurs exactes
   - Page lourde (tableau, liste, dashboard data) → RESTER en screenshot, JAMAIS de snapshot
4. Interagir via `browser_click`/`browser_fill_form`
5. `browser_take_screenshot` pour verifier le resultat
6. `browser_console_messages` pour verifier 0 erreur

### Regle d'or

- Premier contact avec une page = TOUJOURS screenshot
- Snapshot = UNIQUEMENT apres avoir VU que la page est legere
- Si ca crash ENCORE une seule fois → passage definitif en mode `--snapshot-mode none --caps vision`

## Si "Request too large" arrive malgre tout

1. NE PAS retenter le meme appel
2. `browser_take_screenshot` pour voir la page
3. Ajouter la page a la liste des pages lourdes ci-dessus
4. Continuer en mode screenshot uniquement

## Nettoyage periodique

```bash
rm -rf .playwright-mcp/snapshots .playwright-mcp/*.yml .playwright-mcp/*.log
```
