'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

// UI Components
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

// Icons
import {
  Globe,
  ArrowLeft,
  BarChart,
  ShoppingBag,
  Palette,
  FolderTree,
  Settings,
  Package,
  Users,
} from 'lucide-react';

// Local Components
import { CategoriesSection } from './components/CategoriesSection';
import { CollectionsSection } from './components/CollectionsSection';
import { ConfigurationSection } from './components/ConfigurationSection';
import { ProductsSection } from './components/ProductsSection';
import { VercelAnalyticsDashboard } from './components/VercelAnalyticsDashboard';

// Local Hooks
import { useSiteInternetConfig } from './hooks/use-site-internet-config';
import { useSiteInternetProducts } from './hooks/use-site-internet-products';
import { useVercelAnalytics } from './hooks/use-vercel-analytics';

/**
 * Page Canal Site Internet - Back Office CMS
 *
 * Sections:
 * - Dashboard: Métriques Vercel Analytics + KPI produits
 * - Produits: Gestion complète (add/edit/delete + variantes)
 * - Collections: Toggle visibilité collections
 * - Catégories: Gestion arborescence catégories
 * - Configuration: Domaine, SEO, contact, analytics
 * - Commandes: Placeholder (futur)
 * - Clients: Placeholder (futur)
 */
export default function SiteInternetPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Hooks
  const { data: _products, isLoading: _productsLoading } =
    useSiteInternetProducts();
  const { data: _config, isLoading: _configLoading } = useSiteInternetConfig();
  const { data: _analytics, isLoading: _analyticsLoading } =
    useVercelAnalytics();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={() => router.push('/canaux-vente')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </ButtonV2>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Site Internet Vérone</h1>
                <p className="text-sm text-muted-foreground">
                  E-commerce principal - Boutique en ligne
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Actif
            </Badge>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => window.open('https://verone.fr', '_blank')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Voir le site
            </ButtonV2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full flex-1 px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Navigation Tabs */}
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="produits" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="commandes" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <VercelAnalyticsDashboard />
          </TabsContent>

          {/* Tab: Produits */}
          <TabsContent value="produits" className="space-y-6">
            <ProductsSection />
          </TabsContent>

          {/* Tab: Collections */}
          <TabsContent value="collections" className="space-y-6">
            <CollectionsSection />
          </TabsContent>

          {/* Tab: Catégories */}
          <TabsContent value="categories" className="space-y-6">
            <CategoriesSection />
          </TabsContent>

          {/* Tab: Configuration */}
          <TabsContent value="config" className="space-y-6">
            <ConfigurationSection />
          </TabsContent>

          {/* Tab: Commandes (Placeholder) */}
          <TabsContent value="commandes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Commandes Site Internet</CardTitle>
                <CardDescription>
                  Gestion des commandes e-commerce (prochainement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                    <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Gestion des Commandes
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Cette fonctionnalité sera disponible prochainement.
                  </p>
                  <Badge variant="outline">Prochainement</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Clients (Placeholder) */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clients Site Internet</CardTitle>
                <CardDescription>
                  Gestion des inscriptions et profils clients (prochainement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
                    <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Gestion des Clients
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Cette fonctionnalité sera disponible prochainement.
                  </p>
                  <Badge variant="outline">Prochainement</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
