# 🎨 @verone/ui - Design System

**Design System centralisé** avec Storybook pour Vérone Back Office.

⚠️ **Statut** : Préparation (migration effective après Phase 1)

---

## 🎯 Objectif

Centraliser tous les composants UI réutilisables, tokens de design, et thèmes.

---

## 📦 Contenu futur

```
packages/ui/
├── src/
│   ├── components/        # Composants React (Button, Input, Card, etc.)
│   ├── tokens/            # Design tokens (colors, spacing, typography)
│   ├── themes/            # Thèmes (light, dark)
│   └── index.ts           # Exports
├── .storybook/            # Config Storybook
├── stories/               # Stories Storybook
├── package.json
└── tsconfig.json
```

---

## 🚀 Usage futur (après migration)

```typescript
// Dans apps/web ou apps/api
import { Button, Card, KPICard } from '@verone/ui'

export default function Dashboard() {
  return (
    <Card>
      <Button variant="primary">Action</Button>
    </Card>
  )
}
```

---

## 🎨 Design System V2

Palette complète documentée dans [CLAUDE.md](../../CLAUDE.md#design-system-v2--storybook)

---

## 📚 Composants à migrer

**Liste initiale à documenter** :
- [ ] Buttons (primary, secondary, ghost, danger)
- [ ] Inputs (text, number, date, select)
- [ ] Cards (default, elevated, interactive)
- [ ] KPI Cards (metric, trend, sparkline)
- [ ] Tables (data table, sortable, filterable)
- [ ] Modals / Dialogs
- [ ] Forms (layouts, validation)
- [ ] Navigation (sidebar, breadcrumbs, tabs)
- [ ] Feedback (toast, alerts, loaders)

---

*À migrer : Après Phase 1*
*Référence actuelle : src/components/ui-v2/*
