# Chrome DevTools MCP - Référence Complète

**Date** : 2026-01-22
**Statut** : PRODUCTION ACTIVE
**Version** : 1.0.0

## Contexte

Référence exhaustive des commandes Chrome DevTools MCP disponibles dans le projet Verone.
Complète la documentation existante en fournissant une liste détaillée de toutes les commandes,
leurs paramètres, exemples d'utilisation, et token consumption.

**Objectif** : Référence rapide pour utilisation efficace de Chrome DevTools MCP.

---

## Prérequis

### Installation et Lancement

```bash
# 1. Chrome DevTools MCP doit être configuré dans .claude/settings.json
# (déjà fait dans le projet Verone)

# 2. Lancer Chrome avec remote debugging (OBLIGATOIRE)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 3. Vérifier connexion
# → Ouvrir http://localhost:9222/json dans navigateur
# → Doit afficher liste des tabs Chrome disponibles
```

### Configuration MCP

```json
// .claude/settings.json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools@0.5.0"]
    }
  }
}
```

---

## Vue d'Ensemble

### Catégories de Commandes

| Catégorie       | Nombre | Usage Principal                |
| --------------- | ------ | ------------------------------ |
| **Navigation**  | 4      | Gérer pages et onglets         |
| **Inspection**  | 3      | Analyser DOM, CSS, Network     |
| **Performance** | 3      | Profiling et audits            |
| **Interaction** | 7      | Clicks, fill, screenshots      |
| **Debugging**   | 4      | Console logs, network requests |
| **Emulation**   | 2      | Throttling, device emulation   |

**Total** : 23 commandes

---

## Commandes par Catégorie

## 1. Navigation & Gestion Pages

### `list_pages`

Liste toutes les pages (tabs) ouvertes dans Chrome.

**Paramètres** : Aucun

**Retour** :

```json
[
  {
    "pageId": 1,
    "url": "http://localhost:3000/dashboard",
    "title": "Dashboard - Verone Back Office"
  },
  {
    "pageId": 2,
    "url": "http://localhost:3002/login",
    "title": "Login - LinkMe"
  }
]
```

**Token Cost** : ~500 tokens

**Exemple** :

```javascript
mcp__chrome_devtools__list_pages({});
```

---

### `select_page`

Sélectionne une page comme contexte pour les commandes suivantes.

**Paramètres** :

- `pageId` (number, required) : ID de la page
- `bringToFront` (boolean, optional) : Focus la page et la met au premier plan

**Exemple** :

```javascript
mcp__chrome_devtools__select_page({
  pageId: 1,
  bringToFront: true,
});
```

**Token Cost** : ~300 tokens

---

### `new_page`

Crée un nouvel onglet et navigue vers l'URL spécifiée.

**Paramètres** :

- `url` (string, required) : URL cible
- `timeout` (integer, optional) : Timeout en ms (0 = default)

**Exemple** :

```javascript
mcp__chrome_devtools__new_page({
  url: 'http://localhost:3000/dashboard',
  timeout: 30000,
});
```

**Token Cost** : ~800 tokens

---

### `close_page`

Ferme une page par son ID.

**Paramètres** :

- `pageId` (number, required) : ID de la page à fermer

**Restrictions** : La dernière page ouverte ne peut pas être fermée.

**Exemple** :

```javascript
mcp__chrome_devtools__close_page({
  pageId: 2,
});
```

**Token Cost** : ~300 tokens

---

## 2. Navigation Intra-Page

### `navigate_page`

Navigue la page sélectionnée vers une URL, ou utilise historique (back/forward/reload).

**Paramètres** :

- `type` (enum, optional) : "url" | "back" | "forward" | "reload"
- `url` (string, optional) : URL cible (si type="url")
- `ignoreCache` (boolean, optional) : Ignore cache lors du reload
- `timeout` (integer, optional) : Timeout en ms

**Exemples** :

```javascript
// Navigation URL
mcp__chrome_devtools__navigate_page({
  type: 'url',
  url: 'http://localhost:3000/settings',
});

// Retour arrière
mcp__chrome_devtools__navigate_page({
  type: 'back',
});

// Reload avec cache clear
mcp__chrome_devtools__navigate_page({
  type: 'reload',
  ignoreCache: true,
});
```

