# 🛠️ Stock Traceability - Maintenance & Troubleshooting Guide

**Date**: 22 septembre 2025
**Version**: 1.0
**Type**: Maintenance Documentation
**Audience**: Développeurs, DevOps, Support Technique

## 📋 Vue d'Ensemble

Ce guide fournit les procédures de maintenance, dépannage et support pour le système de traçabilité des mouvements de stock Vérone. Il couvre la surveillance, les problèmes courants et les procédures de résolution.

## 🎯 Points de Surveillance

### 1. Performance Metrics

#### Indicateurs Critiques
```typescript
// Seuils d'alerte
const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 2000,        // 2 secondes max
  apiResponseTime: 1000,     // 1 seconde max
  exportGenerationTime: 5000, // 5 secondes max (500 mouvements)
  databaseQueryTime: 500     // 500ms max
}
```

#### Monitoring Queries
```sql
-- Performance des requêtes mouvements
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%stock_movements%'
ORDER BY mean_exec_time DESC;

-- Index utilization
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'stock_movements';
```

### 2. Data Integrity Checks

#### Consistency Validation
```sql
-- Vérifier cohérence des calculs
SELECT
  id,
  quantity_before,
  quantity_after,
  quantity_change,
  (quantity_after - quantity_before) AS calculated_change
FROM stock_movements
WHERE NOT affects_forecast
  AND (quantity_after - quantity_before) != quantity_change;

-- Mouvements orphelins
SELECT sm.id, sm.reference_type, sm.reference_id
FROM stock_movements sm
LEFT JOIN sales_orders so ON so.id = sm.reference_id::uuid
  AND sm.reference_type LIKE '%sales_order%'
LEFT JOIN purchase_orders po ON po.id = sm.reference_id::uuid
  AND sm.reference_type LIKE '%purchase_order%'
WHERE sm.reference_id IS NOT NULL
  AND so.id IS NULL
  AND po.id IS NULL;
```

### 3. Error Monitoring

#### Console Error Detection
```bash
# Logs Supabase
tail -f /var/log/supabase/postgres.log | grep -i "stock_movements"

# Next.js logs
npm run dev 2>&1 | grep -i "error\|warning"
```

#### Database Error Patterns
```sql
-- Triggers en erreur
SELECT * FROM pg_stat_user_functions
WHERE funcname LIKE '%stock%movement%'
ORDER BY calls DESC;

-- Violations de contraintes
SELECT conname, contype, confrelid::regclass
FROM pg_constraint
WHERE conrelid = 'stock_movements'::regclass;
```

## 🚨 Problèmes Courants & Solutions

### 1. Erreurs Console "Cannot find module './1989.js'"

#### Diagnostic
```bash
# Nettoyer cache Next.js
rm -rf .next/
npm run dev
```

#### Cause & Solution
- **Cause** : Cache webpack corrompu ou module manquant
- **Solution** : Rebuild complet du cache
```bash
# Solution complète
rm -rf .next/
rm -rf node_modules/.cache/
npm ci
npm run dev
```

### 2. Erreurs Supabase 400 "user_profiles:performed_by"

#### Diagnostic
```typescript
// Vérifier la syntaxe des requêtes
const { data, error } = await supabase
  .from('stock_movements')
  .select('*, user_profiles!performed_by(first_name, last_name)')

console.log('Query error:', error)
```

#### Cause & Solution
- **Cause** : Syntaxe JOIN Supabase incorrecte
- **Solution** : Utiliser requêtes séparées avec enrichissement
```typescript
// ❌ INCORRECT
.select('*, user_profiles:performed_by(user_id, first_name, last_name)')

// ✅ CORRECT
const [movements, profiles] = await Promise.all([
  supabase.from('stock_movements').select('*'),
  supabase.from('user_profiles').select('user_id, first_name, last_name')
])
```

### 3. Triggers Database en Échec

#### Diagnostic
```sql
-- Vérifier statut des triggers
SELECT
  tgname,
  tgenabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%stock%';

-- Logs des fonctions
SELECT
  funcname,
  calls,
  total_time,
  mean_time
FROM pg_stat_user_functions
WHERE funcname LIKE '%movement%';
```

#### Solutions Courantes

##### Trigger Non Exécuté
```sql
-- Vérifier existence
SELECT tgname FROM pg_trigger WHERE tgname = 'sales_order_status_change_trigger';

-- Recréer si nécessaire
DROP TRIGGER IF EXISTS sales_order_status_change_trigger ON sales_orders;
CREATE TRIGGER sales_order_status_change_trigger
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_sales_order_status_change();
```

