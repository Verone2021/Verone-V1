'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  Users, 
  Calculator, 
  CheckCircle,
  Plus,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import { AssociesList } from './associes-list'
import { AssocieForm } from './associe-form'
import { AssocieEditModal } from './associe-edit-modal'
import {
  formatNombreParts,
  formatCapitalSocial,
  formatAssocieNomComplet,
} from '@/lib/utils/proprietaires'
import { type Proprietaire, type Associe } from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface AssociesManagerCompleteProps {
  proprietaire: Proprietaire
  associes: Associe[]
  className?: string
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export function AssociesManagerComplete({
  proprietaire,
  associes = [],
  className = '',
}: AssociesManagerCompleteProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editingAssocie, setEditingAssocie] = useState<Associe | null>(null)

  // ==============================================================================
  // CALCULATIONS
  // ==============================================================================

  const stats = useMemo(() => {
    const totalPartsAttribuees = associes.reduce((sum, a) => sum + a.nombre_parts, 0)
    const partsRestantes = (proprietaire.nombre_parts_total || 0) - totalPartsAttribuees
    const percentageAlloue = proprietaire.nombre_parts_total 
      ? (totalPartsAttribuees / proprietaire.nombre_parts_total) * 100
      : 0

    const capitalParPart = proprietaire.capital_social && proprietaire.nombre_parts_total
      ? proprietaire.capital_social / proprietaire.nombre_parts_total
      : 0

    const capitalAlloue = capitalParPart * totalPartsAttribuees

    return {
      totalPartsAttribuees,
      partsRestantes,
      percentageAlloue,
      capitalAlloue,
      capitalParPart,
      isComplete: partsRestantes === 0,
      hasOverflow: partsRestantes < 0,
      nombreAssocies: associes.length,
    }
  }, [associes, proprietaire.capital_social, proprietaire.nombre_parts_total])

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleFormSuccess = () => {
    setShowForm(false)
    router.refresh()
  }

  const handleAssocieDeleted = () => {
    router.refresh()
  }

  const handleAssocieEdit = (associe: Associe) => {
    setEditingAssocie(associe)
  }

  const handleEditModalClose = () => {
    setEditingAssocie(null)
  }

  const handleEditModalSuccess = () => {
    setEditingAssocie(null)
    router.refresh()
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const renderKPICards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Capital total */}
      <KPICard
        title="Capital social"
        value={formatCapitalSocial(proprietaire.capital_social)}
        variant="copper"
        layout="vertical"
        icon={<TrendingUp className="w-5 h-5" />}
        className="h-26"
      />

      {/* Parts attribuées */}
      <KPICard
        title="Parts attribuées"
        value={`${stats.percentageAlloue.toFixed(1)}%`}
        subtitle={`${formatNombreParts(stats.totalPartsAttribuees)} / ${formatNombreParts(proprietaire.nombre_parts_total)}`}
        variant={stats.hasOverflow ? "destructive" : stats.isComplete ? "success" : "info"}
        layout="vertical"
        icon={<Calculator className="w-5 h-5" />}
        className="h-26"
      />

      {/* Parts restantes */}
      <KPICard
        title="Parts restantes"
        value={formatNombreParts(Math.abs(stats.partsRestantes))}
        subtitle={stats.hasOverflow ? "Dépassement!" : stats.isComplete ? "Complet" : "Disponibles"}
        variant={stats.hasOverflow ? "destructive" : stats.isComplete ? "success" : "warning"}
        layout="vertical"
        icon={<BarChart3 className="w-5 h-5" />}
        className="h-26"
      />

      {/* Nombre d'associés */}
      <KPICard
        title="Associés"
        value={stats.nombreAssocies.toString()}
        subtitle={`${stats.nombreAssocies === 0 ? 'Aucun' : stats.nombreAssocies === 1 ? 'associé' : 'associés'}`}
        variant="info"
        layout="vertical"
        icon={<Users className="w-5 h-5" />}
        className="h-26"
      />
    </div>
  )

  const renderQuickStats = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-500">Répartition: </span>
              <span className="font-medium">
                {stats.percentageAlloue.toFixed(1)}% du capital alloué
              </span>
            </div>
            {stats.capitalAlloue > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Valeur: </span>
                <span className="font-medium">
                  {formatCapitalSocial(stats.capitalAlloue)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {stats.isComplete && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complet
              </Badge>
            )}
            {stats.hasOverflow && (
              <Badge variant="destructive">
                Dépassement
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stats.hasOverflow 
                  ? 'bg-red-500'
                  : stats.isComplete 
                    ? 'bg-green-500'
                    : 'bg-brand-copper'
              }`}
              style={{ 
                width: `${Math.min(100, Math.max(0, stats.percentageAlloue))}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPI Cards */}
      {renderKPICards()}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Gestion des associés</span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {!showForm && stats.partsRestantes > 0 && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="gradient-copper text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un associé
                </Button>
              )}
              
              {!showForm && stats.partsRestantes <= 0 && stats.nombreAssocies > 0 && (
                <Badge variant={stats.hasOverflow ? "destructive" : "secondary"}>
                  {stats.hasOverflow ? "Capital dépassé" : "Capital complet"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Form d'ajout */}
          {showForm && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <AssocieForm
                proprietaireId={proprietaire.id}
                partsRestantes={Math.max(0, stats.partsRestantes)}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Tabs pour la vue */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Gestion détaillée</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {renderQuickStats()}
              
              {associes.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun associé
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Cette personne morale n'a pas encore d'associés. 
                    Ajoutez des associés pour répartir le capital social.
                  </p>
                  {!showForm && (
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="gradient-copper text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le premier associé
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {associes.map((associe) => {
                    const percentage = proprietaire.nombre_parts_total
                      ? (associe.nombre_parts / proprietaire.nombre_parts_total) * 100
                      : 0

                    return (
                      <div 
                        key={associe.id} 
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {associe.type === 'physique' ? (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatAssocieNomComplet(associe)}
                            </p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span>{formatNombreParts(associe.nombre_parts)} parts</span>
                              <span>•</span>
                              <span className="font-medium text-brand-copper">
                                {percentage.toFixed(1)}%
                              </span>
                              {stats.capitalParPart > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {formatCapitalSocial(associe.nombre_parts * stats.capitalParPart)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge variant="outline">
                          {associe.type === 'physique' ? '👤 Physique' : '🏢 Morale'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              <AssociesList
                proprietaire={proprietaire}
                associes={associes}
                onAssocieDeleted={handleAssocieDeleted}
                onAssocieEdit={handleAssocieEdit}
                showQuickActions={true}
                showStats={false}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal d'édition d'associé */}
      {editingAssocie && (
        <AssocieEditModal
          associe={editingAssocie}
          partsRestantes={stats.partsRestantes}
          isOpen={!!editingAssocie}
          onClose={handleEditModalClose}
          onSuccess={handleEditModalSuccess}
        />
      )}
    </div>
  )
}