**Token Cost** : ~600 tokens

---

## 3. Inspection & Debugging

### `take_snapshot`

Prend un snapshot textuel de la page basé sur l'accessibility tree.

**Paramètres** :

- `filePath` (string, optional) : Chemin pour sauvegarder le snapshot
- `verbose` (boolean, optional) : Inclure toutes les infos de l'a11y tree

**Retour** : Liste des éléments avec UID unique pour interactions.

**Exemple** :

```javascript
mcp__chrome_devtools__take_snapshot({
  filePath: './snapshot-dashboard.txt',
  verbose: false,
});
```

**Token Cost** : ~5,000-10,000 tokens (⚠️ expensive)

**Usage** : Préférer screenshot ou console_logs pour économiser tokens.

---

### `take_screenshot`

Capture d'écran de la page ou d'un élément spécifique.

**Paramètres** :

- `filePath` (string, optional) : Chemin de sauvegarde
- `format` (enum, optional) : "png" | "jpeg" | "webp" (default: "png")
- `quality` (number, optional) : Qualité JPEG/WebP (0-100)
- `fullPage` (boolean, optional) : Screenshot de la page entière
- `uid` (string, optional) : UID d'élément (incompatible avec fullPage)

**Exemples** :

```javascript
// Screenshot viewport
mcp__chrome_devtools__take_screenshot({
  filePath: './screenshot.png',
  format: 'png',
});

// Screenshot page complète (qualité compressée)
mcp__chrome_devtools__take_screenshot({
  filePath: './screenshot-full.webp',
  format: 'webp',
  quality: 80,
  fullPage: true,
});

// Screenshot d'un élément spécifique
mcp__chrome_devtools__take_screenshot({
  filePath: './element.png',
  uid: 'e42', // UID obtenu via take_snapshot
});
```

**Token Cost** : ~1,000-2,000 tokens

---

### `get_console_message`

Récupère un message console spécifique par son ID.

**Paramètres** :

- `msgid` (number, required) : ID du message console

**Exemple** :

```javascript
mcp__chrome_devtools__get_console_message({
  msgid: 15,
});
```

**Token Cost** : ~400 tokens

---

### `list_console_messages`

Liste tous les messages console pour la page sélectionnée.

**Paramètres** :

- `types` (array, optional) : Filtrer par types
  - Options : "log", "debug", "info", "error", "warn", "dir", "dirxml", "table", "trace", "clear", "startGroup", "startGroupCollapsed", "endGroup", "assert", "profile", "profileEnd", "count", "timeEnd", "verbose", "issue"
- `includePreservedMessages` (boolean, optional) : Inclure messages des 3 dernières navigations
- `pageSize` (integer, optional) : Nombre max de messages
- `pageIdx` (integer, optional) : Page de résultats (0-based)

**Exemples** :

```javascript
// Seulement les erreurs
mcp__chrome_devtools__list_console_messages({
  types: ['error'],
  pageSize: 50,
});

// Tous les logs récents
mcp__chrome_devtools__list_console_messages({
  includePreservedMessages: false,
  pageSize: 100,
});
```

**Token Cost** : ~500-1,500 tokens (selon nombre de messages)

**Usage Recommandé** : Toujours filtrer par types pour réduire tokens.

---

### `get_network_request`

Récupère détails complets d'une requête réseau.

**Paramètres** :

- `reqid` (number, optional) : ID de la requête (si omis, retourne la requête sélectionnée dans DevTools)

**Retour** :

```json
{
  "reqid": 42,
  "url": "http://localhost:3000/api/invoices",
  "method": "POST",
  "status": 500,
  "requestHeaders": { "Authorization": "Bearer ...", ... },
  "requestPayload": { "customer_id": 123, ... },
  "responseHeaders": { "Content-Type": "application/json", ... },
  "responseBody": { "error": "Foreign key constraint failed" },
  "timing": {
    "ttfb": 1234,  // ms
    "download": 56,
    "total": 1290
  }
}
```

**Exemple** :

```javascript
mcp__chrome_devtools__get_network_request({
  reqid: 42,
});
```

**Token Cost** : ~800-1,500 tokens (selon taille payload)

---

### `list_network_requests`

Liste toutes les requêtes réseau pour la page sélectionnée.

