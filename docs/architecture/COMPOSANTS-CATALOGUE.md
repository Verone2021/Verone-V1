# 📦 CATALOGUE COMPOSANTS @VERONE/\* - Référence Anti-Hallucinations

**Date** : 2025-11-11
**Version** : 1.0.0 (Phase 4 Turborepo)
**Packages** : 25 packages partagés
**Composants** : 86 composants React avec props TypeScript

---

## 🚨 RÈGLE ABSOLUE : TOUJOURS VÉRIFIER CE FICHIER AVANT UTILISER/CRÉER COMPOSANT

**Workflow obligatoire Claude Code** :

1. ✅ Lire ce fichier COMPOSANTS-CATALOGUE.md
2. ✅ Chercher composant existant (Ctrl+F)
3. ✅ Vérifier props TypeScript exactes
4. ✅ Utiliser `mcp__serena__get_symbols_overview` pour voir interface complète si besoin
5. ❌ JAMAIS inventer props inexistantes
6. ❌ JAMAIS créer composant sans vérifier existant

---

## 📚 TABLE DES MATIÈRES

1. [@verone/ui](#veroneui---54-composants) (54 composants)
2. [@verone/products](#veroneproducts---32-composants) (32 composants)
3. [@verone/orders](#veroneorders---composants-commandes) (Composants commandes)
4. [@verone/stock](#veronestock---composants-stock) (Composants stock)
5. [@verone/categories](#veronecategories---composants-catégorisation) (6 composants)
6. [@verone/notifications](#veronenotifications---composants-notifications) (2 composants)
7. [@verone/dashboard](#veronedashboard---hooks-métriques) (Hooks dashboard)

---

## @verone/ui - 54 Composants

**Package** : `packages/@verone/ui/`
**Import** : `import { Button, Dialog, Card } from '@verone/ui'`
**Exports** : `packages/@verone/ui/src/components/ui/index.ts` (lignes 1-122)

### 🔘 Famille Button (5 composants)

#### ButtonUnified

```typescript
import { ButtonUnified } from '@verone/ui';

interface ButtonUnifiedProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  rounded?: 'default' | 'full' | 'none';
  shadow?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

// Exemple
<ButtonUnified variant="default" size="lg" loading={isLoading}>
  Enregistrer
</ButtonUnified>
```

#### Button / ButtonV2

```typescript
interface ButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

#### ActionButton

```typescript
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

#### ModernActionButton

```typescript
interface ModernActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}
```

#### StandardModifyButton

⚠️ **DEPRECATED** - Suppression prévue 2025-11-21

```typescript
interface StandardModifyButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}
```

---

### ✅ Boutons Métiers Back-Office (4 composants - Design System V2 Compliant)

**Date audit** : 2025-11-11
**Rapport complet** : `docs/audits/2025-11/RAPPORT-AUDIT-BUTTONS-BACK-OFFICE-2025-11-11.md`

**Pattern commun** : Tous utilisent **ButtonV2** comme base avec props natives (icon, loading, variant, size).

#### SampleOrderButton

**Package** : `@verone/ui-business`
**Fichier** : `packages/@verone/ui-business/src/components/buttons/SampleOrderButton.tsx`
**Status** : ✅ Conforme Design System V2

```typescript
import { SampleOrderButton } from '@verone/ui-business';

interface SampleOrderButtonProps {
  productId: string;
  productName: string;
  supplierName?: string;
  costPrice?: number;
  className?: string;
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // ✅ Types ButtonV2 corrects
}

// Exemple
<SampleOrderButton
  productId="prod-123"
  productName="Chaise Design"
  supplierName="Supplier XYZ"
  costPrice={149.99}
  variant="outline"
  size="md"
/>
```

**Notes** :

- ✅ Utilise ButtonV2 avec icon={Package}
- ✅ Prop `loading` native (pas de render manuel Loader2)
- ✅ Dialog confirmation intégré
- ✅ Hook `useSampleOrder` pour logique business

---

#### GenerateInvoiceButton

**Package** : `@verone/finance`
**Fichier** : `packages/@verone/finance/src/components/buttons/GenerateInvoiceButton.tsx`
**Status** : ✅ Conforme Design System V2

```typescript
import { GenerateInvoiceButton } from '@verone/finance';

interface GenerateInvoiceButtonProps {
  salesOrderId: string;
  orderNumber: string;
  onSuccess?: (invoiceId: string) => void;
  disabled?: boolean;
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // ✅ Types ButtonV2 corrects
}

// Exemple
<GenerateInvoiceButton
  salesOrderId="order-456"
  orderNumber="ORD-2025-001"
  onSuccess={(invoiceId) => console.log(`Facture ${invoiceId} créée`)}
  variant="secondary"
  size="md"
/>
```

**Notes** :

- ✅ Utilise ButtonV2 avec icon={FileText}
- ✅ Prop `loading` native
- ✅ Gestion erreurs spécifiques (404, 409)
- ✅ Toast feedback intégré

---

#### FavoriteToggleButton

**Package** : `@verone/ui-business`
**Fichier** : `packages/@verone/ui-business/src/components/buttons/FavoriteToggleButton.tsx`
**Status** : ✅ Conforme Design System V2
**Usage** : 3 pages back-office (customers, suppliers, partners)

```typescript
import { FavoriteToggleButton } from '@verone/ui-business';

interface FavoriteToggleButtonProps {
  organisationId: string;
  isFavorite: boolean;
  organisationType: 'customer' | 'supplier' | 'partner';
  disabled?: boolean;
  onToggleComplete?: () => void;
  className?: string;
}

// Exemple
<FavoriteToggleButton
  organisationId="org-789"
  isFavorite={true}
  organisationType="customer"
  onToggleComplete={() => refetch()}
/>
```

**Notes** :

- ✅ Utilise **ButtonUnified** (variant="ghost" size="icon")
- ✅ Prop `loading` native (plus de render manuel Loader2)
- ✅ Icon Heart dynamique (filled si favorite)
- ✅ Animation pulse sur toggle
- ✅ Hook `useToggleFavorite` pour logique business

---

#### LogoUploadButton

**Package** : `@verone/organisations`
**Fichier** : `packages/@verone/organisations/src/components/buttons/LogoUploadButton.tsx`
**Status** : ✅ Conforme Design System V2 + Multi-Frontend Isolation

```typescript
import { LogoUploadButton } from '@verone/organisations';

interface LogoUploadButtonProps {
  organisationId: string;
  organisationName: string;
  currentLogoUrl?: string | null;
  onUploadSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Exemple
<LogoUploadButton
  organisationId="org-456"
  organisationName="Acme Corp"
  currentLogoUrl="/logos/acme.png"
  onUploadSuccess={() => refetch()}
  size="lg"
/>
```

**Notes** :

- ✅ Utilise ButtonV2 avec icons (Upload, Trash2)
- ✅ Props `loading` natives (upload + delete)
- ✅ **80+ classes préfixées `bo-`** (isolation multi-frontend)
- ✅ Drag & drop intégré
- ✅ Preview local avant upload
- ✅ Hook `useLogoUpload` pour logique business

---

### ✅ Pattern Recommandé : Créer Nouveau Bouton Métier

```typescript
// ✅ BON PATTERN
import { ButtonV2 } from '@verone/ui';
import { MyIcon } from 'lucide-react';

interface MyCustomButtonProps {
  // Props métier
  entityId: string;
  entityName: string;
  onSuccess?: () => void;
  // Props ButtonV2 standard
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // ✅ Types exacts ButtonV2
  disabled?: boolean;
  className?: string;
}

export function MyCustomButton({
  entityId,
  entityName,
  onSuccess,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className,
}: MyCustomButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // Logique métier
      await myBusinessLogic(entityId);
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonV2
      variant={variant}
      size={size}  // ✅ Pas de cast 'as any'
      onClick={handleClick}
      disabled={disabled}
      icon={MyIcon}  // ✅ Prop native
      iconPosition="left"  // ✅ Prop native
      loading={isLoading}  // ✅ Prop native (pas de render manuel Loader2)
      className={className}  // ✅ Pas de classes hardcodées
    >
      {isLoading ? 'Traitement...' : 'Mon Action'}
    </ButtonV2>
  );
}
```

**❌ Anti-patterns à éviter** :

- ❌ Cast `as any` pour contourner types
- ❌ Render manuel icon/loading (utiliser props natives)
- ❌ Classes Tailwind hardcodées sans prefix (si back-office : prefix `bo-`)
- ❌ Type size incorrect (ex: `'secondary' | 'sm' | 'lg'` au lieu de `'xs' | 'sm' | 'md' | 'lg' | 'xl'`)

---

### 📝 Famille Form (8 composants)

#### Input

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}
```

#### Textarea

```typescript
interface TextareaProps {
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}
```

#### Label

```typescript
interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}
```

#### Form

```typescript
import { useForm } from 'react-hook-form';

interface FormProps {
  form: ReturnType<typeof useForm>;
  onSubmit: (data: any) => void;
  children: React.ReactNode;
}
```

#### Select

```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

#### Checkbox

```typescript
interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}
```

#### RadioGroup

```typescript
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}
```

#### Switch

```typescript
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

---

### 📐 Famille Layout (12 composants)

#### Card / VeroneCard

```typescript
interface CardProps {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  className?: string;
  children: React.ReactNode;
}

// Exemple
<VeroneCard title="Produits" description="Liste des produits">
  <p>Contenu</p>
</VeroneCard>
```

#### Separator

```typescript
interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}
```

#### Accordion

```typescript
interface AccordionItem {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  type?: 'single' | 'multiple';
  items: AccordionItem[];
  defaultValue?: string | string[];
  className?: string;
}
```

#### Collapsible

```typescript
interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}
```

#### Tabs

```typescript
interface Tab {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  defaultValue?: string;
  tabs: Tab[];
  onValueChange?: (value: string) => void;
  className?: string;
}
```

#### TabsNavigation

```typescript
interface TabsNavigationProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}
```

#### Sidebar

```typescript
interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
}
```

#### Breadcrumb

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}
```

#### ScrollArea

```typescript
interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}
```

#### Table

```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableProps {
  headers: TableColumn[];
  rows: any[];
  onRowClick?: (row: any) => void;
  sortable?: boolean;
  className?: string;
}
```

---

### 💬 Famille Feedback (11 composants)

#### Alert

```typescript
interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

// Exemple
<Alert variant="success" title="Succès" description="Produit créé avec succès" />
```

#### AlertDialog

```typescript
interface AlertDialogAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions: AlertDialogAction[];
}
```

#### Skeleton

```typescript
interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: 'text' | 'circular' | 'rectangular';
}
```

#### Badge

```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### DataStatusBadge

```typescript
interface DataStatusBadgeProps {
  status: 'draft' | 'active' | 'inactive' | 'archived';
  label?: string;
  size?: 'sm' | 'md';
}
```

#### RoleBadge

```typescript
interface RoleBadgeProps {
  role: 'gérant' | 'vendeur' | 'admin' | 'comptable' | 'logisticien';
  size?: 'sm' | 'md' | 'lg';
}
```

#### StatPill

```typescript
interface StatPillProps {
  value: number | string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
```

#### PhaseIndicator

```typescript
interface PhaseIndicatorProps {
  phase: 1 | 2 | 3 | 4;
  label?: string;
  compact?: boolean;
}
```

#### Progress

```typescript
interface ProgressProps {
  value: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}
```

#### ActivityTimeline

```typescript
interface Activity {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
  icon?: React.ReactNode;
}

interface ActivityTimelineProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
}
```

---

### 👤 Famille User (1 composant)

#### Avatar

```typescript
interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

---

### 🪟 Famille Overlay (5 composants)

#### Dialog

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

// Exemple
<Dialog open={isOpen} onOpenChange={setIsOpen} title="Créer produit" size="lg">
  <ProductForm />
</Dialog>
```

#### Popover

```typescript
interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}
```

#### DropdownMenu

```typescript
interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  onItemClick?: (item: DropdownMenuItem) => void;
}
```

#### Tooltip

```typescript
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}
```

#### NotificationSystem

```typescript
interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  maxNotifications?: number;
}
```

---

### ⌨️ Famille Command (3 composants)

#### Combobox

```typescript
interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}
```

#### Command

```typescript
interface CommandGroup {
  heading: string;
  commands: { id: string; label: string; icon?: React.ReactNode }[];
}

