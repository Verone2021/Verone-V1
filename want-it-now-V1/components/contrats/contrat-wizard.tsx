'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Form } from '@/components/ui/form'
import { 
  ChevronRight, 
  ChevronLeft, 
  Building, 
  FileText, 
  Euro, 
  Shield, 
  Settings, 
  CheckCircle2,
  Save,
  Eye
} from 'lucide-react'

// Import steps
import { SelectionStep } from './wizard-steps/selection-step'
import { InformationsStep } from './wizard-steps/informations-step'
import { ConditionsStep } from './wizard-steps/conditions-step'
import { AssurancesStep } from './wizard-steps/assurances-step'
import { ClausesStep } from './wizard-steps/clauses-step'
import { RevisionStep } from './wizard-steps/revision-step'

// Import schemas and types
import { ContratFormData, ContratAvecRelations } from '@/types/contrats'
import { contratWizardSchema } from '@/lib/validations/contrats-wizard'
import { createContrat, updateContrat, saveDraft, loadDraft, detectOrganisationFromProperty } from '@/actions/contrats'
import { getProprieteQuotites } from '@/actions/proprietes'

export interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  fields: string[]
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Sélection Propriété',
    description: 'Choisir la propriété ou unité concernée',
    icon: <Building className="w-4 h-4" />,
    completed: false,
    fields: ['propriete_id', 'unite_id']
  },
  {
    id: 2,
    title: 'Informations Générales',
    description: 'Détails du contrat et propriétaires (auto-remplis)',
    icon: <FileText className="w-4 h-4" />,
    completed: false,
    fields: [
      'type_contrat', 'date_debut', 'date_fin', 'meuble', 
      'autorisation_sous_location', 'besoin_renovation'
    ]
  },
  {
    id: 3,
    title: 'Conditions Financières',
    description: 'Loyers, commissions et conditions de paiement',
    icon: <Euro className="w-4 h-4" />,
    completed: false,
    fields: [
      'commission_pourcentage', 'usage_proprietaire_jours_max'
      // loyer_mensuel_ht et charges_mensuelles sont optionnels pour l'étape 3
    ]
  },
  {
    id: 4,
    title: 'Assurances & Protection',
    description: 'Couvertures et protections requises',
    icon: <Shield className="w-4 h-4" />,
    completed: false,
    fields: [
      'attestation_assurance', 'nom_assureur', 'numero_police',
      'assurance_pertes_exploitation', 'protection_juridique'
    ]
  },
  {
    id: 5,
    title: 'Clauses & Règles Métier',
    description: 'Conditions spécifiques et contacts urgence',
    icon: <Settings className="w-4 h-4" />,
    completed: false,
    fields: [
      'conditions_sous_location', 'activites_permises',
      'contact_urgence_nom', 'contact_urgence_telephone'
    ]
  },
  {
    id: 6,
    title: 'Révision & Finalisation',
    description: 'Vérification finale et validation',
    icon: <CheckCircle2 className="w-4 h-4" />,
    completed: false,
    fields: ['notes_internes']
  }
]

interface ContratWizardProps {
  contrat?: ContratAvecRelations
  isEdit?: boolean
  draftId?: string
}