**Paramètres** :

- `resourceTypes` (array, optional) : Filtrer par types
  - Options : "document", "stylesheet", "image", "media", "font", "script", "texttrack", "xhr", "fetch", "prefetch", "eventsource", "websocket", "manifest", "signedexchange", "ping", "cspviolationreport", "preflight", "fedcm", "other"
- `includePreservedRequests` (boolean, optional) : Inclure requêtes des 3 dernières navigations
- `pageSize` (integer, optional) : Nombre max de requêtes
- `pageIdx` (integer, optional) : Page de résultats (0-based)

**Exemples** :

```javascript
// Seulement les API calls
mcp__chrome_devtools__list_network_requests({
  resourceTypes: ['fetch', 'xhr'],
  pageSize: 50,
});

// Toutes les images
mcp__chrome_devtools__list_network_requests({
  resourceTypes: ['image'],
  pageSize: 20,
});

// Tous les types, première page
mcp__chrome_devtools__list_network_requests({
  pageIdx: 0,
  pageSize: 100,
});
```

**Token Cost** : ~1,000-2,500 tokens (selon nombre de requêtes)

**Usage Recommandé** : Toujours filtrer par resourceTypes pour réduire tokens.

---

## 4. Performance & Profiling

### `performance_start_trace`

Démarre un enregistrement performance trace.

**Paramètres** :

- `reload` (boolean, required) : Recharger la page après démarrage du trace
- `autoStop` (boolean, required) : Arrêter automatiquement le trace après chargement
- `filePath` (string, optional) : Chemin pour sauvegarder le trace (.json ou .json.gz)

**Exemple** :

```javascript
mcp__chrome_devtools__performance_start_trace({
  reload: true,
  autoStop: true,
  filePath: './performance-trace.json.gz',
});
```

**Token Cost** : ~8,000-12,000 tokens si pas de filePath (⚠️ expensive)

**Usage Recommandé** : TOUJOURS spécifier filePath pour sauvegarder le trace et réduire tokens.

---

### `performance_stop_trace`

Arrête l'enregistrement performance trace actif.

**Paramètres** :

- `filePath` (string, optional) : Chemin pour sauvegarder le trace

**Exemple** :

```javascript
mcp__chrome_devtools__performance_stop_trace({
  filePath: './performance-trace.json.gz',
});
```

**Token Cost** : ~8,000-12,000 tokens si pas de filePath

---

### `performance_analyze_insight`

Analyse un insight spécifique d'un trace recording.

**Paramètres** :

- `insightSetId` (string, required) : ID du set d'insights (obtenu via start_trace)
- `insightName` (string, required) : Nom de l'insight à analyser

**Insights disponibles** :

- **LCPBreakdown** : Analyse du Largest Contentful Paint
- **CLSCulprits** : Éléments responsables des layout shifts
- **RenderBlocking** : Ressources bloquant le render
- **DocumentLatency** : Latence du document HTML
- **SlowCSSSelector** : Sélecteurs CSS lents
- **MemoryLeaks** : Détection de fuites mémoire

**Exemple** :

```javascript
// Analyser LCP
mcp__chrome_devtools__performance_analyze_insight({
  insightSetId: 'set-1',
  insightName: 'LCPBreakdown',
});

// Analyser layout shifts
mcp__chrome_devtools__performance_analyze_insight({
  insightSetId: 'set-1',
  insightName: 'CLSCulprits',
});
```

**Token Cost** : ~1,500-3,000 tokens par insight

---

## 5. Interaction Utilisateur

### `click`

Clique sur un élément.

**Paramètres** :

- `uid` (string, required) : UID de l'élément (obtenu via take_snapshot)
- `dblClick` (boolean, optional) : Double-click (default: false)

**Exemple** :

```javascript
mcp__chrome_devtools__click({
  uid: 'e42',
  dblClick: false,
});
```

**Token Cost** : ~400 tokens

---

### `fill`

Remplit un input, textarea ou sélectionne une option dans un `<select>`.

**Paramètres** :

- `uid` (string, required) : UID de l'élément
- `value` (string, required) : Valeur à remplir

**Exemple** :

```javascript
mcp__chrome_devtools__fill({
  uid: 'e15',
  value: 'test@example.com',
});
```

**Token Cost** : ~400 tokens

