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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Building2, 
  MapPin, 
  Home, 
  Euro, 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle,
  Wifi,
  Car,
  Trees,
  Waves,
  Dumbbell,
  Coffee,
  Tv,
  Wind,
  Sparkles
} from 'lucide-react'
import { createPropriete } from '@/actions/proprietes'
import { 
  PROPRIETE_TYPES, 
  type ProprieteFormData,
  type Amenities,
  type Regles
} from '@/lib/validations/proprietes'
import { cn } from '@/lib/utils'

// Step schemas
const step1Schema = z.object({
  type: z.enum(PROPRIETE_TYPES).describe("Veuillez sélectionner un type de propriété"),
  nom: z.string().min(1, "Le nom est requis"),
  titre_annonce: z.string().optional(),
  description: z.string().optional(),
  a_unites: z.boolean().default(false),
  nombre_unites: z.number().optional()
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
  adresse_ligne1: z.string().min(1, "L'adresse est requise"),
  adresse_ligne2: z.string().optional(),
  code_postal: z.string().min(1, "Le code postal est requis"),
  ville: z.string().min(1, "La ville est requise"),
  region: z.string().optional(),
  pays: z.string().length(2, "Le pays doit être un code ISO à 2 lettres").toUpperCase()
})

const step3Schema = z.object({
  surface_m2: z.number().min(1, "La surface est requise"),
  surface_terrain_m2: z.number().optional(),
  nb_chambres: z.number().min(0).default(0),
  nb_lits: z.number().min(0).default(0),
  nb_sdb: z.number().min(0).default(0),
  capacite_max: z.number().min(1, "La capacité est requise"),
  etage: z.number().optional(),
  nb_etages: z.number().optional(),
  annee_construction: z.number().optional()
})

const step4Schema = z.object({
  prix_acquisition: z.number().optional(),
  valeur_actuelle: z.number().optional(),
  charges_mensuelles: z.number().optional(),
  taxe_fonciere: z.number().optional(),
  prix_nuit: z.number().optional(),
  prix_semaine: z.number().optional(),
  prix_mois: z.number().optional(),
  caution: z.number().optional(),
  frais_menage: z.number().optional()
})

// Full schema
const fullSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)

type WizardFormData = z.infer<typeof fullSchema>

const steps = [
  { id: 1, name: 'Type & Structure', icon: Building2 },
  { id: 2, name: 'Localisation', icon: MapPin },
  { id: 3, name: 'Caractéristiques', icon: Home },
  { id: 4, name: 'Tarifs & Finalisation', icon: Euro }
]

