'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

// UI Components
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

// Icons
import {
  Globe,
  ArrowLeft,
  BarChart,
  LayoutDashboard,
  ShoppingBag,
  Palette,
  FolderTree,
  Settings,
  Package,
  Users,
  Star,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

// Local Components
import { CategoriesSection } from './components/CategoriesSection';
import { ClientsSection } from './components/ClientsSection';
import { CMSSection } from './components/CMSSection';
import { CollectionsSection } from './components/CollectionsSection';
import { ConfigurationSection } from './components/ConfigurationSection';
import { OrdersSection } from './components/OrdersSection';
import { ProductsSection } from './components/ProductsSection';
import { ReviewsSection } from './components/ReviewsSection';
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
 * - Commandes: Suivi commandes e-commerce (site_orders)
 * - Clients: Clients uniques agrégés depuis site_orders
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
          <TabsList className="grid grid-cols-10 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
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
            <TabsTrigger value="avis" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avis
            </TabsTrigger>
            <TabsTrigger value="contenu" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenu
            </TabsTrigger>
            <TabsTrigger value="analytique" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytique
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard operationnel */}
          <TabsContent value="dashboard" className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Produits publies
                </p>
                <p className="text-2xl font-bold text-gray-900">18</p>
                <p className="text-xs text-gray-400">sur 231 au catalogue</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Collections
                </p>
                <p className="text-2xl font-bold text-blue-600">2</p>
                <p className="text-xs text-gray-400">actives sur le site</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Commandes site
                </p>
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-xs text-gray-400">ce mois</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  CA site
                </p>
                <p className="text-2xl font-bold text-purple-600">0 EUR</p>
                <p className="text-xs text-gray-400">ce mois</p>
              </div>
            </div>

            {/* A traiter */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-900">
                  A traiter
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                <button
                  onClick={() => setActiveTab('produits')}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-900">
                      <strong>213</strong> produits non publies sur le site
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => setActiveTab('avis')}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-900">
                      <strong>0</strong> avis en attente de moderation
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-900">
                      Configurer le domaine et le SEO
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Grille 2x2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Catalogue */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Catalogue
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('produits')}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Gerer →
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('produits')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>18 produits publies</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('collections')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>2 collections actives</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Categories et taxonomie</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Commerce */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Commerce
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('commandes')}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Voir →
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('commandes')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Commandes du site</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('clients')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Clients du site</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Contenu & SEO
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('contenu')}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Gerer →
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('contenu')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Pages CMS</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('avis')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Avis clients</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Analytique */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Performance
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('analytique')}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Voir →
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('analytique')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Web Vitals et analytique</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                  >
                    <span>Configuration site</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Analytique (ancien Dashboard) */}
          <TabsContent value="analytique" className="space-y-6">
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

          {/* Tab: Commandes */}
          <TabsContent value="commandes" className="space-y-6">
            <OrdersSection />
          </TabsContent>

          {/* Tab: Clients */}
          <TabsContent value="clients" className="space-y-6">
            <ClientsSection />
          </TabsContent>

          {/* Tab: Avis */}
          <TabsContent value="avis" className="space-y-6">
            <ReviewsSection />
          </TabsContent>

          {/* Tab: Contenu CMS */}
          <TabsContent value="contenu" className="space-y-6">
            <CMSSection />
          </TabsContent>

          {/* Tab: Promotions — accessible via Analytique > Promos */}
        </Tabs>
      </div>
    </div>
  );
}
