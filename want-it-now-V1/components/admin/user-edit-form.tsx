'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { updateUser } from '@/actions/utilisateurs'

// Schema de validation pour l'édition utilisateur (sans rôle)
const userEditSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Maximum 100 caractères'),
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  email: z.string().email('Format email invalide').max(255, 'Maximum 255 caractères'),
  telephone: z.string().optional().refine(
    (val) => !val || /^[+]?[\d\s\-\(\)]+$/.test(val),
    'Format de téléphone invalide'
  ),
})

type UserEditFormData = z.infer<typeof userEditSchema>

interface User {
  id: string
  email: string
  prenom?: string
  nom?: string
  telephone?: string
  role?: string
  user_roles?: Array<{
    role: string
    organisation_id: string
    organisation: {
      id: string
      nom: string
      pays: string
    }
  }>
}

interface UserEditFormProps {
  user: User
}

export function UserEditForm({ user }: UserEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email,
      telephone: user.telephone || '',
    },
  })

  const onSubmit = async (data: UserEditFormData) => {
    setIsSubmitting(true)
    try {
      console.log('🔄 Mise à jour utilisateur:', data)

      const result = await updateUser(user.id, {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone || null,
      })

      if (result.success) {
        toast.success('Utilisateur modifié avec succès')
        router.push(`/admin/users/${user.id}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur modification utilisateur:', error)
      toast.error('Erreur inattendue lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vérifier s'il y a des changements
  const hasChanges = () => {
    const currentValues = form.getValues()
    return (
      currentValues.prenom !== (user.prenom || '') ||
      currentValues.nom !== (user.nom || '') ||
      currentValues.email !== user.email ||
      currentValues.telephone !== (user.telephone || '')
    )
  }

  return (
    <div className="space-y-6">
      {/* Information sur la limitation */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Modification limitée</p>
            <p className="text-yellow-700 mt-1">
              Ce formulaire permet uniquement de modifier les informations personnelles. 
              Pour changer les rôles, utilisez l'option "Changer rôle" dans la table de gestion.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Jean"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Dupont"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="Ex: jean.dupont@exemple.fr"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">
                  ⚠️ Attention: Modifier l'email peut affecter l'authentification
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="Ex: +33 1 23 45 67 89"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Informations sur les changements */}
          {hasChanges() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Modifications détectées</p>
                  <p className="mt-1">
                    Les changements seront appliqués uniquement aux informations personnelles.
                    Les rôles et organisations restent inchangés.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/admin/users/${user.id}`)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !hasChanges() || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>

          {/* Informations de debug en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
              <strong>Debug:</strong>
              <ul className="mt-1 space-y-1">
                <li>Valid: {form.formState.isValid ? '✅' : '❌'}</li>
                <li>Has changes: {hasChanges() ? '✅' : '❌'}</li>
                <li>Submitting: {isSubmitting ? '✅' : '❌'}</li>
              </ul>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}