import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  Building2,
  Users,
  Settings,
  BarChart3,
  FileText,
  Package,
} from 'lucide-react';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@verone/ui';

const meta = {
  title: '1-UI-Base/Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
📑 **Tabs** - Navigation par onglets avec 3 variants CVA et Radix UI.

**Variantes** :
- \`default\` : Tabs arrondis avec background gris (style shadcn/ui) - **Default**
- \`pills\` : Pills arrondis avec border, actif = noir/blanc
- \`underline\` : Border-bottom, actif = border noir (style moderne)

**Fonctionnalités** :
- Keyboard navigation (Arrow keys)
- État actif géré par Radix UI (data-[state=active])
- Support icons + text
- Orientation vertical/horizontal
- Fully accessible (ARIA)

**Composition** :
- \`Tabs\` (Root) : Conteneur principal
- \`TabsList\` : Liste des triggers (variant prop)
- \`TabsTrigger\` : Bouton onglet (variant prop hérité du parent)
- \`TabsContent\` : Contenu associé à chaque onglet

**Version** : V2 (CVA + 3 Variants)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Onglet actif par défaut',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Orientation des onglets',
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tabs default variant (style shadcn/ui)
 */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[500px]">
      <TabsList variant="default">
        <TabsTrigger variant="default" value="tab1">
          Général
        </TabsTrigger>
        <TabsTrigger variant="default" value="tab2">
          Détails
        </TabsTrigger>
        <TabsTrigger variant="default" value="tab3">
          Paramètres
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Card>
          <CardHeader>
            <CardTitle>Général</CardTitle>
            <CardDescription>Informations générales du produit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Contenu de l&apos;onglet Général avec informations de base.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab2">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
            <CardDescription>
              Caractéristiques détaillées du produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Contenu de l&apos;onglet Détails avec caractéristiques techniques.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab3">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Configuration et options du produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Contenu de l&apos;onglet Paramètres avec options de configuration.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Tous les variants (default, pills, underline)
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      {/* Default Variant */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Default (shadcn/ui style)
        </h3>
        <Tabs defaultValue="overview">
          <TabsList variant="default">
            <TabsTrigger variant="default" value="overview">
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger variant="default" value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger variant="default" value="reports">
              Rapports
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-slate-600 mt-2">
              Variant <strong>default</strong> avec background gris et onglet
              actif blanc.
            </p>
          </TabsContent>
          <TabsContent value="analytics">
            <p className="text-sm text-slate-600 mt-2">Analytics content</p>
          </TabsContent>
          <TabsContent value="reports">
            <p className="text-sm text-slate-600 mt-2">Reports content</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pills Variant */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Pills (rounded border)
        </h3>
        <Tabs defaultValue="overview">
          <TabsList variant="pills">
            <TabsTrigger variant="pills" value="overview">
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger variant="pills" value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger variant="pills" value="reports">
              Rapports
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-slate-600 mt-2">
              Variant <strong>pills</strong> avec border et actif noir/blanc.
            </p>
          </TabsContent>
          <TabsContent value="analytics">
            <p className="text-sm text-slate-600 mt-2">Analytics content</p>
          </TabsContent>
          <TabsContent value="reports">
            <p className="text-sm text-slate-600 mt-2">Reports content</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Underline Variant */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Underline (modern style)
        </h3>
        <Tabs defaultValue="overview">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="overview">
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger variant="underline" value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger variant="underline" value="reports">
              Rapports
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-sm text-slate-600 mt-2">
              Variant <strong>underline</strong> avec border-bottom actif.
            </p>
          </TabsContent>
          <TabsContent value="analytics">
            <p className="text-sm text-slate-600 mt-2">Analytics content</p>
          </TabsContent>
          <TabsContent value="reports">
            <p className="text-sm text-slate-600 mt-2">Reports content</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

/**
 * Pills variant (border rounded)
 */
export const Pills: Story = {
  render: () => (
    <Tabs defaultValue="products" className="w-[600px]">
      <TabsList variant="pills">
        <TabsTrigger variant="pills" value="products">
          Produits
        </TabsTrigger>
        <TabsTrigger variant="pills" value="suppliers">
          Fournisseurs
        </TabsTrigger>
        <TabsTrigger variant="pills" value="customers">
          Clients
        </TabsTrigger>
        <TabsTrigger variant="pills" value="orders">
          Commandes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="products">
        <Card>
          <CardHeader>
            <CardTitle>Produits</CardTitle>
            <CardDescription>Gérer le catalogue produits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Liste des produits avec filtres et actions. Variant pills idéal
              pour navigation horizontale avec plusieurs onglets.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="suppliers">
        <Card>
          <CardHeader>
            <CardTitle>Fournisseurs</CardTitle>
            <CardDescription>Gérer les fournisseurs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Liste des fournisseurs</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="customers">
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Gérer les clients</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Liste des clients</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="orders">
        <Card>
          <CardHeader>
            <CardTitle>Commandes</CardTitle>
            <CardDescription>Gérer les commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Liste des commandes</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Underline variant (modern style)
 */
export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <TabsList variant="underline">
        <TabsTrigger variant="underline" value="overview">
          Vue d&apos;ensemble
        </TabsTrigger>
        <TabsTrigger variant="underline" value="analytics">
          Analytics
        </TabsTrigger>
        <TabsTrigger variant="underline" value="reports">
          Rapports
        </TabsTrigger>
        <TabsTrigger variant="underline" value="settings">
          Paramètres
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Vue d&apos;ensemble</CardTitle>
            <CardDescription>Dashboard principal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Variant underline moderne avec border-bottom actif. Parfait pour
              navigation clean et minimaliste.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Statistiques et métriques</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Graphiques et KPIs de performance
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Rapports</CardTitle>
            <CardDescription>Rapports détaillés</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Exports et rapports personnalisés
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>
              Configuration de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Options et préférences utilisateur
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Tabs avec icons et texte
 */
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-8 w-[600px]">
      {/* Default variant with icons */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Default variant avec icons
        </h3>
        <Tabs defaultValue="organisation">
          <TabsList variant="default">
            <TabsTrigger variant="default" value="organisation">
              <Building2 className="h-4 w-4 mr-2" />
              Organisation
            </TabsTrigger>
            <TabsTrigger variant="default" value="users">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger variant="default" value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>
          <TabsContent value="organisation">
            <p className="text-sm text-slate-600 mt-2">
              Informations organisation
            </p>
          </TabsContent>
          <TabsContent value="users">
            <p className="text-sm text-slate-600 mt-2">Gestion utilisateurs</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-slate-600 mt-2">Paramètres système</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Pills variant with icons */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Pills variant avec icons
        </h3>
        <Tabs defaultValue="analytics">
          <TabsList variant="pills">
            <TabsTrigger variant="pills" value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger variant="pills" value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Rapports
            </TabsTrigger>
            <TabsTrigger variant="pills" value="products">
              <Package className="h-4 w-4 mr-2" />
              Produits
            </TabsTrigger>
          </TabsList>
          <TabsContent value="analytics">
            <p className="text-sm text-slate-600 mt-2">Dashboard analytics</p>
          </TabsContent>
          <TabsContent value="reports">
            <p className="text-sm text-slate-600 mt-2">
              Rapports personnalisés
            </p>
          </TabsContent>
          <TabsContent value="products">
            <p className="text-sm text-slate-600 mt-2">Catalogue produits</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Underline variant with icons */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Underline variant avec icons
        </h3>
        <Tabs defaultValue="organisation">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="organisation">
              <Building2 className="h-4 w-4 mr-2" />
              Organisation
            </TabsTrigger>
            <TabsTrigger variant="underline" value="users">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger variant="underline" value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>
          <TabsContent value="organisation">
            <p className="text-sm text-slate-600 mt-2">
              Informations organisation
            </p>
          </TabsContent>
          <TabsContent value="users">
            <p className="text-sm text-slate-600 mt-2">Gestion utilisateurs</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-slate-600 mt-2">Paramètres système</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

/**
 * Tabs avec orientation vertical
 */
export const Vertical: Story = {
  render: () => (
    <Tabs
      defaultValue="general"
      orientation="vertical"
      className="flex w-[600px]"
    >
      <TabsList
        variant="default"
        className="flex-col h-auto items-stretch w-[200px]"
      >
        <TabsTrigger
          variant="default"
          value="general"
          className="justify-start"
        >
          Général
        </TabsTrigger>
        <TabsTrigger
          variant="default"
          value="security"
          className="justify-start"
        >
          Sécurité
        </TabsTrigger>
        <TabsTrigger
          variant="default"
          value="notifications"
          className="justify-start"
        >
          Notifications
        </TabsTrigger>
        <TabsTrigger
          variant="default"
          value="integrations"
          className="justify-start"
        >
          Intégrations
        </TabsTrigger>
      </TabsList>
      <div className="flex-1 ml-4">
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configuration générale de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Orientation verticale idéale pour settings pages avec beaucoup
                de catégories.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Authentification et permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Gestion des mots de passe, 2FA, sessions
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Préférences de notification</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Email, SMS, push notifications
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Intégrations</CardTitle>
              <CardDescription>Services externes et API</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Google Merchant, Qonto, Packlink
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  ),
};

/**
 * Exemples réels business Vérone (Organisations)
 */
export const RealWorld: Story = {
  render: () => (
    <div className="space-y-8 p-4 w-[800px]">
      {/* Page Organisations avec Pills */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Page Organisations (Pills variant)
        </h3>
        <Tabs defaultValue="customers">
          <TabsList variant="pills">
            <TabsTrigger variant="pills" value="customers">
              <Users className="h-4 w-4 mr-2" />
              Clients (24)
            </TabsTrigger>
            <TabsTrigger variant="pills" value="suppliers">
              <Building2 className="h-4 w-4 mr-2" />
              Fournisseurs (12)
            </TabsTrigger>
            <TabsTrigger variant="pills" value="partners">
              <Building2 className="h-4 w-4 mr-2" />
              Partenaires (8)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="customers">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>
                  24 organisations clientes actives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Hôtel Le Grand Paris</p>
                    <p className="text-sm text-slate-600">
                      Contact : Marie Dubois
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Restaurant Le Petit Zinc</p>
                    <p className="text-sm text-slate-600">
                      Contact : Jean Martin
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Château de Versailles</p>
                    <p className="text-sm text-slate-600">
                      Contact : Sophie Leroy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="suppliers">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Fournisseurs</CardTitle>
                <CardDescription>12 fournisseurs référencés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Atelier Martin</p>
                    <p className="text-sm text-slate-600">
                      Spécialité : Fauteuils haut de gamme
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Manufacture Dubois</p>
                    <p className="text-sm text-slate-600">
                      Spécialité : Tables en bois massif
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="partners">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Partenaires</CardTitle>
                <CardDescription>8 partenaires stratégiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg hover:bg-slate-50">
                    <p className="font-medium">Design Studio Paris</p>
                    <p className="text-sm text-slate-600">
                      Partenariat : Architecture d&apos;intérieur
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fiche Produit avec Default */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Fiche Produit (Default variant)
        </h3>
        <Tabs defaultValue="general">
          <TabsList variant="default">
            <TabsTrigger variant="default" value="general">
              Général
            </TabsTrigger>
            <TabsTrigger variant="default" value="specs">
              Caractéristiques
            </TabsTrigger>
            <TabsTrigger variant="default" value="pricing">
              Prix
            </TabsTrigger>
            <TabsTrigger variant="default" value="stock">
              Stock
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Fauteuil Milo Vert</CardTitle>
                <CardDescription>
                  SKU: FAUT-MILO-VERT | Catégorie: Fauteuils
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Description :</strong> Fauteuil élégant en velours
                    vert avec pieds en bois massif
                  </p>
                  <p>
                    <strong>Collection :</strong> Collection Milo 2024
                  </p>
                  <p>
                    <strong>Statut :</strong> Actif
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specs">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Caractéristiques techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>Dimensions : L 80cm x P 85cm x H 95cm</p>
                  <p>Matière : Velours 100% polyester</p>
                  <p>Couleur : Vert émeraude</p>
                  <p>Poids : 18kg</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pricing">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Tarification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>Prix public : 450€ HT</p>
                  <p>Prix d&apos;achat : 280€ HT</p>
                  <p>Marge : 60.7%</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stock">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Gestion du stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>Stock actuel : 12 unités</p>
                  <p>Stock minimum : 5 unités</p>
                  <p>Réservations : 3 unités</p>
                  <p>Disponible : 9 unités</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dashboard Analytics avec Underline */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Dashboard Analytics (Underline variant)
        </h3>
        <Tabs defaultValue="overview">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger variant="underline" value="sales">
              Ventes
            </TabsTrigger>
            <TabsTrigger variant="underline" value="inventory">
              Inventaire
            </TabsTrigger>
            <TabsTrigger variant="underline" value="customers">
              Clients
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Revenus du mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">45 230€</p>
                  <p className="text-sm text-green-600">
                    +12.5% vs mois dernier
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">127</p>
                  <p className="text-sm text-green-600">
                    +8.3% vs mois dernier
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Panier moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">356€</p>
                  <p className="text-sm text-red-600">-3.2% vs mois dernier</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="sales">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Analyse des ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Graphiques et statistiques de ventes détaillées
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="inventory">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>État de l&apos;inventaire</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Analyse stock et alertes
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="customers">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Analyse clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Segmentation et comportement clients
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};
