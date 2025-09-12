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
import { Separator } from '@/components/ui/separator'
import { 
  User, Phone, Mail, Shield, Building, Info, Settings, 
  AlertCircle, UserPlus, Briefcase, Home, Users, ChevronRight 
} from 'lucide-react'
import { toast } from 'sonner'
import { createBasicUser } from '@/actions/utilisateurs'
import { assignUserToOrganisation } from '@/actions/user-assignments'
import { cn } from '@/lib/utils'

// Types d'entités
interface Organisation {
  id: string
  nom: string
  pays: string
  is_active?: boolean
}


// Système de capabilities étendu
export interface UserFormCapabilities {
  // Rôle de l'utilisateur actuel
  userRole: 'super_admin' | 'admin'
  
  // Permissions de création de rôles
  canCreateSuperAdmin: boolean
  canCreateAdmin: boolean
  canCreateLocataire: boolean
  canCreateCollaborateur: boolean
  
  // Permissions d'assignation
  canAssignOrganisations: boolean
  
  // Données disponibles
  availableOrganisations: Organisation[]
  
  // Options d'affichage
  showAdvancedOptions?: boolean
  formTitle?: string
  formDescription?: string
}

interface UnifiedUserFormProps {
  capabilities: UserFormCapabilities
  mode?: 'create' | 'edit'
  existingUser?: any
  onSuccess?: () => void
}

// Schéma de validation dynamique
const createDynamicSchema = (capabilities: UserFormCapabilities) => {
  const baseSchema = {
    prenom: z.string().min(1, 'Le prénom est requis'),
    nom: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    telephone: z.string().optional(),
  }

  // Déterminer les rôles disponibles
  const availableRoles: string[] = []
  if (capabilities.canCreateSuperAdmin) availableRoles.push('super_admin')
  if (capabilities.canCreateAdmin) availableRoles.push('admin')
  if (capabilities.canCreateLocataire) availableRoles.push('locataire')
  if (capabilities.canCreateCollaborateur) availableRoles.push('collaborateur')

  // Ajouter le schéma de rôle
  const roleSchema = availableRoles.length > 0 
    ? z.enum(availableRoles as [string, ...string[]])
    : z.literal('admin')

  // Construire le schéma complet
  return z.object({
    ...baseSchema,
    role: roleSchema,
    assignedOrganisations: capabilities.canAssignOrganisations 
      ? z.array(z.string()).optional()
      : z.array(z.string()).optional().default([]),
  })
}

// Mapping des icônes par rôle
const roleIcons = {
  super_admin: Shield,
  admin: Settings,
  locataire: Users,
  collaborateur: Briefcase
}

// Mapping des couleurs par rôle
const roleColors = {
  super_admin: 'bg-red-500 text-white',
  admin: 'bg-blue-500 text-white',
  locataire: 'bg-yellow-500 text-white',
  collaborateur: 'bg-purple-500 text-white'
}

// Mapping des labels par rôle
const roleLabels = {
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  locataire: 'Locataire',
  collaborateur: 'Collaborateur'
}

