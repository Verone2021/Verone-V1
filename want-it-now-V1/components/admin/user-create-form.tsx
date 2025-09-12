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
import { 
  Save,
  RefreshCw,
  AlertTriangle,
  Mail,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import { createUserWithAutoAuth } from '@/actions/auth-admin'

// Schema de validation pour la création utilisateur
const userCreateSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Maximum 100 caractères'),
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Maximum 100 caractères'),
  email: z.string().email('Format email invalide').max(255, 'Maximum 255 caractères'),
  telephone: z.string().optional().refine(
    (val) => !val || /^[+]?[\d\s\-\(\)]+$/.test(val),
    'Format de téléphone invalide'
  ),
})

type UserCreateFormData = z.infer<typeof userCreateSchema>

export function UserCreateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
    },
  })

  const onSubmit = async (data: UserCreateFormData) => {
    setIsSubmitting(true)
    try {
      console.log('🔄 Création utilisateur:', data)

      const result = await createUserWithAutoAuth({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone || undefined,
        role: 'admin', // Par défaut admin
      })

      if (result.success) {
        toast.success('Utilisateur créé avec succès')
        router.push('/admin/users')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur création utilisateur:', error)
      toast.error('Erreur inattendue lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vérifier s'il y a des changements
  const hasChanges = () => {
    const values = form.getValues()
    return values.prenom || values.nom || values.email || values.telephone
  }

  return (
    <div className="space-y-6">
      {/* Information sur le processus */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
          <div className="text-sm">
            <p className="font-medium text-green-800">Processus automatisé</p>
            <p className="text-green-700 mt-1">
              Un compte d'authentification sera créé automatiquement et l'utilisateur recevra 
              un email pour définir son mot de passe.
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
                  ⚠️ Attention: Cet email sera utilisé pour l'authentification
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


          {/* Informations sur le processus de création */}
          {hasChanges() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Processus de création</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Création du compte utilisateur</li>
                    <li>Génération du compte d'authentification</li>
                    <li>Envoi d'un email d'invitation</li>
                    <li>L'utilisateur pourra définir son mot de passe</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/users')}
              disabled={isSubmitting}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer l'utilisateur
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
                <li>Errors: {Object.keys(form.formState.errors).length}</li>
              </ul>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}