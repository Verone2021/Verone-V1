"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Building2 } from 'lucide-react'
import { useSuppliers } from '@/hooks/use-organisations'

// Schema de validation pour fournisseur
const supplierSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .min(2, 'Le pays doit contenir au moins 2 caractères')
    .default('FR'),
  description: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  is_active: z.boolean().default(true)
})

type SupplierFormData = z.infer<typeof supplierSchema>

interface Supplier {
  id: string
  name: string
  email: string | null
  country: string | null
  is_active: boolean
  description?: string
  phone?: string
  website?: string
}

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  supplier?: Supplier | null // null = création, objet = édition
  onSuccess?: (supplier: Supplier) => void
}

const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'ES', label: 'Espagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'NL', label: 'Pays-Bas' },
  { value: 'UK', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
  { value: 'OTHER', label: 'Autre' }
]

export function SupplierFormModal({
  isOpen,
  onClose,
  supplier = null,
  onSuccess
}: SupplierFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createOrganisation, updateOrganisation } = useSuppliers()

  const isEditing = !!supplier

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      email: '',
      country: 'FR',
      description: '',
      phone: '',
      website: '',
      is_active: true
    }
  })

  // Charger les données du fournisseur pour édition
  useEffect(() => {
    if (isEditing && supplier) {
      reset({
        name: supplier.name,
        email: supplier.email || '',
        country: supplier.country || 'FR',
        description: supplier.description || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        is_active: supplier.is_active
      })
    } else {
      reset({
        name: '',
        email: '',
        country: 'FR',
        description: '',
        phone: '',
        website: '',
        is_active: true
      })
    }
  }, [supplier, isEditing, reset])

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true)

    try {
      let result

      if (isEditing && supplier) {
        // Mise à jour
        result = await updateOrganisation({
          id: supplier.id,
          name: data.name,
          email: data.email || null,
          country: data.country,
          is_active: data.is_active
        })
      } else {
        // Création
        result = await createOrganisation({
          name: data.name,
          type: 'supplier',
          email: data.email || null,
          country: data.country,
          is_active: data.is_active
        })
      }

      if (result) {
        console.log('✅ Fournisseur sauvegardé avec succès')
        onSuccess?.(result as Supplier)
        onClose()
        reset()
      } else {
        console.error('❌ Erreur lors de la sauvegarde')
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
      }

    } catch (error) {
      console.error('💥 Erreur inattendue:', error)
      alert('Erreur inattendue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      reset()
    }
  }

  const watchedIsActive = watch('is_active')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div>
            <Label htmlFor="name">
              Nom du fournisseur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Kartell, Hay, Muuto..."
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email de contact</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="contact@fournisseur.com"
              disabled={isSubmitting}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Pays */}
          <div>
            <Label htmlFor="country">
              Pays <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('country')}
              onValueChange={(value) => setValue('country', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
            )}
          </div>

          {/* Site web */}
          <div>
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              type="url"
              {...register('website')}
              placeholder="https://www.fournisseur.com"
              disabled={isSubmitting}
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && (
              <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
            )}
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is_active" className="font-medium">
                Fournisseur actif
              </Label>
              <p className="text-sm text-gray-600">
                {watchedIsActive
                  ? 'Ce fournisseur sera disponible pour attribution aux produits'
                  : 'Ce fournisseur sera masqué dans les sélections'
                }
              </p>
            </div>
            <Switch
              id="is_active"
              checked={watchedIsActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Notes internes sur ce fournisseur..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Modifier' : 'Créer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}