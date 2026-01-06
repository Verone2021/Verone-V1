'use client';

/**
 * Page Configuration LinkMe
 * Configuration centralisée avec onglets:
 * - Pages LinkMe (Globe 3D, etc.)
 * - Paramètres (Emails, Plateforme)
 *
 * @module LinkMeConfigurationPage
 * @since 2025-12-01
 * @updated 2026-01-06 - Ajout onglet Pages
 */

import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { FileText, Settings, Globe } from 'lucide-react';

import { ConfigurationSection } from '../components/ConfigurationSection';
import { PagesConfigurationSection } from '../components/PagesConfigurationSection';

export default function LinkMeConfigurationPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState('pages');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Configuration LinkMe
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres de la plateforme LinkMe
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="underline" className="w-full justify-start border-b">
          <TabsTrigger value="pages" variant="underline">
            <Globe className="h-4 w-4 mr-2" />
            Pages LinkMe
          </TabsTrigger>
          <TabsTrigger value="settings" variant="underline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="other" variant="underline" disabled>
            <FileText className="h-4 w-4 mr-2" />
            Autres
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
              Bientôt
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Pages LinkMe */}
        <TabsContent value="pages" className="mt-6">
          <PagesConfigurationSection />
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="mt-6">
          <ConfigurationSection />
        </TabsContent>

        {/* Onglet Autres (placeholder) */}
        <TabsContent value="other" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Fonctionnalité à venir
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
