# 🎨 Pattern Réutilisable : Data Status Badge

**Type** : UI Component Pattern
**Contexte** : Vérone Back Office CRM/ERP
**Objectif** : Standardiser identification visuelle données RÉELLES vs MOCK
**Créé** : 2025-10-11

---

## 🧩 COMPOSANT CORE

```typescript
/**
 * src/components/ui/data-status-badge.tsx
 *
 * Badge visuel réutilisable pour documenter source données
 */

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DataStatusType = 'real' | 'mock'

export interface DataStatusBadgeProps {
  type: DataStatusType
  className?: string
  compact?: boolean
}

export function DataStatusBadge({ type, className, compact = false }: DataStatusBadgeProps) {
  const config = {
    real: {
      icon: CheckCircle2,
      label: 'Réel',
      borderColor: 'border-green-600',
      textColor: 'text-green-600',
      title: 'Données réelles depuis la base de données'
    },
    mock: {
      icon: AlertCircle,
      label: 'Mock',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-500',
      title: 'Données mockées - fonctionnalité à développer'
    }
  }[type]

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium',
        'bg-white border transition-colors',
        config.borderColor,
        config.textColor,
        className
      )}
      title={config.title}
    >
      <Icon className={cn('h-3 w-3', config.textColor)} />
      {!compact && <span>{config.label}</span>}
    </span>
  )
}
```

---

## 📋 PATTERNS D'APPLICATION

### Pattern #1 : Cartes Statistiques (Stats Cards)

**Contexte** : Dashboard, KPIs, Analytics

```tsx
// Template card avec badge
<div className="relative bg-white border border-black p-4">
  {/* Badge position standard */}
  <DataStatusBadge
    type={dataSource === 'database' ? 'real' : 'mock'}
    className="absolute top-2 right-2"
  />

  {/* Contenu métrique */}
  <div className="space-y-1">
    <p className="text-sm opacity-60">Nom Métrique</p>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-50">Description</p>
  </div>
</div>
```

**Exemples concrets** :

```tsx
// Dashboard : Revenus mensuels (RÉEL - depuis financial_payments)
<div className="relative border p-4">
  <DataStatusBadge type="real" className="absolute top-2 right-2" />
  <p className="text-sm">Revenus mois</p>
  <p className="text-2xl">{revenueData.total}€</p>
</div>

// Dashboard : Taux conversion (MOCK - formule frontend)
<div className="relative border p-4">
  <DataStatusBadge type="mock" className="absolute top-2 right-2" />
  <p className="text-sm">Taux conversion</p>
  <p className="text-2xl">{(sales / views * 100).toFixed(1)}%</p>
</div>
```

---

### Pattern #2 : Tableaux de Données (Data Tables)

**Contexte** : Listes produits, commandes, utilisateurs

```tsx
// Colonnes table avec badge header
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>
        <div className="flex items-center gap-2">
          Métrique
          <DataStatusBadge type="real" compact />
        </div>
      </TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

---

### Pattern #3 : Graphiques (Charts)

**Contexte** : Courbes, barres, diagrammes

```tsx
// Container graphique avec badge
<div className="relative">
  <DataStatusBadge type="real" className="absolute top-4 right-4 z-10" />

  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={chartData}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

### Pattern #4 : Formulaires Avec Calculs Auto

**Contexte** : Devis, facturation, commandes

```tsx
// Champs calculés automatiquement
<div className="space-y-4">
  {/* Prix unitaire (RÉEL - depuis products) */}
  <div className="flex items-center justify-between">
    <label>Prix unitaire</label>
    <div className="flex items-center gap-2">
      <span>{product.price}€</span>
      <DataStatusBadge type="real" compact />
    </div>
  </div>

  {/* Total HT (MOCK - calcul JS temporaire) */}
  <div className="flex items-center justify-between">
    <label>Total HT</label>
    <div className="flex items-center gap-2">
      <span>{quantity * product.price}€</span>
      <DataStatusBadge type="mock" compact />
    </div>
  </div>
</div>
```

