'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Building, Calendar, Euro, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { contratMinimalSchema, stepValidationSchemas, type ContratMinimalFormData } from '@/lib/validations/contrats-minimal'
import { createContrat } from '@/actions/contrats'
import { useToast } from '@/hooks/use-toast'

interface ContratWizardMinimalProps {
  proprietes: Array<{
    id: string
    nom: string
    type: string
    ville: string
    pays: string
    organisation_id: string
    organisations: {
      id: string
      nom: string
      pays: string
    }
  }>
  unites?: Array<{
    id: string
    nom: string
    numero: string
    propriete_id: string
  }>
}

export function ContratWizardMinimal({ 
  proprietes, 
  unites = [] 
}: ContratWizardMinimalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ContratMinimalFormData>({
    resolver: zodResolver(contratMinimalSchema),
    defaultValues: {
      organisation_id: '', // Sera défini automatiquement lors de la sélection de propriété
      type_contrat: 'variable',
      meuble: false,
      autorisation_sous_location: true,
      besoin_renovation: false,
      commission_pourcentage: '10',
      usage_proprietaire_jours_max: '60'
    }
  })

  const { handleSubmit, watch, setValue, formState: { errors }, trigger } = form
  const watchedValues = watch()

  const steps = [
    {
      number: 1,
      title: "Sélection Propriété/Unité",
      description: "Choisissez la propriété ou l'unité pour ce contrat",
      icon: Building
    },
    {
      number: 2,
      title: "Informations Générales",
      description: "Dates et caractéristiques du contrat",
      icon: Calendar
    },
    {
      number: 3,
      title: "Conditions Financières",
      description: "Commission et usage propriétaire",
      icon: Euro
    }
  ]

  const validateCurrentStep = async () => {
    const stepSchema = stepValidationSchemas[currentStep as keyof typeof stepValidationSchemas]
    if (stepSchema) {
      const result = await trigger(Object.keys(stepSchema.shape) as any)
      return result
    }
    return true
  }

  const nextStep = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: ContratMinimalFormData) => {
    try {
      setIsSubmitting(true)
      
      const result = await createContrat(data)
      
      if (result.success) {
        showToast("Contrat créé avec succès", "success")
        router.push('/contrats')
      } else {
        showToast(result.error || "Une erreur est survenue lors de la création du contrat.", "error")
      }
    } catch (error) {
      console.error('Erreur création contrat:', error)
      showToast("Une erreur inattendue est survenue.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep1 = () => {
    console.log('🎯 [WIZARD] Render Step1 - Props reçues:', {
      proprietesCount: proprietes?.length || 0,
      uniteCount: unites?.length || 0,
      firstPropriete: proprietes?.[0]
    })
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propriete_id">Propriété</Label>
          <Select 
            value={watchedValues.propriete_id || undefined} 
            onValueChange={(value) => {
              console.log('📝 [WIZARD] Sélection propriété:', value)
              setValue('propriete_id', value)
              setValue('unite_id', null) // Reset unité si propriété change
              
              // Déduire automatiquement l'organisation_id de la propriété sélectionnée
              const selectedPropriete = proprietes.find(p => p.id === value)
              if (selectedPropriete) {
                console.log('🏢 [WIZARD] Organisation déduite:', selectedPropriete.organisation_id)
                setValue('organisation_id', selectedPropriete.organisation_id)
              }
            }}
          >
            <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
              <SelectValue placeholder="Sélectionnez une propriété" />
            </SelectTrigger>
            <SelectContent>
              {proprietes && proprietes.length > 0 ? proprietes.map((propriete) => {
                console.log('🏠 [WIZARD] Render propriété:', {
                  id: propriete.id,
                  nom: propriete.nom,
                  ville: propriete.ville,
                  pays: propriete.pays,
                  hasOrganisations: !!propriete.organisations,
                  organisationStructure: propriete.organisations
                })
                
                return (
                  <SelectItem key={propriete.id} value={propriete.id}>
                    <span className="font-medium">{propriete.nom}</span>
                    <span className="text-sm text-gray-500 block">
                      {propriete.ville} • {propriete.organisations?.nom} ({propriete.pays})
                    </span>
                  </SelectItem>
                )
              }) : (
                <SelectItem value="no-properties" disabled>
                  Aucune propriété disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.propriete_id && (
            <p className="text-sm text-red-600">{errors.propriete_id.message}</p>
          )}
        </div>
        </div>

        {watchedValues.propriete_id && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Propriété sélectionnée :</strong>
              {(() => {
                const selectedProp = proprietes.find(p => p.id === watchedValues.propriete_id)
                return selectedProp ? (
                  <span className="ml-1">
                    {selectedProp.nom} • Organisation : {selectedProp.organisations.nom} ({selectedProp.pays})
                  </span>
                ) : null
              })()}
            </AlertDescription>
          </Alert>
        )}

        {watchedValues.propriete_id && unites.filter(u => u.propriete_id === watchedValues.propriete_id).length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="unite_id">Unité (optionnel)</Label>
            <Select 
              value={watchedValues.unite_id || ''} 
              onValueChange={(value) => setValue('unite_id', value)}
            >
              <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
                <SelectValue placeholder="Sélectionnez une unité" />
              </SelectTrigger>
              <SelectContent>
                {unites
                  .filter(unite => unite.propriete_id === watchedValues.propriete_id)
                  .map((unite) => (
                    <SelectItem key={unite.id} value={unite.id}>
                      {unite.nom} - {unite.numero}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Un contrat doit être lié soit à une propriété soit à une unité, mais pas les deux.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type_contrat">Type de contrat *</Label>
          <Select 
            value={watchedValues.type_contrat} 
            onValueChange={(value: 'fixe' | 'variable') => setValue('type_contrat', value)}
          >
            <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixe">Contrat Fixe</SelectItem>
              <SelectItem value="variable">Contrat Variable</SelectItem>
            </SelectContent>
          </Select>
          {errors.type_contrat && (
            <p className="text-sm text-red-600">{errors.type_contrat.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_debut">Date de début *</Label>
          <Input
            id="date_debut"
            type="date"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('date_debut')}
          />
          {errors.date_debut && (
            <p className="text-sm text-red-600">{errors.date_debut.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_fin">Date de fin *</Label>
          <Input
            id="date_fin"
            type="date"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('date_fin')}
          />
          {errors.date_fin && (
            <p className="text-sm text-red-600">{errors.date_fin.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duree_imposee_mois">Durée imposée (mois)</Label>
          <Input
            id="duree_imposee_mois"
            type="number"
            placeholder="12"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('duree_imposee_mois')}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="meuble"
            checked={watchedValues.meuble}
            onCheckedChange={(checked) => setValue('meuble', !!checked)}
          />
          <Label htmlFor="meuble">Bien meublé</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="autorisation_sous_location"
            checked={watchedValues.autorisation_sous_location}
            onCheckedChange={(checked) => setValue('autorisation_sous_location', !!checked)}
          />
          <Label htmlFor="autorisation_sous_location">Autorisation sous-location *</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="besoin_renovation"
            checked={watchedValues.besoin_renovation}
            onCheckedChange={(checked) => setValue('besoin_renovation', !!checked)}
          />
          <Label htmlFor="besoin_renovation">Besoin de rénovation</Label>
        </div>
      </div>

      {watchedValues.besoin_renovation && (
        <div className="space-y-2">
          <Label htmlFor="deduction_futurs_loyers">Déduction futurs loyers (€)</Label>
          <Input
            id="deduction_futurs_loyers"
            type="number"
            step="0.01"
            placeholder="5000.00"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('deduction_futurs_loyers')}
          />
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="commission_pourcentage">Commission (%) *</Label>
          <Input
            id="commission_pourcentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('commission_pourcentage')}
          />
          {errors.commission_pourcentage && (
            <p className="text-sm text-red-600">{errors.commission_pourcentage.message}</p>
          )}
          {watchedValues.type_contrat === 'variable' && (
            <p className="text-xs text-gray-500">
              Commission fixée à 10% pour les contrats variables
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage_proprietaire_jours_max">Usage propriétaire max (jours/an) *</Label>
          <Input
            id="usage_proprietaire_jours_max"
            type="number"
            min="0"
            max="365"
            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            {...form.register('usage_proprietaire_jours_max')}
          />
          {errors.usage_proprietaire_jours_max && (
            <p className="text-sm text-red-600">{errors.usage_proprietaire_jours_max.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Maximum 60 jours par an selon les règles Want It Now
          </p>
        </div>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          <strong>Récapitulatif :</strong><br />
          Type : {watchedValues.type_contrat}<br />
          Période : {watchedValues.date_debut} au {watchedValues.date_fin}<br />
          Commission : {watchedValues.commission_pourcentage}%<br />
          Usage propriétaire : {watchedValues.usage_proprietaire_jours_max} jours/an
        </AlertDescription>
      </Alert>
    </div>
  )

  const currentStepData = steps[currentStep - 1]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${currentStep >= step.number 
                  ? 'bg-[#D4841A] border-[#D4841A] text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                <step.icon className="w-5 h-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-24 h-0.5 mx-4 transition-colors
                  ${currentStep > step.number ? 'bg-[#D4841A]' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <currentStepData.icon className="w-5 h-5 text-[#D4841A]" />
              Étape {currentStep} / 3
            </CardTitle>
          </CardHeader>

          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white"
              >
                {isSubmitting ? 'Création...' : 'Créer le contrat'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}