interface CommandProps {
  commands?: CommandGroup[];
  onCommandSelect?: (commandId: string) => void;
  groups?: CommandGroup[];
}
```

#### CommandPalette

```typescript
interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: {
    id: string;
    label: string;
    keywords?: string[];
    action: () => void;
  }[];
  recentCommands?: string[];
}
```

---

### 📅 Famille Date (1 composant)

#### Calendar

```typescript
interface CalendarProps {
  selected?: Date | Date[];
  onSelect?: (date: Date | Date[]) => void;
  mode?: 'single' | 'range' | 'multiple';
  disabled?: Date[];
  className?: string;
}
```

---

### 📊 Famille KPI (4 composants)

#### KpiCardUnified

```typescript
interface KpiCardUnifiedProps {
  title: string;
  value: number | string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  trend?: { value: number; direction: 'up' | 'down' };
  icon?: React.ReactNode;
  className?: string;
}

// Exemple
<KpiCardUnified
  title="Produits actifs"
  value={1245}
  trend={{ value: 12, direction: 'up' }}
  variant="success"
/>
```

#### CompactKpiCard

```typescript
interface CompactKpiCardProps {
  title: string;
  value: number | string;
  trend?: { value: number; direction: 'up' | 'down' };
  compact?: boolean;
}
```

#### MediumKpiCard

```typescript
interface MediumKpiCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### ElegantKpiCard

