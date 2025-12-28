---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - packages/@verone/ui/src/
  - packages/@verone/ui-business/src/
references:
  - docs/architecture/COMPOSANTS-CATALOGUE.md
---

# Design System Verone

shadcn/ui + Radix UI + Tailwind CSS.

## Package UI

```
packages/@verone/ui/
  src/
    components/ui/     # 54 composants base
    design-system/     # Tokens, theme
```

## Composants principaux

| Composant | Usage |
|-----------|-------|
| `Button` | Boutons avec variants |
| `Card` | Conteneurs |
| `Dialog`, `AlertDialog` | Modales |
| `DataTable` | Tableaux donnees |
| `Form` | Formulaires React Hook Form |
| `Badge` | Badges statut |
| `Select`, `Combobox` | Selecteurs |

## Imports

```typescript
import { Button, Card, Dialog } from '@verone/ui';
import { ProductCard } from '@verone/ui-business';
```

## Variants (CVA)

```typescript
// Class Variance Authority pour variants
const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      default: '...',
      destructive: '...',
      outline: '...',
    },
    size: {
      sm: '...',
      default: '...',
      lg: '...',
    }
  }
});
```

## Theme

```css
/* apps/[app]/src/app/globals.css */
:root {
  --primary: ...;
  --secondary: ...;
  --destructive: ...;
  --background: ...;
  --foreground: ...;
}
```

## Liens

- [Architecture](./02-architecture.md) - Structure packages
- [Composants catalogue](../architecture/COMPOSANTS-CATALOGUE.md) - Liste complete

---

*Derniere verification: 2025-12-17*
