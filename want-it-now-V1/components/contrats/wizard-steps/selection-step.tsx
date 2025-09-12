'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, 
  MapPin, 
  Home, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

// Types et actions
import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'
import { getProprietesForSelection, getUnitesForProperty } from '@/actions/contrats'

interface Propriete {
  id: string
  nom: string
  adresse_complete: string
  type: string
  superficie_m2?: number
  nb_pieces?: number
  a_unites: boolean
  unites_count?: number
}

interface Unite {
  id: string
  nom: string
  numero: string
  description: string
  superficie_m2?: number
  nb_pieces?: number
  type: string
}

interface SelectionStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function SelectionStep({ form, onNext, onPrev, isFirst, isLast }: SelectionStepProps) {
  const [proprietes, setProprietes] = useState<Propriete[]>([])
  const [unites, setUnites] = useState<Unite[]>([])
  const [selectedPropriete, setSelectedPropriete] = useState<Propriete | null>(null)
  const [selectedUnite, setSelectedUnite] = useState<Unite | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const watchedProprieteId = form.watch('propriete_id')
  const watchedUniteId = form.watch('unite_id')

  // Charger les propriétés au montage
  useEffect(() => {
    const loadProprietes = async () => {
      setLoading(true)
      try {
        const result = await getProprietesForSelection()
        if (result.success) {
          setProprietes(result.data || [])
        }
      } catch (error) {
        console.error('Erreur chargement propriétés:', error)
        toast.error('Erreur lors du chargement des propriétés')
      } finally {
        setLoading(false)
      }
    }

    loadProprietes()
  }, [])

  // Charger les unités quand une propriété est sélectionnée
  useEffect(() => {
    const loadUnites = async (proprieteId: string) => {
      if (!proprieteId) return
      
      try {
        const result = await getUnitesForProperty(proprieteId)
        if (result.success) {
          setUnites(result.data || [])
        }
      } catch (error) {
        console.error('Erreur chargement unités:', error)
        toast.error('Erreur lors du chargement des unités')
      }
    }

    if (watchedProprieteId) {
      loadUnites(watchedProprieteId)
      const propriete = proprietes.find(p => p.id === watchedProprieteId)
      setSelectedPropriete(propriete || null)
    } else {
      setUnites([])
      setSelectedPropriete(null)
    }
  }, [watchedProprieteId, proprietes])

  // Auto-fill des informations quand une sélection est faite
  useEffect(() => {
    if (selectedPropriete || selectedUnite) {
      autoFillInformation()
    }
  }, [selectedPropriete, selectedUnite])

  // Auto-fill logic
  const autoFillInformation = () => {
    if (selectedUnite && selectedPropriete) {
      // Unité sélectionnée -> utiliser les infos de l'unité + propriété
      form.setValue('bien_adresse_complete', selectedPropriete.adresse_complete)
      form.setValue('bien_type', selectedUnite.type || selectedPropriete.type)
      form.setValue('bien_superficie', selectedUnite.superficie_m2?.toString() || selectedPropriete.superficie_m2?.toString() || '')
      form.setValue('bien_nombre_pieces', selectedUnite.nb_pieces?.toString() || selectedPropriete.nb_pieces?.toString() || '')
      
      // Clear propriete_id si on sélectionne une unité (business rule: exclusif)
      form.setValue('propriete_id', undefined)
      
      toast.success(`Informations auto-remplies depuis l'unité ${selectedUnite.nom}`, {
        duration: 3000,
        description: 'Les détails du bien ont été automatiquement complétés'
      })
    } else if (selectedPropriete && !selectedUnite) {
      // Propriété sélectionnée -> utiliser les infos de la propriété
      form.setValue('bien_adresse_complete', selectedPropriete.adresse_complete)
      form.setValue('bien_type', selectedPropriete.type)
      form.setValue('bien_superficie', selectedPropriete.superficie_m2?.toString() || '')
      form.setValue('bien_nombre_pieces', selectedPropriete.nb_pieces?.toString() || '')
      
      // Clear unite_id si on sélectionne une propriété (business rule: exclusif) 
      form.setValue('unite_id', undefined)
      
      toast.success(`Informations auto-remplies depuis la propriété ${selectedPropriete.nom}`, {
        duration: 3000,
        description: 'Les détails du bien ont été automatiquement complétés'
      })
    }
  }

