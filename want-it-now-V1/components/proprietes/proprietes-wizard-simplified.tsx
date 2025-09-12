'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadixSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  Home,
  Euro
} from 'lucide-react'
import { createPropriete } from '@/actions/proprietes'
import { 
  PROPRIETE_TYPES, 
  type ProprieteFormData,
  proprieteEditSchema
} from '@/lib/validations/proprietes'
import { useAuthorizedCountries } from '@/hooks/use-authorized-countries'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

// Step schemas - Extended to 4 steps
const step1Schema = z.object({
  // Configuration
  a_unites: z.boolean(),
  nombre_unites: z.number().optional(),
  
  // Basic info
  type: z.enum(PROPRIETE_TYPES).describe("Veuillez sélectionner un type de propriété"),
  nom: z.string().min(1, "Le nom est requis"),
  titre_annonce: z.string().optional(),
  description: z.string().optional()
}).refine(
  (data) => {
    if (data.a_unites) {
      return data.nombre_unites && data.nombre_unites > 0
    }
    return true
  },
  {
    message: "Le nombre d'unités est requis pour les propriétés multi-unités",
    path: ["nombre_unites"]
  }
)

const step2Schema = z.object({
  adresse: z.string().min(1, "L'adresse est requise"),
  adresse_complement: z.string().optional(),
  code_postal: z.string().min(1, "Le code postal est requis"),
  ville: z.string().min(1, "La ville est requise"),
  region: z.string().optional(),
  pays: z.string().min(1, "Veuillez sélectionner un pays").length(2, "Le pays doit être un code ISO à 2 lettres")
})

// Step 3: Caractéristiques (tous optionnels)
const step3Schema = z.object({
  surface_m2: z.number().int().min(0).optional(),
  surface_terrain_m2: z.number().int().min(0).optional(),
  nombre_pieces: z.number().int().min(0).optional(),
  nb_chambres: z.number().int().min(0).optional(),
  nb_sdb: z.number().int().min(0).optional(),
  etage: z.number().int().optional(),
  nb_etages: z.number().int().min(0).optional(),
  annee_construction: z.number().int().min(1800).max(new Date().getFullYear() + 10).optional(),
  ascenseur: z.boolean().optional(),
  parking: z.boolean().optional(),
  nombre_places_parking: z.number().int().min(0).optional(),
  cave: z.boolean().optional(),
  balcon: z.boolean().optional(),
  surface_balcon: z.number().min(0).optional(),
  terrasse: z.boolean().optional(),
  surface_terrasse: z.number().min(0).optional(),
  jardin: z.boolean().optional(),
  surface_jardin: z.number().min(0).optional(),
  piscine: z.boolean().optional(),
  dpe_classe: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  dpe_valeur: z.number().min(0).optional(),
  ges_classe: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  ges_valeur: z.number().min(0).optional()
})

// Step 4: Informations financières (tous optionnels)
const step4Schema = z.object({
  prix_achat: z.number().min(0).optional(),
  frais_acquisition: z.number().min(0).optional(),
  valeur_actuelle: z.number().min(0).optional(),
  loyer: z.number().min(0).optional(),
  charges: z.number().min(0).optional(),
  taxe_fonciere: z.number().min(0).optional(),
  notes_internes: z.string().optional()
})

// Full schema
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema)

type WizardFormData = z.infer<typeof fullSchema>

const steps = [
  { id: 1, name: 'Type & Structure', icon: Building2 },
  { id: 2, name: 'Localisation', icon: MapPin },
  { id: 3, name: 'Caractéristiques', icon: Home },
  { id: 4, name: 'Informations financières', icon: Euro }
]

// Helper function to get type label
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    appartement: 'Appartement',
    maison: 'Maison',
    villa: 'Villa',
    studio: 'Studio',
    loft: 'Loft',
    terrain: 'Terrain',
    parking: 'Parking',
    box_stockage: 'Box de stockage',
    bureau: 'Bureau',
    commerce: 'Commerce',
    entrepot: 'Entrepôt',
    immeuble: 'Immeuble',
    hotel: 'Hôtel',
    residence: 'Résidence',
    complex_hotelier: 'Complexe hôtelier',
    autre: 'Autre'
  }
  return labels[type] || type
}

