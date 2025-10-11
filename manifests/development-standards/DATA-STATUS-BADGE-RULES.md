# 🏷️ Data Status Badge - Règles d'Usage Vérone

**Date création** : 2025-10-11
**Version** : 1.0
**Statut** : ✅ Standard officiel Vérone

---

## 🎯 OBJECTIF

Documenter visuellement l'état d'implémentation des données affichées dans l'application Vérone.

**Problème résolu** :
- ❌ Avant : Impossible de distinguer données RÉELLES vs MOCK
- ✅ Après : Badge visuel clair sur chaque métrique/statistique

---

## 📋 RÈGLES D'USAGE

### **Règle #1 : Badge Obligatoire sur Toute Métrique**

**OBLIGATOIRE** pour toutes les statistiques, métriques, KPIs dans l'interface.

**Exemples** :
- ✅ Dashboard : Cartes stats (sessions, revenus, taux conversion)
- ✅ Admin Users : Analytics utilisateur (engagement, durée session)
- ✅ Catalogue : Métriques produits (vues, ventes, stock)
- ✅ Finance : Indicateurs comptables (CA, dépenses, marges)

### **Règle #2 : Type "real" = Données Base de Données**

Utiliser `type="real"` si et seulement si :
- ✅ Données lues depuis Supabase (via query/RPC)
- ✅ Données provenant d'API externe authentifiée
- ✅ Données calculées EN BASE (fonctions SQL, triggers)

**Exemples concrets** :

```typescript
// ✅ RÉEL : Query Supabase
const { data } = await supabase
  .from('user_sessions')
  .select('count')
<DataStatusBadge type="real" />

// ✅ RÉEL : RPC Function
const stats = await supabase.rpc('get_user_activity_stats')
<DataStatusBadge type="real" />

// ✅ RÉEL : API Externe (Qonto, Stripe)
const balance = await qontoApi.getBalance()
<DataStatusBadge type="real" />
```

### **Règle #3 : Type "mock" = Données Calculées ou Temporaires**

Utiliser `type="mock"` si :
- ⚠️ Données calculées côté FRONTEND (Math.round, formule JS)
- ⚠️ Données hardcodées temporairement
- ⚠️ Fonctionnalité pas encore implémentée (retourne 0 ou null)
- ⚠️ Placeholder en attendant développement

**Exemples concrets** :

```typescript
// ⚠️ MOCK : Calcul frontend (pas dans RPC)
const productivity = Math.round(sessions * duration / days)
<DataStatusBadge type="mock" />

// ⚠️ MOCK : RPC retourne NULL (avg_session_duration)
const avgDuration = stats.avg_session_duration || 0
<DataStatusBadge type="mock" />

// ⚠️ MOCK : Hardcodé temporairement
const conversionRate = 2.5 // TODO: Implémenter calcul réel
<DataStatusBadge type="mock" />
```

### **Règle #4 : Placement Visuel Standard**

**Position** : Coin supérieur droit du conteneur

```tsx
<div className="relative border p-4">
  <DataStatusBadge type="real" className="absolute top-2 right-2" />
  {/* Contenu métrique */}
</div>
```

**Exception** : Mode compact si espace limité

```tsx
<DataStatusBadge type="real" compact />
```

### **Règle #5 : Badge Reste Même Après Implémentation**

**Ne JAMAIS retirer le badge** une fois données RÉELLES implémentées.

**Workflow** :
1. Développement initial → `type="mock"`
2. Implémentation complète → `type="real"`
3. **Badge reste définitivement** → Traçabilité audit

---

## 🎨 DESIGN VÉRONE

### Couleurs Autorisées

| Type | Couleur Border | Couleur Text | Icône | Signification |
|------|---------------|--------------|-------|---------------|
| **real** | `border-green-600` | `text-green-600` | CheckCircle2 | Données validées |
| **mock** | `border-orange-500` | `text-orange-500` | AlertCircle | En développement |

**INTERDIT** : Jaune/Doré/Ambre (hors charte Vérone)

### Styles Respectés

```typescript
// ✅ CORRECT : Design Vérone minimaliste
bg-white border text-[10px] px-1.5 py-0.5

// ❌ INCORRECT : Trop coloré/flashy
bg-gradient-to-r from-green-400 to-blue-500
```

---

## 📦 IMPLÉMENTATION TECHNIQUE

### Import Component

```typescript
import { DataStatusBadge } from '@/components/ui/data-status-badge'
```

### Usage Basique

```tsx
// Badge "Données réelles"
<DataStatusBadge type="real" />

// Badge "Mock à développer"
<DataStatusBadge type="mock" />

// Badge compact (icône seule)
<DataStatusBadge type="mock" compact />

// Avec classes custom
<DataStatusBadge
  type="real"
  className="absolute top-2 right-2 z-10"
/>
```

### Helper Hook (optionnel)

```typescript
import { useDataStatus } from '@/components/ui/data-status-badge'

// Détection automatique
const badgeType = useDataStatus(
  stats.total_sessions > 0 ? 'database' : 'calculated'
)
<DataStatusBadge type={badgeType} />
```

---

## ✅ CHECKLIST VALIDATION

Avant merge PR contenant nouvelles métriques :

