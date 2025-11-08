import type { Meta, StoryObj } from '@storybook/nextjs';
import { Check, AlertTriangle, X, Star, Clock } from 'lucide-react';

import { Badge } from '@verone/ui'

const meta = {
  title: '1-UI-Base/Badges/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
🏷️ **Badge** - Étiquette/label avec variants colorés.

**Variantes** :
- \`default\` : Noir (slate-900)
- \`secondary\` : Gris clair (slate-100)
- \`success\` : Vert (green-100)
- \`warning\` : Orange (orange-100)
- \`danger\` : Rouge (red-100)
- \`info\` : Bleu (blue-100)
- \`outline\` : Bordure grise
- \`destructive\` : Rouge foncé (red-600)

**Tailles** :
- \`sm\` : 12px (xs text)
- \`md\` : 14px (sm text) - **Default**
- \`lg\` : 16px (base text)

**Fonctionnalités** :
- Dot indicator (point coloré)
- Icon support (icône Lucide)
- Removable (bouton X fermeture)

**Version** : V1 (shadcn/ui + enhancements)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'outline',
        'destructive',
      ],
      description: 'Variante colorée du badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du badge',
    },
    dot: {
      control: 'boolean',
      description: 'Afficher point indicateur',
    },
    onRemove: {
      description: 'Callback pour badge removable (affiche bouton X)',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Badge default (noir)
 */
export const Default: Story = {
  args: {
    children: 'Default',
  },
};

/**
 * Badge secondary (gris)
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

/**
 * Badge success (vert)
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

/**
 * Badge warning (orange)
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

/**
 * Badge danger (rouge clair)
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger',
  },
};

/**
 * Badge info (bleu)
 */
export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

/**
 * Badge outline (bordure)
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

/**
 * Badge destructive (rouge foncé)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

/**
 * Avec point indicateur (dot)
 */
export const WithDot: Story = {
  args: {
    variant: 'success',
    dot: true,
    children: 'Actif',
  },
};

/**
 * Avec dot et couleur personnalisée
 */
export const WithColoredDot: Story = {
  args: {
    variant: 'secondary',
    dot: true,
    dotColor: '#3b86d1',
    children: 'En cours',
  },
};

/**
 * Avec icône
 */
export const WithIcon: Story = {
  args: {
    variant: 'success',
    icon: <Check className="w-3 h-3" />,
    children: 'Validé',
  },
};

/**
 * Removable (avec bouton X)
 */
export const Removable: Story = {
  args: {
    variant: 'info',
    children: 'Closable',
    onRemove: () => console.log('Remove clicked'),
  },
};

/**
 * Tailles disponibles
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm" variant="info">
        Small (xs)
      </Badge>
      <Badge size="md" variant="info">
        Medium (sm)
      </Badge>
      <Badge size="lg" variant="info">
        Large (base)
      </Badge>
    </div>
  ),
};

/**
 * Toutes les variantes
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

/**
 * Statuts produits
 */
export const ProductStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" dot>
        En stock
      </Badge>
      <Badge variant="warning" dot dotColor="#ff9b3e">
        Stock faible
      </Badge>
      <Badge variant="destructive" dot>
        Rupture
      </Badge>
      <Badge variant="info" dot>
        Commande en cours
      </Badge>
      <Badge variant="secondary" dot dotColor="#6c7293">
        Archivé
      </Badge>
    </div>
  ),
};

/**
 * Statuts commandes
 */
export const OrderStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>
        Brouillon
      </Badge>
      <Badge variant="info" icon={<Clock className="w-3 h-3" />}>
        En attente
      </Badge>
      <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>
        À valider
      </Badge>
      <Badge variant="success" icon={<Check className="w-3 h-3" />}>
        Confirmé
      </Badge>
      <Badge variant="destructive" icon={<X className="w-3 h-3" />}>
        Annulé
      </Badge>
    </div>
  ),
};

/**
 * Tags removables
 */
export const RemovableTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" onRemove={() => console.log('Remove React')}>
        React
      </Badge>
      <Badge variant="outline" onRemove={() => console.log('Remove Next.js')}>
        Next.js
      </Badge>
      <Badge
        variant="outline"
        onRemove={() => console.log('Remove TypeScript')}
      >
        TypeScript
      </Badge>
      <Badge variant="outline" onRemove={() => console.log('Remove Tailwind')}>
        Tailwind
      </Badge>
    </div>
  ),
};

/**
 * Exemples réels d'utilisation
 */
export const RealWorld: Story = {
  render: () => (
    <div className="space-y-6 p-4 w-[500px]">
      {/* Produit avec badges */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Fauteuil Milo - Vert
            </h3>
            <p className="text-sm text-slate-600 mt-1">SKU: FAUT-MILO-VERT</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant="success" dot>
              En stock
            </Badge>
            <Badge variant="info" size="sm">
              Nouveauté
            </Badge>
          </div>
        </div>
      </div>

      {/* Commande avec badges statut */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Commande #CMD-2025-001
            </h3>
            <p className="text-sm text-slate-600 mt-1">Client: Maison Dupont</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant="success" icon={<Check className="w-3 h-3" />}>
              Confirmé
            </Badge>
            <Badge variant="warning" size="sm">
              Paiement en attente
            </Badge>
          </div>
        </div>
      </div>

      {/* Filtres actifs removables */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Filtres actifs</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" onRemove={() => {}}>
            Catégorie: Fauteuils
          </Badge>
          <Badge variant="outline" onRemove={() => {}}>
            Prix: 200€ - 500€
          </Badge>
          <Badge variant="outline" onRemove={() => {}}>
            Couleur: Vert
          </Badge>
          <Badge variant="outline" onRemove={() => {}}>
            En stock uniquement
          </Badge>
        </div>
      </div>

      {/* Collection avec tags */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">
          Collection Automne 2025
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" icon={<Star className="w-3 h-3" />}>
            Tendance
          </Badge>
          <Badge variant="info" size="sm">
            45 produits
          </Badge>
          <Badge variant="success" dot>
            Actif
          </Badge>
        </div>
      </div>
    </div>
  ),
};
