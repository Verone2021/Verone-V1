# Composants Graphiques - Vérone

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Phase** : 5 - Métriques et Monitoring
**Mainteneur** : Vérone Documentation Team

---

## Table des matières

- [Vue d'Ensemble](#vue-densemble)
- [Charts Recharts (4)](#charts-recharts-4)
- [KPI Cards (4 Types)](#kpi-cards-4-types)
- [Design System V2](#design-system-v2)
- [Responsive Layout](#responsive-layout)
- [Props Communes](#props-communes)

---

## Vue d'Ensemble

Le dashboard Vérone utilise **4 graphiques Recharts** et **4 types de KPI Cards** pour visualiser les métriques business en temps réel.

**Stack Visualisation** :
- **Recharts** : Bibliothèque graphiques React (LineChart, BarChart, AreaChart)
- **shadcn/ui** : Base composants KPI Cards
- **Tailwind CSS** : Styles + responsive
- **Design System V2** : Palette moderne 2025

**Fichiers** :
- Charts : `src/components/business/*-chart.tsx`
- KPI Cards : `src/components/ui/*-kpi-card.tsx`

---

## Charts Recharts (4)

### 1. Revenue Chart (CA Évolution)

**Fichier** : `src/components/business/revenue-chart.tsx`

**Type** : `LineChart` avec gradients

**Source Données** :
```typescript
const { analytics } = useDashboardAnalytics()
data = analytics.revenue  // [{date: "12 Oct", revenue: 1250}, ...]
```

**Structure** :
```typescript
<LineChart data={revenue} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip formatter={(value) => `${value}€`} />
  <Line
    type="monotone"
    dataKey="revenue"
    stroke="var(--verone-primary)"  // #3b86d1
    strokeWidth={2}
    fill="url(#revenueGradient)"
  />
  <defs>
    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--verone-primary)" stopOpacity={0.8} />
      <stop offset="100%" stopColor="var(--verone-primary)" stopOpacity={0} />
    </linearGradient>
  </defs>
</LineChart>
```

**Props Clés** :
- `dataKey="revenue"` : Colonne valeur Y
- `stroke` : Couleur ligne (#3b86d1 bleu professionnel)
- `fill="url(#revenueGradient)"` : Gradient sous courbe
- `type="monotone"` : Courbe lisse

**Tooltip** :
```typescript
formatter={(value) => [`${value}€`, 'Chiffre d\'affaires']}
```

**Période** : 30 derniers jours (agrégation par jour)

---

### 2. Products Chart (Produits Ajoutés)

**Fichier** : `src/components/business/products-chart.tsx`

**Type** : `BarChart` vertical

**Source Données** :
```typescript
data = analytics.products  // [{week: "S2", count: 5}, ...]
```

**Structure** :
```typescript
<BarChart data={products} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="week" />
  <YAxis />
  <Tooltip />
  <Bar
    dataKey="count"
    fill="var(--verone-success)"  // #38ce3c
    radius={[8, 8, 0, 0]}  // Bordures arrondies haut
  />
</BarChart>
```

**Props Clés** :
- `dataKey="count"` : Nombre produits
- `fill` : Couleur barres (#38ce3c vert validation)
- `radius` : Coins arrondis top ([topLeft, topRight, bottomRight, bottomLeft])

**Agrégation** : Par semaine (S1, S2, S3, S4)

**Couleur** : Vert succès (Design System V2)

---

### 3. Stock Movements Chart (Entrées/Sorties)

**Fichier** : `src/components/business/stock-movements-chart.tsx`

**Type** : `AreaChart` multi-séries

**Source Données** :
```typescript
data = analytics.stockMovements  // [{date: "12 Oct", entrees: 30, sorties: 5}, ...]
```

**Structure** :
```typescript
<AreaChart data={stockMovements} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Area
    type="monotone"
    dataKey="entrees"
    stackId="1"
    stroke="var(--verone-success)"
    fill="var(--verone-success)"
    fillOpacity={0.6}
  />
  <Area
    type="monotone"
    dataKey="sorties"
    stackId="1"
    stroke="var(--verone-warning)"
    fill="var(--verone-warning)"
    fillOpacity={0.6}
  />
</AreaChart>
```

**Props Clés** :
- 2 séries : `entrees` (vert) + `sorties` (orange)
- `stackId="1"` : Zones empilées
- `fillOpacity={0.6}` : Transparence 60%

**Couleurs** :
- Entrées : `--verone-success` (#38ce3c)
- Sorties : `--verone-warning` (#ff9b3e)

**Période** : 30 derniers jours (agrégation quotidienne)

---

### 4. Purchase Orders Chart (Commandes Fournisseurs)

**Fichier** : `src/components/business/purchase-orders-chart.tsx`

**Type** : `BarChart` avec gradients

**Source Données** :
```typescript
data = analytics.purchaseOrders  // [{week: "S2", amount: 3500}, ...]
```

**Structure** :
```typescript
<BarChart data={purchaseOrders} width={600} height={300}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="week" />
  <YAxis />
  <Tooltip formatter={(value) => `${value}€`} />
  <Bar
    dataKey="amount"
    fill="url(#poGradient)"
    radius={[8, 8, 0, 0]}
  />
  <defs>
    <linearGradient id="poGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--verone-accent)" stopOpacity={1} />
      <stop offset="100%" stopColor="var(--verone-accent)" stopOpacity={0.6} />
    </linearGradient>
  </defs>
</BarChart>
```

**Props Clés** :
- `dataKey="amount"` : Montant total €
- `fill="url(#poGradient)"` : Gradient violet
- Couleur base : `--verone-accent` (#844fc1)

**Agrégation** : Par semaine (somme `total_ht`)

---

## KPI Cards (4 Types)

### 1. Elegant KPI Card (Premium)

**Fichier** : `src/components/ui/elegant-kpi-card.tsx`

**Description** : KPI Card moderne avec gradients, ombres élégantes, et micro-animations.

**Props** :
```typescript
interface ElegantKPICardProps {
  title: string              // "Chiffre d'affaires"
  value: string | number     // "15 000€" ou 15000
  trend?: number             // +25.5 (%)
  icon?: React.ReactNode     // <DollarSign />
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  className?: string
}
```

**Variants Couleurs** :
- `primary` : Bleu (#3b86d1) - Métriques principales
- `success` : Vert (#38ce3c) - Métriques positives
- `warning` : Orange (#ff9b3e) - Alertes modérées
- `danger` : Rouge (#ff4d6b) - Alertes critiques
- `accent` : Violet (#844fc1) - Métriques secondaires

**Exemple Utilisation** :
```tsx
<ElegantKPICard
  title="Revenue Mensuel"
  value="45 000€"
  trend={+12.5}
  icon={<TrendingUp className="w-5 h-5" />}
  variant="success"
/>
```

**Rendu Visuel** :
```
┌─────────────────────────────────────┐
│  [Icon]  Revenue Mensuel            │
│                                     │
│  45 000€          ↑ +12.5%          │
│  [Gradient Background + Shadow]     │
└─────────────────────────────────────┘
```

**Styles Clés** :
```css
.elegant-kpi-card {
  background: linear-gradient(135deg, primary 0%, primary-dark 100%);
  box-shadow: 0 4px 20px rgba(59, 134, 209, 0.25);
  border-radius: 12px;
  padding: 1.5rem;
}
```

---

### 2. KPI Card (Standard)

**Fichier** : `src/components/ui/kpi-card.tsx` ou `src/components/business/kpi-card.tsx`

**Description** : KPI Card classique sans gradients (plus sobre).

**Props** :
```typescript
interface KPICardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string       // Sous-titre optionnel
  trend?: {
    value: number
    label?: string           // "vs mois dernier"
  }
  className?: string
}
```

**Exemple** :
```tsx
<KPICard
  title="Produits Actifs"
  value={125}
  icon={<Package />}
  description="Catalogue publié"
  trend={{ value: +8.2, label: "vs semaine dernière" }}
/>
```

**Rendu** :
```
┌─────────────────────────────────────┐
│  [Icon]  Produits Actifs            │
│                                     │
│  125                                │
│  Catalogue publié                   │
│  +8.2% vs semaine dernière          │
└─────────────────────────────────────┘
```

**Différence avec Elegant** :
- Pas de gradient background (fond blanc/gris clair)
- Ombres plus subtiles
- Moins d'animations

---

### 3. Compact KPI Card

**Fichier** : `src/components/ui/compact-kpi-card.tsx`

**Description** : Version minimaliste pour dashboards denses.

**Props** :
```typescript
interface CompactKPICardProps {
  label: string         // Court (ex: "CA")
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'danger'
}
```

**Exemple** :
```tsx
<CompactKPICard label="CA" value="15K€" variant="success" />
```

**Rendu** :
```
┌──────────────┐
│  CA          │
│  15K€        │
└──────────────┘
```

**Taille** : ~120px × 80px (vs ~300px × 150px pour Elegant)

**Use Case** : Grille KPIs 4×2 (8 métriques visibles simultanément)

---

### 4. Medium KPI Card

**Fichier** : `src/components/ui/medium-kpi-card.tsx`

**Description** : Compromis entre Standard et Compact.

**Props** :
```typescript
interface MediumKPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: number
  variant?: 'default' | 'primary' | 'success' | 'warning'
}
```

**Exemple** :
```tsx
<MediumKPICard
  title="Commandes"
  value={42}
  subtitle="En cours"
  icon={<ShoppingCart />}
  trend={+5.0}
  variant="primary"
/>
```

**Rendu** :
```
┌───────────────────────┐
│  [Icon]  Commandes    │
│  42          ↑ +5.0%  │
│  En cours             │
└───────────────────────┘
```

**Taille** : ~200px × 120px

---

## Design System V2

### Palette Couleurs 2025

**Variables CSS** (définies dans `src/lib/theme-v2.ts`) :

```css
:root {
  --verone-primary: #3b86d1;      /* Bleu professionnel */
  --verone-success: #38ce3c;      /* Vert validation */
  --verone-warning: #ff9b3e;      /* Orange attention */
  --verone-accent: #844fc1;       /* Violet créatif */
  --verone-danger: #ff4d6b;       /* Rouge critique */
  --verone-neutral: #6c7293;      /* Gris interface */
}
```

**Gradients Prédéfinis** :
```css
.gradient-primary {
  background: linear-gradient(135deg, #3b86d1 0%, #2563a8 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #38ce3c 0%, #27a532 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, #844fc1 0%, #6a3ba0 100%);
}
```

**Mapping Variants → Couleurs** :

| Variant | Couleur Primaire | Use Case |
|---------|------------------|----------|
| `primary` | #3b86d1 | CA, Revenue, Métriques principales |
| `success` | #38ce3c | Stock OK, Commandes validées |
| `warning` | #ff9b3e | Stock faible, Alertes modérées |
| `danger` | #ff4d6b | Rupture stock, Erreurs critiques |
| `accent` | #844fc1 | Métriques secondaires, Analytics |
| `neutral` | #6c7293 | Métriques neutres, Textes |

---

### Ombres (Shadows)

**Hiérarchie** :
```css
.shadow-sm {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.shadow-md {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);  /* KPI Cards standard */
}

.shadow-lg {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);  /* KPI Cards elevated */
}

.shadow-elegant {
  box-shadow: 0 4px 20px rgba(59, 134, 209, 0.25);  /* Elegant KPI (colorée) */
}
```

---

### Typographie

**Tailles Métriques** :
```css
.metric-value {
  font-size: 2rem;           /* 32px - Valeur principale */
  font-weight: 700;
  line-height: 1.2;
}

.metric-title {
  font-size: 0.875rem;       /* 14px - Titre KPI */
  font-weight: 500;
  color: var(--verone-neutral);
}

.metric-trend {
  font-size: 0.75rem;        /* 12px - Tendance % */
  font-weight: 600;
}
```

**Exemple Rendu** :
```
Revenue Mensuel         ← metric-title (14px, #6c7293)
45 000€                 ← metric-value (32px, bold)
↑ +12.5%                ← metric-trend (12px, vert)
```

---

## Responsive Layout

### Grid Dashboard

**Structure 12 colonnes** :
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large */}
  <ElegantKPICard ... />
  <ElegantKPICard ... />
  <ElegantKPICard ... />
  <ElegantKPICard ... />
</div>
```

**Breakpoints Tailwind** :
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (ultra-wide)

---

### Charts Responsive

**Pattern Container** :
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={revenue}>
    ...
  </LineChart>
</ResponsiveContainer>
```

**Mobile Adaptations** :
- Charts : Height réduite (250px au lieu de 300px)
- Legend : Masquée sur mobile (<640px)
- Tooltip : Format compact

**Exemple** :
```tsx
<ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
  <LineChart data={revenue}>
    {!isMobile && <Legend />}
    ...
  </LineChart>
</ResponsiveContainer>
```

---

## Props Communes

### Recharts Props Universelles

**Tous Charts** :
```typescript
{
  data: Array<any>,          // Données sources
  width?: number,            // Largeur fixe (optionnel si ResponsiveContainer)
  height?: number,           // Hauteur
  margin?: {                 // Marges internes
    top: 10,
    right: 30,
    left: 0,
    bottom: 0
  }
}
```

**CartesianGrid** (grille fond) :
```typescript
<CartesianGrid
  strokeDasharray="3 3"      // Pointillés 3px dash, 3px gap
  stroke="#e0e0e0"           // Couleur gris clair
  opacity={0.5}
/>
```

**XAxis / YAxis** :
```typescript
<XAxis
  dataKey="date"             // Colonne données X
  tick={{ fontSize: 12 }}    // Taille police labels
  stroke="#6c7293"           // Couleur axe
/>
<YAxis
  tick={{ fontSize: 12 }}
  tickFormatter={(value) => `${value}€`}  // Format labels
/>
```

**Tooltip** :
```typescript
<Tooltip
  formatter={(value, name) => [`${value}€`, 'Chiffre d\'affaires']}
  contentStyle={{
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px'
  }}
/>
```

**Legend** (légende multi-séries) :
```typescript
<Legend
  verticalAlign="top"
  height={36}
  iconType="circle"          // Forme icône (circle | square | line)
/>
```

---

### KPI Cards Props Universelles

**Toutes KPI Cards** :
```typescript
{
  title: string,             // Obligatoire
  value: string | number,    // Obligatoire
  icon?: React.ReactNode,    // Optionnel
  trend?: number,            // Optionnel (+12.5 ou -5.2)
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'accent',
  className?: string         // Classes Tailwind additionnelles
}
```

**Trend Formatting** :
```typescript
const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600'
const trendIcon = trend >= 0 ? <TrendingUp /> : <TrendingDown />
```

---

### Gradients Recharts

**Pattern Gradient Area** :
```tsx
<defs>
  <linearGradient id="gradientId" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--color)" stopOpacity={0.8} />
    <stop offset="100%" stopColor="var(--color)" stopOpacity={0} />
  </linearGradient>
</defs>
<Area fill="url(#gradientId)" ... />
```

**Gradient Vertical** : `x1="0" y1="0" x2="0" y2="1"` (haut vers bas)
**Gradient Horizontal** : `x1="0" y1="0" x2="1" y2="0"` (gauche vers droite)

---

**Retour** : [Documentation Métriques](/Users/romeodossantos/verone-back-office-V1/docs/metrics/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
