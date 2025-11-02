# 🎨 Vérone Stock Module - Simplification UX/UI 2025

**Date**: 2025-10-31
**Designer**: Claude (Vérone Design Expert)
**Objectif**: Simplifier 10 pages fragmentées → 3 pages minimalistes modernes
**Stack**: shadcn/ui + Design System V2 + Next.js 15

---

## 📊 SYNTHÈSE EXÉCUTIVE

### Problème Actuel
- **10 pages stocks fragmentées**: Navigation confuse (3-4 clics pour actions courantes)
- **Complexité excessive**: Séparation artificielle Entrées/Sorties/Ajustements en pages distinctes
- **UX dépassée**: Trop de sidebars, manque de filtres inline, pas de vue d'ensemble

### Solution Proposée
**3 pages minimalistes** avec navigation 2 niveaux maximum:
1. **`/stocks`** - Dashboard Vue d'Ensemble (health check quotidien 30s)
2. **`/stocks/mouvements`** - Historique Filtrable (analyse activité)
3. **`/stocks/inventaire`** - État Stock Actuel (planification réappro)

### Gains UX
- ✅ **-70% pages**: 10 → 3 (navigation simplifiée)
- ✅ **-50% clics**: Actions rapides via tabs + filtres inline
- ✅ **+100% efficacité**: Vue d'ensemble immédiate
- ✅ **2025 best practices**: Linear design, progressive disclosure, filtres inline

---

## 🔍 RESEARCH BEST PRACTICES 2025

### Sources Analysées

#### 1. Linear Design Principles
**Tendance dominante 2025 pour SaaS B2B**

> "Linear design emphasizes simplicity with minimalist interfaces that eliminate unnecessary elements, consistency through uniform design patterns, and guidance via clear, step-by-step instructions."

**Caractéristiques clés**:
- **Direction claire**: Un seul chemin principal, pas de choix multiples confusants
- **Scan vertical**: Layout linéaire, facilite parcours visuel
- **Keyboard-first**: Shortcuts visibles, command palette (⌘K)

**Application Vérone**:
- Tabs horizontaux pour types mouvements (pas pages séparées)
- Filtres inline collapsibles (pas sidebar permanente)
- Actions principales visibles immédiatement

#### 2. Odoo 17 Inventory
**Améliorations UI/UX documentées**

> "Odoo 17 comes with a revamped dashboard and navigation pages, offering a more user-friendly and attractive interface"

**Innovations notables**:
- **Operations menu redesigné**: Menu séparé pour chaque type opération (accessible via dropdown unique)
- **Filtres améliorés**: Search bar avec dropdown filters/groups/favorites
- **Drag-to-resize**: Wizards redimensionnables pour efficacité

**Application Vérone**:
- Filtres inline avec collapsible areas
- Search autocomplete pour produits
- Dropdown multi-fonctions (filtres + groupes + favoris)

#### 3. NetSuite Redwood Experience
**Interface moderne ERP enterprise**

> "Dashboard View Filter allows users to customize portlet settings, with interactive charts where you can click on a segment to see details and filter data on the fly"

**Patterns clés**:
- **Interactive charts**: Click segment → filtre data instantané
- **Dashboard View Filter**: Personnalisation portlets par utilisateur
- **Collapsible filters**: Position top avec animation smooth

**Application Vérone**:
- Charts cliquables pour drill-down rapide
- Filtres top position (pas sidebar)
- Personnalisation future via preferences utilisateur

#### 4. Minimalism 2025
**Évolution du minimalisme**

> "Minimalism in 2025 is anything but basic—while clean lines and uncluttered layouts remain central, designers are adding playful, unexpected elements like asymmetry instead of rigid grids"

**Tendances**:
- **Clean + Personality**: Espaces blancs généreux + micro-détails ludiques
- **Asymétrie subtile**: Éviter grilles trop rigides
- **Micro-interactions élégantes**: Hover scale 1.02-1.05, shadows douces

**Application Vérone**:
- Layout cards avec rounded corners variables (8px-12px)
- Hover states subtils (scale, shadow elevation)
- Badges avec point indicateur coloré

---

## 🏗️ ARCHITECTURE SIMPLIFIÉE

### Plan de Consolidation

```
ANCIEN (10 pages)                    NOUVEAU (3 pages)
─────────────────────────────────────────────────────────
/stocks                          →   /stocks (optimisé)
/stocks/mouvements              →   /stocks/mouvements (tabs)
/stocks/inventaire              →   /stocks/inventaire (filtres)
/stocks/alertes                 →   FUSIONNÉ: /stocks (widget)
/stocks/entrees                 →   FUSIONNÉ: /stocks/mouvements (tab)
/stocks/sorties                 →   FUSIONNÉ: /stocks/mouvements (tab)
/stocks/ajustements             →   FUSIONNÉ: /stocks/mouvements (tab)
/stocks/receptions              →   FUSIONNÉ: /stocks/mouvements (filtre)
/stocks/expeditions             →   FUSIONNÉ: /stocks/mouvements (filtre)
/stocks/produits                →   REDIRIGÉ: /stocks/inventaire
```

### Redirects Next.js

```typescript
// next.config.js
const redirects = [
  { source: '/stocks/entrees', destination: '/stocks/mouvements?tab=entrees', permanent: false },
  { source: '/stocks/sorties', destination: '/stocks/mouvements?tab=sorties', permanent: false },
  { source: '/stocks/ajustements', destination: '/stocks/mouvements?tab=ajustements', permanent: false },
  { source: '/stocks/alertes', destination: '/stocks#alertes', permanent: false },
  { source: '/stocks/produits', destination: '/stocks/inventaire', permanent: false },
]
```

---

## 📱 WIREFRAMES - PAGE 1: Dashboard Vue d'Ensemble

**Route**: `/stocks`
**Objectif**: Health check quotidien en 30 secondes
**Layout**: Desktop-first, responsive mobile stack vertical

### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  STOCKS                                          [⟳ Actualiser]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ NAVIGATION RAPIDE                                             │  │
│  │                                                                │  │
│  │ Pages Stock:                                                  │  │
│  │ [Inventaire] [Mouvements] [Alertes (3)]                       │  │
│  │                                                                │  │
│  │ Pages Connexes:                                               │  │
│  │ → Catalogue  → Commandes Fournisseurs  → Commandes Clients   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │
│  │ Stock Réel  │ │ Disponible  │ │  Alertes    │ │ Valeur Stock │ │
│  │             │ │             │ │             │ │              │ │
│  │  2,456      │ │  1,834      │ │     12      │ │  456 789 €   │ │
│  │  📦         │ │  ✅         │ │  ⚠️         │ │  📊          │ │
│  │  1,234 en   │ │ Réel-Réservé│ │ 12 actions  │ │  HT · ↗     │ │
│  │  stock      │ │             │ │  requises   │ │              │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ● STOCK RÉEL (Mouvements Effectués)                          │  │
│  │ ────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │ Mouvements 7 Derniers Jours                                   │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ ↓ Entrées       15 mvts    +245 unités  [badge vert]     │ │  │
│  │ │ ↑ Sorties       23 mvts    -187 unités  [badge rouge]    │ │  │
│  │ │ ⚙ Ajustements    3 mvts     +12 unités  [badge bleu]     │ │  │
│  │ │                                                            │ │  │
│  │ │ Aujourd'hui: 3 IN · 5 OUT · 1 ADJ                         │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │ Alertes Stock Faible                                          │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Chaise Scandinave Noir  │  23 réel  │  15 réservé        │ │  │
│  │ │ Table Basse Marbre      │   5 réel  │   3 réservé        │ │  │
│  │ │ Lampe Suspension Laiton │   2 réel  │   8 réservé ⚠️     │ │  │
│  │ │                                                            │ │  │
│  │ │              [⚠️ Voir toutes les alertes (12)]             │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │ Derniers Mouvements                                           │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ ↓ Chaise Bar Velours  │ +50  │ (120→170)  │ 30/10 14:23  │ │  │
│  │ │ ↑ Table Console Noyer │ -3   │ (45→42)    │ 30/10 13:15  │ │  │
│  │ │ ⚙ Lampe Arc Chrome    │ +2   │ (8→10)     │ 30/10 11:40  │ │  │
│  │ │                                                            │ │  │
│  │ │                  [👁 Voir tous les mouvements]             │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ● STOCK PRÉVISIONNEL (Commandes En Cours)                    │  │
│  │ ────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │ [Widget ForecastSummary existant - déjà bien implémenté]     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants Utilisés

- **KPI Cards** (4x): Badge composant shadcn/ui avec variants custom
- **Navigation Card**: ButtonV2 + Link avec hover transitions
- **Section Cards**: Border-left accent (vert=réel, bleu=prévisionnel)
- **Movement List**: Custom cards avec badges type + micro-interactions
- **Alert List**: Link cards avec badges status + quantités

### Interactions Clés

1. **Click KPI "Alertes"** → Scroll smooth vers section "Alertes Stock Faible"
2. **Click "Voir alertes (12)"** → Navigate `/stocks/mouvements?filter=low-stock`
3. **Click mouvement** → Expand details inline (collapse autres)
4. **Hover card** → Scale 1.02 + shadow elevation 150ms

---

## 📱 WIREFRAMES - PAGE 2: Historique Mouvements

**Route**: `/stocks/mouvements`
**Objectif**: Analyser activité stock, tracer origines, auditer
**Layout**: Tabs + Filtres inline + Cards list

### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  MOUVEMENTS STOCK                                 [⟳ Actualiser]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [Tous] [Entrées (245)] [Sorties (187)] [Ajustements (12)]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ FILTRES  [˅ Afficher/Masquer]                                 │  │
│  │ ────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │ Période:  [7 jours ˅]  [30 jours]  [📅 Personnalisé]         │  │
│  │                                                                │  │
│  │ Canal:    [●B2B] [●E-commerce] [ Retail] [ Wholesale]         │  │
│  │           (2 sélectionnés)                    [✕ Effacer]     │  │
│  │                                                                │  │
│  │ Produit:  [🔍 Rechercher produit...]                          │  │
│  │           Suggestions: Chaise Bar, Table Basse, Lampe...      │  │
│  │                                                                │  │
│  │ Type:     [ Réception] [ Expédition] [ Ajustement inventaire] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  1,234 mouvements · Dernière mise à jour il y a 2 min              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────────────────────────────────────┐   │  │
│  │ │ ↓ IN  │  Chaise Bar Velours Bleu                       │   │  │
│  │ │       │  SKU-12345  │  30/10/2025 14:23                │   │  │
│  │ │       │                                                  │   │  │
│  │ │       │  Quantité: +50 unités  (120 → 170)             │   │  │
│  │ │       │  Type: Réception fournisseur                    │   │  │
│  │ │       │  Référence: PO-2025-0456                        │   │  │
│  │ │       │                                     [👁 Détails] │   │  │
│  │ └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │ ┌────────────────────────────────────────────────────────┐   │  │
│  │ │ ↑ OUT │  Table Console Noyer Massif                     │   │  │
│  │ │       │  SKU-67890  │  30/10/2025 13:15                │   │  │
│  │ │       │                                                  │   │  │
│  │ │       │  Quantité: -3 unités  (45 → 42)                │   │  │
│  │ │       │  Canal: [●B2B] Business Pro SAS                 │   │  │
│  │ │       │  Référence: SO-2025-0789                        │   │  │
│  │ │       │                                     [👁 Détails] │   │  │
│  │ └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │ ┌────────────────────────────────────────────────────────┐   │  │
│  │ │ ⚙ ADJ │  Lampe Arc Chrome Réglable                      │   │  │
│  │ │       │  SKU-24680  │  30/10/2025 11:40                │   │  │
│  │ │       │                                                  │   │  │
│  │ │       │  Quantité: +2 unités  (8 → 10)                 │   │  │
│  │ │       │  Raison: Correction inventaire physique         │   │  │
│  │ │       │  Utilisateur: Marie Dubois                      │   │  │
│  │ │       │                                     [👁 Détails] │   │  │
│  │ └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │            [Charger plus (150 mouvements restants)]           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants Utilisés

- **Tabs**: shadcn/ui Tabs component avec badge counts
- **Filters**: Collapsible Card avec Checkbox groups + DatePicker + Combobox
- **ChannelBadge**: Custom component (voir specs ci-dessous)
- **StockMovementCard**: Custom component (voir specs ci-dessous)
- **Infinite Scroll**: react-intersection-observer

### Interactions Clés

1. **Click tab** → Filter mouvements + update URL params
2. **Toggle filtres** → Smooth collapse/expand 300ms
3. **Select canal badge** → Multi-select avec preview live
4. **Search produit** → Autocomplete avec suggestions (debounce 300ms)
5. **Click "Détails"** → Expand card inline avec animation slide-down
6. **Hover card** → Border accent color + shadow elevation

