'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Save, AlertCircle, Shield, Users, Crown, Mail, Phone } from 'lucide-react'
import { createBasicUser } from '@/actions/utilisateurs'

// Schéma de validation simplifié
const basicUserSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  role: z.enum(['admin', 'super_admin'], { 
    message: 'Veuillez sélectionner un rôle' 
  })
})

type BasicUserFormData = z.infer<typeof basicUserSchema>

interface SuperAdminUserFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    description: 'Peut gérer les utilisateurs de ses organisations assignées',
    icon: <Users className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  super_admin: {
    label: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités et organisations',
    icon: <Crown className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
}

function SuperAdminUserForm({ onSuccess, onCancel }: SuperAdminUserFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<BasicUserFormData>({
    resolver: zodResolver(basicUserSchema),
    mode: 'onChange'
  })

  const selectedRole = watch('role')

  // Définir les options pour le composant Select
  const roleOptions = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'super_admin', label: 'Super Administrateur' }
  ]

  const handleCancel = () => {
    reset()
    setError(null)
    setSuccess(false)
    if (onCancel) onCancel()
  }

  const onSubmit = async (data: BasicUserFormData) => {
    if (loading || isPending) return

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        setLoading(true)
        console.log('🚀 [SUPER-ADMIN-FORM] Soumission formulaire avec données:', {
          email: data.email,
          prenom: data.prenom, 
          nom: data.nom,
          role: data.role,
          telephone: data.telephone
        })

        const result = await createBasicUser(data)

        if (!result.success) {
          console.error('❌ [SUPER-ADMIN-FORM] Erreur createBasicUser:', result.error)
          throw new Error(result.error || 'Erreur lors de la création du profil')
        }

        console.log('✅ [SUPER-ADMIN-FORM] Utilisateur créé avec succès:', result.data)
        setSuccess(true)
        
        // Réinitialiser le formulaire après succès
        reset()
        
        // Appeler le callback de succès si fourni
        if (onSuccess) {
          onSuccess()
        }

      } catch (err) {
        console.error('💥 [SUPER-ADMIN-FORM] Erreur inattendue:', err)
        const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" />
          Créer un Utilisateur
        </CardTitle>
        <CardDescription className="text-gray-600">
          Créer un nouvel administrateur ou super administrateur dans le système
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Utilisateur créé avec succès !</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              L'utilisateur peut maintenant se connecter avec son adresse email.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  type="text"
                  placeholder="Prénom"
                  disabled={loading}
                  className="focus-copper"
                  {...register('prenom')}
                />
                {errors.prenom && (
                  <p className="text-sm text-red-600">{errors.prenom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  type="text"
                  placeholder="Nom de famille"
                  disabled={loading}
                  className="focus-copper"
                  {...register('nom')}
                />
                {errors.nom && (
                  <p className="text-sm text-red-600">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@organisation.com"
                  className="pl-10 focus-copper"
                  disabled={loading}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Numéro de téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+33 1 23 45 67 89"
                  className="pl-10 focus-copper"
                  disabled={loading}
                  {...register('telephone')}
                />
              </div>
              {errors.telephone && (
                <p className="text-sm text-red-600">{errors.telephone.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Rôle et permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rôle et Permissions
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="role">Type d'utilisateur *</Label>
              <Select 
                options={roleOptions}
                value={selectedRole} 
                onChange={(value) => setValue('role', value as 'admin' | 'super_admin')}
                disabled={loading}
                placeholder="Sélectionner un rôle"
                error={!!errors.role}
                className="focus-copper"
              />
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Aperçu du rôle sélectionné */}
            {selectedRole && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start gap-3">
                  <Badge className={`${ROLE_CONFIG[selectedRole]?.color || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
                    {ROLE_CONFIG[selectedRole]?.icon || <User className="h-4 w-4" />}
                    {ROLE_CONFIG[selectedRole]?.label || selectedRole}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  {ROLE_CONFIG[selectedRole]?.description || 'Utilisateur standard'}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="min-w-[100px]"
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </div>
              ) : (
                'Créer l\'utilisateur'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export { SuperAdminUserForm }