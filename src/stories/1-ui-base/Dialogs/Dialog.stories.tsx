import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Trash2, User, AlertTriangle, Package } from 'lucide-react';

const meta = {
  title: '1-UI-Base/Dialogs/Dialog',
  component: DialogContent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
🪟 **Dialog** - Modales modernes avec overlay, animations Radix, et sizes CVA.

**Tailles** :
- \`sm\` : max-w-sm p-4 - Confirmations rapides
- \`md\` : max-w-lg p-6 - Standard (défaut)
- \`lg\` : max-w-2xl p-6 - Forms complexes
- \`xl\` : max-w-4xl p-8 - Grandes interfaces
- \`full\` : max-w-[95vw] max-h-[95vh] p-8 - Fullscreen mode avec scroll

**Fonctionnalités** :
- Close button automatique (masquable avec \`hideCloseButton\`)
- Animations Radix (fade + zoom + slide)
- Overlay backdrop avec animation
- Focus trap automatique (accessibilité)
- ESC key pour fermer
- Composition : \`Dialog\` + \`DialogTrigger\` + \`DialogContent\` + \`DialogHeader\` + \`DialogFooter\`

**Version** : V2 (CVA + Size variants)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DialogContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dialog standard avec Title, Description et Footer actions
 */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Ouvrir Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Titre de la modal</DialogTitle>
          <DialogDescription>
            Ceci est une description de la modal. Elle explique le contenu ou
            l'action qui va être effectuée.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-600">
            Contenu principal de la modal. Vous pouvez placer n'importe quel
            contenu React ici.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">Annuler</Button>
          <Button variant="primary">Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Démonstration des 5 tailles disponibles (sm, md, lg, xl, full)
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {/* SM - Small */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            SM (Small)
          </Button>
        </DialogTrigger>
        <DialogContent dialogSize="sm">
          <DialogHeader>
            <DialogTitle>Small Dialog (sm)</DialogTitle>
            <DialogDescription>
              max-w-sm p-4 - Idéal pour confirmations rapides
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Dialog compact pour actions simples et confirmations.
          </p>
          <DialogFooter>
            <Button variant="primary" size="sm">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MD - Medium (default) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">MD (Medium - Default)</Button>
        </DialogTrigger>
        <DialogContent dialogSize="md">
          <DialogHeader>
            <DialogTitle>Medium Dialog (md)</DialogTitle>
            <DialogDescription>
              max-w-lg p-6 - Taille par défaut standard
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Dialog standard pour la plupart des cas d'usage (forms simples,
            confirmations avec détails).
          </p>
          <DialogFooter>
            <Button variant="outline">Annuler</Button>
            <Button variant="primary">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LG - Large */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">LG (Large)</Button>
        </DialogTrigger>
        <DialogContent dialogSize="lg">
          <DialogHeader>
            <DialogTitle>Large Dialog (lg)</DialogTitle>
            <DialogDescription>
              max-w-2xl p-6 - Pour forms complexes multi-colonnes
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Dialog large idéal pour forms avec plusieurs champs, wizards, ou
            contenu riche nécessitant plus d'espace horizontal.
          </p>
          <DialogFooter>
            <Button variant="outline">Annuler</Button>
            <Button variant="primary">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XL - Extra Large */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">XL (Extra Large)</Button>
        </DialogTrigger>
        <DialogContent dialogSize="xl">
          <DialogHeader>
            <DialogTitle>Extra Large Dialog (xl)</DialogTitle>
            <DialogDescription>
              max-w-4xl p-8 - Pour grandes interfaces ou dashboards
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Dialog très large pour interfaces complexes, tableaux de données, ou
            édition avancée nécessitant beaucoup d'espace visuel.
          </p>
          <DialogFooter>
            <Button variant="outline">Annuler</Button>
            <Button variant="primary">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULL - Fullscreen */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">FULL (Fullscreen)</Button>
        </DialogTrigger>
        <DialogContent dialogSize="full">
          <DialogHeader>
            <DialogTitle>Fullscreen Dialog (full)</DialogTitle>
            <DialogDescription>
              max-w-[95vw] max-h-[95vh] p-8 - Quasi fullscreen avec scroll
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Dialog fullscreen pour interfaces très complexes, éditeurs
              avancés, ou visualisation de données nécessitant tout l'écran.
            </p>
            <p className="text-sm text-slate-600">
              Avec overflow-y-auto automatique si contenu dépasse hauteur
              disponible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

/**
 * Dialog avec form complexe (inputs, selects) - Taille lg
 */
export const WithForm: Story = {
  render: () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="primary">
            <User className="mr-2 h-4 w-4" />
            Créer Utilisateur
          </Button>
        </DialogTrigger>
        <DialogContent dialogSize="lg">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire ci-dessous pour créer un compte
              utilisateur.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Dupont" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (Admin)</SelectItem>
                  <SelectItem value="catalog_manager">
                    Catalog Manager
                  </SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="stock_manager">Stock Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline">Annuler</Button>
            <Button variant="primary">Créer l'utilisateur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Dialog destructive pour confirmation de suppression (sm)
 */
export const DestructiveConfirm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer Produit
        </Button>
      </DialogTrigger>
      <DialogContent dialogSize="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le produit sera définitivement
            supprimé.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm font-semibold text-slate-900">
            Fauteuil Milo Vert
          </p>
          <p className="text-xs text-slate-500">SKU: FAUT-MILO-VERT</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Annuler</Button>
          <Button variant="destructive">Supprimer définitivement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Dialog sans bouton de fermeture X (hideCloseButton)
 */
export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Dialog sans bouton X</Button>
      </DialogTrigger>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>Action requise</DialogTitle>
          <DialogDescription>
            Cette modal ne peut être fermée qu'en cliquant sur un bouton
            d'action (pas de bouton X).
          </DialogDescription>
        </DialogHeader>
        <p className="py-4 text-sm text-slate-600">
          Utilisé pour forcer l'utilisateur à choisir une action explicite
          (utile pour confirmations critiques).
        </p>
        <DialogFooter>
          <Button variant="outline">Annuler</Button>
          <Button variant="primary">Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Dialog fullscreen avec contenu long scrollable
 */
export const Scrollable: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Dialog Scrollable (long contenu)</Button>
      </DialogTrigger>
      <DialogContent dialogSize="full">
        <DialogHeader>
          <DialogTitle>Contenu Long avec Scroll</DialogTitle>
          <DialogDescription>
            Dialog fullscreen avec overflow-y-auto automatique pour contenu
            dépassant la hauteur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">Section {i + 1}</h4>
              <p className="text-sm text-slate-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline">Fermer</Button>
          <Button variant="primary">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * Dialog imbriqué (nested) - Dialog dans Dialog
 */
export const Nested: Story = {
  render: () => {
    const [outerOpen, setOuterOpen] = useState(false);
    const [innerOpen, setInnerOpen] = useState(false);

    return (
      <Dialog open={outerOpen} onOpenChange={setOuterOpen}>
        <DialogTrigger asChild>
          <Button variant="primary">Ouvrir Dialog Parent</Button>
        </DialogTrigger>
        <DialogContent dialogSize="md">
          <DialogHeader>
            <DialogTitle>Dialog Parent</DialogTitle>
            <DialogDescription>
              Ce dialog contient un autre dialog (nested).
            </DialogDescription>
          </DialogHeader>
          <p className="py-4 text-sm text-slate-600">
            Radix UI gère automatiquement les z-index et le focus trap pour les
            dialogs imbriqués.
          </p>

          {/* Nested Dialog */}
          <Dialog open={innerOpen} onOpenChange={setInnerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Ouvrir Dialog Enfant</Button>
            </DialogTrigger>
            <DialogContent dialogSize="sm">
              <DialogHeader>
                <DialogTitle>Dialog Enfant (Nested)</DialogTitle>
                <DialogDescription>
                  Ce dialog est affiché au-dessus du parent.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-slate-600">
                Focus trap actif sur ce dialog. ESC fermera ce dialog enfant.
              </p>
              <DialogFooter>
                <Button
                  variant="primary"
                  onClick={() => setInnerOpen(false)}
                  size="sm"
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOuterOpen(false)}>
              Fermer Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Exemples réels d'utilisation business Vérone
 */
export const RealWorld: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      {/* Create User Dialog */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Admin - Créer Utilisateur
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">
              <User className="mr-2 h-4 w-4" />
              Créer Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent dialogSize="lg">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un compte utilisateur
                Vérone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input placeholder="Jean" />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Dupont" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jean.dupont@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="catalog_manager">
                      Catalog Manager
                    </SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="stock_manager">Stock Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Annuler</Button>
              <Button variant="primary">Créer l'utilisateur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Product Confirmation */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Catalogue - Supprimer Produit
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer Fauteuil Milo
            </Button>
          </DialogTrigger>
          <DialogContent dialogSize="sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Supprimer le produit ?
              </DialogTitle>
              <DialogDescription>
                Le produit sera supprimé définitivement du catalogue. Cette
                action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1 py-2">
              <p className="text-sm font-semibold text-slate-900">
                Fauteuil Milo Vert
              </p>
              <p className="text-xs text-slate-500">SKU: FAUT-MILO-VERT</p>
              <p className="text-xs text-slate-500">Stock: 12 unités</p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm">
                Annuler
              </Button>
              <Button variant="destructive" size="sm">
                Supprimer définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Product Dialog */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Catalogue - Éditer Produit
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Éditer Produit
            </Button>
          </DialogTrigger>
          <DialogContent dialogSize="xl">
            <DialogHeader>
              <DialogTitle>Éditer Fauteuil Milo Vert</DialogTitle>
              <DialogDescription>
                Modifiez les informations du produit ci-dessous.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom du produit</Label>
                  <Input defaultValue="Fauteuil Milo Vert" />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input defaultValue="FAUT-MILO-VERT" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select defaultValue="fauteuils">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fauteuils">Fauteuils</SelectItem>
                      <SelectItem value="canapes">Canapés</SelectItem>
                      <SelectItem value="tables">Tables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Prix de vente HT</Label>
                  <Input type="number" defaultValue="450.00" />
                </div>
                <div className="space-y-2">
                  <Label>Stock actuel</Label>
                  <Input type="number" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Annuler</Button>
              <Button variant="primary">Enregistrer les modifications</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  ),
};
