import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  Search,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  DollarSign,
} from 'lucide-react';

import { Input } from '@verone/ui';

const meta = {
  title: '1-UI-Base/Inputs/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
📝 **Input** - Champ de saisie avec variants CVA et icônes.

**Variants Visuels** (CVA) :
- \`default\` : Border classique (rounded-lg) - **Default**
- \`filled\` : Background gris, border subtle
- \`outlined\` : Border prononcée (border-2)
- \`underlined\` : Border-bottom seulement

**États de Validation** :
- \`default\` : État normal (slate-300)
- \`error\` : Bordure rouge + message erreur
- \`success\` : Bordure verte (validation)

**Tailles** :
- \`sm\` : 32px (h-8, px-3, text-sm)
- \`md\` : 40px (h-10, px-4, text-sm) - **Default**
- \`lg\` : 48px (h-12, px-4, text-base)

**Fonctionnalités** :
- Icône gauche/droite (Lucide icons)
- Message d'erreur automatique (error prop)
- Helper text (aide contextuelle)
- États disabled, focus, hover
- Transitions smooth (200ms)
- Padding automatique avec icônes (pl-10/pr-10)

**Version** : V2 (CVA + shadcn/ui)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'outlined', 'underlined'],
      description: 'Style visuel du champ (CVA variant)',
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'État de validation',
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du champ',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Type HTML du champ',
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Champ default (gris)
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/**
 * Champ avec label et helper text
 */
export const WithHelperText: Story = {
  render: () => (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Email
      </label>
      <Input
        type="email"
        placeholder="name@example.com"
        helperText="We'll never share your email with anyone else."
      />
    </div>
  ),
};

/**
 * État error avec message
 */
export const Error: Story = {
  render: () => (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Username
      </label>
      <Input
        placeholder="Enter username"
        error="Username is required and must be at least 3 characters."
      />
    </div>
  ),
};

/**
 * État success (validation)
 */
export const Success: Story = {
  render: () => (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Email
      </label>
      <Input
        type="email"
        value="john@example.com"
        onChange={() => {}} // Read-only for demo
        state="success"
        helperText="Email is valid ✓"
      />
    </div>
  ),
};

/**
 * État disabled
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    value: 'This field is disabled',
    onChange: () => {}, // Read-only for demo
  },
};

/**
 * Avec icône gauche
 */
export const WithIconLeft: Story = {
  render: () => (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Search
      </label>
      <Input
        placeholder="Search products..."
        iconLeft={<Search className="w-4 h-4" />}
      />
    </div>
  ),
};

/**
 * Avec icône droite
 */
export const WithIconRight: Story = {
  render: () => (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Email
      </label>
      <Input
        type="email"
        placeholder="name@example.com"
        iconRight={<Mail className="w-4 h-4" />}
      />
    </div>
  ),
};

/**
 * Password avec toggle visibility
 */
function PasswordToggleComponent() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-[350px]">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Password
      </label>
      <Input
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        iconLeft={<Lock className="w-4 h-4" />}
        iconRight={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="hover:text-slate-700"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
      />
    </div>
  );
}

export const PasswordToggle: Story = {
  render: () => <PasswordToggleComponent />,
};

/**
 * Tailles disponibles
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Small (32px)
        </label>
        <Input inputSize="sm" placeholder="Small input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Medium (40px) - Default
        </label>
        <Input inputSize="md" placeholder="Medium input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Large (48px)
        </label>
        <Input inputSize="lg" placeholder="Large input" />
      </div>
    </div>
  ),
};

/**
 * Types HTML disponibles
 */
export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Text
        </label>
        <Input type="text" placeholder="Enter text" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <Input
          type="email"
          placeholder="name@example.com"
          iconRight={<Mail className="w-4 h-4" />}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          iconLeft={<Lock className="w-4 h-4" />}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Number
        </label>
        <Input type="number" placeholder="0" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Telephone
        </label>
        <Input
          type="tel"
          placeholder="+33 6 12 34 56 78"
          iconLeft={<Phone className="w-4 h-4" />}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Search
        </label>
        <Input
          type="search"
          placeholder="Search..."
          iconLeft={<Search className="w-4 h-4" />}
        />
      </div>
    </div>
  ),
};

/**
 * Formulaire complet
 */
export const FormExample: Story = {
  render: () => (
    <div className="w-[400px] border border-slate-200 rounded-xl p-6 bg-white">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Create Product
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Product Name *
          </label>
          <Input
            placeholder="e.g. Fauteuil Milo"
            helperText="Enter a clear and descriptive name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            SKU *
          </label>
          <Input
            placeholder="FAUT-MILO-001"
            helperText="Unique product identifier"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Price (€)
            </label>
            <Input
              type="number"
              placeholder="299.99"
              iconLeft={<DollarSign className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Stock
            </label>
            <Input type="number" placeholder="25" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <Input
            placeholder="Brief product description"
            helperText="Max 100 characters"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * États de validation
 */
export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Valid Email
        </label>
        <Input
          type="email"
          value="john@example.com"
          onChange={() => {}} // Read-only for demo
          state="success"
          iconRight={<Mail className="w-4 h-4" />}
          helperText="Email is valid ✓"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Invalid Email
        </label>
        <Input
          type="email"
          value="invalid-email"
          onChange={() => {}} // Read-only for demo
          iconRight={<Mail className="w-4 h-4" />}
          error="Please enter a valid email address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Default State
        </label>
        <Input
          type="email"
          placeholder="name@example.com"
          iconRight={<Mail className="w-4 h-4" />}
          helperText="We'll send you a confirmation email"
        />
      </div>
    </div>
  ),
};

/**
 * Tous les variants CVA visuels
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Default (Border classique)
        </h4>
        <Input
          variant="default"
          placeholder="Enter email..."
          iconLeft={<Mail className="w-4 h-4" />}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Filled (Background gris)
        </h4>
        <Input
          variant="filled"
          placeholder="Enter email..."
          iconLeft={<Mail className="w-4 h-4" />}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Outlined (Border prononcée)
        </h4>
        <Input
          variant="outlined"
          placeholder="Enter email..."
          iconLeft={<Mail className="w-4 h-4" />}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Underlined (Border-bottom seulement)
        </h4>
        <Input
          variant="underlined"
          placeholder="Enter email..."
          iconLeft={<Mail className="w-4 h-4" />}
        />
      </div>
    </div>
  ),
};

/**
 * Variants avec états (default, error, success)
 */
export const VariantsWithStates: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      {/* Default variant with states */}
      <div>
        <h4 className="text-sm font-medium text-slate-900 mb-3">
          Default Variant
        </h4>
        <div className="space-y-3">
          <Input
            variant="default"
            state="default"
            placeholder="Normal state"
            helperText="This is the default state"
          />
          <Input
            variant="default"
            state="success"
            placeholder="Success state"
            helperText="Validation successful ✓"
          />
          <Input
            variant="default"
            error="This field is required"
            placeholder="Error state"
          />
        </div>
      </div>

      {/* Filled variant with states */}
      <div>
        <h4 className="text-sm font-medium text-slate-900 mb-3">
          Filled Variant
        </h4>
        <div className="space-y-3">
          <Input
            variant="filled"
            state="default"
            placeholder="Normal state"
            helperText="Filled background style"
          />
          <Input
            variant="filled"
            state="success"
            placeholder="Success state"
            helperText="Validation successful ✓"
          />
          <Input
            variant="filled"
            error="This field is required"
            placeholder="Error state"
          />
        </div>
      </div>

      {/* Outlined variant with states */}
      <div>
        <h4 className="text-sm font-medium text-slate-900 mb-3">
          Outlined Variant
        </h4>
        <div className="space-y-3">
          <Input
            variant="outlined"
            state="default"
            placeholder="Normal state"
            helperText="Thick border emphasis"
          />
          <Input
            variant="outlined"
            state="success"
            placeholder="Success state"
            helperText="Validation successful ✓"
          />
          <Input
            variant="outlined"
            error="This field is required"
            placeholder="Error state"
          />
        </div>
      </div>

      {/* Underlined variant with states */}
      <div>
        <h4 className="text-sm font-medium text-slate-900 mb-3">
          Underlined Variant
        </h4>
        <div className="space-y-3">
          <Input
            variant="underlined"
            state="default"
            placeholder="Normal state"
            helperText="Bottom border only"
          />
          <Input
            variant="underlined"
            state="success"
            placeholder="Success state"
            helperText="Validation successful ✓"
          />
          <Input
            variant="underlined"
            error="This field is required"
            placeholder="Error state"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Exemples réels d'utilisation
 */
export const RealWorld: Story = {
  render: () => (
    <div className="space-y-6 p-4 w-[500px]">
      {/* Search bar */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          Search Products
        </h4>
        <Input
          type="search"
          placeholder="Search by name, SKU, category..."
          iconLeft={<Search className="w-4 h-4" />}
          inputSize="lg"
        />
      </div>

      {/* Login form */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Login</h4>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            iconLeft={<Mail className="w-4 h-4" />}
          />
          <Input
            type="password"
            placeholder="Password"
            iconLeft={<Lock className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Profile form */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          User Profile
        </h4>
        <div className="space-y-3">
          <Input
            placeholder="Full Name"
            iconLeft={<User className="w-4 h-4" />}
            value="John Doe"
            onChange={() => {}} // Read-only for demo
          />
          <Input
            type="email"
            placeholder="Email"
            iconLeft={<Mail className="w-4 h-4" />}
            value="john@example.com"
            onChange={() => {}} // Read-only for demo
            state="success"
          />
          <Input
            type="tel"
            placeholder="Phone"
            iconLeft={<Phone className="w-4 h-4" />}
            error="Please enter a valid phone number"
          />
        </div>
      </div>

      {/* Product pricing */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Product Pricing
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Cost Price"
            iconLeft={<DollarSign className="w-4 h-4" />}
            inputSize="sm"
          />
          <Input
            type="number"
            placeholder="Sale Price"
            iconLeft={<DollarSign className="w-4 h-4" />}
            inputSize="sm"
          />
        </div>
      </div>
    </div>
  ),
};
