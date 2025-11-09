import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@verone/ui';

/**
 * # 🎯 RadioGroupUnified - Composant Selection Exclusive Moderne
 *
 * **Transformation CVA 2025** : RadioGroup avec variants visuels, tailles, orientations, et états de validation.
 *
 * ## 📦 Architecture
 *
 * - **Primitives** : Radix UI RadioGroup (@radix-ui/react-radio-group)
 * - **Styling** : CVA (Class Variance Authority) + Tailwind CSS
 * - **Types** : TypeScript strict avec VariantProps
 * - **Icons** : Lucide React Circle (indicator)
 * - **Layout** : Orientations vertical/horizontal avec spacing configurable
 *
 * ## 🎨 Variants Visuels (4)
 *
 * - `default` : Border standard
 * - `filled` : Background slate-100 unchecked, colored bg checked
 * - `outlined` : Border-2 plus prononcée
 * - `minimal` : Border-0, colored bg on checked only
 *
 * ## 📏 Sizes (3)
 *
 * - `sm` : 14px (Circle 8px)
 * - `md` : 16px (Circle 10px) - **défaut**
 * - `lg` : 20px (Circle 12px)
 *
 * ## 🎯 States de Validation (3)
 *
 * - `default` : Bleu (#3b82f6)
 * - `error` : Rouge (#ef4444)
 * - `success` : Vert (#22c55e)
 *
 * ## 📐 Orientations (2)
 *
 * - `vertical` : Layout column (défaut)
 * - `horizontal` : Layout row avec flex-wrap
 *
 * ## 🎛️ Spacing (3)
 *
 * - `sm` : gap-2 (8px)
 * - `md` : gap-4 (16px)
 * - `lg` : gap-6 (24px)
 *
 * ## 🔧 Props Principales
 *
 * ```typescript
 * // RadioGroup container
 * interface RadioGroupProps {
 *   orientation?: 'vertical' | 'horizontal'
 *   spacing?: 'sm' | 'md' | 'lg'
 *   value?: string
 *   defaultValue?: string
 *   onValueChange?: (value: string) => void
 *   disabled?: boolean
 * }
 *
 * // RadioGroupItem
 * interface RadioGroupItemProps {
 *   variant?: 'default' | 'filled' | 'outlined' | 'minimal'
 *   radioSize?: 'sm' | 'md' | 'lg'
 *   state?: 'default' | 'error' | 'success'
 *   error?: boolean  // Auto-set state="error"
 *   value: string
 *   disabled?: boolean
 * }
 * ```
 *
 * ## 🚀 Usage Basique
 *
 * ```tsx
 * // Simple vertical radio group
 * <RadioGroup defaultValue="option1">
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="option1" />
 *     <label>Option 1</label>
 *   </div>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="option2" />
 *     <label>Option 2</label>
 *   </div>
 * </RadioGroup>
 *
 * // Horizontal layout
 * <RadioGroup orientation="horizontal" spacing="md">
 *   {options.map(opt => (
 *     <div key={opt.value}>
 *       <RadioGroupItem value={opt.value} radioSize="lg" />
 *       <label>{opt.label}</label>
 *     </div>
 *   ))}
 * </RadioGroup>
 *
 * // With validation state
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <RadioGroupItem value="yes" state="success" />
 *   <RadioGroupItem value="no" state="error" />
 * </RadioGroup>
 * ```
 *
 * ## 💡 Patterns Réels
 *
 * ### Form Settings
 * ```tsx
 * const [theme, setTheme] = useState('light')
 *
 * <RadioGroup value={theme} onValueChange={setTheme}>
 *   <div className="flex items-center gap-3">
 *     <RadioGroupItem value="light" id="light" />
 *     <label htmlFor="light" className="text-sm font-medium">
 *       Clair
 *     </label>
 *   </div>
 *   <div className="flex items-center gap-3">
 *     <RadioGroupItem value="dark" id="dark" />
 *     <label htmlFor="dark" className="text-sm font-medium">
 *       Sombre
 *     </label>
 *   </div>
 * </RadioGroup>
 * ```
 *
 * ### Cards Layout
 * ```tsx
 * <RadioGroup orientation="horizontal" spacing="md">
 *   {plans.map(plan => (
 *     <div key={plan.id} className="border rounded p-4 cursor-pointer">
 *       <RadioGroupItem value={plan.id} variant="filled" />
 *       <h3>{plan.name}</h3>
 *       <p>{plan.price}</p>
 *     </div>
 *   ))}
 * </RadioGroup>
 * ```
 *
 * ## ♿ Accessibilité
 *
 * - ✅ ARIA role="radiogroup" + role="radio" automatiques (Radix UI)
 * - ✅ Keyboard navigation (Arrow keys, Tab)
 * - ✅ Focus visible avec ring
 * - ✅ Disabled states
 * - ✅ Labels associables via id/htmlFor
 * - ✅ Single selection enforcement (radio group behavior)
 *
 * ## 🎨 Compound Variants
 *
 * Ajustements automatiques pour combinaisons spécifiques:
 *
 * - `filled + default` : bg-blue-50 on checked
 * - `filled + error` : bg-red-50 on checked
 * - `filled + success` : bg-green-50 on checked
 * - `minimal + default` : bg-blue-100 on checked
 * - `minimal + error` : bg-red-100 on checked
 * - `minimal + success` : bg-green-100 on checked
 *
 * ## 📊 Métriques
 *
 * - **Combinaisons** : 4 variants × 3 sizes × 3 states × 2 orientations = 72 variations
 * - **Type-check** : 0 erreurs TypeScript
 * - **File size** : ~157 lignes (component)
 * - **Dependencies** : Radix UI RadioGroup, CVA, Lucide React
 *
 * ## 🔗 Relations
 *
 * - Utilisé dans : Forms, Settings, Wizards, Surveys
 * - Complète : InputUnified, SelectUnified, CheckboxUnified
 * - Alternative : CheckboxGroup (sélection multiple)
 */