---

## 🎯 MAPPING AUTOMATIQUE DATA SOURCE → BADGE TYPE

### Helper Hook (Recommandé)

```typescript
// src/hooks/use-data-status.ts

export type DataSource = 'database' | 'api' | 'calculated' | 'mock'

export function useDataStatus(source: DataSource): DataStatusType {
  switch (source) {
    case 'database':
    case 'api':
      return 'real'
    case 'calculated':
    case 'mock':
      return 'mock'
  }
}

// Usage
const badgeType = useDataStatus(
  stats.from_database ? 'database' : 'calculated'
)
<DataStatusBadge type={badgeType} />
```

### Détection Automatique (Avancé)

```typescript
// Fonction helper générique
function detectDataStatus(value: any, metadata?: {
  source?: 'database' | 'api' | 'calculated'
  rpcFunctionUsed?: boolean
  hasNullFallback?: boolean
}): DataStatusType {
  // Si source explicite
  if (metadata?.source === 'database' || metadata?.source === 'api') {
    return 'real'
  }

  // Si RPC utilisé
  if (metadata?.rpcFunctionUsed) {
    return 'real'
  }

  // Si fallback 0/null (signe de mock)
  if (metadata?.hasNullFallback && value === 0) {
    return 'mock'
  }

  // Défaut conservateur
  return 'mock'
}
```

---

## 📦 TEMPLATES MODULES VÉRONE

### Template Dashboard

```tsx
// src/app/dashboard/page.tsx

export default function DashboardPage() {
  // Fetch stats RÉELLES
  const { data: realStats } = useSupabaseQuery('dashboard-stats', async (sb) => {
    return await sb.rpc('get_dashboard_kpis')
  })

  // Calculs MOCK (à migrer)
  const mockConversionRate = (realStats?.sales || 0) / (realStats?.views || 1) * 100

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* KPI RÉEL */}
      <div className="relative border p-4">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <p className="text-sm">Ventes totales</p>
        <p className="text-2xl">{realStats?.total_sales}</p>
      </div>

      {/* KPI MOCK */}
      <div className="relative border p-4">
        <DataStatusBadge type="mock" className="absolute top-2 right-2" />
        <p className="text-sm">Taux conversion</p>
        <p className="text-2xl">{mockConversionRate.toFixed(1)}%</p>
      </div>
    </div>
  )
}
```

### Template Catalogue

```tsx
// src/app/catalogue/components/product-stats.tsx

export function ProductStats({ product }: { product: Product }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Stats RÉELLES (depuis products table) */}
      <div className="relative border p-4">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <p className="text-sm">Prix vente</p>
        <p className="text-2xl">{product.selling_price}€</p>
      </div>

      {/* Stats MOCK (à calculer depuis orders) */}
      <div className="relative border p-4">
        <DataStatusBadge type="mock" className="absolute top-2 right-2" />
        <p className="text-sm">CA généré</p>
        <p className="text-2xl">0€</p>
      </div>
    </div>
  )
}
```

### Template Finance

```tsx
// src/app/factures/components/invoice-summary.tsx

export function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <div className="space-y-4">
      {/* Montant RÉEL (depuis financial_payments) */}
      <div className="flex items-center justify-between">
        <span>Montant TTC</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{invoice.total_ttc}€</span>
          <DataStatusBadge type="real" compact />
        </div>
      </div>

      {/* Échéance MOCK (à calculer depuis payment_terms) */}
      <div className="flex items-center justify-between">
        <span>Date échéance</span>
        <div className="flex items-center gap-2">
          <span>-</span>
          <DataStatusBadge type="mock" compact />
        </div>
      </div>
    </div>
  )
}
```

---

## 🔄 WORKFLOW STANDARD

### 1. Nouvelle Feature → Badge MOCK par Défaut

```tsx
// Phase 1 : Développement initial
<div className="relative border p-4">
  <DataStatusBadge type="mock" className="absolute top-2 right-2" />
  <p>Métrique future</p>
  <p className="text-2xl">0</p>
</div>
```

