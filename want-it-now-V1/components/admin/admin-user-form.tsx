'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadixSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Phone, Mail, Shield, Building, Info, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { createBasicUser } from '@/actions/utilisateurs'
import { assignUserToOrganisation } from '@/actions/user-assignments'

interface Organisation {
  id: string
  nom: string
  pays: string
}

interface Capabilities {
  canCreateSuperAdmin: boolean
  canCreateAdmin: boolean
  canAssignOrganisations: boolean
  availableOrganisations: Organisation[]
  userRole: 'super_admin' | 'admin'
}

interface AdminUserFormProps {
  capabilities: Capabilities
}

// Schéma de validation selon les capacités
const createUserSchema = (capabilities: Capabilities) => {
  const baseSchema = {
    prenom: z.string().min(1, 'Le prénom est requis'),
    nom: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    telephone: z.string().optional(),
  }

  // Définir les rôles disponibles
  const availableRoles: string[] = []
  if (capabilities.canCreateAdmin) availableRoles.push('admin')
  if (capabilities.canCreateSuperAdmin) availableRoles.push('super_admin')


  return z.object({
    ...baseSchema,
    role: z.string().refine(value => availableRoles.includes(value), {
      message: 'Le rôle sélectionné n\'est pas valide'
    }),
    ...(capabilities.canAssignOrganisations && {
      assignedOrganisations: z.array(z.string()).optional()
    })
  })
}

export function AdminUserForm({ capabilities }: AdminUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>([])

  const schema = createUserSchema(capabilities)
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const selectedRole = watch('role')

  // Gestion des organisations sélectionnées
  const handleOrganisationChange = (organisationId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedOrganisations, organisationId]
      : selectedOrganisations.filter(id => id !== organisationId)
    
    setSelectedOrganisations(newSelection)
    setValue('assignedOrganisations' as any, newSelection)
  }

  // Soumission du formulaire
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)

      // 1. Créer l'utilisateur basique
      const result = await createBasicUser({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone || null,
        role: selectedRole as 'admin' | 'super_admin' | 'locataire'
      })

      if (!result.success) {
        toast.error(result.error || 'Erreur lors de la création')
        return
      }

      const newUserId = result.data?.id
      if (!newUserId) {
        toast.error('ID utilisateur non retourné')
        return
      }

      // 2. Assigner aux organisations si nécessaire et autorisé
      if (capabilities.canAssignOrganisations && selectedOrganisations.length > 0 && data.role === 'admin') {
        const assignmentPromises = selectedOrganisations.map(orgId =>
          assignUserToOrganisation({
            userId: newUserId,
            organisationId: orgId,
            role: 'admin'
          })
        )

        const assignmentResults = await Promise.all(assignmentPromises)
        const failedAssignments = assignmentResults.filter(r => !r.success)
        
        if (failedAssignments.length > 0) {
          toast.warning(`Utilisateur créé mais ${failedAssignments.length} assignation(s) ont échoué`)
        }
      }

      toast.success('Utilisateur créé avec succès')
      router.push('/admin/utilisateurs')
      router.refresh()

    } catch (error: any) {
      toast.error(error.message || 'Erreur inattendue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations personnelles */}
      <Card className="modern-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations Personnelles
          </CardTitle>
          <CardDescription>
            Renseignez les informations de base de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                {...register('prenom')}
                placeholder="Jean"
                className={errors.prenom ? 'border-red-500' : ''}
              />
              {errors.prenom && (
                <p className="text-sm text-red-500 mt-1">{errors.prenom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom')}
                placeholder="Dupont"
                className={errors.nom ? 'border-red-500' : ''}
              />
              {errors.nom && (
                <p className="text-sm text-red-500 mt-1">{errors.nom.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="jean.dupont@exemple.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="telephone"
                {...register('telephone')}
                placeholder="+33 1 23 45 67 89"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rôle et permissions */}
      <Card className="modern-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Rôle et Permissions
          </CardTitle>
          <CardDescription>
            Définissez le niveau d'accès de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select onValueChange={(value) => setValue('role', value as any)}>
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {capabilities.canCreateAdmin && (
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Administrateur
                    </div>
                  </SelectItem>
                )}
                {capabilities.canCreateSuperAdmin && (
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Super Administrateur
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Informations sur les rôles */}
          {selectedRole && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedRole === 'admin' && (
                  "Les administrateurs peuvent gérer les utilisateurs et les biens de leurs organisations."
                )}
                {selectedRole === 'super_admin' && (
                  "Les super administrateurs ont accès à toutes les fonctionnalités de la plateforme."
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Assignation d'organisations (pour les admins seulement) */}
      {capabilities.canAssignOrganisations && selectedRole === 'admin' && (
        <Card className="modern-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Organisations
            </CardTitle>
            <CardDescription>
              Sélectionnez les organisations que cet administrateur pourra gérer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {capabilities.availableOrganisations.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Aucune organisation disponible pour assignation.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {capabilities.availableOrganisations.map((org) => (
                  <div key={org.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`org-${org.id}`}
                      checked={selectedOrganisations.includes(org.id)}
                      onCheckedChange={(checked) => 
                        handleOrganisationChange(org.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`org-${org.id}`} className="font-medium cursor-pointer">
                        {org.nom}
                      </Label>
                      <p className="text-sm text-gray-500">{org.pays}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedOrganisations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm font-medium">Organisations sélectionnées :</span>
                {selectedOrganisations.map(orgId => {
                  const org = capabilities.availableOrganisations.find(o => o.id === orgId)
                  return (
                    <Badge key={orgId} variant="secondary">
                      {org?.nom}
                    </Badge>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        
        <Button 
          type="submit" 
          className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
        </Button>
      </div>
    </form>
  )
}