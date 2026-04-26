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
  LayoutDashboard,
  ShoppingBag,
  Palette,
  FolderTree,
  Settings,
  Package,
  Users,
  Star,
  FileText,
  Tag,
  Megaphone,
} from 'lucide-react';

// Local Components
import { CategoriesSection } from './components/CategoriesSection';
import { ClientsSection } from './components/ClientsSection';
import { CMSSection } from './components/CMSSection';
import { CmsPagesSection } from './components/CmsPagesSection';
import { CollectionsSection } from './components/CollectionsSection';
import { ConfigurationSection } from './components/ConfigurationSection';
import { DashboardSection } from './components/DashboardSection';
import { NewsletterSection } from './components/NewsletterSection';
import { OrdersSection } from './components/OrdersSection';
import { ProductsSection } from './components/ProductsSection';
import { AmbassadorsSection } from './components/AmbassadorsSection';
import { PromoCodesSection } from './components/PromoCodesSection';
import { ReviewsSection } from './components/ReviewsSection';

/**
 * Page Canal Site Internet - Back Office CMS
 *
 * Sections (11 onglets) :
 * - Dashboard : KPIs produits, commandes, CA
 * - Produits : gestion complète (add/edit/delete + variantes)
 * - Collections : toggle visibilité collections
 * - Catégories : gestion arborescence catégories
 * - Configuration : domaine, SEO, contact
 * - Commandes : suivi commandes e-commerce
 * - Clients : clients du site
 * - Avis : modération avis produits
 * - Contenu : CMS sections + pages + newsletter
 * - Promotions : codes promo par article ou collection
 * - Ambassadeurs : programme d'affiliation B2C (cf ADR-021)
 */
export default function SiteInternetPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <TabsList className="grid grid-cols-11 w-full">
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
            <TabsTrigger value="promos" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger
              value="ambassadeurs"
              className="flex items-center gap-2"
            >
              <Megaphone className="h-4 w-4" />
              Ambassadeurs
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard operationnel */}
          <TabsContent value="dashboard" className="space-y-5">
            <DashboardSection onNavigate={setActiveTab} />
          </TabsContent>

          {/* Tab: Promotions */}
          <TabsContent value="promos" className="space-y-6">
            <PromoCodesSection />
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

          {/* Tab: Ambassadeurs */}
          <TabsContent value="ambassadeurs" className="space-y-6">
            <AmbassadorsSection />
          </TabsContent>

          {/* Tab: Contenu CMS + Pages + Newsletter */}
          <TabsContent value="contenu" className="space-y-6">
            <CMSSection />
            <CmsPagesSection />
            <NewsletterSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
