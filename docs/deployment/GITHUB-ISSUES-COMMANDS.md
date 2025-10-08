# 🐙 GitHub Issues - Audit Pré-Déploiement 2025

**Date:** 08 Octobre 2025
**Context:** Créer 8 GitHub Issues pour tracking corrections critiques

---

## 📋 COMMANDES GH CLI

### Installation gh CLI (si nécessaire)
```bash
# macOS
brew install gh

# Login
gh auth login
```

---

## 🔴 ISSUES CRITIQUES (P0 - Bloquants)

### Issue #1: Console.log Production
```bash
gh issue create \
  --title "🔴 P0: Supprimer console.log/error en production (420+ occurrences)" \
  --body "## Problème
420+ occurrences de console.log/error détectées dans src/hooks/

## Impact
- Pollution console browser production
- Fuite informations sensibles
- Performance dégradée (cumul)

## Solution
1. Créer src/lib/logger.ts avec logging conditionnel
2. Migrer tous console.log → logger.info (420+ occurrences)
3. Migrer tous console.error → logger.error
4. Ajouter ESLint rule no-console strict
5. Intégrer Sentry production

## Code
\`\`\`typescript
// src/lib/logger.ts
export const logger = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') console.log(msg, data)
  },
  error: (msg: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') console.error(msg, error)
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error)
    }
  }
}
\`\`\`

## Validation
- Build production 0 warnings
- Console browser vide en production
- MCP Playwright console check = []

## Effort
4 heures

## Responsable
@dev-senior

## Références
- Audit: docs/reports/AUDIT-PRE-DEPLOIEMENT-PRODUCTION-2025.md
- Checklist: docs/deployment/CHECKLIST-PRE-DEPLOIEMENT.md" \
  --label "critical,pre-deployment,P0" \
  --milestone "Production Deployment" \
  --assignee dev-senior
```

---

### Issue #2: Bundle Size Optimization
```bash
gh issue create \
  --title "🔴 P0: Optimiser bundle size 1.5GB → <500MB (-66%)" \
  --body "## Problème
Bundle .next/ = 1.5GB (vs target <500MB, +200%)

## Impact
- Performance UX dégradée
- Coûts infrastructure élevés
- First Load JS estimé 2.5MB (vs <300KB target)

## Solution
1. Désactiver source maps production (productionBrowserSourceMaps: false)
2. Optimiser images (AVIF/WebP formats)
3. Activer tree-shaking agressif
4. Lazy load routes non-critiques
5. Analyser bundle (@next/bundle-analyzer)

## Code
\`\`\`typescript
// next.config.js
module.exports = {
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    return config
  },
  experimental: {
    optimizePackageImports: ['@/components/ui', 'lucide-react']
  }
}
\`\`\`

## Validation
- du -sh .next/ → <500MB
- First Load JS <300KB
- Lighthouse Performance Score >90

## Effort
8 heures

## Responsable
@devops

## Références
- Audit: docs/reports/AUDIT-PRE-DEPLOIEMENT-PRODUCTION-2025.md Section 2" \
  --label "critical,pre-deployment,P0,performance" \
  --milestone "Production Deployment" \
  --assignee devops
```

---

### Issue #3: RGPD Working Hours Tracking
```bash
gh issue create \
  --title "🔴 P0 LÉGAL: Activer isWorkingHours() tracking (RGPD violation)" \
  --body "## Problème
Tracking utilisateur 24/7 (weekends, nuits, vacances)
Fonction isWorkingHours() créée MAIS non utilisée!

## Impact RGPD
- Violation Article 6 RGPD (Legitimate Interest)
- Risque amende CNIL jusqu'à 20M€ ou 4% CA
- Non-conformité best practices 2025

## Solution CODE (30min)
\`\`\`typescript
// src/components/providers/activity-tracker-provider.tsx
import { isWorkingHours } from '@/lib/analytics/privacy'

useEffect(() => {
  if (user && pathname) {
    // ✅ CHECK RGPD AVANT TRACKING
    if (!isWorkingHours()) {
      console.log('⏸️ Tracking désactivé hors heures travail')
      return
    }
    // ... reste du code
  }
}, [pathname, user])
\`\`\`

## Solution LÉGALE (3 jours)
1. Distribuer Notice RGPD (docs/legal/NOTICE-TRACKING-RGPD.md) à tous employés
2. Recueillir signatures confirmation lecture
3. Archiver consentements (dossier RGPD)
4. Configurer Supabase Cron auto-purge 30 jours

## Validation
\`\`\`sql
-- Vérifier aucun tracking hors heures travail
SELECT COUNT(*)
FROM user_activity_logs
WHERE EXTRACT(DOW FROM created_at) IN (0, 6) -- Weekend
   OR EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 18;
-- Expected: 0
\`\`\`

## Effort
- Code: 30min
- Process légal: 3 jours

## Responsable
@dev-junior (code)
@rh-legal (distribution)

## Références
- Audit: docs/reports/AUDIT-PRE-DEPLOIEMENT-PRODUCTION-2025.md Section 3
- LIA: docs/legal/LEGITIMATE-INTEREST-ASSESSMENT.md
- Notice: docs/legal/NOTICE-TRACKING-RGPD.md" \
  --label "critical,pre-deployment,P0,legal,gdpr" \
  --milestone "Production Deployment" \
  --assignee dev-junior
```