```typescript
interface ElegantKpiCardProps {
  title: string;
  value: number | string;
  trend?: { value: number; direction: 'up' | 'down' };
  variant?: 'premium' | 'luxury' | 'modern';
}
```

---

### 🧭 Famille Navigation (3 composants)

#### GroupNavigation

```typescript
interface NavigationGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items: { id: string; label: string; href: string }[];
}

interface GroupNavigationProps {
  groups: NavigationGroup[];
  activeGroup?: string;
  onGroupChange?: (groupId: string) => void;
}
```

#### Pagination

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblings?: number;
}
```

#### ViewModeToggle

```typescript
interface ViewModeToggleProps {
  mode: 'grid' | 'list' | 'table';
  onModeChange: (mode: 'grid' | 'list' | 'table') => void;
}
```

---

### ⚡ Famille Action (2 composants)

#### QuickActionsList

```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface QuickActionsListProps {
  actions: QuickAction[];
  onActionClick?: (actionId: string) => void;
  compact?: boolean;
}
```

#### CompactQuickActions

```typescript
interface CompactQuickActionsProps {
  actions: QuickAction[];
  maxVisible?: number;
  overflow?: 'dropdown' | 'hidden';
}
```

---

### 📤 Famille Upload (1 composant)

#### ImageUploadZone

```typescript
interface ImageUploadZoneProps {
  onUpload: (files: File[]) => void;
  maxSize?: number; // MB
  accept?: string;
  multiple?: boolean;
  preview?: boolean;
  className?: string;
}
```

---

### 🎨 Famille Custom (2 composants)

#### RoomMultiSelect

```typescript
interface RoomMultiSelectProps {
  rooms: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}
