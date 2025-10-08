# ✅ CHECKLIST PRÉ-DÉPLOIEMENT PRODUCTION - VÉRONE 2025

**Basé sur:** Audit Complet du 08 Octobre 2025
**Objectif:** Valider correction 8 issues critiques avant déploiement

---

## 🔴 PHASE 1: CORRECTIONS CRITIQUES (BLOQUANTS)

### 1. Console Logging Production ❌ CRITIQUE

**Responsable:** Dev Senior
**Deadline:** J+1
**Effort:** 4 heures

- [ ] Créer `src/lib/logger.ts` avec logger conditionnel
- [ ] Migrer tous `console.log` → `logger.info` (420+ occurrences)
- [ ] Migrer tous `console.error` → `logger.error` (420+ occurrences)
- [ ] Ajouter ESLint rule `"no-console": ["error", { "allow": [] }]`
- [ ] Build production: 0 warnings console
- [ ] Test browser: Console devtools vide en production

**Validation:**
```bash
# Rechercher console restants
grep -r "console\\.log\\|console\\.error" src/hooks/ src/components/ src/app/
# Expected: 0 results

# Build production
npm run build
# Expected: 0 warnings about console

# Test browser
mcp__playwright__browser_navigate("https://verone-preview.vercel.app")
mcp__playwright__browser_console_messages()
# Expected: []
```

---

### 2. Bundle Size Optimization ❌ CRITIQUE

**Responsable:** DevOps
**Deadline:** J+1
**Effort:** 8 heures

- [ ] Désactiver source maps production (`productionBrowserSourceMaps: false`)
- [ ] Optimiser images (AVIF/WebP formats)
- [ ] Activer tree-shaking agressif
- [ ] Lazy load routes non-critiques
- [ ] Analyser bundle avec `@next/bundle-analyzer`
- [ ] Bundle size <500MB
- [ ] First Load JS <300KB

**Validation:**
```bash
# Build production
npm run build

# Vérifier taille .next
du -sh .next/
# Expected: <500MB (vs 1.5GB actuel)

# Analyser bundle
npx @next/bundle-analyzer
# Vérifier First Load JS <300KB

# Lighthouse production
lighthouse https://verone-preview.vercel.app --only-categories=performance
# Expected: Score >90
```

---

### 3. RGPD Working Hours Tracking ❌ CRITIQUE LÉGAL

**Responsable:** Dev Junior
**Deadline:** J+1
**Effort:** 30 minutes (code) + 3 jours (process légal)

#### Code (30min)
- [ ] Importer `isWorkingHours()` dans `activity-tracker-provider.tsx`
- [ ] Ajouter check avant `trackEvent()`
- [ ] Test tracking désactivé weekend (samedi 15h → pas de log)
- [ ] Test tracking activé semaine (mardi 14h → log OK)

**Code à ajouter:**
```typescript
// src/components/providers/activity-tracker-provider.tsx - Ligne 63
import { isWorkingHours } from '@/lib/analytics/privacy'

useEffect(() => {
  if (user && pathname) {
    // ✅ CHECK RGPD
    if (!isWorkingHours()) {
      console.log('⏸️ Tracking désactivé hors heures travail')
      return
    }

    // ... reste du code
  }
}, [pathname, user])
```

#### Process Légal (3 jours)
- [ ] Distribuer `docs/legal/NOTICE-TRACKING-RGPD.md` à tous employés
- [ ] Recueillir signatures confirmation lecture
- [ ] Archiver consentements (RGPD proof)
- [ ] Configurer Supabase Cron auto-purge 30 jours

**Validation:**
```sql
-- Vérifier aucun tracking hors heures travail
SELECT COUNT(*)
FROM user_activity_logs
WHERE EXTRACT(DOW FROM created_at) IN (0, 6) -- Samedi/Dimanche
   OR EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 18;
-- Expected: 0 (après activation)

-- Vérifier rétention 30 jours
SELECT MAX(AGE(NOW(), created_at)) as max_age
FROM user_activity_logs;
-- Expected: <30 days
```

---

### 4. Métriques Dashboard Réelles ⚠️ MAJEUR

**Responsable:** Dev Senior
**Deadline:** J+2
**Effort:** 2 heures

- [ ] Connecter `lowStockItems` (requête Supabase)
- [ ] Connecter `recentMovements` (7 derniers jours)
- [ ] Connecter `salesOrders` count
- [ ] Connecter `samplesWaiting` count
- [ ] Créer indexes performance (`idx_products_stock_alert`, `idx_stock_movements_recent`)
- [ ] Dashboard affiche vraies données (pas 0)

**Validation:**
```typescript
// Test dashboard metrics
const { metrics } = useCompleteDashboardMetrics()

console.assert(metrics.stocks.lowStockItems !== 0, "lowStockItems doit être réel")
console.assert(metrics.stocks.recentMovements !== 0, "recentMovements doit être réel")
console.assert(metrics.orders.salesOrders !== 0, "salesOrders doit être réel")
console.assert(metrics.sourcing.samplesWaiting !== 0, "samplesWaiting doit être réel")
```