##### Validation Errors
```sql
-- Diagnostic erreurs validation
DO $$
BEGIN
  PERFORM create_sales_order_forecast_movements('existing_order_id');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;
```

### 4. Performance Dégradée

#### Diagnostic Performance
```sql
-- Requêtes lentes
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%stock_movements%'
  AND mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables
WHERE tablename = 'stock_movements';
```

#### Solutions Performance

##### Index Manquants
```sql
-- Créer index manquants si needed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_performed_at_desc
ON stock_movements(performed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_movements_product_date
ON stock_movements(product_id, performed_at DESC);
```

##### Optimisation Requêtes
```typescript
// Pagination optimisée
const fetchMovements = async (limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*', { count: 'estimated' }) // estimated vs exact pour performance
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1)
}
```

### 5. Données Utilisateur Manquantes

#### Diagnostic
```sql
-- Utilisateurs sans profil
SELECT DISTINCT sm.performed_by
FROM stock_movements sm
LEFT JOIN user_profiles up ON up.user_id = sm.performed_by
WHERE up.user_id IS NULL;
```

#### Solution
```sql
-- Créer profils manquants
INSERT INTO user_profiles (user_id, first_name, last_name, role)
SELECT DISTINCT
  sm.performed_by,
  'Utilisateur',
  'Inconnu',
  'user'
FROM stock_movements sm
LEFT JOIN user_profiles up ON up.user_id = sm.performed_by
WHERE up.user_id IS NULL;
```

## 🔧 Procédures de Maintenance

### 1. Maintenance Quotidienne

#### Vérifications Automatisées
```bash
#!/bin/bash
# daily-check.sh

echo "=== Daily Stock Traceability Check ==="

# 1. Vérifier performance
psql -d $DATABASE_URL -c "
SELECT
  COUNT(*) as total_movements_today,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
FROM stock_movements
WHERE created_at > CURRENT_DATE;
"

# 2. Vérifier erreurs
psql -d $DATABASE_URL -c "
SELECT COUNT(*) as orphaned_movements
FROM stock_movements sm
WHERE reference_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sales_orders so WHERE so.id = sm.reference_id::uuid
    UNION
    SELECT 1 FROM purchase_orders po WHERE po.id = sm.reference_id::uuid
  );
"

# 3. Vérifier triggers
psql -d $DATABASE_URL -c "
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%stock%movement%';
"
```

### 2. Maintenance Hebdomadaire

#### Nettoyage et Optimisation
```sql
-- Analyser statistiques tables
ANALYZE stock_movements;
ANALYZE user_profiles;
ANALYZE products;

-- Vacuum si nécessaire
VACUUM (ANALYZE) stock_movements;

-- Reindex si fragmentation
REINDEX INDEX CONCURRENTLY idx_stock_movements_reference;
```

#### Vérification Intégrité
```sql
-- Check constraints
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'stock_movements'::regclass
  AND NOT convalidated;

-- Validate foreign keys
SELECT * FROM stock_movements sm
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = sm.product_id);
```

### 3. Maintenance Mensuelle

#### Archivage (si volume élevé)
```sql
-- Archiver mouvements > 2 ans
CREATE TABLE stock_movements_archive AS
SELECT * FROM stock_movements
WHERE performed_at < CURRENT_DATE - INTERVAL '2 years';

-- Supprimer après vérification
DELETE FROM stock_movements
WHERE performed_at < CURRENT_DATE - INTERVAL '2 years';
```

#### Statistiques Business
```sql
-- Rapport mensuel
SELECT
  DATE_TRUNC('month', performed_at) as month,
  movement_type,
  COUNT(*) as count,
  SUM(ABS(quantity_change)) as total_quantity
FROM stock_movements
WHERE performed_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
```

## 🚀 Procédures de Déploiement

### 1. Pre-deployment Checks

#### Validation Schema
```bash
# Vérifier migrations
npm run db:check-migrations

# Valider triggers
psql -d $DATABASE_URL -f scripts/validate-triggers.sql

# Test performance
npm run test:performance
```