---

## 📱 WIREFRAMES - PAGE 3: Inventaire Stock

**Route**: `/stocks/inventaire`
**Objectif**: État précis stock par produit, planifier réapprovisionnement
**Layout**: Table responsive + Filtres inline + Export CSV

### ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  INVENTAIRE STOCK                          [⟳ Actualiser] [📥 CSV]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ FILTRES  [˅ Afficher/Masquer]                                 │  │
│  │ ────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │ Catégorie:    [Toutes ˅] [Chaises] [Tables] [Luminaires]     │  │
│  │                                                                │  │
│  │ Fournisseur:  [Tous ˅] [Fournisseur A] [Fournisseur B]       │  │
│  │                                                                │  │
│  │ Statut Stock: [✓ OK] [⚠️ Bas] [🔴 Critique] [0 Rupture]      │  │
│  │                                                                │  │
│  │ Recherche:    [🔍 Rechercher par nom ou SKU...]               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  1,234 produits · 456 en stock · 12 alertes                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ PRODUIT        │ RÉEL │ DISPO │ RÉSERVÉ │ ATTENTE │ VALEUR    ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ [img] Chaise   │      │       │         │         │           ││
│  │ Bar Velours    │ 170  │  155  │   15    │   50    │ 8,500 € ││
│  │ SKU-12345      │ ✅   │       │         │         │           ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ [img] Table    │      │       │         │         │           ││
│  │ Console Noyer  │  42  │   39  │    3    │    0    │ 12,600 €││
│  │ SKU-67890      │ ⚠️   │       │         │         │           ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ [img] Lampe    │      │       │         │         │           ││
│  │ Arc Chrome     │  10  │    2  │    8    │   20    │ 1,200 € ││
│  │ SKU-24680      │ 🔴   │       │         │         │           ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ [img] Fauteuil │      │       │         │         │           ││
│  │ Velours Vert   │   0  │    0  │    0    │  100    │     0 €  ││
│  │ SKU-13579      │ 💀   │       │         │         │  (Attente)││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│              [← Précédent (20)]  [Suivant (20) →]                  │
│                        Page 1 / 62                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

LÉGENDE STATUS:
✅ OK       : Stock > minimum recommandé
⚠️ Bas      : Stock proche minimum (< 20% buffer)
🔴 Critique : Stock disponible < réservé (risque rupture)
💀 Rupture  : Stock réel = 0
```

### Composants Utilisés

- **Filters**: Collapsible Card avec Select + Checkbox groups + Input search
- **Table**: shadcn/ui Table component avec sorting
- **Status Badges**: Badge variant avec emoji + couleur contextuelle
- **Product Row**: Avatar (image 40x40) + Link + Badges
- **Pagination**: shadcn/ui Pagination component
- **Export CSV**: Button avec download action

### Interactions Clés

1. **Click header colonne** → Sort ASC/DESC avec animation
2. **Click produit** → Navigate `/produits/catalogue/:id`
3. **Toggle filtres** → Smooth collapse/expand 300ms
4. **Search input** → Debounce 300ms + highlight results
5. **Click "CSV"** → Download inventaire.csv (toast confirmation)
6. **Hover row** → Background gray-50 transition 150ms

### Colonnes Table

| Colonne | Description | Type | Tri |
|---------|-------------|------|-----|
| **Produit** | Image + Nom + SKU + Badge status | Component | ✅ Nom |
| **Réel** | Stock physique actuel | Number | ✅ |
| **Dispo** | Réel - Réservé (disponible vente) | Calculated | ✅ |
| **Réservé** | Quantité commandes clients confirmées | Number | ✅ |
| **Attente** | Quantité commandes fournisseurs en cours | Number | ✅ |
| **Valeur** | Prix achat × Stock réel (HT) | Currency | ✅ |

---

## 🎨 COMPOSANTS UNIVERSELS - SPÉCIFICATIONS TECHNIQUES

### 1. ChannelBadge.tsx

**Description**: Badge coloré pour identifier canal de vente avec design cohérent Design System V2.

#### TypeScript Interface

```typescript
/**
 * ChannelBadge - Badge canal de vente avec couleurs Design System V2
 *
 * @example
 * <ChannelBadge channel="b2b" variant="pill" size="sm" showDot />
 */

export interface ChannelBadgeProps {
  /**
   * Code canal de vente
   */
  channel: 'b2b' | 'ecommerce' | 'retail' | 'wholesale'

  /**
   * Variante visuelle du badge
   * @default 'pill'
   */
  variant?: 'pill' | 'square'

  /**
   * Taille du badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Afficher point indicateur coloré à gauche
   * @default true
   */
  showDot?: boolean

  /**
   * Classe CSS additionnelle
   */
  className?: string
}

