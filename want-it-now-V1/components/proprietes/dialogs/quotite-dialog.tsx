'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { addProprieteProprietaire, searchProprietaires } from '@/actions/proprietes'
import { AlertCircle, Loader2 } from 'lucide-react'

const quotiteSchema = z.object({
  proprietaire_id: z.string().min(1, 'Veuillez sélectionner un propriétaire'),
  pourcentage: z.number()
    .min(0.01, 'Le pourcentage doit être supérieur à 0')
    .max(100, 'Le pourcentage ne peut pas dépasser 100%'),
  date_acquisition: z.string().optional()
})

type QuotiteFormData = z.infer<typeof quotiteSchema>

interface QuotiteDialogProps {
  proprieteId: string
  currentTotal: number
  onClose: () => void
  onSuccess: () => void
}

export function QuotiteDialog({
  proprieteId,
  currentTotal,
  onClose,
  onSuccess
}: QuotiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [proprietaires, setProprietaires] = useState<Array<{
    value: string
    label: string
  }>>([])
  const [isLoadingProprietaires, setIsLoadingProprietaires] = useState(false)
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [isCreatingProprietaire, setIsCreatingProprietaire] = useState(false)

  const maxPercentage = 100 - currentTotal

  const form = useForm<QuotiteFormData>({
    resolver: zodResolver(quotiteSchema),
    defaultValues: {
      proprietaire_id: '',
      pourcentage: maxPercentage,
      date_acquisition: new Date().toISOString().split('T')[0]
    }
  })

  // Quick create form schema
  const quickCreateSchema = z.object({
    type: z.enum(['physique', 'morale']),
    nom: z.string().min(1, 'Le nom est requis'),
    prenom: z.string().optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
  })

  const quickCreateForm = useForm({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      type: 'physique' as const,
      nom: '',
      prenom: '',
      email: ''
    }
  })

  useEffect(() => {
    if (mode === 'select') {
      loadProprietaires()
    }
  }, [mode])

  const loadProprietaires = async (search?: string) => {
    setIsLoadingProprietaires(true)
    const result = await searchProprietaires(search)
    if (result.success && result.data) {
      setProprietaires(
        result.data.map(p => ({
          value: p.id,
          label: p.type === 'physique' 
            ? `${p.prenom} ${p.nom}`
            : p.nom
        }))
      )
    }
    setIsLoadingProprietaires(false)
  }

  const handleQuickCreate = async (data: any) => {
    setIsCreatingProprietaire(true)
    
    try {
      // Import createProprietaire dynamically to avoid circular dependency
      const { createProprietaire } = await import('@/actions/proprietaires')
      
      // Prepare data for quick create with proper discriminated union structure
      let quickCreateData: any
      
      if (data.type === 'physique') {
        quickCreateData = {
          type: 'physique' as const,
          nom: data.nom,
          prenom: data.prenom || 'Non spécifié',
          email: data.email || undefined,
          pays: 'FR',
          date_naissance: '1990-01-01', // Default birth date
          lieu_naissance: 'Non spécifié', // Default birth place
          nationalite: 'Française', // Default nationality
          is_brouillon: false
        }
      } else {
        quickCreateData = {
          type: 'morale' as const,
          nom: data.nom,
          email: data.email || undefined,
          pays: 'FR',
          forme_juridique: 'SARL' as const, // Default legal form
          numero_identification: 'N/A', // Default identification
          capital_social: 1000, // Default capital
          nombre_parts_total: 1000, // Default shares
          is_brouillon: false
        }
      }
      
      const result = await createProprietaire(quickCreateData)

      if (result.success && result.data) {
        // Automatically select the newly created proprietaire
        form.setValue('proprietaire_id', result.data.id)
        
        // Add to proprietaires list for immediate visibility
        const newOption = {
          value: result.data.id,
          label: result.data.type === 'physique' 
            ? `${result.data.prenom} ${result.data.nom}`
            : result.data.nom
        }
        setProprietaires(prev => [newOption, ...prev])
        
        // Switch back to select mode
        setMode('select')
        
        // Reset quick create form
        quickCreateForm.reset()
      } else {
        console.error('Erreur lors de la création du propriétaire:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la création du propriétaire:', error)
    }
    
    setIsCreatingProprietaire(false)
  }

  const onSubmit = async (data: QuotiteFormData) => {
    setIsSubmitting(true)
    
    const result = await addProprieteProprietaire(
      proprieteId,
      data.proprietaire_id,
      data.pourcentage,
      data.date_acquisition
    )
    
    if (result.success) {
      onSuccess()
    } else {
      console.error(result.error)
    }
    
    setIsSubmitting(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un propriétaire</DialogTitle>
          <DialogDescription>
            Ajoutez un propriétaire à cette propriété avec sa quotité.
          </DialogDescription>
        </DialogHeader>

        {maxPercentage <= 0 ? (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Quotités complètes</p>
                <p className="text-sm text-red-600 mt-1">
                  Les quotités de cette propriété totalisent déjà 100%. 
                  Vous devez d'abord retirer ou modifier un propriétaire existant.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode('select')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === 'select'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sélectionner existant
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === 'create'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Créer nouveau
              </button>
            </div>

            {mode === 'select' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="proprietaire_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propriétaire</FormLabel>
                        <FormControl>
                          <Combobox
                            options={proprietaires}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Rechercher un propriétaire..."
                          />
                        </FormControl>
                        <FormDescription>
                          Sélectionnez un propriétaire existant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pourcentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotité (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={maxPercentage}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum disponible: {maxPercentage}%
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_acquisition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'acquisition</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Date à laquelle ce propriétaire a acquis sa part
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !form.watch('proprietaire_id')}
                      className="bg-copper hover:bg-copper-dark"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        'Ajouter'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...quickCreateForm}>
                <form onSubmit={quickCreateForm.handleSubmit(handleQuickCreate)} className="space-y-4">
                  <FormField
                    control={quickCreateForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de propriétaire</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="physique">Personne physique</option>
                            <option value="morale">Personne morale</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quickCreateForm.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {quickCreateForm.watch('type') === 'physique' ? 'Nom' : 'Raison sociale'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {quickCreateForm.watch('type') === 'physique' && (
                    <FormField
                      control={quickCreateForm.control}
                      name="prenom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Prénom..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={quickCreateForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optionnel)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Création rapide</strong> - Le propriétaire sera créé avec les informations de base. 
                      Vous pourrez compléter ses informations plus tard depuis la section Propriétaires.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode('select')}
                      disabled={isCreatingProprietaire}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingProprietaire}
                      className="bg-copper hover:bg-copper-dark"
                    >
                      {isCreatingProprietaire ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer et sélectionner'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}