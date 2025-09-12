'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormShell } from '@/components/ui/form-shell'
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
import { Users, Building2, Lock, CreditCard, Globe, Info, CheckCircle2 } from 'lucide-react'

import {
  createProprietaireSchema,
  updateProprietaireSchema,
  PROPRIETAIRE_TYPE_OPTIONS,
  type CreateProprietaire,
  type UpdateProprietaire,
  type Proprietaire,
} from '@/lib/validations/proprietaires'
import {
  createProprietaire,
  updateProprietaire,
} from '@/actions/proprietaires'

// ==============================================================================
// INTERNATIONAL CONFIGURATION
// ==============================================================================

interface CountryConfig {
  code: string
  name: string
  legal_forms: Array<{
    value: string
    label: string
    description?: string
    min_capital?: number
  }>
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
    required_fields: ['nipc_numero'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {
      nipc_format: '^[0-9]{9}$'
    },
    banking_info: 'SEPA 2025: IBAN + Nom titulaire obligatoires. BIC optionnel.'
  },
  'FR': {
    code: 'FR',
    name: 'France',
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
      },
      {
        value: 'SCI',
        label: 'SCI',
        description: 'Société Civile Immobilière',
        min_capital: 1
      }
    ],
    required_fields: ['numero_identification'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {
      siret_format: '^[0-9]{14}$'
    },
    banking_info: 'SEPA 2025: IBAN + Nom titulaire suffisants pour paiements.'
  },
  'ES': {
    code: 'ES',
    name: 'Espagne',
    legal_forms: [
      {
        value: 'SL',
        label: 'SL (Sociedad Limitada)',
        description: 'Capital minimum 3,006€',
        min_capital: 3006
      },
      {
        value: 'SA_ES',
        label: 'SA (Sociedad Anónima)',
        description: 'Capital minimum 60,101€',
        min_capital: 60101
      }
    ],
    required_fields: ['tax_id_country'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {},
    banking_info: 'Standards SEPA 2025 appliqués.'
  },
  'GB': {
    code: 'GB',
    name: 'Royaume-Uni',
    legal_forms: [
      {
        value: 'LTD',
        label: 'Ltd (Private Limited)',
        description: 'Capital minimum £0.01',
        min_capital: 0.01
      },
      {
        value: 'PLC',
        label: 'PLC (Public Limited)',
        description: 'Capital minimum £50,000',
        min_capital: 50000
      }
    ],
    required_fields: ['tax_id_country'],
    banking_required: ['iban', 'account_holder_name'],
    banking_optional: ['bank_name', 'swift_bic'],
    validation_rules: {},
    banking_info: 'Standards SEPA 2025 appliqués.'
  }
}

const COUNTRY_OPTIONS = [
  { value: 'FR', label: 'France' },
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espagne' },
  { value: 'GB', label: 'Royaume-Uni' }
]

// ==============================================================================
// VALIDATION HELPERS
// ==============================================================================

function validateIBAN(iban: string): boolean {
  if (!iban || iban.length < 15 || iban.length > 34) return false
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)
}

// ==============================================================================
// FORM COMPONENT
// ==============================================================================

interface ProprietaireFormInternationalProps {
  proprietaire?: Proprietaire
  mode?: 'create' | 'edit'
  onSuccess?: (proprietaire?: Proprietaire) => void
  onCancel?: () => void
}

