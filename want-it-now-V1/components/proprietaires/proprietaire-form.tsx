'use client'

import { useState } from 'react'
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
import { Users, Building2, Lock, CreditCard } from 'lucide-react'

import {
  createProprietaireSchema,
  updateProprietaireSchema,
  FORME_JURIDIQUE_OPTIONS,
  PROPRIETAIRE_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  type CreateProprietaire,
  type UpdateProprietaire,
  type Proprietaire,
} from '@/lib/validations/proprietaires'
import {
  createProprietaire,
  updateProprietaire,
} from '@/actions/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface ProprietaireFormProps {
  proprietaire?: Proprietaire
  mode?: 'create' | 'edit'
  onSuccess?: (proprietaire?: Proprietaire) => void
  onCancel?: () => void
}

// ==============================================================================
// FORM COMPONENT
// ==============================================================================

export function ProprietaireForm({
  proprietaire,
  mode = 'create',
  onSuccess,
  onCancel,
}: ProprietaireFormProps) {

  const onSubmit = async (data: CreateProprietaire | UpdateProprietaire) => {
    let result: any

    if (mode === 'create') {
      result = await createProprietaire(data as CreateProprietaire)
    } else {
      result = await updateProprietaire(proprietaire!.id, data as Partial<CreateProprietaire>)
    }

    if (result.success) {
      // Appeler onSuccess après un court délai pour laisser le temps à FormShell d'afficher le succès
      setTimeout(() => {
        onSuccess?.(result.data)
      }, 1000)
    } else {
      throw new Error(result.error || 'Une erreur est survenue')
    }
  }

  const onSaveDraft = async (data: Partial<CreateProprietaire | UpdateProprietaire>) => {
    // Forcer le mode brouillon
    const draftData = {
      ...data,
      is_brouillon: true
    } as CreateProprietaire

    let result: any

    if (mode === 'create') {
      result = await createProprietaire(draftData)
    } else {
      result = await updateProprietaire(proprietaire!.id, draftData as Partial<CreateProprietaire>)
    }

    if (result.success) {
      // Appeler onSuccess après un court délai pour laisser le temps à FormShell d'afficher le succès
      setTimeout(() => {
        onSuccess?.(result.data)
      }, 1000)
    } else {
      throw new Error(result.error || 'Une erreur est survenue lors de la sauvegarde du brouillon')
    }
  }

  const title = mode === 'create' ? 'Nouveau propriétaire' : 'Modifier le propriétaire'
  const submitText = mode === 'create' ? 'Créer le propriétaire' : 'Sauvegarder les modifications'

  // Préparer les valeurs par défaut selon le mode
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
        
        // Informations bancaires
        iban: proprietaire.iban || '',
        account_holder_name: proprietaire.account_holder_name || '',
        bank_name: proprietaire.bank_name || '',
        swift_bic: proprietaire.swift_bic || '',
        
        is_brouillon: proprietaire.is_brouillon,
      } as CreateProprietaire | UpdateProprietaire
    } else {
      return {
        type: 'physique',
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        code_postal: '',
        ville: '',
        pays: 'FR',
        date_naissance: '',
        lieu_naissance: '',
        nationalite: 'Française',
        // Informations bancaires
        iban: '',
        account_holder_name: '',
        bank_name: '',
        swift_bic: '',
        is_brouillon: false,
      } as CreateProprietaire
    }
  }

  return (
    <FormShell
      schema={mode === 'create' ? createProprietaireSchema : updateProprietaireSchema}
      title={title}
      description={mode === 'create' 
        ? 'Créez un nouveau propriétaire (personne physique ou morale).'
        : 'Modifiez les informations de ce propriétaire.'
      }
      onSubmit={onSubmit}
      onSaveDraft={mode === 'create' ? onSaveDraft : undefined}
      defaultValues={getDefaultValues()}
      submitLabel={submitText}
      draftLabel="Sauvegarder comme brouillon"
      onCancel={onCancel}
    >
      {(form, isDraftMode) => (
        <div className="space-y-6">
          {/* Required Fields Summary - Adaptatif selon le mode */}
          <div className={`border rounded-lg p-4 ${
            isDraftMode 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-xs mt-0.5 ${
                isDraftMode ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {isDraftMode ? '📝' : 'i'}
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${
                  isDraftMode ? 'text-yellow-900' : 'text-blue-900'
                }`}>
                  {isDraftMode ? (
                    <>Mode brouillon activé - Validation souple</>
                  ) : (
                    <>Champs obligatoires pour {form.watch('type') === 'physique' ? 'une personne physique' : 'une personne morale'}</>
                  )}
                </h4>
                
                {isDraftMode ? (
                  <div className="text-sm text-yellow-800">
                    <p className="mb-2">En mode brouillon, vous pouvez sauvegarder avec des champs incomplets.</p>
                    <div className="text-xs">
                      <span className="text-yellow-600">💡</span> Conseillé de remplir au minimum : 
                      {form.watch('type') === 'physique' ? ' nom et prénom' : ' raison sociale et pays'}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-800">
                    {form.watch('type') === 'physique' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <span>• Nom de famille</span>
                        <span>• Prénom</span>
                        <span>• Date de naissance (18-120 ans)</span>
                        <span>• Lieu de naissance</span>
                        <span>• Nationalité</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <span>• Raison sociale</span>
                        <span>• Pays d'immatriculation</span>
                        <span>• Forme juridique</span>
                        <span>• N° identification</span>
                        <span>• Capital social</span>
                        <span>• Nombre de parts</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className={`text-xs mt-2 ${
                  isDraftMode ? 'text-yellow-700' : 'text-blue-700'
                }`}>
                  {isDraftMode ? (
                    <>Mode souple • Sauvegarde possible avec champs partiels</>
                  ) : (
                    <><span className="text-red-500">*</span> = Champ obligatoire • Les autres champs sont optionnels</>
                  )}
                </p>
              </div>
            </div>
          </div>
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
                    // Reset form when changing type
                    if (mode === 'create') {
                      form.reset({
                        ...form.getValues(),
                        type: value as 'physique' | 'morale',
                        // Clear type-specific fields
                        date_naissance: '',
                        lieu_naissance: '',
                        nationalite: '',
                        forme_juridique: 'SARL',
                        numero_identification: '',
                        capital_social: 0,
                        nombre_parts_total: 100,
                      })
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-4"
                  disabled={mode === 'edit'} // Type non modifiable en édition
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
            {form.formState.errors.type && (
              <p className="text-sm text-red-600">{(form.formState.errors.type as any)?.message}</p>
            )}
          </div>

          {/* Type locked indicator for edit mode */}
          {mode === 'edit' && proprietaire && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-600">
                  Le type de propriétaire ne peut pas être modifié après création
                </p>
              </div>
            </div>
          )}

          {/* Pays selection for personne morale */}
          {form.watch('type') === 'morale' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Sélection du pays
              </h3>
              <div className="space-y-2">
                <label htmlFor="pays" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Pays d'immatriculation
                  {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                  {isDraftMode && <span className="text-xs text-gray-500">(conseillé)</span>}
                </label>
                <Controller
                  name="pays"
                  control={form.control}
                  render={({ field }) => (
                    <RadixSelect value={field.value || 'FR'} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white">
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
                {form.formState.errors.pays && (
                  <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                    <span className="text-red-500">⚠</span>
                    <span>{(form.formState.errors.pays as any)?.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  La sélection du pays détermine les formes juridiques disponibles.
                </p>
              </div>
            </div>
          )}

          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Informations {form.watch('type') === 'physique' ? 'personnelles' : 'entreprise'}
            </h3>

            {/* Nom */}
            <div className="space-y-2">
              <label htmlFor="nom" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                {form.watch('type') === 'physique' ? 'Nom de famille' : 'Raison sociale'} 
                {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                <span className="text-xs text-gray-500">
                  {isDraftMode ? '(conseillé)' : '(obligatoire)'}
                </span>
              </label>
              <Input
                id="nom"
                {...form.register('nom')}
                error={!!form.formState.errors.nom}
                placeholder={form.watch('type') === 'physique' ? 'Dupont' : 'Ma Société SARL'}
                className={`bg-white h-11 transition-colors ${
                  form.formState.errors.nom 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                }`}
                required
                data-testid="nom-input"
              />
              {form.formState.errors.nom && (
                <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                  <span className="text-red-500">⚠</span>
                  <span>{(form.formState.errors.nom as any)?.message}</span>
                </div>
              )}
            </div>

            {/* Fields spécifiques selon le type */}
            {form.watch('type') === 'physique' ? (
              <>
                {/* Prénom */}
                <div className="space-y-2">
                  <label htmlFor="prenom" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Prénom 
                    {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                    <span className="text-xs text-gray-500">
                      {isDraftMode ? '(conseillé)' : '(obligatoire)'}
                    </span>
                  </label>
                  <Input
                    id="prenom"
                    {...form.register('prenom')}
                    error={!!form.formState.errors.prenom}
                    placeholder="Jean"
                    className={`bg-white h-11 transition-colors ${
                      form.formState.errors.prenom 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                    }`}
                    required
                    data-testid="prenom-input"
                  />
                  {form.formState.errors.prenom && (
                    <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                      <span className="text-red-500">⚠</span>
                      <span>{(form.formState.errors.prenom as any)?.message}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date de naissance */}
                  <div className="space-y-2">
                    <label htmlFor="date_naissance" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Date de naissance 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      {isDraftMode && <span className="text-xs text-gray-500">(conseillé)</span>}
                    </label>
                    <Input
                      id="date_naissance"
                      type="date"
                      {...form.register('date_naissance')}
                      error={!!form.formState.errors.date_naissance}
                      className={`bg-white h-11 transition-colors ${
                        form.formState.errors.date_naissance 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                      }`}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                      required
                      data-testid="date-naissance-input"
                    />
                    <p className="text-xs text-gray-500">Âge requis : entre 18 et 120 ans</p>
                    {form.formState.errors.date_naissance && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.date_naissance as any)?.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Lieu de naissance */}
                  <div className="space-y-2">
                    <label htmlFor="lieu_naissance" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Lieu de naissance 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      <span className="text-xs text-gray-500">
                        {isDraftMode ? '(conseillé)' : '(min. 2 caractères)'}
                      </span>
                    </label>
                    <Input
                      id="lieu_naissance"
                      {...form.register('lieu_naissance')}
                      error={!!form.formState.errors.lieu_naissance}
                      placeholder="Paris"
                      className={`bg-white h-11 transition-colors ${
                        form.formState.errors.lieu_naissance 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                      }`}
                      minLength={2}
                      required
                      data-testid="lieu-naissance-input"
                    />
                    {form.formState.errors.lieu_naissance && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.lieu_naissance as any)?.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Nationalité */}
                  <div className="space-y-2">
                    <label htmlFor="nationalite" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Nationalité
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      {isDraftMode && <span className="text-xs text-gray-500">(conseillé)</span>}
                    </label>
                    <Input
                      id="nationalite"
                      {...form.register('nationalite')}
                      error={!!form.formState.errors.nationalite}
                      placeholder="Française"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                    {form.formState.errors.nationalite && (
                      <p className="text-sm text-red-600">{(form.formState.errors.nationalite as any)?.message}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Forme juridique */}
                  <div className="space-y-2">
                    <label htmlFor="forme_juridique" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Forme juridique 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      <span className="text-xs text-gray-500">
                        {isDraftMode ? '(conseillé)' : '(obligatoire)'}
                      </span>
                    </label>
                    <Controller
                      name="forme_juridique"
                      control={form.control}
                      render={({ field }) => {
                        // Filtrer les formes juridiques selon le pays sélectionné
                        const selectedCountry = form.watch('pays') || 'FR'
                        const filteredOptions = FORME_JURIDIQUE_OPTIONS.filter(option => {
                          switch (selectedCountry) {
                            case 'FR':
                              return ['SARL', 'SAS', 'SA', 'SCI', 'EURL', 'SASU', 'GIE', 'Association', 'Autre'].includes(option.value)
                            case 'PT':
                              return ['LDA', 'SA_PT', 'SU', 'Autre'].includes(option.value)
                            case 'ES':
                              return ['SL', 'SA_ES', 'Autre'].includes(option.value)
                            default:
                              return option.value === 'Autre' // Autres pays = forme juridique "Autre" uniquement
                          }
                        })

                        return (
                          <RadixSelect value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger className={`bg-white h-11 transition-colors ${
                              form.formState.errors.forme_juridique 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                            }`}>
                              <SelectValue placeholder="Sélectionnez une forme juridique" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </RadixSelect>
                        )
                      }}
                    />
                    {form.formState.errors.forme_juridique && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.forme_juridique as any)?.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Numéro d'identification */}
                  <div className="space-y-2">
                    <label htmlFor="numero_identification" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      N° identification 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      <span className="text-xs text-gray-500">
                        {isDraftMode ? '(conseillé)' : '(SIRET, SIREN, etc.)'}
                      </span>
                    </label>
                    <Input
                      id="numero_identification"
                      {...form.register('numero_identification')}
                      error={!!form.formState.errors.numero_identification}
                      placeholder="SIRET 123 456 789 00012"
                      className={`bg-white h-11 transition-colors ${
                        form.formState.errors.numero_identification 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                      }`}
                      required
                      data-testid="numero-identification-input"
                    />
                    {form.formState.errors.numero_identification && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.numero_identification as any)?.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capital social */}
                  <div className="space-y-2">
                    <label htmlFor="capital_social" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Capital social (€) 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      <span className="text-xs text-gray-500">
                        {isDraftMode ? '(conseillé)' : '(min. 1€)'}
                      </span>
                    </label>
                    <Input
                      id="capital_social"
                      type="number"
                      step="0.01"
                      min="1"
                      {...form.register('capital_social', { valueAsNumber: true })}
                      error={!!form.formState.errors.capital_social}
                      placeholder="50000"
                      className={`bg-white h-11 transition-colors ${
                        form.formState.errors.capital_social 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                      }`}
                      required
                      data-testid="capital-social-input"
                    />
                    {form.formState.errors.capital_social && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.capital_social as any)?.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Nombre de parts total */}
                  <div className="space-y-2">
                    <label htmlFor="nombre_parts_total" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Nombre de parts 
                      {!isDraftMode && <span className="text-red-500 text-base">*</span>}
                      <span className="text-xs text-gray-500">
                        {isDraftMode ? '(conseillé)' : '(min. 1)'}
                      </span>
                    </label>
                    <Input
                      id="nombre_parts_total"
                      type="number"
                      min="1"
                      {...form.register('nombre_parts_total', { valueAsNumber: true })}
                      error={!!form.formState.errors.nombre_parts_total}
                      placeholder="100"
                      className={`bg-white h-11 transition-colors ${
                        form.formState.errors.nombre_parts_total 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'focus:border-[#D4841A] focus:ring-[#D4841A]/20'
                      }`}
                      required
                      data-testid="nombre-parts-total-input"
                    />
                    {form.formState.errors.nombre_parts_total && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                        <span className="text-red-500">⚠</span>
                        <span>{(form.formState.errors.nombre_parts_total as any)?.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{(form.formState.errors.email as any)?.message}</p>
                )}
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
                  placeholder="06 12 34 56 78"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.telephone && (
                  <p className="text-sm text-red-600">{(form.formState.errors.telephone as any)?.message}</p>
                )}
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
                placeholder="123 Rue de la Paix"
                rows={2}
              />
              {form.formState.errors.adresse && (
                <p className="text-sm text-red-600">{(form.formState.errors.adresse as any)?.message}</p>
              )}
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
                  placeholder="75001"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.code_postal && (
                  <p className="text-sm text-red-600">{(form.formState.errors.code_postal as any)?.message}</p>
                )}
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
                  placeholder="Paris"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.ville && (
                  <p className="text-sm text-red-600">{(form.formState.errors.ville as any)?.message}</p>
                )}
              </div>

              {/* Pays */}
              <div className="space-y-2">
                <label htmlFor="pays" className="text-sm font-medium text-gray-700">
                  Pays
                </label>
                <Controller
                  name="pays"
                  control={form.control}
                  render={({ field }) => (
                    <RadixSelect value={field.value || 'FR'} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
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
                {form.formState.errors.pays && (
                  <p className="text-sm text-red-600">{(form.formState.errors.pays as any)?.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Banking Information Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-[#D4841A]" />
              <h3 className="text-lg font-medium text-gray-900">
                Informations bancaires
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Ces informations sont nécessaires pour effectuer les virements SEPA. L'IBAN et le nom du titulaire sont obligatoires si vous renseignez des informations bancaires.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IBAN */}
              <div className="space-y-2">
                <label htmlFor="iban" className="text-sm font-medium text-gray-700">
                  IBAN
                </label>
                <Input
                  id="iban"
                  {...form.register('iban')}
                  error={!!form.formState.errors.iban}
                  placeholder="FR14 2004 1010 0505 0001 3M02 606"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 font-mono"
                />
                {form.formState.errors.iban && (
                  <p className="text-sm text-red-600">{(form.formState.errors.iban as any)?.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Format international : 2 lettres pays + 2 chiffres contrôle + jusqu'à 30 caractères
                </p>
              </div>

              {/* Nom du titulaire */}
              <div className="space-y-2">
                <label htmlFor="account_holder_name" className="text-sm font-medium text-gray-700">
                  Nom du titulaire du compte
                </label>
                <Input
                  id="account_holder_name"
                  {...form.register('account_holder_name')}
                  error={!!form.formState.errors.account_holder_name}
                  placeholder="Jean Dupont ou Ma Société SARL"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.account_holder_name && (
                  <p className="text-sm text-red-600">{(form.formState.errors.account_holder_name as any)?.message}</p>
                )}
              </div>

              {/* Nom de la banque */}
              <div className="space-y-2">
                <label htmlFor="bank_name" className="text-sm font-medium text-gray-700">
                  Nom de la banque
                </label>
                <Input
                  id="bank_name"
                  {...form.register('bank_name')}
                  error={!!form.formState.errors.bank_name}
                  placeholder="Crédit Agricole, BNP Paribas..."
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                />
                {form.formState.errors.bank_name && (
                  <p className="text-sm text-red-600">{(form.formState.errors.bank_name as any)?.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Recommandé pour faciliter l'identification
                </p>
              </div>

              {/* Code BIC/SWIFT */}
              <div className="space-y-2">
                <label htmlFor="swift_bic" className="text-sm font-medium text-gray-700">
                  Code BIC/SWIFT
                </label>
                <Input
                  id="swift_bic"
                  {...form.register('swift_bic')}
                  error={!!form.formState.errors.swift_bic}
                  placeholder="AGRIFRPP882"
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11 font-mono"
                />
                {form.formState.errors.swift_bic && (
                  <p className="text-sm text-red-600">{(form.formState.errors.swift_bic as any)?.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Optionnel pour les virements SEPA, requis pour l'international
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </FormShell>
  )
}