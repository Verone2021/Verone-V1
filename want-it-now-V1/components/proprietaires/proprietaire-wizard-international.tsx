'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Users, Building2, Lock, CreditCard, Globe, Info, CheckCircle2, 
  ChevronRight, ChevronLeft, Plus, Trash2, User, Percent, AlertTriangle, Save
} from 'lucide-react'

import {
  createProprietaireSchema,
  type CreateProprietaire,
  type Proprietaire,
} from '@/lib/validations/proprietaires'
import {
  createProprietaire,
} from '@/actions/proprietaires'

// ==============================================================================
// WIZARD STEPS CONFIGURATION
// ==============================================================================

const WIZARD_STEPS = [
  {
    id: 'person-type',
    title: 'Type de Personne',
    description: 'Sélection du type de propriétaire',
    icon: User
  },
  {
    id: 'personal-details',
    title: 'Détails Personnels',
    description: 'Informations personnelles',
    icon: User
  },
  {
    id: 'company-country',
    title: 'Pays & Entreprise',
    description: 'Sélection pays et détails entreprise',
    icon: Building2
  },
  {
    id: 'shareholders',
    title: 'Associés & Validation',
    description: 'Gestion des associés et finalisation',
    icon: Users
  },
  {
    id: 'validation',
    title: 'Validation',
    description: 'Récapitulatif et confirmation',
    icon: CheckCircle2
  }
] as const

type WizardStepId = typeof WIZARD_STEPS[number]['id']

// ==============================================================================
// INTERNATIONAL CONFIGURATION
// ==============================================================================

interface CountryConfig {
  code: string
  name: string
  flag: string
  legal_forms: Array<{
    value: string
    label: string
    description?: string
    min_capital?: number
  }>
  identificationNumber: {
    label: string
    placeholder: string
  }
  required_fields: string[]
  banking_required: string[]
  banking_optional: string[]
  validation_rules: Record<string, string>
  banking_info: string
}

