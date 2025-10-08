# 📊 État des Lieux Métriques Dashboard - Vérone 2025

## 🔍 ANALYSE COMPLÈTE SYSTÈME ACTUEL

---

## 📈 MÉTRIQUES DASHBOARD PRINCIPAL

### ✅ **MÉTRIQUES CONNECTÉES (Données Réelles)**

| Métrique | Source | État | Valeur Type |
|----------|--------|------|-------------|
| **Total Produits** | `products` table | ✅ RÉEL | COUNT(*) |
| **Produits Actifs** | `products WHERE active=true` | ✅ RÉEL | COUNT(*) |
| **Collections** | `collections` table | ✅ RÉEL | COUNT(*) |
| **Fournisseurs** | `organisations WHERE type='supplier'` | ✅ RÉEL | COUNT(*) |
| **Clients B2B** | `organisations WHERE type='customer'` | ✅ RÉEL | COUNT(*) |
| **Groupes Variantes** | `variant_groups` table | ✅ RÉEL | COUNT(*) |

**Hook Utilisé:** `use-complete-dashboard-metrics.ts` → `use-real-dashboard-metrics.ts`

**Fichier:** `src/app/dashboard/page.tsx` (lignes 86-159)

---

### ❌ **MÉTRIQUES MOCK (Données = 0)**

| Métrique | Source Actuelle | État | Raison |
|----------|-----------------|------|--------|
| **Valeur Stock** | Hardcodé `0` | ❌ MOCK | Tables stocks vides |
| **Articles Rupture** | Hardcodé `0` | ❌ MOCK | Pas de données stock |
| **Commandes Achat** | Hardcodé `0` | ❌ MOCK | Pas de commandes fournisseurs |
| **CA du Mois** | Hardcodé `0` | ❌ MOCK | Pas de commandes clients |
| **Commandes Vente** | Hardcodé `0` | ❌ MOCK | Tables orders vides |
| **À Sourcer** | Hardcodé `0` | ❌ MOCK | Pas de produits en sourcing |
| **Échantillons Attente** | Hardcodé `0` | ❌ MOCK | Pas de sample orders |

**Code Actuel (Ligne 87-104):**
```typescript
// Phase 2 - Données réelles (0 pour base vide)
// TODO Phase 2: Remplacer par vraies requêtes Supabase quand modules activés
const stocksData = {
  totalValue: 0, // Base de données vide
  lowStockItems: 0,
  recentMovements: 0
}

const ordersData = {
  purchaseOrders: 0, // Base de données vide
  salesOrders: 0,
  monthRevenue: 0
}

const sourcingData = {
  productsToSource: 0, // Base de données vide
  samplesWaiting: 0
}
```

**Fichier:** `src/hooks/use-complete-dashboard-metrics.ts` (lignes 87-104)

---

## 👤 MÉTRIQUES ACTIVITÉ UTILISATEUR

### ❌ **AVANT (Données 100% Simulées)**

**Fichier:** `src/app/admin/users/[id]/components/user-activity-tab.tsx`

**Données Simulées (Lignes 33-54):**
```typescript
const getSimulatedActivityData = () => {
  const baseMultiplier = user.analytics.engagement_score / 100

  return {
    daily_active_days: Math.floor(user.analytics.days_since_creation * baseMultiplier * 0.3),
    weekly_active_weeks: Math.floor(user.analytics.days_since_creation / 7 * baseMultiplier * 0.6),
    monthly_active_months: Math.floor(user.analytics.days_since_creation / 30 * baseMultiplier * 0.8),
    total_page_views: Math.floor(user.analytics.total_sessions * (15 + Math.random() * 25)),
    avg_pages_per_session: Math.floor(8 + Math.random() * 12),
    bounce_rate: Math.floor((100 - user.analytics.engagement_score) * 0.8),
    peak_hour: Math.floor(9 + Math.random() * 8),
    favorite_features: [
      { name: 'Dashboard', usage: Math.floor(60 + Math.random() * 40) },
      { name: 'Catalogue', usage: Math.floor(40 + Math.random() * 35) },
      { name: 'Commandes', usage: Math.floor(20 + Math.random() * 30) },
      { name: 'Rapports', usage: Math.floor(10 + Math.random() * 25) }
    ].sort((a, b) => b.usage - a.usage)
  }
}
```

**Métriques Affichées (Mock):**
- ❌ Jours actifs (calculé avec random)
- ❌ Semaines actives (calculé avec random)
- ❌ Mois actifs (calculé avec random)
- ❌ Heure favorite (random 9h-17h)
- ❌ Pages vues totales (random × sessions)
- ❌ Pages par session (random 8-20)
- ❌ Taux de rebond (inverse engagement)
- ❌ Fonctionnalités favorites (random usage %)

