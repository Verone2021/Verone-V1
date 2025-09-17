'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'

const organisationSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .min(2, 'Le pays est requis')
    .default('FR'),
  type: z.enum(['supplier', 'customer', 'partner', 'internal'])
    .default('supplier'),
  is_active: z.boolean()
    .default(true),
})

type OrganisationFormData = z.infer<typeof organisationSchema>

interface OrganisationFormProps {
  initialData?: Partial<OrganisationFormData> & { id?: string }
  onSuccess: () => void
  onCancel: () => void
}

export function OrganisationForm({ initialData, onSuccess, onCancel }: OrganisationFormProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      country: initialData?.country || 'FR',
      type: initialData?.type || 'supplier',
      is_active: initialData?.is_active ?? true,
    },
  })

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const onSubmit = async (data: OrganisationFormData) => {
    setLoading(true)
    try {
      const slug = generateSlug(data.name)

      const organisationData = {
        name: data.name,
        slug,
        email: data.email || null,
        country: data.country,
        type: data.type,
        is_active: data.is_active,
      }

      let result
      if (initialData?.id) {
        // Update existing organisation
        result = await supabase
          .from('organisations')
          .update(organisationData)
          .eq('id', initialData.id)
      } else {
        // Create new organisation
        result = await supabase
          .from('organisations')
          .insert([organisationData])
      }

      if (result.error) {
        console.error('Erreur lors de la sauvegarde:', result.error)
        return
      }

      onSuccess()
    } catch (error) {
      console.error('Erreur inattendue:', error)
    } finally {
      setLoading(false)
    }
  }

  const countryOptions = [
    { value: 'FR', label: 'France' },
    { value: 'BE', label: 'Belgique' },
    { value: 'CH', label: 'Suisse' },
    { value: 'DE', label: 'Allemagne' },
    { value: 'IT', label: 'Italie' },
    { value: 'ES', label: 'Espagne' },
    { value: 'NL', label: 'Pays-Bas' },
    { value: 'PT', label: 'Portugal' },
    { value: 'GB', label: 'Royaume-Uni' },
    { value: 'US', label: 'États-Unis' },
    { value: 'CN', label: 'Chine' },
    { value: 'OTHER', label: 'Autre' },
  ]

  const typeOptions = [
    { value: 'supplier', label: 'Fournisseur' },
    { value: 'customer', label: 'Client' },
    { value: 'partner', label: 'Partenaire' },
    { value: 'internal', label: 'Interne' },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Informations générales</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'organisation *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Vérone Design, Maisons du Monde..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Nom officiel de l'organisation (sera utilisé dans les catalogues)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'organisation *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Contact</h3>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email de contact</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@fournisseur.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Email principal pour les communications commerciales
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Statut */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Statut</h3>

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Organisation active
                  </FormLabel>
                  <FormDescription>
                    Les organisations inactives ne sont pas visibles dans les sélecteurs
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Preview du slug */}
        {form.watch('name') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Identifiant automatique (slug)</Label>
            <p className="text-sm text-gray-600 mt-1">
              {generateSlug(form.watch('name'))}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Sauvegarde...' : (initialData?.id ? 'Mettre à jour' : 'Créer')}
          </Button>
        </div>
      </form>
    </Form>
  )
}