export function ProprietesWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amenities, setAmenities] = useState<Amenities>({})
  const [regles, setRegles] = useState<Regles>({})

  const form = useForm<WizardFormData>({
    defaultValues: {
      a_unites: false,
      nb_chambres: 0,
      nb_lits: 0,
      nb_sdb: 0,
      capacite_max: 1
    } as WizardFormData,
    mode: 'onChange'
  })

  const watchType = form.watch('type')
  const watchAUnites = form.watch('a_unites')

  // Simplified type change handler - no automatic a_unites logic
  const handleTypeChange = (value: string) => {
    form.setValue('type', value as any)
  }

  // Handle a_unites change - clear nombre_unites if switching to single unit
  const handleAUnitesChange = (value: boolean) => {
    form.setValue('a_unites', value)
    if (!value) {
      form.setValue('nombre_unites', undefined as any)
    }
  }

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof WizardFormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['type', 'nom', 'titre_annonce', 'description', 'a_unites', 'nombre_unites']
        break
      case 2:
        fieldsToValidate = ['adresse_ligne1', 'adresse_ligne2', 'code_postal', 'ville', 'region', 'pays']
        break
      case 3:
        fieldsToValidate = ['surface_m2', 'surface_terrain_m2', 'nb_chambres', 'nb_lits', 'nb_sdb', 'capacite_max', 'etage', 'nb_etages', 'annee_construction']
        break
      case 4:
        fieldsToValidate = ['prix_acquisition', 'valeur_actuelle', 'charges_mensuelles', 'taxe_fonciere', 'prix_nuit', 'prix_semaine', 'prix_mois', 'caution', 'frais_menage']
        break
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true)
    try {
      const proprieteData: ProprieteFormData = {
        ...data,
        amenities,
        regles,
        is_brouillon: false
      }

      const result = await createPropriete(proprieteData)
      
      if (result.success && result.data) {
        toast.success('Propriété créée avec succès')
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
            {/* NEW: Configuration Type Radio Group */}
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
                    <strong>Bien principal :</strong> Une seule unité de location (maison, appartement, etc.)<br/>
                    <strong>Bien avec unités :</strong> Plusieurs unités distinctes à louer (immeuble, terrain divisible, commerce avec espaces, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* UPDATED: Unified Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de propriété *</FormLabel>
                  <RadixSelect 
                    onValueChange={handleTypeChange}
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
                  <FormDescription>
                    Tous les types de biens peuvent maintenant être configurés avec ou sans unités selon vos besoins
                  </FormDescription>
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
                  <FormLabel>Titre de l'annonce</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="Ex: Magnifique villa avec vue mer" />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
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
              name="adresse_ligne1"
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
              name="adresse_ligne2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complément d'adresse</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white" placeholder="Bâtiment, étage, etc." />
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
                      <Input {...field} className="bg-white" placeholder="Île-de-France" />
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
                    <FormLabel>Pays (code ISO) *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white uppercase" 
                        placeholder="FR"
                        maxLength={2}
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Code pays à 2 lettres (FR, ES, IT, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surface_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface habitable (m²) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="120"
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        className="bg-white" 
                        placeholder="3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nb_lits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lits</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        className="bg-white" 
                        placeholder="5"
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        className="bg-white" 
                        placeholder="2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacite_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité max *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                        className="bg-white" 
                        placeholder="8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="2"
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="3"
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
                    <FormLabel>Année construction</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-white" 
                        placeholder="2010"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amenities Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Équipements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AmenityCheckbox
                  icon={<Wifi className="w-4 h-4" />}
                  label="WiFi"
                  checked={amenities.wifi || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, wifi: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Wind className="w-4 h-4" />}
                  label="Climatisation"
                  checked={amenities.climatisation || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, climatisation: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Car className="w-4 h-4" />}
                  label="Parking"
                  checked={amenities.parking || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, parking: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Waves className="w-4 h-4" />}
                  label="Piscine"
                  checked={amenities.piscine || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, piscine: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Trees className="w-4 h-4" />}
                  label="Jardin"
                  checked={amenities.jardin || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, jardin: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Dumbbell className="w-4 h-4" />}
                  label="Salle de sport"
                  checked={amenities.salle_sport || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, salle_sport: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Tv className="w-4 h-4" />}
                  label="Télévision"
                  checked={amenities.television || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, television: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Coffee className="w-4 h-4" />}
                  label="Machine à café"
                  checked={amenities.machine_cafe || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, machine_cafe: checked as boolean }))}
                />
                <AmenityCheckbox
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Lave-vaisselle"
                  checked={amenities.lave_vaisselle || false}
                  onCheckedChange={(checked) => setAmenities(prev => ({ ...prev, lave_vaisselle: checked as boolean }))}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations financières</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prix_acquisition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'acquisition (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="250000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="280000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charges_mensuelles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charges mensuelles (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="150"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="1200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tarifs de location</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prix_nuit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix/nuit (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="120"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prix_semaine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix/semaine (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prix_mois"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix/mois (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="2500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caution (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frais_menage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de ménage (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-white" 
                          placeholder="80"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rules Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Règles de la propriété</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="fumeurs"
                    checked={regles.fumeurs_autorises || false}
                    onCheckedChange={(checked) => setRegles(prev => ({ ...prev, fumeurs_autorises: checked }))}
                  />
                  <Label htmlFor="fumeurs">Fumeurs autorisés</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="animaux"
                    checked={regles.animaux_autorises || false}
                    onCheckedChange={(checked) => setRegles(prev => ({ ...prev, animaux_autorises: checked }))}
                  />
                  <Label htmlFor="animaux">Animaux autorisés</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="fetes"
                    checked={regles.fetes_autorisees || false}
                    onCheckedChange={(checked) => setRegles(prev => ({ ...prev, fetes_autorisees: checked }))}
                  />
                  <Label htmlFor="fetes">Fêtes autorisées</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enfants"
                    checked={regles.enfants_bienvenus !== false}
                    onCheckedChange={(checked) => setRegles(prev => ({ ...prev, enfants_bienvenus: checked }))}
                  />
                  <Label htmlFor="enfants">Enfants bienvenus</Label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress indicator */}
        <div className="space-y-4">
          <Progress value={(currentStep / 4) * 100} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    currentStep === step.id && "text-brand-copper font-semibold",
                    currentStep > step.id && "text-green-600",
                    currentStep < step.id && "text-gray-400"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    currentStep === step.id && "border-brand-copper bg-brand-copper/10",
                    currentStep > step.id && "border-green-600 bg-green-600/10",
                    currentStep < step.id && "border-gray-300 bg-white"
                  )}>
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:inline">{step.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Choisissez d'abord si c'est un bien principal ou avec unités, puis sélectionnez le type"}
              {currentStep === 2 && "Indiquez l'emplacement de votre propriété"}
              {currentStep === 3 && "Décrivez les caractéristiques et équipements"}
              {currentStep === 4 && "Définissez les tarifs et finalisez la création"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="gradient-copper text-white"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-copper text-white"
            >
              {isSubmitting ? (
                <>Création en cours...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Créer la propriété
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

// Helper components
function AmenityCheckbox({ 
  icon, 
  label, 
  checked, 
  onCheckedChange 
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor={label}
        className="text-sm font-normal cursor-pointer flex items-center gap-2"
      >
        {icon}
        {label}
      </Label>
    </div>
  )
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    maison: 'Maison',
    appartement: 'Appartement',
    villa: 'Villa',
    studio: 'Studio',
    loft: 'Loft',
    penthouse: 'Penthouse',
    immeuble: 'Immeuble',
    residence: 'Résidence',
    complex_hotelier: 'Complexe hôtelier',
    chalet: 'Chalet',
    bungalow: 'Bungalow',
    riad: 'Riad',
    ferme: 'Ferme',
    terrain: 'Terrain',
    local_commercial: 'Local commercial'
  }
  return labels[type] || type
}