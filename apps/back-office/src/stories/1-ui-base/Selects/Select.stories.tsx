import type { Meta, StoryObj } from '@storybook/nextjs';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

const meta = {
  title: '1-UI-Base/Selects/Select',
  component: SelectTrigger,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
📋 **Select** - Menu déroulant avec variants CVA dynamiques.

**Composants** :
- \`Select\` : Root wrapper (Radix)
- \`SelectTrigger\` : Bouton déclencheur avec variants CVA
- \`SelectContent\` : Dropdown content
- \`SelectItem\` : Options individuelles
- \`SelectValue\` : Placeholder/valeur sélectionnée

**Variants Visuels** (CVA) :
- \`default\` : Border arrondie classique (rounded-lg) - **Default**
- \`filled\` : Background gris (bg-slate-100, focus:bg-white)
- \`outlined\` : Border prononcée (border-2)
- \`underlined\` : Border-bottom seulement (style Material)

**États de Validation** :
- \`default\` : État normal (slate-300)
- \`error\` : Bordure rouge + message erreur
- \`success\` : Bordure verte (validation)

**Tailles** :
- \`sm\` : 32px (h-8, px-3, text-sm)
- \`md\` : 40px (h-10, px-4, text-sm) - **Default**
- \`lg\` : 48px (h-12, px-4, text-base)

**Version** : V2 (CVA + Radix UI + shadcn/ui)

**Note** : Radix Select est **single-select only**. Multi-select nécessite un composant Combobox séparé.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'underlined'],
      description: 'Style visuel du Select (CVA variant)',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'État de validation',
    },
    selectSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du Select',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactiver le Select',
    },
  },
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Select basique avec variant default
 */
export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Sélectionner une catégorie..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Catégories</SelectLabel>
          <SelectItem value="fauteuils">Fauteuils</SelectItem>
          <SelectItem value="canapes">Canapés</SelectItem>
          <SelectItem value="tables">Tables</SelectItem>
          <SelectItem value="chaises">Chaises</SelectItem>
          <SelectItem value="luminaires">Luminaires</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

/**
 * Tous les variants visuels
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Default (Border classique)
        </h4>
        <Select>
          <SelectTrigger variant="default" className="w-full">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Filled (Background gris)
        </h4>
        <Select>
          <SelectTrigger variant="filled" className="w-full">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Outlined (Border prononcée)
        </h4>
        <Select>
          <SelectTrigger variant="outlined" className="w-full">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Underlined (Border-bottom seulement)
        </h4>
        <Select>
          <SelectTrigger variant="underlined" className="w-full">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

/**
 * Toutes les tailles
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Small (32px)
        </h4>
        <Select>
          <SelectTrigger selectSize="sm" className="w-full">
            <SelectValue placeholder="Small select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Medium (40px) - Default
        </h4>
        <Select>
          <SelectTrigger selectSize="md" className="w-full">
            <SelectValue placeholder="Medium select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Large (48px)
        </h4>
        <Select>
          <SelectTrigger selectSize="lg" className="w-full">
            <SelectValue placeholder="Large select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

/**
 * États de validation
 */
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Default (état normal)
        </h4>
        <Select>
          <SelectTrigger state="default" className="w-full">
            <SelectValue placeholder="État normal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Error (validation échouée)
        </h4>
        <Select>
          <SelectTrigger state="error" className="w-full">
            <SelectValue placeholder="Erreur de validation..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-sm text-red-600">Ce champ est obligatoire</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Success (validation réussie)
        </h4>
        <Select>
          <SelectTrigger state="success" className="w-full">
            <SelectValue placeholder="Validation réussie..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">Option 1</SelectItem>
            <SelectItem value="opt2">Option 2</SelectItem>
            <SelectItem value="opt3">Option 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-sm text-green-600">Sélection valide ✓</p>
      </div>
    </div>
  ),
};

/**
 * Variants × États (matrice complète)
 */
export const VariantsWithStates: Story = {
  render: () => (
    <div className="space-y-8 w-[500px]">
      {/* Default variant avec tous les états */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Default Variant
        </h3>
        <div className="space-y-3">
          <Select>
            <SelectTrigger variant="default" state="default" className="w-full">
              <SelectValue placeholder="Default + Default state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger variant="default" state="error" className="w-full">
              <SelectValue placeholder="Default + Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger variant="default" state="success" className="w-full">
              <SelectValue placeholder="Default + Success state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filled variant avec tous les états */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Filled Variant
        </h3>
        <div className="space-y-3">
          <Select>
            <SelectTrigger variant="filled" state="default" className="w-full">
              <SelectValue placeholder="Filled + Default state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger variant="filled" state="error" className="w-full">
              <SelectValue placeholder="Filled + Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger variant="filled" state="success" className="w-full">
              <SelectValue placeholder="Filled + Success state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Outlined variant avec tous les états */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Outlined Variant
        </h3>
        <div className="space-y-3">
          <Select>
            <SelectTrigger
              variant="outlined"
              state="default"
              className="w-full"
            >
              <SelectValue placeholder="Outlined + Default state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger variant="outlined" state="error" className="w-full">
              <SelectValue placeholder="Outlined + Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger
              variant="outlined"
              state="success"
              className="w-full"
            >
              <SelectValue placeholder="Outlined + Success state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Underlined variant avec tous les états */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Underlined Variant
        </h3>
        <div className="space-y-3">
          <Select>
            <SelectTrigger
              variant="underlined"
              state="default"
              className="w-full"
            >
              <SelectValue placeholder="Underlined + Default state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger
              variant="underlined"
              state="error"
              className="w-full"
            >
              <SelectValue placeholder="Underlined + Error state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger
              variant="underlined"
              state="success"
              className="w-full"
            >
              <SelectValue placeholder="Underlined + Success state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
};

/**
 * Select avec groupes de catégories
 */
export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[300px]">
        <SelectValue placeholder="Sélectionner un produit..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fauteuils</SelectLabel>
          <SelectItem value="faut-milo">Fauteuil Milo</SelectItem>
          <SelectItem value="faut-vera">Fauteuil Vera</SelectItem>
          <SelectItem value="faut-oslo">Fauteuil Oslo</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Canapés</SelectLabel>
          <SelectItem value="canape-cloud">Canapé Cloud</SelectItem>
          <SelectItem value="canape-nordic">Canapé Nordic</SelectItem>
          <SelectItem value="canape-lux">Canapé Lux</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Tables</SelectLabel>
          <SelectItem value="table-oak">Table Oak</SelectItem>
          <SelectItem value="table-marble">Table Marble</SelectItem>
          <SelectItem value="table-glass">Table Glass</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

/**
 * Select désactivé
 */
export const Disabled: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <Select>
        <SelectTrigger disabled className="w-full">
          <SelectValue placeholder="Select désactivé..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option 1</SelectItem>
          <SelectItem value="opt2">Option 2</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger variant="filled" disabled className="w-full">
          <SelectValue placeholder="Filled désactivé..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option 1</SelectItem>
          <SelectItem value="opt2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * Cas d'usage réel - Filtre de catalogue
 */
export const RealWorld: Story = {
  render: () => (
    <div className="border border-slate-200 rounded-lg p-6 w-[500px]">
      <h3 className="font-semibold text-slate-900 mb-4">
        Filtres Catalogue Produits
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Catégorie
          </label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Toutes les catégories..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="fauteuils">Fauteuils</SelectItem>
              <SelectItem value="canapes">Canapés</SelectItem>
              <SelectItem value="tables">Tables</SelectItem>
              <SelectItem value="chaises">Chaises</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Statut Stock
          </label>
          <Select>
            <SelectTrigger variant="filled" state="success" className="w-full">
              <SelectValue placeholder="En stock uniquement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-stock">En stock</SelectItem>
              <SelectItem value="low-stock">Stock faible</SelectItem>
              <SelectItem value="out-of-stock">Rupture</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-sm text-green-600">127 produits en stock</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Fournisseur
          </label>
          <Select>
            <SelectTrigger variant="outlined" className="w-full">
              <SelectValue placeholder="Tous les fournisseurs..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="supplier-1">Atelier Martin</SelectItem>
              <SelectItem value="supplier-2">Maison Dupont</SelectItem>
              <SelectItem value="supplier-3">Nordic Design</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  ),
};
