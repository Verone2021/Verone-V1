import type { Meta, StoryObj } from '@storybook/react';
import {
  Save,
  Trash2,
  Download,
  Edit,
  Plus,
  ArrowRight,
  Check,
  Upload,
} from 'lucide-react';

import { ButtonUnified } from './button-unified';

/**
 * ButtonUnified - Composant bouton générique unifié Design System V2
 *
 * ## Caractéristiques
 * - 8 variants : default, destructive, outline, secondary, ghost, link, gradient, glass
 * - 5 sizes : xs, sm, md, lg, xl + icon (carré)
 * - Support icônes Lucide (left/right)
 * - État loading avec spinner
 * - Polymorphic avec asChild
 * - Microinteractions : hover scale, transitions
 * - Accessibilité WCAG 2.2 AA
 *
 * ## Migration depuis composants legacy
 * - `ActionButton` → `ButtonUnified` avec props simplifiées
 * - `ModernActionButton` → `ButtonUnified` + mapping des actions
 * - `StandardModifyButton` → `ButtonUnified variant="outline" size="sm"`
 * - `ButtonV2` → `ButtonUnified` (alias direct)
 *
 * @see /docs/audits/2025-11/GUIDE-DESIGN-SYSTEM-V2.md
 */
const meta: Meta<typeof ButtonUnified> = {
  title: 'UI/ButtonUnified',
  component: ButtonUnified,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'gradient',
        'glass',
      ],
      description: 'Style variant du bouton',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'icon'],
      description: 'Taille du bouton',
    },
    icon: {
      control: false,
      description: 'Icône Lucide à afficher',
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right'],
      description: 'Position de l\'icône',
    },
    loading: {
      control: 'boolean',
      description: 'État loading avec spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé',
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ButtonUnified>;

// ============================================
// VARIANTS
// ============================================

export const Default: Story = {
  args: {
    children: 'Bouton primaire',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Supprimer',
    variant: 'destructive',
    icon: Trash2,
  },
};

export const Outline: Story = {
  args: {
    children: 'Modifier',
    variant: 'outline',
    icon: Edit,
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondaire',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Lien cliquable',
    variant: 'link',
  },
};

export const Gradient: Story = {
  args: {
    children: 'Gradient moderne',
    variant: 'gradient',
    icon: Plus,
  },
};

export const Glass: Story = {
  args: {
    children: 'Glass effect',
    variant: 'glass',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// ============================================
// SIZES
// ============================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ButtonUnified size="xs">Extra Small</ButtonUnified>
      <ButtonUnified size="sm">Small</ButtonUnified>
      <ButtonUnified size="md">Medium</ButtonUnified>
      <ButtonUnified size="lg">Large</ButtonUnified>
      <ButtonUnified size="xl">Extra Large</ButtonUnified>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ButtonUnified size="icon" icon={Save} aria-label="Enregistrer" />
      <ButtonUnified
        size="icon"
        variant="destructive"
        icon={Trash2}
        aria-label="Supprimer"
      />
      <ButtonUnified
        size="icon"
        variant="outline"
        icon={Edit}
        aria-label="Modifier"
      />
      <ButtonUnified
        size="icon"
        variant="ghost"
        icon={Download}
        aria-label="Télécharger"
      />
    </div>
  ),
};

// ============================================
// ICONS
// ============================================

export const WithIconLeft: Story = {
  args: {
    children: 'Enregistrer',
    icon: Save,
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Continuer',
    icon: ArrowRight,
    iconPosition: 'right',
  },
};

export const IconVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ButtonUnified icon={Save}>Enregistrer</ButtonUnified>
        <ButtonUnified variant="destructive" icon={Trash2}>
          Supprimer
        </ButtonUnified>
        <ButtonUnified variant="outline" icon={Edit}>
          Modifier
        </ButtonUnified>
      </div>
      <div className="flex items-center gap-2">
        <ButtonUnified icon={Download} iconPosition="right">
          Télécharger
        </ButtonUnified>
        <ButtonUnified icon={Upload} iconPosition="right">
          Importer
        </ButtonUnified>
        <ButtonUnified variant="gradient" icon={Plus}>
          Nouveau
        </ButtonUnified>
      </div>
    </div>
  ),
};

