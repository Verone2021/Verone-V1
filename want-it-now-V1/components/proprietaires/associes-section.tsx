'use client'

import { useState, useOptimistic } from 'react'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AssocieForm } from './associe-form'
import { formatNombreParts } from '@/lib/utils/proprietaires'

// ==============================================================================
// TYPES
// ==============================================================================

interface Associe {
  id: string
  type: 'physique' | 'morale'
  nom: string
  prenom?: string
  nombre_parts: number
}

interface AssociesSectionProps {
  proprietaireId: string
  initialAssocies: Associe[]
  nombrePartsTotal: number
  partsRestantes: number
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function AssociesSection({
  proprietaireId,
  initialAssocies,
  nombrePartsTotal,
  partsRestantes: initialPartsRestantes
}: AssociesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [partsRestantes, setPartsRestantes] = useState(initialPartsRestantes)
  
  // Optimistic state pour les associés
  const [optimisticAssocies, addOptimisticAssocie] = useOptimistic(
    initialAssocies,
    (state, newAssocie: Associe) => [...state, newAssocie]
  )

  const handleAssocieAdded = () => {
    // Fermer le formulaire immédiatement pour une meilleure UX
    setShowForm(false)
    // Le router.refresh() est géré par AssocieForm avec un léger délai
  }

  const formatAssocieNom = (associe: Associe) => {
    return associe.type === 'physique' 
      ? `${associe.prenom || ''} ${associe.nom}`.trim()
      : associe.nom
  }

  const calculatePourcentage = (nombreParts: number) => {
    if (!nombrePartsTotal || nombrePartsTotal === 0) return '0.0'
    return ((nombreParts / nombrePartsTotal) * 100).toFixed(1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Associés ({optimisticAssocies.length})</span>
          </CardTitle>
          {!showForm && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowForm(true)}
              disabled={partsRestantes <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="mb-6">
            <AssocieForm
              proprietaireId={proprietaireId}
              partsRestantes={partsRestantes}
              onSuccess={handleAssocieAdded}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Liste des associés */}
        {optimisticAssocies.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">Aucun associé enregistré</p>
            {!showForm && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowForm(true)}
                disabled={partsRestantes <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un associé
              </Button>
            )}
            {partsRestantes <= 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Toutes les parts ont été attribuées
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {optimisticAssocies.map((associe, index) => (
              <div 
                key={associe.id || `temp-${index}`} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatAssocieNom(associe)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNombreParts(associe.nombre_parts)} parts
                    {nombrePartsTotal > 0 && (
                      <span className="ml-1">
                        ({calculatePourcentage(associe.nombre_parts)}%)
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="outline">
                  {associe.type === 'physique' ? '👤' : '🏢'}
                </Badge>
              </div>
            ))}
            
            {/* Info sur les parts restantes */}
            {partsRestantes > 0 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  {formatNombreParts(partsRestantes)} parts restantes
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}