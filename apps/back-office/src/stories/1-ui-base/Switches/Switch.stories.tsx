import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Switch } from '@verone/ui';

/**
 * # 🎨 SwitchUnified - Composant Toggle Moderne
 *
 * **Transformation CVA 2025** : Switch/Toggle avec variants visuels, tailles, et états de validation.
 *
 * ## 📦 Architecture
 *
 * - **Primitives** : Radix UI Switch (@radix-ui/react-switch)
 * - **Styling** : CVA (Class Variance Authority) + Tailwind CSS
 * - **Types** : TypeScript strict avec VariantProps
 * - **Animations** : Transitions smooth (transform translate-x)
 * - **States** : checked/unchecked avec data attributes
 *
 * ## 🎨 Variants Visuels (3)
 *
 * - `default` : Style standard avec bg colors on/off
 * - `minimal` : Fond blanc unchecked, colored border checked
 * - `accent` : Avec shadow-sm pour élévation subtile
 *
 * ## 📏 Sizes (3)
 *
 * - `sm` : 20×36px (thumb 16px, translate-x-4)
 * - `md` : 24×44px (thumb 20px, translate-x-5) - **défaut**
 * - `lg` : 28×52px (thumb 24px, translate-x-6)
 *
 * ## 🎯 States de Validation (3)
 *
 * - `default` : Bleu (#3b82f6) - état normal
 * - `error` : Rouge (#ef4444) - validation erreur
 * - `success` : Vert (#22c55e) - validation succès
 *
 * ## 🔧 Props Principales
 *
 * ```typescript
 * interface SwitchProps {
 *   // CVA variants
 *   variant?: 'default' | 'minimal' | 'accent'
 *   switchSize?: 'sm' | 'md' | 'lg'
 *   state?: 'default' | 'error' | 'success'
 *
 *   // Auto-state
 *   error?: boolean  // Auto-set state="error"
 *
 *   // Radix UI props
 *   checked?: boolean
 *   defaultChecked?: boolean
 *   onCheckedChange?: (checked: boolean) => void
 *   disabled?: boolean
 *   required?: boolean
 *   name?: string
 * }
 * ```
 *
 * ## 🚀 Usage Basique
 *
 * ```tsx
 * // Default
 * <Switch />
 *
 * // Controlled avec état
 * const [enabled, setEnabled] = useState(false)
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 *
 * // Avec validation
 * <Switch state="error" error />
 * <Switch state="success" />
 *
 * // Sizes
 * <Switch switchSize="sm" />
 * <Switch switchSize="lg" />
 *
 * // Variants
 * <Switch variant="minimal" />
 * <Switch variant="accent" />
 * ```
 *
 * ## 💡 Patterns Réels
 *
 * ### Toggle avec Label
 * ```tsx
 * <div className="flex items-center gap-3">
 *   <Switch
 *     id="notifications"
 *     checked={notifications}
 *     onCheckedChange={setNotifications}
 *   />
 *   <label htmlFor="notifications" className="text-sm font-medium">
 *     Activer les notifications
 *   </label>
 * </div>
 * ```
 *
 * ### Settings Form
 * ```tsx
 * <div className="space-y-4">
 *   <div className="flex items-center justify-between">
 *     <div>
 *       <label className="text-sm font-medium">Marketing emails</label>
 *       <p className="text-xs text-slate-500">Receive updates about products</p>
 *     </div>
 *     <Switch checked={marketing} onCheckedChange={setMarketing} />
 *   </div>
 *   <div className="flex items-center justify-between">
 *     <div>
 *       <label className="text-sm font-medium">Security alerts</label>
 *       <p className="text-xs text-slate-500">Critical security notifications</p>
 *     </div>
 *     <Switch checked={security} onCheckedChange={setSecurity} />
 *   </div>
 * </div>
 * ```
 *
 * ## ♿ Accessibilité
 *
 * - ✅ ARIA role="switch" automatique (Radix UI)
 * - ✅ Keyboard navigation (Space/Enter toggle)
 * - ✅ Focus visible avec ring
 * - ✅ Disabled states
 * - ✅ Labels associables via id
 *
 * ## 🎨 Compound Variants
 *
 * Ajustements automatiques pour combinaisons spécifiques:
 *
 * - `minimal + default` : Border blue on checked
 * - `minimal + error` : Border red on checked
 * - `minimal + success` : Border green on checked
 *
 * ## 📊 Métriques
 *
 * - **Combinaisons** : 3 variants × 3 sizes × 3 states = 27 variations
 * - **Type-check** : 0 erreurs TypeScript
 * - **File size** : ~112 lignes (component)
 * - **Dependencies** : Radix UI Switch, CVA, Tailwind
 *
 * ## 🔗 Relations
 *
 * - Utilisé dans : Settings, Preferences, Feature Flags
 * - Complète : InputUnified, SelectUnified, CheckboxUnified, TextareaUnified
 * - Alternative : Checkbox (pour sélection multiple)
 */