// ============================================
// STATES
// ============================================

export const Loading: Story = {
  args: {
    children: 'Chargement...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Désactivé',
    disabled: true,
  },
};

export const LoadingWithIcon: Story = {
  args: {
    children: 'Enregistrement...',
    icon: Save,
    loading: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ButtonUnified>Normal</ButtonUnified>
        <ButtonUnified loading>Loading</ButtonUnified>
        <ButtonUnified disabled>Disabled</ButtonUnified>
      </div>
      <div className="flex items-center gap-2">
        <ButtonUnified variant="destructive">Normal</ButtonUnified>
        <ButtonUnified variant="destructive" loading>
          Loading
        </ButtonUnified>
        <ButtonUnified variant="destructive" disabled>
          Disabled
        </ButtonUnified>
      </div>
      <div className="flex items-center gap-2">
        <ButtonUnified variant="outline">Normal</ButtonUnified>
        <ButtonUnified variant="outline" loading>
          Loading
        </ButtonUnified>
        <ButtonUnified variant="outline" disabled>
          Disabled
        </ButtonUnified>
      </div>
    </div>
  ),
};

// ============================================
// USE CASES
// ============================================

export const FormActions: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ButtonUnified variant="outline">Annuler</ButtonUnified>
      <ButtonUnified icon={Save}>Enregistrer</ButtonUnified>
    </div>
  ),
};

export const CRUDActions: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ButtonUnified size="sm" variant="outline" icon={Edit}>
        Modifier
      </ButtonUnified>
      <ButtonUnified size="sm" variant="destructive" icon={Trash2}>
        Supprimer
      </ButtonUnified>
    </div>
  ),
};

export const CTAButtons: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 p-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg">
      <ButtonUnified size="lg" variant="gradient" icon={Plus}>
        Créer un nouveau produit
      </ButtonUnified>
      <ButtonUnified size="lg" variant="glass" icon={ArrowRight} iconPosition="right">
        Explorer le catalogue
      </ButtonUnified>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const ApprovalFlow: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ButtonUnified variant="ghost">Ignorer</ButtonUnified>
      <ButtonUnified variant="outline">Reporter</ButtonUnified>
      <ButtonUnified variant="secondary" icon={Check}>
        Approuver
      </ButtonUnified>
    </div>
  ),
};

// ============================================
// ACCESSIBILITY
// ============================================

export const AccessibilityExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600">
        Tous les boutons supportent la navigation clavier (Tab, Enter, Space)
      </p>
      <div className="flex items-center gap-2">
        <ButtonUnified>Focusable 1</ButtonUnified>
        <ButtonUnified>Focusable 2</ButtonUnified>
        <ButtonUnified disabled>Disabled (non focusable)</ButtonUnified>
      </div>
      <div className="flex items-center gap-2">
        <ButtonUnified size="icon" icon={Save} aria-label="Enregistrer le document" />
        <ButtonUnified size="icon" icon={Trash2} aria-label="Supprimer définitivement" />
      </div>
      <p className="text-xs text-neutral-500">
        💡 Les boutons icon-only doivent avoir un aria-label descriptif
      </p>
    </div>
  ),
};

// ============================================
// RESPONSIVE
// ============================================

export const ResponsiveExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <ButtonUnified className="w-full">Bouton pleine largeur</ButtonUnified>
      <div className="flex gap-2">
        <ButtonUnified className="flex-1">Bouton 1</ButtonUnified>
        <ButtonUnified className="flex-1">Bouton 2</ButtonUnified>
      </div>
      <div className="flex gap-2">
        <ButtonUnified size="sm" className="flex-1">
          Small
        </ButtonUnified>
        <ButtonUnified size="md" className="flex-1">
          Medium
        </ButtonUnified>
        <ButtonUnified size="lg" className="flex-1">
          Large
        </ButtonUnified>
      </div>
    </div>
  ),
};