const meta = {
  title: '1-UI-Base/RadioGroups/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'RadioGroup moderne avec CVA variants, orientations, et états de validation. Selection exclusive avec Radix UI.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Layout orientation du groupe',
      table: {
        type: { summary: 'vertical | horizontal' },
        defaultValue: { summary: 'vertical' },
      },
    },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Espacement entre items',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'sm' },
      },
    },
    value: {
      control: 'text',
      description: 'Valeur sélectionnée (controlled)',
      table: {
        type: { summary: 'string' },
      },
    },
    defaultValue: {
      control: 'text',
      description: 'Valeur initiale (uncontrolled)',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactiver tout le groupe',
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## 🎯 Default
 *
 * RadioGroup par défaut vertical avec 3 options.
 *
 * Selection exclusive (1 seul choix possible).
 */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('option1');

    return (
      <RadioGroup value={value} onValueChange={setValue}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option1" id="opt1" />
          <label htmlFor="opt1" className="text-sm">
            Option 1
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option2" id="opt2" />
          <label htmlFor="opt2" className="text-sm">
            Option 2
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="option3" id="opt3" />
          <label htmlFor="opt3" className="text-sm">
            Option 3
          </label>
        </div>
      </RadioGroup>
    );
  },
};

/**
 * ## 🎨 All Variants
 *
 * Démo des **4 variants visuels** :
 *
 * 1. **default** : Border standard
 * 2. **filled** : Background slate-100 unchecked
 * 3. **outlined** : Border-2 plus prononcée
 * 4. **minimal** : Border-0, bg on checked only
 *
 * Chaque variant avec 2 options (1 sélectionnée).
 */