  // Filtrer les propriétés par recherche
  const filteredProprietes = proprietes.filter(propriete =>
    propriete.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    propriete.adresse_complete.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Validation de l'étape
  const canProceed = watchedProprieteId || watchedUniteId

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            Sélection Propriété ou Unité
          </CardTitle>
          <CardDescription>
            Choisissez la propriété ou l'unité concernée par ce contrat. 
            Les informations seront automatiquement remplies.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Business Rule Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Règle métier :</strong> Un contrat doit être lié soit à une propriété 
          (si pas d'unités) soit à une unité spécifique (si propriété divisée en unités), 
          mais jamais aux deux simultanément.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sélection Propriété */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-[#D4841A]" />
              Propriétés Disponibles
            </CardTitle>
            <CardDescription>
              Sélectionner une propriété entière (si pas d'unités)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou adresse..."
                className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Liste propriétés */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : filteredProprietes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune propriété trouvée
                </div>
              ) : (
                filteredProprietes.map((propriete) => (
                  <button
                    key={propriete.id}
                    type="button"
                    onClick={() => {
                      form.setValue('propriete_id', propriete.id)
                      form.setValue('unite_id', undefined) // Reset unité
                      setSelectedUnite(null)
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                      watchedProprieteId === propriete.id
                        ? 'border-[#D4841A] bg-[#D4841A]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{propriete.nom}</h3>
                          {watchedProprieteId === propriete.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#D4841A]" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {propriete.adresse_complete}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {propriete.type}
                          </Badge>
                          {propriete.superficie_m2 && (
                            <span className="text-xs text-gray-500">
                              {propriete.superficie_m2}m²
                            </span>
                          )}
                          {propriete.nb_pieces && (
                            <span className="text-xs text-gray-500">
                              {propriete.nb_pieces} pièces
                            </span>
                          )}
                          {propriete.a_unites && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                              {propriete.unites_count || 0} unités
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {propriete.a_unites && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="w-3 h-3" />
                          Cette propriété a des unités. Le contrat doit être créé sur une unité spécifique.
                        </div>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sélection Unité */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5 text-[#2D5A27]" />
              Unités de la Propriété
            </CardTitle>
            <CardDescription>
              Sélectionner une unité spécifique (si propriété divisée)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPropriete ? (
              <div className="text-center py-8 text-gray-500">
                Sélectionnez d'abord une propriété pour voir ses unités
              </div>
            ) : !selectedPropriete.a_unites ? (
              <div className="text-center py-8 text-gray-500">
                Cette propriété n'a pas d'unités divisées
              </div>
            ) : unites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune unité disponible pour cette propriété
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unites.map((unite) => (
                  <button
                    key={unite.id}
                    type="button"
                    onClick={() => {
                      form.setValue('unite_id', unite.id)
                      form.setValue('propriete_id', undefined) // Reset propriété
                      setSelectedUnite(unite)
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                      watchedUniteId === unite.id
                        ? 'border-[#2D5A27] bg-[#2D5A27]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {unite.nom}
                            {unite.numero && ` (${unite.numero})`}
                          </h3>
                          {watchedUniteId === unite.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#2D5A27]" />
                          )}
                        </div>
                        {unite.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {unite.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {unite.type}
                          </Badge>
                          {unite.superficie_m2 && (
                            <span className="text-xs text-gray-500">
                              {unite.superficie_m2}m²
                            </span>
                          )}
                          {unite.nb_pieces && (
                            <span className="text-xs text-gray-500">
                              {unite.nb_pieces} pièces
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé sélection */}
      {(selectedPropriete || selectedUnite) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sélection Confirmée
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUnite && selectedPropriete ? (
              <div>
                <p className="font-medium text-green-800">
                  Unité : {selectedUnite.nom} 
                  {selectedUnite.numero && ` (${selectedUnite.numero})`}
                </p>
                <p className="text-sm text-green-700">
                  Propriété : {selectedPropriete.nom}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Adresse : {selectedPropriete.adresse_complete}
                </p>
              </div>
            ) : selectedPropriete ? (
              <div>
                <p className="font-medium text-green-800">
                  Propriété : {selectedPropriete.nom}
                </p>
                <p className="text-xs text-green-600">
                  Adresse : {selectedPropriete.adresse_complete}
                </p>
              </div>
            ) : null}
            
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-sm text-green-700">
                ✓ Les informations du bien seront automatiquement remplies dans les étapes suivantes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation supprimée - utilisation des boutons flottants globaux */}
    </div>
  )
}