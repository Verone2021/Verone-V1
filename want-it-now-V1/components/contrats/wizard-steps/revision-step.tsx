'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  ChevronLeft,
  FileText,
  AlertTriangle,
  Info,
  Eye,
  Save,
  Send,
  Building,
  Euro,
  Shield,
  Settings,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'

import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'

interface RevisionStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
}

export function RevisionStep({ 
  form, 
  onNext, 
  onPrev, 
  isFirst, 
  isLast, 
  onSubmit, 
  isSubmitting 
}: RevisionStepProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  const formValues = form.getValues()

  // Validation summary
  const validationSummary = {
    selection: !!(formValues.propriete_id || formValues.unite_id),
    informations: !!(formValues.type_contrat && formValues.date_debut && formValues.date_fin),
    conditions: !!(formValues.commission_pourcentage && formValues.usage_proprietaire_jours_max),
    assurances: !!(formValues.attestation_assurance && formValues.nom_assureur),
    clauses: !!(formValues.type_activite_sous_location && formValues.contact_urgence_nom),
    documentation: true // Always valid for final step
  }

  const isFormValid = Object.values(validationSummary).every(Boolean)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseigné'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const calculateDuration = () => {
    if (formValues.date_debut && formValues.date_fin) {
      const debut = new Date(formValues.date_debut)
      const fin = new Date(formValues.date_fin)
      const diffTime = Math.abs(fin.getTime() - debut.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 0
  }

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            Révision & Finalisation du Contrat
          </CardTitle>
          <CardDescription>
            Vérifiez toutes les informations avant la création définitive du contrat
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Status validation */}
      <Card className={`border-2 ${isFormValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <CardTitle className={`text-lg flex items-center gap-2 ${isFormValid ? 'text-green-800' : 'text-yellow-800'}`}>
            {isFormValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            État de Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(validationSummary).map(([key, isValid]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm capitalize ${isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {key === 'selection' ? 'Sélection' :
                   key === 'informations' ? 'Informations' :
                   key === 'conditions' ? 'Conditions' :
                   key === 'assurances' ? 'Assurances' :
                   key === 'clauses' ? 'Clauses' : 'Documentation'} {isValid ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
          
          {!isFormValid && (
            <Alert className="border-yellow-200 bg-yellow-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                Veuillez compléter toutes les sections obligatoires avant de finaliser le contrat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Résumé détaillé */}
      <div className="space-y-4">
        {/* Section 1: Sélection */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('selection')}>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#D4841A]" />
                Propriété / Unité Sélectionnée
              </div>
              <Eye className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          {expandedSection === 'selection' && (
            <CardContent className="space-y-3">
              {formValues.unite_id ? (
                <div>
                  <Badge className="bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20">
                    Unité sélectionnée
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    Contrat lié à une unité spécifique
                  </p>
                </div>
              ) : formValues.propriete_id ? (
                <div>
                  <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
                    Propriété sélectionnée
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    Contrat lié à la propriété entière
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-600">Aucune sélection</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Adresse :</span>
                  <p className="text-gray-600">{formValues.bien_adresse_complete || 'Non renseignée'}</p>
                </div>
                <div>
                  <span className="font-medium">Type :</span>
                  <p className="text-gray-600">{formValues.bien_type || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium">Superficie :</span>
                  <p className="text-gray-600">
                    {formValues.bien_superficie ? `${formValues.bien_superficie}m²` : 'Non renseignée'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Pièces :</span>
                  <p className="text-gray-600">{formValues.bien_nombre_pieces || 'Non renseigné'}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 2: Informations générales */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('informations')}>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4841A]" />
                Informations du Contrat
              </div>
              <Eye className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          {expandedSection === 'informations' && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type de contrat :</span>
                  <div className="mt-1">
                    <Badge className={`${
                      formValues.type_contrat === 'fixe' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20'
                    }`}>
                      {formValues.type_contrat === 'fixe' ? 'Contrat Fixe' : 'Contrat Variable (10%)'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Durée :</span>
                  <p className="text-gray-600">
                    {calculateDuration() > 0 ? `${calculateDuration()} jours` : 'Non calculée'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Date début :</span>
                  <p className="text-gray-600">{formatDate(formValues.date_debut)}</p>
                </div>
                <div>
                  <span className="font-medium">Date fin :</span>
                  <p className="text-gray-600">{formatDate(formValues.date_fin)}</p>
                </div>
                <div>
                  <span className="font-medium">Meublé :</span>
                  <p className="text-gray-600">{formValues.meuble ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <span className="font-medium">Sous-location autorisée :</span>
                  <div className="flex items-center gap-2">
                    <p className={`${formValues.autorisation_sous_location ? 'text-green-600' : 'text-red-600'}`}>
                      {formValues.autorisation_sous_location ? 'Oui ✓' : 'Non ✗'}
                    </p>
                    {formValues.autorisation_sous_location && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Obligatoire Want It Now
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations Bailleur</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nom :</span>
                    <p className="text-gray-600">{formValues.bailleur_nom || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email :</span>
                    <p className="text-gray-600">{formValues.bailleur_email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Téléphone :</span>
                    <p className="text-gray-600">{formValues.bailleur_telephone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <span className="font-medium">SIREN/SIRET :</span>
                    <p className="text-gray-600">{formValues.bailleur_siren_siret || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 3: Conditions financières */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('conditions')}>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 text-[#D4841A]" />
                Conditions Financières
              </div>
              <Eye className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          {expandedSection === 'conditions' && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Commission :</span>
                  <p className="text-gray-600">
                    {formValues.commission_pourcentage}%
                    {formValues.type_contrat === 'variable' && (
                      <Badge className="ml-2 bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20 text-xs">
                        Fixe 10%
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Usage propriétaire max :</span>
                  <p className="text-gray-600">
                    {formValues.usage_proprietaire_jours_max} jours/an
                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      Max 60j
                    </Badge>
                  </p>
                </div>

                {formValues.type_contrat === 'fixe' && (
                  <>
                    <div>
                      <span className="font-medium">Loyer mensuel HT :</span>
                      <p className="text-gray-600">{formValues.loyer_mensuel_ht || 'Non renseigné'}€</p>
                    </div>
                    <div>
                      <span className="font-medium">Charges mensuelles :</span>
                      <p className="text-gray-600">{formValues.charges_mensuelles || 'Non renseigné'}€</p>
                    </div>
                    <div>
                      <span className="font-medium">Dépôt de garantie :</span>
                      <p className="text-gray-600">{formValues.depot_garantie || 'Non renseigné'}€</p>
                    </div>
                  </>
                )}

                {formValues.type_contrat === 'variable' && (
                  <>
                    <div>
                      <span className="font-medium">Revenus estimés :</span>
                      <p className="text-gray-600">{formValues.estimation_revenus_mensuels || 'Non renseigné'}€/mois</p>
                    </div>
                    <div>
                      <span className="font-medium">Méthode calcul :</span>
                      <p className="text-gray-600">{formValues.methode_calcul_revenus || 'Non renseignée'}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 4: Contact d'urgence */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('contact')}>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                Contact d'Urgence
              </div>
              <Eye className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          {expandedSection === 'contact' && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nom :</span>
                  <p className="text-gray-600">{formValues.contact_urgence_nom || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium">Téléphone :</span>
                  <p className="text-gray-600">{formValues.contact_urgence_telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="font-medium">Email :</span>
                  <p className="text-gray-600">{formValues.contact_urgence_email || 'Non renseigné'}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Documentation et notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Documentation & Notes Internes
          </CardTitle>
          <CardDescription>
            Documents annexes et remarques pour le suivi du contrat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="inventaire_meubles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventaire mobilier</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="inventaire-mobilier.pdf"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Référence document inventaire
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modele_etat_lieux"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modèle état des lieux</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="etat-lieux-type.pdf"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Template état des lieux
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reglement_copropriete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Règlement copropriété</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="reglement-copro.pdf"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Si applicable
                  </FormDescription>
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
                  <Textarea
                    placeholder="Remarques particulières, points d'attention, historique des échanges..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Ces notes ne seront visibles que par l'équipe Want It Now
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Business rules final check */}
      <Alert className="border-[#D4841A]/20 bg-[#D4841A]/5">
        <CheckCircle2 className="h-4 w-4 text-[#D4841A]" />
        <AlertDescription className="text-[#D4841A]">
          <strong>Vérification finale des règles Want It Now :</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>✓ Autorisation sous-location obligatoire activée</li>
            <li>✓ Usage propriétaire limité à 60 jours maximum par an</li>
            {formValues.type_contrat === 'variable' && (
              <li>✓ Commission variable fixée à 10%</li>
            )}
            <li>✓ Contact d'urgence renseigné pour gestion incidents</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Actions finales */}
      <div className="flex justify-end items-center pt-6 border-t">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // Save as draft
              form.setValue('draft', true)
              onSubmit()
            }}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4" />
            Sauvegarder brouillon
          </Button>
          
          <Button
            type="button"
            onClick={() => {
              form.setValue('draft', false)
              onSubmit()
            }}
            disabled={!isFormValid || isSubmitting}
            className="bg-[#2D5A27] hover:bg-[#1F3F1C] text-white flex items-center gap-2"
          >
            {isSubmitting ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? 'Création...' : 'Créer le contrat'}
          </Button>
        </div>
      </div>
    </div>
  )
}