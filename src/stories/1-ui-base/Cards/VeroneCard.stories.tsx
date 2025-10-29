import type { Meta, StoryObj } from '@storybook/react';
import { VéroneCard } from '@/components/ui/verone-card';

const meta = {
  title: '1-UI-Base/Cards/VéroneCard',
  component: VéroneCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
🎨 **Design System V2** - Carte standardisée pour entités métier Vérone.

**Fonctionnalités** :
- Icônes de fallback par type d'entité (family, category, subcategory, product)
- Upload image personnalisée (32x32px ou 12x12px selon position)
- Badge slug (\`#code\`)
- Badge statut (Actif/Inactif)
- Compteur avec label (ex: "5 catégories")
- Actions Edit/Delete intégrées
- Hover effects (scale 1.02, shadow, border color)

**Types d'entités** :
- \`family\` : Famille produits (icône FolderOpen)
- \`category\` : Catégorie (icône Tag)
- \`subcategory\` : Sous-catégorie (icône Package)
- \`product\` : Produit (icône Package)

**Positions icône** :
- \`top-left\` : 32x32px, contenu décalé à droite
- \`top-right\` : 48x48px, aligné en haut à droite (défaut)

**Version** : V2 (Design System Vérone 2025)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['family', 'category', 'subcategory', 'product'],
      description: 'Type d\'entité Vérone',
    },
    iconPosition: {
      control: 'radio',
      options: ['top-left', 'top-right'],
      description: 'Position de l\'icône dans la carte',
    },
    isActive: {
      control: 'boolean',
      description: 'État actif/inactif (badge vert/gris)',
    },
  },
} satisfies Meta<typeof VéroneCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Carte famille (FolderOpen icon)
 */
export const Family: Story = {
  args: {
    title: 'Mobilier de Salon',
    description: 'Famille complète de meubles pour salon',
    entityType: 'family',
    slug: 'mobilier-salon',
    count: 12,
    countLabel: 'catégorie',
    isActive: true,
  },
};

/**
 * Carte catégorie (Tag icon)
 */
export const Category: Story = {
  args: {
    title: 'Fauteuils',
    description: 'Fauteuils confort et design',
    entityType: 'category',
    slug: 'fauteuils',
    count: 45,
    countLabel: 'produit',
    isActive: true,
  },
};

/**
 * Carte sous-catégorie (Package icon)
 */
export const Subcategory: Story = {
  args: {
    title: 'Fauteuils Scandinaves',
    description: 'Style nordique épuré',
    entityType: 'subcategory',
    slug: 'fauteuils-scandi',
    count: 18,
    countLabel: 'produit',
    isActive: true,
  },
};

/**
 * Carte produit (Package icon)
 */
export const Product: Story = {
  args: {
    title: 'Fauteuil Milo - Vert',
    description: 'Velours premium, pieds bois massif',
    entityType: 'product',
    slug: 'FAUT-MILO-VERT',
    isActive: true,
  },
};

/**
 * Carte avec image personnalisée
 */
export const WithImage: Story = {
  args: {
    title: 'Collection Automne 2025',
    description: 'Nouvelle collection tendance',
    entityType: 'family',
    imageUrl: 'https://picsum.photos/48',
    slug: 'automne-2025',
    count: 28,
    countLabel: 'produit',
    isActive: true,
  },
};

/**
 * Carte avec actions Edit/Delete
 */
export const WithActions: Story = {
  args: {
    title: 'Canapés Modulables',
    description: 'Configurations personnalisables',
    entityType: 'category',
    slug: 'canapes-modulables',
    count: 15,
    countLabel: 'produit',
    isActive: true,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

/**
 * Carte inactive (badge gris)
 */
export const Inactive: Story = {
  args: {
    title: 'Collection Archivée',
    description: 'Produits discontinués',
    entityType: 'family',
    slug: 'archive-2024',
    count: 42,
    countLabel: 'produit',
    isActive: false,
  },
};

/**
 * Icône position top-left
 */
export const IconTopLeft: Story = {
  args: {
    title: 'Tables Basses',
    description: 'Design moderne et épuré',
    entityType: 'category',
    slug: 'tables-basses',
    count: 22,
    countLabel: 'produit',
    iconPosition: 'top-left',
    isActive: true,
  },
};

/**
 * Icône position top-right (défaut)
 */
export const IconTopRight: Story = {
  args: {
    title: 'Luminaires',
    description: 'Éclairage d\'ambiance',
    entityType: 'category',
    slug: 'luminaires',
    count: 67,
    countLabel: 'produit',
    iconPosition: 'top-right',
    isActive: true,
  },
};

/**
 * Sans compteur
 */
export const NoCount: Story = {
  args: {
    title: 'Décoration Murale',
    description: 'Cadres, miroirs, tableaux',
    entityType: 'family',
    slug: 'deco-murale',
    isActive: true,
  },
};

/**
 * Texte long (description truncate)
 */
export const LongText: Story = {
  args: {
    title: 'Collection Exclusive Printemps-Été 2025',
    description: 'Cette collection exclusive propose une gamme complète de meubles design contemporain inspirés des tendances scandinaves et méditerranéennes, avec des matériaux nobles et durables.',
    entityType: 'family',
    slug: 'exclusive-pe-2025',
    count: 156,
    countLabel: 'produit',
    isActive: true,
  },
};

/**
 * Grille de cartes métier
 */
export const Grid: Story = ({
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <VéroneCard
        title="Mobilier de Salon"
        entityType="family"
        slug="salon"
        count={45}
        countLabel="produit"
        isActive={true}
      />
      <VéroneCard
        title="Fauteuils"
        entityType="category"
        slug="fauteuils"
        count={18}
        countLabel="produit"
        isActive={true}
      />
      <VéroneCard
        title="Tables"
        entityType="category"
        slug="tables"
        count={23}
        countLabel="produit"
        isActive={true}
      />
      <VéroneCard
        title="Luminaires"
        entityType="category"
        slug="luminaires"
        count={67}
        countLabel="produit"
        isActive={true}
      />
      <VéroneCard
        title="Décoration"
        entityType="family"
        slug="deco"
        count={92}
        countLabel="produit"
        isActive={true}
      />
      <VéroneCard
        title="Archive 2024"
        entityType="family"
        slug="archive"
        count={128}
        countLabel="produit"
        isActive={false}
      />
    </div>
  ),
} as any);

/**
 * Exemple réel d'utilisation
 */
export const RealWorld: Story = ({
  render: () => (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold">Catalogue Produits</h2>

      {/* Section Familles */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Familles</h3>
        <div className="grid grid-cols-2 gap-3">
          <VéroneCard
            title="Mobilier de Salon"
            description="Canapés, fauteuils, tables basses"
            entityType="family"
            slug="mobilier-salon"
            count={45}
            countLabel="produit"
            isActive={true}
            onClick={() => console.log('Navigate to family')}
            onEdit={() => console.log('Edit family')}
          />
          <VéroneCard
            title="Mobilier de Chambre"
            description="Lits, armoires, commodes"
            entityType="family"
            slug="mobilier-chambre"
            count={38}
            countLabel="produit"
            isActive={true}
            onClick={() => console.log('Navigate to family')}
            onEdit={() => console.log('Edit family')}
          />
        </div>
      </div>

      {/* Section Catégories */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Catégories Populaires</h3>
        <div className="grid grid-cols-3 gap-3">
          <VéroneCard
            title="Fauteuils"
            entityType="category"
            slug="fauteuils"
            count={18}
            countLabel="produit"
            isActive={true}
            iconPosition="top-right"
          />
          <VéroneCard
            title="Tables"
            entityType="category"
            slug="tables"
            count={23}
            countLabel="produit"
            isActive={true}
            iconPosition="top-right"
          />
          <VéroneCard
            title="Luminaires"
            entityType="category"
            slug="luminaires"
            count={67}
            countLabel="produit"
            isActive={true}
            iconPosition="top-right"
          />
        </div>
      </div>
    </div>
  ),
} as any);
