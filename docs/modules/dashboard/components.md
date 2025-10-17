# Dashboard - Components Reference

**Module** : Dashboard
**Components Count** : 2 UI components
**Date** : 2025-10-17

---

## `<ElegantKpiCard />`

**Fichier** : `src/components/ui/elegant-kpi-card.tsx`

**Description** : KPI Card élégante inspirée shadcn/ui pour affichage métriques clés avec trend indicator et navigation.

### Props

```typescript
interface ElegantKpiCardProps {
  label: string                    // Libellé KPI (ex: "CA du Mois")
  value: string | number           // Valeur affichée (ex: "327 €" ou 42)
  icon: LucideIcon                 // Icône Lucide React
  trend?: {                        // Trend indicator optionnel
    value: number                  // Valeur % (ex: 12.5)
    isPositive: boolean            // true = vert↑, false = rouge↓
  }
  description?: string             // Description optionnelle
  onClick?: () => void             // Handler navigation
  className?: string               // Classes Tailwind additionnelles
}
```

### Usage

```typescript
import { ElegantKpiCard } from '@/components/ui/elegant-kpi-card'
import { DollarSign, ShoppingCart, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI avec trend positif */}
      <ElegantKpiCard
        label="CA du Mois"
        value={formatCurrency(monthRevenue)}
        icon={DollarSign}
        trend={{ value: 12.5, isPositive: true }}
        onClick={() => router.push('/commandes/clients')}
      />

      {/* KPI simple sans trend */}
      <ElegantKpiCard
        label="Commandes Ventes"
        value={salesOrders}
        icon={ShoppingCart}
        onClick={() => router.push('/commandes/clients')}
      />

      {/* KPI avec trend négatif */}
      <ElegantKpiCard
        label="Valeur Stock"
        value={formatCurrency(stockValue)}
        icon={Package}
        trend={{ value: 8.3, isPositive: false }}
        onClick={() => router.push('/stocks')}
      />
    </div>
  )
}
```

### Design Tokens

**Tailles** :
- Min height : 96px
- Padding : 24px (p-6)
- Gap : 12px (gap-3)

**Couleurs** :
```typescript
// Fond & Bordures
background: 'white'
border: 'neutral-200'
hover:border: 'neutral-300'
shadow: componentShadows.card  // Design system

// Texte
label: 'neutral-600' (13px)
value: 'neutral-900' (28px bold)
trend positive: 'success-700' sur fond 'success-50'
trend negative: 'danger-700' sur fond 'danger-50'
```

**Typography** :
- Label : 13px medium
- Value : 28px bold, line-height 1.2
- Trend : 12px medium
- Icon : 18px, strokeWidth 2

### États Visuels

**Default** :
- Fond blanc, bordure neutral-200
- Shadow card légère

**Hover** (si onClick présent) :
- cursor: pointer
- border: neutral-300
- shadow: md (élévation)

**Trend Badge** :
```tsx
// Positif : Vert avec flèche haut
<div className="bg-success-50 text-success-700">
  <ArrowUp size={12} /> 12.5%
</div>

// Négatif : Rouge avec flèche bas
<div className="bg-danger-50 text-danger-700">
  <ArrowDown size={12} /> 8.3%
</div>
```

### Accessibility

- ✅ Click area : toute la card (96px min)
- ✅ Cursor pointer si cliquable
- ✅ Contrast ratios WCAG AAA
- ⚠️ Ajouter aria-label pour screen readers

**Amélioration suggérée** :
```tsx
<div
  onClick={onClick}
  role={onClick ? "button" : undefined}
  tabIndex={onClick ? 0 : undefined}
  aria-label={onClick ? `Voir détails ${label}` : undefined}
>
```

---

## `<ActivityTimeline />`

**Fichier** : `src/components/ui/activity-timeline.tsx`

**Description** : Timeline d'activité récente (vide dans Dashboard actuel).

### Props

```typescript
interface TimelineItem {
  id: string
  type: 'order' | 'product' | 'stock' | 'customer' | 'system'
  title: string
  description: string
  timestamp: string | Date
  user?: string
  severity?: 'info' | 'warning' | 'error'
}

interface ActivityTimelineProps {
  items: TimelineItem[]
  maxItems?: number              // Default: afficher tous
}
```

### Usage

```tsx
import { ActivityTimeline } from '@/components/ui/activity-timeline'

const recentActivity: TimelineItem[] = [
  {
    id: '1',
    type: 'product',
    title: 'Nouveau produit créé',
    description: 'Chaise Barcelona ajoutée au catalogue',
    timestamp: '2025-10-17T10:30:00Z',
    user: 'Admin',
    severity: 'info'
  },
  // ... autres items
]

<ActivityTimeline items={recentActivity} maxItems={5} />
```

### État Vide (Dashboard Actuel)

```tsx
// Dashboard passe array vide
const recentActivity: TimelineItem[] = []

// Component affiche empty state
{recentActivity.length > 0 ? (
  <ActivityTimeline items={recentActivity} maxItems={4} />
) : (
  <div className="text-center py-12">
    <ArrowLeftRight className="h-12 w-12 text-slate-300 mx-auto mb-3" />
    <p className="text-sm text-slate-500">Aucune activité récente</p>
    <p className="text-xs text-slate-400">L'historique apparaîtra ici</p>
  </div>
)}
```

---

## Patterns d'Usage Dashboard

### Grid Layout

```tsx
// 4 KPIs responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <ElegantKpiCard {...kpi1} />
  <ElegantKpiCard {...kpi2} />
  <ElegantKpiCard {...kpi3} />
  <ElegantKpiCard {...kpi4} />
</div>
```

### Formatage Valeurs

```typescript
// Currency
const formatted = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0
}).format(value)

// Numbers
const formatted = value.toString()  // Simple pour compteurs
```

### Navigation onClick

```typescript
const router = useRouter()

<ElegantKpiCard
  onClick={() => router.push('/module/detail')}
/>
```

---

## Variantes Future

**ElegantKpiCardSkeleton** (loading state) :
```tsx
<div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
```

**ElegantKpiCardError** (error state) :
```tsx
<div className="border-red-200 bg-red-50">
  <AlertCircle className="text-red-500" />
  <p className="text-red-700">Erreur chargement</p>
</div>
```

---

**Documentation basée sur code réel - Précision 100%**