```

#### PhaseIndicator

```typescript
interface PhaseIndicatorProps {
  phase: 1 | 2 | 3 | 4;
  label?: string;
  compact?: boolean;
}
```

---

## @verone/products - 32 Composants

**Package** : `packages/@verone/products/`
**Import** : `import { ProductThumbnail, ProductCard } from '@verone/products'`

### 🖼️ Images (6 composants)

#### ProductThumbnail ⭐ COMPOSANT CRITIQUE

```typescript
import { ProductThumbnail } from '@verone/products';

interface ProductThumbnailProps {
  src: string | null | undefined;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

// Tailles :
// xs: 32x32px
// sm: 48x48px
// md: 64x64px (default)
// lg: 96x96px
// xl: 128x128px

// Exemple
<ProductThumbnail
  src={product.primary_image_url}
  alt={product.name}
  size="md"
/>
```

#### ProductImageGallery

```typescript
interface ProductImage {
  id: string;
  url: string;
  position: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  onImageClick?: (image: ProductImage) => void;
  variant?: 'grid' | 'carousel';
}
```

#### ProductImageViewerModal

```typescript
interface ProductImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  images: ProductImage[];
  currentIndex?: number;
}
```

#### ProductImageManagement

```typescript
interface ProductImageManagementProps {
  productId: string;
  images: ProductImage[];
  onUpload: (files: File[]) => void;
  onDelete: (imageId: string) => void;
  onReorder: (images: ProductImage[]) => void;
}
```

#### ProductFixedCharacteristics

```typescript
interface Characteristic {
  key: string;
  value: string;
  unit?: string;
}