### 2. Implémentation Backend → Passer à RÉEL

```sql
-- Créer RPC ou query
CREATE FUNCTION get_metric() RETURNS numeric AS $$
  SELECT COUNT(*) FROM table
$$ LANGUAGE sql;
```

```tsx
// Phase 2 : Données RÉELLES implémentées
const { data } = await supabase.rpc('get_metric')

<div className="relative border p-4">
  <DataStatusBadge type="real" className="absolute top-2 right-2" />
  <p>Métrique</p>
  <p className="text-2xl">{data}</p>
</div>
```

### 3. Badge Reste Définitivement

**Ne jamais retirer** le badge même après migration MOCK → RÉEL.

**Raison** : Traçabilité audit + documentation vivante

---

## ✅ CHECKLIST INTÉGRATION

Avant d'ajouter une nouvelle métrique/statistique :

- [ ] Badge `DataStatusBadge` importé
- [ ] Type correct (`real` ou `mock`) défini
- [ ] Position standard `absolute top-2 right-2`
- [ ] Tooltip title explicite (auto via component)
- [ ] Build TypeScript sans erreur
- [ ] Screenshot validation visuelle

---

## 🎨 VARIANTES DESIGN

### Variante Compact (Icône Seule)

**Usage** : Espace limité (mobile, tableaux denses)

```tsx
<DataStatusBadge type="real" compact />
```

### Variante Custom Position

**Usage** : Layouts spécifiques

```tsx
<DataStatusBadge
  type="mock"
  className="absolute bottom-2 left-2"
/>
```

### Variante Inline

**Usage** : Dans texte ou label

```tsx
<div className="flex items-center gap-2">
  <span>Métrique importante</span>
  <DataStatusBadge type="real" compact />
</div>
```

---

## 📚 EXEMPLES MODULES EXISTANTS

### Admin Users - Analytics

**Fichier** : `src/app/admin/users/[id]/components/user-stats-cards.tsx`

- 6 badges **RÉEL** : Sessions, Engagement, Fréquence, Ancienneté, Statut, Type
- 2 badges **MOCK** : Durée session, Productivité

### Dashboard (À Implémenter)

**Fichier** : `src/app/dashboard/page.tsx`

- KPIs à badger : Revenus, Commandes, Conversion, Trafic

### Catalogue (À Implémenter)

**Fichier** : `src/app/catalogue/page.tsx`

- Stats produits : Prix (RÉEL), Ventes (MOCK), Marge (MOCK)

---

## 🚀 PROCHAINES ÉTAPES

### Modules à Badger (Priority Order)

1. **Dashboard** → 8-10 KPIs à identifier
2. **Catalogue** → Stats produits (vues, ventes, marges)
3. **Commandes** → Analytics commandes (délais, taux annulation)
4. **Finance** → Indicateurs comptables (CA, dépenses, trésorerie)
5. **Stocks** → Métriques inventaire (rotation, ruptures)

### Pattern Évolutif

Ce pattern sera enrichi au fur et à mesure :
- Nouveaux types badge si besoin (ex: `"partial"` pour données mixtes)
- Nouvelles positions selon layouts
- Helper hooks plus sophistiqués

---

## 🔗 RÉFÉRENCES

### Documentation Officielle
- Règles usage : `manifests/development-standards/DATA-STATUS-BADGE-RULES.md`
- Component source : `src/components/ui/data-status-badge.tsx`

### Sessions Related
- Fix tracking : `MEMORY-BANK/sessions/2025-10-11-RAPPORT-USER-ACTIVITY-TRACKING-FIX-COMPLET.md`

### Design System
- Vérone guidelines : `CLAUDE.md` section Design System
- UI components : `src/components/ui/`

---

**Pattern créé** : 2025-10-11
**Version** : 1.0
**Auteur** : Claude Code + Workflow 2025

*Vérone Back Office - Reusable Pattern Excellence*
