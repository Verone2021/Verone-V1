'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Propriete, type ProprieteQuotite } from '@/lib/validations/proprietes'
import { ProprieteInfoSection } from './sections/propriete-info-section'
import { ProprieteLocationSection } from './sections/propriete-location-section'
import { ProprieteCaracteristiquesSection } from './sections/propriete-caracteristiques-section'
import { ProprieteTarifsSection } from './sections/propriete-tarifs-section'
import { ProprieteQuotitesManagement } from './sections/propriete-quotites-management'
import { ProprietePhotosSection } from './sections/propriete-photos-section'
import { ProprieteUnitesSection } from './sections/propriete-unites-section'
import { ProprieteActionsSection } from './sections/propriete-actions-section'
import {
  Info,
  MapPin,
  Home,
  Euro,
  Users,
  Camera,
  Building2,
  Settings
} from 'lucide-react'

interface ProprieteTabsProps {
  propriete: Propriete
  stats: {
    quotites_count: number
    quotites_total: number
    photos_count: number
    unites_count?: number
    unites_louees?: number
  }
  isAdmin: boolean
  isSuperAdmin: boolean
  quotites: ProprieteQuotite[]
}

export function ProprieteTabs({
  propriete,
  stats,
  isAdmin,
  isSuperAdmin,
  quotites
}: ProprieteTabsProps) {
  const [activeTab, setActiveTab] = useState('informations')

  // Determine which tabs to show
  const showUnites = propriete.a_unites
  const showActions = isAdmin || isSuperAdmin

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <TabsTrigger value="informations" className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">Informations</span>
        </TabsTrigger>
        
        <TabsTrigger value="localisation" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">Localisation</span>
        </TabsTrigger>
        
        <TabsTrigger value="caracteristiques" className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Caractéristiques</span>
        </TabsTrigger>
        
        <TabsTrigger value="tarifs" className="flex items-center gap-2">
          <Euro className="w-4 h-4" />
          <span className="hidden sm:inline">Tarifs</span>
        </TabsTrigger>
        
        <TabsTrigger value="quotites" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Quotités</span>
          {stats.quotites_count > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-copper text-white rounded-full">
              {stats.quotites_total}%
            </span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="photos" className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Photos</span>
          {stats.photos_count > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-green text-white rounded-full">
              {stats.photos_count}
            </span>
          )}
        </TabsTrigger>
        
        {showUnites && (
          <TabsTrigger value="unites" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Unités</span>
            {stats.unites_count && stats.unites_count > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {stats.unites_count}
              </span>
            )}
          </TabsTrigger>
        )}
        
        {showActions && (
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="informations" className="space-y-6">
        <ProprieteInfoSection propriete={propriete} />
      </TabsContent>

      <TabsContent value="localisation" className="space-y-6">
        <ProprieteLocationSection propriete={propriete} />
      </TabsContent>

      <TabsContent value="caracteristiques" className="space-y-6">
        <ProprieteCaracteristiquesSection propriete={propriete} />
      </TabsContent>

      <TabsContent value="tarifs" className="space-y-6">
        <ProprieteTarifsSection propriete={propriete} />
      </TabsContent>

      <TabsContent value="quotites" className="space-y-6">
        <ProprieteQuotitesManagement 
          proprieteId={propriete.id} 
          initialQuotites={quotites}
          quotitesTotal={stats.quotites_total}
          isAdmin={isAdmin}
          proprieteNom={propriete.nom}
        />
      </TabsContent>

      <TabsContent value="photos" className="space-y-6">
        <ProprietePhotosSection 
          proprieteId={propriete.id}
          isAdmin={isAdmin}
        />
      </TabsContent>

      {showUnites && (
        <TabsContent value="unites" className="space-y-6">
          <ProprieteUnitesSection 
            proprieteId={propriete.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
      )}

      {showActions && (
        <TabsContent value="actions" className="space-y-6">
          <ProprieteActionsSection 
            propriete={propriete}
            hasContracts={false} // Will be updated when contracts are implemented
          />
        </TabsContent>
      )}
    </Tabs>
  )
}