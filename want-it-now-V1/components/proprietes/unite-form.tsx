'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Home, 
  Ruler, 
  Euro, 
  Calendar,
  Bed,
  Bath,
  Users,
  Loader2,
  Save,
  AlertCircle,
  Check,
  X,
  ArrowLeft, 
  Calculator, 
  Key, 
  FileText,
  Package,
  MapPin,
  DollarSign
} from 'lucide-react'
import { createUnite, updateUnite, getUniteById } from '@/actions/proprietes-unites'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Constants - Unit types for dropdown
const UNITE_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: 't1', label: 'T1' },
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5', label: 'T5+' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'suite', label: 'Suite' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'loft', label: 'Loft' },
]

// Schema for form validation
const uniteFormSchema = z.object({
  numero: z.string().optional(),
  nom: z.string().min(1, 'Le nom est requis'),
  type: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  
  // Caractéristiques - Aligned field names with DB schema
  surface_habitable: z.number().min(0).optional().or(z.nan()),
  surface_totale: z.number().min(0).optional().or(z.nan()),
  surface_terrasse: z.number().min(0).optional().or(z.nan()),
  surface_jardin: z.number().min(0).optional().or(z.nan()),
  nb_pieces: z.number().min(0).optional().or(z.nan()),
  nb_chambres: z.number().min(0).optional().or(z.nan()),
  nombre_salles_bain: z.number().min(0).optional().or(z.nan()),
  nb_wc: z.number().min(0).optional().or(z.nan()),
  etage: z.number().optional().or(z.nan()),
  
  // Équipements - Using consistent boolean field names
  balcon: z.boolean().optional().default(false),
  terrasse: z.boolean().optional().default(false),
  jardin: z.boolean().optional().default(false),
  cave: z.boolean().optional().default(false),
  parking: z.boolean().optional().default(false),
  box: z.boolean().optional().default(false),
  ascenseur: z.boolean().optional().default(false),
  accessible_pmr: z.boolean().optional().default(false),
  
  // Location et détails
  orientation: z.string().optional(),
  vue: z.string().optional(),
  dpe_classe_energie: z.string().optional(),
  dpe_classe_ges: z.string().optional(),
  
  // Tarifs - Using consistent field names
  prix_vente: z.number().min(0).optional().or(z.nan()),
  loyer_mensuel: z.number().min(0).optional().or(z.nan()),
  charges_mensuelles: z.number().min(0).optional().or(z.nan()),
  depot_garantie: z.number().min(0).optional().or(z.nan()),
  frais_agence: z.number().min(0).optional().or(z.nan()),
  charges_incluses: z.boolean().optional().default(false),
  
  // État et statut
  statut: z.string().default('disponible'),
  etat: z.string().optional(),
  date_disponibilite: z.string().optional(),
  date_construction: z.string().optional(),
})

type UniteFormData = z.infer<typeof uniteFormSchema>

interface UniteFormProps {
  proprieteId: string
  proprieteName: string
  uniteId?: string
  mode?: 'create' | 'edit'
}


