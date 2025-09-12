'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react'
import { QuotitesTable } from './quotites-table'
import { QuotitesFormInline } from './quotites-form-inline'
import { QuotitesProgressBar } from './quotites-progress-bar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ==============================================================================
// TYPES
// ==============================================================================

export interface QuotiteWithProprietaire {
  id: string
  proprietaire_id: string
  propriete_id: string
  pourcentage: number
  date_acquisition?: string
  prix_acquisition?: number
  frais_acquisition?: number
  notes?: string
  is_gerant: boolean
  created_at: string
  updated_at: string
  proprietaire: {
    id: string
    nom: string
    prenom?: string
    type: 'physique' | 'morale'
    email?: string
  }
}

export interface QuotitesStats {
  nombre_proprietaires: number
  total_pourcentage: number
  pourcentage_disponible: number
  statut_quotites: 'vide' | 'partiel' | 'complet' | 'erreur'
}

interface QuotitesManagerV2Props {
  proprieteId: string
  initialQuotites: QuotiteWithProprietaire[]
  initialStats?: QuotitesStats
  className?: string
  proprieteFinancials?: {
    prix_achat?: number
    frais_notaire?: number
    frais_annexes?: number
  }
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuotitesManagerV2({ 
  proprieteId, 
  initialQuotites,
  initialStats,
  className,
  proprieteFinancials
}: QuotitesManagerV2Props) {
  const [quotites, setQuotites] = useState<QuotiteWithProprietaire[]>(initialQuotites)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Calculate stats from current quotites
  const stats: QuotitesStats = {
    nombre_proprietaires: quotites.length,
    total_pourcentage: quotites.reduce((sum, q) => sum + q.pourcentage, 0),
    pourcentage_disponible: 100 - quotites.reduce((sum, q) => sum + q.pourcentage, 0),
    statut_quotites: (() => {
      const total = quotites.reduce((sum, q) => sum + q.pourcentage, 0)
      if (total === 0) return 'vide'
      if (total === 100) return 'complet'
      if (total > 100) return 'erreur'
      return 'partiel'
    })()
  }

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleQuotiteAdded = (newQuotite: QuotiteWithProprietaire) => {
    setQuotites(prev => [...prev, newQuotite])
    setShowAddForm(false)
    toast.success('Propriétaire ajouté avec succès')
  }

  const handleQuotiteUpdated = (updatedQuotite: QuotiteWithProprietaire) => {
    setQuotites(prev => prev.map(q => 
      q.id === updatedQuotite.id ? updatedQuotite : q
    ))
    toast.success('Quotité mise à jour avec succès')
  }

  const handleQuotiteDeleted = (quotiteId: string) => {
    setQuotites(prev => prev.filter(q => q.id !== quotiteId))
    toast.success('Propriétaire retiré avec succès')
  }

  // ==============================================================================
  // RENDER HELPERS
  // ==============================================================================

  const getStatusIcon = () => {
    switch (stats.statut_quotites) {
      case 'complet':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'erreur':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'partiel':
        return <AlertTriangle className="w-4 h-4 text-[#D4841A]" />
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    const { statut_quotites, total_pourcentage } = stats

    switch (statut_quotites) {
      case 'complet':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            100% complet
          </Badge>
        )
      case 'erreur':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur: {total_pourcentage}%
          </Badge>
        )
      case 'partiel':
        return (
          <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {total_pourcentage}% attribués
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            Aucun propriétaire
          </Badge>
        )
    }
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Stats */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              {getStatusIcon()}
              Gestion des quotités
            </CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les propriétaires et leurs parts de détention
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <QuotitesProgressBar
            totalPourcentage={stats.total_pourcentage}
            statutQuotites={stats.statut_quotites}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.nombre_proprietaires}
              </div>
              <div className="text-sm text-gray-600">
                Propriétaire{stats.nombre_proprietaires > 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#D4841A]">
                {stats.total_pourcentage}%
              </div>
              <div className="text-sm text-gray-600">
                Attribués
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                stats.pourcentage_disponible > 0 ? "text-green-600" : "text-gray-400"
              )}>
                {stats.pourcentage_disponible}%
              </div>
              <div className="text-sm text-gray-600">
                Disponibles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-white border border-[#D4841A]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-[#D4841A]" />
              Ajouter un propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuotitesFormInline
              proprieteId={proprieteId}
              quotitesRestantes={stats.pourcentage_disponible}
              onSuccess={handleQuotiteAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Quotites Table or Empty State */}
      {quotites.length > 0 ? (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Liste des propriétaires
              </CardTitle>
              {!showAddForm && stats.pourcentage_disponible > 0 && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <QuotitesTable
              quotites={quotites}
              onUpdate={handleQuotiteUpdated}
              onDelete={handleQuotiteDeleted}
              quotitesRestantes={stats.pourcentage_disponible}
              proprieteFinancials={proprieteFinancials}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Aucun propriétaire associé
                </h3>
                <p className="text-gray-600 mt-1">
                  Commencez par ajouter un propriétaire à cette propriété
                </p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un propriétaire
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}