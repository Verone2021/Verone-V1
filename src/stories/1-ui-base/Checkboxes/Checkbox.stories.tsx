import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs';

import { Checkbox } from '@verone/ui';

/**
 * ☑️ **Checkbox** - Case à cocher avec variants CVA, validation states, et Radix UI
 *
 * **Variants Visuels** (CVA) :
 * - `default` : Border classique
 * - `filled` : Background gris quand unchecked
 * - `outlined` : Border prononcée (2px)
 * - `minimal` : Sans border, juste background coloré
 *
 * **États de Validation** :
 * - `default` : Couleur bleue (blue-600)
 * - `error` : Couleur rouge (red-600)
 * - `success` : Couleur verte (green-600)
 *
 * **Tailles** :
 * - `sm` : 14px (check icon 10px)
 * - `md` : 16px (check icon 14px) - **Default**
 * - `lg` : 20px (check icon 16px)
 *
 * **States Radix UI** :
 * - `unchecked` : Border visible, background transparent
 * - `checked` : Background coloré, check icon visible
 * - `indeterminate` : Ligne horizontale (mixed state)
 *
 * ## Architecture CVA
 *
 * ```typescript
 * const checkboxVariants = cva(
 *   'peer shrink-0 rounded ring-offset-white focus-visible:outline-none...',
 *   {
 *     variants: {
 *       variant: { default, filled, outlined, minimal },
 *       checkboxSize: { sm, md, lg },
 *       state: { default, error, success }
 *     },
 *     compoundVariants: [
 *       { variant: 'filled', state: 'default', className: '...' },
 *       { variant: 'minimal', state: 'default', className: 'data-[state=checked]:bg-blue-600' }
 *     ]
 *   }
 * );
 * ```
 *
 * ## Exemples Utilisation
 *
 * ```tsx
 * // Basic
 * <Checkbox id="accept-terms" />
 * <label htmlFor="accept-terms">Accept terms and conditions</label>
 *
 * // With validation error
 * <Checkbox error id="required-field" />
 * <label htmlFor="required-field" className="text-red-600">This field is required</label>
 *
 * // Variant filled avec success state
 * <Checkbox variant="filled" state="success" checked />
 * <label>Email verified</label>
 *
 * // Different sizes
 * <Checkbox checkboxSize="sm" /> Small
 * <Checkbox checkboxSize="lg" /> Large
 * ```
 */
