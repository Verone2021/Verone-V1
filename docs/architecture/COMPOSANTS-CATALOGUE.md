# Catalogue des Composants UI - Verone

Référence des composants UI disponibles dans `@verone/ui`.

## Source

Basé sur shadcn/ui avec customisations Verone.

## Composants de Base

### Layout

| Composant | Path | Usage |
|-----------|------|-------|
| `Card` | `@verone/ui/card` | Container avec ombre et bordures |
| `Separator` | `@verone/ui/separator` | Ligne de séparation |
| `ScrollArea` | `@verone/ui/scroll-area` | Zone scrollable stylisée |
| `Sheet` | `@verone/ui/sheet` | Panneau latéral (drawer) |
| `Dialog` | `@verone/ui/dialog` | Modal centrée |

### Forms

| Composant | Path | Usage |
|-----------|------|-------|
| `Button` | `@verone/ui/button` | Bouton avec variants |
| `Input` | `@verone/ui/input` | Champ texte |
| `Textarea` | `@verone/ui/textarea` | Zone texte multi-lignes |
| `Select` | `@verone/ui/select` | Dropdown sélection |
| `Checkbox` | `@verone/ui/checkbox` | Case à cocher |
| `Switch` | `@verone/ui/switch` | Toggle on/off |
| `Label` | `@verone/ui/label` | Label formulaire |
| `Form` | `@verone/ui/form` | Wrapper react-hook-form |

### Data Display

| Composant | Path | Usage |
|-----------|------|-------|
| `Table` | `@verone/ui/table` | Tableau données |
| `Badge` | `@verone/ui/badge` | Tag/étiquette |
| `Avatar` | `@verone/ui/avatar` | Image profil |
| `Skeleton` | `@verone/ui/skeleton` | Placeholder chargement |
| `Progress` | `@verone/ui/progress` | Barre progression |

### Feedback

| Composant | Path | Usage |
|-----------|------|-------|
| `Toast` | `@verone/ui/toast` | Notification temporaire |
| `Alert` | `@verone/ui/alert` | Message d'alerte |
| `AlertDialog` | `@verone/ui/alert-dialog` | Confirmation action |
| `Tooltip` | `@verone/ui/tooltip` | Info au survol |

### Navigation

| Composant | Path | Usage |
|-----------|------|-------|
| `Tabs` | `@verone/ui/tabs` | Onglets |
| `Breadcrumb` | `@verone/ui/breadcrumb` | Fil d'Ariane |
| `DropdownMenu` | `@verone/ui/dropdown-menu` | Menu contextuel |
| `Command` | `@verone/ui/command` | Palette commandes |

## Composants Verone Spécifiques

### Back Office

| Composant | Path | Usage |
|-----------|------|-------|
| `DataTable` | `@verone/ui/data-table` | Table avec tri, filtres, pagination |
| `PageHeader` | `@verone/ui/page-header` | En-tête page avec titre et actions |
| `SidebarNav` | `@verone/ui/sidebar-nav` | Navigation latérale |
| `StatCard` | `@verone/ui/stat-card` | Carte statistique dashboard |

### Formulaires Métier

| Composant | Path | Usage |
|-----------|------|-------|
| `DatePicker` | `@verone/ui/date-picker` | Sélecteur date |
| `FileUpload` | `@verone/ui/file-upload` | Upload fichiers/images |
| `RichTextEditor` | `@verone/ui/rich-text-editor` | Éditeur texte riche |
| `ComboBox` | `@verone/ui/combobox` | Select avec recherche |

## Conventions d'Usage

### Import

```typescript
// ✅ Correct - import direct du package
import { Button } from "@verone/ui/button"
import { Card, CardHeader, CardContent } from "@verone/ui/card"

// ❌ Incorrect - import relatif
import { Button } from "../../packages/@verone/ui/src/button"
```

### Composition

```tsx
// ✅ Correct - composition shadcn
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>

// ❌ Incorrect - props-based
<Card title="Titre" content="Contenu" />
```

### Variants

```tsx
// Button variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Danger</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

## Ajout Nouveau Composant

1. Vérifier si composant existe déjà dans shadcn/ui
2. Si oui: `npx shadcn-ui@latest add [component]`
3. Si non: créer dans `packages/@verone/ui/src/`
4. Documenter ici dans le catalogue

## Références

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