export function UniteForm({ proprieteId, proprieteName, uniteId, mode = 'create' }: UniteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [unite, setUnite] = useState<any>(null)

  const form = useForm<UniteFormData>({
    resolver: zodResolver(uniteFormSchema),
    defaultValues: {
      // Informations de base
      nom: '',
      numero: '',
      type: '',
      description: '',
      notes: '',
      
      // Caractéristiques - Using consistent field names
      surface_habitable: undefined,
      surface_totale: undefined,
      surface_terrasse: undefined,
      surface_jardin: undefined,
      nb_pieces: undefined,
      nb_chambres: undefined,
      nombre_salles_bain: undefined,
      nb_wc: undefined,
      etage: undefined,
      
      // Équipements - Using consistent boolean field names
      balcon: false,
      terrasse: false,
      jardin: false,
      cave: false,
      parking: false,
      box: false,
      ascenseur: false,
      accessible_pmr: false,
      
      // Location et détails
      orientation: '',
      vue: '',
      dpe_classe_energie: '',
      dpe_classe_ges: '',
      
      // Tarifs - Using consistent field names
      prix_vente: undefined,
      loyer_mensuel: undefined,
      charges_mensuelles: undefined,
      depot_garantie: undefined,
      frais_agence: undefined,
      charges_incluses: false,
      
      // État et statut
      statut: 'disponible',
      etat: '',
      date_disponibilite: '',
      date_construction: '',
    },
  })

  const { watch, setValue, reset } = form
  const disponible = watch('statut') === 'disponible'

  useEffect(() => {
    async function loadUniteData() {
    if (!uniteId) return

    setIsLoadingData(true)
    try {
      const result = await getUniteById(uniteId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      if (result.data) {
        const uniteData = result.data
        setUnite(uniteData)

        // Pré-remplir le formulaire avec les données existantes
        reset({
          nom: uniteData.nom || '',
          numero: uniteData.numero || '',
          type: uniteData.type || 'studio',
          surface_habitable: uniteData.surface_habitable || undefined,
          surface_totale: uniteData.surface_totale || undefined,
          nombre_pieces: uniteData.nombre_pieces || undefined,
          nb_chambres: uniteData.nb_chambres || undefined,
          nombre_salles_bain: uniteData.nombre_salles_bain || undefined,
          balcon: uniteData.balcon || false,
          terrasse: uniteData.terrasse || false,
          parking: uniteData.parking || false,
          cave: uniteData.cave || false,
          etage: uniteData.etage || undefined,
          orientation: uniteData.orientation || '',
          vue: uniteData.vue || '',
          etat: uniteData.etat || 'bon',
          date_construction: uniteData.date_construction 
            ? new Date(uniteData.date_construction).toISOString().split('T')[0] 
            : '',
          date_disponibilite: uniteData.date_disponibilite 
            ? new Date(uniteData.date_disponibilite).toISOString().split('T')[0] 
            : '',
          loyer_mensuel: uniteData.loyer_mensuel || undefined,
          charges_mensuelles: uniteData.charges_mensuelles || undefined,
          charges_incluses: uniteData.charges_incluses || false,
          depot_garantie: uniteData.depot_garantie || undefined,
          frais_agence: uniteData.frais_agence || undefined,
          description: uniteData.description || '',
          equipements: uniteData.equipements || '',
          statut: uniteData.statut || 'disponible',
        })
      }
    } catch (error) {
      console.error('Error loading unite data:', error)
      // Fix: Use string format for sonner toast instead of object format
      toast.error("Impossible de charger les données de l'unité")
    } finally {
      setIsLoadingData(false)
    }
  }

    if (mode === 'edit' && uniteId) {
      loadUniteData()
    }
  }, [uniteId, mode, setValue, form])

  const onSubmit = async (data: UniteFormData) => {
    setIsLoading(true)
    
    try {
      let result
      if (mode === 'create') {
        // Fix: Use proprieteId instead of propriete.id
        result = await createUnite({
          ...data,
          propriete_id: proprieteId,
          date_disponibilite: data.date_disponibilite ? new Date(data.date_disponibilite).toISOString() : null,
          date_construction: data.date_construction ? new Date(data.date_construction).toISOString() : null,
        })
      } else {
        // Fix: Use uniteId instead of unite!.id  
        result = await updateUnite(uniteId!, {
          ...data,
          date_disponibilite: data.date_disponibilite ? new Date(data.date_disponibilite).toISOString() : null,
          date_construction: data.date_construction ? new Date(data.date_construction).toISOString() : null,
        })
      }

      if (result.error) throw new Error(result.error)

      // Fix: Use string format for sonner toast instead of object format
      toast.success(mode === 'create' ? "L'unité a été créée avec succès." : "L'unité a été modifiée avec succès.")

      router.push(`/proprietes/${proprieteId}`)
    } catch (error) {
      console.error('Erreur:', error)
      // Fix: Use string format for sonner toast instead of object format
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Créer une unité' : 'Modifier l\'unité'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? `Ajoutez une nouvelle unité à la propriété "${proprieteName}"`
            : `Modifiez les informations de cette unité`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations de base */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-brand-copper" />
                <h3 className="text-lg font-semibold">Informations de base</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'unité *</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Studio côté jardin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: A1, 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'unité</FormLabel>
                      <RadixSelect 
                        onValueChange={field.onChange} 
                        value={field.value || ""} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="t1">T1</SelectItem>
                          <SelectItem value="t2">T2</SelectItem>
                          <SelectItem value="t3">T3</SelectItem>
                          <SelectItem value="t4">T4</SelectItem>
                          <SelectItem value="t5">T5+</SelectItem>
                          <SelectItem value="chambre">Chambre</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="loft">Loft</SelectItem>
                        </SelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="etage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Étage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ex: 2"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Caractéristiques */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-brand-copper" />
                <h3 className="text-lg font-semibold">Caractéristiques</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="surface_habitable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface habitable (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="ex: 45.5"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surface_totale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface totale (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="ex: 52.3"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surface_terrasse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface terrasse (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="ex: 8.0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surface_jardin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface jardin (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="ex: 15.0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_pieces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de pièces</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ex: 3"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
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
                      <FormLabel>Nombre de chambres</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ex: 2"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_salles_bain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salles de bain</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ex: 1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nb_wc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toilettes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ex: 1"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Aménagements */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-copper" />
                <h3 className="text-lg font-semibold">Aménagements</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      <FormLabel className="text-sm">Balcon</FormLabel>
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
                      <FormLabel className="text-sm">Terrasse</FormLabel>
                    </FormItem>
                  )}
                />

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
                      <FormLabel className="text-sm">Jardin</FormLabel>
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
                      <FormLabel className="text-sm">Cave</FormLabel>
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
                      <FormLabel className="text-sm">Parking</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="box"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Box</FormLabel>
                    </FormItem>
                  )}
                />

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
                      <FormLabel className="text-sm">Ascenseur</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessible_pmr"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Accessible PMR</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Détails et caractéristiques */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-copper" />
                <h3 className="text-lg font-semibold">Détails</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orientation</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Sud, Nord-Est" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vue</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Mer, Montagne, Jardin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dpe_classe_energie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DPE - Classe énergie</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: B, C, D" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dpe_classe_ges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DPE - Classe GES</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: B, C, D" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_disponibilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de disponibilité</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_construction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de construction</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Statut et informations financières */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-copper" />
                <h3 className="text-lg font-semibold">Statut et finances</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut *</FormLabel>
                      <RadixSelect onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Statut de l'unité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="occupee">Occupée</SelectItem>
                          <SelectItem value="travaux">En travaux</SelectItem>
                          <SelectItem value="vendue">Vendue</SelectItem>
                          <SelectItem value="reservee">Réservée</SelectItem>
                        </SelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {disponible && (
                  <>
                    <FormField
                      control={form.control}
                      name="prix_vente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix de vente (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="ex: 250000"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loyer_mensuel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loyer mensuel (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="ex: 850"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
                              step="0.01"
                              placeholder="ex: 75"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="depot_garantie"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dépôt de garantie (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="ex: 1700"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frais_agence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frais d'agence (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="ex: 850"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de l'unité..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : mode === 'create' ? "Créer l'unité" : "Modifier l'unité"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
