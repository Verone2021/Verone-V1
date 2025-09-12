'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { searchProprietaires, addQuotiteToProperty } from '@/actions/proprietes'

// ==============================================================================
// SCHEMA
// ==============================================================================

const quotiteFormSchema = z.object({
  proprietaire_id: z.string().min(1, 'Veuillez sélectionner un propriétaire'),
  pourcentage: z.number()
    .min(0.01, 'Le pourcentage doit être supérieur à 0')
    .max(100, 'Le pourcentage ne peut pas dépasser 100%'),
  is_gerant: z.boolean(),
  commentaire: z.string().optional()
})

type QuotiteFormData = z.infer<typeof quotiteFormSchema>

// ==============================================================================
// TYPES
// ==============================================================================

interface QuotiteFormProps {
  proprieteId: string
  quotitesRestantes: number
  onSuccess: () => void
  onCancel: () => void
}

interface ProprietaireOption {
  id: string
  nom: string
  prenom?: string
  type: 'physique' | 'morale'
  organisation_id: string
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuotiteForm({
  proprieteId,
  quotitesRestantes,
  onSuccess,
  onCancel
}: QuotiteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [proprietaires, setProprietaires] = useState<ProprietaireOption[]>([])
  const [selectedProprietaire, setSelectedProprietaire] = useState<ProprietaireOption | null>(null)

  const form = useForm<QuotiteFormData>({
    resolver: zodResolver(quotiteFormSchema),
    defaultValues: {
      proprietaire_id: '',
      pourcentage: Math.min(quotitesRestantes, 100),
      is_gerant: false,
      commentaire: ''
    }
  })

  // Search for proprietaires
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true)
        try {
          const result = await searchProprietaires(searchTerm)
          if (result.success && result.data) {
            setProprietaires(result.data)
          }
        } catch (error) {
          console.error('Search error:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setProprietaires([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(searchTimer)
  }, [searchTerm])

  const handleProprietaireSelect = (proprietaire: ProprietaireOption) => {
    setSelectedProprietaire(proprietaire)
    form.setValue('proprietaire_id', proprietaire.id)
    setSearchOpen(false)
  }

  const onSubmit = async (data: QuotiteFormData) => {
    if (data.pourcentage > quotitesRestantes) {
      form.setError('pourcentage', {
        message: `Le pourcentage ne peut pas dépasser ${quotitesRestantes}%`
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addQuotiteToProperty(proprieteId, data)
      
      if (result.success) {
        toast.success('Propriétaire ajouté avec succès')
        onSuccess()
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatProprietaireLabel = (proprietaire: ProprietaireOption) => {
    if (proprietaire.type === 'physique') {
      return `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim()
    }
    return proprietaire.nom
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Proprietaire Selection */}
        <FormField
          control={form.control}
          name="proprietaire_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Propriétaire</FormLabel>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectedProprietaire ? (
                        <span className="flex items-center gap-2">
                          <span>{selectedProprietaire.type === 'physique' ? '👤' : '🏢'}</span>
                          {formatProprietaireLabel(selectedProprietaire)}
                        </span>
                      ) : (
                        "Rechercher un propriétaire..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Rechercher par nom..." 
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandEmpty>
                      {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Recherche...</span>
                        </div>
                      ) : searchTerm.length < 2 ? (
                        <p className="text-sm text-gray-500 p-4">
                          Tapez au moins 2 caractères pour rechercher
                        </p>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500 mb-3">
                            Aucun propriétaire trouvé
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('/proprietaires/new', '_blank')}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Créer un nouveau
                          </Button>
                        </div>
                      )}
                    </CommandEmpty>
                    {proprietaires.length > 0 && (
                      <CommandGroup>
                        {proprietaires.map((proprietaire) => (
                          <CommandItem
                            key={proprietaire.id}
                            value={proprietaire.id}
                            onSelect={() => handleProprietaireSelect(proprietaire)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === proprietaire.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="mr-2">
                              {proprietaire.type === 'physique' ? '👤' : '🏢'}
                            </span>
                            {formatProprietaireLabel(proprietaire)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Recherchez et sélectionnez un propriétaire existant
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Percentage */}
        <FormField
          control={form.control}
          name="pourcentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pourcentage de détention (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={quotitesRestantes}
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Maximum disponible : {quotitesRestantes}%
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Manager */}
        <FormField
          control={form.control}
          name="is_gerant"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Gérant</FormLabel>
                <FormDescription>
                  Ce propriétaire est-il le gérant de la propriété ?
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

        {/* Comment */}
        <FormField
          control={form.control}
          name="commentaire"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commentaire (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Note ou information complémentaire..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-copper hover:bg-copper-dark text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              'Ajouter le propriétaire'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}