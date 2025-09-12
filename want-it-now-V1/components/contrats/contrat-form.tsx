'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { createContrat, updateContrat, getProprietesForSelection, getUnitesForProperty } from '@/actions/contrats'
import { ContratFormData, ContratType, ContratAvecRelations, CONTRAT_TYPES, CONTRAT_DEFAULTS } from '@/types/contrats'
import { CalendarIcon, BuildingIcon, UserIcon, EuroIcon, ShieldIcon, FileTextIcon, PhoneIcon, SettingsIcon, AlertTriangleIcon } from 'lucide-react'

const contratFormSchema = z.object({
  // Base
  propriete_id: z.string().optional(),
  unite_id: z.string().optional(),
  type_contrat: z.enum(['fixe', 'variable']),
  date_debut: z.string().min(1, 'Date de début requise'),
  date_fin: z.string().min(1, 'Date de fin requise'),
  meuble: z.boolean(),
  autorisation_sous_location: z.boolean(),
  besoin_renovation: z.boolean(),
  deduction_futurs_loyers: z.string().optional(),
  duree_imposee_mois: z.string().optional(),
  commission_pourcentage: z.string().min(1, 'Commission requise'),
  usage_proprietaire_jours_max: z.string().min(1, 'Usage propriétaire requis'),

  // Bailleur
  bailleur_nom: z.string().optional(),
  bailleur_adresse_siege: z.string().optional(),
  bailleur_siren_siret: z.string().optional(),
  bailleur_tva_intracommunautaire: z.string().optional(),
  bailleur_representant_legal: z.string().optional(),
  bailleur_email: z.string().email('Email invalide').or(z.literal('')).optional(),
  bailleur_telephone: z.string().optional(),

  // Bien immobilier
  bien_adresse_complete: z.string().optional(),
  bien_type: z.string().optional(),
  bien_superficie: z.string().optional(),
  bien_nombre_pieces: z.string().optional(),
  bien_etat_lieux_initial: z.string().optional(),

  // Conditions financières - Contrat Fixe
  loyer_mensuel_ht: z.string().optional(),
  jour_paiement_loyer: z.string().optional(),
  charges_mensuelles: z.string().optional(),
  charges_inclus: z.string().optional(),
  depot_garantie: z.string().optional(),
  plafond_depannages_urgents: z.string().optional(),
  delai_paiement_factures: z.string().optional(),

  // Conditions financières - Contrat Variable
  estimation_revenus_mensuels: z.string().optional(),
  methode_calcul_revenus: z.string().optional(),
  dates_paiement: z.string().optional(),
  frais_abonnement_internet: z.string().optional(),
  frais_equipements_domotique: z.string().optional(),
  catalogue_equipements: z.string().optional(),

  // Clauses spécifiques
  conditions_sous_location: z.string().optional(),
  activites_permises: z.string().optional(),
  autorisation_travaux: z.boolean().optional(),
  conditions_suspension_bail: z.string().optional(),
  conditions_remboursement_travaux: z.string().optional(),

  // Assurances
  attestation_assurance: z.boolean().optional(),
  nom_assureur: z.string().optional(),
  numero_police: z.string().optional(),
  date_expiration_assurance: z.string().optional(),
  assurance_pertes_exploitation: z.boolean().optional(),
  assurance_pertes_exploitation_details: z.string().optional(),
  assurance_occupation_illicite: z.boolean().optional(),
  assurance_occupation_illicite_details: z.string().optional(),
  protection_juridique: z.boolean().optional(),
  protection_juridique_details: z.string().optional(),

  // Documentation
  inventaire_meubles: z.string().optional(),
  modele_etat_lieux: z.string().optional(),
  reglement_copropriete: z.string().optional(),

  // Contact urgence
  contact_urgence_nom: z.string().optional(),
  contact_urgence_telephone: z.string().optional(),
  contact_urgence_email: z.string().email('Email invalide').or(z.literal('')).optional(),

  // Juridique et administratif
  duree_bail_initial: z.string().optional(),
  conditions_renouvellement: z.string().optional(),
  clauses_resiliation_anticipee: z.string().optional(),
  obligations_entretien_reparations: z.string().optional(),
  revision_loyer_irl: z.boolean().optional(),

  // Spécifique Want It Now
  type_activite_sous_location: z.string().optional(),
  conditions_restitution_bien: z.string().optional(),
  procedures_dommages_degradations: z.string().optional(),
  duree_contrat_1an: z.boolean().optional(),
  conditions_utilisation_proprietaire: z.string().optional(),
  periodes_creuses: z.string().optional(),

  // Gestion et maintenance
  reparations_entretien_responsabilites: z.string().optional(),
  gestion_sinistres_urgences: z.string().optional(),
  procedure_urgence: z.string().optional(),

  // Métadonnées
  notes_internes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validation des dates
  if (data.date_debut && data.date_fin) {
    const dateDebut = new Date(data.date_debut)
    const dateFin = new Date(data.date_fin)
    
    if (dateFin <= dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de fin doit être postérieure à la date de début',
        path: ['date_fin']
      })
    }
  }
  
  // Validation des champs numériques
  const numericFields = [
    'commission_pourcentage', 'usage_proprietaire_jours_max', 'deduction_futurs_loyers',
    'duree_imposee_mois', 'bien_superficie', 'bien_nombre_pieces', 'loyer_mensuel_ht',
    'jour_paiement_loyer', 'charges_mensuelles', 'depot_garantie', 'plafond_depannages_urgents',
    'delai_paiement_factures', 'estimation_revenus_mensuels', 'frais_abonnement_internet',
    'frais_equipements_domotique', 'duree_bail_initial'
  ]
  
  numericFields.forEach(field => {
    const value = data[field as keyof typeof data] as string
    if (value && value.trim() && isNaN(Number(value))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Doit être un nombre valide',
        path: [field]
      })
    }
  })
  
  // Validation jour de paiement
  if (data.jour_paiement_loyer) {
    const jour = Number(data.jour_paiement_loyer)
    if (jour < 1 || jour > 31) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le jour doit être entre 1 et 31',
        path: ['jour_paiement_loyer']
      })
    }
  }
})

