"use client"

import { useForm, UseFormReturn, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'
import { makeSchemaPartial } from '@/lib/utils/schema-helpers'

export interface FormShellProps<T extends z.ZodSchema> {
  schema: T
  onSubmit: (data: z.infer<T>) => Promise<void> | void
  title?: string
  description?: string
  children: (form: UseFormReturn<z.infer<T> & any>, isDraftMode: boolean) => React.ReactNode
  submitLabel?: string
  cancelLabel?: string
  draftLabel?: string
  onCancel?: () => void
  onSaveDraft?: (data: Partial<z.infer<T>>) => Promise<void> | void
  defaultValues?: Partial<z.infer<T>>
  className?: string
  cardVariant?: 'default' | 'elevated'
  showCard?: boolean
}

export function FormShell<T extends z.ZodSchema>({
  schema,
  onSubmit,
  title,
  description,
  children,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  draftLabel = 'Sauvegarder comme brouillon',
  onCancel,
  onSaveDraft,
  defaultValues,
  className,
  cardVariant = 'default',
  showCard = true
}: FormShellProps<T>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDraftLoading, setIsDraftLoading] = useState(false)
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<z.infer<T> & any>({
    // Pas de validation client stricte - la validation se fait côté serveur
    mode: 'onSubmit',
    defaultValues
  })

  const handleSubmit = async (data: z.infer<T>) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setIsDraftMode(false) // Mode sauvegarde définitive

    try {
      // Valider avec le schéma principal (strict)
      const validatedData = schema.parse(data)
      await onSubmit(validatedData)
      setSuccess('Les données ont été enregistrées avec succès')
    } catch (err) {
      // Vérifier si c'est une erreur de validation Zod
      if (err instanceof z.ZodError) {
        const firstError = err.errors[0]
        setError(firstError?.message || 'Erreur de validation')
      } else if (err && typeof err === 'object' && 'preventDefault' in err) {
        console.error('FormShell received an Event instead of an Error:', err)
        setError('Une erreur inattendue est survenue lors de la soumission du formulaire')
      } else if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        console.error('FormShell unexpected error type:', err)
        setError('Une erreur est survenue')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async (data: any) => {
    if (!onSaveDraft) return
    
    setIsDraftLoading(true)
    setError(null)
    setSuccess(null)
    setIsDraftMode(true) // Mode brouillon

    try {
      // Pas de validation client pour les brouillons - la validation se fait côté serveur
      await onSaveDraft({ ...data, is_brouillon: true })
      setSuccess('Brouillon sauvegardé avec succès')
    } catch (err) {
      if (err && typeof err === 'object' && 'preventDefault' in err) {
        console.error('FormShell received an Event instead of an Error:', err)
        setError('Une erreur inattendue est survenue lors de la sauvegarde du brouillon')
      } else if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        console.error('FormShell unexpected error type:', err)
        setError('Une erreur est survenue lors de la sauvegarde')
      }
    } finally {
      setIsDraftLoading(false)
    }
  }

  const FormContent = () => (
    <FormProvider {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit(handleSubmit)(e)
        }} 
        className="space-y-6"
      >
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          {children(form, isDraftMode)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading || isDraftLoading}
              >
                {cancelLabel}
              </Button>
            )}
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const formData = form.getValues()
                  handleSaveDraft(formData)
                }}
                disabled={isLoading || isDraftLoading}
                loading={isDraftLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {draftLabel}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            variant="primaryCopper"
            loading={isLoading}
            disabled={isDraftLoading}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  )

  if (!showCard) {
    return (
      <div className={className}>
        <FormContent />
      </div>
    )
  }

  return (
    <Card variant={cardVariant} className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <FormContent />
      </CardContent>
    </Card>
  )
}

// Form Field Components
export interface FormFieldProps {
  label?: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  description,
  required,
  error,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// Example usage component
export function ExampleForm() {
  const userSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse email invalide'),
    role: z.enum(['admin', 'user']),
    bio: z.string().max(500, 'La bio ne peut pas dépasser 500 caractères').optional(),
    notifications: z.boolean().optional()
  })

  const handleSubmit = async (data: z.infer<typeof userSchema>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Form data:', data)
  }

  return (
    <FormShell
      schema={userSchema}
      title="Nouveau Utilisateur"
      description="Créer un nouvel utilisateur avec ses informations de base"
      onSubmit={handleSubmit}
      submitLabel="Créer l'utilisateur"
      onCancel={() => console.log('Cancelled')}
    >
      {(form) => (
        <>
          <FormField
            label="Nom complet"
            required
            error={(form.formState.errors.name as any)?.message}
          >
            <input
              {...form.register('name')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
              placeholder="Entrez le nom complet"
            />
          </FormField>

          <FormField
            label="Adresse email"
            required
            error={(form.formState.errors.email as any)?.message}
          >
            <input
              {...form.register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
              placeholder="nom@exemple.com"
            />
          </FormField>

          <FormField
            label="Rôle"
            required
            error={(form.formState.errors.role as any)?.message}
          >
            <select
              {...form.register('role')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper"
            >
              <option value="">Sélectionner un rôle</option>
              <option value="admin">Administrateur</option>
              <option value="user">Utilisateur</option>
            </select>
          </FormField>

          <FormField
            label="Biographie"
            description="Description optionnelle de l'utilisateur"
            error={(form.formState.errors.bio as any)?.message}
          >
            <textarea
              {...form.register('bio')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper resize-none"
              rows={4}
              placeholder="Décrivez l'utilisateur..."
            />
          </FormField>

          <FormField label="Préférences">
            <div className="flex items-center">
              <input
                {...form.register('notifications')}
                type="checkbox"
                id="notifications"
                className="w-4 h-4 text-brand-copper border-gray-300 rounded focus:ring-brand-copper"
              />
              <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                Recevoir les notifications par email
              </label>
            </div>
          </FormField>
        </>
      )}
    </FormShell>
  )
}

export default FormShell