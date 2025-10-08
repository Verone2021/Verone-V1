# 🗺️ Roadmap Métriques & Activité Utilisateur - Vérone 2025

## 📋 RÉCAPITULATIF IMPLÉMENTATION

### ✅ **PHASE 1: Infrastructure Base (TERMINÉE - 2h)**

**Objectif:** Créer fondations tracking activité utilisateur

**Réalisations:**
- [x] Migration Supabase tables tracking
  - `user_activity_logs` - Log chaque action
  - `user_sessions` - Agrégation sessions
- [x] Functions SQL automatiques
  - `calculate_engagement_score()`
  - `get_user_recent_actions()`
  - `get_user_activity_stats()`
- [x] API Endpoints
  - `POST /api/analytics/events`
  - `POST /api/analytics/batch`
  - `GET /api/admin/users/[id]/activity`
- [x] Provider React `ActivityTrackerProvider`
- [x] Hook `use-user-activity-tracker` activé
- [x] Documentation complète

**Fichiers Créés:**
- `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
- `src/app/api/analytics/events/route.ts`
- `src/app/api/analytics/batch/route.ts`
- `src/app/api/admin/users/[id]/activity/route.ts`
- `src/components/providers/activity-tracker-provider.tsx`
- `src/app/layout.tsx` (modifié)
- `docs/guides/GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md`
- `docs/reports/ETAT-LIEUX-METRIQUES-DASHBOARD-2025.md`
- `docs/guides/BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md`

**État:** ✅ Infrastructure prête, **migration à appliquer par vous**

---

## 🚀 **PHASE 2: Dashboard Admin Activité (3-4h)**

**Objectif:** Interface admin complète suivi activité équipe

### **2.1 Page Activity Overview (2h)**

**Fichier à créer:** `src/app/admin/activity-overview/page.tsx`

**Features:**
- Vue temps réel "Qui travaille maintenant"
- Liste 5 utilisateurs actifs avec page actuelle
- Statut: Actif / Inactif (dernière activité < 5min)
- Graphique temps par module (équipe entière)
- Top 10 actions aujourd'hui
- Filtres: Aujourd'hui / Cette semaine / Ce mois

**Code Exemple:**
```typescript
'use client'

export default function ActivityOverviewPage() {
  const [activeUsers, setActiveUsers] = useState([])
  const [teamStats, setTeamStats] = useState(null)

  useEffect(() => {
    // Fetch users actifs
    fetch('/api/admin/activity/live')
      .then(res => res.json())
      .then(data => {
        setActiveUsers(data.active_users)
        setTeamStats(data.team_statistics)
      })
  }, [])

  return (
    <div>
      <h1>Vue d'ensemble Activité Équipe</h1>

      {/* Qui travaille maintenant */}
      <section>
        <h2>👥 {activeUsers.length} employés actifs</h2>
        {activeUsers.map(user => (
          <div key={user.id}>
            <Avatar>{user.name}</Avatar>
            <p>📍 {user.current_page}</p>
            <p>⏱️ Actif depuis {user.minutes_active} min</p>
          </div>
        ))}
      </section>

      {/* Temps par module */}
      <section>
        <h2>Temps par Module (Cette Semaine)</h2>
        <BarChart data={teamStats?.time_per_module} />
      </section>
    </div>
  )
}
```

**API à créer:** `src/app/api/admin/activity/live/route.ts`
```typescript
export async function GET() {
  // Récupérer sessions actives (< 5min)
  const { data: activeSessions } = await supabase
    .from('user_sessions')
    .select(`
      *,
      user:user_profiles(full_name, avatar_url)
    `)
    .gte('last_activity', new Date(Date.now() - 5*60*1000).toISOString())
    .is('session_end', null)

  // Stats équipe agrégées
  const teamStats = await calculateTeamStats()

  return NextResponse.json({
    active_users: activeSessions,
    team_statistics: teamStats
  })
}
```

### **2.2 Composant Historique Activité (1h)**

**Fichier à créer:** `src/components/admin/user-activity-history.tsx`

**Features:**
- Liste 50 dernières actions utilisateur
- Icônes par type action (create, edit, delete, view)
- Timestamps relatifs ("il y a 5 minutes")
- Filtres par type action
- Recherche textuelle
- Pagination

**Code Exemple:**
```typescript
'use client'

