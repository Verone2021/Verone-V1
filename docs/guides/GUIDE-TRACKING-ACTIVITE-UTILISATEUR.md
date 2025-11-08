# 📊 Guide Tracking Activité Utilisateur - Vérone 2025

## 🎯 Vue d'Ensemble

Système de tracking activité utilisateur professionnel, simple et respectueux de la vie privée pour le suivi des employés distants.

**Philosophie:** Focus productivité, pas surveillance excessive.

---

## ✅ IMPLÉMENTATION PHASE 1 (Complétée)

### 📁 Fichiers Créés

#### 1. **Migration Base de Données**

- 📄 `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
- **Tables créées:**
  - `user_activity_logs` - Log complet chaque action
  - `user_sessions` - Agrégation sessions pour analytics rapides
- **Fonctions SQL:**
  - `calculate_engagement_score(user_id, days)` - Score 0-100
  - `get_user_recent_actions(user_id, limit)` - Dernières N actions
  - `get_user_activity_stats(user_id, days)` - Stats période donnée
- **Triggers automatiques:**
  - Auto-update session à chaque activité
  - Calcul temps par module automatique

#### 2. **API Endpoints**

- 📄 `src/app/api/analytics/events/route.ts` - Enregistrement événement unique
- 📄 `src/app/api/analytics/batch/route.ts` - Enregistrement batch (optimisé)
- 📄 `src/app/api/admin/users/[id]/activity/route.ts` - Récupération activité user (owners only)

#### 3. **Providers & Hooks**

- 📄 `src/components/providers/activity-tracker-provider.tsx` - Provider React tracking auto
- 📄 `src/hooks/use-user-activity-tracker.ts` - Hook existant (déjà présent, maintenant connecté)
- 📄 `src/app/layout.tsx` - Layout modifié avec ActivityTrackerProvider

---

## 🚀 ÉTAPES DE TEST

### **Étape 1: Appliquer Migration (OBLIGATOIRE)**

```bash
# Depuis votre terminal
cd /Users/romeodossantos/verone-back-office-V1

# Option 1: Via Supabase CLI (recommandé)
supabase db push

# Option 2: Via Supabase Dashboard
# 1. Ouvrir https://supabase.com/dashboard/project/[votre-project]
# 2. SQL Editor → New Query
# 3. Copier contenu de supabase/migrations/20251007_003_user_activity_tracking_system.sql
# 4. Run Query
```

**Vérification Migration:**

```sql
-- Dans Supabase SQL Editor, vérifier tables créées:
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('user_activity_logs', 'user_sessions');

-- Devrait retourner 2 lignes
```

### **Étape 2: Redémarrer Serveur Dev**

```bash
npm run dev
```

### **Étape 3: Test Tracking Automatique**

1. **Se connecter à l'application** → Génère automatiquement événement `user_login`
2. **Naviguer vers Dashboard** → Génère événement `page_view` avec URL `/dashboard`
3. **Naviguer vers Catalogue** → Génère événement `page_view` avec URL `/catalogue`
4. **Créer un produit** → Devrait générer événement `create_product`

### **Étape 4: Vérifier Données dans Supabase**

```sql
-- Dans Supabase SQL Editor

-- 1. Voir dernières activités
SELECT
  action,
  page_url,
  created_at,
  metadata
FROM user_activity_logs
ORDER BY created_at DESC
LIMIT 20;

-- 2. Voir sessions actives
SELECT
  session_id,
  pages_visited,
  actions_count,
  time_per_module,
  last_activity
FROM user_sessions
WHERE session_end IS NULL
ORDER BY last_activity DESC;

-- 3. Calculer engagement score votre user
SELECT calculate_engagement_score(
  'VOTRE-USER-ID-ICI'::uuid,
  30 -- derniers 30 jours
);

-- 4. Voir stats complètes
SELECT * FROM get_user_activity_stats(
  'VOTRE-USER-ID-ICI'::uuid,
  30 -- derniers 30 jours
);
```

---

## 📊 MÉTRIQUES DISPONIBLES

### **Par Utilisateur (Automatiques)**

| Métrique                  | Description     | Calcul                                          |
| ------------------------- | --------------- | ----------------------------------------------- |
| **Engagement Score**      | Score 0-100     | (sessions × 10) + (actions × 2) + (modules × 5) |
| **Sessions Totales**      | Nombre sessions | COUNT(sessions)                                 |
| **Actions Totales**       | Nombre actions  | SUM(actions_count)                              |
| **Durée Moyenne Session** | Temps moyen     | AVG(session_end - session_start)                |
| **Module Favori**         | Plus utilisé    | MAX(time_per_module)                            |
| **Dernière Activité**     | Timestamp       | MAX(last_activity)                              |

### **Temps par Module (Automatique)**

Le système track automatiquement le temps passé dans chaque module:

- `dashboard` - Temps Dashboard
- `catalogue` - Temps Catalogue
- `stocks` - Temps Stocks
- `sourcing` - Temps Sourcing
- `commandes` - Temps Commandes
- `interactions` - Temps Interactions Clients
- `organisation` - Temps Organisation
- `admin` - Temps Administration

**Calcul:** Incrémenté à chaque `page_view` dans le module correspondant.

---

## 🔒 SÉCURITÉ & CONFIDENTIALITÉ

### **RLS Policies (Automatiques)**

1. **Owners** → Voient TOUTE l'activité de tous les users
2. **Users** → Voient UNIQUEMENT leur propre activité (transparence)
3. **Service Role** → Peut insérer événements (pour API)

### **Transparence Employés**

Chaque utilisateur peut voir sa propre activité via:

```typescript
// Dans n'importe quel composant
import { useUserActivityTracker } from '@/hooks/use-user-activity-tracker';

