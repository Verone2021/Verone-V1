/**
 * Template Story Basique
 *
 * Utilisation : Composants simples avec peu de props
 * Exemples : Badge, Avatar, Separator
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
        component: 'Description courte du composant. Indiquer version (V1/V2) si applicable.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Définir les contrôles pour les props
    // Exemples :
    // variant: {
    //   control: 'select',
    //   options: ['default', 'primary', 'secondary'],
    //   description: 'Variante visuelle du composant',
    // },
    // size: {
    //   control: 'select',
    //   options: ['sm', 'md', 'lg'],
    // },
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * État par défaut du composant
 */
export const Default: Story = {
  args: {
    // Props par défaut
  },
};

/**
 * Variante interactive
 */
export const Interactive: Story = {
  args: {
    // Props pour état interactif
  },
};

/**
 * Cas limite (vide, erreur, loading, etc.)
 */
export const EdgeCase: Story = {
  args: {
    // Props pour cas limite
  },
};