- [ ] Toutes les cartes stats ont un badge
- [ ] Type correct (`real` si BDD, `mock` si calculé)
- [ ] Position standard (`absolute top-2 right-2`)
- [ ] Couleurs Vérone respectées (vert/orange, pas jaune)
- [ ] Build TypeScript OK (pas d'erreur `DataStatusBadge`)
- [ ] Screenshot preuve badges visibles
- [ ] Documentation mise à jour si nouveau pattern

---

## 📊 EXEMPLES RÉELS VÉRONE

### Admin Users - UserStatsCards

**Fichier** : `src/app/admin/users/[id]/components/user-stats-cards.tsx`

| Métrique | Type | Raison |
|----------|------|--------|
| Sessions totales | `real` | Query `user_sessions.count()` |
| Durée moy. session | `mock` | RPC retourne NULL |
| Fréquence | `real` | Calculé depuis `engagement_score` (RPC) |
| Engagement | `real` | RPC `get_user_activity_stats` |
| Ancienneté | `real` | Calcul depuis `user.created_at` (BDD) |
| Statut | `real` | Basé sur `last_sign_in_at` (BDD) |
| Type compte | `real` | Depuis `user_profiles.user_type` |
| Productivité | `mock` | Formule frontend (à migrer RPC) |

**Code exemple** :

```tsx
{/* Sessions totales - RÉEL */}
<div className="relative border p-4">
  <DataStatusBadge type="real" className="absolute top-2 right-2" />
  <p className="text-sm">Sessions totales</p>
  <p className="text-2xl font-bold">{user.analytics.total_sessions}</p>
</div>

{/* Durée session - MOCK */}
<div className="relative border p-4">
  <DataStatusBadge type="mock" className="absolute top-2 right-2" />
  <p className="text-sm">Durée moy. session</p>
  <p className="text-2xl font-bold">{user.analytics.avg_session_duration}min</p>
</div>
```

---

## 🔄 WORKFLOW MIGRATION MOCK → RÉEL

### Étape 1 : Identifier Mock

```tsx
// État initial
<DataStatusBadge type="mock" />
<p>{calculatedValue}</p>
```

### Étape 2 : Implémenter en Base

```sql
-- Créer RPC ou migrer calcul en SQL
CREATE FUNCTION calculate_metric() RETURNS ...
```

### Étape 3 : Modifier Frontend

```tsx
// Remplacer calcul frontend par query
const { data } = await supabase.rpc('calculate_metric')
```

### Étape 4 : Changer Badge

```tsx
// Passer mock → real
<DataStatusBadge type="real" />
<p>{data.metric_value}</p>
```

### Étape 5 : Valider

- [ ] Build OK
- [ ] Console 0 erreur
- [ ] Screenshot nouveau badge vert
- [ ] Commit avec message clair

---

## 🚨 CAS PARTICULIERS

### Données Mixtes (Partiellement Réelles)

Si métrique combine RÉEL + MOCK → **Badge MOCK** (principe conservateur)

**Exemple** :

```typescript
// avg_session_duration = NULL (MOCK)
// total_sessions = 3 (RÉEL)
// → Combinaison = MOCK car un des deux est mock

const productivity = sessions * avgDuration / days
<DataStatusBadge type="mock" /> // ← MOCK car avgDuration mock
```

### Données Externes API (Qonto, Stripe)

API externe authentifiée = **RÉEL**

```typescript
// ✅ RÉEL : API Qonto validée
const balance = await qontoClient.getBalance()
<DataStatusBadge type="real" />
```

### Données Calculées MAIS Fiables

Si calcul simple depuis données BDD fiables → **RÉEL**

```typescript
// ✅ RÉEL : Calcul simple depuis created_at (BDD)
const daysSinceCreation = Math.floor(
  (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
)
<DataStatusBadge type="real" />
```

---

## 📚 RÉFÉRENCES

### Documentation
- Component source : `src/components/ui/data-status-badge.tsx`
- Exemple usage : `src/app/admin/users/[id]/components/user-stats-cards.tsx`
- Pattern réutilisable : `MEMORY-BANK/patterns/data-status-badge-pattern.md`

### Sessions Related
- Fix tracking : `MEMORY-BANK/sessions/2025-10-11-RAPPORT-USER-ACTIVITY-TRACKING-FIX-COMPLET.md`
- Admin Users tests : `MEMORY-BANK/sessions/2025-10-10-RAPPORT-FINAL-SESSION-COMPLETE.md`

### Design System
- Couleurs Vérone : `CLAUDE.md` section Design System
- Components UI : `src/components/ui/`

---

## 🎯 RÉSUMÉ EXÉCUTIF

**Règle simple** :
- 🟢 Base de données ou API = `type="real"`
- 🟠 Calcul frontend ou NULL = `type="mock"`

**Badge obligatoire** : Toute métrique/statistique/KPI

**Position standard** : `absolute top-2 right-2`

**Ne jamais retirer** : Badge reste même après migration MOCK → RÉEL

---

**Standard créé** : 2025-10-11
**Version** : 1.0
**Auteur** : Claude Code + Workflow 2025

*Vérone Back Office - Professional Data Documentation Excellence*