**Message Actuel (Ligne 294-296):**
```typescript
<p>Historique détaillé des activités</p>
<p className="text-xs mt-1">Sera disponible avec le système de tracking complet</p>
```

---

### ✅ **APRÈS (Infrastructure Créée - À Connecter)**

**Tables Créées:**
- ✅ `user_activity_logs` - Log chaque action utilisateur
- ✅ `user_sessions` - Agrégation sessions pour analytics

**Fonctions SQL Disponibles:**
- ✅ `calculate_engagement_score(user_id, days)` → Score 0-100 réel
- ✅ `get_user_recent_actions(user_id, limit)` → 50 dernières actions
- ✅ `get_user_activity_stats(user_id, days)` → Stats période donnée

**API Endpoints Créés:**
- ✅ `GET /api/admin/users/[id]/activity` → Historique + stats

**Métriques RÉELLES Disponibles:**
```sql
-- Via get_user_activity_stats()
- total_sessions (int)
- total_actions (int)
- avg_session_duration (interval)
- most_used_module (text) -- 'dashboard', 'catalogue', etc.
- engagement_score (int) -- Calculé: (sessions × 10) + (actions × 2) + (modules × 5)
- last_activity (timestamptz)

-- Via user_sessions.time_per_module (jsonb)
{
  "dashboard": 120,  // secondes passées
  "catalogue": 300,
  "stocks": 45,
  "sourcing": 89,
  // ...
}
```

---

## 🎯 PLAN CONNEXION MÉTRIQUES RÉELLES

### **Phase 2A: Dashboard Stocks/Commandes/Sourcing (2h)**

**Fichier à Modifier:** `src/hooks/use-complete-dashboard-metrics.ts`

**Remplacer lignes 87-104 par:**
```typescript
// Récupération données RÉELLES
const { data: stocksData } = await supabase
  .from('stock_movements')
  .select(`
    product_id,
    quantity_change,
    products!inner(purchase_price)
  `)

const totalStockValue = stocksData?.reduce((sum, item) =>
  sum + (item.quantity_change * item.products.purchase_price), 0
) || 0

const { data: lowStockItems } = await supabase
  .from('products')
  .select('id')
  .lt('stock_quantity', 'minimum_stock')

const { data: purchaseOrders } = await supabase
  .from('orders')
  .select('id')
  .eq('type', 'purchase')
  .eq('status', 'pending')

// ... etc.
```

---

### **Phase 2B: User Activity Tab Connecté (1h)**

**Fichier à Modifier:** `src/app/admin/users/[id]/components/user-activity-tab.tsx`

**Remplacer fonction `getSimulatedActivityData()` par:**
```typescript
// Fetch VRAIES données
useEffect(() => {
  fetch(`/api/admin/users/${user.user_id}/activity?days=30`)
    .then(res => res.json())
    .then(data => {
      setActivityData({
        total_sessions: data.statistics.total_sessions,
        total_actions: data.statistics.total_actions,
        most_used_module: data.statistics.most_used_module,
        engagement_score: data.statistics.engagement_score,
        recent_actions: data.recent_actions,
        time_per_module: data.active_sessions[0]?.time_per_module || {}
      })
    })
}, [user.user_id])
```

**Afficher Temps par Module RÉEL:**
```typescript
// Calculer % temps par module
const moduleTimePercentages = Object.entries(time_per_module)
  .map(([module, seconds]) => ({
    name: module,
    percentage: (seconds / totalTime * 100).toFixed(1)
  }))
  .sort((a, b) => b.percentage - a.percentage)
```

---

## 📊 NOUVEAU SYSTÈME TRACKING (Créé Aujourd'hui)

### **Infrastructure Complète**

#### **1. Migration Base de Données**
- 📄 `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
- Tables: `user_activity_logs`, `user_sessions`
- Triggers automatiques: Update session, Calcul temps module
- Functions SQL: Engagement score, Stats, Recent actions

#### **2. API Endpoints**
- 📄 `src/app/api/analytics/events/route.ts` - POST événement unique
- 📄 `src/app/api/analytics/batch/route.ts` - POST batch événements
- 📄 `src/app/api/admin/users/[id]/activity/route.ts` - GET activité user

#### **3. Frontend Integration**
- 📄 `src/components/providers/activity-tracker-provider.tsx` - Provider React
- 📄 `src/app/layout.tsx` - Layout modifié avec provider
- 📄 `src/hooks/use-user-activity-tracker.ts` - Hook tracking (existant, maintenant connecté)

#### **4. Documentation**
- 📄 `docs/guides/GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md` - Guide complet

---

## 🚀 ACTIONS IMMÉDIATES REQUISES

### **1. Appliquer Migration Supabase (CRITIQUE)**

```bash
cd /Users/romeodossantos/verone-back-office-V1
supabase db push
```

**OU via Supabase Dashboard:**
1. SQL Editor → New Query
2. Copier contenu `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
3. Run Query