const meta = {
  title: '1-UI-Base/Switches/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Switch toggle moderne avec CVA variants, tailles, et états de validation. Basé sur Radix UI avec transitions smooth.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'accent'],
      description: 'Variant visuel du switch',
      table: {
        type: { summary: 'default | minimal | accent' },
        defaultValue: { summary: 'default' },
      },
    },
    switchSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du switch',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'État de validation',
      table: {
        type: { summary: 'default | error | success' },
        defaultValue: { summary: 'default' },
      },
    },
    error: {
      control: 'boolean',
      description: 'Auto-set state="error"',
      table: {
        type: { summary: 'boolean' },
      },
    },
    checked: {
      control: 'boolean',
      description: 'État checked (controlled)',
      table: {
        type: { summary: 'boolean' },
      },
    },
    defaultChecked: {
      control: 'boolean',
      description: 'État checked initial (uncontrolled)',
      table: {
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactivé',
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ## 🎨 Default
 *
 * Switch par défaut avec variant `default`, size `md`, state `default`.
 *
 * Toggle pour tester l'interaction checked/unchecked.
 */
export const Default: Story = {
  args: {
    defaultChecked: false,
  },
};

/**
 * ## 🎨 All Variants
 *
 * Démo des **3 variants visuels** :
 *
 * 1. **default** : Style standard avec bg colors
 * 2. **minimal** : Fond blanc unchecked, colored border checked
 * 3. **accent** : Avec shadow-sm pour élévation
 *
 * Chaque switch est interactif (toggle on/off).
 */
export const AllVariants: Story = {
  render: () => {
    const [default1, setDefault1] = useState(false);
    const [minimal1, setMinimal1] = useState(false);
    const [accent1, setAccent1] = useState(false);

    return (
      <div className="flex flex-col gap-8">
        {/* Default Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Default</h3>
            <p className="text-xs text-slate-500">
              Style standard avec bg slate-200 (off) → blue-600 (on)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              variant="default"
              checked={default1}
              onCheckedChange={setDefault1}
            />
            <span className="text-sm text-slate-600">
              {default1 ? 'Activé' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* Minimal Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Minimal</h3>
            <p className="text-xs text-slate-500">
              Fond blanc unchecked avec border, colored border checked
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              variant="minimal"
              checked={minimal1}
              onCheckedChange={setMinimal1}
            />
            <span className="text-sm text-slate-600">
              {minimal1 ? 'Activé' : 'Désactivé'}
            </span>
          </div>
        </div>

        {/* Accent Variant */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Accent</h3>
            <p className="text-xs text-slate-500">
              Avec shadow-sm pour élévation subtile
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              variant="accent"
              checked={accent1}
              onCheckedChange={setAccent1}
            />
            <span className="text-sm text-slate-600">
              {accent1 ? 'Activé' : 'Désactivé'}
            </span>
          </div>
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
 * - **sm** : 20×36px (thumb 16px, translate-x-4)
 * - **md** : 24×44px (thumb 20px, translate-x-5) - défaut
 * - **lg** : 28×52px (thumb 24px, translate-x-6)
 *
 * Transitions automatiques adaptées à chaque taille.
 */
export const Sizes: Story = {
  render: () => {
    const [sm, setSm] = useState(false);
    const [md, setMd] = useState(false);
    const [lg, setLg] = useState(false);

    return (
      <div className="flex flex-col gap-6">
        {/* Small */}
        <div className="flex items-center gap-4">
          <Switch switchSize="sm" checked={sm} onCheckedChange={setSm} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Small (sm)</span>
            <span className="text-xs text-slate-500">20×36px, thumb 16px</span>
          </div>
        </div>

        {/* Medium */}
        <div className="flex items-center gap-4">
          <Switch switchSize="md" checked={md} onCheckedChange={setMd} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Medium (md) - Default</span>
            <span className="text-xs text-slate-500">24×44px, thumb 20px</span>
          </div>
        </div>

        {/* Large */}
        <div className="flex items-center gap-4">
          <Switch switchSize="lg" checked={lg} onCheckedChange={setLg} />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Large (lg)</span>
            <span className="text-xs text-slate-500">28×52px, thumb 24px</span>
          </div>
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
 * - **default** : Bleu (#3b82f6) - état normal
 * - **error** : Rouge (#ef4444) - validation erreur
 * - **success** : Vert (#22c55e) - validation succès
 *
 * Chaque state change la couleur du switch quand activé ET le focus ring.
 */
export const States: Story = {
  render: () => {
    const [defaultState, setDefaultState] = useState(false);
    const [errorState, setErrorState] = useState(false);
    const [successState, setSuccessState] = useState(false);

    return (
      <div className="flex flex-col gap-6">
        {/* Default State */}
        <div className="flex items-center gap-4">
          <Switch
            state="default"
            checked={defaultState}
            onCheckedChange={setDefaultState}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Default (blue)</span>
            <span className="text-xs text-slate-500">
              État normal - bg-blue-600
            </span>
          </div>
        </div>

        {/* Error State */}
        <div className="flex items-center gap-4">
          <Switch
            state="error"
            checked={errorState}
            onCheckedChange={setErrorState}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Error (red)</span>
            <span className="text-xs text-slate-500">
              Validation erreur - bg-red-600
            </span>
          </div>
        </div>

        {/* Success State */}
        <div className="flex items-center gap-4">
          <Switch
            state="success"
            checked={successState}
            onCheckedChange={setSuccessState}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Success (green)</span>
            <span className="text-xs text-slate-500">
              Validation succès - bg-green-600
            </span>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## 🎨 Variants × States
 *
 * Matrice complète : **3 variants × 3 states = 9 combinaisons**
 *
 * Démontre les compound variants automatiques :
 * - `minimal + default` : Border blue on checked
 * - `minimal + error` : Border red on checked
 * - `minimal + success` : Border green on checked
 *
 * Tous switches sont checked pour voir les couleurs.
 */
export const VariantsWithStates: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        {/* Default Variant - All States */}
        <div>
          <h3 className="mb-4 text-sm font-semibold">Default Variant</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch variant="default" state="default" defaultChecked />
              <span className="text-xs text-slate-600">
                Default state (blue)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="default" state="error" defaultChecked />
              <span className="text-xs text-slate-600">Error state (red)</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="default" state="success" defaultChecked />
              <span className="text-xs text-slate-600">
                Success state (green)
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Variant - All States */}
        <div>
          <h3 className="mb-4 text-sm font-semibold">Minimal Variant</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch variant="minimal" state="default" defaultChecked />
              <span className="text-xs text-slate-600">
                Default state (blue border)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="minimal" state="error" defaultChecked />
              <span className="text-xs text-slate-600">
                Error state (red border)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="minimal" state="success" defaultChecked />
              <span className="text-xs text-slate-600">
                Success state (green border)
              </span>
            </div>
          </div>
        </div>

        {/* Accent Variant - All States */}
        <div>
          <h3 className="mb-4 text-sm font-semibold">Accent Variant</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch variant="accent" state="default" defaultChecked />
              <span className="text-xs text-slate-600">
                Default state (blue + shadow)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="accent" state="error" defaultChecked />
              <span className="text-xs text-slate-600">
                Error state (red + shadow)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="accent" state="success" defaultChecked />
              <span className="text-xs text-slate-600">
                Success state (green + shadow)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## 🏷️ With Labels
 *
 * Pattern réel : Switch avec labels et descriptions.
 *
 * **Best practice** :
 * - Label cliquable via htmlFor (lié à id du Switch)
 * - Description avec text-slate-500
 * - Layout flex justify-between pour alignement
 */
export const WithLabels: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true);
    const [autoSave, setAutoSave] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    return (
      <div className="w-[400px] space-y-6">
        {/* With Label Only */}
        <div className="flex items-center justify-between">
          <label htmlFor="notifications" className="text-sm font-medium">
            Activer les notifications
          </label>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>

        {/* With Label + Description */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="auto-save" className="text-sm font-medium">
              Sauvegarde automatique
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Sauvegarder automatiquement vos modifications toutes les 30
              secondes
            </p>
          </div>
          <Switch
            id="auto-save"
            checked={autoSave}
            onCheckedChange={setAutoSave}
          />
        </div>

        {/* With Label + Description + Minimal Variant */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="dark-mode" className="text-sm font-medium">
              Mode sombre
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Activer le thème sombre pour réduire la fatigue oculaire
            </p>
          </div>
          <Switch
            id="dark-mode"
            variant="minimal"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>
      </div>
    );
  },
};

/**
 * ## 🚫 Disabled
 *
 * États disabled pour tous les variants et checked/unchecked.
 *
 * **Styles automatiques** :
 * - `opacity-50`
 * - `cursor-not-allowed`
 * - Pas de hover effects
 */
export const Disabled: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6">
        {/* Disabled Unchecked */}
        <div>
          <h3 className="mb-4 text-sm font-semibold">Disabled Unchecked</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch variant="default" disabled />
              <span className="text-xs text-slate-500">Default variant</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="minimal" disabled />
              <span className="text-xs text-slate-500">Minimal variant</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="accent" disabled />
              <span className="text-xs text-slate-500">Accent variant</span>
            </div>
          </div>
        </div>

        {/* Disabled Checked */}
        <div>
          <h3 className="mb-4 text-sm font-semibold">Disabled Checked</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch variant="default" disabled defaultChecked />
              <span className="text-xs text-slate-500">Default variant</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="minimal" disabled defaultChecked />
              <span className="text-xs text-slate-500">Minimal variant</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch variant="accent" disabled defaultChecked />
              <span className="text-xs text-slate-500">Accent variant</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * ## 🌍 Real World - Settings Form
 *
 * Exemple réaliste : Formulaire de préférences utilisateur.
 *
 * **Features** :
 * - Catégories de settings (Notifications, Confidentialité, Apparence)
 * - Labels + descriptions détaillées
 * - Mix variants (default, minimal)
 * - Mix sizes (md, sm)
 * - États success pour settings activés recommandés
 * - Layout avec séparateurs
 *
 * **Pattern production-ready** utilisable directement.
 */
export const RealWorldSettings: Story = {
  render: () => {
    // Notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(false);

    // Privacy
    const [profilePublic, setProfilePublic] = useState(false);
    const [shareAnalytics, setShareAnalytics] = useState(true);
    const [twoFactor, setTwoFactor] = useState(true);

    // Appearance
    const [darkMode, setDarkMode] = useState(false);
    const [compactMode, setCompactMode] = useState(false);
    const [animations, setAnimations] = useState(true);

    return (
      <div className="w-[500px] space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">Préférences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos préférences de notifications, confidentialité et apparence
          </p>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Notifications
          </h3>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="email-notif" className="text-sm font-medium">
                Notifications par email
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Recevoir les mises à jour importantes par email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="push-notif" className="text-sm font-medium">
                Notifications push
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Recevoir les notifications dans le navigateur
              </p>
            </div>
            <Switch
              id="push-notif"
              variant="minimal"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="sms-notif" className="text-sm font-medium">
                Notifications SMS
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Recevoir les alertes critiques par SMS
              </p>
            </div>
            <Switch
              id="sms-notif"
              switchSize="sm"
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Privacy Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Confidentialité
          </h3>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="profile-public" className="text-sm font-medium">
                Profil public
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Rendre votre profil visible par tous les utilisateurs
              </p>
            </div>
            <Switch
              id="profile-public"
              checked={profilePublic}
              onCheckedChange={setProfilePublic}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="analytics" className="text-sm font-medium">
                Partager les données d'analyse
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Aider à améliorer le produit en partageant vos données
                d'utilisation
              </p>
            </div>
            <Switch
              id="analytics"
              variant="minimal"
              checked={shareAnalytics}
              onCheckedChange={setShareAnalytics}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="2fa" className="text-sm font-medium">
                Authentification à deux facteurs
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Sécurité renforcée avec code de vérification (recommandé)
              </p>
            </div>
            <Switch
              id="2fa"
              state="success"
              checked={twoFactor}
              onCheckedChange={setTwoFactor}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-200" />

        {/* Appearance Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Apparence</h3>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="dark-mode" className="text-sm font-medium">
                Mode sombre
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Activer le thème sombre pour réduire la fatigue oculaire
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="compact" className="text-sm font-medium">
                Mode compact
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Réduire l'espacement pour afficher plus d'informations
              </p>
            </div>
            <Switch
              id="compact"
              variant="minimal"
              switchSize="sm"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="animations" className="text-sm font-medium">
                Animations
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Activer les transitions et animations de l'interface
              </p>
            </div>
            <Switch
              id="animations"
              checked={animations}
              onCheckedChange={setAnimations}
            />
          </div>
        </div>
      </div>
    );
  },
};
