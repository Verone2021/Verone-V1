# PRD — Browser MCP Chrome Extension Configuration

## Contexte & Problème
**Problème** : Les tests Playwright utilisaient Chromium et ouvraient des fenêtres invisibles qui ne permettaient pas de voir les actions de l'agent, causant des bugs et une mauvaise expérience développeur.

**Solution** : Configuration Browser MCP avec extension Chrome native pour contrôle direct du navigateur utilisateur.

## Utilisateurs & Cas d'usage (personas)
- **[Développeur]** : Voir les tests E2E s'exécuter en temps réel dans Chrome
- **[Claude Agent]** : Contrôler Chrome directement sans lancer nouvelles instances
- **[QA/Test]** : Debug visuel des workflows métier en temps réel

## Portée (In) & Non-objectifs (Out)
**In** :
- Extension Chrome "Browser MCP" installée et configurée
- Contrôle direct Chrome sans Chromium
- Tests E2E visibles dans navigateur utilisateur
- Navigation, screenshots, form filling automatisés

**Out** :
- Chromium (jamais utilisé)
- Tests headless invisibles
- Nouveaux instances de navigateur

**Dépendances** : Chrome avec extension Browser MCP installée

## Configuration Technique

### MCP Servers Configuration
```json
// .mcp.json - Playwright MCP avec --extension
"playwright": {
  "command": "npx",
  "args": [
    "-y",
    "@playwright/mcp@latest",
    "--extension"
  ]
}
```

### Chrome Extension
- **Extension** : "Browser MCP" installée dans Chrome
- **Permissions** : Contrôle onglets, navigation, capture screenshots
- **Mode** : Extension active en permanence

## Règles métier clés
- **JAMAIS Chromium** : Seul Chrome est autorisé
- **Mode visible obligatoire** : Toutes actions doivent être visibles
- **Chrome natif** : Utiliser l'instance Chrome de l'utilisateur
- **Extension active** : Browser MCP doit être installée et activée

## Critères d'acceptation (Given/When/Then)

### AC-1 : Configuration Browser MCP
- **Given** : Chrome avec extension Browser MCP installée
- **When** : Claude lance un test ou navigation
- **Then** : Actions s'exécutent dans Chrome visible, pas de Chromium

### AC-2 : Navigation visible
- **Given** : Test E2E lancé via Browser MCP
- **When** : Agent navigue vers /catalogue/categories
- **Then** : Navigation visible dans onglet Chrome, utilisateur peut voir

### AC-3 : CRUD workflow complet
- **Given** : Page categories chargée dans Chrome
- **When** : Agent teste création famille avec image
- **Then** : Formulaire rempli visiblement, upload image visible, résultat affiché

## Avantages Browser MCP vs Playwright MCP

| Aspect | Browser MCP | Playwright MCP |
|--------|-------------|----------------|
| **Performance** | ⚡ Réutilise Chrome existant | 🐌 Lance nouvelle instance |
| **Visibilité** | 👁️ Toujours visible | 👻 Souvent invisible |
| **Debug** | 🔍 Debug temps réel | 📊 Logs post-mortem |
| **Stabilité** | 🛡️ Plus stable | ⚠️ Bugs fenêtres Chromium |
| **UX Développeur** | 😊 Excellent | 😤 Frustrant |

## Métriques de succès
- **Visibilité** : 100% des actions visibles dans Chrome
- **Performance** : Pas de lancement Chromium supplémentaire
- **Stabilité** : 0 bug fenêtre invisible
- **UX** : Développeur peut voir toutes les actions agent

## Contraintes & Risques
- **Chrome requis** : Extension fonctionne uniquement avec Chrome
- **Extension active** : Doit être installée et activée
- **Permissions** : Extension nécessite permissions étendues
- **Compatibilité** : Versions Chrome récentes recommandées

## Plan de tests (unitaire/e2e)

### Tests Chrome Extension
- Vérifier extension installée et active
- Tester navigation basique (localhost:3000)
- Valider capture screenshots
- Tester form filling automatique

### Tests CRUD Vérone
- Navigation /catalogue/categories avec Browser MCP
- Création famille avec image via Browser MCP
- Tests CRUD complets visibles dans Chrome
- Validation persistance données après refresh

### Tests Anti-Chromium
- Vérifier aucune instance Chromium lancée
- Confirmer utilisation Chrome exclusivement
- Valider mode visible obligatoire

## Configuration recommandée

```typescript
// Tests E2E avec Browser MCP prioritaire
test.beforeEach(async ({ page }) => {
  // Navigation via Browser MCP (plus rapide et visible)
  await page.goto('/login')
  // Reste du test...
})
```

## Troubleshooting

### Problème : Extension non détectée
**Solution** : Vérifier extension "Browser MCP" installée et activée dans Chrome

### Problème : Chromium s'ouvre encore
**Solution** : Vérifier configuration `.mcp.json` avec `--extension` flag

### Problème : Actions invisibles
**Solution** : S'assurer Chrome est au premier plan, extension active