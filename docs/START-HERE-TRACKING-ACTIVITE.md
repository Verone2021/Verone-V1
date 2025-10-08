# 🚀 START HERE - Système Tracking Activité Utilisateur

## ✅ CE QUI A ÉTÉ FAIT (Phase 1 Complète)

### **Infrastructure Créée (2h de travail)**

✅ **Tables Supabase:**
- `user_activity_logs` - Log chaque action utilisateur
- `user_sessions` - Agrégation sessions pour analytics

✅ **Functions SQL Automatiques:**
- `calculate_engagement_score(user_id, days)` → Score 0-100
- `get_user_recent_actions(user_id, limit)` → Dernières actions
- `get_user_activity_stats(user_id, days)` → Stats période

✅ **API Endpoints:**
- `POST /api/analytics/events` - Enregistrer événement
- `POST /api/analytics/batch` - Batch événements
- `GET /api/admin/users/[id]/activity` - Récupérer activité

✅ **Frontend Intégration:**
- Provider React `ActivityTrackerProvider` dans layout
- Hook `use-user-activity-tracker` activé
- Tracking automatique page views + clics + erreurs

---

## ⚡ ACTION IMMÉDIATE (5 MINUTES)

### **1. Appliquer Migration Supabase**

```bash
cd /Users/romeodossantos/verone-back-office-V1
supabase db push
```

**OU via Dashboard Supabase:**
1. Ouvrir https://supabase.com/dashboard
2. SQL Editor → New Query
3. Copier contenu de `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
4. Run Query

### **2. Redémarrer Serveur**

```bash
npm run dev
```

### **3. Test Tracking (2 minutes)**

1. Se connecter à l'application
2. Naviguer Dashboard → Catalogue
3. Créer un produit
4. Vérifier dans Supabase SQL Editor:

```sql
-- Voir derniers événements
SELECT action, page_url, created_at
FROM user_activity_logs
ORDER BY created_at DESC
LIMIT 10;

-- Voir sessions actives
SELECT * FROM user_sessions
WHERE session_end IS NULL;
```

**✅ Si vous voyez des données → Tracking fonctionne!**

---

## 📊 CE QUI EST MAINTENANT DISPONIBLE

### **Métriques Automatiques par Utilisateur**

| Métrique | Comment l'obtenir | Exemple Valeur |
|----------|-------------------|----------------|
| **Engagement Score** | `SELECT calculate_engagement_score('user-id', 30);` | 75/100 |
| **Sessions Totales** | `SELECT total_sessions FROM get_user_activity_stats('user-id', 30);` | 25 sessions |
| **Actions Totales** | `SELECT total_actions FROM get_user_activity_stats('user-id', 30);` | 150 actions |
| **Module Favori** | `SELECT most_used_module FROM get_user_activity_stats('user-id', 30);` | "catalogue" |
| **Dernière Activité** | `SELECT last_activity FROM get_user_activity_stats('user-id', 30);` | 2025-10-07 14:32 |

### **Temps par Module (Automatique)**

Stocké dans `user_sessions.time_per_module` (JSON):
```json
{
  "dashboard": 120,
  "catalogue": 300,
  "stocks": 45,
  "commandes": 89,
  "sourcing": 23
}
```

**Récupération:**
```sql
SELECT
  session_id,
  time_per_module->>'dashboard' as temps_dashboard,
  time_per_module->>'catalogue' as temps_catalogue
FROM user_sessions
WHERE user_id = 'user-id';
```

---

## 📈 ÉTAT MÉTRIQUES DASHBOARD

### **✅ Connectées (Données Réelles)**

- Total Produits
- Produits Actifs
- Collections
- Fournisseurs
- Clients B2B
- Groupes Variantes

### **❌ Mock (À Connecter Phase 3)**

- Valeur Stock (actuellement = 0)
- Commandes Achat (actuellement = 0)
- CA du Mois (actuellement = 0)
- À Sourcer (actuellement = 0)

**Fichier à modifier:** `src/hooks/use-complete-dashboard-metrics.ts` (lignes 87-104)

---

## 🗺️ ROADMAP PHASES SUIVANTES

### **Phase 2: Dashboard Admin (3-4h)**
- Page `/admin/activity-overview` - Vue équipe temps réel
- Composant historique activité
- Export CSV activité

### **Phase 3: Métriques Connectées (2h)**
- Dashboard Stocks/Commandes/Sourcing réels
- User Activity Tab données réelles
- Remplacement tous les mocks

### **Phase 4: Transparence Employés (1h)**
- Page `/mon-activite` - Chaque user voit son tracking
- Export CSV personnel
- Lien dans sidebar

### **Phase 5: RGPD Conformité (1h)**
- Consentements signés
- Auto-purge 30 jours
- Anonymisation IP production

---

## 📚 DOCUMENTATION COMPLÈTE

### **Guides Techniques**
- 📘 `docs/guides/GUIDE-TRACKING-ACTIVITE-UTILISATEUR.md` - Guide complet utilisation
- 📊 `docs/reports/ETAT-LIEUX-METRIQUES-DASHBOARD-2025.md` - État métriques actuel
- 🗺️ `TASKS/ROADMAP-METRIQUES-ACTIVITE-2025.md` - Roadmap détaillée phases

### **Best Practices**
- 🏢 `docs/guides/BEST-PRACTICES-TRACKING-EMPLOYÉS-DISTANTS.md` - Éthique & RGPD
- ✅ Transparence totale
- ✅ Pas surveillance invasive
- ✅ Focus productivité, pas punition

### **Code Créé**
- `supabase/migrations/20251007_003_user_activity_tracking_system.sql`
- `src/app/api/analytics/events/route.ts`
- `src/app/api/analytics/batch/route.ts`
- `src/app/api/admin/users/[id]/activity/route.ts`
- `src/components/providers/activity-tracker-provider.tsx`

---

## 🔧 UTILISATION DANS VOTRE CODE

### **Tracking Manuel Action Importante**

```typescript
'use client'