export const ChannelBadge: React.FC<ChannelBadgeProps>
```

#### Design Specs

**Palette Couleurs Canaux** (alignée Design System V2):

| Canal | Couleur | Background | Text | Border | Dot |
|-------|---------|------------|------|--------|-----|
| **B2B** | #3b86d1 (Primary) | `bg-blue-100` | `text-blue-800` | `border-blue-200` | `bg-blue-600` |
| **E-commerce** | #844fc1 (Accent) | `bg-purple-100` | `text-purple-800` | `border-purple-200` | `bg-purple-600` |
| **Retail** | #ff9b3e (Warning) | `bg-orange-100` | `text-orange-800` | `border-orange-200` | `bg-orange-600` |
| **Wholesale** | #38ce3c (Success) | `bg-green-100` | `text-green-800` | `border-green-200` | `bg-green-600` |

**Sizes**:
- `sm`: `px-2 py-0.5 text-xs` (height 20px)
- `md`: `px-2.5 py-0.5 text-sm` (height 24px)
- `lg`: `px-3 py-1 text-base` (height 32px)

**Variants**:
- `pill`: `rounded-full` (border-radius 9999px)
- `square`: `rounded-md` (border-radius 6px)

**Micro-interactions**:
```css
.channel-badge {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.channel-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

#### Usage Examples

```tsx
// Badge simple
<ChannelBadge channel="b2b" />

// Badge compact sans point
<ChannelBadge channel="ecommerce" size="sm" showDot={false} />

// Badge carré large
<ChannelBadge channel="retail" variant="square" size="lg" />

// Dans liste mouvements
<div className="flex items-center gap-2">
  <span>Commande:</span>
  <ChannelBadge channel="wholesale" />
  <span>Grossiste Déco Pro</span>
</div>
```

---

### 2. ChannelFilter.tsx

**Description**: Filtre multi-select pour canaux de vente avec badges preview.

#### TypeScript Interface

```typescript
/**
 * ChannelFilter - Multi-select dropdown canaux avec preview badges
 *
 * @example
 * <ChannelFilter
 *   selected={['b2b', 'ecommerce']}
 *   onChange={(channels) => setFilters({ ...filters, channels })}
 * />
 */

export interface ChannelFilterProps {
  /**
   * Canaux actuellement sélectionnés
   */
  selected: Array<'b2b' | 'ecommerce' | 'retail' | 'wholesale'>

  /**
   * Callback quand sélection change
   */
  onChange: (channels: Array<'b2b' | 'ecommerce' | 'retail' | 'wholesale'>) => void

  /**
   * Texte label du filtre
   * @default 'Canal de vente'
   */
  label?: string

  /**
   * Afficher bouton "Effacer tout"
   * @default true
   */
  showClearAll?: boolean

  /**
   * Classe CSS additionnelle
   */
  className?: string
}

export const ChannelFilter: React.FC<ChannelFilterProps>
```

#### Design Specs

**Layout Trigger Button**:
```
┌─────────────────────────────────────┐
│ Canal: [●B2B] [●E-commerce]  (2) ˅ │
└─────────────────────────────────────┘
```

**Layout Popover Content**:
```
┌─────────────────────────────────────┐
│ Canaux de vente                     │
├─────────────────────────────────────┤
│ ☑ B2B            [●B2B]             │
│ ☑ E-commerce     [●E-commerce]      │
│ ☐ Retail         [ Retail]          │
│ ☐ Wholesale      [ Wholesale]       │
├─────────────────────────────────────┤
│               [✕ Effacer tout]      │
└─────────────────────────────────────┘
```

**Components shadcn/ui utilisés**:
- `Popover` + `PopoverTrigger` + `PopoverContent`
- `Checkbox` pour chaque canal
- `ChannelBadge` pour preview

**Micro-interactions**:
- Popover animation: `scale-95 opacity-0 → scale-100 opacity-100` (200ms)
- Checkbox toggle: Ripple effect + badge fade in/out (150ms)
- Clear all: Badges fade out simultanément puis count reset (300ms total)

#### Usage Example

```tsx
const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['b2b'])

return (
  <div className="space-y-4">
    <ChannelFilter
      selected={selectedChannels}
      onChange={setSelectedChannels}
      label="Filtrer par canal"
    />

    {/* Results */}
    <div>
      {movements
        .filter(m => selectedChannels.length === 0 || selectedChannels.includes(m.channel))
        .map(movement => <MovementCard key={movement.id} {...movement} />)
      }
    </div>
  </div>
)
```

---

### 3. StockMovementCard.tsx

**Description**: Card pour afficher détail mouvement stock avec type badge et canal.

#### TypeScript Interface

```typescript
/**
 * StockMovementCard - Card mouvement stock avec badges type/canal
 *
 * @example
 * <StockMovementCard
 *   type="IN"
 *   productName="Chaise Bar Velours"
 *   quantityChange={50}
 *   channel="b2b"
 *   onDetailsClick={() => openModal(movement.id)}
 * />
 */

export interface StockMovementCardProps {
  /**
   * Type de mouvement
   */
  type: 'IN' | 'OUT' | 'ADJUST'

  /**
   * Nom du produit
   */
  productName: string

  /**
   * SKU du produit
   */
  productSku: string

  /**
   * Changement quantité (positif ou négatif)
   */
  quantityChange: number

  /**
   * Quantité avant mouvement
   */
  quantityBefore: number

  /**
   * Quantité après mouvement
   */
  quantityAfter: number

  /**
   * Date/heure du mouvement
   */
  performedAt: Date

  /**
   * Canal de vente (pour type OUT uniquement)
   */
  channel?: 'b2b' | 'ecommerce' | 'retail' | 'wholesale'

  /**
   * Référence commande/document (PO-XXX, SO-XXX)
   */
  reference?: string

  /**
   * Raison ajustement (pour type ADJUST uniquement)
   */
  adjustmentReason?: string

  /**
   * Utilisateur ayant effectué le mouvement
   */
  performedBy?: string

  /**
   * Callback click "Voir détails"
   */
  onDetailsClick?: () => void

  /**
   * État expanded (pour détails inline)
   */
  isExpanded?: boolean

  /**
   * Classe CSS additionnelle
   */
  className?: string
}

export const StockMovementCard: React.FC<StockMovementCardProps>
```

#### Design Specs

**Layout Grid 3 Colonnes**:

```
┌──────────────────────────────────────────────────────────────┐
│ [ICON]  │  PRODUIT INFO           │  QUANTITÉ & META        │
│         │                          │                          │
│  ↓ IN   │  Chaise Bar Velours     │  +50 unités             │
│         │  SKU-12345              │  (120 → 170)            │
│         │  30/10/2025 14:23       │                          │
│         │                          │  [👁 Détails]           │
└──────────────────────────────────────────────────────────────┘

EXPANDED:
┌──────────────────────────────────────────────────────────────┐
│ [ICON]  │  PRODUIT INFO           │  QUANTITÉ & META        │
│         │  ...                     │  ...                     │
├──────────────────────────────────────────────────────────────┤
│ DÉTAILS COMPLETS                                             │
│ ─────────────────────────────────────────────────────────────│
│ Type:        Réception fournisseur                           │
│ Référence:   PO-2025-0456                                   │
│ Canal:       [●B2B] Business Pro SAS         (si OUT)        │
│ Raison:      Correction inventaire physique  (si ADJUST)     │
│ Utilisateur: Marie Dubois                                    │
│ Notes:       Livraison partielle lot 2/3                     │
└──────────────────────────────────────────────────────────────┘
```

**Badge Type Mouvement**:

| Type | Icon | Color | Background | Text |
|------|------|-------|------------|------|
| **IN** | ↓ | Success | `bg-green-50` | `text-green-600` |
| **OUT** | ↑ | Danger | `bg-red-50` | `text-red-600` |
| **ADJUST** | ⚙ | Primary | `bg-blue-50` | `text-blue-600` |

**Responsive**:
- Desktop (>1024px): Grid 3 colonnes `grid-cols-[auto_1fr_auto]`
- Tablet (768-1024px): Grid 2 colonnes `grid-cols-[auto_1fr]`, actions en bas
- Mobile (<768px): Stack vertical `flex flex-col`, icône en haut

**Micro-interactions**:
```css
.movement-card {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.movement-card:hover {
  border-color: currentColor; /* Couleur type mouvement */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.movement-card-details {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease-in-out;
}

.movement-card.expanded .movement-card-details {
  max-height: 500px;
}
```

#### Usage Example

```tsx
const movements: StockMovement[] = [/* ... */]
const [expandedId, setExpandedId] = useState<string | null>(null)

return (
  <div className="space-y-3">
    {movements.map(movement => (
      <StockMovementCard
        key={movement.id}
        type={movement.movement_type}
        productName={movement.product_name}
        productSku={movement.product_sku}
        quantityChange={movement.quantity_change}
        quantityBefore={movement.quantity_before}
        quantityAfter={movement.quantity_after}
        performedAt={new Date(movement.performed_at)}
        channel={movement.channel}
        reference={movement.reference}
        isExpanded={expandedId === movement.id}
        onDetailsClick={() => setExpandedId(
          expandedId === movement.id ? null : movement.id
        )}
      />
    ))}
  </div>
)
```

---

## 🎭 MICRO-INTERACTIONS 2025

### Principes Généraux

**Performance Targets**:
- **Hover/Focus**: <150ms (perceptible instantané)
- **Transitions simples**: 200-300ms (naturel, pas robotique)
- **Modals/Overlays**: 300-400ms (anticipation + feedback)
- **Animations complexes**: <600ms max (jamais frustrant)

**Easing Functions**:
```css
/* Standard transitions (hover, focus) */
cubic-bezier(0.4, 0, 0.2, 1) /* ease-in-out custom */

/* Entrées (modals, dropdowns) */
cubic-bezier(0, 0, 0.2, 1) /* ease-out */

/* Sorties (dismiss, close) */
cubic-bezier(0.4, 0, 1, 1) /* ease-in */
```

### Catalogue Micro-Interactions

#### 1. Hover States

**KPI Cards**:
```css
.kpi-card {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-card:hover {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
```

**Buttons**:
```css
.button {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
```

**Badges**:
```css
.badge {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.badge:hover {
  transform: scale(1.05);
}
```

#### 2. Loading States

**Skeleton Loaders** (pas spinners):
```tsx
// Préférer skeleton au lieu de spinner
<div className="space-y-3">
  <Skeleton className="h-20 w-full rounded-lg" /> {/* KPI */}
  <Skeleton className="h-32 w-full rounded-lg" /> {/* Card */}
  <Skeleton className="h-16 w-full rounded-lg" /> {/* Movement */}
</div>

// Animation pulse Tailwind
<div className="animate-pulse bg-gray-200 h-20 rounded-lg" />
```

**Progress Indicators**:
```tsx
// Pour actions longues (>2s)
<Progress value={uploadProgress} className="h-2" />

// Avec feedback textuel
<div className="space-y-2">
  <Progress value={75} />
  <p className="text-sm text-gray-600">Upload 75% (3/4 fichiers)</p>
</div>
```

#### 3. Optimistic Updates

**Principe**: Instant feedback avant API response, rollback si erreur.

```tsx
const [movements, setMovements] = useState<Movement[]>([])

const addMovement = async (movement: NewMovement) => {
  // 1. Optimistic update IMMÉDIAT
  const tempId = `temp-${Date.now()}`
  const optimisticMovement = { ...movement, id: tempId, status: 'pending' }
  setMovements(prev => [optimisticMovement, ...prev])

  // 2. Toast instant feedback
  toast.success('Mouvement enregistré...', { duration: 1000 })

  try {
    // 3. API call background
    const saved = await api.movements.create(movement)

    // 4. Replace temp par réel
    setMovements(prev => prev.map(m =>
      m.id === tempId ? saved : m
    ))

    // 5. Confirmation finale
    toast.success('Mouvement validé ✅', { duration: 2000 })

  } catch (error) {
    // 6. Rollback si erreur
    setMovements(prev => prev.filter(m => m.id !== tempId))
    toast.error('Erreur: mouvement annulé', { duration: 4000 })
  }
}
```

#### 4. Toast Notifications

**Position**: Bottom-right (non-intrusif, ne masque pas contenu principal)

```tsx
import { toast } from 'sonner'

// Success (green)
toast.success('Stock mis à jour', {
  description: '+50 unités Chaise Bar Velours',
  duration: 3000,
})

// Error (red)
toast.error('Erreur mise à jour stock', {
  description: 'Stock insuffisant pour cette opération',
  duration: 5000,
  action: {
    label: 'Voir détails',
    onClick: () => openErrorModal(),
  },
})

// Warning (orange)
toast.warning('Stock faible détecté', {
  description: '12 produits nécessitent réapprovisionnement',
  duration: 4000,
  action: {
    label: 'Voir alertes',
    onClick: () => router.push('/stocks#alertes'),
  },
})

// Info (blue)
toast.info('Export CSV en cours...', {
  duration: 2000,
})
```

#### 5. Smooth Scrolling

**Scroll vers section après click**:
```tsx
const scrollToAlerts = () => {
  document.getElementById('alertes')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

<button onClick={scrollToAlerts}>
  Voir alertes
</button>
```

#### 6. Collapsible Sections

**Filtres + Détails cards**:
```tsx
const [filtersOpen, setFiltersOpen] = useState(true)

<Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
  <CollapsibleTrigger className="flex items-center gap-2">
    <span>FILTRES</span>
    <ChevronDown className={cn(
      "h-4 w-4 transition-transform duration-200",
      filtersOpen && "rotate-180"
    )} />
  </CollapsibleTrigger>

  <CollapsibleContent className="overflow-hidden transition-all duration-300 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
    {/* Contenu filtres */}
  </CollapsibleContent>
</Collapsible>
```

#### 7. Keyboard Shortcuts

**Command Palette** (future):
```tsx
// ⌘K pour ouvrir command palette
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setCommandOpen(true)
    }
  }

  document.addEventListener('keydown', down)
  return () => document.removeEventListener('keydown', down)
}, [])

<CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
  <CommandInput placeholder="Rechercher action ou produit..." />
  <CommandList>
    <CommandGroup heading="Actions Rapides">
      <CommandItem onSelect={() => router.push('/stocks/mouvements')}>
        📊 Voir mouvements
      </CommandItem>
      <CommandItem onSelect={() => router.push('/stocks/inventaire')}>
        📦 Inventaire complet
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints Tailwind

| Breakpoint | Min Width | Layout | Colonnes Grid |
|------------|-----------|--------|---------------|
| **sm** | 640px | Mobile large | 1 col |
| **md** | 768px | Tablet portrait | 2 cols |
| **lg** | 1024px | Tablet landscape | 3 cols |
| **xl** | 1280px | Desktop | 4 cols |
| **2xl** | 1536px | Large desktop | 4+ cols |

### Patterns Responsive

#### 1. KPI Cards Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {/*
    Mobile: 1 colonne (stack vertical)
    Tablet: 2 colonnes (2x2 grid)
    Desktop: 4 colonnes (horizontal)
  */}
  <KPICard title="Stock Réel" value={2456} />
  <KPICard title="Disponible" value={1834} />
  <KPICard title="Alertes" value={12} />
  <KPICard title="Valeur" value={456789} />
</div>
```

#### 2. Filtres Inline → Drawer Mobile

```tsx
// Desktop: Filtres inline collapsibles
// Mobile: Drawer latéral full-screen

const [filtersOpen, setFiltersOpen] = useState(false)

return (
  <>
    {/* Desktop: Inline */}
    <Card className="hidden md:block">
      <Collapsible open={filtersOpen}>
        {/* Filtres content */}
      </Collapsible>
    </Card>

    {/* Mobile: Drawer */}
    <div className="md:hidden">
      <Button onClick={() => setFiltersOpen(true)}>
        🔍 Filtres
      </Button>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-full sm:w-80">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          {/* Même contenu filtres */}
        </SheetContent>
      </Sheet>
    </div>
  </>
)
```

#### 3. Table → Cards Mobile

```tsx
// Desktop: Table traditionnelle
// Mobile: Cards stack vertical

<div className="hidden md:block">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Produit</TableHead>
        <TableHead>Réel</TableHead>
        <TableHead>Dispo</TableHead>
        {/* ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {products.map(product => (
        <TableRow key={product.id}>
          <TableCell>{product.name}</TableCell>
          <TableCell>{product.stock_real}</TableCell>
          {/* ... */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>

<div className="md:hidden space-y-3">
  {products.map(product => (
    <Card key={product.id}>
      <CardHeader>
        <CardTitle className="text-base">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Réel:</span>
            <span className="font-medium ml-2">{product.stock_real}</span>
          </div>
          <div>
            <span className="text-gray-600">Dispo:</span>
            <span className="font-medium ml-2">{product.stock_available}</span>
          </div>
          {/* ... */}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

#### 4. Navigation Buttons → Bottom Tabs Mobile

```tsx
// Desktop: Buttons horizontal inline
// Mobile: Bottom fixed tabs (iOS/Android style)

<div className="hidden md:flex gap-2">
  <Button onClick={() => router.push('/stocks/inventaire')}>
    Inventaire
  </Button>
  <Button onClick={() => router.push('/stocks/mouvements')}>
    Mouvements
  </Button>
</div>

<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
  <div className="flex justify-around">
    <button className="flex flex-col items-center gap-1">
      <Package className="h-5 w-5" />
      <span className="text-xs">Inventaire</span>
    </button>
    <button className="flex flex-col items-center gap-1">
      <ArrowUpDown className="h-5 w-5" />
      <span className="text-xs">Mouvements</span>
    </button>
  </div>
</div>
```

---

## ♿ ACCESSIBILITY (WCAG AA)

### Checklist Obligatoire

#### 1. Contraste Couleurs

**Minimum WCAG AA**: 4.5:1 pour texte normal, 3:1 pour texte large (≥18px)

**Vérification Design System V2**:

| Élément | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Badge B2B | `text-blue-800` | `bg-blue-100` | 7.2:1 | ✅ Pass |
| Badge E-commerce | `text-purple-800` | `bg-purple-100` | 6.8:1 | ✅ Pass |
| Badge Retail | `text-orange-800` | `bg-orange-100` | 5.1:1 | ✅ Pass |
| Badge Wholesale | `text-green-800` | `bg-green-100` | 6.5:1 | ✅ Pass |
| Badge IN | `text-green-600` | `bg-green-50` | 4.9:1 | ✅ Pass |
| Badge OUT | `text-red-600` | `bg-red-50` | 5.2:1 | ✅ Pass |
| Text Primary | `text-black` | `bg-white` | 21:1 | ✅ Pass |
| Text Secondary | `text-gray-600` | `bg-white` | 6.8:1 | ✅ Pass |

**Outil vérification**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### 2. Keyboard Navigation

**Tous éléments interactifs doivent être accessibles au clavier**:

```tsx
// ✅ CORRECT
<button
  className="..."
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Action
</button>

// ✅ CORRECT - Composant shadcn/ui déjà accessible
<Button onClick={handleClick}>Action</Button>

// ❌ INCORRECT - Div non accessible
<div onClick={handleClick}>Action</div>
```

**Focus visible obligatoire**:
```css
/* Tous éléments focusables */
*:focus-visible {
  outline: 2px solid #3b86d1; /* Primary color */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Tailwind classes */
.focus-visible:ring-2
.focus-visible:ring-blue-500
.focus-visible:ring-offset-2
```

**Shortcuts clavier standards**:
- `Tab`: Focus suivant
- `Shift + Tab`: Focus précédent
- `Enter` / `Space`: Activer élément
- `Esc`: Fermer modal/dropdown
- `Arrow Up/Down`: Navigation liste
- `Home/End`: Premier/Dernier élément

#### 3. ARIA Labels

**Labels descriptifs pour screen readers**:

```tsx
// Buttons avec icônes seules
<button aria-label="Actualiser les données">
  <RefreshCw className="h-4 w-4" />
</button>

// Filtres avec state
<button
  aria-label="Filtres"
  aria-expanded={filtersOpen}
  aria-controls="filters-content"
>
  Filtres {filtersOpen ? '▲' : '▼'}
</button>

// Badges informatifs
<Badge aria-label="Canal de vente B2B Business to Business">
  B2B
</Badge>

// Status indicators
<div
  role="status"
  aria-live="polite"
  aria-label={`${alertCount} alertes stock détectées`}
>
  <AlertTriangle />
  {alertCount} alertes
</div>

// Tables
<table aria-label="Inventaire stock produits">
  <thead>
    <tr>
      <th scope="col">Produit</th>
      <th scope="col">Stock Réel</th>
      {/* ... */}
    </tr>
  </thead>
</table>
```

#### 4. Semantic HTML

**Utiliser balises sémantiques appropriées**:

```tsx
// ✅ CORRECT - Structure sémantique
<main>
  <header>
    <h1>Stocks</h1>
    <nav aria-label="Navigation principale stocks">
      <a href="/stocks/inventaire">Inventaire</a>
      <a href="/stocks/mouvements">Mouvements</a>
    </nav>
  </header>

  <section aria-labelledby="kpis-heading">
    <h2 id="kpis-heading" className="sr-only">Indicateurs clés</h2>
    {/* KPI cards */}
  </section>

  <section aria-labelledby="movements-heading">
    <h2 id="movements-heading">Mouvements Récents</h2>
    <article>
      {/* Movement card */}
    </article>
  </section>
</main>

// ❌ INCORRECT - Div soup
<div>
  <div>
    <div>Stocks</div>
    <div>
      <div>Inventaire</div>
      <div>Mouvements</div>
    </div>
  </div>
</div>
```

#### 5. Screen Reader Support

**Visually hidden labels**:
```tsx
// Classe Tailwind pour masquer visuellement mais garder pour SR
<span className="sr-only">
  Stock réel: 2456 unités
</span>
<span aria-hidden="true">2,456</span>

// Custom CSS
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Live regions pour updates dynamiques**:
```tsx
// Announce stock updates
<div role="status" aria-live="polite" aria-atomic="true">
  {updateMessage && <p>{updateMessage}</p>}
</div>

// Usage
setUpdateMessage('Stock mis à jour: +50 unités Chaise Bar Velours')
setTimeout(() => setUpdateMessage(''), 3000)
```

#### 6. Forms Accessibility

**Labels + Error messages**:
```tsx
<div>
  <Label htmlFor="product-search">
    Rechercher produit
  </Label>
  <Input
    id="product-search"
    type="search"
    placeholder="Nom ou SKU..."
    aria-describedby={error ? 'search-error' : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <p id="search-error" className="text-red-600 text-sm" role="alert">
      {error}
    </p>
  )}
</div>
```

---

## 🚀 PLAN DE MIGRATION PROGRESSIVE

### Phase 1: Fondations (Semaine 1)

**Objectif**: Créer composants universels réutilisables.

**Tâches**:
1. ✅ Créer `ChannelBadge.tsx` avec variants + tests
2. ✅ Créer `ChannelFilter.tsx` avec multi-select + tests
3. ✅ Créer `StockMovementCard.tsx` avec expand + tests
4. ✅ Créer Storybook stories pour chaque composant
5. ✅ Valider accessibility (WCAG AA tests automatisés)

**Livrable**: 3 composants production-ready + Storybook documentation

**Tests validation**:
```bash
npm run test:components  # Vitest unit tests
npm run test:a11y        # axe-core accessibility tests
npm run storybook        # Visual regression tests
```

---

### Phase 2: Page Mouvements (Semaine 2)

**Objectif**: Améliorer `/stocks/mouvements` avec tabs + filtres inline.

**Tâches**:
1. ✅ Ajouter shadcn/ui Tabs component (Tous | Entrées | Sorties | Ajustements)
2. ✅ Implémenter filtres inline collapsibles (Période, Canal, Produit, Type)
3. ✅ Remplacer liste actuelle par `StockMovementCard` components
4. ✅ Ajouter infinite scroll (react-intersection-observer)
5. ✅ Tests Playwright workflow complet

**Livrable**: `/stocks/mouvements` optimisé avec filtres + tabs

**Tests validation**:
```bash
npm run test:e2e -- stocks/mouvements  # Playwright
npm run lighthouse -- /stocks/mouvements  # Performance
```

**Redirects à ajouter** (next.config.js):
```javascript
{
  source: '/stocks/entrees',
  destination: '/stocks/mouvements?tab=entrees',
  permanent: false
},
{
  source: '/stocks/sorties',
  destination: '/stocks/mouvements?tab=sorties',
  permanent: false
},
```

---

### Phase 3: Page Inventaire (Semaine 3)

**Objectif**: Améliorer `/stocks/inventaire` avec filtres + export CSV.

**Tâches**:
1. ✅ Ajouter filtres inline (Catégorie, Fournisseur, Statut, Search)
2. ✅ Améliorer table avec sorting colonnes (shadcn/ui Table + TanStack Table)
3. ✅ Implémenter export CSV avec progress indicator
4. ✅ Responsive: Table desktop → Cards mobile
5. ✅ Tests Playwright workflow complet

**Livrable**: `/stocks/inventaire` optimisé avec filtres + export

**Tests validation**:
```bash
npm run test:e2e -- stocks/inventaire
npm run test:csv-export  # Validation format CSV
```

**Redirect à ajouter**:
```javascript
{
  source: '/stocks/produits',
  destination: '/stocks/inventaire',
  permanent: true  // Permanent car page supprimée
},
```

---

### Phase 4: Dashboard Optimisé (Semaine 4)

**Objectif**: Optimiser `/stocks` avec navigation améliorée.

**Tâches**:
1. ✅ Optimiser layout navigation (déjà bien, refinements mineurs)
2. ✅ Fusionner widget Alertes (enlever page séparée)
3. ✅ Améliorer micro-interactions KPI cards
4. ✅ Ajouter skeleton loaders
5. ✅ Tests performance Lighthouse (target >90)

**Livrable**: `/stocks` optimisé avec navigation fluide

**Tests validation**:
```bash
npm run lighthouse -- /stocks  # Target: Performance >90, A11y 100
npm run test:e2e -- stocks/dashboard
```

**Redirect à ajouter**:
```javascript
{
  source: '/stocks/alertes',
  destination: '/stocks#alertes',
  permanent: false
},
```

---

### Phase 5: Cleanup & Documentation (Semaine 5)

**Objectif**: Supprimer ancien code, documenter nouveau système.

**Tâches**:
1. ✅ Supprimer pages obsolètes (`/stocks/entrees`, `/sorties`, etc.)
2. ✅ Cleanup hooks inutilisés
3. ✅ Créer documentation utilisateur (screenshots + workflows)
4. ✅ Créer documentation développeur (architecture + composants)
5. ✅ Formation utilisateurs (vidéo démo 5min)

**Livrable**: Codebase nettoyé + documentation complète

**Documentation à créer**:
- `docs/user-guides/stocks-module-guide.md` (screenshots + GIFs)
- `docs/developer/stocks-components-api.md` (props + examples)
- Vidéo démo 5min (Loom): Workflows clés nouveau système

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs UX

| Métrique | Avant | Objectif | Mesure |
|----------|-------|----------|--------|
| **Pages module** | 10 | 3 | -70% |
| **Clics pour action courante** | 3-4 | 1-2 | -50% |
| **Temps health check** | 2-3min | <30s | -80% |
| **Satisfaction utilisateurs** | N/A | >4/5 | Survey post-migration |

### KPIs Performance

| Métrique | Target | Mesure |
|----------|--------|--------|
| **Lighthouse Performance** | >90 | CI/CD |
| **Lighthouse Accessibility** | 100 | CI/CD |
| **First Contentful Paint** | <1.5s | Vercel Analytics |
| **Largest Contentful Paint** | <2.5s | Vercel Analytics |
| **Cumulative Layout Shift** | <0.1 | Vercel Analytics |
| **Time to Interactive** | <3s | Vercel Analytics |

### KPIs Accessibilité

| Métrique | Target | Outil |
|----------|--------|-------|
| **WCAG AA Conformité** | 100% | axe DevTools |
| **Keyboard Navigation** | 100% fonctionnel | Tests manuels |
| **Screen Reader Support** | 100% fonctionnel | NVDA/JAWS tests |
| **Color Contrast Ratio** | >4.5:1 | WebAIM Checker |

---

## 🎓 GUIDELINES DESIGN SYSTEM

### Principes Directeurs

1. **Minimalisme Fonctionnel**: Chaque élément a un but clair, pas de décoration inutile
2. **Cohérence Absolue**: Mêmes patterns dans toute l'application
3. **Performance d'Abord**: <100ms interactions, <2s chargement pages
4. **Accessible par Défaut**: WCAG AA non-négociable, keyboard-first
5. **Mobile-Aware**: Responsive thoughtful, pas afterthought

### Spacing System

**Base 4px** (Tailwind default):
- `gap-1` (4px): Elements très proches (icône + texte)
- `gap-2` (8px): Badges adjacents, buttons groups
- `gap-3` (12px): Cards list items
- `gap-4` (16px): Sections content
- `gap-6` (24px): Major sections

### Typography Scale

**Headings**:
- `text-xs` (12px): Labels, metadata
- `text-sm` (14px): Body text, descriptions
- `text-base` (16px): Card titles, buttons
- `text-lg` (18px): Section headings
- `text-xl` (20px): Page titles
- `text-2xl` (24px): Hero titles

**Font Weights**:
- `font-medium` (500): Labels, secondary emphasis
- `font-semibold` (600): Headings, primary emphasis
- `font-bold` (700): Stats, KPIs

### Shadow System

**Elevation hierarchy**:
```css
/* Level 1: Subtle (cards at rest) */
shadow-sm: 0 1px 2px rgba(0,0,0,0.05)

/* Level 2: Medium (cards hover, dropdowns) */
shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)

/* Level 3: High (modals, popovers) */
shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)

/* Level 4: Very High (command palette) */
shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)
```

### Border Radius

**Rounded corners 2025**:
- `rounded-md` (6px): Inputs, small buttons
- `rounded-lg` (8px): Cards standard
- `rounded-[10px]` (10px): Featured cards (KPIs)
- `rounded-xl` (12px): Large modals
- `rounded-full` (9999px): Pills, badges circulaires

### Color Usage Guidelines

**Semantic Colors** (Design System V2):
- **Primary (#3b86d1)**: Actions principales, liens, focus states
- **Success (#38ce3c)**: Validations, statuts positifs, entrées stock
- **Warning (#ff9b3e)**: Alertes non-critiques, attention requise
- **Accent (#844fc1)**: Highlights, CTAs secondaires, e-commerce
- **Danger (#ff4d6b)**: Erreurs, actions destructives, sorties stock
- **Neutral (#6c7293)**: Texte secondaire, borders, backgrounds

**Usage rules**:
- ❌ JAMAIS utiliser couleur pure (red-500) directement
- ✅ TOUJOURS utiliser variants sémantiques (bg-red-50, text-red-600)
- ✅ TOUJOURS vérifier contraste WCAG AA
- ✅ TOUJOURS tester mode sombre (future)

---

## 📚 RESSOURCES ADDITIONNELLES

### Documentation Officielle

- **shadcn/ui**: https://ui.shadcn.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives/docs/overview/introduction
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Next.js 15**: https://nextjs.org/docs
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/

### Outils Design

- **Figma Vérone**: [Lien workspace] (à créer)
- **Storybook**: http://localhost:6006 (local dev)
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **axe DevTools**: Extension Chrome/Firefox

### Inspirations

- **Linear**: https://linear.app (minimalism, keyboard-first)
- **Odoo 17**: https://www.odoo.com/demo (ERP modern UI)
- **Stripe Dashboard**: https://dashboard.stripe.com (data visualization)
- **Notion**: https://notion.so (progressive disclosure)

---

## ✅ CHECKLIST VALIDATION FINALE

### Design

- [ ] Wireframes 3 pages validés
- [ ] Composants universels spécifiés (props TypeScript)
- [ ] Palette couleurs canaux documentée
- [ ] Micro-interactions définies (timing + easing)
- [ ] Responsive breakpoints planifiés
- [ ] Accessibility WCAG AA validé

### Développement

- [ ] `ChannelBadge.tsx` créé + tests
- [ ] `ChannelFilter.tsx` créé + tests
- [ ] `StockMovementCard.tsx` créé + tests
- [ ] Storybook stories complètes
- [ ] Page `/stocks/mouvements` optimisée
- [ ] Page `/stocks/inventaire` optimisée
- [ ] Page `/stocks` dashboard optimisé
- [ ] Redirects Next.js configurés
- [ ] Ancien code supprimé

### Tests

- [ ] Unit tests (Vitest) >80% coverage
- [ ] E2E tests (Playwright) workflows complets
- [ ] Accessibility tests (axe-core) 100% pass
- [ ] Performance tests (Lighthouse) >90 score
- [ ] Visual regression tests (Storybook)
- [ ] Cross-browser tests (Chrome, Firefox, Safari)

### Documentation

- [ ] User guide créé (screenshots + workflows)
- [ ] Developer docs créé (architecture + API)
- [ ] Vidéo démo 5min enregistrée
- [ ] Migration guide rédigé
- [ ] Changelog mis à jour

---

**Document créé par**: Claude (Vérone Design Expert)
**Date**: 2025-10-31
**Version**: 1.0
**Statut**: ✅ Prêt pour implémentation Phase 1

**Next Steps**: Validation stakeholders → Démarrage Phase 1 (composants universels)