# 🔍 Approche Monitoring Vérone 2025 (Sans Sentry)

**Date** : 2025-10-26  
**Décision** : Remplacer Sentry par approche Triple-Layer sans dépendances externes  
**Statut** : ✅ Implémenté et documenté

---

## 🎯 Stack Monitoring Actuel

### **1. Console Error Tracker** (`src/lib/monitoring/console-error-tracker.ts`)

**Rôle** : Logging local structuré, capture automatique des erreurs

**Fonctionnalités** :
- Capture `console.error` et `console.warn` automatiquement
- Logs JSON structurés (timestamp, level, message, stack, url, userAgent)
- Envoi optionnel à `/api/logs` (production)
- Compatible MCP Playwright Browser (récupération automatique)
- **Zero dépendances, zero configuration**

**Setup** :
```typescript
// Layout.tsx
const tracker = new ConsoleErrorTracker({ sendToApi: true })
tracker.setup()
```

**Exemple log** :
```typescript
console.error('[VÉRONE:ERROR]', {
  component: 'ProductCatalogue',
  action: 'createProduct',
  error: error.message,
  context: { userId, productData },
  timestamp: new Date().toISOString()
})
```

---

### **2. MCP Playwright Browser** (Testing/Validation)

**Rôle** : Vérification temps réel des console errors

**Workflow OBLIGATOIRE** (CLAUDE.md Phase 3) :
```typescript
1. mcp__playwright__browser_navigate(url)
2. mcp__playwright__browser_console_messages()
3. Si erreurs → STOP → Fix ALL → Re-test
4. Screenshot comme preuve
5. Zero tolerance : 1 erreur = échec complet
```

**Avantages** :
- Validation automatique avant merge
- Détection console errors immédiate
- Screenshots comme preuve
- Compatible avec console-error-tracker.ts

---

### **3. Vercel Observability** (Production)

**Rôle** : Monitoring production natif (inclus dans plan Vercel)

**Fonctionnalités** :
- Error tracking automatique (stack traces)
- Performance monitoring (Core Web Vitals)
- Logs centralisés (stdout/stderr)
- Dashboards temps réel
- Alertes configurables

**Accès** : https://vercel.com/verone2021s-projects/verone-back-office/logs

**Gratuit** : ✅ Inclus dans votre plan Vercel actuel

---

### **4. Supabase Logs** (Backend/Database)

**Rôle** : Erreurs backend, performance database

**MCP Tools** :
```typescript
mcp__supabase__get_logs('api')       // API errors
mcp__supabase__get_logs('database')  // Database errors
mcp__supabase__get_advisors()        // Security & performance recommendations
```

**Usage** :
- Debugging RLS policies denials
- Slow query analysis
- API health checks

---

## 🚫 Pourquoi Pas Sentry ?

### ✅ **Avantages approche Console + Vercel**

1. **Simple** : Zero config, zero dépendances externes
2. **Gratuit** : Aucun coût, aucune limite événements
3. **Rapide** : Pas de SDK overhead (+31% startup time avec @sentry/node)
4. **Privé** : Logs stockés localement/Vercel (pas de tiers)
5. **Automatisé** : Claude Code + MCP Playwright = fix direct
6. **Léger** : Pas de bundle size impact (~100KB saved)

### ❌ **Inconvénients Sentry évités**

1. **Coût** : $26/mois minimum (10k events/mois), vite explosif en production
2. **Complexité** : Configuration SDK, DSN, breadcrumbs, beforeSend
3. **Performance** : +31% startup time, +100KB bundle size
4. **Privacy** : Données envoyées à des serveurs tiers US
5. **Overkill** : Features avancées (session replay, profiling) non nécessaires

---

## 📊 Comparaison Détaillée

| Critère | Console + Vercel | Sentry |
|---------|------------------|--------|
| **Coût** | $0 (inclus Vercel) | $26+/mois |
| **Setup** | 5 min | 30+ min |
| **Bundle size** | 0 KB | +100 KB |
| **Performance** | Native | +31% startup |
| **Privacy** | Local/Vercel | Serveurs US tiers |
| **MCP Compatible** | ✅ Playwright direct | ❌ Nécessite wrapper |
| **Claude Code Fix** | ✅ Direct | ⚠️ Indirect |
| **Stack traces** | ✅ Vercel | ✅ Sentry |
| **Session replay** | ❌ | ✅ (overkill) |
| **Performance profiling** | ✅ Vercel Analytics | ✅ Sentry Profiler |

---

## 🛠️ Implémentation

### **Fichiers Clés**

- **Code** : `src/lib/monitoring/console-error-tracker.ts`
- **Documentation** : `docs/monitoring/SENTRY-ANALYSIS-RECOMMENDATIONS-2025.md`
- **Command** : `.claude/commands/check-errors.md`
- **Workflow** : `.claude/workflows/agent-orchestration-matrix.md` (Phase 6 MONITOR)

### **Configuration**

Aucune configuration nécessaire ! Le système fonctionne out-of-the-box :
1. `console-error-tracker.ts` setup dans layout.tsx
2. MCP Playwright Browser déjà configuré
3. Vercel Observability activé automatiquement
4. Supabase Logs accessibles via MCP

---

## 🎯 Workflows Monitoring

### **Workflow 1 : Development** (Localhost)
```typescript
1. Développer feature
2. mcp__playwright__browser_navigate('http://localhost:3000')
3. mcp__playwright__browser_console_messages()
4. Si console errors → Fix immédiatement
5. Re-test jusqu'à 0 errors
```

### **Workflow 2 : Pre-Merge** (Pull Request)
```typescript
1. Build production : npm run build
2. Validation console : MCP Playwright Browser sur preview URL
3. Zero console errors = Gate pour merge
4. Si 1 erreur → Block merge
```

### **Workflow 3 : Production** (Monitoring)
```typescript
1. Vérifier Vercel Dashboard (errors, performance)
2. Si spike errors → Investigate avec Supabase Logs
3. Si performance degradation → Check console logs patterns
4. Fix + deploy + validate avec MCP Playwright
```

---

## 📚 Références

- **Analyse complète** : `docs/monitoring/SENTRY-ANALYSIS-RECOMMENDATIONS-2025.md`
- **Alternatives research** : Reddit r/nextjs, Twitter, community feedback
- **Command check-errors** : `.claude/commands/check-errors.md`
- **Agent Orchestration** : `.claude/workflows/agent-orchestration-matrix.md`

---

## 🔄 Historique Décision

**2025-10-26** : Suppression complète Sentry
- ✅ Dead code nettoyé (CSP headers, workflows, .env.example, interfaces)
- ✅ 5 mémoires Sentry supprimées
- ✅ Documentation agents mise à jour
- ✅ Nouvelle mémoire monitoring créée

**Commit** : 
- `62f2007` - refactor(monitoring): Nettoyage propre références Sentry
- `e3b4fd8` - refactor: Suppression complète Sentry (dead code)

---

**Conclusion** : L'approche **Console Error Tracker + Vercel Observability + MCP Playwright** est **simple, gratuite, performante, et parfaitement adaptée** aux besoins Vérone. Pas de regret sur Sentry.
