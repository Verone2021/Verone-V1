'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Check, 
  ChevronsUpDown, 
  Loader2, 
  UserPlus,
  User,
  Building2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { searchAvailableProprietaires } from '@/actions/proprietes-quotites'
import { addProprietaireToPropriete } from '@/actions/proprietes-quotites'
import { QuotiteWithProprietaire } from '@/actions/proprietes-quotites'

// ==============================================================================
// TYPES & SCHEMAS
// ==============================================================================

interface ProprietaireOption {
  id: string
  nom: string
  prenom?: string
  type: 'physique' | 'morale'
  email?: string
}

const quotitesFormSchema = z.object({
  proprietaire_id: z.string().min(1, 'Veuillez sélectionner un propriétaire'),
  pourcentage: z.number()
    .min(0.01, 'Le pourcentage doit être supérieur à 0')
    .max(100, 'Le pourcentage ne peut pas dépasser 100%'),
  prix_acquisition: z.number().optional(),
  notes: z.string().optional()
})

type QuotitesFormData = z.infer<typeof quotitesFormSchema>

interface QuotitesFormInlineProps {
  proprieteId: string
  quotitesRestantes: number
  onSuccess: (newQuotite: QuotiteWithProprietaire) => void
  onCancel: () => void
}

// ==============================================================================
// COMPONENT
// ==============================================================================

export function QuotitesFormInline({
  proprieteId,
  quotitesRestantes,
  onSuccess,
  onCancel
}: QuotitesFormInlineProps) {
  const [isPending, startTransition] = useTransition()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [proprietaires, setProprietaires] = useState<ProprietaireOption[]>([])
  const [selectedProprietaire, setSelectedProprietaire] = useState<ProprietaireOption | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<QuotitesFormData>({
    resolver: zodResolver(quotitesFormSchema),
    defaultValues: {
      proprietaire_id: '',
      pourcentage: Math.min(quotitesRestantes, 100),
      prix_acquisition: undefined,
      notes: ''
    }
  })

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    
    if (term.length >= 2) {
      setIsSearching(true)
      try {
        const result = await searchAvailableProprietaires(proprieteId, term)
        if (result.success && result.data) {
          setProprietaires(result.data)
        }
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Erreur lors de la recherche')
      } finally {
        setIsSearching(false)
      }
    } else {
      setProprietaires([])
    }
  }

  const handleProprietaireSelect = (proprietaire: ProprietaireOption) => {
    setSelectedProprietaire(proprietaire)
    form.setValue('proprietaire_id', proprietaire.id)
    setSearchOpen(false)
    setSearchTerm('')
  }

  const onSubmit = async (data: QuotitesFormData) => {
    if (data.pourcentage > quotitesRestantes) {
      form.setError('pourcentage', {
        message: `Le pourcentage ne peut pas dépasser ${quotitesRestantes}%`
      })
      return
    }

    startTransition(async () => {
      try {
        const submitData = {
          proprietaire_id: data.proprietaire_id,
          pourcentage: data.pourcentage,
          prix_acquisition: data.prix_acquisition || null,
          notes: data.notes || null,
          is_gerant: false // Default value
        }

        const result = await addProprietaireToPropriete({ 
          propriete_id: proprieteId,
          ...submitData 
        })
        
        if (result.success && result.data) {
          onSuccess(result.data)
          form.reset()
          setSelectedProprietaire(null)
          toast.success('Propriétaire ajouté avec succès')
        } else {
          toast.error(result.error || 'Erreur lors de l\'ajout')
        }
      } catch (error) {
        toast.error('Erreur inattendue')
        console.error('Submit error:', error)
      }
    })
  }

  const formatProprietaireLabel = (proprietaire: ProprietaireOption) => {
    if (proprietaire.type === 'physique') {
      return `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim()
    }
    return proprietaire.nom
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Proprietaire Selection */}
          <FormField
            control={form.control}
            name="proprietaire_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-900">
                  Propriétaire *
                </FormLabel>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={searchOpen}
                        className={cn(
                          "w-full justify-between bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {selectedProprietaire ? (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
                              {selectedProprietaire.type === 'physique' ? (
                                <User className="w-3 h-3 text-[#D4841A]" />
                              ) : (
                                <Building2 className="w-3 h-3 text-[#D4841A]" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {formatProprietaireLabel(selectedProprietaire)}
                              </div>
                              {selectedProprietaire.email && (
                                <div className="text-xs text-gray-500">
                                  {selectedProprietaire.email}
                                </div>
                              )}
                            </div>
                          </div>
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
                        onValueChange={handleSearch}
                        className="bg-white"
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isSearching ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Recherche...</span>
                            </div>
                          ) : searchTerm.length < 2 ? (
                            <div className="p-4 text-center">
                              <p className="text-sm text-gray-500 mb-3">
                                Tapez au moins 2 caractères pour rechercher
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-gray-500 mb-3">
                                Aucun propriétaire trouvé
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open('/proprietaires/new', '_blank')}
                                className="border-[#D4841A] text-[#D4841A] hover:bg-[#D4841A] hover:text-white"
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
                                className="flex items-center gap-3 p-3"
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    field.value === proprietaire.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="w-6 h-6 bg-[#D4841A]/10 rounded-full flex items-center justify-center">
                                  {proprietaire.type === 'physique' ? (
                                    <User className="w-3 h-3 text-[#D4841A]" />
                                  ) : (
                                    <Building2 className="w-3 h-3 text-[#D4841A]" />
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-gray-900">
                                    {formatProprietaireLabel(proprietaire)}
                                  </div>
                                  {proprietaire.email && (
                                    <div className="text-xs text-gray-500">
                                      {proprietaire.email}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
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

          {/* Two column layout for percentage and price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Percentage */}
            <FormField
              control={form.control}
              name="pourcentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    Pourcentage de détention (%) *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={quotitesRestantes}
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum disponible : <span className="font-semibold text-[#D4841A]">{quotitesRestantes}%</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prix acquisition */}
            <FormField
              control={form.control}
              name="prix_acquisition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    Prix d'acquisition (€)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Montant payé pour cette quotité (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium text-gray-900">
                  Notes
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    placeholder="Information complémentaire..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Informations supplémentaires sur cette quotité (optionnel)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="min-w-24"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !form.formState.isValid}
              className="bg-[#D4841A] hover:bg-[#B8741A] text-white min-w-32"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}