---

## 🟠 ISSUES MAJEURES (P1)

### Issue #4: Métriques Dashboard Réelles
```bash
gh issue create \
  --title "🟠 P1: Connecter métriques dashboard mockées (40%)" \
  --body "## Problème
40% métriques dashboard = 0 (données mockées)
- lowStockItems: 0 (pas de seuil défini)
- recentMovements: 0 (pas de tracking)
- salesOrders: 0 (pas de comptage)
- samplesWaiting: 0 (pas de comptage)

## Impact
- Dashboard affiche toujours 0 (confusion utilisateurs)
- Décisions business basées sur fausses données
- Stocks bas non détectés

## Solution
\`\`\`typescript
// src/hooks/use-complete-dashboard-metrics.ts
const stocksData = {
  totalValue: stockOrdersMetrics?.stock_value || 0,
  lowStockItems: await supabase
    .from('products')
    .select('id')
    .lte('current_stock', 'stock_alert_threshold')
    .count(),
  recentMovements: await supabase
    .from('stock_movements')
    .select('id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .count()
}
\`\`\`

## Indexes requis
\`\`\`sql
CREATE INDEX idx_products_stock_alert ON products(current_stock, stock_alert_threshold);
CREATE INDEX idx_stock_movements_recent ON stock_movements(created_at DESC);
\`\`\`

## Effort
2 heures

## Responsable
@dev-senior" \
  --label "pre-deployment,P1,data" \
  --milestone "Production Deployment"
```

---

### Issue #5: User Activity Tab Données Réelles
```bash
gh issue create \
  --title "🟠 P1: User Activity Tab - Supprimer Math.random(), connecter API" \
  --body "## Problème
Tab Admin Utilisateurs affiche données simulées Math.random()
API /api/admin/users/[id]/activity existe MAIS non utilisée!

## Impact
- Admin voit fausses métriques employés
- Décisions RH basées sur données incorrectes
- Infrastructure tracking créée mais gaspillée

## Solution
\`\`\`typescript
// src/app/admin/users/[id]/components/user-activity-tab.tsx
// ❌ SUPPRIMER getSimulatedActivityData() (lignes 33-54)

// ✅ AJOUTER
useEffect(() => {
  fetch(\`/api/admin/users/\${user.user_id}/activity?days=30\`)
    .then(res => res.json())
    .then(data => {
      setActivityData({
        total_sessions: data.statistics.total_sessions,
        total_actions: data.statistics.total_actions,
        engagement_score: data.statistics.engagement_score
        // ... vraies données
      })
    })
}, [user.user_id])
\`\`\`

## Effort
1 heure

## Responsable
@dev-junior" \
  --label "pre-deployment,P1" \
  --milestone "Production Deployment"
```

---

### Issue #6: RLS Policies Audit Complet
```bash
gh issue create \
  --title "🟠 P1 SÉCURITÉ: Audit RLS policies + Activer RLS manquant" \
  --body "## Problème
Tables potentiellement sans RLS complet:
- user_activity_logs (RLS partiel?)
- product_images (à vérifier)
- collection_images (à vérifier)
- stock_movements (à vérifier)

## Impact
- Fuites données potentielles
- Isolation organisations compromise
- Non-conformité sécurité

## Solution
\`\`\`sql
-- 1. Audit complet
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE;

-- 2. Activer RLS manquant
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Créer policies
CREATE POLICY \"user_activity_logs_select_own_data\"
ON user_activity_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND organisation_id = user_activity_logs.organisation_id
  )
);
\`\`\`

## Validation
\`\`\`sql
-- Test isolation
SET SESSION jwt.claims.user_id = 'user_a_id';
SELECT * FROM products WHERE organisation_id = 'org_id_b';
-- Expected: 0 rows
\`\`\`

## Effort
5 heures

## Responsable
@dba" \
  --label "pre-deployment,P1,security" \
  --milestone "Production Deployment"
```

