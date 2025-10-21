import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ButtonV2 } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';

const meta = {
  title: '1-UI-Base/Cards/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
📦 **Card** - Conteneur basique shadcn/ui.

**Composants** :
- \`Card\` : Conteneur principal
- \`CardHeader\` : En-tête avec padding
- \`CardTitle\` : Titre (h3)
- \`CardDescription\` : Description secondaire
- \`CardContent\` : Contenu principal
- \`CardFooter\` : Pied de page (actions)

**Design** :
- Border : \`border-slate-200\`
- Background : \`bg-white\`
- Shadow : \`shadow-sm\`
- Radius : \`rounded-xl\`

**Version** : V1 (shadcn/ui standard)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Carte basique avec titre seulement
 */
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          This is a basic card component from shadcn/ui.
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * Carte complète avec tous les éléments
 */
export const Complete: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Complete Card</CardTitle>
        <CardDescription>This card has all possible sections</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          Card content goes here. You can put any content: forms, lists, images, etc.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <ButtonV2 variant="primary" size="sm" icon={Save}>Save</ButtonV2>
        <ButtonV2 variant="secondary" size="sm" icon={X}>Cancel</ButtonV2>
      </CardFooter>
    </Card>
  ),
};

/**
 * Carte avec badge et statistiques
 */
export const WithBadges: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Status</CardTitle>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>Last updated 2 hours ago</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Stock:</span>
            <span className="font-medium">125 units</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Price:</span>
            <span className="font-medium">€299.99</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Orders:</span>
            <span className="font-medium">47 this month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

/**
 * Carte avec formulaire
 */
export const WithForm: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to create an account</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <ButtonV2 variant="primary" className="w-full">Create Account</ButtonV2>
      </CardFooter>
    </Card>
  ),
};

/**
 * Carte avec image
 */
export const WithImage: Story = {
  render: () => (
    <Card className="w-[350px] overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600" />
      <CardHeader>
        <CardTitle>Featured Product</CardTitle>
        <CardDescription>Fauteuil Milo - Collection 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          Premium velvet armchair with modern design. Perfect for contemporary interiors.
        </p>
      </CardContent>
      <CardFooter>
        <ButtonV2 variant="primary" className="w-full">View Details</ButtonV2>
      </CardFooter>
    </Card>
  ),
};

/**
 * Carte interactive (hover effects)
 */
export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200 hover:scale-[1.02]">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>Hover to see the effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          This card has hover effects: shadow elevation, border color change, and scale animation.
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * Grille de cartes
 */
export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="w-[200px]">
          <CardHeader>
            <CardTitle className="text-base">Card {i}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">Sample content for card {i}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

/**
 * Cartes empilées (liste)
 */
export const List: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      {['Draft', 'In Progress', 'Completed'].map((status, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Task #{i + 1}</CardTitle>
              <Badge variant={status === 'Completed' ? 'success' : 'secondary'}>
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-600">
              Description of task {i + 1} goes here.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

/**
 * Différentes largeurs
 */
export const Widths: Story = {
  render: () => (
    <div className="space-y-4">
      <Card className="w-[200px]">
        <CardHeader>
          <CardTitle className="text-sm">Small (200px)</CardTitle>
        </CardHeader>
      </Card>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-base">Medium (350px)</CardTitle>
        </CardHeader>
      </Card>
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Large (500px)</CardTitle>
        </CardHeader>
      </Card>
      <Card className="w-full max-w-[800px]">
        <CardHeader>
          <CardTitle>Full Width (max 800px)</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
};