export function ProprietesWizardSimplified() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hook pour récupérer les pays autorisés
  const { countries, isGlobalAccess, isLoading: countriesLoading, error: countriesError } = useAuthorizedCountries()

  const form = useForm<WizardFormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      // Step 1
      a_unites: false,
      nombre_unites: undefined,
      type: undefined,
      nom: '',
      titre_annonce: '',
      description: '',
      
      // Step 2
      adresse: '',
      adresse_complement: '',
      code_postal: '',
      ville: '',
      region: '',
      pays: '',
      
      // Step 3 - Caractéristiques (tous optionnels)
      surface_m2: undefined,
      surface_terrain_m2: undefined,
      nombre_pieces: undefined,
      nb_chambres: undefined,
      nb_sdb: undefined,
      etage: undefined,
      nb_etages: undefined,
      annee_construction: undefined,
      ascenseur: false,
      parking: false,
      nombre_places_parking: undefined,
      cave: false,
      balcon: false,
      surface_balcon: undefined,
      terrasse: false,
      surface_terrasse: undefined,
      jardin: false,
      surface_jardin: undefined,
      piscine: false,
      dpe_classe: undefined,
      dpe_valeur: undefined,
      ges_classe: undefined,
      ges_valeur: undefined,
      
      // Step 4 - Informations financières (tous optionnels)
      prix_achat: undefined,
      frais_acquisition: undefined,
      valeur_actuelle: undefined,
      loyer: undefined,
      charges: undefined,
      taxe_fonciere: undefined,
      notes_internes: ''
    },
    mode: 'onChange'
  })

  const watchAUnites = form.watch('a_unites')

  // Handle a_unites change - clear nombre_unites if switching to single unit
  const handleAUnitesChange = (value: boolean) => {
    form.setValue('a_unites', value)
    if (!value) {
      form.setValue('nombre_unites', undefined)
    }
  }

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof WizardFormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['a_unites', 'type', 'nom', 'titre_annonce', 'description']
        if (watchAUnites) {
          fieldsToValidate.push('nombre_unites')
        }
        break
      case 2:
        fieldsToValidate = ['adresse', 'adresse_complement', 'code_postal', 'ville', 'region', 'pays']
        break
      case 3:
        // Étape 3: Caractéristiques - tous optionnels, pas de validation requise
        fieldsToValidate = []
        break
      case 4:
        // Étape 4: Informations financières - tous optionnels, pas de validation requise
        fieldsToValidate = []
        break
    }

    if (fieldsToValidate.length === 0) {
      return true // Pas de validation requise pour les étapes optionnelles
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true)
    try {
      // Create with all form data
      const proprieteData: ProprieteFormData = {
        ...data,
        is_brouillon: true, // IMPORTANT: Create as draft by default
        statut: 'brouillon',
        
        // Empty objects for complex fields
        amenities: {},
        regles: {}
      }

      const result = await createPropriete(proprieteData)
      
      if (result.success && result.data) {
        toast.success('Propriété créée en brouillon')
        // Redirect to detail page to complete the property
        router.push(`/proprietes/${result.data.id}`)
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Configuration Type Radio Group */}
            <FormField
              control={form.control}
              name="a_unites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration de la propriété *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => handleAUnitesChange(value === 'true')}
                      value={field.value ? 'true' : 'false'}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="bien-principal" />
                        <label htmlFor="bien-principal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Bien principal (propriété unique)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="bien-unites" />
                        <label htmlFor="bien-unites" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Bien avec des unités (multi-propriétés)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Choisissez si votre propriété est unique ou divisée en plusieurs unités locatives
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de propriété *</FormLabel>
                  <RadixSelect 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPRIETE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </RadixSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la propriété *</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="Ex: Villa Sunset" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titre_annonce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de l'annonce (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      className="bg-white" 
                      placeholder="Ex: Magnifique villa avec vue mer" 
                    />
                  </FormControl>
                  <FormDescription>
                    Titre accrocheur pour les annonces de location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''}
                      className="bg-white min-h-[100px]" 
                      placeholder="Description détaillée de la propriété..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchAUnites && (
              <FormField
                control={form.control}
                name="nombre_unites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d'unités prévues *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="Ex: 10"
                        min="1"
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre total d'unités dans cette propriété multi-unités
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="adresse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse *</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="Numéro et nom de rue" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresse_complement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complément d'adresse</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''}
                      className="bg-white" 
                      placeholder="Bâtiment, étage, etc." 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code_postal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal *</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" placeholder="75001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ville"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville *</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" placeholder="Paris" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''}
                        className="bg-white" 
                        placeholder="Île-de-France" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays *</FormLabel>
                    <RadixSelect
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={countriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={
                            countriesLoading ? "Chargement..." : 
                            countriesError ? "Erreur de chargement" :
                            "Sélectionnez un pays"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center gap-2">
                              <span>{country.name}</span>
                              <span className="text-xs text-gray-500">
                                ({country.organisationName})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </RadixSelect>
                    <FormDescription>
                      {isGlobalAccess 
                        ? "Vous avez accès à tous les pays des organisations actives"
                        : "Pays autorisés selon vos permissions d'organisation"
                      }
                      {countriesLoading && (
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Chargement des pays autorisés...</span>
                        </div>
                      )}
                    </FormDescription>
                    <FormMessage />
                    {countriesError && (
                      <p className="text-sm text-red-600 mt-1">{countriesError}</p>
                    )}
                  </FormItem>
                )}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Surfaces */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Surfaces</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="surface_m2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface habitable (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 85"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surface_terrain_m2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface terrain (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 300"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pièces */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pièces</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nombre_pieces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de pièces</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 4"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_chambres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chambres</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 2"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_sdb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salles de bain</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 1"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Structure</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="etage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Étage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_etages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'étages</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 3"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annee_construction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année de construction</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 1990"
                          min="1800"
                          max={new Date().getFullYear() + 10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Équipements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Équipements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="ascenseur"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Ascenseur</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Parking</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cave"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Cave</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balcon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Balcon</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terrasse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Terrasse</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="jardin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Jardin</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="piscine"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Piscine</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Diagnostics énergétiques */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Diagnostics énergétiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">DPE (Diagnostic de Performance Énergétique)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="dpe_classe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classe DPE</FormLabel>
                          <RadixSelect onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Classe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(classe => (
                                <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                              ))}
                            </SelectContent>
                          </RadixSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dpe_valeur"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valeur (kWh/m²/an)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="bg-white" 
                              placeholder="Ex: 120"
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">GES (Gaz à Effet de Serre)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="ges_classe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classe GES</FormLabel>
                          <RadixSelect onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Classe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(classe => (
                                <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                              ))}
                            </SelectContent>
                          </RadixSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ges_valeur"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valeur (kg CO2/m²/an)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="bg-white" 
                              placeholder="Ex: 30"
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Acquisition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Acquisition</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prix_achat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'achat (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 250000"
                          min="0"
                          step="1000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frais_acquisition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais d'acquisition (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 20000"
                          min="0"
                          step="100"
                        />
                      </FormControl>
                      <FormDescription>
                        Frais de notaire, agence, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="valeur_actuelle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur actuelle (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="Ex: 280000"
                        min="0"
                        step="1000"
                      />
                    </FormControl>
                    <FormDescription>
                      Estimation actuelle de la valeur du bien
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="loyer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyer mensuel (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 1200"
                          min="0"
                          step="10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charges mensuelles (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="Ex: 150"
                          min="0"
                          step="5"
                        />
                      </FormControl>
                      <FormDescription>
                        Charges de copropriété, entretien, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fiscalité */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Fiscalité</h3>
              <FormField
                control={form.control}
                name="taxe_fonciere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxe foncière annuelle (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="Ex: 1500"
                        min="0"
                        step="10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Notes internes</h3>
              <FormField
                control={form.control}
                name="notes_internes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes internes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        className="bg-white min-h-[100px]" 
                        placeholder="Notes privées sur ce bien (strategie d'acquisition, travaux prévus, etc.)"
                      />
                    </FormControl>
                    <FormDescription>
                      Ces notes ne seront visibles que par votre équipe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        <div className="flex justify-between mt-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2",
                currentStep === step.id ? "text-copper font-semibold" : "text-gray-400"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                currentStep === step.id ? "bg-copper text-white" : 
                currentStep > step.id ? "bg-green-600 text-white" : "bg-gray-200"
              )}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:inline">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Définissez le type et la structure de votre propriété"}
            {currentStep === 2 && "Indiquez l'emplacement de votre propriété"}
            {currentStep === 3 && "Renseignez les caractéristiques du bien (optionnel)"}
            {currentStep === 4 && "Informations financières et notes (optionnel)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#D4841A] hover:bg-[#B8741A] text-white"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white"
                  >
                    {isSubmitting ? (
                      <>Création en cours...</>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Créer le brouillon
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          {/* Info message */}
          {currentStep === steps.length && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Formulaire complet :</p>
                <p>Toutes les informations ont été saisies. La propriété sera créée en mode brouillon et vous pourrez la finaliser plus tard.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}