const INTERNATIONAL_CONFIG: Record<string, CountryConfig> = {
  'PT': {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    legal_forms: [
      {
        value: 'LDA',
        label: 'Lda (Sociedade por Quotas)',
        description: 'Capital minimum 1€',
        min_capital: 1
      },
      {
        value: 'SA_PT',
        label: 'SA (Sociedade Anónima)',
        description: 'Capital minimum 50,000€',
        min_capital: 50000
      },
      {
        value: 'UNIPESSOAL',
        label: 'Unipessoal Lda',
        description: 'Société à associé unique',
        min_capital: 1
      }
    ],
    identificationNumber: {
      label: 'NIPC',
      placeholder: '518473597'
    },
    required_fields: ['nipc_numero'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {
      nipc_format: '^[0-9]{9}$'
    },
    banking_info: 'SEPA Official: IBAN + Nom titulaire obligatoires (Réglementation 2024). BIC optionnel.'
  },
  'FR': {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    legal_forms: [
      {
        value: 'SARL',
        label: 'SARL',
        description: 'Capital minimum 1€',
        min_capital: 1
      },
      {
        value: 'SAS',
        label: 'SAS',
        description: 'Capital minimum 1€',
        min_capital: 1
      },
      {
        value: 'SA',
        label: 'SA',
        description: 'Capital minimum 37,000€',
        min_capital: 37000
      }
    ],
    identificationNumber: {
      label: 'SIRET',
      placeholder: '12345678901234'
    },
    required_fields: ['siret'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {
      siret_format: '^[0-9]{14}$'
    },
    banking_info: 'SEPA Official: IBAN + Nom titulaire obligatoires. BIC automatiquement dérivé.'
  }
}

const COUNTRIES_OPTIONS = [
  { value: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { value: 'FR', label: 'France', flag: '🇫🇷' }
]

// ==============================================================================
// SCHEMAS & VALIDATION
// ==============================================================================

const shareholderSchema = z.object({
  nom: z.string().min(2, 'Nom requis (minimum 2 caractères)'),
  prenom: z.string().optional(),
  date_naissance: z.string().optional(),
  pourcentage: z.number()
    .min(0.01, 'Minimum 0.01%')
    .max(100, 'Maximum 100%'),
  is_beneficial_owner: z.boolean().default(false),
  pays_residence: z.string().min(2, 'Pays de résidence requis'),
  document_identite: z.string().optional()
})

const wizardSchema = z.object({
  // Step 1: Type
  type: z.enum(['personne_physique', 'personne_morale']),
  
  // Step 2: Basic Info
  pays_constitution: z.string().min(2, 'Pays de constitution requis'),
  nom: z.string().min(2, 'Nom/Raison sociale requis'),
  prenom: z.string().optional(),
  forme_juridique: z.string().optional(),
  capital_social: z.number().optional(),
  nombre_parts_total: z.number().optional(),
  nipc_numero: z.string().optional(),
  siret: z.string().optional(),
  
  // Banking (SEPA Official)
  iban: z.string().min(15, 'IBAN requis (SEPA Official)'),
  account_holder_name: z.string().min(2, 'Nom titulaire requis (SEPA 2024)'),
  bank_name: z.string().optional(),
  swift_bic: z.string().optional(),
  
  // Contact
  email: z.string().email().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  
  // Step 3: Shareholders
  shareholders: z.array(shareholderSchema).default([]),
  
  // Options
  is_brouillon: z.boolean().default(false)
})

type WizardFormData = z.infer<typeof wizardSchema>

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

interface ProprietaireWizardInternationalProps {
  mode?: 'create' | 'edit'
  proprietaire?: Proprietaire
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProprietaireWizardInternational({
  mode = 'create',
  proprietaire,
  onSuccess,
  onCancel,
}: ProprietaireWizardInternationalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStepId>('person-type')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('PT')

  // Form management
  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      pays_constitution: 'PT',
      type: 'personne_morale',
      forme_juridique: 'LDA', // 🔧 CORRECTION : Utiliser directement la valeur enum attendue
      capital_social: 1000,
      nombre_parts_total: 1000,
      shareholders: [],
      is_brouillon: false,
      ...proprietaire
    }
  })

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form

  // Shareholders management
  const { fields: shareholders, append: addShareholder, remove: removeShareholder } = useFieldArray({
    control,
    name: 'shareholders'
  })

  // Watch form values for dynamic behavior
  const watchedValues = watch()
  const currentConfig = INTERNATIONAL_CONFIG[selectedCountry] || INTERNATIONAL_CONFIG['PT']
  
  // Dynamic steps based on person type
  const getActiveSteps = () => {
    const personType = watchedValues.type
    if (personType === 'personne_physique') {
      return [
        WIZARD_STEPS[0], // person-type
        WIZARD_STEPS[1], // personal-details  
        WIZARD_STEPS[4]  // validation
      ]
    } else {
      return [
        WIZARD_STEPS[0], // person-type
        WIZARD_STEPS[2], // company-country
        WIZARD_STEPS[3], // shareholders
        WIZARD_STEPS[4]  // validation
      ]
    }
  }
  
  const activeSteps = getActiveSteps()

  // ==============================================================================
  // STEP NAVIGATION
  // ==============================================================================

  const currentStepIndex = activeSteps.findIndex(step => step.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === activeSteps.length - 1

  const goToNextStep = () => {
    if (!isLastStep) {
      const nextStep = activeSteps[currentStepIndex + 1]
      setCurrentStep(nextStep.id)
    }
  }

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const previousStep = activeSteps[currentStepIndex - 1]
      setCurrentStep(previousStep.id)
    }
  }

  // ==============================================================================
  // SHAREHOLDERS MANAGEMENT
  // ==============================================================================

  const addNewShareholder = () => {
    addShareholder({
      nom: '',
      prenom: '',
      pourcentage: 0,
      is_beneficial_owner: false,
      pays_residence: selectedCountry,
      document_identite: ''
    })
  }

  const calculateTotalPercentage = () => {
    return shareholders.reduce((total, _, index) => {
      const percentage = watchedValues.shareholders?.[index]?.pourcentage || 0
      return total + percentage
    }, 0)
  }

  const totalPercentage = calculateTotalPercentage()
  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01

  // ==============================================================================
  // FORM SUBMISSION
  // ==============================================================================

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true)
    setSubmitError(null) // Réinitialiser l'erreur
    
    console.log('🚀 [WIZARD] DEBUT onSubmit - données reçues:', JSON.stringify(data, null, 2))
    
    try {
      // === CORRECTION MAPPING SCHÉMAS ===
      // Le server schema attend des champs différents du wizard schema
      
      // Convert shareholders array to beneficial_owners JSON
      const beneficial_owners = data.shareholders && data.shareholders.length > 0 
        ? data.shareholders.filter(s => s.is_beneficial_owner).length > 0 
          ? data.shareholders 
          : data.shareholders // Inclure tous les shareholders même si pas beneficial_owner
        : null

      // MAPPING CRITIQUE : Wizard schema → Server schema
      const proprietaireData = {
        // 🔧 CORRECTION TYPE ENUM : personne_morale → morale (pour enum DB)
        type: data.type === 'personne_morale' ? 'morale' : 'physique',
        
        // Nom reste identique
        nom: data.nom,
        
        // MAPPING PAYS : pays_constitution → pays (server schema)
        pays: data.pays_constitution || 'PT',
        pays_constitution: data.pays_constitution || 'PT', // Garder aussi l'original pour la DB
        
        // MAPPING IDENTIFICATION : nipc_numero → numero_identification (server schema)
        numero_identification: data.nipc_numero || data.siret || '', // Server schema attend numero_identification
        nipc_numero: data.nipc_numero, // Garder aussi pour la DB
        siret: data.siret, // Garder pour France
        
        // 🔧 CORRECTION FORME JURIDIQUE : Utiliser directement l'enum attendu par le schéma
        forme_juridique: data.forme_juridique || 'LDA', // FormeJuridiqueEnum attend 'LDA' pas 'lda'
        
        // Champs financiers
        capital_social: data.capital_social || 1000,
        nombre_parts_total: data.nombre_parts_total || 1000,
        
        // Contact
        email: data.email || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        code_postal: data.code_postal || '',
        ville: data.ville || '',
        
        // Banking SEPA
        iban: data.iban,
        account_holder_name: data.account_holder_name,
        bank_name: data.bank_name || '',
        swift_bic: data.swift_bic || '',
        
        // Beneficial owners (associés)
        beneficial_owners: beneficial_owners ? JSON.stringify(beneficial_owners) : null,
        
        // États
        is_brouillon: data.is_brouillon || false
      }
      
      console.log('🔄 [WIZARD] Données transformées pour server:', JSON.stringify(proprietaireData, null, 2))
      
      // Appel server action avec données mappées
      const result = await createProprietaire(proprietaireData)
      
      console.log('✅ [WIZARD] Résultat server action:', result)
      
      if (result && !result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('❌ [WIZARD] Erreur création propriétaire:', error)
      // Afficher un message d'erreur détaillé à l'utilisateur
      setSubmitError(
        error instanceof Error 
          ? `Erreur lors de la création: ${error.message}` 
          : 'Une erreur inattendue s\'est produite lors de la création du propriétaire. Veuillez réessayer.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==============================================================================
  // STEP RENDERING FUNCTIONS (TOUTES DÉFINIES AVANT renderStepContent)
  // ==============================================================================

  const renderPersonTypeStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4841A]" />
            Type de propriétaire
          </CardTitle>
          <CardDescription>
            Sélectionnez le type de propriétaire à créer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <RadixSelect
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personne_physique">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personne Physique
                    </div>
                  </SelectItem>
                  <SelectItem value="personne_morale">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Personne Morale (Entreprise)
                    </div>
                  </SelectItem>
                </SelectContent>
              </RadixSelect>
            )}
          />
          {errors.type && (
            <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderPersonalDetailsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4841A]" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Renseignez les informations personnelles du propriétaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Controller
                name="prenom"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="Jean"
                  />
                )}
              />
              {errors.prenom && (
                <p className="text-sm text-red-600 mt-1">{errors.prenom.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="nom">Nom de famille *</Label>
              <Controller
                name="nom"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="Dupont"
                  />
                )}
              />
              {errors.nom && (
                <p className="text-sm text-red-600 mt-1">{errors.nom.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCompanyCountryStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#D4841A]" />
            Pays de constitution
          </CardTitle>
          <CardDescription>
            Sélectionnez le pays où l'entreprise est constituée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pays de constitution *</Label>
            <Controller
              name="pays_constitution"
              control={control}
              render={({ field }) => (
                <RadixSelect
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedCountry(value)
                    // 🔧 CORRECTION : Reset forme juridique pour forcer sélection selon nouveau pays
                    setValue('forme_juridique', '')
                  }}
                >
                  <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERNATIONAL_CONFIG).map(([code, config]) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center gap-2">
                          <span>{config.flag}</span>
                          <span>{config.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect>
              )}
            />
            {errors.pays_constitution && (
              <p className="text-sm text-red-600 mt-1">{errors.pays_constitution.message}</p>
            )}
          </div>

          {/* Company details based on selected country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Raison sociale *</Label>
              <Controller
                name="nom"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder={currentConfig.companyNamePlaceholder}
                  />
                )}
              />
              {errors.nom && (
                <p className="text-sm text-red-600 mt-1">{errors.nom.message}</p>
              )}
            </div>

            <div>
              <Label>Forme juridique</Label>
              <Controller
                name="forme_juridique"
                control={control}
                render={({ field }) => (
                  <RadixSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                      <SelectValue placeholder={`Forme juridique (${currentConfig.name})`} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConfig.legal_forms.map((form) => (
                        <SelectItem key={form.value} value={form.value}>
                          {form.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </RadixSelect>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{currentConfig.identificationNumber.label} *</Label>
              <Controller
                name={selectedCountry === 'PT' ? 'nipc_numero' : 'siret'}
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder={currentConfig.identificationNumber.placeholder}
                  />
                )}
              />
            </div>

            <div>
              <Label>Capital social (€) *</Label>
              <Controller
                name="capital_social"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="1000"
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEPA Banking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2D5A27]" />
            Informations bancaires (SEPA 2025)
          </CardTitle>
          <CardDescription>
            Informations bancaires pour les virements SEPA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>IBAN *</Label>
              <Controller
                name="iban"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="FR76 1234 5678 9012 3456 78"
                  />
                )}
              />
              {errors.iban && (
                <p className="text-sm text-red-600 mt-1">{errors.iban.message}</p>
              )}
            </div>

            <div>
              <Label>Nom du titulaire *</Label>
              <Controller
                name="account_holder_name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="JARDIM PRÓSPERO LDA"
                  />
                )}
              />
              {errors.account_holder_name && (
                <p className="text-sm text-red-600 mt-1">{errors.account_holder_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom de la banque</Label>
              <Controller
                name="bank_name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="Revolut Bank"
                  />
                )}
              />
            </div>

            <div>
              <Label>Code BIC/SWIFT</Label>
              <Controller
                name="swift_bic"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="REVOLT21"
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderShareholdersStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4841A]" />
            Actionnaires et bénéficiaires effectifs
          </CardTitle>
          <CardDescription>
            Ajoutez les actionnaires et identifiez les bénéficiaires effectifs (≥25%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shareholders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Aucun actionnaire ajouté</p>
              <Button
                type="button"
                onClick={addNewShareholder}
                className="bg-[#D4841A] hover:bg-[#B8741A]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier actionnaire
              </Button>
            </div>
          ) : (
            <>
              {shareholders.map((shareholder, index) => (
                <Card key={shareholder.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Actionnaire {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeShareholder(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Prénom *</Label>
                      <Controller
                        name={`shareholders.${index}.prenom`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value || ''}
                            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                            placeholder="Jean"
                          />
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label>Nom *</Label>
                      <Controller
                        name={`shareholders.${index}.nom`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value || ''}
                            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                            placeholder="Dupont"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label>Date de naissance</Label>
                      <Controller
                        name={`shareholders.${index}.date_naissance`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="date"
                            value={field.value || ''}
                            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Pourcentage de détention (%) *</Label>
                      <Controller
                        name={`shareholders.${index}.pourcentage`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                            placeholder="25"
                          />
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label>Pays de résidence</Label>
                      <Controller
                        name={`shareholders.${index}.pays_residence`}
                        control={control}
                        render={({ field }) => (
                          <RadixSelect
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                              <SelectValue placeholder="Pays" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(INTERNATIONAL_CONFIG).map(([code, config]) => (
                                <SelectItem key={code} value={code}>
                                  <div className="flex items-center gap-2">
                                    <span>{config.flag}</span>
                                    <span>{config.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </RadixSelect>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Controller
                      name={`shareholders.${index}.is_beneficial_owner`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`beneficial-${index}`}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor={`beneficial-${index}`}>
                            Bénéficiaire effectif (≥25% ou contrôle de facto)
                          </Label>
                        </div>
                      )}
                    />
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Total:</span>
                  <Badge variant={isValidPercentage ? "default" : "destructive"}>
                    {totalPercentage.toFixed(1)}%
                  </Badge>
                  {!isValidPercentage && (
                    <span className="text-sm text-red-600">
                      (Doit totaliser 100%)
                    </span>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewShareholder}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un actionnaire
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderValidationStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2D5A27]" />
            Validation et création
          </CardTitle>
          <CardDescription>
            Vérifiez les informations avant la création du propriétaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Récapitulatif</h4>
            <div className="text-sm space-y-1">
              <p><strong>Type:</strong> {watchedValues.type === 'personne_physique' ? 'Personne Physique' : 'Personne Morale'}</p>
              <p><strong>Nom:</strong> {watchedValues.type === 'personne_morale' ? (watchedValues.raison_sociale || watchedValues.nom) : `${watchedValues.prenom || ''} ${watchedValues.nom || ''}`.trim()}</p>
              {watchedValues.type === 'personne_morale' && (
                <>
                  <p><strong>Pays:</strong> {INTERNATIONAL_CONFIG[watchedValues.pays_constitution || 'PT']?.name}</p>
                  <p><strong>Forme juridique:</strong> {watchedValues.forme_juridique}</p>
                  <p><strong>Capital social:</strong> {watchedValues.capital_social}€</p>
                  {watchedValues.shareholders && watchedValues.shareholders.length > 0 && (
                    <div>
                      <p><strong>Actionnaires ({watchedValues.shareholders.length}):</strong></p>
                      <ul className="ml-4 space-y-1">
                        {watchedValues.shareholders.map((shareholder: any, index: number) => (
                          <li key={index} className="text-xs">
                            • {shareholder.prenom} {shareholder.nom} ({shareholder.percentage}%)
                            {shareholder.date_naissance && (
                              <span className="text-gray-500 ml-1">
                                - né(e) le {new Date(shareholder.date_naissance).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center space-x-2">
            <Controller
              name="is_brouillon"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_brouillon"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_brouillon">
              Enregistrer comme brouillon (pourra être complété plus tard)
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ==============================================================================
  // MAIN RENDER FUNCTION
  // ==============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 'person-type':
        return renderPersonTypeStep()
      case 'personal-details':
        return renderPersonalDetailsStep()
      case 'company-country':
        return renderCompanyCountryStep()
      case 'shareholders':
        return renderShareholdersStep()
      case 'validation':
        return renderValidationStep()
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {activeSteps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              index < activeSteps.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStepIndex
                  ? 'bg-[#D4841A] border-[#D4841A] text-white'
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              {index < currentStepIndex ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span className={`ml-2 text-sm ${
              index <= currentStepIndex ? 'text-[#D4841A]' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
            {index < activeSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ml-4 ${
                  index < currentStepIndex ? 'bg-[#D4841A]' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStepContent()}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            
            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2D5A27] hover:bg-[#1F3F1C]"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Création...' : 'Créer le propriétaire'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-[#D4841A] hover:bg-[#B8741A]"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProprietaireWizardInternational
