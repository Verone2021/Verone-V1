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

## 🎨 Composants Disponibles (51 total)

### Boutons (4 composants)

- **ButtonUnified** - Bouton unifié Design System V2 ✨
- **ActionButton** - Bouton action avec icône
- **ModernActionButton** - Bouton moderne avec animations
- **StandardModifyButton** - Bouton modification standard

### Formulaires (8 composants)

- **Input**, **Textarea**, **Label**, **Form**
- **Select**, **Checkbox**, **RadioGroup**, **Switch**

### Layout (11 composants)

- **Card**, **VeroneCard**, **Separator**, **Accordion**
- **Collapsible**, **Tabs**, **TabsNavigation**, **Sidebar**
- **Breadcrumb**, **ScrollArea**, **Table**

### Feedback (10 composants)

- **Alert**, **AlertDialog**, **Skeleton**, **Badge**
- **DataStatusBadge**, **RoleBadge**, **StatPill**, **Progress**, **ActivityTimeline**

### Overlay (5 composants)

- **Dialog**, **Popover**, **DropdownMenu**, **Tooltip**, **NotificationSystem**

### Command (3 composants)

- **Combobox**, **Command**, **CommandPalette**

### Date (1 composant)

- **Calendar**

### KPI & Metrics (4 composants)

- **KpiCardUnified** ✨, **CompactKpiCard**, **MediumKpiCard**, **ElegantKpiCard**

### Navigation (3 composants)

- **GroupNavigation**, **Pagination**, **ViewModeToggle**

### Actions (2 composants)

- **QuickActionsList**, **CompactQuickActions**

---

## 📊 Statistiques

- **51 composants** exportés et fonctionnels
- **3 composants** désactivés temporairement (dépendances externes)
- **100% TypeScript** avec types stricts
- **0 erreur** build et type-check

---

**Version** : 1.0.0
**Mainteneur** : Romeo Dos Santos
