import type { Meta, StoryObj } from '@storybook/nextjs';

import { Avatar, AvatarImage, AvatarFallback } from '@verone/ui';

const meta = {
  title: '1-UI-Base/Avatars/Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
👤 **Avatar** - Image profil utilisateur avec fallback initiales et status indicator.

**Sizes** :
- \`xs\` : 24px (6 rem) - Très compact
- \`sm\` : 32px (8 rem) - Compact
- \`md\` : 40px (10 rem) - **Default**
- \`lg\` : 48px (12 rem) - Large
- \`xl\` : 64px (16 rem) - Extra-large

**Shapes** :
- \`circle\` : Rond (default) - **Recommandé utilisateurs**
- \`square\` : Carré arrondi - **Recommandé organisations**

**Status** :
- \`online\` : Vert (en ligne)
- \`offline\` : Gris (hors ligne)
- \`busy\` : Rouge (occupé)
- \`away\` : Orange (absent)

**Composition** :
- \`Avatar\` : Container principal avec status indicator
- \`AvatarImage\` : Image utilisateur (avec fallback auto vers AvatarFallback)
- \`AvatarFallback\` : Fallback initiales si image fail/loading

**Features** :
- Fallback automatique si image fail
- Status indicator optionnel avec sizing auto
- Initiales calculables from name
- Shapes circle/square

**Version** : V1 (CVA from scratch - Radix UI Avatar)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    avatarSize: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: "Taille de l'avatar",
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: "Forme de l'avatar",
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', 'away'],
      description: 'Status indicator optionnel',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Avatar default avec image
 */
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
        alt="John Doe"
      />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

/**
 * Toutes les tailles disponibles
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Avatar avatarSize="xs">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="xs">JS</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">XS (24px)</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Avatar avatarSize="sm">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="sm">JS</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">SM (32px)</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Avatar avatarSize="md">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="md">JS</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">MD (40px)</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Avatar avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="lg">JS</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">LG (48px)</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Avatar avatarSize="xl">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="xl">JS</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">XL (64px)</p>
      </div>
    </div>
  ),
};

/**
 * Avatar avec fallback initiales (sans image)
 */
export const WithFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>

      <Avatar>
        <AvatarFallback>EF</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/**
 * Avatar avec status indicators
 */
export const WithStatus: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar status="online">
            <AvatarImage
              src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
              alt="User"
            />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <p className="text-xs text-slate-600">Online</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar status="offline">
            <AvatarImage
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop"
              alt="User"
            />
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <p className="text-xs text-slate-600">Offline</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar status="busy">
            <AvatarImage
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop"
              alt="User"
            />
            <AvatarFallback>CD</AvatarFallback>
          </Avatar>
          <p className="text-xs text-slate-600">Busy</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar status="away">
            <AvatarImage
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&h=128&fit=crop"
              alt="User"
            />
            <AvatarFallback>EF</AvatarFallback>
          </Avatar>
          <p className="text-xs text-slate-600">Away</p>
        </div>
      </div>

      {/* Avec différentes tailles */}
      <div className="flex items-end gap-4">
        <Avatar avatarSize="sm" status="online">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="sm">JD</AvatarFallback>
        </Avatar>

        <Avatar avatarSize="md" status="online">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="md">JD</AvatarFallback>
        </Avatar>

        <Avatar avatarSize="lg" status="online">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="lg">JD</AvatarFallback>
        </Avatar>

        <Avatar avatarSize="xl" status="online">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="xl">JD</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
};

/**
 * Shapes disponibles (circle, square)
 */
export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Avatar shape="circle" avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="lg">JD</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">Circle (utilisateur)</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Avatar shape="square" avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop"
            alt="Organisation"
          />
          <AvatarFallback avatarSize="lg">MD</AvatarFallback>
        </Avatar>
        <p className="text-xs text-slate-600">Square (organisation)</p>
      </div>
    </div>
  ),
};

/**
 * Exemples réels d'utilisation
 */
export const RealWorld: Story = {
  render: () => (
    <div className="space-y-6 p-4 w-[600px]">
      {/* Liste utilisateurs avec status */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">
          Équipe (5 membres)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar avatarSize="sm" status="online">
              <AvatarImage
                src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
                alt="John Doe"
              />
              <AvatarFallback avatarSize="sm">JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">John Doe</p>
              <p className="text-xs text-slate-600">Responsable commercial</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar avatarSize="sm" status="busy">
              <AvatarImage
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop"
                alt="Alice Martin"
              />
              <AvatarFallback avatarSize="sm">AM</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">Alice Martin</p>
              <p className="text-xs text-slate-600">Designer produit</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar avatarSize="sm" status="away">
              <AvatarFallback avatarSize="sm">CD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Claude Dupont
              </p>
              <p className="text-xs text-slate-600">Chef de projet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card contact principal */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Avatar avatarSize="lg" status="online">
            <AvatarImage
              src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
              alt="Contact"
            />
            <AvatarFallback avatarSize="lg">JS</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-slate-900">Jacques Simoneau</h4>
            <p className="text-sm text-slate-600">Maison Dupont SARL</p>
            <p className="text-xs text-slate-500 mt-1">
              j.simoneau@maisondupont.fr
            </p>
          </div>
        </div>
      </div>

      {/* Organisations (square avatars) */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Fournisseurs</h3>
        <div className="flex gap-3">
          <Avatar shape="square" avatarSize="md">
            <AvatarFallback avatarSize="md">AM</AvatarFallback>
          </Avatar>
          <Avatar shape="square" avatarSize="md">
            <AvatarFallback avatarSize="md">DS</AvatarFallback>
          </Avatar>
          <Avatar shape="square" avatarSize="md">
            <AvatarFallback avatarSize="md">MB</AvatarFallback>
          </Avatar>
          <Avatar shape="square" avatarSize="md">
            <AvatarFallback avatarSize="md">+5</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className="border border-slate-200 rounded-lg p-6 flex flex-col items-center">
        <Avatar avatarSize="xl">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=256&h=256&fit=crop"
            alt="User"
          />
          <AvatarFallback avatarSize="xl">RD</AvatarFallback>
        </Avatar>
        <h3 className="mt-4 font-semibold text-slate-900">Romeo Dos Santos</h3>
        <p className="text-sm text-slate-600">Administrateur</p>
        <p className="text-xs text-slate-500 mt-1">romeo@verone.fr</p>
      </div>
    </div>
  ),
};

/**
 * Avatar group (stack)
 */
export const AvatarGroup: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Stack horizontal */}
      <div className="flex -space-x-2">
        <Avatar avatarSize="md">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User 1"
          />
          <AvatarFallback>U1</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="md">
          <AvatarImage
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop"
            alt="User 2"
          />
          <AvatarFallback>U2</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="md">
          <AvatarImage
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop"
            alt="User 3"
          />
          <AvatarFallback>U3</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="md">
          <AvatarFallback>+3</AvatarFallback>
        </Avatar>
      </div>

      {/* Stack large */}
      <div className="flex -space-x-3">
        <Avatar avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=128&h=128&fit=crop"
            alt="User 1"
          />
          <AvatarFallback avatarSize="lg">U1</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop"
            alt="User 2"
          />
          <AvatarFallback avatarSize="lg">U2</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop"
            alt="User 3"
          />
          <AvatarFallback avatarSize="lg">U3</AvatarFallback>
        </Avatar>
        <Avatar avatarSize="lg">
          <AvatarFallback avatarSize="lg">+7</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
};
