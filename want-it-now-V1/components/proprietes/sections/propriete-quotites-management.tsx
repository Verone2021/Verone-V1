'use client'

import { useState, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, UserPlus, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuotiteForm } from '../quotite-form'
import { cn } from '@/lib/utils'
import type { ProprieteQuotite } from '@/lib/validations/proprietes'

// ==============================================================================
// TYPES
// ==============================================================================

interface ProprieteQuotitesManagementProps {
  proprieteId: string
  initialQuotites: ProprieteQuotite[]
  quotitesTotal: number
  isAdmin: boolean
  proprieteNom: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function ProprieteQuotitesManagement({
  proprieteId,
  initialQuotites,
  quotitesTotal: initialQuotitesTotal,
  isAdmin,
  proprieteNom
}: ProprieteQuotitesManagementProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [quotitesRestantes, setQuotitesRestantes] = useState(100 - initialQuotitesTotal)
  
  // Optimistic state for quotités
  const [optimisticQuotites, addOptimisticQuotite] = useOptimistic(
    initialQuotites,
    (state, newQuotite: ProprieteQuotite) => [...state, newQuotite]
  )

  // Calculate current total
  const currentTotal = optimisticQuotites.reduce((sum, q) => sum + (q.pourcentage || 0), 0)
  const remaining = 100 - currentTotal

  const handleQuotiteAdded = () => {
    setShowForm(false)
    // Router refresh will be handled by QuotiteForm
    setTimeout(() => router.refresh(), 100)
  }

  const formatProprietaireNom = (quotite: ProprieteQuotite) => {
    if (!quotite.proprietaire) return 'Propriétaire inconnu'
    
    return quotite.proprietaire.type === 'physique' 
      ? `${quotite.proprietaire.prenom || ''} ${quotite.proprietaire.nom}`.trim()
      : quotite.proprietaire.nom
  }

  const getProprietaireBadge = (quotite: ProprieteQuotite) => {
    if (!quotite.proprietaire) return null
    
    return (
      <Badge variant="outline" className="ml-2">
        {quotite.proprietaire.type === 'physique' ? '👤' : '🏢'}
      </Badge>
    )
  }

  const getStatusColor = () => {
    if (currentTotal === 100) return 'text-green-600'
    if (currentTotal > 100) return 'text-red-600'
    return 'text-orange-600'
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Percent className="h-5 w-5" />
              <span>Répartition des Quotités</span>
            </CardTitle>
            {isAdmin && !showForm && remaining > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un propriétaire
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span>Répartition totale</span>
              <span className={cn('font-semibold', getStatusColor())}>
                {currentTotal}%
              </span>
            </div>
            <Progress 
              value={Math.min(currentTotal, 100)} 
              className={cn(
                'h-3',
                currentTotal === 100 && 'bg-green-100',
                currentTotal > 100 && 'bg-red-100'
              )}
            />
            {currentTotal !== 100 && (
              <p className="text-xs text-gray-500">
                {currentTotal < 100 
                  ? `Il reste ${remaining}% à attribuer`
                  : `Attention : le total dépasse 100% de ${currentTotal - 100}%`
                }
              </p>
            )}
          </div>

          {/* Status badges */}
          <div className="flex gap-2 mb-4">
            <Badge 
              variant={currentTotal === 100 ? 'default' : 'secondary'}
              className={currentTotal === 100 ? 'bg-green-600' : ''}
            >
              {optimisticQuotites.length} propriétaire{optimisticQuotites.length > 1 ? 's' : ''}
            </Badge>
            {currentTotal === 100 && (
              <Badge className="bg-green-600">
                ✓ Répartition complète
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotités List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Propriétaires ({optimisticQuotites.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add form */}
          {showForm && isAdmin && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <QuotiteForm
                proprieteId={proprieteId}
                quotitesRestantes={remaining}
                onSuccess={handleQuotiteAdded}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* List */}
          {optimisticQuotites.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">Aucun propriétaire enregistré</p>
              {isAdmin && !showForm && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier propriétaire
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {optimisticQuotites.map((quotite, index) => (
                <div 
                  key={quotite.id || `temp-${index}`} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-copper text-white flex items-center justify-center font-semibold">
                      {quotite.pourcentage}%
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center">
                        {formatProprietaireNom(quotite)}
                        {getProprietaireBadge(quotite)}
                      </p>
                      {quotite.notes && (
                        <p className="text-sm text-gray-500">{quotite.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {quotite.is_gerant && (
                      <Badge className="bg-blue-100 text-blue-700">
                        Gérant
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {quotite.pourcentage}% de {proprieteNom}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {/* Add button at the end if there's remaining */}
              {isAdmin && remaining > 0 && !showForm && (
                <div className="text-center pt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un autre propriétaire ({remaining}% restant)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick add propriétaire card */}
      {isAdmin && remaining > 0 && !showForm && optimisticQuotites.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserPlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Besoin d'ajouter rapidement un nouveau propriétaire ?
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push('/proprietaires/new')}
                >
                  Créer un nouveau propriétaire
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setShowForm(true)}
                >
                  Choisir un existant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}