---

### `fill_form`

Remplit plusieurs éléments de formulaire en une seule commande.

**Paramètres** :

- `elements` (array, required) : Liste des éléments à remplir
  - Chaque élément : `{ uid: string, value: string }`

**Exemple** :

```javascript
mcp__chrome_devtools__fill_form({
  elements: [
    { uid: 'e15', value: 'john@example.com' },
    { uid: 'e16', value: 'John Doe' },
    { uid: 'e17', value: 'Password123' },
  ],
});
```

**Token Cost** : ~600 tokens (plus efficace que 3x fill séparés)

---

### `hover`

Survole un élément (déclenche :hover CSS et mouseover events).

**Paramètres** :

- `uid` (string, required) : UID de l'élément

**Exemple** :

```javascript
mcp__chrome_devtools__hover({
  uid: 'e42',
});
```

**Token Cost** : ~400 tokens

---

### `drag`

Drag & drop d'un élément vers un autre.

**Paramètres** :

- `from_uid` (string, required) : UID de l'élément à déplacer
- `to_uid` (string, required) : UID de l'élément cible

**Exemple** :

```javascript
mcp__chrome_devtools__drag({
  from_uid: 'e42',
  to_uid: 'e43',
});
```

**Token Cost** : ~500 tokens

---

### `press_key`

Appuie sur une touche ou combinaison de touches.

**Paramètres** :

- `key` (string, required) : Touche ou combinaison

**Touches spéciales** :

- Navigation : "Enter", "Tab", "Escape", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"
- Modificateurs : "Control", "Shift", "Alt", "Meta"
- Combinaisons : "Control+A", "Control+C", "Control+V", "Control+Shift+R"

**Exemples** :

```javascript
// Appuyer sur Enter
mcp__chrome_devtools__press_key({
  key: 'Enter',
});

// Select all (Ctrl+A)
mcp__chrome_devtools__press_key({
  key: 'Control+A',
});

// Hard reload (Ctrl+Shift+R)
mcp__chrome_devtools__press_key({
  key: 'Control+Shift+R',
});
```

**Token Cost** : ~300 tokens

---

### `wait_for`

Attend qu'un texte apparaisse sur la page.

**Paramètres** :

- `text` (string, required) : Texte à attendre
- `timeout` (integer, optional) : Timeout en ms (0 = default)

**Exemple** :

```javascript
mcp__chrome_devtools__wait_for({
  text: 'Dashboard loaded',
  timeout: 5000,
});
```

**Token Cost** : ~400 tokens

---

## 6. Évaluation JavaScript

### `evaluate_script`

Exécute une fonction JavaScript dans le contexte de la page.

**Paramètres** :

