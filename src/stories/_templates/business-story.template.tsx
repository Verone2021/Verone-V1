/**
 * Template Story Business Complex
 *
 * Utilisation : Composants métier avec logique complexe et données mock
 * Exemples : ProductCard, OrderTable, StockMovementForm
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@/components/path/to/component-name';

// Mock data pour le composant
const mockData = {
  // Exemple pour ProductCard
  // id: '1',
  // name: 'Fauteuil Milo - Vert',
  // sku: 'FAUT-MILO-VERT',
  // price: 299.99,
  // stock: 5,
  // primary_image_url: '/placeholder-product.jpg',
};

const meta = {
  title: '2-Business/Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'padded', // 'centered', 'padded', 'fullscreen'
    docs: {
      description: {
        component: `
Description détaillée du composant métier.

**Utilisation** :
- Context 1 : Description
- Context 2 : Description

**Dépendances** :
- Supabase queries : \`products\`, \`organisations\`, etc.
- Context : \`useAuth()\`, \`useToast()\`
- Permissions : \`Owner\`, \`Admin\`

**Version** : V1 ou V2
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    // Props du composant
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * État par défaut avec données standard
 */
export const Default: Story = {
  args: {
    data: mockData,
  },
};

/**
 * État loading (pendant chargement données)
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/**
 * État vide (aucune donnée disponible)
 */
export const Empty: Story = {
  args: {
    data: null,
  },
};

/**
 * État erreur (échec chargement)
 */
export const Error: Story = {
  args: {
    error: 'Échec du chargement des données',
  },
};

/**
 * État avec données complètes (tous les champs remplis)
 */
export const Complete: Story = {
  args: {
    data: {
      ...mockData,
      // Ajouter tous les champs optionnels remplis
    },
  },
};

/**
 * État avec données partielles (champs optionnels vides)
 */
export const Partial: Story = {
  args: {
    data: {
      // Seulement champs obligatoires
      id: '1',
      name: 'Produit minimal',
    },
  },
};

/**
 * État avec beaucoup de données (test scroll, pagination)
 */
export const ManyItems: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      ...mockData,
      id: `${i + 1}`,
      name: `Item ${i + 1}`,
    })),
  },
};

/**
 * État interactive (formulaire, actions utilisateur)
 */
export const Interactive: Story = {
  args: {
    data: mockData,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onSubmit: (data: any) => console.log('Submitted:', data),
  },
};

/**
 * Variante mobile (responsive)
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    data: mockData,
  },
};

/**
 * Variante desktop (full width)
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  args: {
    data: mockData,
  },
};

/**
 * Cas d'utilisation réel avec contexte complet
 */
export const RealWorld: Story = {
  render: () => {
    // Simuler contexte réel avec providers si nécessaire
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exemple réel d'utilisation</h2>
        <ComponentName data={mockData} />
      </div>
    );
  },
};