export default function ContratWizard({ contrat, isEdit = false, draftId }: ContratWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS)
  const [isDraft, setIsDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [proprietaires, setProprietaires] = useState<any[]>([])
  const [loadingProprietaires, setLoadingProprietaires] = useState(false)
  const [organisation, setOrganisation] = useState<{id: string, nom: string} | null>(null)
  const [loadingOrganisation, setLoadingOrganisation] = useState(false)
  const router = useRouter()

  const form = useForm<ContratFormData>({
    resolver: zodResolver(contratWizardSchema),
    defaultValues: contrat || {
      // Étape 1: Sélection Propriété/Unité
      propriete_id: '',
      unite_id: '',
      
      // Étape 2: Informations Générales
      type_contrat: 'fixe',
      date_debut: '',
      date_fin: '',
      meuble: true,
      autorisation_sous_location: true, // Business rule: obligatoire
      besoin_renovation: false,
      deduction_futurs_loyers: '',
      duree_imposee_mois: '',
      
      // Bailleur info (auto-filled from property)
      bailleur_nom: '',
      bailleur_adresse_siege: '',
      bailleur_siren_siret: '',
      bailleur_tva_intracommunautaire: '',
      bailleur_representant_legal: '',
      bailleur_email: '',
      bailleur_telephone: '',
      
      // Bien immobilier (auto-filled from property/unit)
      bien_adresse_complete: '',
      bien_type: '',
      bien_superficie: '',
      bien_nombre_pieces: '',
      bien_etat_lieux_initial: '',
      
      // Étape 3: Conditions Financières
      commission_pourcentage: '10', // Default for variable contracts
      usage_proprietaire_jours_max: '60', // Business rule: max 60 days/year
      loyer_mensuel_ht: '',
      jour_paiement_loyer: '',
      charges_mensuelles: '',
      charges_inclus: '',
      depot_garantie: '',
      plafond_depannages_urgents: '',
      delai_paiement_factures: '',
      estimation_revenus_mensuels: '',
      methode_calcul_revenus: '',
      dates_paiement: '',
      frais_abonnement_internet: '',
      frais_equipements_domotique: '',
      catalogue_equipements: '',
      
      // Boolean fields with defaults
      duree_contrat_1an: true,
      revision_loyer_irl: false,
      attestation_assurance: false,
      assurance_pertes_exploitation: false,
      assurance_occupation_illicite: false,
      protection_juridique: false,
      autorisation_travaux: false,
      draft: false
    }
  })

  const { watch, formState: { errors, isValid } } = form

  // Watch all form values for auto-save and property selection
  const watchedValues = watch()
  const watchedPropertyId = watch('propriete_id')

  // Auto-save draft disabled temporarily (causes errors)
  // TODO: Create contrats_brouillons table and re-enable auto-save
  /*
  useEffect(() => {
    if (!isEdit && Object.keys(watchedValues).length > 0) {
      const timer = setTimeout(async () => {
        try {
          const draftData = { ...watchedValues, draft: true }
          await saveDraft(draftData, draftId)
          setLastSaved(new Date())
          toast.success('Brouillon sauvegardé automatiquement', {
            duration: 2000
          })
        } catch (error) {
          console.error('Erreur sauvegarde brouillon:', error)
        }
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [watchedValues, isEdit, draftId])
  */

  // Load draft on mount - disabled temporarily
  /*
  useEffect(() => {
    if (draftId && !isEdit) {
      loadDraft(draftId).then(draft => {
        if (draft) {
          form.reset(draft)
          setIsDraft(true)
          toast.info('Brouillon chargé')
        }
      })
    }
  }, [draftId, isEdit, form])
  */

  // Fetch proprietaires and detect organisation when property is selected
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (watchedPropertyId && watchedPropertyId.trim() !== '') {
        setLoadingProprietaires(true)
        setLoadingOrganisation(true)
        
        try {
          // Parallel fetch proprietaires and organisation detection
          const [proprietairesResult, organisationResult] = await Promise.all([
            getProprieteQuotites(watchedPropertyId),
            detectOrganisationFromProperty(watchedPropertyId)
          ])
          
          // Handle proprietaires
          if (proprietairesResult.success && proprietairesResult.data) {
            setProprietaires(proprietairesResult.data)
            console.log('Propriétaires chargés:', proprietairesResult.data)
          } else {
            console.error('Erreur chargement propriétaires:', proprietairesResult.error)
            setProprietaires([])
          }
          
          // Handle organisation detection
          if (organisationResult.success && organisationResult.data) {
            const orgData = {
              id: organisationResult.data.organisation_id,
              nom: organisationResult.data.organisation_nom
            }
            setOrganisation(orgData)
            console.log('Organisation détectée:', orgData)
          } else {
            console.error('Erreur détection organisation:', organisationResult.error)
            setOrganisation(null)
            toast.error(`Erreur: ${organisationResult.error}`)
          }
          
        } catch (error) {
          console.error('Erreur fetch property data:', error)
          setProprietaires([])
          setOrganisation(null)
        } finally {
          setLoadingProprietaires(false)
          setLoadingOrganisation(false)
        }
      } else {
        // Reset data if no property selected
        setProprietaires([])
        setOrganisation(null)
      }
    }

    fetchPropertyData()
  }, [watchedPropertyId])

  // Calculate progress
  const progress = (currentStep / steps.length) * 100

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    const currentStepConfig = steps.find(s => s.id === currentStep)
    if (!currentStepConfig) return false

    const values = form.getValues()
    
    // Étape 1 : Validation exclusive propriété XOR unité (business rule)
    if (currentStep === 1) {
      const hasPropriete = values.propriete_id && values.propriete_id.trim() !== ''
      const hasUnite = values.unite_id && values.unite_id.trim() !== ''
      // XOR : soit propriété soit unité, jamais les deux, jamais aucun
      return (hasPropriete && !hasUnite) || (!hasPropriete && hasUnite)
    }
    
    // Autres étapes : validation standard de tous les champs requis
    const fieldsToValidate = currentStepConfig.fields
    const hasErrors = fieldsToValidate.some(field => {
      const value = values[field as keyof ContratFormData]
      // Fix: Handle boolean false as valid value - only check for undefined/null/empty strings
      if (typeof value === 'boolean') {
        return false // Boolean values (true/false) are always valid
      }
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
    })

    return !hasErrors
  }

  // Update step completion status
  const updateStepCompletion = async () => {
    const isStepValid = await validateCurrentStep()
    
    setSteps(prev => prev.map(step => 
      step.id === currentStep 
        ? { ...step, completed: isStepValid }
        : step
    ))
  }

  // Navigation handlers
  const goToNextStep = async () => {
    const isValid = await validateCurrentStep()
    
    if (isValid) {
      await updateStepCompletion()
      
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      // Messages d'erreur spécifiques par étape
      if (currentStep === 1) {
        toast.error('Veuillez sélectionner soit une propriété soit une unité', {
          description: 'Un contrat doit être lié à une propriété OU à une unité spécifique, mais pas aux deux'
        })
      } else {
        toast.error('Veuillez compléter tous les champs requis')
      }
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = async (stepId: number) => {
    // Permettre navigation vers l'étape courante (refresh)
    if (stepId === currentStep) {
      return
    }
    
    // Permettre navigation vers les étapes précédentes (déjà validées)
    if (stepId < currentStep) {
      setCurrentStep(stepId)
      return
    }
    
    // Empêcher navigation vers étapes futures sans validation séquentielle
    if (stepId > currentStep) {
      // Valider l'étape courante d'abord
      const isCurrentValid = await validateCurrentStep()
      if (!isCurrentValid) {
        if (currentStep === 1) {
          toast.error('Veuillez d\'abord sélectionner une propriété ou une unité', {
            description: 'Vous devez compléter l\'étape courante avant d\'accéder aux suivantes'
          })
        } else {
          toast.error(`Veuillez d'abord compléter l'étape ${currentStep}`, {
            description: 'Vous devez valider les étapes dans l\'ordre'
          })
        }
        return
      }
      
      // Si l'étape courante est valide, permettre d'aller à la suivante seulement
      if (stepId === currentStep + 1) {
        await updateStepCompletion()
        setCurrentStep(stepId)
      } else {
        toast.error('Veuillez avancer étape par étape', {
          description: 'Vous ne pouvez pas sauter plusieurs étapes à la fois'
        })
      }
    }
  }

  // Save draft manually - disabled temporarily
  const handleSaveDraft = async () => {
    // TODO: Create contrats_brouillons table and re-enable save draft
    toast.info('Sauvegarde temporairement désactivée - focalisé sur l\'architecture correcte')
    /*
    try {
      const formData = { ...form.getValues(), draft: true }
      await saveDraft(formData, draftId)
      setIsDraft(true)
      setLastSaved(new Date())
      toast.success('Brouillon sauvegardé')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du brouillon')
    }
    */
  }

  // Submit final contract
  const handleSubmit = async (data: ContratFormData) => {
    setIsSubmitting(true)
    
    try {
      // CRITICAL FIX: Validate that organisation is detected
      if (!organisation?.id) {
        throw new Error('Organisation demandeur non détectée. Veuillez sélectionner une propriété valide.')
      }

      // Validate business rules
      if (!data.autorisation_sous_location) {
        throw new Error('L\'autorisation de sous-location est obligatoire pour Want It Now')
      }

      if (data.type_contrat === 'variable' && Number(data.commission_pourcentage) !== 10) {
        throw new Error('La commission pour les contrats variables doit être de 10%')
      }

      if (Number(data.usage_proprietaire_jours_max) > 60) {
        throw new Error('L\'usage propriétaire ne peut pas dépasser 60 jours par an')
      }

      // CRITICAL FIX: Add organisation_id to form data
      const dataWithOrganisation = {
        ...data,
        organisation_id: organisation.id, // Missing piece - required by createContratSchema
        draft: false
      }

      console.log('Submitting contract with organisation:', {
        organisation_id: organisation.id,
        organisation_nom: organisation.nom,
        property_id: data.propriete_id
      })

      let result
      if (isEdit && contrat) {
        result = await updateContrat(contrat.id, dataWithOrganisation)
      } else {
        result = await createContrat(dataWithOrganisation)
      }

      if (result.success) {
        toast.success(isEdit ? 'Contrat mis à jour' : 'Contrat créé avec succès')
        router.push('/contrats')
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur submit:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      form,
      onNext: goToNextStep,
      onPrev: goToPrevStep,
      isFirst: currentStep === 1,
      isLast: currentStep === steps.length,
      // Pass proprietaires data to steps that need it
      proprietaires,
      loadingProprietaires,
      // ADDED: Pass detected organisation to steps
      organisation,
      loadingOrganisation
    }

    switch (currentStep) {
      case 1:
        return <SelectionStep {...commonProps} />
      case 2:
        return <InformationsStep {...commonProps} />
      case 3:
        return <ConditionsStep {...commonProps} />
      case 4:
        return <AssurancesStep {...commonProps} />
      case 5:
        return <ClausesStep {...commonProps} />
      case 6:
        return <RevisionStep {...commonProps} onSubmit={form.handleSubmit(handleSubmit)} isSubmitting={isSubmitting} />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header moderne avec progress et gradient Want It Now */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#D4841A] to-[#2D5A27] px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {isEdit ? 'Modifier le Contrat' : 'Assistant Création Contrat'}
                  </h1>
                  <p className="text-white/90 text-sm mt-1">
                    Étape {currentStep} sur {steps.length} - {steps.find(s => s.id === currentStep)?.title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {lastSaved && (
                  <div className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    Sauvé: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {isDraft && (
                  <Badge className="bg-yellow-400/20 text-yellow-100 border-yellow-300/30 backdrop-blur-sm">
                    Brouillon
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar intégré */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Progression</span>
                <span className="text-sm text-[#D4841A] font-semibold">
                  {Math.round(progress)}% complété
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-[#D4841A] to-[#2D5A27] rounded-full progress-bar-animate"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation des étapes - Design Want It Now optimisé */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4841A]" />
                Navigation des Étapes
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Cliquez sur une étape pour y accéder directement
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Desktop navigation - Design horizontal optimisé */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Container avec padding pour éviter le débordement */}
                <div className="overflow-x-auto scrollbar-copper">
                  <div className="flex items-center gap-3 min-w-fit px-2 py-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center shrink-0">
                        <button
                          onClick={() => goToStep(step.id)}
                          className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 min-w-[180px] justify-start border-2 ${
                            step.id === currentStep
                              ? 'bg-[#D4841A] text-white shadow-lg border-[#D4841A] hover:bg-[#B8741A] transform hover:scale-105'
                              : step.completed
                              ? 'bg-[#2D5A27]/5 text-[#2D5A27] border-[#2D5A27]/20 hover:bg-[#2D5A27]/10 shadow-sm'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                            step.id === currentStep
                              ? 'bg-white/20'
                              : step.completed 
                              ? 'bg-[#2D5A27]/10'
                              : 'bg-gray-200'
                          }`}>
                            {step.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              React.cloneElement(step.icon as React.ReactElement, {
                                className: "w-4 h-4"
                              })
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{step.title}</div>
                            <div className={`text-xs mt-0.5 ${
                              step.id === currentStep 
                                ? 'text-white/80'
                                : step.completed
                                ? 'text-[#2D5A27]/70'
                                : 'text-gray-500'
                            }`}>
                              {step.description}
                            </div>
                          </div>
                          {step.id === currentStep && (
                            <div className="absolute -right-1 -top-1 w-3 h-3 bg-white rounded-full border-2 border-[#D4841A] step-indicator-pulse"></div>
                          )}
                        </button>
                        
                        {index < steps.length - 1 && (
                          <ChevronRight className={`w-5 h-5 mx-3 shrink-0 ${
                            step.completed ? 'text-[#2D5A27]' : 'text-gray-300'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile navigation - Grid responsive */}
            <div className="lg:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-left border-2 ${
                      step.id === currentStep
                        ? 'bg-[#D4841A] text-white shadow-lg border-[#D4841A]'
                        : step.completed
                        ? 'bg-[#2D5A27]/5 text-[#2D5A27] border-[#2D5A27]/20 hover:bg-[#2D5A27]/10'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                      step.id === currentStep
                        ? 'bg-white/20'
                        : step.completed 
                        ? 'bg-[#2D5A27]/10'
                        : 'bg-gray-200'
                    }`}>
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        React.cloneElement(step.icon as React.ReactElement, {
                          className: "w-4 h-4"
                        })
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{step.title}</div>
                      <div className={`text-xs mt-1 ${
                        step.id === currentStep 
                          ? 'text-white/80'
                          : step.completed
                          ? 'text-[#2D5A27]/70'
                          : 'text-gray-500'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu de l'étape courante - Container élégant */}
        <Card className="bg-white border-gray-200 shadow-sm min-h-[600px]">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>
        
        {/* Actions flottantes pour navigation rapide */}
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
          {currentStep > 1 && (
            <Button
              onClick={goToPrevStep}
              variant="outline"
              className="shadow-lg bg-white border-gray-300 hover:bg-gray-50 transition-all duration-200 fab-shadow"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
          
          {currentStep < steps.length && (
            <Button
              onClick={goToNextStep}
              className="shadow-lg bg-[#D4841A] hover:bg-[#B8741A] text-white transition-all duration-200 fab-shadow"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
        </div>
      </div>
    </Form>
  )
}