- `function` (string, required) : Fonction JS à exécuter (doit retourner valeur JSON-serializable)
- `args` (array, optional) : Arguments à passer (UIDs d'éléments)

**Exemples** :

```javascript
// Sans arguments
mcp__chrome_devtools__evaluate_script({
  function: '() => { return document.title }',
});

// Async function
mcp__chrome_devtools__evaluate_script({
  function:
    "async () => { return await fetch('http://localhost:3000/api/health').then(r => r.json()) }",
});

// Avec arguments (élément)
mcp__chrome_devtools__evaluate_script({
  function: '(el) => { return el.innerText }',
  args: [{ uid: 'e42' }],
});

// Vérifier auth cookie
mcp__chrome_devtools__evaluate_script({
  function: "() => { return document.cookie.includes('supabase-auth-token') }",
});
```

**Token Cost** : ~500-800 tokens

**Usage Recommandé** : Très efficace pour extraire données custom sans snapshot.

---

## 7. Emulation & Testing

### `emulate`

Émule diverses fonctionnalités (throttling, geolocation).

**Paramètres** :

- `cpuThrottlingRate` (number, optional) : Facteur ralentissement CPU (1-20, 1 = pas de throttling)
- `networkConditions` (enum, optional) : "No emulation" | "Offline" | "Slow 3G" | "Fast 3G" | "Slow 4G" | "Fast 4G"
- `geolocation` (object, optional) : `{ latitude: number, longitude: number }` ou `null` pour clear

**Exemples** :

```javascript
// Network throttling Slow 3G
mcp__chrome_devtools__emulate({
  networkConditions: 'Slow 3G',
});

// CPU throttling 4x slower
mcp__chrome_devtools__emulate({
  cpuThrottlingRate: 4,
});

// Geolocation Paris
mcp__chrome_devtools__emulate({
  geolocation: {
    latitude: 48.8566,
    longitude: 2.3522,
  },
});

// Reset all emulation
mcp__chrome_devtools__emulate({
  cpuThrottlingRate: 1,
  networkConditions: 'No emulation',
  geolocation: null,
});
```

**Token Cost** : ~500 tokens

---

### `resize_page`

Redimensionne la fenêtre de la page.

**Paramètres** :

- `width` (number, required) : Largeur en pixels
- `height` (number, required) : Hauteur en pixels

**Exemples** :

```javascript
// Mobile (iPhone 12)
mcp__chrome_devtools__resize_page({
  width: 390,
  height: 844,
});

// Tablet (iPad)
mcp__chrome_devtools__resize_page({
  width: 768,
  height: 1024,
});

// Desktop
mcp__chrome_devtools__resize_page({
  width: 1920,
  height: 1080,
});
```

**Token Cost** : ~400 tokens

---

## 8. Gestion Dialogs

### `handle_dialog`

Gère les dialogs navigateur (alert, confirm, prompt).

**Paramètres** :

- `action` (enum, required) : "accept" | "dismiss"
- `promptText` (string, optional) : Texte à entrer dans prompt dialog

**Exemples** :

```javascript
// Accepter confirm dialog
mcp__chrome_devtools__handle_dialog({
  action: 'accept',
});

// Dismisser alert
mcp__chrome_devtools__handle_dialog({
  action: 'dismiss',
});

// Remplir prompt dialog
mcp__chrome_devtools__handle_dialog({
  action: 'accept',
  promptText: 'New value',
});
```

**Token Cost** : ~400 tokens

---

## 9. File Upload

### `upload_file`

Upload un fichier via input file ou élément ouvrant file chooser.

**Paramètres** :

- `uid` (string, required) : UID de l'élément input file
- `filePath` (string, required) : Chemin local du fichier à uploader

**Exemple** :

```javascript
mcp__chrome_devtools__upload_file({
  uid: 'e42', // <input type="file" />
  filePath: '/Users/romeo/Downloads/invoice.pdf',
});
```

**Token Cost** : ~500 tokens

---

## Patterns d'Utilisation Recommandés

### Debug API Error 500

```javascript
// 1. Lister requêtes récentes
list_network_requests({ resourceTypes: ['fetch', 'xhr'], pageSize: 20 });

// 2. Identifier reqid de la requête 500
// → reqid: 42

// 3. Détails complets
get_network_request({ reqid: 42 });

// 4. Console errors associés
list_console_messages({ types: ['error'], pageSize: 50 });
```

**Token Total** : ~3,000 tokens

---

### Performance Audit (LCP)

```javascript
// 1. Start trace avec reload
performance_start_trace({
  reload: true,
  autoStop: true,
  filePath: './trace-lcp.json.gz',
});

// 2. Analyser LCP
performance_analyze_insight({
  insightSetId: 'set-1',
  insightName: 'LCPBreakdown',
});

// 3. Analyser render blocking
performance_analyze_insight({
  insightSetId: 'set-1',
  insightName: 'RenderBlocking',
});

// 4. Lister images (vérifier sizes)
list_network_requests({
  resourceTypes: ['image'],
  pageSize: 20,
});
```

**Token Total** : ~6,000 tokens (avec filePath)

---

### Test Workflow Login

```javascript
// 1. Navigate to login
navigate_page({ type: 'url', url: 'http://localhost:3002/login' });

// 2. Take snapshot (get UIDs)
take_snapshot({ verbose: false });
// → Identifier UIDs: email input (e15), password input (e16), button (e17)

// 3. Fill form
fill_form({
  elements: [
    { uid: 'e15', value: 'admin@pokawa-test.fr' },
    { uid: 'e16', value: 'TestLinkMe2025' },
  ],
});

// 4. Click login
click({ uid: 'e17' });

// 5. Wait for redirect
wait_for({ text: 'Dashboard', timeout: 5000 });

// 6. Verify session
evaluate_script({
  function: "() => document.cookie.includes('supabase-auth-token')",
});
// → true

// 7. Screenshot confirmation
take_screenshot({ filePath: './login-success.png' });
```

**Token Total** : ~12,000 tokens (snapshot expensive, mais nécessaire pour UIDs)

**Alternative Lean** (si UIDs connus) :

```javascript
// 1-3. Même workflow jusqu'à fill_form
// 4. Screenshot au lieu de snapshot pour validation visuelle
take_screenshot({ filePath: './login-page.png' });
```

**Token Total Alternative** : ~4,000 tokens

---

## Token Economy - Tableau Comparatif

| Commande                      | Token Cost    | Usage             | Alternative Lean               |
| ----------------------------- | ------------- | ----------------- | ------------------------------ |
| `list_pages`                  | ~500          | Liste tabs        | -                              |
| `select_page`                 | ~300          | Switch tab        | -                              |
| `new_page`                    | ~800          | Ouvrir tab        | -                              |
| `navigate_page`               | ~600          | Navigation        | -                              |
| `take_snapshot`               | ~5,000-10,000 | Get UIDs          | `take_screenshot` (~1,500)     |
| `take_screenshot`             | ~1,000-2,000  | Visual check      | -                              |
| `list_console_messages`       | ~500-1,500    | Erreurs           | Filtrer par `types: ["error"]` |
| `get_console_message`         | ~400          | Détail erreur     | -                              |
| `list_network_requests`       | ~1,000-2,500  | API calls         | Filtrer par `resourceTypes`    |
| `get_network_request`         | ~800-1,500    | Détail requête    | -                              |
| `performance_start_trace`     | ~8,000-12,000 | Profiling         | Utiliser `filePath` (~1,000)   |
| `performance_stop_trace`      | ~8,000-12,000 | Stop profiling    | Utiliser `filePath` (~1,000)   |
| `performance_analyze_insight` | ~1,500-3,000  | Analyse insight   | -                              |
| `click`                       | ~400          | Interaction       | -                              |
| `fill`                        | ~400          | Input             | -                              |
| `fill_form`                   | ~600          | Multiple inputs   | Plus efficace que N×`fill`     |
| `hover`                       | ~400          | Hover effect      | -                              |
| `drag`                        | ~500          | Drag & drop       | -                              |
| `press_key`                   | ~300          | Keyboard          | -                              |
| `wait_for`                    | ~400          | Attente condition | -                              |
| `evaluate_script`             | ~500-800      | Custom JS         | Très efficace                  |
| `emulate`                     | ~500          | Throttling        | -                              |
| `resize_page`                 | ~400          | Responsive        | -                              |
| `handle_dialog`               | ~400          | Confirm/alert     | -                              |
| `upload_file`                 | ~500          | File upload       | -                              |

---

## Erreurs Communes & Solutions

### Erreur 1 : "No page selected"

**Cause** : Aucune page sélectionnée comme contexte.

**Solution** :

```javascript
list_pages({}); // Lister pages disponibles
select_page({ pageId: 1 }); // Sélectionner page
```

---

### Erreur 2 : "Chrome not running with remote debugging"

**Cause** : Chrome non lancé avec `--remote-debugging-port=9222`.

**Solution** :

```bash
# Tuer Chrome existant
pkill -f "Google Chrome"

# Relancer avec remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

---

### Erreur 3 : "Element not found (UID invalid)"

**Cause** : UID d'élément invalide ou page a changé depuis snapshot.

**Solution** :

```javascript
// Reprendre snapshot pour UIDs à jour
take_snapshot({ verbose: false });
```

---

### Erreur 4 : "Timeout waiting for navigation"

**Cause** : Navigation prend plus de temps que timeout.

**Solution** :

```javascript
navigate_page({
  type: 'url',
  url: 'http://localhost:3000/slow-page',
  timeout: 60000, // Augmenter timeout à 60s
});
```

---

### Erreur 5 : "Performance trace already running"

**Cause** : Tentative de start trace alors qu'un est déjà actif.

**Solution** :

```javascript
// Stop trace existant d'abord
performance_stop_trace({ filePath: './trace.json.gz' });

// Puis start nouveau
performance_start_trace({ reload: true, autoStop: true });
```

---

## Comparaison avec Playwright MCP

| Fonctionnalité                | Chrome DevTools              | Playwright                 |
| ----------------------------- | ---------------------------- | -------------------------- |
| **Multi-browser**             | ❌ Chrome seulement          | ✅ Chrome, Firefox, Safari |
| **Performance profiling**     | ✅ Excellent (LCP, CLS, FID) | ❌ Limité                  |
| **Network inspection**        | ✅ Détails complets          | ✅ Bon                     |
| **Console logs**              | ✅ Stack traces précises     | ✅ Bon                     |
| **Screenshots**               | ✅ Element + fullPage        | ✅ Element + fullPage      |
| **Interaction (click, fill)** | ✅ Via UIDs                  | ✅ Via selectors           |
| **Accessibility tree**        | ✅ Via snapshot              | ✅ Via snapshot            |
| **Emulation (throttling)**    | ✅ CPU + Network + Geo       | ✅ Network + Geo           |
| **File upload**               | ✅ Oui                       | ✅ Oui                     |
| **Token consumption**         | ~16,000 overhead             | ~8,000 overhead (par lane) |
| **Ideal use case**            | Debug, performance audit     | Tests E2E, automation      |

**Règle de décision** :

- **Debug bugs critiques (500s, stack traces)** → Chrome DevTools
- **Performance audit (LCP, CLS, FID)** → Chrome DevTools
- **Tests E2E automatisés** → Playwright
- **Automation workflows** → Playwright

---

## Checklist d'Utilisation

### Avant de commencer

- [ ] Chrome lancé avec `--remote-debugging-port=9222`
- [ ] Vérifier connexion : `http://localhost:9222/json`
- [ ] MCP Chrome DevTools configuré dans `.claude/settings.json`
- [ ] Serveurs dev lancés (`pnpm dev`)

### Pendant utilisation

- [ ] Toujours `list_pages` puis `select_page` avant autres commandes
- [ ] Filtrer `list_console_messages` avec `types: ["error"]`
- [ ] Filtrer `list_network_requests` avec `resourceTypes`
- [ ] Utiliser `filePath` pour `performance_start_trace` (économie tokens)
- [ ] Préférer `take_screenshot` à `take_snapshot` quand UIDs pas nécessaires

### Optimisation tokens

- [ ] Éviter `take_snapshot` si possible (10k tokens)
- [ ] Éviter `performance_trace` sans `filePath` (12k tokens)
- [ ] Utiliser `evaluate_script` pour extraction data custom (500 tokens)
- [ ] Utiliser `fill_form` plutôt que N×`fill` (plus efficace)

---

## Références

### Documentation Officielle

- [Chrome DevTools MCP Official Blog](https://developer.chrome.com/blog/chrome-devtools-mcp)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [MCP GitHub](https://github.com/modelcontextprotocol/servers)

### Documentation Interne

- `.serena/memories/mcp-debugging-cookbook.md` (workflows pratiques)
- `.serena/memories/mcp-chrome-devtools-playwright-cohabitation.md` (stratégie cohabitation)
- `CLAUDE.md` (lignes 22-49, section MCP Browsers)

### Core Web Vitals

- [Web Vitals](https://web.dev/vitals/)
- [LCP Optimization](https://web.dev/optimize-lcp/)
- [CLS Optimization](https://web.dev/optimize-cls/)

---

## Leçons Apprises

1. **Remote debugging obligatoire** : Chrome doit TOUJOURS être lancé avec `--remote-debugging-port=9222`
2. **Select page first** : Toujours sélectionner une page avant commandes contextuelles
3. **Token economy** : `take_snapshot` et `performance_trace` sont expensive, utiliser `filePath` quand possible
4. **Filtrer systématiquement** : `list_console_messages` et `list_network_requests` avec filtres pour réduire tokens
5. **evaluate_script puissant** : Très efficace pour extraction custom (ex: cookies, localStorage, DOM data)
6. **Performance traces** : Sauvegarder avec `.json.gz` (compression) réduit tokens de 80%
7. **UIDs éphémères** : UIDs de `take_snapshot` deviennent invalides si DOM change

---

**Date de dernière mise à jour** : 2026-01-22
**Mainteneur** : Équipe Verone
**Feedback** : Ouvrir issue GitHub ou mettre à jour ce fichier