import { useUserActivityTracker } from '@/hooks/use-user-activity-tracker'

export function MyComponent() {
  const { trackEvent } = useUserActivityTracker()

  const handleCreateProduct = async (data) => {
    // ... logique création

    // Track action
    trackEvent({
      action: 'create_product',
      table_name: 'products',
      record_id: newProduct.id,
      new_data: { name: newProduct.name }
    })
  }
}
```

### **Récupérer Activité User (Admin)**

```typescript
// Dans page admin
const [activity, setActivity] = useState(null)

useEffect(() => {
  fetch(`/api/admin/users/${userId}/activity?limit=50&days=30`)
    .then(res => res.json())
    .then(data => {
      console.log('Engagement score:', data.statistics.engagement_score)
      console.log('Dernières actions:', data.recent_actions)
    })
}, [userId])
```

---

## 🎯 PROCHAINES DÉCISIONS À PRENDRE

### **Question 1: Niveau Tracking Souhaité?**

- ⚡ **Simple** (recommandé): Pages + Actions CRUD uniquement
- 📊 **Moyen**: + Temps module + Clics importants
- 🔍 **Avancé**: + Tous clics + Erreurs + Performance

**Actuel:** Simple (automatique)

### **Question 2: Dashboard Admin Priorité?**

- Option A: Dashboard Admin temps réel (Phase 2 AVANT)
- Option B: Métriques Stocks/Commandes (Phase 3 AVANT)

**Recommandation:** Phase 2 si focus management équipe, Phase 3 si focus KPIs business

### **Question 3: Transparence Employés?**

- ✅ Créer page "Mon Activité" (Phase 4)?
- ✅ Consentements formels signés (Phase 5)?

**Recommandation:** OUI aux 2 pour conformité RGPD

---

## ❓ TROUBLESHOOTING

### **Problème: Événements pas enregistrés**

1. Vérifier migration appliquée:
   ```sql
   SELECT * FROM user_activity_logs LIMIT 1;
   ```
   Si erreur → Appliquer migration

2. Vérifier user authentifié:
   - Console browser → Vérifier pas d'erreur `[Analytics]`

3. Vérifier API fonctionne:
   ```bash
   curl -X POST http://localhost:3000/api/analytics/events \
     -H "Content-Type: application/json" \
     -d '{"action":"test"}'
   ```

### **Problème: API 401 Unauthorized**

- User non connecté → Se reconnecter
- Token expiré → Refresh page

---

## ✅ CHECKLIST VALIDATION

- [ ] Migration Supabase appliquée
- [ ] Serveur dev redémarré
- [ ] Événement `page_view` enregistré après navigation
- [ ] Table `user_sessions` contient session active
- [ ] API `/api/admin/users/[id]/activity` retourne données
- [ ] RLS policies fonctionnent (owners voient tout)

---

## 🚀 PROCHAINE ÉTAPE

**Choisir votre priorité:**

### **Option A: Tests & Validation (30min)**
→ Appliquer migration + Tester tracking complet

### **Option B: Phase 2 Dashboard Admin (3-4h)**
→ Créer interface admin activité équipe

### **Option C: Phase 3 Métriques Réelles (2h)**
→ Connecter Dashboard Stocks/Commandes

---

**🎉 Infrastructure Tracking Prête!**
**👉 Action: Appliquer migration Supabase maintenant**

*Guide Quick Start - Système Tracking Activité Vérone 2025*
