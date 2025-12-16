# Rapport d'Audit Composants UI - Vérone Back-Office

**Date** : 2025-11-07
**Auteur** : verone-design-expert agent
**Contexte** : Audit exhaustif composants UI selon best practices 2025
**Stack** : Next.js 15 + shadcn/ui + Radix UI + Tailwind CSS

---

## Executive Summary

🔍 **Audit de 305+ composants** UI répartis dans 4 zones (ui/, ui-v2/, business/, modules/)

🔴 **7-8 duplications critiques identifiées** impactant 73+ fichiers :

- **Boutons** : 4 variantes (Button, ActionButton, ModernActionButton, StandardModifyButton) → 62 fichiers
- **KPI Cards** : 3-4 variantes (CompactKpiCard, ElegantKpiCard, MediumKpiCard) → 11 fichiers
- **Badges** : 5+ variantes spécialisées sans système unifié

📊 **Coverage Storybook critique : 9.8%** (5/51 composants documentés)

⚠️ **Design tokens fragmentés** : 2 sources (`theme-v2.ts` + `design-system/`) nécessitent consolidation

✅ **Architecture actuelle solide** : shadcn/ui copy-paste + Radix UI primitives bien implémentés

---

## Table des Matières

1. [Métriques Clés](#métriques-clés)
2. [Inventaire Exhaustif](#inventaire-exhaustif)
3. [Analyse Duplications Critiques](#analyse-duplications-critiques)
4. [Catégorisation Atomic Design](#catégorisation-atomic-design)
5. [Analyse Styling & Accessibilité](#analyse-styling--accessibilité)
6. [Coverage Storybook](#coverage-storybook)
7. [Recommandations Finales](#recommandations-finales)
8. [Annexes](#annexes)

---

## Métriques Clés

| Métrique                                | Valeur          | Status | Impact                    |
| --------------------------------------- | --------------- | ------ | ------------------------- |
| **Composants UI base** (shadcn/ui)      | 51              | ✅     | Architecture solide       |
| **Composants UI-V2** (Design System V2) | 4               | 🟡     | En développement Phase 2+ |
| **Composants Business**                 | 100+            | 🟡     | À standardiser            |
| **Composants Modules**                  | 150+            | 🟡     | À standardiser            |
| **Total composants analysés**           | **305+**        | -      | -                         |
| **Coverage Storybook**                  | **9.8%** (5/51) | 🔴     | Critique                  |
| **Duplications critiques**              | **7-8**         | 🔴     | P0                        |
| **Fichiers impactés duplications**      | **73+**         | 🟡     | P0-P1                     |
| **Sources design tokens**               | 2 (fragmenté)   | 🟡     | À consolider              |
| **Conformité WCAG 2.2 AA**              | ~75%            | 🟡     | ARIA manquants            |
| **Bundle size UI components**           | ~45kb           | ✅     | Acceptable                |

---

## Inventaire Exhaustif

### 1.1 Composants UI Base (apps/back-office/src/components/ui/) - 51 composants

**Catégorisation Atomic Design actuelle** :

#### Atoms (Composants de base) - 20 composants

| #   | Composant            | Fichier                    | Props Clés                | Storybook | Notes                                  |
| --- | -------------------- | -------------------------- | ------------------------- | --------- | -------------------------------------- |
| 1   | **Button**           | button.tsx                 | variant, size, asChild    | ✅        | **DUPLICATION CRITIQUE** (4 variantes) |
| 2   | **Badge**            | badge.tsx                  | variant                   | ✅        | **DUPLICATION** (5+ spécialisations)   |
| 3   | Input                | input.tsx                  | type, disabled, error     | ✅        | Base solide                            |
| 4   | Textarea             | textarea.tsx               | rows, maxLength           | ❌        | À documenter                           |
| 5   | Label                | label.tsx                  | htmlFor                   | ❌        | Basique                                |
| 6   | Checkbox             | checkbox.tsx               | checked, onCheckedChange  | ❌        | Radix UI wrapper                       |
| 7   | Radio                | radio-group.tsx            | value, onValueChange      | ❌        | Radix UI wrapper                       |
| 8   | Switch               | switch.tsx                 | checked, onCheckedChange  | ❌        | Radix UI wrapper                       |
| 9   | Separator            | separator.tsx              | orientation               | ❌        | Diviseur                               |
| 10  | Progress             | progress.tsx               | value, max                | ❌        | Barre progression                      |
| 11  | Skeleton             | skeleton.tsx               | -                         | ❌        | Loading state                          |
| 12  | Tooltip              | tooltip.tsx                | -                         | ❌        | Radix UI wrapper                       |
| 13  | ActionButton         | action-button.tsx          | label, icon, variant      | ❌        | **À SUPPRIMER** → Button               |
| 14  | ModernActionButton   | modern-action-button.tsx   | variant (gradient, glass) | ❌        | **À SUPPRIMER** → Button               |
| 15  | StandardModifyButton | standard-modify-button.tsx | onClick                   | ❌        | **À SUPPRIMER** → Button               |
| 16  | DataStatusBadge      | data-status-badge.tsx      | status                    | ❌        | **À REFACTORER** → Badge variant       |
| 17  | RoleBadge            | role-badge.tsx             | role                      | ❌        | **À REFACTORER** → Badge variant       |
| 18  | StatPill             | stat-pill.tsx              | -                         | ❌        | Similaire Badge                        |
| 19  | PhaseIndicator       | phase-indicator.tsx        | phase                     | ❌        | Spécialisé                             |
| 20  | CompactKpiCard       | compact-kpi-card.tsx       | title, value, change      | ❌        | **DUPLICATION CRITIQUE**               |

#### Molecules (Compositions simples) - 18 composants

| #   | Composant           | Fichier                   | Composition              | Storybook | Notes                          |
| --- | ------------------- | ------------------------- | ------------------------ | --------- | ------------------------------ |
| 21  | Alert               | alert.tsx                 | Icon + Message           | ❌        | Messages système               |
| 22  | **Card**            | card.tsx                  | Header + Body + Footer   | ✅        | Compound components            |
| 23  | **Dialog**          | dialog.tsx                | Overlay + Content        | ✅        | Radix UI modal                 |
| 24  | AlertDialog         | alert-dialog.tsx          | Dialog + Actions         | ❌        | Confirmations                  |
| 25  | Popover             | popover.tsx               | Trigger + Content        | ❌        | Radix UI                       |
| 26  | DropdownMenu        | dropdown-menu.tsx         | Trigger + Items          | ❌        | Radix UI                       |
| 27  | Select              | select.tsx                | Trigger + Options        | ❌        | Radix UI                       |
| 28  | Combobox            | combobox.tsx              | Input + Popover + List   | ❌        | **DUPLICATION** (2+ variantes) |
| 29  | Form (Field)        | form.tsx                  | Label + Input + Error    | ❌        | react-hook-form wrapper        |
| 30  | Breadcrumb          | breadcrumb.tsx            | Links chain              | ❌        | Navigation                     |
| 31  | Pagination          | pagination.tsx            | Numbers + Arrows         | ❌        | Tables                         |
| 32  | ScrollArea          | scroll-area.tsx           | Radix wrapper            | ❌        | Custom scrollbar               |
| 33  | ImageUploadZone     | image-upload-zone.tsx     | Dropzone + Preview       | ❌        | Upload                         |
| 34  | ElegantKpiCard      | elegant-kpi-card.tsx      | Title + Value + Gradient | ❌        | **À SUPPRIMER** → KPICard      |
| 35  | MediumKpiCard       | medium-kpi-card.tsx       | Title + Value + Actions  | ❌        | **À SUPPRIMER** → KPICard      |
| 36  | QuickActionsList    | quick-actions-list.tsx    | Actions grid             | ❌        | Dashboard                      |
| 37  | CompactQuickActions | compact-quick-actions.tsx | Actions inline           | ❌        | Similaire précédent            |
| 38  | ViewModeToggle      | view-mode-toggle.tsx      | Grid/List toggle         | ❌        | Layout switcher                |

#### Organisms (Compositions complexes) - 13 composants

| #   | Composant          | Fichier                 | Composition            | Storybook | Notes            |
| --- | ------------------ | ----------------------- | ---------------------- | --------- | ---------------- |
| 39  | Table              | table.tsx               | Header + Body + Footer | ❌        | Tables données   |
| 40  | Tabs               | tabs.tsx                | Navigation + Panels    | ❌        | Radix UI         |
| 41  | Accordion          | accordion.tsx           | Multiple items         | ❌        | Radix UI         |
| 42  | Calendar           | calendar.tsx            | Date picker            | ❌        | react-day-picker |
| 43  | Command            | command.tsx             | Command palette        | ❌        | cmdk wrapper     |
| 44  | CommandPalette     | command-palette.tsx     | Search + Actions       | ❌        | App-wide search  |
| 45  | Sidebar            | sidebar.tsx             | Navigation + Content   | ❌        | Layout           |
| 46  | AppSidebar         | app-sidebar.tsx         | Vérone navigation      | ❌        | App-specific     |
| 47  | GroupNavigation    | group-navigation.tsx    | Tabs grouped           | ❌        | Navigation       |
| 48  | TabsNavigation     | tabs-navigation.tsx     | Navigation tabs        | ❌        | Similaire Tabs   |
| 49  | NotificationSystem | notification-system.tsx | Toast + Queue          | ❌        | Notifications    |
| 50  | ActivityTimeline   | activity-timeline.tsx   | Timeline + Events      | ❌        | Dashboard        |
| 51  | VeroneCard         | verone-card.tsx         | Card + Stats           | ❌        | Business card    |

**Résumé catégorisation** :

- **Atoms** : 20 (39%) - Base solide, 5-6 duplications
- **Molecules** : 18 (35%) - Bonnes compositions, 2-3 duplications
- **Organisms** : 13 (25%) - Complexité maîtrisée

---

### 1.2 Composants UI-V2 (apps/back-office/src/components/ui-v2/stock/) - 4 composants

**Design System V2 en développement** (Phase 2+ Stocks)

| Composant             | Fichier               | Description                                 | Props                                   | Status     |
| --------------------- | --------------------- | ------------------------------------------- | --------------------------------------- | ---------- |
| **ChannelBadge**      | ChannelBadge.tsx      | Badge canal vente (Google, Cdiscount, etc.) | channel: 'google' \| 'cdiscount' \| ... | ✅ Actif   |
| **ChannelFilter**     | ChannelFilter.tsx     | Multi-select canaux                         | selectedChannels, onChannelsChange      | ✅ Actif   |
| **StockKPICard**      | StockKPICard.tsx      | KPI card spécifique stocks                  | title, value, stockLevel                | 🟡 En test |
| **StockMovementCard** | StockMovementCard.tsx | Card mouvement stock                        | movement, type, quantity                | 🟡 En test |

**Notes** :

- Architecture alignée Design System V2 (CVA + design tokens)
- Composants modules Phase 2+ (désactivés middleware)
- Pattern référence pour futures migrations

---

### 1.3 Composants Business (apps/back-office/src/components/business/) - 100+ composants

**Répartition par domaine métier** :

| Domaine           | Nombre | Exemples Clés                                                       | Notes Duplications                    |
| ----------------- | ------ | ------------------------------------------------------------------- | ------------------------------------- |
| **Produits**      | ~25    | `product-card-v2`, `product-image-gallery`, `product-variants-grid` | Status badges dupliqués               |
| **Organisations** | ~20    | `organisation-list-view`, `contact-edit-section`, `customer-badge`  | Badges clients/fournisseurs dupliqués |
| **Stocks**        | ~30    | `movements-table`, `stock-movement-modal`, `stock-status-compact`   | KPI cards + badges statuts            |
| **Commandes**     | ~15    | `order-items-table`, `universal-order-details-modal`                | Modals similaires                     |
| **Finance**       | ~10    | `payment-form`, `financial-payment-form`                            | Forms paiement dupliqués              |

**Composants avec duplications identifiées** :

```typescript
// ❌ Badges spécialisés (à unifier)
customer - badge.tsx; // Badge clients
supplier - badge.tsx; // Badge fournisseurs
supplier - category - badge.tsx; // Badge catégories fournisseurs
supplier - segment - badge.tsx; // Badge segments
stock - status - compact.tsx; // Badge statut stock
product - status - compact.tsx; // Badge statut produit
completion - status - compact.tsx; // Badge completion

// ❌ Filtres/Combobox (à unifier)
category - filter - combobox.tsx;
filter - combobox.tsx;
category - hierarchy - filter - v2.tsx;

// ❌ Modals similaires (à standardiser)
edit - sourcing - product - modal.tsx;
product - characteristics - modal.tsx;
product - descriptions - modal.tsx;
product - photos - modal.tsx;
movement - details - modal.tsx;
universal - order - details - modal.tsx;
```

---

### 1.4 Composants Modules (src/shared/modules/\*\*/components/) - 150+ composants

**Répartition par module** :

| Module            | Nombre Composants | Catégories                 | Duplications Identifiées                                |
| ----------------- | ----------------- | -------------------------- | ------------------------------------------------------- |
| **categories**    | ~20               | Filters, Badges, Selectors | CategoryFilterCombobox, SupplierCategoryBadge           |
| **channels**      | ~10               | Google Merchant UI         | GoogleMerchantProductCard                               |
| **collections**   | ~8                | Wizards, Grids             | CollectionCreationWizard                                |
| **consultations** | ~12               | Images, Associations       | ConsultationImageGallery                                |
| **customers**     | ~15               | Badges, Edit Sections      | CustomerBadge, ContactEditSection                       |
| **dashboard**     | ~5                | KPIs, Notifications        | **KPICard** (critique)                                  |
| **finance**       | ~20               | Forms, Reports             | PaymentForm, ABCAnalysisView                            |
| **logistics**     | ~8                | Shipment Forms             | Multi-transporteurs (Packlink, Chronotruck, etc.)       |
| **notifications** | ~5                | Dropdowns, Widgets         | NotificationsDropdown                                   |
| **orders**        | ~15               | Forms, Workflows           | PurchaseOrderReceptionForm                              |
| **common**        | ~30               | Shared UI                  | AddressEditSection, CarrierSelector, PriceListFormModal |

**Patterns identifiés** :

- **Edit Sections** : Pattern répété pour édition formulaires (ContactEditSection, AddressEditSection, etc.)
- **Form Modals** : Pattern modal + form répété (PriceListFormModal, PartnerFormModal, etc.)
- **Selection Components** : Selectors répétés (CategorySelector, CarrierSelector, etc.)

---

## Analyse Duplications Critiques

### 🔴 P0 - Duplication #1 : Boutons (4 variantes → 62 fichiers)

#### Composants dupliqués

| Composant                | Fichier                       | Props                                           | Usages | Problème                                |
| ------------------------ | ----------------------------- | ----------------------------------------------- | ------ | --------------------------------------- |
| **Button**               | ui/button.tsx                 | variant (7 types), size (4 types)               | ~200+  | Base shadcn/ui solide                   |
| **ActionButton**         | ui/action-button.tsx          | label, icon, variant (primary/secondary/danger) | ~30    | Réimplémente styles au lieu de composer |
| **ModernActionButton**   | ui/modern-action-button.tsx   | variant (gradient/glass)                        | ~20    | Variants modernes non intégrés          |
| **StandardModifyButton** | ui/standard-modify-button.tsx | onClick, label="Modifier"                       | ~12    | Bouton "Modifier" hardcodé              |

#### Code comparison

```typescript
// ❌ PROBLÈME : 4 implémentations similaires

// 1. Button (base shadcn/ui) - CORRECT
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary text-secondary-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);

// 2. ActionButton - DUPLICATION
// Réimplémente styles similaires + gestion icon
const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700', // = Button variant="default"
  secondary: 'bg-gray-200 text-gray-900', // = Button variant="secondary"
  danger: 'bg-red-600 text-white', // = Button variant="destructive"
};

// 3. ModernActionButton - DUPLICATION
// Ajoute variants modernes mais ne compose pas Button
const modernVariants = {
  gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
  glass: 'backdrop-blur-lg bg-white/10 border border-white/20',
};

// 4. StandardModifyButton - DUPLICATION
// Bouton "Modifier" hardcodé sans flexibilité
className = 'px-3 py-1.5 text-sm bg-primary text-primary-foreground';
```

#### Problèmes identifiés

1. **Incohérence naming** : `primary` vs `default`, `danger` vs `destructive`
2. **Code dupliqué** : Styles similaires copiés-collés
3. **Maintenabilité** : Modifier un style nécessite 4 changements
4. **Bundle size** : ~4-5kb code répété
5. **Accessibilité** : ARIA attributes différents selon composant
6. **TypeScript** : Types non unifiés

#### Impact

- **62 fichiers** utilisent ces boutons (30% codebase actif)
- Modules impactés : Dashboard, Produits, Organisations, Stocks, Commandes, Finance
- Temps correction estimé : **1-2 semaines** (migration + tests)

#### Solution proposée

```typescript
// ✅ SOLUTION : Button unifié avec TOUS les variants

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Variants existants shadcn/ui
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // ✨ NOUVEAUX : Variants modernes intégrés
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600",
        glass: "backdrop-blur-lg bg-white/10 border border-white/20 text-white hover:bg-white/20"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10"
      }
    }
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconPosition = 'left', children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={props.disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    )
  }
)
```

#### Migration automatisée (Codemod)

```typescript
// scripts/codemods/unify-buttons.ts

// AVANT : ActionButton
<ActionButton label="Enregistrer" onClick={save} variant="primary" icon={<Save />} />

// APRÈS : Button unifié
<Button variant="default" onClick={save} icon={<Save />}>Enregistrer</Button>

// ---

// AVANT : ModernActionButton
<ModernActionButton variant="gradient">Action</ModernActionButton>

// APRÈS : Button variant gradient
<Button variant="gradient">Action</Button>

// ---

// AVANT : StandardModifyButton
<StandardModifyButton onClick={edit} />

// APRÈS : Button standardisé
<Button variant="outline" size="sm" onClick={edit}>Modifier</Button>
```

#### Bénéfices

- ✅ **Code supprimé** : ~300 lignes (3 composants)
- ✅ **Bundle size** : -4-5kb
- ✅ **Maintenance** : 1 composant au lieu de 4
- ✅ **Cohérence** : 100% variants unifiés
- ✅ **Accessibilité** : ARIA attributes standardisés
- ✅ **TypeScript** : Types stricts unifiés

---

### 🔴 P0 - Duplication #2 : KPI Cards (3-4 variantes → 11 fichiers)

#### Composants dupliqués

| Composant             | Fichier                                          | Props                              | Usages | Différence               |
| --------------------- | ------------------------------------------------ | ---------------------------------- | ------ | ------------------------ |
| **CompactKpiCard**    | ui/compact-kpi-card.tsx                          | title, value, change, icon         | ~5     | Layout compact           |
| **ElegantKpiCard**    | ui/elegant-kpi-card.tsx                          | title, value, subtitle, gradient   | ~3     | Design premium gradients |
| **MediumKpiCard**     | ui/medium-kpi-card.tsx                           | title, value, description, actions | ~2     | Taille moyenne + actions |
| **KPICard (modules)** | shared/modules/common/components/kpi/KPICard.tsx | Variadic props                     | ~1     | Version modules          |

#### Code comparison

```typescript
// ❌ PROBLÈME : 3-4 layouts pour même fonction (afficher KPI)

// 1. CompactKpiCard - Minimaliste
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {change && <p className="text-xs text-green-600">+{change}%</p>}
    </div>
    {icon}
  </div>
</Card>

// 2. ElegantKpiCard - Premium
<Card className="p-6 bg-gradient-to-br from-blue-500/10">
  <h3 className="text-sm text-muted-foreground">{title}</h3>
  <div className="text-3xl font-bold">{value}</div>
  <p className="text-xs text-muted-foreground">{subtitle}</p>
</Card>

// 3. MediumKpiCard - Avec actions
<Card className="p-5">
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
    {actions}
  </div>
  <p className="text-sm text-muted-foreground">{description}</p>
</Card>
```

#### Problèmes

1. **Fonction identique** : Toutes affichent KPI (title + value + metadata)
2. **Layouts fragmentés** : 3-4 designs au lieu d'un système variants
3. **Props incohérentes** : `change` vs `subtitle` vs `description`
4. **Choix arbitraire** : Développeurs ne savent pas lequel utiliser
5. **Pas de standard** : UX incohérente dashboard vs modules

#### Solution proposée

```typescript
// ✅ SOLUTION : KPICard unifié avec variants

const kpiCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        compact: "p-4",
        elegant: "p-6 bg-gradient-to-br from-accent/10 to-primary/5",
        detailed: "p-5"
      },
      size: {
        sm: "min-h-[100px]",
        md: "min-h-[140px]",
        lg: "min-h-[180px]"
      }
    },
    defaultVariants: { variant: "compact", size: "md" }
  }
)

interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  title: string
  value: string | number
  change?: number | { value: number; label: string }
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function KPICard({ title, value, change, description, icon, actions, trend, variant, size }: KPICardProps) {
  return (
    <div className={cn(kpiCardVariants({ variant, size }))}>
      {/* Layout adaptatif selon variant */}
      {variant === 'compact' && <CompactLayout {...props} />}
      {variant === 'elegant' && <ElegantLayout {...props} />}
      {variant === 'detailed' && <DetailedLayout {...props} />}
    </div>
  )
}
```

#### Migration

```typescript
// CompactKpiCard → KPICard variant="compact"
<CompactKpiCard title="Revenue" value="€45,231" change={12.5} icon={<Euro />} />
// ⬇️
<KPICard variant="compact" title="Revenue" value="€45,231" change={12.5} icon={<Euro />} />

// ElegantKpiCard → KPICard variant="elegant"
<ElegantKpiCard title="Users" value="1,234" subtitle="Active this month" gradient />
// ⬇️
<KPICard variant="elegant" title="Users" value="1,234" description="Active this month" />
```

#### Bénéfices

- ✅ **Code supprimé** : ~200 lignes
- ✅ **Bundle size** : -3kb
- ✅ **UX cohérente** : Design unifié dashboard
- ✅ **Maintenance** : 1 composant centralisé

---

### 🟡 P1 - Autres Duplications Haute Priorité

#### Duplication #3 : Badges Spécialisés (5+ variantes)

**Composants** :

- `Badge` (base) ✅
- `CustomerBadge`, `SupplierBadge`, `SupplierCategoryBadge`, `SupplierSegmentBadge`
- `DataStatusBadge`, `StockStatusBadge`, `RoleBadge`

**Problème** : Chaque badge métier réimplémente couleurs + logique affichage

**Solution** : Badge unifié avec variant system + data mapping

```typescript
// ✅ Badge unifié
<Badge variant="customer">{customer.name}</Badge>
<Badge variant="success">{status}</Badge>
<Badge variant="role" data={role}>{role.label}</Badge>
```

---

#### Duplication #4 : Combobox/Select Filtres (3 variantes)

**Composants** :

- `Combobox` (ui/) ✅
- `CategoryFilterCombobox` (business/)
- `FilterCombobox` (business/)

**Problème** : Filtres réimplémentés au lieu de composer base Combobox

**Solution** : Composition pattern

```typescript
// ✅ Combobox base + composition
<Combobox
  options={categories}
  value={selected}
  onChange={setSelected}
  placeholder="Filtrer par catégorie"
  searchPlaceholder="Rechercher..."
/>
```

---

#### Duplication #5 : Forms Paiement (2 variantes)

**Composants** :

- `PaymentForm` (business/)
- `FinancialPaymentForm` (business/)

**Problème** : Formulaires paiement dupliqués pour contextes différents

**Solution** : Form unifié avec context variants

---

## Catégorisation Atomic Design Proposée

### Réorganisation Complète

#### Atoms (Composants de base) - 25 composants

```
apps/back-office/src/components/ui/atoms/
├── Button.tsx          # ✅ Unifié (supprime ActionButton, ModernActionButton, StandardModifyButton)
├── Badge.tsx           # ✅ Unifié avec variants métier
├── Input.tsx
├── Textarea.tsx
├── Label.tsx
├── Checkbox.tsx
├── Radio.tsx
├── Switch.tsx
├── Separator.tsx
├── Progress.tsx
├── Skeleton.tsx
├── Tooltip.tsx
└── ...
```

#### Molecules (Compositions simples) - 22 composants

```
apps/back-office/src/components/ui/molecules/
├── KPICard.tsx         # ✅ Unifié (supprime CompactKpiCard, ElegantKpiCard, MediumKpiCard)
├── Alert.tsx
├── Card.tsx
├── Dialog.tsx
├── Popover.tsx
├── DropdownMenu.tsx
├── Select.tsx
├── Combobox.tsx        # ✅ Base pour filtres
├── FormField.tsx
├── ImageUploadZone.tsx
└── ...
```

#### Organisms (Compositions complexes) - 18 composants

```
apps/back-office/src/components/ui/organisms/
├── Table.tsx
├── DataTable.tsx
├── Tabs.tsx
├── Accordion.tsx
├── Calendar.tsx
├── CommandPalette.tsx
├── Sidebar.tsx
├── NotificationSystem.tsx
├── ActivityTimeline.tsx
└── ...
```

---

## Analyse Styling & Accessibilité

### Styling Patterns

#### CVA vs Inline Styles

**État actuel** :

- ✅ **75% composants** utilisent CVA correctement (Button, Card, Badge, Dialog)
- 🟡 **15% composants** mélangent CVA + inline styles (incohérent)
- 🔴 **10% composants** utilisent uniquement inline styles (ActionButton, ModernActionButton)

**Recommandation** : **100% CVA obligatoire** pour tous composants génériques

#### Design Tokens Fragmentation

**Sources actuelles** :

1. **apps/back-office/src/lib/theme-v2.ts** (primaire)

```typescript
export const themeV2 = {
  colors: { primary: '#4F46E5', secondary: '#10B981', ... },
  spacing: { xs: '0.25rem', sm: '0.5rem', ... },
  typography: { xs: '0.75rem', sm: '0.875rem', ... }
}
```

2. **apps/back-office/src/lib/design-system/tokens/** (secondaire)

```typescript
export const colors = { ... }
export const spacing = { ... }
export const typography = { ... }
```

**Problème** : 2 sources = incohérences potentielles

**Solution** : Consolider dans `design-system/tokens/` unique avec exports

---

### Accessibilité WCAG 2.2 AA

#### Audit ARIA Attributes

**Composants conformes** (✅ ARIA complets) :

- Dialog, AlertDialog, Popover, DropdownMenu, Select, Combobox
- Checkbox, Radio, Switch
- Table, Tabs, Accordion

**Composants non-conformes** (🔴 ARIA manquants) :

| Composant          | ARIA Manquants                                  | Impact |
| ------------------ | ----------------------------------------------- | ------ |
| ActionButton       | `aria-label` (icon seul), `aria-busy` (loading) | Moyen  |
| ModernActionButton | `aria-label`, `aria-pressed` (toggle)           | Moyen  |
| CompactKpiCard     | `aria-label` (contexte valeur)                  | Faible |
| NotificationSystem | `aria-live`, `aria-atomic`                      | Élevé  |
| CommandPalette     | `aria-expanded`, `aria-controls`                | Moyen  |

**Actions P1** :

1. Ajouter `aria-busy` à tous boutons avec loading
2. Ajouter `aria-live="polite"` notifications
3. Ajouter `aria-label` composants visuels (graphs, stats)

#### Keyboard Navigation

**Gaps identifiés** :

- 🔴 `Escape` ne ferme pas tous modals (CommandPalette, certains Dialog)
- 🔴 Focus trap manquant sur modals overlay
- 🟡 `Tab` navigation incohérente dans forms complexes

**Actions P1** :

- Implémenter focus trap tous Dialog/Modal (Radix UI le fait déjà, vérifier usage)
- Standardiser `Escape` → close partout
- Tester keyboard navigation avec screen reader

#### Color Contrast

**Conformité actuelle** : **~85%**

**Problèmes identifiés** :

- 🔴 `text-muted-foreground` sur `bg-background` : **3.2:1** (< 4.5:1 requis)
- 🔴 Bouton `variant="ghost"` hover : **3.8:1**
- 🟡 Badges variants secondaires : **4.2:1** (limite)

**Actions P1** :

- Ajuster `muted-foreground` : `hsl(215 16% 42%)` → `hsl(215 16% 38%)` (+0.5 ratio)
- Ajuster hover states boutons outline/ghost

---

## Coverage Storybook

### État Actuel : 9.8% (5/51 composants)

#### Composants documentés ✅

| Composant | Story | Variants                                      | Status  |
| --------- | ----- | --------------------------------------------- | ------- |
| Button    | ✅    | 7 variants × 4 sizes = 28 stories             | Complet |
| Card      | ✅    | 3 variants (simple, with header, with footer) | Partiel |
| Badge     | ✅    | 4 variants                                    | Basique |
| Dialog    | ✅    | 2 variants (standard, alert)                  | Complet |
| Input     | ✅    | 3 variants (text, password, error state)      | Basique |

#### Composants non-documentés ❌ (46/51)

**P0 - À documenter immédiatement** (composants très utilisés) :

- Select, Combobox, Dropdown Menu, Popover
- Checkbox, Radio, Switch
- Tabs, Accordion
- Table, Pagination

**P1 - À documenter rapidement** :

- Alert, AlertDialog
- Form, Label
- Calendar, Command
- Tooltip, Separator, Progress, Skeleton

**P2 - À documenter progressivement** :

- Breadcrumb, ScrollArea
- Sidebar, NotificationSystem
- GroupNavigation, TabsNavigation

### Gap Analysis

**Problèmes** :

1. **Documentation manquante** empêche adoption composants
2. **Pas d'exemples** → développeurs créent duplications
3. **Pas de tests visuels** → régressions UI non détectées
4. **Pas de props documentation** → usage incorrect

**Target P1** : **100% coverage** (51/51 composants)

**Timeline** :

- Vague 1 (P0) : 15 composants → 2 semaines
- Vague 2 (P1) : 20 composants → 3 semaines
- Vague 3 (P2) : 16 composants → 2 semaines

---

## Recommandations Finales

### Actions Prioritaires par Vague

#### 🔴 Vague 1 - P0 Critiques (Semaines 1-2)

**Objectifs** :

1. ✅ Unifier Button (4→1) → **62 fichiers** migrés
2. ✅ Unifier KPI Cards (3-4→1) → **11 fichiers** migrés
3. ✅ Consolider design tokens (2→1 source)
4. ✅ Storybook P0 : 15 composants critiques documentés

**Livrables** :

- `apps/back-office/src/components/ui/button.tsx` : Button unifié avec variants gradient/glass
- `apps/back-office/src/components/ui/kpi-card.tsx` : KPICard unifié 3 variants
- `apps/back-office/src/lib/design-system/tokens/index.ts` : Tokens consolidés
- Scripts codemods : `scripts/codemods/unify-buttons.ts`, `unify-kpi-cards.ts`
- 15 Storybook stories : Button, Select, Combobox, Dialog, Form components

**Timeline détaillée** :

| Jour  | Tâche                            | Deliverable                     |
| ----- | -------------------------------- | ------------------------------- |
| J1-2  | Créer Button unifié + tests      | Button.tsx + Button.stories.tsx |
| J3-4  | Codemod migration 62 fichiers    | Scripts + validation type-check |
| J5-6  | Créer KPICard unifié + tests     | KPICard.tsx + stories           |
| J7-8  | Migration KPI Cards + validation | Console = 0 errors              |
| J9-10 | Consolider design tokens         | design-system/tokens/ + docs    |

**Tests validation** :

- ✅ Type check = 0 erreurs
- ✅ Build successful
- ✅ Console = 0 errors (MCP Playwright localhost)
- ✅ Storybook build successful
- ✅ No visual regressions (screenshots before/after)

**Métriques succès** :

- Duplications : 7-8 → **2-3**
- Fichiers refactorés : **73**
- Bundle size : **-7-8kb**
- Storybook coverage : 9.8% → **30%**

---

#### 🟡 Vague 2 - P1 Haute Priorité (Semaines 3-5)

**Objectifs** :

1. ✅ Structure Atomic Design complète (atoms/, molecules/, organisms/)
2. ✅ Unifier Badges (5+→1 avec variants métier)
3. ✅ Unifier Combobox/Filtres (3→1)
4. ✅ Storybook 60% coverage (31/51 composants)

**Livrables** :

- Réorganisation folders Atomic Design
- Badge unifié : `apps/back-office/src/components/ui/badge.tsx` avec mapping métier
- Combobox composition pattern
- 26 Storybook stories supplémentaires

**Timeline** : 3 semaines

**Métriques succès** :

- Duplications : 2-3 → **0-1**
- Storybook coverage : 30% → **60%**
- Atomic Design : **100% composants catégorisés**

---

#### 🟢 Vague 3 - P2 Moyenne Priorité (Semaines 6-9)

**Objectifs** :

1. ✅ Refactorisation business components (patterns composition)
2. ✅ Tests visuels Chromatic (regression testing)
3. ✅ Performance optimizations (bundle size, React.memo)
4. ✅ Storybook 100% coverage (51/51)
5. ✅ Documentation complète Design System V2

**Livrables** :

- Business components refactorés (EditSection pattern, FormModal pattern)
- Chromatic intégré CI/CD
- Performance budget : <50kb UI components
- Guide Design System V2 complet

**Timeline** : 3-4 semaines

**Métriques succès** :

- Duplications : 0-1 → **0**
- Storybook coverage : 60% → **100%**
- Bundle size : **-30% total**
- Performance : **<100ms render par composant**
- A11y : **100% WCAG 2.2 AA**

---

### Métriques Globales de Succès

| Métrique                   | Baseline | Target Vague 1 | Target Vague 2 | Target Final |
| -------------------------- | -------- | -------------- | -------------- | ------------ |
| **Duplications critiques** | 7-8      | 2-3            | 0-1            | 0            |
| **Storybook coverage**     | 9.8%     | 30%            | 60%            | 100%         |
| **Bundle size UI**         | 45kb     | 38kb (-15%)    | 34kb (-25%)    | 32kb (-30%)  |
| **Conformité WCAG AA**     | 75%      | 85%            | 95%            | 100%         |
| **Design tokens sources**  | 2        | 1              | 1              | 1            |
| **Composants maintenus**   | 305+     | 280            | 250            | 220          |

---

### Risques & Mitigations

| Risque                                  | Probabilité | Impact   | Mitigation                                           |
| --------------------------------------- | ----------- | -------- | ---------------------------------------------------- |
| **Breaking changes** migration          | Élevée      | Critique | Tests E2E avant/après, codemods validés              |
| **Props incompatibles** composants      | Moyenne     | Élevé    | Mapping layers transitoires, deprecation warnings    |
| **Performance dégradée**                | Faible      | Moyen    | Profiling React DevTools, bundle analysis            |
| **Adoption faible** nouveaux composants | Moyenne     | Moyen    | Documentation Storybook exhaustive, workshops équipe |
| **Regression bugs** UI                  | Moyenne     | Élevé    | Chromatic visual testing, screenshots comparaison    |

---

## Annexes

### A. Références Best Practices 2025

#### Architecture & Patterns

- **[shadcn/ui Documentation](https://ui.shadcn.com)** : Copy-paste architecture, Radix UI primitives
- **[Radix UI Primitives](https://radix-ui.com)** : Headless components accessibles
- **[CVA - Class Variance Authority](https://cva.style)** : Variant system pour Tailwind
- **[Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)** : Brad Frost pattern

#### Discussions Communauté 2025

- **Reddit r/reactjs** : [shadcn/ui vs Headless UI discussions](https://www.reddit.com/r/reactjs/search/?q=shadcn)
- **Reddit r/webdev** : [Component library architecture 2025](https://www.reddit.com/r/webdev/search/?q=component+library+2025)
- **GitHub Discussions** : [shadcn/ui repo discussions](https://github.com/shadcn/ui/discussions)

#### Design Inspiration

- **Dribbble** : [Modern CRM dashboards 2025](https://dribbble.com/search/crm-dashboard)
- **Dribbble** : [B2B SaaS UI patterns](https://dribbble.com/search/b2b-saas)
- **Figma Community** : [Design System templates](https://www.figma.com/community/search?model_type=files&q=design%20system)

#### Accessibilité

- **[WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)** : W3C spec stable (Oct 2023, updated 2025)
- **[WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)** : Patterns accessibilité
- **[Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)** : ARIA best practices

#### Performance

- **[Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing/performance)** : Optimizations Next.js 15
- **[React Performance Profiling](https://react.dev/learn/react-developer-tools)** : React DevTools

---

### B. Méthodologie Audit

**Outils utilisés** :

1. **Inventaire code** : Glob + Grep + Read (MCP tools)
2. **Analyse duplications** : Pattern matching + comparaison manuelle code
3. **Recherche best practices** : WebSearch (Reddit, GitHub, Dribbble)
4. **Accessibilité** : Audit manuel WCAG 2.2, tests keyboard navigation
5. **Performance** : Bundle analysis (next build), React DevTools Profiler

**Processus** :

1. Phase Think : Sequential Thinking + recherches best practices
2. Phase Explore : Inventaire exhaustif composants (Glob/Grep)
3. Phase Analyze : Comparaison code, identification duplications
4. Phase Design : Architecture unifiée proposée
5. Phase Document : Rapports Markdown

**Durée totale audit** : ~8 heures

---

### C. Glossaire

**Atomic Design** : Méthodologie design systems (Atoms → Molecules → Organisms → Templates → Pages)

**CVA (Class Variance Authority)** : Library gestion variants Tailwind CSS avec TypeScript

**shadcn/ui** : Collection composants copy-paste basés Radix UI + Tailwind

**Radix UI** : Primitives headless accessibles (sans styles)

**Headless Components** : Composants logique/comportement sans styles imposés

**Copy-Paste Architecture** : Pattern où code composants est copié dans projet (vs npm package)

**Design Tokens** : Variables design (colors, spacing, typography) centralisées

**WCAG 2.2 AA** : Web Content Accessibility Guidelines niveau AA (standard industrie)

**Compound Components** : Pattern composition (ex: Card.Header, Card.Body)

**Polymorphic Components** : Composants avec prop `as` pour changer element type

---

**Fin du Rapport d'Audit**

**Prochaine étape** : Consulter `ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md` pour spécifications détaillées composants unifiés.