export const AllVariants: Story = {
  render: () => {
    const [default1, setDefault1] = useState('opt1');
    const [filled1, setFilled1] = useState('opt1');
    const [outlined1, setOutlined1] = useState('opt1');
    const [minimal1, setMinimal1] = useState('opt1');

    return (
      <div className="flex flex-col gap-8">
        {/* Default Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Default</h3>
            <p className="text-xs text-slate-500">Border standard</p>
          </div>
          <RadioGroup value={default1} onValueChange={setDefault1}>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="default" value="opt1" id="d1" />
              <label htmlFor="d1" className="text-sm">
                Option A
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="default" value="opt2" id="d2" />
              <label htmlFor="d2" className="text-sm">
                Option B
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Filled Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Filled</h3>
            <p className="text-xs text-slate-500">
              Background slate-100 unchecked, colored checked
            </p>
          </div>
          <RadioGroup value={filled1} onValueChange={setFilled1}>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="filled" value="opt1" id="f1" />
              <label htmlFor="f1" className="text-sm">
                Option A
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="filled" value="opt2" id="f2" />
              <label htmlFor="f2" className="text-sm">
                Option B
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Outlined Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Outlined</h3>
            <p className="text-xs text-slate-500">Border-2 plus prononcée</p>
          </div>
          <RadioGroup value={outlined1} onValueChange={setOutlined1}>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="outlined" value="opt1" id="o1" />
              <label htmlFor="o1" className="text-sm">
                Option A
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="outlined" value="opt2" id="o2" />
              <label htmlFor="o2" className="text-sm">
                Option B
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Minimal Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Minimal</h3>
            <p className="text-xs text-slate-500">
              Border-0, colored bg on checked only
            </p>
          </div>
          <RadioGroup value={minimal1} onValueChange={setMinimal1}>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="minimal" value="opt1" id="m1" />
              <label htmlFor="m1" className="text-sm">
                Option A
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem variant="minimal" value="opt2" id="m2" />
              <label htmlFor="m2" className="text-sm">
                Option B
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  },
};

/**
 * ## 📏 Sizes
 *
 * Démo des **3 tailles** disponibles :
 *
 * - **sm** : 14px (Circle 8px)
 * - **md** : 16px (Circle 10px) - défaut
 * - **lg** : 20px (Circle 12px)
 *
 * Icon Circle s'adapte automatiquement.
 */
export const Sizes: Story = {
  render: () => {
    const [sm, setSm] = useState('opt1');
    const [md, setMd] = useState('opt1');
    const [lg, setLg] = useState('opt1');

    return (
      <div className="flex flex-col gap-6">
        {/* Small */}
        <div className="flex items-center gap-4">
          <RadioGroup value={sm} onValueChange={setSm}>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="sm" value="opt1" id="sm1" />
              <label htmlFor="sm1" className="text-xs">
                Small (sm)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="sm" value="opt2" id="sm2" />
              <label htmlFor="sm2" className="text-xs">
                14px, Circle 8px
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Medium */}
        <div className="flex items-center gap-4">
          <RadioGroup value={md} onValueChange={setMd}>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="md" value="opt1" id="md1" />
              <label htmlFor="md1" className="text-sm">
                Medium (md) - Default
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="md" value="opt2" id="md2" />
              <label htmlFor="md2" className="text-sm">
                16px, Circle 10px
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Large */}
        <div className="flex items-center gap-4">
          <RadioGroup value={lg} onValueChange={setLg}>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="lg" value="opt1" id="lg1" />
              <label htmlFor="lg1" className="text-base">
                Large (lg)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem radioSize="lg" value="opt2" id="lg2" />
              <label htmlFor="lg2" className="text-base">
                20px, Circle 12px
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  },
};

/**
 * ## 🎯 States
 *
 * Démo des **3 états de validation** :
 *
 * - **default** : Bleu (#3b82f6)
 * - **error** : Rouge (#ef4444)
 * - **success** : Vert (#22c55e)
 *
 * États visuels pour feedback validation.
 */
export const States: Story = {
  render: () => {
    const [defaultState, setDefaultState] = useState('opt1');
    const [errorState, setErrorState] = useState('opt1');
    const [successState, setSuccessState] = useState('opt1');

    return (
      <div className="flex flex-col gap-6">
        {/* Default State */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Default (blue)</h3>
          <RadioGroup value={defaultState} onValueChange={setDefaultState}>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="default" value="opt1" id="ds1" />
              <label htmlFor="ds1" className="text-sm">
                Option normale
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="default" value="opt2" id="ds2" />
              <label htmlFor="ds2" className="text-sm">
                Autre option
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Error State */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Error (red)</h3>
          <RadioGroup value={errorState} onValueChange={setErrorState}>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="error" value="opt1" id="es1" />
              <label htmlFor="es1" className="text-sm">
                Option avec erreur
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="error" value="opt2" id="es2" />
              <label htmlFor="es2" className="text-sm">
                Validation échouée
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Success State */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Success (green)</h3>
          <RadioGroup value={successState} onValueChange={setSuccessState}>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="success" value="opt1" id="ss1" />
              <label htmlFor="ss1" className="text-sm">
                Option validée
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem state="success" value="opt2" id="ss2" />
              <label htmlFor="ss2" className="text-sm">
                Succès confirmation
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  },
};

/**
 * ## 📐 Orientations
 *
 * Démo des **2 orientations** :
 *
 * - **vertical** : Layout column (défaut) - flex-col
 * - **horizontal** : Layout row avec wrap - flex-row flex-wrap
 *
 * Spacing ajustable (sm/md/lg).
 */
export const Orientations: Story = {
  render: () => {
    const [vertical, setVertical] = useState('opt1');
    const [horizontal, setHorizontal] = useState('opt1');

    return (
      <div className="flex flex-col gap-8">
        {/* Vertical */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Vertical (default)</h3>
          <RadioGroup
            orientation="vertical"
            spacing="sm"
            value={vertical}
            onValueChange={setVertical}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt1" id="v1" />
              <label htmlFor="v1" className="text-sm">
                Option 1
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt2" id="v2" />
              <label htmlFor="v2" className="text-sm">
                Option 2
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt3" id="v3" />
              <label htmlFor="v3" className="text-sm">
                Option 3
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Horizontal */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Horizontal</h3>
          <RadioGroup
            orientation="horizontal"
            spacing="md"
            value={horizontal}
            onValueChange={setHorizontal}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt1" id="h1" />
              <label htmlFor="h1" className="text-sm">
                Option 1
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt2" id="h2" />
              <label htmlFor="h2" className="text-sm">
                Option 2
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt3" id="h3" />
              <label htmlFor="h3" className="text-sm">
                Option 3
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  },
};

/**
 * ## 🚫 Disabled
 *
 * États disabled pour items individuels ou groupe entier.
 *
 * **Styles automatiques** :
 * - `opacity-50`
 * - `cursor-not-allowed`
 * - Pas de hover/focus effects
 */
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('opt1');

    return (
      <div className="flex flex-col gap-8">
        {/* Individual Item Disabled */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Item Disabled</h3>
          <RadioGroup value={value} onValueChange={setValue}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt1" id="id1" />
              <label htmlFor="id1" className="text-sm">
                Option activée
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt2" id="id2" disabled />
              <label htmlFor="id2" className="text-sm text-slate-400">
                Option désactivée
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt3" id="id3" />
              <label htmlFor="id3" className="text-sm">
                Autre option
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Entire Group Disabled */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Groupe Disabled</h3>
          <RadioGroup defaultValue="opt1" disabled>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt1" id="gd1" />
              <label htmlFor="gd1" className="text-sm text-slate-400">
                Option 1
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt2" id="gd2" />
              <label htmlFor="gd2" className="text-sm text-slate-400">
                Option 2
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="opt3" id="gd3" />
              <label htmlFor="gd3" className="text-sm text-slate-400">
                Option 3
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  },
};

/**
 * ## 🌍 Real World - Settings Form
 *
 * Exemple réaliste : Formulaire préférences utilisateur avec RadioGroups.
 *
 * **Features** :
 * - Catégories settings (Thème, Langue, Notifications)
 * - Labels + descriptions détaillées
 * - Mix variants (default, filled, outlined)
 * - Mix orientations (vertical, horizontal)
 * - États validation contextuals
 *
 * **Pattern production-ready** utilisable directement.
 */
export const RealWorldSettings: Story = {
  render: () => {
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('fr');
    const [notifications, setNotifications] = useState('all');
    const [privacy, setPrivacy] = useState('friends');

    return (
      <div className="w-[500px] space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">Préférences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Personnalisez votre expérience avec ces options
          </p>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Apparence</h3>

          <div>
            <label className="mb-2 block text-sm font-medium">Thème</label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-start gap-3">
                <RadioGroupItem variant="filled" value="light" id="light" />
                <div className="flex-1">
                  <label
                    htmlFor="light"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Clair
                  </label>
                  <p className="text-xs text-slate-500">
                    Interface claire pour environnements lumineux
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem variant="filled" value="dark" id="dark" />
                <div className="flex-1">
                  <label
                    htmlFor="dark"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Sombre
                  </label>
                  <p className="text-xs text-slate-500">
                    Réduit la fatigue oculaire dans l'obscurité
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem variant="filled" value="auto" id="auto" />
                <div className="flex-1">
                  <label
                    htmlFor="auto"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Automatique
                  </label>
                  <p className="text-xs text-slate-500">
                    S'adapte à l'heure de la journée
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Language Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Langue</h3>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Langue d'affichage
            </label>
            <RadioGroup
              orientation="horizontal"
              spacing="md"
              value={language}
              onValueChange={setLanguage}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem variant="outlined" value="fr" id="fr" />
                <label htmlFor="fr" className="cursor-pointer text-sm">
                  Français
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem variant="outlined" value="en" id="en" />
                <label htmlFor="en" className="cursor-pointer text-sm">
                  English
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem variant="outlined" value="es" id="es" />
                <label htmlFor="es" className="cursor-pointer text-sm">
                  Español
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Notifications
          </h3>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Fréquence des notifications
            </label>
            <RadioGroup value={notifications} onValueChange={setNotifications}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="all" id="all" radioSize="lg" />
                <label htmlFor="all" className="cursor-pointer text-sm">
                  Toutes les notifications
                </label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value="important"
                  id="important"
                  radioSize="lg"
                />
                <label htmlFor="important" className="cursor-pointer text-sm">
                  Importantes uniquement
                </label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="none" id="none" radioSize="lg" />
                <label htmlFor="none" className="cursor-pointer text-sm">
                  Aucune notification
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Privacy Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Confidentialité
          </h3>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Visibilité du profil
            </label>
            <RadioGroup value={privacy} onValueChange={setPrivacy}>
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  variant="minimal"
                  value="public"
                  id="public"
                  state="error"
                />
                <div className="flex-1">
                  <label
                    htmlFor="public"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Public
                  </label>
                  <p className="text-xs text-slate-500">
                    Visible par tous les utilisateurs
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  variant="minimal"
                  value="friends"
                  id="friends"
                  state="success"
                />
                <div className="flex-1">
                  <label
                    htmlFor="friends"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Amis uniquement (recommandé)
                  </label>
                  <p className="text-xs text-slate-500">
                    Visible seulement par vos connexions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  variant="minimal"
                  value="private"
                  id="private"
                />
                <div className="flex-1">
                  <label
                    htmlFor="private"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Privé
                  </label>
                  <p className="text-xs text-slate-500">
                    Profil complètement masqué
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    );
  },
};