interface ProductFixedCharacteristicsProps {
  characteristics: Characteristic[];
  editable?: boolean;
  onChange?: (characteristics: Characteristic[]) => void;
}
```

---

### 🃏 Cards (3 composants)

#### ProductCard

```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    sku?: string;
    primary_image_url?: string;
    status?: string;
    stock_real?: number;
  };
  onClick?: (productId: string) => void;
  variant?: 'compact' | 'detailed';
  showStock?: boolean;
}
```

#### ProductCardV2

```typescript
interface ProductAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ProductCardV2Props {
  product: any;
  variant?: 'default' | 'compact' | 'expanded';
  actions?: ProductAction[];
  onActionClick?: (actionId: string) => void;
}
```

#### ProductVariantGridCard

```typescript
interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  primary_image_url?: string;
  stock_real: number;
  price?: number;
}

interface ProductVariantGridCardProps {
  variant: ProductVariant;
  onSelect?: (variantId: string) => void;
  stock?: { real: number; min: number };
  pricing?: { price: number; currency: string };
  highlighted?: boolean;
}
```

---

### 📄 Sections (9 composants)

#### ProductDescriptionsEditSection

```typescript
interface ProductDescriptionsEditSectionProps {
  productId: string;
  descriptions: {
    description_courte?: string;
    description_catalogue?: string;
    description_interne?: string;
  };
  onSave: (descriptions: any) => void;
  editable?: boolean;
}
```

#### ProductStatusEditSection

```typescript
interface ProductStatusEditSectionProps {
  productId: string;
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  onStatusChange: (status: string) => void;
}
```

#### ProductDualMode

```typescript
interface ProductDualModeProps {
  mode: 'view' | 'edit';
  product: any;
  onModeChange: (mode: 'view' | 'edit') => void;
}
```

#### ProductDetailAccordion

```typescript
interface AccordionSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface ProductDetailAccordionProps {
  product: any;
  sections: AccordionSection[];
  defaultOpen?: string[];
}
```

#### ProductVariantsSection

```typescript
interface ProductVariantsSectionProps {
  productId: string;
  variants: ProductVariant[];
  onVariantClick?: (variantId: string) => void;
}
```

#### ProductNameEditSection

```typescript
interface ProductNameEditSectionProps {
  productId: string;
  name: string;
  onSave: (name: string) => void;
}
```

#### ProductViewMode

```typescript
interface ProductViewModeProps {
  product: any;
  compact?: boolean;
  showActions?: boolean;
}
```

#### ProductEditMode

```typescript
interface ProductEditModeProps {
  product: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}
```

#### ProductInfoSection

```typescript
interface ProductInfoSectionProps {
  product: any;
  editable?: boolean;
  onEdit?: () => void;
}
```

---

### 🪟 Modals (7 composants)

#### ProductStockHistoryModal

```typescript
interface ProductStockHistoryModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
}
```

#### ProductCreationModal

```typescript
interface ProductCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (productId: string) => void;
  initialData?: Partial<Product>;
}
```

#### ProductDescriptionsModal

```typescript
interface ProductDescriptionsModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  onSave: (descriptions: any) => void;
}
```

#### ProductPhotosModal

```typescript
interface ProductPhotosModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}
```

#### ProductCharacteristicsModal

```typescript
interface ProductCharacteristicsModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  characteristics: Characteristic[];
}
```

#### ProductHistoryModal

```typescript
interface ProductHistoryModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  filters?: { startDate?: Date; endDate?: Date; type?: string };
}
```

#### ProductImagesModal

```typescript
interface ProductImagesModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  onImageSelect?: (imageId: string) => void;
}
```

---

### 🧙 Wizards (2 composants)

#### ProductConsultationManager

```typescript
interface ConsultationStep {
  id: string;
  label: string;
  component: React.ComponentType;
}

