'use client'

import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Building,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'

import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'

interface InformationsStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  proprietaires?: any[]
  loadingProprietaires?: boolean
}

export function InformationsStep({ form, onNext, onPrev, isFirst, isLast, proprietaires = [], loadingProprietaires = false }: InformationsStepProps) {
  const watchedTypeContrat = form.watch('type_contrat')
  const watchedDateDebut = form.watch('date_debut')
  const watchedDateFin = form.watch('date_fin')
  const watchedAutorisationSousLocation = form.watch('autorisation_sous_location')
  
  // Calculate contract duration
  const calculateDuration = () => {
    if (watchedDateDebut && watchedDateFin) {
      const debut = new Date(watchedDateDebut)
      const fin = new Date(watchedDateFin)
      const diffTime = Math.abs(fin.getTime() - debut.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffMonths = Math.floor(diffDays / 30)
      return { days: diffDays, months: diffMonths }
    }
    return null
  }

  const duration = calculateDuration()

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Informations Générales du Contrat
          </CardTitle>
          <CardDescription>
            Définissez les caractéristiques principales du contrat et les informations du bailleur
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Business Rule: Sous-location obligatoire */}
      <Alert className="border-[#D4841A]/20 bg-[#D4841A]/5">
        <AlertTriangle className="h-4 w-4 text-[#D4841A]" />
        <AlertDescription className="text-[#D4841A]">
          <strong>Règle Want It Now :</strong> L'autorisation de sous-location est 
          <strong> obligatoire</strong> pour tous les contrats de la plateforme.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations Contrat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4841A]" />
              Détails du Contrat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type de contrat */}
            <FormField
              control={form.control}
              name="type_contrat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de contrat *</FormLabel>
                  <RadixSelect onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                        <SelectValue placeholder="Choisir le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixe">Contrat Fixe</SelectItem>
                      <SelectItem value="variable">Contrat Variable (10% commission)</SelectItem>
                    </SelectContent>
                  </RadixSelect>
                  <FormDescription>
                    {field.value === 'fixe' 
                      ? 'Loyer fixe mensuel avec commission négociable'
                      : 'Commission fixe de 10% sur revenus variables'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_debut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Durée calculée */}
            {duration && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Durée calculée : {duration.days} jours ({duration.months} mois environ)
                  </span>
                </div>
              </div>
            )}

            {/* Options importantes */}
            <div className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="meuble"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Logement meublé</FormLabel>
                      <FormDescription>
                        Contrat de location meublée
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autorisation_sous_location"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#D4841A]/20 bg-[#D4841A]/5 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[#D4841A]">
                        Autorisation sous-location *
                      </FormLabel>
                      <FormDescription className="text-[#D4841A]/70">
                        Obligatoire pour Want It Now
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={true} // Always required
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="besoin_renovation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Besoin de rénovation</FormLabel>
                      <FormDescription>
                        Le bien nécessite des travaux
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Propriétaires (Auto-remplis depuis property_ownership) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-[#2D5A27]" />
              Propriétaires (Auto-remplis)
            </CardTitle>
            <CardDescription>
              Propriétaires récupérés automatiquement depuis le système de quotités
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Note : Cette section sera remplie automatiquement */}
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-900">
                    Architecture Métier Correcte
                  </p>
                  <p className="text-sm text-green-700">
                    Les informations des propriétaires sont automatiquement récupérées 
                    depuis la propriété sélectionnée à l'étape 1 via le système de quotités.
                  </p>
                  <div className="text-xs text-green-600 mt-2">
                    <strong>Logique :</strong> PROPRIETES → property_ownership → PROPRIETAIRES (avec quotités)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Affichage des propriétaires avec quotités */}
            {loadingProprietaires ? (
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-blue-800">Chargement des propriétaires...</span>
                </div>
              </div>
            ) : proprietaires.length > 0 ? (
              <div className="space-y-3">
                {proprietaires.map((prop, index) => {
                  const percentage = ((prop.quotite_numerateur / prop.quotite_denominateur) * 100).toFixed(1)
                  return (
                    <div key={index} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[#2D5A27]" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">
                              {prop.proprietaire.prenom ? `${prop.proprietaire.prenom} ${prop.proprietaire.nom}` : prop.proprietaire.nom}
                            </p>
                            <p className="text-sm text-green-700">{prop.proprietaire.type}</p>
                            {prop.proprietaire.email && (
                              <p className="text-sm text-green-600">{prop.proprietaire.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-[#2D5A27] text-white">
                            {percentage}%
                          </Badge>
                          <p className="text-xs text-green-600 mt-1">
                            {prop.quotite_numerateur}/{prop.quotite_denominateur}
                          </p>
                        </div>
                      </div>
                      
                      {/* Associés pour personnes morales */}
                      {prop.proprietaire.associes && prop.proprietaire.associes.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-[#2D5A27]/20">
                          <p className="text-xs font-medium text-green-800 mb-2">Associés :</p>
                          <div className="space-y-1">
                            {prop.proprietaire.associes.map((associe: any, assIndex: number) => (
                              <div key={assIndex} className="flex items-center justify-between text-sm">
                                <span className="text-green-700">
                                  {associe.prenom ? `${associe.prenom} ${associe.nom}` : associe.nom}
                                </span>
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  {associe.parts_sociales}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Validation total quotités */}
                <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Total quotités :</span>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 text-white">
                        {proprietaires.reduce((sum, prop) => sum + (prop.quotite_numerateur / prop.quotite_denominateur) * 100, 0).toFixed(1)}%
                      </Badge>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Sélectionnez d'abord une propriété à l'étape 1 pour voir les propriétaires
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informations bien auto-remplies */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Informations du Bien (Auto-remplies)
          </CardTitle>
          <CardDescription className="text-green-700">
            Ces informations ont été automatiquement remplies depuis votre sélection à l'étape précédente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-green-800">Adresse</Label>
              <p className="text-sm text-green-700 mt-1">
                {form.watch('bien_adresse_complete') || 'Non renseignée'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-green-800">Type de bien</Label>
              <p className="text-sm text-green-700 mt-1">
                {form.watch('bien_type') || 'Non renseigné'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-green-800">Superficie</Label>
              <p className="text-sm text-green-700 mt-1">
                {form.watch('bien_superficie') ? `${form.watch('bien_superficie')}m²` : 'Non renseignée'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-green-800">Nombre de pièces</Label>
              <p className="text-sm text-green-700 mt-1">
                {form.watch('bien_nombre_pieces') || 'Non renseigné'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation supprimée - utilisation des boutons flottants globaux */}
    </div>
  )
}