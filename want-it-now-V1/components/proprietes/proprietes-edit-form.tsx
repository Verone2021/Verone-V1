'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

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
import { Checkbox } from '@/components/ui/checkbox'
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

import { updatePropriete } from '@/actions/proprietes'
import { 
  proprieteEditSchema,
  ProprieteWithStats,
  PROPRIETE_TYPES,
  PROPRIETE_STATUTS
} from '@/lib/validations/proprietes'

interface ProprietesEditFormProps {
  property: ProprieteWithStats
  propertyId: string
}

export function ProprietesEditForm({ property, propertyId }: ProprietesEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Label mappings for display
  const PROPRIETE_TYPE_LABELS = {
    'appartement': 'Appartement',
    'maison': 'Maison',
    'villa': 'Villa',
    'terrain': 'Terrain',
    'parking': 'Parking',
    'local_commercial': 'Local commercial',
    'immeuble': 'Immeuble',
    'autre': 'Autre'
  } as const

  const PROPRIETE_STATUT_LABELS = {
    'brouillon': 'Brouillon',
    'sourcing': 'Sourcing',
    'evaluation': 'Évaluation',
    'negociation': 'Négociation',
    'achetee': 'Achetée',
    'disponible': 'Disponible',
    'louee': 'Louée',
    'vendue': 'Vendue'
  } as const

  const form = useForm<z.infer<typeof proprieteEditSchema>>({
    resolver: zodResolver(proprieteEditSchema),
    defaultValues: {
      nom: property.nom,
      type: property.type,
      statut: property.statut,
      description: property.description || undefined,
      a_unites: property.a_unites,
      is_brouillon: property.is_brouillon,
      
      // Adresse
      adresse: property.adresse || undefined,
      adresse_complement: property.adresse_complement || undefined,
      code_postal: property.code_postal || undefined,
      ville: property.ville || undefined,
      region: property.region || undefined,
      pays: property.pays || undefined,
      
      // Caractéristiques
      surface_m2: property.surface_m2 || undefined,
      surface_terrain_m2: property.surface_terrain_m2 || undefined,
      nombre_pieces: property.nombre_pieces || undefined,
      nb_chambres: property.nb_chambres || 0,
      nb_sdb: property.nb_sdb || 0,
      etage: property.etage || undefined,
      nb_etages: property.nb_etages || undefined,
      annee_construction: property.annee_construction || undefined,
      
      // Équipements
      ascenseur: property.ascenseur || false,
      parking: property.parking || false,
      nombre_places_parking: property.nombre_places_parking || undefined,
      cave: property.cave || false,
      balcon: property.balcon || false,
      surface_balcon: property.surface_balcon || undefined,
      terrasse: property.terrasse || false,
      surface_terrasse: property.surface_terrasse || undefined,
      jardin: property.jardin || false,
      surface_jardin: property.surface_jardin || undefined,
      piscine: property.piscine || false,
      
      // Diagnostics
      dpe_classe: (property.dpe_classe && ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(property.dpe_classe)) 
        ? property.dpe_classe as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
        : undefined,
      dpe_valeur: property.dpe_valeur || undefined,
      ges_classe: (property.ges_classe && ['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(property.ges_classe)) 
        ? property.ges_classe as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
        : undefined,
      ges_valeur: property.ges_valeur || undefined,
      
      // Financier
      prix_achat: property.prix_achat || undefined,
      frais_acquisition: property.frais_acquisition || undefined,
      frais_notaire: property.frais_notaire || undefined,
      frais_annexes: property.frais_annexes || undefined,
      valeur_actuelle: property.valeur_actuelle || undefined,
      loyer: property.loyer || undefined,
      charges: property.charges || undefined,
      taxe_fonciere: property.taxe_fonciere || undefined,
      
      notes_internes: property.notes_internes || undefined,
    },
  })

  const watchAUnites = form.watch('a_unites')

  const onSubmit = async (data: z.infer<typeof proprieteEditSchema>) => {
    try {
      setIsLoading(true)

      // Transform data to match ProprieteFormData interface
      const formData = {
        // Basic info
        type: data.type,
        nom: data.nom,
        description: data.description || undefined,
        
        // Structure
        a_unites: data.a_unites ?? false,
        
        // Location
        adresse: data.adresse || undefined,
        adresse_complement: data.adresse_complement || undefined,
        code_postal: data.code_postal || undefined,
        ville: data.ville || undefined,
        region: data.region || undefined,
        pays: data.pays || undefined,
        
        // Characteristics
        surface_m2: data.surface_m2 || undefined,
        surface_terrain_m2: data.surface_terrain_m2 || undefined,
        nombre_pieces: data.nombre_pieces || undefined,
        nb_chambres: data.nb_chambres || undefined,
        nb_sdb: data.nb_sdb || undefined,
        etage: data.etage || undefined,
        nb_etages: data.nb_etages || undefined,
        annee_construction: data.annee_construction || undefined,
        
        // Financial
        prix_achat: data.prix_achat || undefined,
        frais_acquisition: data.frais_acquisition || undefined,
        frais_notaire: data.frais_notaire || undefined,
        frais_annexes: data.frais_annexes || undefined,
        valeur_actuelle: data.valeur_actuelle || undefined,
        charges: data.charges || undefined,
        taxe_fonciere: data.taxe_fonciere || undefined,
        loyer: data.loyer || undefined,
        
        // Status
        statut: data.statut || undefined,
        is_brouillon: data.is_brouillon ?? false
      }

      const result = await updatePropriete(property.id, formData)
      
      if (result.success) {
        toast.success("La propriété a été mise à jour avec succès.")
        router.push(`/proprietes/${property.id}`)
        router.refresh()
      } else {
        toast.error(result.error || "Une erreur est survenue lors de la mise à jour.")
      }
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error("Une erreur inattendue est survenue.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="address">Adresse</TabsTrigger>
            <TabsTrigger value="characteristics">Caractéristiques</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la propriété</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <RadixSelect onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPRIETE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {PROPRIETE_TYPE_LABELS[type as keyof typeof PROPRIETE_TYPE_LABELS] || type}
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
                    name="statut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <RadixSelect onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPRIETE_STATUTS.map((statut) => (
                              <SelectItem key={statut} value={statut}>
                                {PROPRIETE_STATUT_LABELS[statut as keyof typeof PROPRIETE_STATUT_LABELS] || statut}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </RadixSelect>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="a_unites"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Cette propriété contient plusieurs unités
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_brouillon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Enregistrer comme brouillon
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
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
                        <Input {...field} value={field.value || ''} />
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
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
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
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
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
                          <Input {...field} value={field.value || ''} />
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
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="characteristics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            disabled={watchAUnites}
                          />
                        </FormControl>
                        {watchAUnites && (
                          <FormDescription>
                            Géré au niveau des unités
                          </FormDescription>
                        )}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                    name="nombre_pieces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de pièces</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            disabled={watchAUnites}
                          />
                        </FormControl>
                        {watchAUnites && (
                          <FormDescription>
                            Géré au niveau des unités
                          </FormDescription>
                        )}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            disabled={watchAUnites}
                          />
                        </FormControl>
                        {watchAUnites && (
                          <FormDescription>
                            Géré au niveau des unités
                          </FormDescription>
                        )}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            disabled={watchAUnites}
                          />
                        </FormControl>
                        {watchAUnites && (
                          <FormDescription>
                            Géré au niveau des unités
                          </FormDescription>
                        )}
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
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Équipements */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Équipements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ascenseur"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Ascenseur
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Parking
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('parking') && (
                      <FormField
                        control={form.control}
                        name="nombre_places_parking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de places</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="cave"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cave
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="balcon"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Balcon
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('balcon') && (
                      <FormField
                        control={form.control}
                        name="surface_balcon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface balcon (m²)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="terrasse"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Terrasse
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('terrasse') && (
                      <FormField
                        control={form.control}
                        name="surface_terrasse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface terrasse (m²)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="jardin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Jardin
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('jardin') && (
                      <FormField
                        control={form.control}
                        name="surface_jardin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surface jardin (m²)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="piscine"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Piscine
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Diagnostics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Diagnostics énergétiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dpe_classe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classe DPE</FormLabel>
                          <RadixSelect onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((classe) => (
                                <SelectItem key={classe} value={classe}>
                                  {classe}
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
                      name="dpe_valeur"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valeur DPE (kWh/m²/an)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ges_classe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classe GES</FormLabel>
                          <RadixSelect onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((classe) => (
                                <SelectItem key={classe} value={classe}>
                                  {classe}
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
                      name="ges_valeur"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valeur GES (kg CO2/m²/an)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations financières</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frais_notaire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais de notaire (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frais_annexes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais annexes (€)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                            disabled={watchAUnites}
                          />
                        </FormControl>
                        {watchAUnites && (
                          <FormDescription>
                            Géré au niveau des unités
                          </FormDescription>
                        )}
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
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes_internes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes internes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} rows={4} />
                      </FormControl>
                      <FormDescription>
                        Ces notes sont à usage interne uniquement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/proprietes/${propertyId}`)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Form>
  )
}