export function UserActivityHistory({ userId }: { userId: string }) {
  const [actions, setActions] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/activity?limit=50`)
      .then(res => res.json())
      .then(data => setActions(data.recent_actions))
  }, [userId])

  const filteredActions = actions.filter(a =>
    filter === 'all' || a.action.includes(filter)
  )

  return (
    <div>
      <div className="filters">
        <Button onClick={() => setFilter('all')}>Tout</Button>
        <Button onClick={() => setFilter('create')}>Créations</Button>
        <Button onClick={() => setFilter('edit')}>Modifications</Button>
        <Button onClick={() => setFilter('view')}>Consultations</Button>
      </div>

      <ul>
        {filteredActions.map(action => (
          <li key={action.created_at}>
            <ActionIcon type={action.action} />
            <div>
              <strong>{formatAction(action.action)}</strong>
              <p>{action.page_url}</p>
              <time>{formatRelativeTime(action.created_at)}</time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### **2.3 Export CSV Activité (30min)**

**Fichier à créer:** `src/app/api/admin/users/[id]/export/route.ts`

```typescript
export async function GET(request, { params }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  // Récupérer activité
  const { data: actions } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', id)
    .gte('created_at', new Date(Date.now() - days*24*60*60*1000))
    .order('created_at', { ascending: false })

  // Générer CSV
  const csv = generateCSV(actions, [
    { key: 'action', header: 'Action' },
    { key: 'page_url', header: 'Page' },
    { key: 'created_at', header: 'Date/Heure' },
    { key: 'severity', header: 'Importance' }
  ])

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="activity-${id}-${days}days.csv"`
    }
  })
}
```

**UI Bouton Export:**
```typescript
<Button onClick={() => {
  window.open(`/api/admin/users/${userId}/export?days=30`, '_blank')
}}>
  📥 Exporter CSV (30 jours)
</Button>
```

---

## 📊 **PHASE 3: Métriques Dashboard Connectées (2h)**

**Objectif:** Remplacer données mock par vraies requêtes DB

### **3.1 Dashboard Stocks/Commandes/Sourcing (1h30)**

**Fichier à modifier:** `src/hooks/use-complete-dashboard-metrics.ts`

**Remplacer lignes 87-104:**
```typescript
// AVANT (Mock)
const stocksData = {
  totalValue: 0,
  lowStockItems: 0,
  recentMovements: 0
}

// APRÈS (Connecté)
const { data: stocksRaw } = await supabase
  .from('stock_movements')
  .select(`
    quantity_change,
    products!inner(purchase_price)
  `)

const totalStockValue = stocksRaw?.reduce((sum, item) =>
  sum + (Math.abs(item.quantity_change) * item.products.purchase_price), 0
) || 0

const { data: lowStockProducts } = await supabase
  .from('products')
  .select('id')
  .lt('stock_quantity', 'minimum_stock')

const stocksData = {
  totalValue: totalStockValue,
  lowStockItems: lowStockProducts?.length || 0,
  recentMovements: stocksRaw?.length || 0
}
```

**Idem pour Commandes:**
```typescript
const { data: purchaseOrders } = await supabase
  .from('orders')
  .select('id, total_amount')
  .eq('type', 'purchase')
  .in('status', ['pending', 'confirmed'])

const { data: salesOrders } = await supabase
  .from('orders')
  .select('id, total_amount')
  .eq('type', 'sale')
  .gte('created_at', startOfMonth())

const ordersData = {
  purchaseOrders: purchaseOrders?.length || 0,
  salesOrders: salesOrders?.length || 0,
  monthRevenue: salesOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
}
```

**Et Sourcing:**
```typescript
const { data: toSourceProducts } = await supabase
  .from('products')
  .select('id')
  .eq('sourcing_status', 'to_source')

const { data: samplesWaiting } = await supabase
  .from('sample_orders')
  .select('id')
  .eq('status', 'waiting')

const sourcingData = {
  productsToSource: toSourceProducts?.length || 0,
  samplesWaiting: samplesWaiting?.length || 0
}
```

### **3.2 User Activity Tab Données Réelles (30min)**

**Fichier à modifier:** `src/app/admin/users/[id]/components/user-activity-tab.tsx`

**Supprimer fonction `getSimulatedActivityData()` (lignes 33-55)**

**Remplacer par fetch API:**
```typescript
const [activityData, setActivityData] = useState(null)

useEffect(() => {
  fetch(`/api/admin/users/${user.user_id}/activity?days=30`)
    .then(res => res.json())
    .then(data => {
      const stats = data.statistics
      const timeModule = data.active_sessions[0]?.time_per_module || {}

      // Calculer jours/semaines/mois actifs depuis stats
      const daysActive = Math.floor(stats.total_sessions / 1.5) // Estimation 1.5 sessions/jour actif
      const weeksActive = Math.floor(daysActive / 7)
      const monthsActive = Math.floor(daysActive / 30)

      // Calculer temps par module en %
      const totalTime = Object.values(timeModule).reduce((a,b) => a + b, 0)
      const modulePercentages = Object.entries(timeModule)
        .map(([module, time]) => ({
          name: module,
          usage: Math.round((time / totalTime) * 100)
        }))
        .sort((a, b) => b.usage - a.usage)

      setActivityData({
        daily_active_days: daysActive,
        weekly_active_weeks: weeksActive,
        monthly_active_months: monthsActive,
        total_page_views: stats.total_actions, // Actions ≈ page views
        avg_pages_per_session: Math.round(stats.total_actions / stats.total_sessions),
        bounce_rate: 0, // À calculer si besoin
        peak_hour: 14, // À calculer via GROUP BY HOUR
        favorite_features: modulePercentages
      })
    })
}, [user.user_id])
```

---

## 👤 **PHASE 4: Interface Employé "Mon Activité" (1h)**

**Objectif:** Transparence totale - Chaque employé voit son tracking

### **4.1 Page Mon Activité (45min)**

**Fichier à créer:** `src/app/mon-activite/page.tsx`

```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

export default function MonActivitePage() {
  const { user } = useAuth()
  const [myStats, setMyStats] = useState(null)
  const [myActions, setMyActions] = useState([])

  useEffect(() => {
    if (user) {
      // Fetch MES stats
      fetch(`/api/admin/users/${user.id}/activity?days=30`)
        .then(res => res.json())
        .then(data => {
          setMyStats(data.statistics)
          setMyActions(data.recent_actions)
        })
    }
  }, [user])

  if (!myStats) return <div>Chargement...</div>

  return (
    <div>
      <h1>Mon Activité</h1>

      <section>
        <h2>Mon Engagement</h2>
        <div className="score-circle">
          {myStats.engagement_score}/100
        </div>
        <p>
          {myStats.engagement_score >= 80 && "Excellent engagement! 🎉"}
          {myStats.engagement_score >= 60 && myStats.engagement_score < 80 && "Bon engagement 👍"}
          {myStats.engagement_score < 60 && "On peut améliorer 💪"}
        </p>
      </section>

      <section>
        <h2>Mes Sessions</h2>
        <p>{myStats.total_sessions} sessions ces 30 jours</p>
        <p>Durée moyenne: {formatDuration(myStats.avg_session_duration)}</p>
      </section>

      <section>
        <h2>Mon Temps par Module</h2>
        <BarChart data={calculateTimePercentages(myStats.time_per_module)} />
      </section>

      <section>
        <h2>Mon Historique (50 dernières actions)</h2>
        <ul>
          {myActions.map(action => (
            <li key={action.created_at}>
              {action.action} - {action.page_url} - {formatDate(action.created_at)}
            </li>
          ))}
        </ul>
      </section>

      <Button onClick={() => window.open(`/api/admin/users/${user.id}/export?days=30`)}>
        📥 Exporter Mes Données (CSV)
      </Button>
    </div>
  )
}
```

### **4.2 Lien Navigation (5min)**

**Ajouter dans sidebar:** `src/components/layout/app-sidebar.tsx`

```typescript
{
  title: "Mon Activité",
  icon: Activity,
  href: "/mon-activite",
  description: "Voir mon tracking"
}
```

### **4.3 RLS Policy Vérification (10min)**

**Vérifier dans migration que policy existe:**
```sql
-- Users voient UNIQUEMENT leur activité
CREATE POLICY "users_view_own_activity" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid());
```

**Si manquante, ajouter manuellement via SQL Editor Supabase**

---

## 🔒 **PHASE 5: Conformité RGPD & Transparence (1h)**

**Objectif:** Respect vie privée et conformité légale

### **5.1 Document Consentement (15min)**

**Fichier à créer:** `docs/legal/CONSENTEMENT-TRACKING-EMPLOYE.md`

(Voir template complet dans `BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md`)

**Actions:**
- [ ] Faire signer par chaque employé
- [ ] Stocker signatures (Supabase Storage ou DocuSign)
- [ ] Référence signature dans `user_profiles.consent_tracking_signed_at`

### **5.2 Auto-Purge Données (30min)**

**Créer Cron Job Supabase:**

```sql
-- Fonction auto-purge
CREATE OR REPLACE FUNCTION auto_purge_old_activity_logs()
RETURNS void AS $$
BEGIN
  -- Supprimer logs > 30 jours
  DELETE FROM user_activity_logs
  WHERE created_at < now() - interval '30 days';

  -- Archiver agrégations avant suppression
  INSERT INTO activity_logs_archive (user_id, date, action_count)
  SELECT
    user_id,
    DATE(created_at),
    COUNT(*)
  FROM user_activity_logs
  WHERE created_at < now() - interval '30 days'
  GROUP BY user_id, DATE(created_at)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Auto-purge completed: % logs deleted', (SELECT COUNT(*) FROM user_activity_logs WHERE created_at < now() - interval '30 days');
END;
$$ LANGUAGE plpgsql;

-- Cron job quotidien 3h du matin
SELECT cron.schedule(
  'auto-purge-activity-logs',
  '0 3 * * *', -- Tous les jours 3h
  $$ SELECT auto_purge_old_activity_logs(); $$
);
```

**Activer via Supabase Dashboard:**
1. Database → Extensions → Enable `pg_cron`
2. SQL Editor → Exécuter script ci-dessus

### **5.3 Anonymisation IP Production (15min)**

**Modifier API Events:**

```typescript
// src/app/api/analytics/events/route.ts

const anonymizeIP = (ip: string | null) => {
  if (!ip) return null
  if (process.env.NODE_ENV !== 'production') return ip

  // Production: Anonymiser
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`
  }
  return 'anonymized'
}

