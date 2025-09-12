'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, Building2, Save, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { updateAssocie } from '@/actions/proprietaires'
import { type Associe } from '@/lib/validations/proprietaires'
import { formatAssocieNomComplet } from '@/lib/utils/proprietaires'

// ==============================================================================
// TYPES & VALIDATION
// ==============================================================================

const editAssocieSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('physique'),
    nom: z.string().min(1, 'Le nom est requis'),
    prenom: z.string().min(1, 'Le prénom est requis'),
    nombre_parts: z.number().min(1, 'Le nombre de parts doit être supérieur à 0'),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    telephone: z.string().optional(),
    date_naissance: z.string().optional(),
    lieu_naissance: z.string().optional(),
    nationalite: z.string().optional(),
  }),
  z.object({
    type: z.literal('morale'),
    nom: z.string().min(1, 'Le nom est requis'),
    nombre_parts: z.number().min(1, 'Le nombre de parts doit être supérieur à 0'),
    forme_juridique: z.string().optional(),
    numero_identification: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    telephone: z.string().optional(),
  }),
])

type EditAssocieFormData = z.infer<typeof editAssocieSchema>

interface AssocieEditModalProps {
  associe: Associe
  partsRestantes: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export function AssocieEditModal({
  associe,
  partsRestantes,
  isOpen,
  onClose,
  onSuccess,
}: AssocieEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditAssocieFormData>({
    resolver: zodResolver(editAssocieSchema),
    defaultValues: {
      type: associe.type,
      nom: associe.nom,
      prenom: associe.type === 'physique' ? associe.prenom || '' : undefined,
      nombre_parts: associe.nombre_parts,
      email: associe.email || '',
      telephone: associe.telephone || '',
      date_naissance: associe.date_naissance || '',
      lieu_naissance: associe.lieu_naissance || '',
      nationalite: associe.nationalite || '',
      forme_juridique: associe.type === 'morale' ? associe.forme_juridique || '' : undefined,
      numero_identification: associe.type === 'morale' ? associe.numero_identification || '' : undefined,
    } as EditAssocieFormData,
  })

  const associeType = watch('type')
  const nombreParts = watch('nombre_parts')
  
  // Calculer le maximum de parts disponibles (parts actuelles + parts restantes)
  const maxParts = associe.nombre_parts + partsRestantes

  const onSubmit = async (data: EditAssocieFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Vérifier que le nombre de parts ne dépasse pas le maximum
      if (data.nombre_parts > maxParts) {
        setError(`Le nombre de parts ne peut pas dépasser ${maxParts}`)
        return
      }

      const result = await updateAssocie(associe.id, data as any)
      
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue')
      console.error('Erreur lors de la mise à jour:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Modifier l'associé</DialogTitle>
          <DialogDescription>
            Modification de {formatAssocieNomComplet(associe)}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type d'associé (non modifiable) */}
          <div className="space-y-2">
            <Label>Type d'associé</Label>
            <RadioGroup value={associeType} disabled>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physique" id="type-physique" />
                <Label htmlFor="type-physique" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Personne physique</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morale" id="type-morale" />
                <Label htmlFor="type-morale" className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Personne morale</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Champs spécifiques selon le type */}
          {associeType === 'physique' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    {...register('nom')}
                    placeholder="Nom de famille"
                  />
                  {(errors as any).nom && (
                    <p className="text-sm text-red-600">{(errors as any).nom.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    {...register('prenom')}
                    placeholder="Prénom"
                  />
                  {(errors as any).prenom && (
                    <p className="text-sm text-red-600">{(errors as any).prenom.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    {...register('date_naissance')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                  <Input
                    id="lieu_naissance"
                    {...register('lieu_naissance')}
                    placeholder="Ville de naissance"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalite">Nationalité</Label>
                <Input
                  id="nationalite"
                  {...register('nationalite')}
                  placeholder="Ex: Française"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nom">Raison sociale *</Label>
                <Input
                  id="nom"
                  {...register('nom')}
                  placeholder="Nom de la société"
                />
                {errors.nom && (
                  <p className="text-sm text-red-600">{errors.nom.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forme_juridique">Forme juridique</Label>
                  <Input
                    id="forme_juridique"
                    {...register('forme_juridique')}
                    placeholder="Ex: SARL, SAS..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_identification">N° d'identification</Label>
                  <Input
                    id="numero_identification"
                    {...register('numero_identification')}
                    placeholder="SIRET, RCS..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Champs communs */}
          <div className="space-y-2">
            <Label htmlFor="nombre_parts">
              Nombre de parts * 
              <span className="text-sm text-gray-500 ml-2">
                (Maximum: {maxParts} parts)
              </span>
            </Label>
            <Input
              id="nombre_parts"
              type="number"
              {...register('nombre_parts', { valueAsNumber: true })}
              min={1}
              max={maxParts}
            />
            {(errors as any).nombre_parts && (
              <p className="text-sm text-red-600">{(errors as any).nombre_parts.message}</p>
            )}
            {nombreParts > maxParts && (
              <p className="text-sm text-red-600">
                Le nombre de parts ne peut pas dépasser {maxParts}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemple.fr"
              />
              {(errors as any).email && (
                <p className="text-sm text-red-600">{(errors as any).email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                {...register('telephone')}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || nombreParts > maxParts}
              className="gradient-copper text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}