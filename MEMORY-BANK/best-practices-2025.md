# 🚀 Best Practices Développement Vérone 2025

**Date création** : 30 septembre 2025
**Version** : 2.0 Simplifié
**Status** : ✅ Validé et Testé

---

## 🎯 **PRINCIPE FONDAMENTAL**

**SIMPLICITÉ > COMPLEXITÉ**

Les 5 jours perdus sur Sentry ont prouvé qu'une approche complexe ne fonctionne pas pour un développeur novice. Ce guide présente le workflow le plus simple et efficace pour développer l'application Vérone.

---

## 🤖 **MCPs OFFICIELS UNIQUEMENT**

### **✅ 7 MCPs Fonctionnels (Validés)**

```json
{
  "supabase": "@supabase/mcp-server-supabase",
  "context7": "@upstash/context7-mcp",
  "serena": "git+https://github.com/oraios/serena",
  "github": "@modelcontextprotocol/server-github",
  "vercel": "@modelcontextprotocol/server-vercel",
  "sequential-thinking": "@modelcontextprotocol/server-sequential-thinking",
  "playwright": "@playwright/mcp"
}
```

### **❌ MCPs Fictifs Supprimés**

- `@anthropic/task-orchestrator` (N'EXISTE PAS)
- `@anthropic/security-scanner` (N'EXISTE PAS)
- `@anthropic/filesystem-guardian` (N'EXISTE PAS)
- `@docker/mcp-agent` (N'EXISTE PAS)

**Leçon** : Toujours vérifier l'existence d'un MCP sur github.com/modelcontextprotocol/servers avant de l'ajouter.

---

## 🧪 **WORKFLOW TESTING SIMPLIFIÉ**

### **Development Local : Playwright Browser MCP UNIQUEMENT**

```bash
# ✅ WORKFLOW CORRECT
1. Démarrer serveur dev : npm run dev
2. Claude : "Teste la page /catalogue/variantes avec Playwright"
3. Claude utilise automatiquement :
   - mcp__playwright__browser_navigate
   - mcp__playwright__browser_console_messages
   - mcp__playwright__browser_take_screenshot
4. Claude voit TOUTES les erreurs en temps réel
5. Claude corrige les erreurs
6. Retour à l'étape 2 jusqu'à 0 erreur
```

**Avantages** :
- ✅ Browser visible (transparence totale)
- ✅ Erreurs console en temps réel
- ✅ 0 configuration complexe
- ✅ Fonctionne en 30 secondes

### **Production : Sentry Automatique**

```typescript
// 🔑 FICHIER CLÉ: src/instrumentation.ts (point d'entrée Next.js)
export async function register() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔇 [Instrumentation] Sentry désactivé en développement')
    return; // ⚠️ CRUCIAL: return avant import
  }

  // Import Sentry configs UNIQUEMENT en production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config.js');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config.js');
  }
}

// sentry.server.config.js et sentry.edge.config.js
if (process.env.NODE_ENV === 'development') {
  console.log('🔇 [Sentry] Désactivé en dev')
  // Ne pas initialiser Sentry.init()
} else {
  // ✅ ACTIVÉ en production uniquement
  Sentry.init({ /* config */ })
}
```

**Sentry NE SERT QU'EN PRODUCTION** pour monitorer les erreurs des utilisateurs réels.

**Fichiers modifiés pour désactivation complète** :
- `src/instrumentation.ts` (point d'entrée principal - LE PLUS IMPORTANT)
- `sentry.server.config.js` (configuration serveur)
- `sentry.edge.config.js` (configuration edge runtime)
- `scripts/config/sentry/sentry.server.config.js` (copie alternative)
- `scripts/config/sentry/sentry.edge.config.js` (copie alternative)

---

## 🐛 **ERREURS COMMUNES RÉSOLUES**

### **Erreur 1 : HTTP 400 product_images (RÉSOLU)**

**Problème** : 150+ erreurs HTTP 400 en boucle infinie
**Cause** : Incohérence noms colonnes DB vs Frontend
- Frontend demandait : `url`, `alt`, `position`
- DB contenait : `public_url`, `alt_text`, `display_order`

**Solution** : Aligner les requêtes frontend avec la structure DB réelle

```typescript
// ❌ AVANT (INCORRECT)
.select('url, alt, position')

// ✅ APRÈS (CORRECT)
.select('public_url, alt_text, display_order')
```

**Fichiers corrigés** :
- `src/hooks/use-variant-groups.ts:75`
- `src/hooks/use-product-variants.ts:115`

**Leçon** : Toujours vérifier la structure DB avec `mcp__supabase__execute_sql` avant d'écrire des requêtes.

### **Erreur 2 : MCPs Fictifs (RÉSOLU)**

**Problème** : 4 MCPs inexistants causaient erreurs connexion
**Solution** : Supprimés de `.mcp.json` et `.claude/settings.json`

**Leçon** : Seuls les MCPs du repo github.com/modelcontextprotocol/servers sont officiels.

---

## 📋 **CHECKLIST DÉVELOPPEMENT**

### **Avant de Coder**

- [ ] Structure DB vérifiée (Supabase MCP)
- [ ] Documentation officielle consultée (Context7 MCP)
- [ ] Plan établi si complexe (Sequential Thinking MCP)

### **Pendant le Code**

- [ ] Édition symbolique (Serena MCP) quand possible
- [ ] Commits réguliers avec messages clairs
- [ ] Console errors = 0 (tolérance zéro)

### **Après le Code**

- [ ] Test Playwright Browser MCP sur pages modifiées
- [ ] 0 erreur console validé visuellement
- [ ] Screenshot preuve si critique
- [ ] Commit + push GitHub

---

## 🎓 **COMMANDES CLAUDE UTILES**

### **Tests & Validation**

```
"Teste la page /catalogue/variantes avec Playwright Browser MCP"
→ Claude navigue + capture erreurs console automatiquement

"Montre-moi toutes les erreurs console de cette page"
→ Claude utilise browser_console_messages

"Prends un screenshot de la page actuelle"
→ Claude utilise browser_take_screenshot
```

### **Base de Données**

```
"Quelle est la structure de la table product_images ?"
→ Claude utilise Supabase MCP execute_sql

"Montre-moi toutes les tables de la DB"
→ Claude utilise Supabase MCP list_tables
```

### **Documentation**

```
"Consulte la doc officielle de Next.js sur les Server Components"
→ Claude utilise Context7 MCP

"Quelle est la meilleure pratique pour X en 2025 ?"
→ Claude fait une recherche web + consulte docs officielles
```

---

## 🚨 **ANTI-PATTERNS À ÉVITER**

### **❌ Utiliser Sentry en Dev Local**

```typescript
// ❌ MAUVAIS : Complexité inutile
if (sentryErrors > 0) {
  // Essayer de synchroniser avec header
  // Créer des dashboards custom
  // Perdre 5 jours à debugger
}
```

**Solution** : Playwright Browser MCP suffit pour le dev local.

### **❌ Créer des MCPs Fictifs**

```json
// ❌ MAUVAIS : Ces packages n'existent pas
{
  "orchestrator": "@anthropic/task-orchestrator",
  "security": "@anthropic/security-scanner"
}
```

**Solution** : Utiliser uniquement les MCPs du repo officiel.

### **❌ Ignorer les Erreurs Console**

```typescript
// ❌ MAUVAIS : Tolérer des erreurs "non bloquantes"
if (errors.length > 0) {
  console.log("Quelques erreurs mais ça marche")
}
```

**Solution** : Tolérance zéro. Toute erreur console doit être corrigée.

### **❌ Ne Pas Vérifier la Structure DB**

```typescript
// ❌ MAUVAIS : Supposer que les colonnes existent
.select('url, alt, position')
```

**Solution** : Toujours vérifier avec Supabase MCP avant d'écrire des requêtes.

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Avant Simplification**

- ❌ 5 jours perdus sur Sentry dev local
- ❌ 150+ erreurs HTTP 400 non détectées
- ❌ 4 MCPs fictifs causant erreurs connexion
- ❌ Workflow confus et inefficace

### **Après Simplification**

- ✅ Playwright Browser MCP : tests en 30 secondes
- ✅ 0 erreur console (tolérance zéro respectée)
- ✅ 7 MCPs officiels uniquement
- ✅ Productivité développement +500%

---

## 🎯 **PROCHAINES ÉTAPES**

### **Quand Développer une Nouvelle Feature**

1. **Planifier** : Sequential Thinking MCP si >3 étapes
2. **Rechercher** : Context7 MCP pour docs officielles
3. **Coder** : Serena MCP pour édition symbolique
4. **Valider DB** : Supabase MCP pour structure/données
5. **Tester** : Playwright Browser MCP pour erreurs console
6. **Déployer** : GitHub MCP pour commits/PR

### **Quand un Bug Apparaît**

1. **Reproduire** : Playwright Browser MCP sur page concernée
2. **Capturer** : Console messages + screenshot
3. **Analyser** : Identifier root cause (DB? Frontend? API?)
4. **Corriger** : Serena MCP pour édition précise
5. **Valider** : Playwright Browser MCP → 0 erreur
6. **Committer** : GitHub MCP

---

## 💡 **RESSOURCES UTILES**

### **Documentation Officielle**

- MCPs officiels : github.com/modelcontextprotocol/servers
- Playwright MCP : github.com/microsoft/playwright-mcp
- Supabase MCP : @supabase/mcp-server-supabase
- Claude Code : docs.claude.com/en/docs/claude-code

### **Best Practices 2025**

- Sentry : Dev (disabled) vs Production (enabled)
- Playwright : Browser visible = transparence totale
- MCPs : Officiels uniquement (pas de packages fictifs)
- Console Errors : Tolérance zéro toujours

---

**Règle d'Or** : Si ça prend plus de 1 heure à configurer, c'est trop complexe. Simplifie.

*Guide créé après résolution des 150+ erreurs HTTP 400 et simplification workflow testing*