interface ProductConsultationManagerProps {
  consultationId: string;
  steps: ConsultationStep[];
  onComplete: () => void;
}
```

#### ProductCreationWizard

```typescript
interface WizardStep {
  id: string;
  label: string;
  component: React.ComponentType;
  validate?: () => boolean;
}

interface ProductCreationWizardProps {
  steps: WizardStep[];
  onComplete: (product: any) => void;
  onCancel: () => void;
  initialStep?: string;
}
```

---

### 🏷️ Badges (1 composant)

#### ProductStatusCompact

```typescript
interface ProductStatusCompactProps {
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  size?: 'sm' | 'md';
}
```

---

### 🎯 Selectors (3 composants)

#### ProductTypeSelector

```typescript
interface ProductTypeSelectorProps {
  value?: 'product' | 'package' | 'service';
  onChange: (type: 'product' | 'package' | 'service') => void;
  types?: Array<'product' | 'package' | 'service'>;
}
```

#### ProductSelector

```typescript
interface ProductSelectorProps {
  value?: string | string[];
  onChange: (productId: string | string[]) => void;
  filterSupplier?: string;
  multiple?: boolean;
}
```

#### ProductStatusSelector

```typescript
interface ProductStatusSelectorProps {
  value?: string;
  onChange: (status: string) => void;
  statuses?: Array<'all' | 'draft' | 'active' | 'inactive' | 'discontinued'>;
}
```

---

### 📊 Charts (1 composant)

#### ProductsChart

```typescript
interface ProductsChartProps {
  data: Array<{ date: Date; value: number }>;
  period?: 'day' | 'week' | 'month' | 'year';
  metric?: 'count' | 'value' | 'margin';
}
```

---

## @verone/orders - Composants Commandes

**Package** : `packages/@verone/orders/`
**Import** : `import { QuickPurchaseOrderModal } from '@verone/orders'`

### 🛒 Modals

#### QuickPurchaseOrderModal ⭐ COMPOSANT CRITIQUE

```typescript
import { QuickPurchaseOrderModal } from '@verone/orders';

interface ProductData {
  id: string;
  name: string;
  sku: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_price?: number;
  stock_real: number;
  min_stock: number;
}

interface DraftOrderInfo {
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface QuickPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  shortageQuantity?: number;
  onSuccess?: () => void;
}

// Exemple
<QuickPurchaseOrderModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  productId="product-123"
  shortageQuantity={10}
  onSuccess={() => {
    toast.success('Commande créée');
    refetchStock();
  }}
/>
```

---

## @verone/stock - Composants Stock

**Package** : `packages/@verone/stock/`
**Import** : `import { StockAlertCard } from '@verone/stock'`

### 🚨 Alertes

#### StockAlertCard ⭐ COMPOSANT CRITIQUE

```typescript
import { StockAlertCard } from '@verone/stock';

interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  stock_real: number;
  min_stock: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered';
  severity: 'info' | 'warning' | 'critical';
  validated: boolean;
  created_at: Date;
  shortage_quantity?: number;
  pending_order_quantity?: number;
}

interface StockAlertCardProps {
  alert: StockAlert;
  onActionClick?: (action: 'create_order' | 'view_product' | 'validate') => void;
}

// Exemple
<StockAlertCard
  alert={alert}
  onActionClick={(action) => {
    if (action === 'create_order') {
      setSelectedProductId(alert.product_id);
      setOpenOrderModal(true);
    }
  }}
/>
```

---

## @verone/categories - Composants Catégorisation

**Package** : `packages/@verone/categories/`
**Import** : `import { CategorySelector, CategorizeModal } from '@verone/categories'`

### 🏷️ Selectors (6 composants)

#### CategorySelector

```typescript
interface CategorySelectorProps {
  value?: string | string[];
  onChange: (categoryId: string | string[]) => void;
  hierarchical?: boolean;
  multiple?: boolean;
}
```

#### CategoryFilterCombobox

```typescript
interface CategoryFilterComboboxProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  filters?: { supplierId?: string; status?: string };
}
```

#### CategoryHierarchyFilterV2

```typescript
interface CategoryHierarchyFilterV2Props {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  maxDepth?: number;
}
```

#### CategorizeModal

```typescript
interface CategorizeModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

