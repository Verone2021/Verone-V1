'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormShell } from '@/components/ui/form-shell'
import {
  organisationFormSchema,
  organisationEditFormSchema,
  COUNTRY_OPTIONS,
  type OrganisationFormData,
  type OrganisationEditFormData,
  type Organisation,
} from '@/lib/validations/organisations'
import {
  createOrganisation,
  updateOrganisation,
  type ActionResult,
} from '@/actions/organisations'
import { Lock } from 'lucide-react'

interface OrganisationFormProps {
  organisation?: Organisation
  mode?: 'create' | 'edit'
  onSuccess?: (organisation?: Organisation) => void
  onCancel?: () => void
}

export function OrganisationForm({
  organisation,
  mode = 'create',
  onSuccess,
  onCancel,
}: OrganisationFormProps) {
  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'DE': '🇩🇪',
      'IT': '🇮🇹',
      'GB': '🇬🇧',
      'BE': '🇧🇪',
      'CH': '🇨🇭',
      'NL': '🇳🇱',
      'PT': '🇵🇹',
      'AT': '🇦🇹',
    }
    return flags[countryCode] || '🏳️'
  }

  const getCountryName = (countryCode: string) => {
    const names: Record<string, string> = {
      'FR': 'France',
      'ES': 'Espagne',
      'DE': 'Allemagne',
      'IT': 'Italie',
      'GB': 'Royaume-Uni',
      'BE': 'Belgique',
      'CH': 'Suisse',
      'NL': 'Pays-Bas',
      'PT': 'Portugal',
      'AT': 'Autriche',
    }
    return names[countryCode] || countryCode
  }
  const onSubmit = async (data: OrganisationFormData | OrganisationEditFormData) => {
    let result: ActionResult<Organisation>

    if (mode === 'create') {
      result = await createOrganisation(data as OrganisationFormData)
    } else {
      result = await updateOrganisation(organisation!.id, data as OrganisationEditFormData)
    }

    if (result.ok) {
      // Appeler onSuccess après un court délai pour laisser le temps à FormShell d'afficher le succès
      setTimeout(() => {
        onSuccess?.(result.data)
      }, 1000)
    } else {
      throw new Error(result.error || 'Une erreur est survenue')
    }
  }

  const title = mode === 'create' ? 'Nouvelle organisation' : 'Modifier l\'organisation'
  const submitText = mode === 'create' ? 'Créer l\'organisation' : 'Sauvegarder les modifications'

  return (
    <FormShell
      schema={mode === 'create' ? organisationFormSchema : organisationEditFormSchema}
      title={title}
      description={mode === 'create' 
        ? 'Créez une nouvelle organisation pour un pays spécifique.'
        : 'Modifiez les informations de cette organisation.'
      }
      onSubmit={onSubmit}
      defaultValues={organisation ? (mode === 'create' ? {
        nom: organisation.nom,
        pays: organisation.pays,
        description: organisation.description || '',
        adresse_siege: organisation.adresse_siege || '',
        telephone: organisation.telephone || '',
        email: organisation.email || '',
        site_web: organisation.site_web || '',
      } as OrganisationFormData : {
        nom: organisation.nom,
        description: organisation.description || '',
        adresse_siege: organisation.adresse_siege || '',
        telephone: organisation.telephone || '',
        email: organisation.email || '',
        site_web: organisation.site_web || '',
      } as OrganisationEditFormData) : (mode === 'create' ? {
        nom: '',
        pays: '',
        description: '',
        adresse_siege: '',
        telephone: '',
        email: '',
        site_web: '',
      } as OrganisationFormData : {
        nom: '',
        description: '',
        adresse_siege: '',
        telephone: '',
        email: '',
        site_web: '',
      } as OrganisationEditFormData)}
      submitLabel={submitText}
      onCancel={onCancel}
    >
      {(form) => (
        <div className="space-y-6">
          {/* Fixed Information Section (Edit Mode Only) */}
          {mode === 'edit' && organisation && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" />
                Informations fixes
              </h3>
              <div className="bg-gray-50 rounded-modern p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCountryFlag(organisation.pays)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pays (non modifiable)</p>
                    <p className="text-gray-900 font-medium">{getCountryName(organisation.pays)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pour changer de pays, créez une nouvelle organisation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'edit' ? 'Informations modifiables' : 'Informations obligatoires'}
            </h3>
            
            <div className={`grid gap-4 ${mode === 'edit' ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
              {/* Organisation Name */}
              <div className="space-y-2">
                <label htmlFor="nom" className="text-sm font-medium text-gray-700">
                  Nom de l'organisation *
                </label>
                <Input
                  id="nom"
                  {...form.register('nom')}
                  error={!!form.formState.errors.nom}
                  placeholder="Ex: Want It Now France"
                  autoComplete="organization"
                />
                {form.formState.errors.nom && (
                  <p className="text-sm text-red-600">{(form.formState.errors.nom as any)?.message}</p>
                )}
              </div>

              {/* Country - Only in Create Mode */}
              {mode === 'create' && (
                <div className="space-y-2">
                  <label htmlFor="pays" className="text-sm font-medium text-gray-700">
                    Pays *
                  </label>
                  <Controller
                    name="pays"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id="pays"
                        options={COUNTRY_OPTIONS as any}
                        placeholder="Sélectionnez un pays"
                        error={!!form.formState.errors.pays}
                      />
                    )}
                  />
                  {form.formState.errors.pays && (
                    <p className="text-sm text-red-600">{(form.formState.errors.pays as any)?.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Informations complémentaires
            </h3>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                {...form.register('description')}
                className={`flex min-h-[80px] w-full rounded-modern border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-200 focus:border-brand-copper focus:ring-2 focus:ring-brand-copper/20 resize-none ${
                  form.formState.errors.description ? 'border-red-300 focus:border-red-500' : ''
                }`}
                placeholder="Description de l'organisation..."
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">{(form.formState.errors.description as any)?.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label htmlFor="adresse_siege" className="text-sm font-medium text-gray-700">
                Adresse du siège social
              </label>
              <Input
                id="adresse_siege"
                {...form.register('adresse_siege')}
                error={!!form.formState.errors.adresse_siege}
                placeholder="123 Rue de la République, 75001 Paris"
                autoComplete="street-address"
              />
              {form.formState.errors.adresse_siege && (
                <p className="text-sm text-red-600">{(form.formState.errors.adresse_siege as any)?.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <Input
                  id="telephone"
                  type="tel"
                  {...form.register('telephone')}
                  error={!!form.formState.errors.telephone}
                  placeholder="+33 1 42 00 00 00"
                  autoComplete="tel"
                />
                {form.formState.errors.telephone && (
                  <p className="text-sm text-red-600">{(form.formState.errors.telephone as any)?.message}</p>
                )}
              </div>

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
                  placeholder="contact@wantitnow.fr"
                  autoComplete="email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{(form.formState.errors.email as any)?.message}</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label htmlFor="site_web" className="text-sm font-medium text-gray-700">
                Site web
              </label>
              <Input
                id="site_web"
                type="url"
                {...form.register('site_web')}
                error={!!form.formState.errors.site_web}
                placeholder="https://wantitnow.fr"
                autoComplete="url"
              />
              {form.formState.errors.site_web && (
                <p className="text-sm text-red-600">{(form.formState.errors.site_web as any)?.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </FormShell>
  )
}