// Dans insert
ip_address: anonymizeIP(request.headers.get('x-real-ip'))
```

---

## 📅 **TIMELINE RECOMMANDÉE**

### **Semaine 1: Infrastructure** ✅ FAIT
- [x] Phase 1: Migration + API + Provider

### **Semaine 2: Dashboard Admin**
- [ ] Jour 1-2: Page Activity Overview
- [ ] Jour 3: Composant Historique
- [ ] Jour 4: Export CSV

### **Semaine 3: Métriques Connectées**
- [ ] Jour 1: Dashboard Stocks/Commandes
- [ ] Jour 2: User Activity Tab données réelles
- [ ] Jour 3: Tests & Debugging

### **Semaine 4: Transparence & RGPD**
- [ ] Jour 1: Page "Mon Activité"
- [ ] Jour 2: Consentements employés
- [ ] Jour 3: Auto-purge + Anonymisation
- [ ] Jour 4: Formation équipe

---

## ✅ **CHECKLIST VALIDATION COMPLÈTE**

### **Infrastructure**
- [ ] Migration Supabase appliquée
- [ ] Tables `user_activity_logs` + `user_sessions` créées
- [ ] Functions SQL testées
- [ ] API endpoints répondent correctement
- [ ] Provider React actif
- [ ] Tracking enregistre événements

### **Dashboard Admin**
- [ ] Page `/admin/activity-overview` créée
- [ ] Vue temps réel fonctionnelle
- [ ] Graphiques temps par module
- [ ] Export CSV disponible
- [ ] Permissions owners uniquement

### **Métriques Connectées**
- [ ] Dashboard métriques Stocks/Commandes réelles
- [ ] User Activity Tab données réelles
- [ ] Pas de données simulées restantes
- [ ] Calculs corrects

### **Transparence Employés**
- [ ] Page `/mon-activite` accessible
- [ ] Chaque user voit UNIQUEMENT ses données
- [ ] Export CSV personnel disponible
- [ ] RLS policies testées

### **RGPD & Conformité**
- [ ] Consentements signés TOUS employés
- [ ] Auto-purge 30 jours configuré
- [ ] IP anonymisées production
- [ ] Documentation tracking accessible
- [ ] Droit à l'oubli implémenté

---

## 🎯 **PROCHAINES ÉTAPES IMMÉDIATES**

### **Action Requise MAINTENANT:**

1. **Appliquer Migration Supabase** (5 min)
   ```bash
   cd /Users/romeodossantos/verone-back-office-V1
   supabase db push
   ```

2. **Redémarrer Serveur** (1 min)
   ```bash
   npm run dev
   ```

3. **Tester Tracking** (5 min)
   - Se connecter
   - Naviguer Dashboard → Catalogue
   - Créer produit
   - Vérifier DB:
     ```sql
     SELECT * FROM user_activity_logs ORDER BY created_at DESC LIMIT 10;
     ```

### **Après Tests OK:**

4. **Choisir Phase 2 ou 3** (votre décision)
   - Phase 2 = Dashboard Admin complet (priorité management)
   - Phase 3 = Métriques Dashboard réelles (priorité business KPIs)

5. **Planning Équipe** (1h)
   - Informer employés du tracking
   - Préparer consentements
   - Planifier formation

---

## 📚 **DOCUMENTATION COMPLÈTE**

**Guides Créés:**
- ✅ `docs/guides/GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md` - Guide technique complet
- ✅ `docs/reports/ETAT-LIEUX-METRIQUES-DASHBOARD-2025.md` - État actuel métriques
- ✅ `docs/guides/BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md` - Best practices éthiques
- ✅ `TASKS/ROADMAP-METRIQUES-ACTIVITE-2025.md` - Cette roadmap

**Code Créé:**
- ✅ Migration SQL complète avec functions/triggers
- ✅ 3 API endpoints analytics
- ✅ Provider React tracking automatique
- ✅ Hook connecté

**À Créer (Phases 2-5):**
- [ ] Page Activity Overview
- [ ] Composant Historique
- [ ] Export CSV
- [ ] Métriques Dashboard connectées
- [ ] Page Mon Activité
- [ ] Consentements RGPD

---

**🎉 Félicitations! Infrastructure Phase 1 terminée.**
**⏭️ Prochaine étape: Appliquer migration Supabase et tester!**

*Roadmap Métriques & Activité Utilisateur - Vérone Back Office 2025*
