'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createAssocie } from '@/actions/proprietaires'

// Schema de validation pour le formulaire
const associeFormSchema = z.object({
  type: z.enum(['physique', 'morale'] as const),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  date_naissance: z.string().optional(),
  lieu_naissance: z.string().optional(),
  nationalite: z.string().optional(),
  forme_juridique: z.enum(['SARL', 'SAS', 'SA', 'SCI', 'EURL', 'SASU', 'GIE', 'Association', 'Autre'] as const).optional(),
  numero_identification: z.string().optional(),
  nombre_parts: z.number().min(1, 'Le nombre de parts doit être supérieur à 0'),
})

type AssocieFormData = z.infer<typeof associeFormSchema>

interface AssocieFormProps {
  proprietaireId: string
  partsRestantes: number
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export function AssocieForm({
  proprietaireId,
  partsRestantes,
  onSuccess,
  onCancel,
  className = ""
}: AssocieFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AssocieFormData>({
    resolver: zodResolver(associeFormSchema),
    defaultValues: {
      type: 'physique',
      nom: '',
      prenom: '',
      nombre_parts: Math.min(partsRestantes, 1),
    },
  })

  const watchedType = form.watch('type')

  const handleSubmit = async (data: AssocieFormData) => {
    setError(null)
    
    startTransition(async () => {
      try {
        const associeData: any = data.type === 'physique' 
          ? {
              type: 'physique' as const,
              nom: data.nom,
              prenom: data.prenom || '',
              date_naissance: data.date_naissance || '',
              lieu_naissance: data.lieu_naissance || '',
              nationalite: data.nationalite || '',
              nombre_parts: data.nombre_parts,
            }
          : {
              type: 'morale' as const,
              nom: data.nom,
              forme_juridique: data.forme_juridique!,
              numero_identification: data.numero_identification || '',
              nombre_parts: data.nombre_parts,
            }

        const result = await createAssocie(proprietaireId, associeData)

        if (result.success) {
          // Reset form
          form.reset()
          
          // Callback de succès (peut fermer le formulaire)
          onSuccess?.()
          
          // Force refresh après le callback avec délai plus long
          setTimeout(() => {
            router.refresh()
            // Double refresh pour s'assurer que le cache est vidé
            setTimeout(() => {
              router.refresh()
            }, 200)
          }, 500)
        } else {
          setError(result.error || 'Erreur lors de la création de l\'actionnaire')
        }
      } catch (err) {
        setError('Erreur inattendue lors de la création')
        console.error('Erreur création actionnaire:', err)
      }
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Ajouter un actionnaire</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'actionnaire *</Label>
            <Select
              value={form.watch('type')}
              onChange={(value) => form.setValue('type', value as 'physique' | 'morale')}
              options={[
                { value: 'physique', label: 'Personne physique' },
                { value: 'morale', label: 'Personne morale' }
              ]}
              placeholder="Sélectionnez un type"
              disabled={isPending}
            />
            {form.formState.errors.type && (
              <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">
              {watchedType === 'physique' ? 'Nom de famille' : 'Raison sociale'} *
            </Label>
            <Input
              id="nom"
              {...form.register('nom')}
              placeholder={watchedType === 'physique' ? 'Dupont' : 'SARL Exemple'}
              disabled={isPending}
            />
            {form.formState.errors.nom && (
              <p className="text-sm text-red-600">{form.formState.errors.nom.message}</p>
            )}
          </div>

          {/* Prénom (seulement pour personne physique) */}
          {watchedType === 'physique' && (
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                {...form.register('prenom')}
                placeholder="Jean"
                disabled={isPending}
              />
              {form.formState.errors.prenom && (
                <p className="text-sm text-red-600">{form.formState.errors.prenom.message}</p>
              )}
            </div>
          )}

          {/* Informations personnelles (seulement pour personne physique) */}
          {watchedType === 'physique' && (
            <>
              {/* Date de naissance */}
              <div className="space-y-2">
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  {...form.register('date_naissance')}
                  disabled={isPending}
                />
                {form.formState.errors.date_naissance && (
                  <p className="text-sm text-red-600">{form.formState.errors.date_naissance.message}</p>
                )}
              </div>

              {/* Lieu de naissance */}
              <div className="space-y-2">
                <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                <Input
                  id="lieu_naissance"
                  {...form.register('lieu_naissance')}
                  placeholder="Paris"
                  disabled={isPending}
                />
                {form.formState.errors.lieu_naissance && (
                  <p className="text-sm text-red-600">{form.formState.errors.lieu_naissance.message}</p>
                )}
              </div>

              {/* Nationalité */}
              <div className="space-y-2">
                <Label htmlFor="nationalite">Nationalité</Label>
                <Input
                  id="nationalite"
                  {...form.register('nationalite')}
                  placeholder="Française"
                  disabled={isPending}
                />
                {form.formState.errors.nationalite && (
                  <p className="text-sm text-red-600">{form.formState.errors.nationalite.message}</p>
                )}
              </div>
            </>
          )}

          {/* Informations entreprise (seulement pour personne morale) */}
          {watchedType === 'morale' && (
            <>
              {/* Forme juridique */}
              <div className="space-y-2">
                <Label htmlFor="forme_juridique">Forme juridique *</Label>
                <Select
                  value={form.watch('forme_juridique') || ''}
                  onChange={(value) => form.setValue('forme_juridique', value as any)}
                  options={[
                    { value: 'SARL', label: 'SARL' },
                    { value: 'SAS', label: 'SAS' },
                    { value: 'SA', label: 'SA' },
                    { value: 'SCI', label: 'SCI' },
                    { value: 'EURL', label: 'EURL' },
                    { value: 'SASU', label: 'SASU' },
                    { value: 'GIE', label: 'GIE' },
                    { value: 'Association', label: 'Association' },
                    { value: 'Autre', label: 'Autre' }
                  ]}
                  placeholder="Sélectionnez une forme juridique"
                  disabled={isPending}
                />
                {form.formState.errors.forme_juridique && (
                  <p className="text-sm text-red-600">{form.formState.errors.forme_juridique.message}</p>
                )}
              </div>

              {/* Numéro d'identification */}
              <div className="space-y-2">
                <Label htmlFor="numero_identification">Numéro d'identification (SIRET/SIREN) *</Label>
                <Input
                  id="numero_identification"
                  {...form.register('numero_identification')}
                  placeholder="Ex: 123 456 789 00012"
                  disabled={isPending}
                />
                {form.formState.errors.numero_identification && (
                  <p className="text-sm text-red-600">{form.formState.errors.numero_identification.message}</p>
                )}
              </div>
            </>
          )}

          {/* Nombre de parts */}
          <div className="space-y-2">
            <Label htmlFor="nombre_parts">Nombre de parts *</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="nombre_parts"
                type="number"
                min="1"
                max={partsRestantes}
                {...form.register('nombre_parts', { valueAsNumber: true })}
                placeholder="100"
                disabled={isPending}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">
                / {partsRestantes} restantes
              </span>
            </div>
            {form.formState.errors.nombre_parts && (
              <p className="text-sm text-red-600">{form.formState.errors.nombre_parts.message}</p>
            )}
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isPending || partsRestantes <= 0}>
              <Plus className="h-4 w-4 mr-2" />
              {isPending ? 'Ajout en cours...' : 'Ajouter l\'actionnaire'}
            </Button>
          </div>

          {/* Info sur les parts restantes */}
          {partsRestantes <= 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              Aucune part disponible. Toutes les parts sociales ont été attribuées.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}