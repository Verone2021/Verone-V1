import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs';

import { Textarea } from '@verone/ui';

/**
 * 📋 **Textarea** - Zone de texte multi-lignes avec variants CVA, auto-resize, et compteur
 *
 * **Variants Visuels** (CVA) :
 * - `default` : Border arrondie classique
 * - `filled` : Background gris
 * - `outlined` : Border prononcée (2px)
 * - `underlined` : Border-bottom seulement
 *
 * **États de Validation** :
 * - `default` : État normal (bordure grise)
 * - `error` : Bordure rouge (validation échouée)
 * - `success` : Bordure verte (validation réussie)
 *
 * **Tailles** :
 * - `sm` : 60px minimum (padding 12px, text-sm)
 * - `md` : 80px minimum (padding 16px, text-sm) - **Default**
 * - `lg` : 100px minimum (padding 16px, text-base)
 *
 * **Features Avancées** :
 * - `autoResize` : Ajuste automatiquement la hauteur au contenu
 * - `showCount` : Affiche compteur caractères (orange à 90%)
 * - `minRows` / `maxRows` : Contrôle taille avec auto-resize
 * - `error` / `helperText` : Messages validation/aide
 *
 * ## Architecture CVA
 *
 * ```typescript
 * const textareaVariants = cva(
 *   'flex w-full transition-all duration-200 placeholder:text-slate-400...',
 *   {
 *     variants: {
 *       variant: { default, filled, outlined, underlined },
 *       textareaSize: { sm, md, lg },
 *       state: { default, error, success }
 *     },
 *     compoundVariants: [
 *       { variant: 'filled', state: 'default', className: '...' },
 *       { variant: 'underlined', textareaSize: 'sm', className: 'min-h-[56px]' },
 *       // ... adjustments hauteur pour underlined
 *     ]
 *   }
 * );
 * ```
 *
 * ## Exemples Utilisation
 *
 * ```tsx
 * // Basic
 * <Textarea placeholder="Enter description..." />
 *
 * // Auto-resize avec limites
 * <Textarea autoResize minRows={3} maxRows={8} />
 *
 * // Avec compteur caractères
 * <Textarea showCount maxLength={500} />
 *
 * // Validation error
 * <Textarea error="Description requise (min 20 caractères)" />
 *
 * // Variant filled avec success state
 * <Textarea variant="filled" state="success" helperText="Description validée" />
 * ```
 */