export function ProprietaireFormInternational({
  proprietaire,
  mode = 'create',
  onSuccess,
  onCancel,
}: ProprietaireFormInternationalProps) {
  
  const [selectedCountry, setSelectedCountry] = useState<string>('FR')
  const [countryConfig, setCountryConfig] = useState<CountryConfig>(INTERNATIONAL_CONFIG['FR'])

  const onSubmit = async (data: CreateProprietaire | UpdateProprietaire) => {
    let result: any

    if (mode === 'create') {
      result = await createProprietaire(data as CreateProprietaire)
    } else {
      result = await updateProprietaire(proprietaire!.id, data as Partial<CreateProprietaire>)
    }

    if (result.success) {
      setTimeout(() => {
        onSuccess?.(result.data)
      }, 1000)
    } else {
      throw new Error(result.error || 'Une erreur est survenue')
    }
  }

  const title = mode === 'create' ? 'Nouveau propriétaire international' : 'Modifier le propriétaire'
  const submitText = mode === 'create' ? 'Créer le propriétaire' : 'Sauvegarder les modifications'

  const getDefaultValues = () => {
    if (mode === 'edit' && proprietaire) {
      return {
        id: proprietaire.id,
        type: proprietaire.type,
        nom: proprietaire.nom,
        prenom: proprietaire.prenom || '',
        email: proprietaire.email || '',
        telephone: proprietaire.telephone || '',
        adresse: proprietaire.adresse || '',
        code_postal: proprietaire.code_postal || '',
        ville: proprietaire.ville || '',
        pays: proprietaire.pays,
        
        // Personne physique
        ...(proprietaire.type === 'physique' && {
          date_naissance: proprietaire.date_naissance || '',
          lieu_naissance: proprietaire.lieu_naissance || '',
          nationalite: proprietaire.nationalite || '',
        }),
        
        // Personne morale
        ...(proprietaire.type === 'morale' && {
          forme_juridique: proprietaire.forme_juridique || 'SARL',
          numero_identification: proprietaire.numero_identification || '',
          capital_social: proprietaire.capital_social || 0,
          nombre_parts_total: proprietaire.nombre_parts_total || 100,
        }),
        
        is_brouillon: proprietaire.is_brouillon,
      } as CreateProprietaire | UpdateProprietaire
    } else {
      return {
        type: 'morale',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        code_postal: '',
        ville: '',
        pays: 'PT',
        forme_juridique: 'LDA',
        numero_identification: '',
        capital_social: 5000,
        nombre_parts_total: 5000,
        is_brouillon: false,
        // Nouveaux champs bancaires
        iban: '',
        account_holder_name: '',
        bank_name: '',
        swift_bic: '',
        // Champs internationaux
        nipc_numero: '',
        pays_constitution: 'PT',
      } as any
    }
  }

  return (
    <FormShell
      schema={mode === 'create' ? createProprietaireSchema : updateProprietaireSchema}
      title={title}
      description={mode === 'create' 
        ? 'Créez un propriétaire avec support international et conformité KYC 2025.'
        : 'Modifiez les informations de ce propriétaire.'
      }
      onSubmit={onSubmit}
      defaultValues={getDefaultValues()}
      submitLabel={submitText}
      onCancel={onCancel}
    >
      {(form) => {
        // Update country config when country changes
        const watchedCountry = form.watch('pays') || form.watch('pays_constitution') || 'FR'
        
        useEffect(() => {
          if (watchedCountry !== selectedCountry) {
            setSelectedCountry(watchedCountry)
            setCountryConfig(INTERNATIONAL_CONFIG[watchedCountry] || INTERNATIONAL_CONFIG['FR'])
          }
        }, [watchedCountry, selectedCountry])

        return (
          <div className="space-y-6">
            {/* Country Selection First - Adaptive Form Approach */}
            <Card className="border-l-4 border-l-[#D4841A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#D4841A]" />
                  Pays de constitution
                </CardTitle>
                <CardDescription>
                  Sélectionnez le pays pour adapter automatiquement les champs requis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Controller
                    name="pays_constitution"
                    control={form.control}
                    render={({ field }) => (
                      <RadixSelect 
                        value={field.value || 'PT'} 
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('pays', value) // Sync with pays field
                          // Reset legal form when country changes
                          if (form.watch('type') === 'morale') {
                            const newConfig = INTERNATIONAL_CONFIG[value] || INTERNATIONAL_CONFIG['FR']
                            form.setValue('forme_juridique', newConfig.legal_forms[0]?.value || 'SARL')
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionnez un pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </RadixSelect>
                    )}
                  />
                  
                  {/* Country Info Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">
                          Configuration {countryConfig.name}
                        </h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          <p>• {countryConfig.legal_forms.length} formes juridiques supportées</p>
                          <p>• Champs requis : {countryConfig.required_fields.length}</p>
                          <p>• {countryConfig.banking_info}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Type de propriétaire
              </h3>
              
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (mode === 'create') {
                        form.reset({
                          ...form.getValues(),
                          type: value as 'physique' | 'morale',
                          // Clear type-specific fields
                          date_naissance: '',
                          lieu_naissance: '',
                          nationalite: '',
                          forme_juridique: countryConfig.legal_forms[0]?.value || 'SARL',
                          numero_identification: '',
                          capital_social: countryConfig.legal_forms[0]?.min_capital || 0,
                          nombre_parts_total: 100,
                        })
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-4"
                    disabled={mode === 'edit'}
                  >
                    {PROPRIETAIRE_TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                        />
                        <Label
                          htmlFor={option.value}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          {option.value === 'physique' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                          <span>{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            {/* Type locked indicator for edit mode */}
            {mode === 'edit' && proprietaire && (
              <div className="bg-gray-50 rounded-modern p-4 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    Le type de propriétaire ne peut pas être modifié après création
                  </p>
                </div>
              </div>
            )}

            {/* Required Fields Section - Adaptive */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Informations {form.watch('type') === 'physique' ? 'personnelles' : `entreprise - ${countryConfig.name}`}
              </h3>

              {/* Nom */}
              <div className="space-y-2">
                <label htmlFor="nom" className="text-sm font-medium text-gray-700">
                  {form.watch('type') === 'physique' ? 'Nom de famille' : 'Raison sociale'} *
                </label>
                <Input
                  id="nom"
                  {...form.register('nom')}
                  error={!!form.formState.errors.nom}
                  placeholder={
                    form.watch('type') === 'physique' ? 'Dupont' : 
                    selectedCountry === 'PT' ? 'JARDIM PRÓSPERO, LDA' : 'Ma Société SARL'
                  }
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.nom && (
                  <p className="text-sm text-red-600">{(form.formState.errors.nom as any)?.message}</p>
                )}
              </div>

              {/* Fields spécifiques selon le type */}
              {form.watch('type') === 'physique' ? (
                <>
                  {/* Prénom */}
                  <div className="space-y-2">
                    <label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                      Prénom *
                    </label>
                    <Input
                      id="prenom"
                      {...form.register('prenom')}
                      error={!!form.formState.errors.prenom}
                      placeholder="Jean"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                    {form.formState.errors.prenom && (
                      <p className="text-sm text-red-600">{(form.formState.errors.prenom as any)?.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date de naissance */}
                    <div className="space-y-2">
                      <label htmlFor="date_naissance" className="text-sm font-medium text-gray-700">
                        Date de naissance *
                      </label>
                      <Input
                        id="date_naissance"
                        type="date"
                        {...form.register('date_naissance')}
                        error={!!form.formState.errors.date_naissance}
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                    </div>

                    {/* Lieu de naissance */}
                    <div className="space-y-2">
                      <label htmlFor="lieu_naissance" className="text-sm font-medium text-gray-700">
                        Lieu de naissance *
                      </label>
                      <Input
                        id="lieu_naissance"
                        {...form.register('lieu_naissance')}
                        error={!!form.formState.errors.lieu_naissance}
                        placeholder="Paris"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                    </div>

                    {/* Nationalité */}
                    <div className="space-y-2">
                      <label htmlFor="nationalite" className="text-sm font-medium text-gray-700">
                        Nationalité *
                      </label>
                      <Input
                        id="nationalite"
                        {...form.register('nationalite')}
                        error={!!form.formState.errors.nationalite}
                        placeholder="Française"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Corporate Entity Fields - Adaptive by Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Forme juridique - Adaptive */}
                    <div className="space-y-2">
                      <label htmlFor="forme_juridique" className="text-sm font-medium text-gray-700">
                        Forme juridique *
                      </label>
                      <Controller
                        name="forme_juridique"
                        control={form.control}
                        render={({ field }) => (
                          <RadixSelect value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
                              <SelectValue placeholder="Sélectionnez une forme juridique" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryConfig.legal_forms.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div>{option.label}</div>
                                    {option.description && (
                                      <div className="text-xs text-gray-500">{option.description}</div>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </RadixSelect>
                        )}
                      />
                    </div>

                    {/* Numéro d'identification - Adaptive by Country */}
                    <div className="space-y-2">
                      <label htmlFor="numero_identification" className="text-sm font-medium text-gray-700">
                        {selectedCountry === 'PT' ? 'NIPC' : 
                         selectedCountry === 'FR' ? 'SIRET' : 'N° identification'} *
                      </label>
                      <Input
                        id="numero_identification"
                        {...form.register('numero_identification')}
                        error={!!form.formState.errors.numero_identification}
                        placeholder={
                          selectedCountry === 'PT' ? '123456789' :
                          selectedCountry === 'FR' ? '123 456 789 00012' :
                          'Numéro d\'identification'
                        }
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Capital social - Suggest minimum based on legal form */}
                    <div className="space-y-2">
                      <label htmlFor="capital_social" className="text-sm font-medium text-gray-700">
                        Capital social (€) *
                      </label>
                      <Input
                        id="capital_social"
                        type="number"
                        step="0.01"
                        {...form.register('capital_social', { valueAsNumber: true })}
                        error={!!form.formState.errors.capital_social}
                        placeholder={
                          countryConfig.legal_forms.find(f => f.value === form.watch('forme_juridique'))?.min_capital?.toString() || '1000'
                        }
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                      {form.watch('forme_juridique') && (
                        <p className="text-xs text-gray-500">
                          Minimum requis: {countryConfig.legal_forms.find(f => f.value === form.watch('forme_juridique'))?.min_capital || 1}€
                        </p>
                      )}
                    </div>

                    {/* Nombre de parts total */}
                    <div className="space-y-2">
                      <label htmlFor="nombre_parts_total" className="text-sm font-medium text-gray-700">
                        Nombre de parts *
                      </label>
                      <Input
                        id="nombre_parts_total"
                        type="number"
                        {...form.register('nombre_parts_total', { valueAsNumber: true })}
                        error={!!form.formState.errors.nombre_parts_total}
                        placeholder="5000"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Banking Information Section - SEPA 2025 Standards */}
            <Card className="border-l-4 border-l-[#2D5A27]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#2D5A27]" />
                  Coordonnées bancaires
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    SEPA 2025
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {countryConfig.banking_info}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* IBAN - Obligatoire */}
                  <div className="space-y-2">
                    <label htmlFor="iban" className="text-sm font-medium text-gray-700">
                      IBAN * <span className="text-xs text-gray-500">(Obligatoire SEPA)</span>
                    </label>
                    <Input
                      id="iban"
                      {...form.register('iban')}
                      error={!!form.formState.errors.iban}
                      placeholder={
                        selectedCountry === 'PT' ? 'PT50123456789012345678901' :
                        selectedCountry === 'FR' ? 'FR1420041010050500013M02606' :
                        'GB29NWBK60161331926819'
                      }
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 font-mono"
                      onChange={(e) => {
                        // Format IBAN as user types
                        const formatted = e.target.value.toUpperCase().replace(/\s/g, '')
                        form.setValue('iban', formatted)
                      }}
                    />
                    {form.watch('iban') && !validateIBAN(form.watch('iban')) && (
                      <p className="text-sm text-red-600">Format IBAN invalide</p>
                    )}
                  </div>

                  {/* Nom titulaire compte - Obligatoire */}
                  <div className="space-y-2">
                    <label htmlFor="account_holder_name" className="text-sm font-medium text-gray-700">
                      Nom titulaire compte * <span className="text-xs text-gray-500">(Obligatoire SEPA)</span>
                    </label>
                    <Input
                      id="account_holder_name"
                      {...form.register('account_holder_name')}
                      error={!!form.formState.errors.account_holder_name}
                      placeholder="JARDIM PRÓSPERO, LDA"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom banque - Recommandé */}
                  <div className="space-y-2">
                    <label htmlFor="bank_name" className="text-sm font-medium text-gray-700">
                      Nom de la banque <span className="text-xs text-gray-500">(Recommandé)</span>
                    </label>
                    <Input
                      id="bank_name"
                      {...form.register('bank_name')}
                      placeholder="Revolut Bank UAB"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>

                  {/* BIC/SWIFT - Optionnel */}
                  <div className="space-y-2">
                    <label htmlFor="swift_bic" className="text-sm font-medium text-gray-700">
                      Code BIC/SWIFT <span className="text-xs text-gray-500">(Optionnel SEPA 2025)</span>
                    </label>
                    <Input
                      id="swift_bic"
                      {...form.register('swift_bic')}
                      placeholder="REVOLT21"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 font-mono"
                      onChange={(e) => {
                        const formatted = e.target.value.toUpperCase()
                        form.setValue('swift_bic', formatted)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Contact et adresse
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    error={!!form.formState.errors.email}
                    placeholder="contact@exemple.com"
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  />
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <Input
                    id="telephone"
                    type="tel"
                    {...form.register('telephone')}
                    error={!!form.formState.errors.telephone}
                    placeholder={
                      selectedCountry === 'PT' ? '+351 123 456 789' :
                      selectedCountry === 'FR' ? '06 12 34 56 78' :
                      'Numéro de téléphone'
                    }
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <label htmlFor="adresse" className="text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <Textarea
                  id="adresse"
                  {...form.register('adresse')}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                  placeholder={
                    selectedCountry === 'PT' ? 'RUA DOUTOR SÁ CARNEIRO - BAIRRO DA SENRA, N18' :
                    '123 Rue de la Paix'
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Code postal */}
                <div className="space-y-2">
                  <label htmlFor="code_postal" className="text-sm font-medium text-gray-700">
                    Code postal
                  </label>
                  <Input
                    id="code_postal"
                    {...form.register('code_postal')}
                    error={!!form.formState.errors.code_postal}
                    placeholder={
                      selectedCountry === 'PT' ? '3670-234' :
                      selectedCountry === 'FR' ? '75001' :
                      'Code postal'
                    }
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  />
                </div>

                {/* Ville */}
                <div className="space-y-2">
                  <label htmlFor="ville" className="text-sm font-medium text-gray-700">
                    Ville
                  </label>
                  <Input
                    id="ville"
                    {...form.register('ville')}
                    error={!!form.formState.errors.ville}
                    placeholder={
                      selectedCountry === 'PT' ? 'VOUZELA' :
                      selectedCountry === 'FR' ? 'Paris' :
                      'Ville'
                    }
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  />
                </div>

                {/* Pays - Synchronized with pays_constitution */}
                <div className="space-y-2">
                  <label htmlFor="pays" className="text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <Controller
                    name="pays"
                    control={form.control}
                    render={({ field }) => (
                      <RadixSelect 
                        value={field.value || selectedCountry} 
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('pays_constitution', value)
                        }}
                      >
                        <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </RadixSelect>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Options
              </h3>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="is_brouillon"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="is_brouillon"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_brouillon" className="text-sm">
                  Enregistrer comme brouillon
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                En mode brouillon, les champs obligatoires ne sont pas validés et vous pourrez compléter plus tard.
              </p>
            </div>
          </div>
        )
      }}
    </FormShell>
  )
}