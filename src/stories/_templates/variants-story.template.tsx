/**
 * Template Story avec Variants
 *
 * Utilisation : Composants avec multiples variantes visuelles
 * Exemples : Button, Card, Badge avec variants
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@/components/path/to/component-name';

const meta = {
  title: 'Category/Subcategory/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Description du composant avec ses variantes.

**Variantes disponibles** :
- \`default\` : Style par défaut
- \`primary\` : Action principale
- \`secondary\` : Action secondaire
- \`destructive\` : Action destructive
- \`outline\` : Version outline
- \`ghost\` : Version fantôme

**Version** : V1 ou V2 (préciser)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'destructive', 'outline', 'ghost'],
      description: 'Variante visuelle',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'icon'],
      description: 'Taille du composant',
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé',
    },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Variante par défaut
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Button',
  },
};

/**
 * Variante primaire (action principale)
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Variante secondaire
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Variante destructive (actions dangereuses)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Variante outline
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Variante ghost
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Tailles disponibles
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ComponentName size="sm">Small</ComponentName>
      <ComponentName size="default">Default</ComponentName>
      <ComponentName size="lg">Large</ComponentName>
    </div>
  ),
};

/**
 * État désactivé
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * État loading (si applicable)
 */
export const Loading: Story = {
  args: {
    // isLoading: true,
    children: 'Loading...',
  },
};

/**
 * Toutes les variantes en grille
 */
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <ComponentName variant="primary">Default</ComponentName>
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
      <ComponentName variant="danger">Destructive</ComponentName>
      <ComponentName variant="outline">Outline</ComponentName>
      <ComponentName variant="ghost">Ghost</ComponentName>
    </div>
  ),
};