#### SubcategorySearchSelector

```typescript
interface SubcategorySearchSelectorProps {
  categoryId: string;
  value?: string;
  onChange: (subcategoryId: string) => void;
  searchable?: boolean;
}
```

#### SupplierCategorySelect

```typescript
interface SupplierCategorySelectProps {
  supplierId: string;
  value?: string;
  onChange: (categoryId: string) => void;
}
```

---

## @verone/notifications - Composants Notifications

**Package** : `packages/@verone/notifications/`
**Import** : `import { NotificationsDropdown, NotificationWidget } from '@verone/notifications'`

### 🔔 Notifications (2 composants)

#### NotificationsDropdown

```typescript
// Self-contained component (no props needed)
import { NotificationsDropdown } from '@verone/notifications';

<NotificationsDropdown />
```

#### NotificationWidget

```typescript
interface NotificationWidgetProps {
  compact?: boolean;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

---

## @verone/dashboard - Hooks Métriques

**Package** : `packages/@verone/dashboard/`
**Import** : `import { useCompleteDashboardMetrics } from '@verone/dashboard'`

### 📊 Hooks (2 hooks critiques)

#### useCompleteDashboardMetrics

```typescript
import { useCompleteDashboardMetrics } from '@verone/dashboard';

interface DashboardMetrics {
  products: { total: number; active: number; draft: number };
  stock: { alerts: number; movements: number };
  orders: { pending: number; completed: number };
  revenue: { total: number; trend: number };
}

// Hook usage
const { metrics, isLoading, error } = useCompleteDashboardMetrics();

// Exemple
function Dashboard() {
  const { metrics, isLoading } = useCompleteDashboardMetrics();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <KpiCardUnified title="Produits actifs" value={metrics.products.active} />
      <KpiCardUnified title="Alertes stock" value={metrics.stock.alerts} />
    </div>
  );
}
```

#### useDatabaseNotifications

```typescript
import { useDatabaseNotifications } from '@verone/dashboard';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: Date;
}

const { notifications, markAsRead, deleteNotification } =
  useDatabaseNotifications();
```

---

## 🔍 RECHERCHE RAPIDE PAR CAS D'USAGE

### "Je veux afficher une miniature produit"

→ **ProductThumbnail** (`@verone/products`)

```typescript
<ProductThumbnail src={product.image_url} alt={product.name} size="md" />
```

### "Je veux un bouton avec chargement"

→ **ButtonUnified** (`@verone/ui`)

```typescript
<ButtonUnified variant="default" loading={isSubmitting}>
  Enregistrer
</ButtonUnified>
```

### "Je veux une card KPI avec tendance"

→ **KpiCardUnified** (`@verone/ui`)

```typescript
<KpiCardUnified
  title="Ventes"
  value={12450}
  trend={{ value: 12, direction: 'up' }}
  variant="success"
/>
```

### "Je veux créer commande fournisseur rapidement"

→ **QuickPurchaseOrderModal** (`@verone/orders`)

```typescript
<QuickPurchaseOrderModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  productId={productId}
  shortageQuantity={10}
/>
```

### "Je veux afficher alerte stock"

→ **StockAlertCard** (`@verone/stock`)

```typescript
<StockAlertCard alert={alert} onActionClick={handleAction} />
```

### "Je veux un dialog modal"

→ **Dialog** (`@verone/ui`)

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen} title="Titre" size="lg">
  <p>Contenu</p>
</Dialog>
```

---

## 🛠️ MAINTENANCE

**Dernière mise à jour** : 2025-11-11
**Responsable** : Romeo Dos Santos
**Fréquence MAJ** : À chaque ajout/modification composant

**Ajouter composant** :

1. Créer composant dans packages/@verone/[module]/
2. Ajouter interface Props TypeScript
3. Mettre à jour ce fichier COMPOSANTS-CATALOGUE.md
4. Mettre à jour README.md du package

**Modifier props** :

1. Modifier interface Props dans composant source
2. Mettre à jour ce fichier COMPOSANTS-CATALOGUE.md
3. Tester tous usages du composant (Grep pattern)
4. Commit avec message explicite

---

**FIN CATALOGUE** - 86 composants documentés