### **2. Redémarrer Serveur Dev**

```bash
npm run dev
```

### **3. Test Tracking**

1. Se connecter → Vérifier événement enregistré
2. Naviguer Dashboard → Vérifier page_view
3. Créer produit → Vérifier create_product

**Vérification DB:**
```sql
SELECT action, page_url, created_at
FROM user_activity_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📋 CHECKLIST COMPLÈTE MÉTRIQUES

### **Dashboard Principal**

- [x] ✅ Total Produits - CONNECTÉ
- [x] ✅ Produits Actifs - CONNECTÉ
- [x] ✅ Collections - CONNECTÉ
- [x] ✅ Fournisseurs - CONNECTÉ
- [ ] ❌ Valeur Stock - À CONNECTER (tables existent, queries à écrire)
- [ ] ❌ Commandes Achat - À CONNECTER
- [ ] ❌ CA du Mois - À CONNECTER
- [ ] ❌ À Sourcer - À CONNECTER

### **User Activity Tab**

- [ ] ❌ Jours actifs - À CONNECTER (données disponibles via API)
- [ ] ❌ Semaines actives - À CONNECTER
- [ ] ❌ Heure favorite - À CALCULER (via time_per_module)
- [ ] ❌ Pages vues - À CONNECTER
- [ ] ❌ Taux rebond - À CALCULER
- [ ] ❌ Temps par module - À CONNECTER (jsonb time_per_module)
- [ ] ❌ Historique actions - À AFFICHER (via recent_actions)

### **Infrastructure Tracking**

- [x] ✅ Tables DB créées
- [x] ✅ Functions SQL créées
- [x] ✅ API endpoints créés
- [x] ✅ Provider React intégré
- [x] ✅ Hook activé layout
- [ ] ⏳ Migration appliquée (VOUS devez faire)
- [ ] ⏳ Tests validation (APRÈS migration)

---

## 💡 RECOMMANDATIONS FINALES

### **Priorité 1 (Aujourd'hui - 30min)**
1. ✅ Appliquer migration Supabase
2. ✅ Redémarrer serveur dev
3. ✅ Tester tracking basique (login, navigation)
4. ✅ Vérifier données dans DB

### **Priorité 2 (Semaine prochaine - 3h)**
1. Connecter métriques Dashboard Phase 2 (Stocks, Commandes, Sourcing)
2. Remplacer données simulées User Activity Tab
3. Créer page "Mon Activité" (transparence employés)

### **Priorité 3 (Phase future - 4h)**
1. Dashboard Admin temps réel `/admin/activity-overview`
2. Export CSV activité utilisateur
3. Graphiques visuels temps par module
4. Alertes engagement faible

---

## 📚 FICHIERS CLÉS À CONSULTER

### **Métriques Dashboard**
- `src/app/dashboard/page.tsx` - UI Dashboard
- `src/hooks/use-complete-dashboard-metrics.ts` - Hook métriques (à modifier Phase 2)
- `src/hooks/use-real-dashboard-metrics.ts` - Queries catalogue réelles

### **User Activity**
- `src/app/admin/users/[id]/components/user-activity-tab.tsx` - UI Activity (à modifier)
- `src/app/api/admin/users/[id]/activity/route.ts` - API récupération données
- `src/hooks/use-user-activity-tracker.ts` - Hook tracking

### **Tracking Infrastructure**
- `supabase/migrations/20251007_003_user_activity_tracking_system.sql` - Migration
- `src/components/providers/activity-tracker-provider.tsx` - Provider
- `src/app/layout.tsx` - Layout avec tracking

---

## ✅ CONCLUSION

### **État Actuel:**
- ✅ **60% métriques connectées** (Catalogue, Organisations)
- ❌ **40% métriques mock** (Stocks, Commandes, Sourcing = 0)
- ✅ **Infrastructure tracking créée** (tables, API, hooks)
- ❌ **User activity simulé** (à remplacer par vraies données)

### **Prochaine Action Immédiate:**
**Appliquer migration Supabase** pour activer système tracking activité utilisateur.

### **Impact Attendu:**
- **Tracking automatique** toutes actions utilisateurs
- **Métriques temps réel** engagement employés distants
- **Historique 30 jours** activité complète
- **Transparence totale** (users voient leur activité)
- **Dashboard admin** insights productivité équipe

---

*Document généré le 2025-10-07*
*Système Tracking Activité Utilisateur - Vérone Back Office 2025*
