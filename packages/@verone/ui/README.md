# @verone/ui

**Composants UI et Design System pour le monorepo Vérone**

Bibliothèque complète de composants UI pour le système CRM/ERP Vérone, basée sur shadcn/ui + Radix UI + Tailwind CSS + Design System V2.

---

## 📦 Installation

```bash
# Dans le monorepo
npm install @verone/ui

# Dépendances peer
npm install react react-dom
```

---

## 🚀 Usage

```tsx
import { ButtonUnified, Card, Input, Badge } from '@verone/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Rechercher..." />
      <Badge variant="success">Actif</Badge>
      <ButtonUnified variant="gradient">Enregistrer</ButtonUnified>
    </Card>
  );
}
```

---

## 🎨 Composants Disponibles (54 total)

### Boutons (5 composants)

- **ButtonUnified** - Bouton unifié Design System V2 avec CVA ✨
- **Button / ButtonV2** - Bouton standard avec loading states
- **ActionButton** - Bouton action avec icône
- **ModernActionButton** - Bouton moderne avec animations
- **StandardModifyButton** - Bouton modification standard

### Formulaires (8 composants)

- **Input**, **Textarea**, **Label**, **Form**
- **Select**, **Checkbox**, **RadioGroup**, **Switch**

### Layout (12 composants)

- **Card**, **VeroneCard**, **Separator**, **Accordion**
- **Collapsible**, **Tabs**, **TabsNavigation**, **Sidebar**
- **Breadcrumb**, **ScrollArea**, **Table**, **Tabs**

### Feedback (11 composants)

- **Alert**, **AlertDialog**, **Skeleton**, **Badge**
- **DataStatusBadge**, **RoleBadge**, **StatPill**, **PhaseIndicator**
- **Progress**, **ActivityTimeline**, **Avatar**

### Overlay (5 composants)

- **Dialog**, **Popover**, **DropdownMenu**, **Tooltip**, **NotificationSystem**

### Command (3 composants)

- **Combobox**, **Command**, **CommandPalette**

### Date (1 composant)

- **Calendar**

### KPI & Metrics (4 composants)

- **KpiCardUnified** ✨ - KPI card avec tendances
- **CompactKpiCard** - Version compacte
- **MediumKpiCard** - Taille moyenne
- **ElegantKpiCard** - Design premium

### Navigation (3 composants)

- **GroupNavigation**, **Pagination**, **ViewModeToggle**

### Actions & Upload (3 composants)

- **QuickActionsList**, **CompactQuickActions**
- **ImageUploadZone** - Zone upload images drag & drop

### Custom (2 composants)

- **RoomMultiSelect** - Sélecteur multi-pièces
- **PhaseIndicator** - Indicateur phase projet (1-4)

---

## 📖 Documentation Props TypeScript

**Documentation exhaustive** : `docs/architecture/COMPOSANTS-CATALOGUE.md`

Chaque composant est documenté avec :

- Interface Props TypeScript complète
- Exemples d'utilisation
- Valeurs possibles pour chaque prop
- Cas d'usage recommandés

### Exemple : ButtonUnified

```typescript
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

<ButtonUnified variant="default" size="lg" loading={isSubmitting} icon={<Save />}>
  Enregistrer
</ButtonUnified>
```

---

## 📊 Statistiques

- **54 composants** exportés et fonctionnels
- **100% TypeScript** avec types stricts
- **0 erreur** build et type-check
- **Exports** : `src/components/ui/index.ts` (122 lignes)

---

**Version** : 1.0.0
**Mainteneur** : Romeo Dos Santos