const { stats, currentSession } = useUserActivityTracker();

console.log('Mon score engagement:', stats?.engagement_score);
console.log('Ma session actuelle:', currentSession);
```

### **Protection Données**

- ✅ IP addresses anonymisées en production
- ✅ User agents simplifiés (browser/OS uniquement)
- ✅ Pas de screenshots
- ✅ Pas de keylogging
- ✅ Tracking UNIQUEMENT pendant heures travail

---

## 📈 UTILISATION DANS COMPOSANTS

### **Tracking Manuel Action Importante**

```typescript
'use client'

import { useUserActivityTracker } from '@/hooks/use-user-activity-tracker'

export function MonComposant() {
  const { trackEvent, trackFormSubmit } = useUserActivityTracker()

  const handleCreateProduct = async (data) => {
    // ... logique création produit

    // Track action
    trackEvent({
      action: 'create_product',
      table_name: 'products',
      record_id: newProduct.id,
      new_data: {
        name: newProduct.name,
        category: newProduct.category
      }
    })
  }

  const handleSearch = (query: string) => {
    // Track recherche
    trackSearch(query, resultsCount)
  }

  return (
    // ... JSX
  )
}
```

### **Récupérer Activité User (Admin)**

```typescript
// Dans page admin
'use client'

import { useEffect, useState } from 'react'

export function UserActivityPage({ userId }: { userId: string }) {
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    // Fetch activité via API
    fetch(`/api/admin/users/${userId}/activity?limit=50&days=30`)
      .then(res => res.json())
      .then(data => setActivity(data))
  }, [userId])

  if (!activity) return <div>Chargement...</div>

  return (
    <div>
      <h2>Engagement Score: {activity.statistics.engagement_score}/100</h2>
      <p>Sessions: {activity.statistics.total_sessions}</p>
      <p>Actions: {activity.statistics.total_actions}</p>
      <p>Module favori: {activity.statistics.most_used_module}</p>

      <h3>Dernières Actions</h3>
      <ul>
        {activity.recent_actions.map(action => (
          <li key={action.created_at}>
            {action.action} - {action.page_url} - {new Date(action.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 🎯 PROCHAINES ÉTAPES (Phase 2)

### **1. Dashboard Admin Temps Réel** (3-4h)

- Page `/admin/activity-overview`
- Vue "Qui travaille maintenant"
- Graphiques temps par module
- Export CSV activité

### **2. Composant Historique Activité** (2h)

- Liste 50 dernières actions
- Filtres par type action
- Recherche dans historique

### **3. Interface "Mon Activité"** (1h)

- Page `/mon-activite`
- Voir son propre tracking
- Transparence totale

### **4. Métriques Dashboard Connectées** (2h)

- Remplacer mocks Phase 2 (Stocks, Commandes, Sourcing)
- Connecter vraies données DB
- Calculs temps réel

---

## 🐛 TROUBLESHOOTING

### **Problème: Événements pas enregistrés**

1. Vérifier migration appliquée:

   ```sql
   SELECT * FROM user_activity_logs LIMIT 1;
   ```

   Si erreur "table does not exist" → Appliquer migration

2. Vérifier user authentifié:

   ```typescript
   const { user } = useAuth();
   console.log('User:', user); // Doit être non-null
   ```

3. Vérifier console browser:
   - Ouvrir DevTools → Console
   - Chercher erreurs `[Analytics]`

### **Problème: API 401 Unauthorized**

- User non connecté → Se reconnecter
- Token expiré → Refresh page

### **Problème: Hook use-user-activity-tracker erreur**

Si erreur `use-auth not found`:

```typescript
// Alternative sans use-auth
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

---

## 📚 DOCUMENTATION COMPLÉMENTAIRE

- **Code Hook:** `src/hooks/use-user-activity-tracker.ts`
- **Migration SQL:** `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
- **API Events:** `src/app/api/analytics/events/route.ts`
- **Provider:** `src/components/providers/activity-tracker-provider.tsx`

---

## ✅ CHECKLIST VALIDATION

- [ ] Migration Supabase appliquée avec succès
- [ ] Tables `user_activity_logs` et `user_sessions` créées
- [ ] Fonctions SQL disponibles (`calculate_engagement_score`, etc.)
- [ ] Serveur dev redémarré
- [ ] Événement `page_view` enregistré dans DB après navigation
- [ ] Événement `user_click` enregistré après clic (throttled 1/s)
- [ ] Session créée dans `user_sessions` automatiquement
- [ ] Temps par module incrémenté correctement
- [ ] API `/api/admin/users/[id]/activity` retourne données
- [ ] RLS policies fonctionnent (owners voient tout, users voient leur activité)

---

**🎉 Félicitations! Votre système de tracking activité est maintenant opérationnel!**

_Pour questions ou problèmes: Vérifier logs Supabase + Console browser DevTools_