const meta = {
  title: '1-UI-Base/Textareas/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
📋 **Textarea** - Zone de texte multi-lignes avec variants CVA dynamiques.

**Variants Visuels** (CVA) :
- \`default\` : Border arrondie classique
- \`filled\` : Background gris
- \`outlined\` : Border prononcée
- \`underlined\` : Border-bottom seulement

**États de Validation** :
- \`default\` : État normal
- \`error\` : Bordure rouge
- \`success\` : Bordure verte

**Tailles** :
- \`sm\` : 60px min
- \`md\` : 80px min - **Default**
- \`lg\` : 100px min

**Features** :
- Auto-resize intelligent (minRows/maxRows)
- Compteur caractères avec warning 90%
- Messages error/helper
- Controlled/Uncontrolled
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'underlined'],
      description: 'Variant visuel CVA',
    },
    textareaSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du textarea',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'État de validation',
    },
    autoResize: {
      control: 'boolean',
      description: 'Active auto-resize basé contenu',
    },
    showCount: {
      control: 'boolean',
      description: 'Affiche compteur caractères',
    },
    minRows: {
      control: 'number',
      description: 'Lignes minimum (auto-resize)',
    },
    maxRows: {
      control: 'number',
      description: 'Lignes maximum (auto-resize)',
    },
    error: {
      control: 'text',
      description: 'Message erreur (auto state="error")',
    },
    helperText: {
      control: 'text',
      description: "Message d'aide",
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Default
 *
 * Textarea par défaut : variant `default`, taille `md`, état `default`
 *
 * **Caractéristiques** :
 * - Border arrondie grise (slate-300)
 * - Focus : border bleue + ring bleu/20
 * - Placeholder : text-slate-400
 * - Hauteur min : 80px
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter your description...',
  },
};

/**
 * ## All Variants
 *
 * Démo des **4 variants visuels** disponibles
 *
 * **Variants** :
 * 1. `default` : Border classique arrondie
 * 2. `filled` : Background gris (slate-100)
 * 3. `outlined` : Border prononcée (2px)
 * 4. `underlined` : Border-bottom seulement
 *
 * **Interactions** :
 * - `filled` : Background transparent au focus
 * - `underlined` : Pas de ring focus (focus:ring-0)
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Default (Border classique)
        </h4>
        <Textarea variant="default" placeholder="Enter description..." />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Filled (Background gris)
        </h4>
        <Textarea variant="filled" placeholder="Enter description..." />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Outlined (Border prononcée)
        </h4>
        <Textarea variant="outlined" placeholder="Enter description..." />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Underlined (Border-bottom seulement)
        </h4>
        <Textarea variant="underlined" placeholder="Enter description..." />
      </div>
    </div>
  ),
};

/**
 * ## Sizes
 *
 * Démo des **3 tailles** disponibles
 *
 * **Tailles** :
 * - `sm` : 60px min (12px padding, text-sm)
 * - `md` : 80px min (16px padding, text-sm) - **Default**
 * - `lg` : 100px min (16px padding, text-base)
 *
 * **Underlined Adjustments** :
 * - Compound variants ajustent hauteur pour underlined
 * - Maintient alignement visuel cohérent
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Small (60px min)
        </h4>
        <Textarea textareaSize="sm" placeholder="Small textarea..." />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Medium (80px min) - Default
        </h4>
        <Textarea textareaSize="md" placeholder="Medium textarea..." />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Large (100px min)
        </h4>
        <Textarea textareaSize="lg" placeholder="Large textarea..." />
      </div>
    </div>
  ),
};

/**
 * ## States
 *
 * Démo des **3 états de validation**
 *
 * **États** :
 * - `default` : Border grise (slate-300)
 * - `error` : Border rouge (red-500) + ring rouge/20
 * - `success` : Border verte (green-500) + ring vert/20
 *
 * **Auto-state** :
 * - Prop `error` force automatiquement `state="error"`
 * - Messages error/helper affichés sous le textarea
 */
export const States: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Default State
        </h4>
        <Textarea
          state="default"
          placeholder="Normal state..."
          helperText="Optional helper text"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">Error State</h4>
        <Textarea
          state="error"
          placeholder="Error state..."
          error="Description is required (minimum 20 characters)"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Success State
        </h4>
        <Textarea
          state="success"
          placeholder="Success state..."
          helperText="Description validated successfully"
        />
      </div>
    </div>
  ),
};

/**
 * ## Variants With States
 *
 * Matrice **4 variants × 3 états = 12 combinaisons**
 *
 * **Compound Variants** :
 * - `filled` + `default` : Border slate-200 (plus subtile)
 * - `underlined` : Pas de ring focus (minimaliste)
 *
 * **Use Cases** :
 * - Form validation multi-étapes
 * - Feedback visuel immédiat
 * - Thèmes visuels différents par section
 */
export const VariantsWithStates: Story = {
  render: () => (
    <div className="space-y-8 w-[700px]">
      {/* Default Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Default Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-2">State: default</p>
            <Textarea
              variant="default"
              state="default"
              placeholder="Default..."
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: error</p>
            <Textarea
              variant="default"
              state="error"
              placeholder="Error..."
              error="Required"
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: success</p>
            <Textarea
              variant="default"
              state="success"
              placeholder="Success..."
            />
          </div>
        </div>
      </div>

      {/* Filled Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Filled Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-2">State: default</p>
            <Textarea
              variant="filled"
              state="default"
              placeholder="Default..."
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: error</p>
            <Textarea
              variant="filled"
              state="error"
              placeholder="Error..."
              error="Required"
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: success</p>
            <Textarea
              variant="filled"
              state="success"
              placeholder="Success..."
            />
          </div>
        </div>
      </div>

      {/* Outlined Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Outlined Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-2">State: default</p>
            <Textarea
              variant="outlined"
              state="default"
              placeholder="Default..."
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: error</p>
            <Textarea
              variant="outlined"
              state="error"
              placeholder="Error..."
              error="Required"
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: success</p>
            <Textarea
              variant="outlined"
              state="success"
              placeholder="Success..."
            />
          </div>
        </div>
      </div>

      {/* Underlined Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">
          Underlined Variant
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-2">State: default</p>
            <Textarea
              variant="underlined"
              state="default"
              placeholder="Default..."
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: error</p>
            <Textarea
              variant="underlined"
              state="error"
              placeholder="Error..."
              error="Required"
            />
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-2">State: success</p>
            <Textarea
              variant="underlined"
              state="success"
              placeholder="Success..."
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * ## Auto Resize
 *
 * Démo **auto-resize intelligent** avec contrôle min/max
 *
 * **Features** :
 * - Ajuste hauteur automatiquement au contenu
 * - `minRows` : Hauteur minimum (default: 3 lignes)
 * - `maxRows` : Hauteur maximum (default: 10 lignes)
 * - Scroll automatique si maxRows atteint
 *
 * **Use Cases** :
 * - Formulaires adaptatifs
 * - UX optimisée (pas de scroll inutile)
 * - Espace vertical optimisé
 */
export const WithAutoResize: Story = {
  render: () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState('');

    return (
      <div className="space-y-6 w-[500px]">
        <div>
          <h4 className="font-medium mb-2 text-sm text-slate-700">
            Auto-resize (3-10 lignes) - Default
          </h4>
          <Textarea
            autoResize
            minRows={3}
            maxRows={10}
            placeholder="Type multiple lines... (auto-resize 3-10 lignes)"
            value={value1}
            onChange={e => setValue1(e.target.value)}
            helperText={`${value1.split('\n').length} ligne(s)`}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2 text-sm text-slate-700">
            Auto-resize compact (2-5 lignes)
          </h4>
          <Textarea
            autoResize
            minRows={2}
            maxRows={5}
            placeholder="Type multiple lines... (auto-resize 2-5 lignes)"
            value={value2}
            onChange={e => setValue2(e.target.value)}
            helperText={`${value2.split('\n').length} ligne(s) - Max 5 lignes`}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2 text-sm text-slate-700">
            Auto-resize large (4-15 lignes)
          </h4>
          <Textarea
            autoResize
            minRows={4}
            maxRows={15}
            placeholder="Type multiple lines... (auto-resize 4-15 lignes)"
            value={value3}
            onChange={e => setValue3(e.target.value)}
            helperText={`${value3.split('\n').length} ligne(s) - Max 15 lignes`}
          />
        </div>
      </div>
    );
  },
};

/**
 * ## Character Count
 *
 * Démo **compteur caractères** avec warning automatique
 *
 * **Features** :
 * - `showCount` : Affiche compteur X / maxLength
 * - Warning orange automatique à 90% (450/500)
 * - Couleur normale : text-slate-500
 * - Couleur warning : text-orange-600
 *
 * **UX** :
 * - Feedback visuel immédiat
 * - Prévient dépassement limite
 * - Tabular nums pour alignement
 */
export const WithCharacterCount: Story = {
  render: () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('A'.repeat(460)); // 92% (orange warning)

    return (
      <div className="space-y-6 w-[500px]">
        <div>
          <h4 className="font-medium mb-2 text-sm text-slate-700">
            Compteur normal (&lt;90%)
          </h4>
          <Textarea
            showCount
            maxLength={500}
            placeholder="Type to see character count..."
            value={value1}
            onChange={e => setValue1(e.target.value)}
            helperText="Character count displayed at bottom-right"
          />
        </div>

        <div>
          <h4 className="font-medium mb-2 text-sm text-slate-700">
            Warning orange (&gt;90%)
          </h4>
          <Textarea
            showCount
            maxLength={500}
            placeholder="Type to see character count..."
            value={value2}
            onChange={e => setValue2(e.target.value)}
            helperText="Counter turns orange at 90% (450/500 characters)"
          />
        </div>
      </div>
    );
  },
};

/**
 * ## Disabled State
 *
 * Textarea désactivé (non-interactif)
 *
 * **Styles** :
 * - Cursor : not-allowed
 * - Opacity : 50%
 * - Background : slate-50
 * - Cohérent tous variants/tailles
 */
export const Disabled: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Default Disabled
        </h4>
        <Textarea
          variant="default"
          disabled
          value="This textarea is disabled"
        />
      </div>

      <div>
        <h4 className="font-medium mb-2 text-sm text-slate-700">
          Filled Disabled
        </h4>
        <Textarea variant="filled" disabled value="This textarea is disabled" />
      </div>
    </div>
  ),
};

/**
 * ## Real World - Product Description Form
 *
 * Exemple réaliste : **Formulaire description produit e-commerce**
 *
 * **Features combinées** :
 * - Auto-resize (2-8 lignes)
 * - Compteur caractères (500 max)
 * - Validation error/success
 * - Helper text contextuel
 *
 * **Workflow** :
 * 1. Vide : Error (min 20 caractères)
 * 2. <20 chars : Error persiste
 * 3. ≥20 chars : Success state + feedback
 */
export const RealWorldProductDescription: Story = {
  render: () => {
    const [description, setDescription] = useState('');

    const isValid = description.length >= 20;
    const isEmpty = description.length === 0;

    return (
      <div className="w-[600px] p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Product Description</h3>

        <Textarea
          variant="filled"
          state={isEmpty ? 'default' : isValid ? 'success' : 'error'}
          autoResize
          minRows={2}
          maxRows={8}
          showCount
          maxLength={500}
          placeholder="Describe your product... (minimum 20 characters)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          error={
            !isEmpty && !isValid
              ? 'Description must be at least 20 characters'
              : undefined
          }
          helperText={
            isValid
              ? 'Great! Your description is detailed enough.'
              : 'Provide a clear and detailed description to help customers.'
          }
        />

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Status:</span>{' '}
            {isEmpty ? (
              <span className="text-slate-500">Empty</span>
            ) : isValid ? (
              <span className="text-green-600">✓ Valid</span>
            ) : (
              <span className="text-red-600">✗ Too short</span>
            )}
          </div>
          <button
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Save Description
          </button>
        </div>
      </div>
    );
  },
};