const meta = {
  title: '1-UI-Base/Checkboxes/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
☑️ **Checkbox** - Case à cocher avec variants CVA et validation states.

**Variants Visuels** (CVA) :
- \`default\` : Border classique
- \`filled\` : Background gris unchecked
- \`outlined\` : Border prononcée
- \`minimal\` : Sans border

**États de Validation** :
- \`default\` : Bleu
- \`error\` : Rouge
- \`success\` : Vert

**Tailles** :
- \`sm\` : 14px
- \`md\` : 16px - **Default**
- \`lg\` : 20px

**States Radix** :
- Unchecked / Checked / Indeterminate
- Focus ring automatique
- Disabled support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'minimal'],
      description: 'Variant visuel CVA',
    },
    checkboxSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du checkbox',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'État de validation',
    },
    error: {
      control: 'boolean',
      description: 'Auto-set state="error"',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state (controlled)',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## Default
 *
 * Checkbox par défaut : variant `default`, taille `md`, état `default`
 *
 * **Caractéristiques** :
 * - Border grise (slate-300)
 * - Focus : ring bleu
 * - Checked : background + border bleue (blue-600)
 * - Check icon : lucide-react Check (14px)
 */
export const Default: Story = {
  args: {},
};

/**
 * ## All Variants
 *
 * Démo des **4 variants visuels** disponibles
 *
 * **Variants** :
 * 1. `default` : Border classique + background transparent unchecked
 * 2. `filled` : Background gris (slate-100) unchecked → coloré checked
 * 3. `outlined` : Border prononcée (2px)
 * 4. `minimal` : Pas de border, background coloré direct
 *
 * **Interactions** :
 * - Tous ont focus ring automatique
 * - Transition smooth 200ms
 * - Check icon responsive à la taille
 */
export const AllVariants: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(false);
    const [checked4, setChecked4] = useState(false);

    return (
      <div className="space-y-6 w-[400px]">
        <div className="flex items-center gap-3">
          <Checkbox
            id="variant-default"
            variant="default"
            checked={checked1}
            onCheckedChange={c => setChecked1(c === true)}
          />
          <label
            htmlFor="variant-default"
            className="text-sm font-medium cursor-pointer"
          >
            Default (Border classique)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="variant-filled"
            variant="filled"
            checked={checked2}
            onCheckedChange={c => setChecked2(c === true)}
          />
          <label
            htmlFor="variant-filled"
            className="text-sm font-medium cursor-pointer"
          >
            Filled (Background gris unchecked)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="variant-outlined"
            variant="outlined"
            checked={checked3}
            onCheckedChange={c => setChecked3(c === true)}
          />
          <label
            htmlFor="variant-outlined"
            className="text-sm font-medium cursor-pointer"
          >
            Outlined (Border prononcée 2px)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="variant-minimal"
            variant="minimal"
            checked={checked4}
            onCheckedChange={c => setChecked4(c === true)}
          />
          <label
            htmlFor="variant-minimal"
            className="text-sm font-medium cursor-pointer"
          >
            Minimal (Sans border)
          </label>
        </div>
      </div>
    );
  },
};

/**
 * ## Sizes
 *
 * Démo des **3 tailles** disponibles
 *
 * **Tailles** :
 * - `sm` : 14×14px (check icon 10px)
 * - `md` : 16×16px (check icon 14px) - **Default**
 * - `lg` : 20×20px (check icon 16px)
 *
 * **Icon Sizing** :
 * - Icon size s'adapte automatiquement à la taille du checkbox
 * - Mapping: sm→2.5, md→3.5, lg→4 (Tailwind classes)
 */
export const Sizes: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(true);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(true);

    return (
      <div className="space-y-6 w-[400px]">
        <div className="flex items-center gap-3">
          <Checkbox
            id="size-sm"
            checkboxSize="sm"
            checked={checked1}
            onCheckedChange={c => setChecked1(c === true)}
          />
          <label
            htmlFor="size-sm"
            className="text-sm font-medium cursor-pointer"
          >
            Small (14px)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="size-md"
            checkboxSize="md"
            checked={checked2}
            onCheckedChange={c => setChecked2(c === true)}
          />
          <label
            htmlFor="size-md"
            className="text-sm font-medium cursor-pointer"
          >
            Medium (16px) - Default
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="size-lg"
            checkboxSize="lg"
            checked={checked3}
            onCheckedChange={c => setChecked3(c === true)}
          />
          <label
            htmlFor="size-lg"
            className="text-sm font-medium cursor-pointer"
          >
            Large (20px)
          </label>
        </div>
      </div>
    );
  },
};

/**
 * ## States
 *
 * Démo des **3 états de validation**
 *
 * **États** :
 * - `default` : Couleur bleue (blue-600)
 * - `error` : Couleur rouge (red-600)
 * - `success` : Couleur verte (green-600)
 *
 * **Comportement** :
 * - Border + background + focus ring matchent la couleur
 * - Prop `error` force automatiquement `state="error"`
 */
export const States: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(true);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(true);

    return (
      <div className="space-y-6 w-[400px]">
        <div className="flex items-center gap-3">
          <Checkbox
            id="state-default"
            state="default"
            checked={checked1}
            onCheckedChange={c => setChecked1(c === true)}
          />
          <label
            htmlFor="state-default"
            className="text-sm font-medium cursor-pointer"
          >
            Default State (Blue)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="state-error"
            state="error"
            checked={checked2}
            onCheckedChange={c => setChecked2(c === true)}
          />
          <label
            htmlFor="state-error"
            className="text-sm font-medium cursor-pointer text-red-600"
          >
            Error State (Red)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="state-success"
            state="success"
            checked={checked3}
            onCheckedChange={c => setChecked3(c === true)}
          />
          <label
            htmlFor="state-success"
            className="text-sm font-medium cursor-pointer text-green-600"
          >
            Success State (Green)
          </label>
        </div>
      </div>
    );
  },
};

/**
 * ## Variants With States
 *
 * Matrice **4 variants × 3 états = 12 combinaisons**
 *
 * **Compound Variants** :
 * - `filled` + states : Background gris → couleur validée
 * - `minimal` + states : Pas de border, juste background coloré
 *
 * **Use Cases** :
 * - Forms validation multi-critères
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
          <div className="flex items-center gap-2">
            <Checkbox variant="default" state="default" checked />
            <span className="text-sm">Default</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="default" state="error" checked />
            <span className="text-sm text-red-600">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="default" state="success" checked />
            <span className="text-sm text-green-600">Success</span>
          </div>
        </div>
      </div>

      {/* Filled Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Filled Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Checkbox variant="filled" state="default" checked />
            <span className="text-sm">Default</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="filled" state="error" checked />
            <span className="text-sm text-red-600">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="filled" state="success" checked />
            <span className="text-sm text-green-600">Success</span>
          </div>
        </div>
      </div>

      {/* Outlined Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Outlined Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Checkbox variant="outlined" state="default" checked />
            <span className="text-sm">Default</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="outlined" state="error" checked />
            <span className="text-sm text-red-600">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="outlined" state="success" checked />
            <span className="text-sm text-green-600">Success</span>
          </div>
        </div>
      </div>

      {/* Minimal Variant */}
      <div>
        <h3 className="font-semibold mb-4 text-slate-900">Minimal Variant</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Checkbox variant="minimal" state="default" checked />
            <span className="text-sm">Default</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="minimal" state="error" checked />
            <span className="text-sm text-red-600">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox variant="minimal" state="success" checked />
            <span className="text-sm text-green-600">Success</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * ## With Labels & Descriptions
 *
 * Démo **checkbox + label + description** (pattern form)
 *
 * **Best Practices** :
 * - Label : font-medium, cursor-pointer
 * - Description : text-sm, text-slate-500
 * - htmlFor connecte label au checkbox (accessibility)
 */
export const WithLabels: Story = {
  render: () => {
    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(true);
    const [checked3, setChecked3] = useState(false);

    return (
      <div className="space-y-6 w-[500px]">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={checked1}
            onCheckedChange={c => setChecked1(c === true)}
          />
          <div className="flex-1">
            <label
              htmlFor="terms"
              className="text-sm font-medium cursor-pointer block"
            >
              Accept terms and conditions
            </label>
            <p className="text-sm text-slate-500 mt-1">
              You agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="newsletter"
            variant="filled"
            state="success"
            checked={checked2}
            onCheckedChange={c => setChecked2(c === true)}
          />
          <div className="flex-1">
            <label
              htmlFor="newsletter"
              className="text-sm font-medium cursor-pointer block"
            >
              Subscribe to newsletter
            </label>
            <p className="text-sm text-slate-500 mt-1">
              Get weekly updates about new products and special offers.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="required-field"
            error
            checked={checked3}
            onCheckedChange={c => setChecked3(c === true)}
          />
          <div className="flex-1">
            <label
              htmlFor="required-field"
              className="text-sm font-medium cursor-pointer block text-red-600"
            >
              I confirm this information is correct *
            </label>
            <p className="text-sm text-red-500 mt-1">
              This field is required to proceed.
            </p>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## Disabled State
 *
 * Checkbox désactivé (non-interactif)
 *
 * **Styles** :
 * - Cursor : not-allowed
 * - Opacity : 50%
 * - Cohérent tous variants/tailles
 */
export const Disabled: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="flex items-center gap-3">
        <Checkbox id="disabled-unchecked" disabled />
        <label
          htmlFor="disabled-unchecked"
          className="text-sm font-medium text-slate-400"
        >
          Disabled Unchecked
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="disabled-checked" disabled checked />
        <label
          htmlFor="disabled-checked"
          className="text-sm font-medium text-slate-400"
        >
          Disabled Checked
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="disabled-filled" variant="filled" disabled checked />
        <label
          htmlFor="disabled-filled"
          className="text-sm font-medium text-slate-400"
        >
          Disabled Filled Variant
        </label>
      </div>
    </div>
  ),
};

/**
 * ## Real World - Permissions Form
 *
 * Exemple réaliste : **Formulaire permissions utilisateur**
 *
 * **Features combinées** :
 * - Groupes de checkboxes thématiques
 * - Validation states (error si aucune sélectionnée)
 * - Variants visuels par priorité
 * - Labels + descriptions
 *
 * **Workflow** :
 * 1. User doit sélectionner au moins 1 permission
 * 2. Permissions critiques : variant outlined + error si non checked
 * 3. Permissions optionnelles : variant default
 */
export const RealWorldPermissions: Story = {
  render: () => {
    const [canRead, setCanRead] = useState(true);
    const [canWrite, setCanWrite] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [canAdmin, setCanAdmin] = useState(false);

    const hasMinimumPermissions = canRead || canWrite;
    const isValid = hasMinimumPermissions;

    return (
      <div className="w-[600px] p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">User Permissions</h3>

        <div className="space-y-4">
          {/* Basic Permissions */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Basic Permissions
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="perm-read"
                  variant="outlined"
                  state={!hasMinimumPermissions ? 'error' : 'success'}
                  checked={canRead}
                  onCheckedChange={c => setCanRead(c === true)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="perm-read"
                    className="text-sm font-medium cursor-pointer block"
                  >
                    Read Access
                  </label>
                  <p className="text-sm text-slate-500 mt-1">
                    View documents and data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="perm-write"
                  variant="outlined"
                  state={!hasMinimumPermissions ? 'error' : 'default'}
                  checked={canWrite}
                  onCheckedChange={c => setCanWrite(c === true)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="perm-write"
                    className="text-sm font-medium cursor-pointer block"
                  >
                    Write Access
                  </label>
                  <p className="text-sm text-slate-500 mt-1">
                    Create and edit documents
                  </p>
                </div>
              </div>
            </div>

            {!hasMinimumPermissions && (
              <p className="text-sm text-red-600 mt-3">
                ⚠️ At least one basic permission is required
              </p>
            )}
          </div>

          {/* Advanced Permissions */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Advanced Permissions
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="perm-delete"
                  variant="default"
                  checked={canDelete}
                  onCheckedChange={c => setCanDelete(c === true)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="perm-delete"
                    className="text-sm font-medium cursor-pointer block"
                  >
                    Delete Access
                  </label>
                  <p className="text-sm text-slate-500 mt-1">
                    Remove documents (requires approval)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="perm-admin"
                  variant="default"
                  state="error"
                  checked={canAdmin}
                  onCheckedChange={c => setCanAdmin(c === true)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="perm-admin"
                    className="text-sm font-medium cursor-pointer block text-red-600"
                  >
                    Admin Access (Dangerous)
                  </label>
                  <p className="text-sm text-red-500 mt-1">
                    Full system access - Use with caution
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium">Status:</span>{' '}
            {!hasMinimumPermissions ? (
              <span className="text-red-600">✗ Invalid Configuration</span>
            ) : (
              <span className="text-green-600">✓ Valid Configuration</span>
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
            Save Permissions
          </button>
        </div>
      </div>
    );
  },
};