#### Test Integration
```typescript
// tests/integration/stock-traceability.test.ts
describe('Stock Traceability Integration', () => {
  test('Manual movement creates correct origin', async () => {
    const movement = await createManualMovement({
      product_id: 'test-product',
      quantity: 10,
      reason_code: 'manual_adjustment'
    })

    expect(movement.reference_type).toBe('manual_adjustment')
    expect(movement.performed_by).toBe(currentUser.id)
  })

  test('Order confirmation triggers forecast movement', async () => {
    const order = await createSalesOrder()
    await confirmOrder(order.id)

    const movements = await getMovementsByReference('sales_order_confirmation', order.id)
    expect(movements).toHaveLength(order.items.length)
    expect(movements[0].affects_forecast).toBe(true)
  })
})
```

### 2. Deployment Process

#### Database Migration
```bash
# 1. Backup avant migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
npm run db:migrate

# 3. Validate
npm run db:validate-schema
```

#### Application Deployment
```bash
# 1. Build & validate
npm run build:check

# 2. Deploy
vercel --prod

# 3. Health check
curl -f https://verone-back-office.vercel.app/api/health/stock-movements
```

### 3. Post-deployment Validation

#### Smoke Tests
```typescript
// scripts/post-deploy-test.ts
async function validateStockTraceability() {
  // Test 1: Page loads
  const response = await fetch('/historique-mouvements')
  expect(response.status).toBe(200)

  // Test 2: API works
  const movements = await fetch('/api/stock/movements?limit=5')
  expect(movements.ok).toBe(true)

  // Test 3: Origin column visible
  const html = await response.text()
  expect(html).toContain('Origine')
}
```

## 📊 Monitoring Dashboards

### 1. Métriques Techniques

#### Grafana Queries
```promql
# Response time
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket{path="/api/stock/movements"}[5m])
)

# Error rate
rate(http_requests_total{path="/api/stock/movements",status!~"2.."}[5m]) /
rate(http_requests_total{path="/api/stock/movements"}[5m])

# Database connections
postgres_stat_activity_count{state="active"}
```

### 2. Métriques Business

#### KPIs Clés
```sql
-- Dashboard queries
-- Mouvements par jour
SELECT
  DATE(performed_at) as date,
  COUNT(*) as movements_count
FROM stock_movements
WHERE performed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1 ORDER BY 1;

-- Répartition Manuel vs Auto
SELECT
  CASE
    WHEN reference_type IN ('manual_adjustment', 'manual_entry') THEN 'Manuel'
    ELSE 'Automatique'
  END as type,
  COUNT(*) as count
FROM stock_movements
WHERE performed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1;

-- Performance utilisateurs
SELECT
  up.first_name || ' ' || up.last_name as user_name,
  COUNT(*) as movements_count
FROM stock_movements sm
JOIN user_profiles up ON up.user_id = sm.performed_by
WHERE sm.performed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY 1 ORDER BY 2 DESC;
```

## 🚨 Escalation Procedures

### 1. Severité P1 (Critique)
**Critères** : System down, data corruption, zero availability

#### Actions Immédiates
1. ⚠️ **Alert Team** : Slack #alerts-critical
2. 🔄 **Rollback** : Previous working version
3. 📞 **Escalate** : CTO si > 15min

#### Investigation
```bash
# Check system status
curl -f https://status.supabase.com/
vercel status

# Database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Application logs
vercel logs --prod
```

### 2. Severité P2 (Important)
**Critères** : Performance dégradée, erreurs partielles

#### Actions
1. 📊 **Monitor** : Dashboard performance
2. 🔍 **Investigate** : Error patterns
3. 📝 **Document** : Issue tracking

### 3. Severité P3 (Mineur)
**Critères** : UI bugs, edge cases

#### Actions
1. 📋 **Ticket** : Create issue dans backlog
2. 📅 **Schedule** : Prochaine release
3. 📖 **Document** : Workaround si possible

## 📚 Resources & Documentation

### Links Utiles
- **Supabase Status** : https://status.supabase.com/
- **Vercel Status** : https://www.vercel-status.com/
- **Performance Dashboard** : /admin/performance
- **Error Tracking** : Logs Vercel

### Emergency Contacts
- **Lead Dev** : claude-code@anthropic.com
- **DevOps** : devops@verone.com
- **Product** : product@verone.com

### Runbooks
- `scripts/emergency-rollback.sh` : Rollback automatique
- `scripts/db-backup.sh` : Backup manuel
- `scripts/health-check.sh` : Validation système

---

**Status** : ✅ OPERATIONNEL
**Dernière mise à jour** : 22 septembre 2025
**Prochaine révision** : Décembre 2025
**Maintenance** : Programmée dimanche 06:00-08:00 UTC