interface ContratFormProps {
  contrat?: ContratAvecRelations
  isEdit?: boolean
}

interface Propriete {
  id: string
  nom: string
  adresse_complete: string
}

interface Unite {
  id: string
  nom: string
  numero: string
  description: string
}

export function ContratForm({ contrat, isEdit = false }: ContratFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [proprietes, setProprietes] = useState<Propriete[]>([])
  const [unites, setUnites] = useState<Unite[]>([])
  const [loadingProprietes, setLoadingProprietes] = useState(true)
  const [loadingUnites, setLoadingUnites] = useState(false)

  // Fallback constants in case import fails
  const LOCAL_CONTRAT_TYPES = [
    { value: 'fixe' as const, label: 'Contrat Fixe' },
    { value: 'variable' as const, label: 'Contrat Variable' }
  ]

  const LOCAL_CONTRAT_DEFAULTS = {
    commission_pourcentage: 10.00,
    usage_proprietaire_jours_max: 60,
    autorisation_sous_location: true,
    meuble: false,
    besoin_renovation: false
  }

  // Use imported constants or fallback
  const contratTypes = CONTRAT_TYPES || LOCAL_CONTRAT_TYPES
  const contratDefaults = CONTRAT_DEFAULTS || LOCAL_CONTRAT_DEFAULTS

  const form = useForm<ContratFormData>({
    resolver: zodResolver(contratFormSchema),
    defaultValues: {
      propriete_id: contrat?.propriete_id || '',
      unite_id: contrat?.unite_id || '',
      type_contrat: contrat?.type_contrat || 'fixe',
      date_debut: contrat?.date_debut ? contrat.date_debut.split('T')[0] : '',
      date_fin: contrat?.date_fin ? contrat.date_fin.split('T')[0] : '',
      meuble: contrat?.meuble ?? contratDefaults.meuble,
      autorisation_sous_location: contrat?.autorisation_sous_location ?? contratDefaults.autorisation_sous_location,
      besoin_renovation: contrat?.besoin_renovation ?? contratDefaults.besoin_renovation,
      commission_pourcentage: contrat?.commission_pourcentage?.toString() || contratDefaults.commission_pourcentage.toString(),
      usage_proprietaire_jours_max: contrat?.usage_proprietaire_jours_max?.toString() || contratDefaults.usage_proprietaire_jours_max.toString(),
      deduction_futurs_loyers: contrat?.deduction_futurs_loyers?.toString() || '',
      duree_imposee_mois: contrat?.duree_imposee_mois?.toString() || '',
      
      // Bailleur
      bailleur_nom: contrat?.bailleur_nom || '',
      bailleur_adresse_siege: contrat?.bailleur_adresse_siege || '',
      bailleur_siren_siret: contrat?.bailleur_siren_siret || '',
      bailleur_tva_intracommunautaire: contrat?.bailleur_tva_intracommunautaire || '',
      bailleur_representant_legal: contrat?.bailleur_representant_legal || '',
      bailleur_email: contrat?.bailleur_email || '',
      bailleur_telephone: contrat?.bailleur_telephone || '',
      
      // Bien
      bien_adresse_complete: contrat?.bien_adresse_complete || '',
      bien_type: contrat?.bien_type || '',
      bien_superficie: contrat?.bien_superficie?.toString() || '',
      bien_nombre_pieces: contrat?.bien_nombre_pieces?.toString() || '',
      bien_etat_lieux_initial: contrat?.bien_etat_lieux_initial || '',
      
      // Financier fixe
      loyer_mensuel_ht: contrat?.loyer_mensuel_ht?.toString() || '',
      jour_paiement_loyer: contrat?.jour_paiement_loyer?.toString() || '',
      charges_mensuelles: contrat?.charges_mensuelles?.toString() || '',
      charges_inclus: contrat?.charges_inclus || '',
      depot_garantie: contrat?.depot_garantie?.toString() || '',
      plafond_depannages_urgents: contrat?.plafond_depannages_urgents?.toString() || '',
      delai_paiement_factures: contrat?.delai_paiement_factures?.toString() || '',
      
      // Financier variable
      estimation_revenus_mensuels: contrat?.estimation_revenus_mensuels?.toString() || '',
      methode_calcul_revenus: contrat?.methode_calcul_revenus || '',
      dates_paiement: contrat?.dates_paiement || '',
      frais_abonnement_internet: contrat?.frais_abonnement_internet?.toString() || '',
      frais_equipements_domotique: contrat?.frais_equipements_domotique?.toString() || '',
      catalogue_equipements: contrat?.catalogue_equipements || '',
      
      // Clauses
      conditions_sous_location: contrat?.conditions_sous_location || '',
      activites_permises: contrat?.activites_permises || '',
      autorisation_travaux: contrat?.autorisation_travaux || false,
      conditions_suspension_bail: contrat?.conditions_suspension_bail || '',
      conditions_remboursement_travaux: contrat?.conditions_remboursement_travaux || '',
      
      // Assurances
      attestation_assurance: contrat?.attestation_assurance || false,
      nom_assureur: contrat?.nom_assureur || '',
      numero_police: contrat?.numero_police || '',
      date_expiration_assurance: contrat?.date_expiration_assurance ? contrat.date_expiration_assurance.split('T')[0] : '',
      assurance_pertes_exploitation: contrat?.assurance_pertes_exploitation || false,
      assurance_pertes_exploitation_details: contrat?.assurance_pertes_exploitation_details || '',
      assurance_occupation_illicite: contrat?.assurance_occupation_illicite || false,
      assurance_occupation_illicite_details: contrat?.assurance_occupation_illicite_details || '',
      protection_juridique: contrat?.protection_juridique || false,
      protection_juridique_details: contrat?.protection_juridique_details || '',
      
      // Documentation
      inventaire_meubles: contrat?.inventaire_meubles || '',
      modele_etat_lieux: contrat?.modele_etat_lieux || '',
      reglement_copropriete: contrat?.reglement_copropriete || '',
      
      // Contact urgence
      contact_urgence_nom: contrat?.contact_urgence_nom || '',
      contact_urgence_telephone: contrat?.contact_urgence_telephone || '',
      contact_urgence_email: contrat?.contact_urgence_email || '',
      
      // Juridique
      duree_bail_initial: contrat?.duree_bail_initial?.toString() || '',
      conditions_renouvellement: contrat?.conditions_renouvellement || '',
      clauses_resiliation_anticipee: contrat?.clauses_resiliation_anticipee || '',
      obligations_entretien_reparations: contrat?.obligations_entretien_reparations || '',
      revision_loyer_irl: contrat?.revision_loyer_irl ?? true,
      
      // Want It Now
      type_activite_sous_location: contrat?.type_activite_sous_location || '',
      conditions_restitution_bien: contrat?.conditions_restitution_bien || '',
      procedures_dommages_degradations: contrat?.procedures_dommages_degradations || '',
      duree_contrat_1an: contrat?.duree_contrat_1an ?? true,
      conditions_utilisation_proprietaire: contrat?.conditions_utilisation_proprietaire || '',
      periodes_creuses: contrat?.periodes_creuses || '',
      
      // Maintenance
      reparations_entretien_responsabilites: contrat?.reparations_entretien_responsabilites || '',
      gestion_sinistres_urgences: contrat?.gestion_sinistres_urgences || '',
      procedure_urgence: contrat?.procedure_urgence || '',
      
      // Notes
      notes_internes: contrat?.notes_internes || '',
    },
  })

  const typeContrat = form.watch('type_contrat')
  const proprieteId = form.watch('propriete_id')

  // Charger les propriétés
  useEffect(() => {
    async function loadProprietes() {
      setLoadingProprietes(true)
      try {
        const result = await getProprietesForSelection()
        if (result.success && result.data) {
          setProprietes(result.data)
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des propriétés')
      } finally {
        setLoadingProprietes(false)
      }
    }
    loadProprietes()
  }, [])

  // Charger les unités quand une propriété est sélectionnée
  useEffect(() => {
    async function loadUnites() {
      if (!proprieteId) {
        setUnites([])
        return
      }

      setLoadingUnites(true)
      try {
        const result = await getUnitesForProperty(proprieteId)
        if (result.success && result.data) {
          setUnites(result.data)
        } else {
          setUnites([])
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des unités')
        setUnites([])
      } finally {
        setLoadingUnites(false)
      }
    }
    loadUnites()
  }, [proprieteId])

  async function onSubmit(values: ContratFormData) {
    setLoading(true)
    try {
      // Transformation des strings en numbers pour les champs numériques
      const submitData = {
        organisation_id: '', // Sera géré côté serveur
        propriete_id: values.propriete_id || null,
        unite_id: values.unite_id || null,
        type_contrat: values.type_contrat,
        date_debut: values.date_debut,
        date_fin: values.date_fin,
        meuble: values.meuble,
        autorisation_sous_location: values.autorisation_sous_location,
        besoin_renovation: values.besoin_renovation,
        commission_pourcentage: values.commission_pourcentage ? parseFloat(values.commission_pourcentage) : contratDefaults.commission_pourcentage,
        usage_proprietaire_jours_max: values.usage_proprietaire_jours_max ? parseInt(values.usage_proprietaire_jours_max) : contratDefaults.usage_proprietaire_jours_max,
        deduction_futurs_loyers: values.deduction_futurs_loyers ? parseFloat(values.deduction_futurs_loyers) : null,
        duree_imposee_mois: values.duree_imposee_mois ? parseInt(values.duree_imposee_mois) : null,
        
        // Bailleur
        bailleur_nom: values.bailleur_nom || undefined,
        bailleur_adresse_siege: values.bailleur_adresse_siege || undefined,
        bailleur_siren_siret: values.bailleur_siren_siret || undefined,
        bailleur_tva_intracommunautaire: values.bailleur_tva_intracommunautaire || undefined,
        bailleur_representant_legal: values.bailleur_representant_legal || undefined,
        bailleur_email: values.bailleur_email || undefined,
        bailleur_telephone: values.bailleur_telephone || undefined,
        
        // Bien
        bien_adresse_complete: values.bien_adresse_complete || undefined,
        bien_type: values.bien_type || undefined,
        bien_superficie: values.bien_superficie ? parseFloat(values.bien_superficie) : undefined,
        bien_nombre_pieces: values.bien_nombre_pieces ? parseInt(values.bien_nombre_pieces) : undefined,
        bien_etat_lieux_initial: values.bien_etat_lieux_initial || undefined,
        
        // Financier fixe
        loyer_mensuel_ht: values.loyer_mensuel_ht ? parseFloat(values.loyer_mensuel_ht) : undefined,
        jour_paiement_loyer: values.jour_paiement_loyer ? parseInt(values.jour_paiement_loyer) : undefined,
        charges_mensuelles: values.charges_mensuelles ? parseFloat(values.charges_mensuelles) : undefined,
        charges_inclus: values.charges_inclus || undefined,
        depot_garantie: values.depot_garantie ? parseFloat(values.depot_garantie) : undefined,
        plafond_depannages_urgents: values.plafond_depannages_urgents ? parseFloat(values.plafond_depannages_urgents) : undefined,
        delai_paiement_factures: values.delai_paiement_factures ? parseInt(values.delai_paiement_factures) : undefined,
        
        // Financier variable
        estimation_revenus_mensuels: values.estimation_revenus_mensuels ? parseFloat(values.estimation_revenus_mensuels) : undefined,
        methode_calcul_revenus: values.methode_calcul_revenus || undefined,
        dates_paiement: values.dates_paiement || undefined,
        frais_abonnement_internet: values.frais_abonnement_internet ? parseFloat(values.frais_abonnement_internet) : undefined,
        frais_equipements_domotique: values.frais_equipements_domotique ? parseFloat(values.frais_equipements_domotique) : undefined,
        catalogue_equipements: values.catalogue_equipements || undefined,
        
        // Clauses
        conditions_sous_location: values.conditions_sous_location || undefined,
        activites_permises: values.activites_permises || undefined,
        autorisation_travaux: values.autorisation_travaux,
        conditions_suspension_bail: values.conditions_suspension_bail || undefined,
        conditions_remboursement_travaux: values.conditions_remboursement_travaux || undefined,
        
        // Assurances
        attestation_assurance: values.attestation_assurance,
        nom_assureur: values.nom_assureur || undefined,
        numero_police: values.numero_police || undefined,
        date_expiration_assurance: values.date_expiration_assurance || undefined,
        assurance_pertes_exploitation: values.assurance_pertes_exploitation,
        assurance_pertes_exploitation_details: values.assurance_pertes_exploitation_details || undefined,
        assurance_occupation_illicite: values.assurance_occupation_illicite,
        assurance_occupation_illicite_details: values.assurance_occupation_illicite_details || undefined,
        protection_juridique: values.protection_juridique,
        protection_juridique_details: values.protection_juridique_details || undefined,
        
        // Documentation
        inventaire_meubles: values.inventaire_meubles || undefined,
        modele_etat_lieux: values.modele_etat_lieux || undefined,
        reglement_copropriete: values.reglement_copropriete || undefined,
        
        // Contact urgence
        contact_urgence_nom: values.contact_urgence_nom || undefined,
        contact_urgence_telephone: values.contact_urgence_telephone || undefined,
        contact_urgence_email: values.contact_urgence_email || undefined,
        
        // Juridique
        duree_bail_initial: values.duree_bail_initial ? parseInt(values.duree_bail_initial) : undefined,
        conditions_renouvellement: values.conditions_renouvellement || undefined,
        clauses_resiliation_anticipee: values.clauses_resiliation_anticipee || undefined,
        obligations_entretien_reparations: values.obligations_entretien_reparations || undefined,
        revision_loyer_irl: values.revision_loyer_irl,
        
        // Want It Now
        type_activite_sous_location: values.type_activite_sous_location || undefined,
        conditions_restitution_bien: values.conditions_restitution_bien || undefined,
        procedures_dommages_degradations: values.procedures_dommages_degradations || undefined,
        duree_contrat_1an: values.duree_contrat_1an,
        conditions_utilisation_proprietaire: values.conditions_utilisation_proprietaire || undefined,
        periodes_creuses: values.periodes_creuses || undefined,
        
        // Maintenance
        reparations_entretien_responsabilites: values.reparations_entretien_responsabilites || undefined,
        gestion_sinistres_urgences: values.gestion_sinistres_urgences || undefined,
        procedure_urgence: values.procedure_urgence || undefined,
        
        // Notes
        notes_internes: values.notes_internes || undefined,
      }

      let result
      if (isEdit && contrat) {
        result = await updateContrat({ ...submitData, id: contrat.id })
      } else {
        result = await createContrat(submitData)
      }

      if (result.success) {
        toast.success(isEdit ? 'Contrat modifié avec succès' : 'Contrat créé avec succès')
        router.push(result.data ? `/contrats/${result.data.id}` : '/contrats')
      } else {
        toast.error(result.error || 'Une erreur est survenue')
      }
    } catch (error) {
      toast.error("Erreur inattendue lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  const proprieteOptions = [
    { value: '', label: '🏠 Propriété entière' },
    ...proprietes.map(p => ({
      value: p.id,
      label: `${p.nom} - ${p.adresse_complete}`
    }))
  ]

  const uniteOptions = [
    { value: '', label: '🏠 Propriété entière' },
    ...unites.map(u => ({
      value: u.id,
      label: u.description || `${u.nom} ${u.numero}`
    }))
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section: Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type_contrat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de contrat</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={field.onChange}
                        value={field.value}
                      >
                        <option value="fixe">Contrat Fixe</option>
                        <option value="variable">Contrat Variable</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propriete_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propriété</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={field.onChange}
                        value={field.value}
                        disabled={loadingProprietes}
                      >
                        {loadingProprietes ? (
                          <option value="">Chargement...</option>
                        ) : (
                          proprieteOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unite_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité (optionnel)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={field.onChange}
                        value={field.value || ''}
                        disabled={loadingUnites || !proprieteId}
                      >
                        {loadingUnites ? (
                          <option value="">Chargement des unités...</option>
                        ) : !proprieteId ? (
                          <option value="">Sélectionnez d'abord une propriété</option>
                        ) : (
                          uniteOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="date_debut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="meuble"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Meublé</FormLabel>
                      <FormDescription>
                        Propriété meublée
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

              <FormField
                control={form.control}
                name="autorisation_sous_location"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sous-location autorisée</FormLabel>
                      <FormDescription>
                        Autorisation de sous-location
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

              <FormField
                control={form.control}
                name="besoin_renovation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Besoin rénovation</FormLabel>
                      <FormDescription>
                        Travaux de rénovation nécessaires
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="commission_pourcentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Want It Now (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usage_proprietaire_jours_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage propriétaire (jours/an)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Informations sur le bailleur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Informations sur le bailleur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="bailleur_nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom/Raison sociale</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_adresse_siege"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse du siège</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_siren_siret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIREN/SIRET</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_tva_intracommunautaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° TVA Intracommunautaire</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_representant_legal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Représentant légal</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bailleur_telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Informations sur le bien */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5" />
              Informations sur le bien immobilier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="bien_adresse_complete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bien_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de bien</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bien_superficie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Superficie (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bien_nombre_pieces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de pièces</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="bien_etat_lieux_initial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>État des lieux initial</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Conditions financières */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EuroIcon className="w-5 h-5" />
              Conditions financières - {typeContrat === 'fixe' ? 'Contrat Fixe' : 'Contrat Variable'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {typeContrat === 'fixe' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="loyer_mensuel_ht"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyer mensuel HT (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jour_paiement_loyer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jour de paiement (1-31)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" {...field} />
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
                        <Input type="number" step="0.01" min="0" {...field} />
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
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plafond_depannages_urgents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plafond dépannages urgents (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delai_paiement_factures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Délai paiement factures (jours)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="charges_inclus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ce que incluent les charges</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estimation_revenus_mensuels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimation revenus mensuels (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frais_abonnement_internet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais abonnement internet (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frais_equipements_domotique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais équipements domotique (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="methode_calcul_revenus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Méthode de calcul des revenus</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="dates_paiement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description des dates de paiement</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="catalogue_equipements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catalogue des équipements</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section: Clauses spécifiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Clauses spécifiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="conditions_sous_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de sous-location</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activites_permises"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activités permises</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="autorisation_travaux"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Autorisation travaux</FormLabel>
                        <FormDescription>
                          Autorise les travaux d'aménagement
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

              <FormField
                control={form.control}
                name="conditions_suspension_bail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions suspension du bail</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conditions_remboursement_travaux"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions remboursement travaux</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Assurances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5" />
              Assurances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="attestation_assurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Attestation d'assurance</FormLabel>
                        <FormDescription>
                          Attestation d'assurance fournie
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

              <FormField
                control={form.control}
                name="nom_assureur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'assureur</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_police"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de police</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_expiration_assurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'expiration</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {typeContrat === 'variable' && (
              <div className="space-y-6">
                <Separator />
                <h4 className="text-lg font-medium">Assurances spécifiques contrat variable</h4>
                
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="assurance_pertes_exploitation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Assurance pertes d'exploitation</FormLabel>
                          <FormDescription>
                            Couverture des pertes d'exploitation
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

                  <FormField
                    control={form.control}
                    name="assurance_pertes_exploitation_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails assurance pertes d'exploitation</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assurance_occupation_illicite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Assurance occupation illicite</FormLabel>
                          <FormDescription>
                            Couverture contre l'occupation illicite
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

                  <FormField
                    control={form.control}
                    name="assurance_occupation_illicite_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails assurance occupation illicite</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protection_juridique"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Protection juridique</FormLabel>
                          <FormDescription>
                            Couverture de protection juridique
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

                  <FormField
                    control={form.control}
                    name="protection_juridique_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails protection juridique</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section: Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Documentation et annexes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="inventaire_meubles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventaire des meubles</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modele_etat_lieux"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle d'état des lieux</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reglement_copropriete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Règlement de copropriété</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Contact d'urgence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5" />
              Contact d'urgence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="contact_urgence_nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du contact</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_urgence_telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_urgence_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Juridique et administratif */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Juridique et administratif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duree_bail_initial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée du bail initial (mois)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="revision_loyer_irl"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Révision loyer IRL</FormLabel>
                        <FormDescription>
                          Révision selon l'Indice de Référence des Loyers
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
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="conditions_renouvellement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de renouvellement</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clauses_resiliation_anticipee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clauses de résiliation anticipée</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="obligations_entretien_reparations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obligations d'entretien et réparations</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Spécifique Want It Now */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5" />
              Spécifique à l'activité Want It Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type_activite_sous_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'activité de sous-location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="duree_contrat_1an"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Contrat d'1 an</FormLabel>
                        <FormDescription>
                          Durée standard d'un an
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
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="conditions_restitution_bien"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de restitution du bien</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedures_dommages_degradations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procédures dommages et dégradations</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conditions_utilisation_proprietaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions d'utilisation propriétaire</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodes_creuses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Périodes creuses</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Gestion et maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Gestion et maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="reparations_entretien_responsabilites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsabilités réparations et entretien</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gestion_sinistres_urgences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestion des sinistres et urgences</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedure_urgence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procédure d'urgence</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Notes internes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Notes internes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes_internes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes internes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4}
                      placeholder="Ajouter des notes internes pour ce contrat..."
                    />
                  </FormControl>
                  <FormDescription>
                    Notes internes visibles uniquement par l'équipe
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              isEdit ? 'Modifier le contrat' : 'Créer le contrat'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