---

### 5. User Activity Tab Données Réelles ⚠️ MAJEUR

**Responsable:** Dev Junior
**Deadline:** J+2
**Effort:** 1 heure

- [ ] Supprimer `getSimulatedActivityData()` fonction
- [ ] Connecter API `/api/admin/users/[id]/activity`
- [ ] Afficher vraies données activité utilisateur
- [ ] Test: Admin voit métriques réelles (pas Math.random())

**Code à remplacer:**
```typescript
// ❌ SUPPRIMER (lignes 33-54)
const getSimulatedActivityData = () => { ... }

// ✅ AJOUTER
useEffect(() => {
  fetch(`/api/admin/users/${user.user_id}/activity?days=30`)
    .then(res => res.json())
    .then(data => setActivityData(data.statistics))
}, [user.user_id])
```

**Validation:**
```bash
# Test API
curl https://verone-preview.vercel.app/api/admin/users/USER_ID/activity?days=30
# Expected: Real data (not random)

# Test UI
# Navigate to /admin/users/USER_ID
# Verify metrics change on page refresh (if real data)
```

---

### 6. RLS Policies Audit Complet ⚠️ MAJEUR SÉCURITÉ

**Responsable:** DBA
**Deadline:** J+2
**Effort:** 5 heures

- [ ] Lister toutes tables public (`SELECT * FROM pg_tables WHERE schemaname='public'`)
- [ ] Vérifier RLS activé (`rowsecurity=TRUE`)
- [ ] Vérifier policies SELECT/INSERT/UPDATE/DELETE
- [ ] Activer RLS manquant (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Créer policies manquantes
- [ ] Test: User A ne peut pas voir données Organisation B

**Tables prioritaires à vérifier:**
```sql
-- user_activity_logs (RGPD critical)
-- product_images (exposition images)
-- collection_images (exposition images)
-- stock_movements (transactions sensibles)
-- consultations (données clients)
```

**Validation:**
```sql
-- Vérifier RLS activé partout
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE;
-- Expected: 0 rows

-- Test isolation données
-- User A (org_id=1) essaie d'accéder données User B (org_id=2)
SET SESSION jwt.claims.user_id = 'user_a_id';
SELECT * FROM products WHERE organisation_id = 'org_id_2';
-- Expected: 0 rows (access denied)
```

---

### 7. Validation Zod API Routes ⚠️ MAJEUR SÉCURITÉ

**Responsable:** Dev Senior
**Deadline:** J+2
**Effort:** 16 heures

- [ ] Créer schémas Zod pour toutes API routes (`src/lib/validation/`)
- [ ] Intégrer validation dans `/api/analytics/events`
- [ ] Intégrer validation dans `/api/catalogue/products`
- [ ] Intégrer validation dans `/api/admin/users`
- [ ] Intégrer validation dans toutes autres API routes
- [ ] Test: Payload invalide → 400 Bad Request

**Schémas à créer:**
```typescript
// src/lib/validation/activity-events.ts
export const ActivityEventSchema = z.object({
  action: z.string().min(1).max(100),
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  metadata: z.object({ ... }).optional()
})

// src/lib/validation/products.ts
export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  cost_price: z.number().min(0.01),
  // ...
})
```

**Validation:**
```bash
# Test validation OK
curl -X POST https://verone-preview.vercel.app/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"action":"test","severity":"info"}'
# Expected: 200 OK

# Test validation échouée
curl -X POST https://verone-preview.vercel.app/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"action":"","severity":"invalid"}'
# Expected: 400 Bad Request + Zod error details
```

---

### 8. Distribution Notice RGPD ❌ CRITIQUE LÉGAL

**Responsable:** RH + Legal
**Deadline:** J+4
**Effort:** 3 jours (process)

- [ ] Imprimer `docs/legal/NOTICE-TRACKING-RGPD.md` (15 pages)
- [ ] Distribuer à tous employés tracking (email + papier)
- [ ] Recueillir signatures confirmation lecture
- [ ] Archiver signatures (dossier confidentiel RGPD)
- [ ] Communiquer canal feedback employés (Slack #feedback-tracking)
- [ ] Documenter process dans dossier RH

**Checklist distribution:**
- [ ] Email envoyé à tous employés concernés
- [ ] Notice papier signée par chaque employé
- [ ] Signatures archivées (coffre-fort numérique RGPD)
- [ ] Canal feedback Slack créé (#feedback-tracking)
- [ ] DPO contact communiqué (dpo@verone.com)

**Validation:**
```bash
# Vérifier 100% signatures recueillies
ls signatures-rgpd/ | wc -l
# Expected: [NOMBRE_EMPLOYÉS]

# Vérifier email envoyé
# Check mailbox confirmations lecture
```

---

## 🟡 PHASE 2: VALIDATION & TESTS (NON-BLOQUANTS)

### Tests Fonctionnels

- [ ] Login/Logout flow
- [ ] Dashboard charge <2s
- [ ] Catalogue charge <3s
- [ ] Création produit fonctionne
- [ ] Upload images fonctionne
- [ ] Variant groups CRUD fonctionne
- [ ] Collections CRUD fonctionne
- [ ] Export Google Merchant <10s
- [ ] Export PDF <5s

### Tests Performance (Lighthouse)

- [ ] Performance Score >90
- [ ] Accessibility Score >95
- [ ] Best Practices Score >95
- [ ] SEO Score >90
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s
- [ ] Total Blocking Time <200ms
- [ ] Cumulative Layout Shift <0.1

### Tests Sécurité

- [ ] RLS isolation organisations testée
- [ ] Validation Zod toutes routes
- [ ] CSP headers actifs
- [ ] HSTS headers actifs
- [ ] No sensitive data in console
- [ ] No sensitive data in errors

### Tests RGPD

- [ ] IP anonymization production
- [ ] User Agent simplification production
- [ ] Tracking uniquement heures travail
- [ ] Auto-purge 30 jours configuré
- [ ] Notice RGPD distribuée + signée
- [ ] DPO contact accessible

---

## 🟢 PHASE 3: DÉPLOIEMENT PRODUCTION

### Pre-Deployment

- [ ] Backup Supabase complet
- [ ] Vercel preview environment tests passent
- [ ] DNS preparation (TTL 300s)
- [ ] Sentry production configuré
- [ ] Monitoring dashboard ready
- [ ] Team standby (Dev + DevOps + QA)

### Deployment

- [ ] Merge `main` branch (trigger CI/CD Vercel)
- [ ] Monitor Vercel deployment logs
- [ ] Health check API `/api/health` → 200 OK
- [ ] Smoke tests production
- [ ] Performance monitoring (Lighthouse)
- [ ] Sentry errors monitoring

### Post-Deployment (72h)

- [ ] Zero Sentry errors >10/min
- [ ] SLO respect: Dashboard <2s, Catalogue <3s
- [ ] User feedback positif (>4/5)
- [ ] RLS policies zero breach
- [ ] RGPD compliance verified
- [ ] Monitoring alerts configurés

---

## 📊 CRITÈRES GO/NO-GO DÉPLOIEMENT

### GO Criteria (TOUS obligatoires)

✅ **Phase 1 completée à 100%** (8 issues critiques résolues)
✅ **Build production sans warnings**
✅ **Lighthouse Score >90**
✅ **Zero console errors browser**
✅ **RLS 100% coverage tables critiques**
✅ **Zod validation 100% API routes**
✅ **Notice RGPD 100% signatures**
✅ **MCP Playwright console check = 0 errors**
✅ **Bundle size <500MB**
✅ **Performance SLOs validés**

### NO-GO Criteria (UN suffit pour bloquer)

❌ 1+ issue critique non résolue
❌ Build production échoue
❌ Console errors détectées production
❌ RLS breach détectée
❌ Validation Zod absente API critiques
❌ Notice RGPD non signée
❌ Bundle size >500MB
❌ SLO dépassé >50%
❌ Sentry errors >10/min
❌ Security vulnerability détectée

---

## 🚨 ROLLBACK PLAN

### Triggers Rollback

- Sentry errors >10/min pendant 5min
- SLO dépassé >50% pendant 10min
- RLS policy breach confirmée
- User complaints >5 en 1h
- Security incident détecté

### Rollback Procedure

1. **Immediate:** Revert Vercel deployment (1 click)
2. **Restore:** Supabase backup si nécessaire
3. **Communicate:** Alert team + users
4. **Investigate:** Root cause analysis
5. **Fix:** Correction issue + re-test
6. **Re-deploy:** Après validation corrections

---

## 📝 SIGN-OFF

### Phase 1: Corrections Critiques

- [ ] **Dev Senior** (Console logging + Métriques + Validation Zod)
- [ ] **DevOps** (Bundle optimization)
- [ ] **Dev Junior** (RGPD activation + User Activity Tab)
- [ ] **DBA** (RLS policies audit)
- [ ] **RH + Legal** (Notice RGPD distribution)

**Date completion Phase 1:** _______________

### Phase 2: Validation & Tests

- [ ] **QA Lead** (Tests fonctionnels + Performance)
- [ ] **Security Auditor** (Tests sécurité + RGPD)
- [ ] **Dev Lead** (Code review final)

**Date completion Phase 2:** _______________

### Phase 3: Déploiement Production

- [ ] **Product Owner** (Business approval)
- [ ] **CTO** (Technical approval)
- [ ] **DevOps** (Deployment execution)

**Date déploiement production:** _______________

---

**Document créé le:** 08 Octobre 2025
**Version:** 1.0
**Dernière mise à jour:** _______________

**Contact urgence déploiement:** deploy-emergency@verone.com
