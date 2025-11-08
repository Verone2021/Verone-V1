import type { Meta, StoryObj } from '@storybook/nextjs';
import { Save, Trash2, Plus, Download, Settings } from 'lucide-react';

import { Button, ButtonV2 } from '@/components/ui/button';

const meta = {
  title: '1-UI-Base/Buttons/Button',
  component: ButtonV2,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
🎨 **Design System V2** - Bouton moderne avec micro-interactions et gradients.

**Tendances 2025** :
- Rounded corners (10px)
- Micro-interactions (hover scale 1.02)
- Transitions smooth (200ms cubic-bezier)
- Shadows élégantes
- Accessibilité ARIA complète

**Variantes disponibles** :
- \`primary\` : Action principale (bleu #3b86d1)
- \`secondary\` : Action secondaire (blanc avec bordure bleue)
- \`outline\` : Action tertiaire (transparent avec bordure)
- \`success\` : Action positive (vert #38ce3c)
- \`danger\` : Action destructive (rouge #ff4d6b)
- \`warning\` : Action attention (orange #ff9b3e)
- \`ghost\` : Action discrète (transparent)

**Tailles disponibles** :
- \`xs\` : 28px (12px text)
- \`sm\` : 32px (13px text)
- \`md\` : 36px (14px text) - **Default**
- \`lg\` : 40px (15px text)
- \`xl\` : 44px (16px text) - Touch-friendly mobile

**Inspirations** : Vercel, Linear, Stripe, shadcn/ui
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'success',
        'danger',
        'warning',
        'ghost',
      ],
      description: 'Variante visuelle du bouton',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Taille du bouton',
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé',
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement avec spinner',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: "Position de l'icône",
    },
  },
} satisfies Meta<typeof ButtonV2>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Bouton primary - Action principale
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Bouton secondary - Action secondaire
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Bouton outline - Action tertiaire
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Bouton success - Action positive (validation)
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
    icon: Save,
  },
};

/**
 * Bouton danger - Action destructive
 */
export const Danger: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
    icon: Trash2,
  },
};

/**
 * Bouton warning - Action attention
 */
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

/**
 * Bouton ghost - Action discrète
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Avec icône à gauche (défaut)
 */
export const WithIconLeft: Story = {
  args: {
    variant: 'primary',
    children: 'Create Product',
    icon: Plus,
    iconPosition: 'left',
  },
};

/**
 * Avec icône à droite
 */
export const WithIconRight: Story = {
  args: {
    variant: 'primary',
    children: 'Download Report',
    icon: Download,
    iconPosition: 'right',
  },
};

/**
 * État loading avec spinner
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Saving...',
    loading: true,
  },
};

/**
 * État disabled
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
};

/**
 * Tailles disponibles
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonV2 size="xs" variant="primary">
        XS (28px)
      </ButtonV2>
      <ButtonV2 size="sm" variant="primary">
        SM (32px)
      </ButtonV2>
      <ButtonV2 size="md" variant="primary">
        MD (36px)
      </ButtonV2>
      <ButtonV2 size="lg" variant="primary">
        LG (40px)
      </ButtonV2>
      <ButtonV2 size="xl" variant="primary">
        XL (44px)
      </ButtonV2>
    </div>
  ),
};

/**
 * Toutes les variantes en grille
 */
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <ButtonV2 variant="primary">Primary</ButtonV2>
      <ButtonV2 variant="secondary">Secondary</ButtonV2>
      <ButtonV2 variant="outline">Outline</ButtonV2>
      <ButtonV2 variant="success" icon={Save}>
        Success
      </ButtonV2>
      <ButtonV2 variant="destructive" icon={Trash2}>
        Danger
      </ButtonV2>
      <ButtonV2 variant="warning">Warning</ButtonV2>
      <ButtonV2 variant="ghost">Ghost</ButtonV2>
    </div>
  ),
};

/**
 * Exemples réels d'utilisation
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6 p-4">
      {/* Actions principales formulaires */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Actions Formulaires
        </h3>
        <div className="flex gap-2">
          <ButtonV2 variant="primary" icon={Save}>
            Enregistrer
          </ButtonV2>
          <ButtonV2 variant="secondary">Annuler</ButtonV2>
        </div>
      </div>

      {/* Actions destructives */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">
          Actions Destructives
        </h3>
        <div className="flex gap-2">
          <ButtonV2 variant="destructive" icon={Trash2} size="sm">
            Supprimer
          </ButtonV2>
          <ButtonV2 variant="outline" size="sm">
            Conserver
          </ButtonV2>
        </div>
      </div>

      {/* Actions toolbar */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Toolbar Actions</h3>
        <div className="flex gap-2">
          <ButtonV2 variant="ghost" icon={Plus} size="sm">
            Nouveau
          </ButtonV2>
          <ButtonV2 variant="ghost" icon={Download} size="sm">
            Exporter
          </ButtonV2>
          <ButtonV2 variant="ghost" icon={Settings} size="sm">
            Paramètres
          </ButtonV2>
        </div>
      </div>

      {/* Loading states */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">États Loading</h3>
        <div className="flex gap-2">
          <ButtonV2 variant="primary" loading>
            Chargement...
          </ButtonV2>
          <ButtonV2 variant="success" loading>
            Validation...
          </ButtonV2>
          <ButtonV2 variant="destructive" loading>
            Suppression...
          </ButtonV2>
        </div>
      </div>
    </div>
  ),
};

/**
 * Micro-interactions (hover, active)
 */
export const MicroInteractions: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <p className="text-sm text-gray-600">
        Survolez et cliquez sur les boutons pour voir les micro-interactions :
      </p>
      <div className="flex gap-4">
        <ButtonV2 variant="primary">Hover Scale 1.02</ButtonV2>
        <ButtonV2 variant="success">Active Scale 0.98</ButtonV2>
        <ButtonV2 variant="warning">Shadow Elevation</ButtonV2>
      </div>
      <p className="text-xs text-gray-500">
        Transitions : 200ms cubic-bezier(0.4, 0, 0.2, 1)
      </p>
    </div>
  ),
};