---

### Issue #7: Validation Zod API Routes
```bash
gh issue create \
  --title "🟠 P1 SÉCURITÉ: Ajouter validation Zod toutes API routes" \
  --body "## Problème
Aucune validation input API routes
- Risque injection SQL
- Risque XSS
- Risque corruption données
- Risque DOS (payload >100MB)

## Impact
- Sécurité compromise
- Données corrompues possibles
- Performance (payloads non validés)

## Solution
\`\`\`typescript
// src/lib/validation/activity-events.ts
import { z } from 'zod'

export const ActivityEventSchema = z.object({
  action: z.string().min(1).max(100),
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  metadata: z.object({
    page_url: z.string().url().optional(),
    session_duration: z.number().min(0).max(86400).optional()
  }).optional()
})

// API Route
export async function POST(request: NextRequest) {
  const rawEvent = await request.json()

  // ✅ Validation AVANT traitement
  const validation = ActivityEventSchema.safeParse(rawEvent)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation échouée', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const event = validation.data // Type-safe + sanitized
}
\`\`\`

## Schémas à créer
- ActivityEventSchema
- CreateProductSchema
- UpdateProductSchema
- CreateUserSchema
- (tous endpoints API)

## Effort
16 heures (2 jours)

## Responsable
@dev-senior" \
  --label "pre-deployment,P1,security" \
  --milestone "Production Deployment"
```

---

### Issue #8: Distribution Notice RGPD
```bash
gh issue create \
  --title "🔴 P0 LÉGAL: Distribuer Notice RGPD + Recueillir signatures" \
  --body "## Problème
Notice RGPD créée (docs/legal/NOTICE-TRACKING-RGPD.md) MAIS:
- Jamais distribuée aux employés
- Aucune signature recueillie
- Violation Article 13-14 RGPD (information obligatoire)

## Impact
- Non-conformité GDPR
- Risque amende CNIL 20M€
- Preuves consentement manquantes

## Process Requis
1. Imprimer Notice RGPD (15 pages)
2. Distribuer à tous employés concernés (email + papier)
3. Recueillir signatures confirmation lecture
4. Archiver signatures (coffre-fort numérique RGPD)
5. Communiquer canal feedback (Slack #feedback-tracking)
6. Documenter process dossier RH

## Checklist
- [ ] Email envoyé à tous employés
- [ ] Notice papier signée par chaque employé
- [ ] Signatures archivées (dossier RGPD confidentiel)
- [ ] Canal feedback Slack créé
- [ ] DPO contact communiqué (dpo@verone.com)
- [ ] Process documenté RH

## Effort
3 jours (process)

## Responsable
@rh-legal

## Références
- Notice: docs/legal/NOTICE-TRACKING-RGPD.md (15 pages)
- LIA: docs/legal/LEGITIMATE-INTEREST-ASSESSMENT.md" \
  --label "critical,pre-deployment,P0,legal,gdpr" \
  --milestone "Production Deployment" \
  --assignee rh-legal
```

---

## ✅ VALIDATION ISSUES CRÉÉES

```bash
# Lister toutes les issues créées
gh issue list --milestone "Production Deployment" --label pre-deployment

# Vérifier 8 issues créées
gh issue list --milestone "Production Deployment" --label pre-deployment --json number,title,labels | jq 'length'
# Expected: 8
```

---

## 📊 SUIVI PROGRESSION

```bash
# Dashboard progression
gh issue list --milestone "Production Deployment" --label pre-deployment

# Filtrer P0 uniquement
gh issue list --milestone "Production Deployment" --label P0

# Filtrer complétées
gh issue list --milestone "Production Deployment" --state closed
```

---

**Références:**
- [Audit Complet](../reports/AUDIT-PRE-DEPLOIEMENT-PRODUCTION-2025.md)
- [Checklist Déploiement](./CHECKLIST-PRE-DEPLOIEMENT.md)

**Date création:** 08 Octobre 2025