export function UnifiedUserForm({ 
  capabilities, 
  mode = 'create',
  existingUser,
  onSuccess 
}: UnifiedUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>(
    existingUser?.organisations || []
  )

  const schema = createDynamicSchema(capabilities)
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: existingUser || {}
  })

  const selectedRole = watch('role')

  // Déterminer quels champs afficher selon le rôle sélectionné
  const shouldShowOrganisations = () => {
    if (!capabilities.canAssignOrganisations) return false
    // Seulement pour admin - super_admin a accès à toutes les organisations par défaut
    return selectedRole === 'admin'
  }


  // Gestion des organisations sélectionnées
  const handleOrganisationToggle = (orgId: string) => {
    const newSelection = selectedOrganisations.includes(orgId)
      ? selectedOrganisations.filter(id => id !== orgId)
      : [...selectedOrganisations, orgId]
    
    setSelectedOrganisations(newSelection)
    setValue('assignedOrganisations', newSelection)
  }


  // Soumission du formulaire
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      // Créer l'utilisateur
      const result = await createBasicUser({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        role: data.role as any
      })

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      // Assigner les organisations si nécessaire
      if (data.assignedOrganisations && data.assignedOrganisations.length > 0) {
        for (const orgId of data.assignedOrganisations) {
          await assignUserToOrganisation({
            userId: result.data.id,
            organisationId: orgId,
            role: data.role as any
          })
        }
      }

      toast.success(mode === 'create' ? 'Utilisateur créé avec succès' : 'Utilisateur modifié avec succès')
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/utilisateurs')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Déterminer les rôles disponibles à afficher
  const availableRoles: string[] = []
  if (capabilities.canCreateSuperAdmin) availableRoles.push('super_admin')
  if (capabilities.canCreateAdmin) availableRoles.push('admin')
  if (capabilities.canCreateLocataire) availableRoles.push('locataire')
  if (capabilities.canCreateCollaborateur) availableRoles.push('collaborateur')

  return (
    <Card className="modern-shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-brand-copper" />
          {capabilities.formTitle || (mode === 'create' ? 'Créer un nouvel utilisateur' : 'Modifier l\'utilisateur')}
        </CardTitle>
        {capabilities.formDescription && (
          <CardDescription>{capabilities.formDescription}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section Informations Personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="prenom"
                  {...register('prenom')}
                  placeholder="Jean"
                  className={errors.prenom ? 'border-red-500' : ''}
                />
                {errors.prenom && (
                  <p className="text-sm text-red-500">{errors.prenom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom"
                  {...register('nom')}
                  placeholder="Dupont"
                  className={errors.nom ? 'border-red-500' : ''}
                />
                {errors.nom && (
                  <p className="text-sm text-red-500">{errors.nom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="jean.dupont@example.com"
                    className={cn("pl-10", errors.email ? 'border-red-500' : '')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telephone"
                    type="tel"
                    {...register('telephone')}
                    placeholder="+33 6 12 34 56 78"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section Rôle et Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rôle et Permissions
            </h3>

            {/* Sélection du rôle avec cards visuelles */}
            <div className="space-y-2">
              <Label>Rôle <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableRoles.map((role) => {
                  const Icon = roleIcons[role as keyof typeof roleIcons]
                  const isSelected = selectedRole === role
                  
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setValue('role', role as any)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        isSelected 
                          ? "border-brand-copper bg-brand-copper/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isSelected ? roleColors[role as keyof typeof roleColors] : "bg-gray-100"
                        )}>
                          <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-600")} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {roleLabels[role as keyof typeof roleLabels]}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {role === 'super_admin' && 'Accès complet à toutes les fonctionnalités'}
                            {role === 'admin' && 'Gestion des organisations assignées'}
                            {role === 'locataire' && 'Accès aux locations'}
                            {role === 'collaborateur' && 'Support aux propriétaires'}
                          </p>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-4 h-4 text-brand-copper" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>

            {/* Assignation d'organisations (pour super_admin et admin) */}
            {shouldShowOrganisations() && capabilities.availableOrganisations.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Organisations à assigner
                </Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {capabilities.availableOrganisations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        id={`org-${org.id}`}
                        checked={selectedOrganisations.includes(org.id)}
                        onCheckedChange={() => handleOrganisationToggle(org.id)}
                      />
                      <label
                        htmlFor={`org-${org.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="font-medium">{org.nom}</p>
                        <p className="text-sm text-gray-500">{org.pays}</p>
                      </label>
                      {!org.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Note d'information selon le rôle */}
          {selectedRole && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedRole === 'super_admin' && (
                  <>
                    <strong>Super Admin :</strong> Cet utilisateur aura un accès complet à toutes les 
                    fonctionnalités de la plateforme, incluant la gestion de toutes les organisations.
                  </>
                )}
                {selectedRole === 'admin' && (
                  <>
                    <strong>Administrateur :</strong> Cet utilisateur pourra gérer les utilisateurs 
                    des organisations qui lui sont assignées.
                  </>
                )}
                {selectedRole === 'locataire' && (
                  <>
                    <strong>Locataire :</strong> Cet utilisateur aura accès aux fonctionnalités 
                    dédiées aux locataires.
                  </>
                )}
                {selectedRole === 'collaborateur' && (
                  <>
                    <strong>Collaborateur :</strong> Cet utilisateur pourra assister dans les tâches 
                    collaboratives de l'organisation.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/utilisateurs')}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-copper text-white"
            >
              {isSubmitting ? 'Création...' : (mode === 'create' ? 'Créer l\'utilisateur' : 'Enregistrer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}