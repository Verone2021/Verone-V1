'use client'

import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Home,
  Calendar,
  Wrench,
  Star
} from 'lucide-react'

import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'

interface ClausesStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function ClausesStep({ form, onNext, onPrev, isFirst, isLast }: ClausesStepProps) {
  const watchedAutorisationTravaux = form.watch('autorisation_travaux')
  const watchedRevisionLoyer = form.watch('revision_loyer_irl')
  const watchedDureeContrat1An = form.watch('duree_contrat_1an')

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Clauses Spécifiques & Règles Métier
          </CardTitle>
          <CardDescription>
            Définissez les conditions particulières, règles Want It Now et contacts d'urgence
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Règles Want It Now */}
      <Alert className="border-[#D4841A]/20 bg-[#D4841A]/5">
        <Star className="h-4 w-4 text-[#D4841A]" />
        <AlertDescription className="text-[#D4841A]">
          <strong>Spécificités Want It Now :</strong> Ces clauses sont spécifiquement adaptées 
          à la gestion de sous-location courte durée via notre plateforme.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sous-location et activités */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5 text-[#D4841A]" />
              Sous-location & Activités Autorisées
            </CardTitle>
            <CardDescription>
              Règles spécifiques pour la sous-location Want It Now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <FormField
              control={form.control}
              name="conditions_sous_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions spécifiques sous-location</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Durée minimum de séjour, nombre max d'occupants, périodes interdites..."
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Précisez les règles spécifiques à respecter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activites_permises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activités permises dans le logement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hébergement touristique, télétravail, réunions de travail, événements privés..."
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Listez les activités autorisées et interdites
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Usage propriétaire et périodes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2D5A27]" />
              Usage Propriétaire & Périodes
            </CardTitle>
            <CardDescription>
              Conditions d'utilisation du propriétaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="conditions_utilisation_proprietaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions utilisation propriétaire</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Préavis requis, périodes préférentielles, nombre max de jours consécutifs..."
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Règles pour l'usage du propriétaire (max 60j/an)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="periodes_creuses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Périodes creuses identifiées</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Janvier-février, novembre, mi-semaines hors vacances scolaires..."
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Périodes de faible demande locative
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duree_contrat_1an"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Contrat d'1 an minimum
                    </FormLabel>
                    <FormDescription>
                      Durée minimale recommandée pour amortir les frais
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
          </CardContent>
        </Card>
      </div>

      {/* Clauses juridiques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Clauses Juridiques & Administratives
          </CardTitle>
          <CardDescription>
            Conditions générales, bail et résiliation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duree_bail_initial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durée bail initial (mois)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="12"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Durée initiale du bail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revision_loyer_irl"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Révision loyer IRL
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Indexation sur l'indice de référence
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
            name="conditions_renouvellement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conditions de renouvellement</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tacite reconduction, préavis de non-renouvellement, révision des conditions..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Modalités de renouvellement du bail
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clauses_resiliation_anticipee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clauses résiliation anticipée</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Préavis requis, conditions particulières, indemnités..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Conditions de résiliation avant terme
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Travaux et entretien */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Travaux & Entretien
          </CardTitle>
          <CardDescription>
            Autorisations de travaux et responsabilités d'entretien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="autorisation_travaux"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Autorisation travaux d'amélioration
                  </FormLabel>
                  <FormDescription>
                    Le gestionnaire peut réaliser des travaux d'amélioration
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
            name="conditions_remboursement_travaux"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conditions remboursement travaux</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Seuil d'autorisation, modalités de remboursement, plus-value en fin de contrat..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Comment sont remboursés les travaux effectués
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="obligations_entretien_reparations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Répartition entretien & réparations</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Entretien courant : locataire/gestionnaire. Gros œuvre : propriétaire. Vétusté : propriétaire..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Qui est responsable de quoi en matière d'entretien
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Contact d'urgence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="w-5 h-5 text-red-600" />
            Contact d'Urgence
          </CardTitle>
          <CardDescription>
            Personne à contacter en cas d'urgence ou de problème
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Important :</strong> Le contact d'urgence est obligatoire pour gérer 
              les situations critiques (dégâts des eaux, pannes, incidents avec locataires...).
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contact_urgence_nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom contact d'urgence *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean Dupont"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nom de la personne à contacter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_urgence_telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone urgence *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Numéro joignable 24h/24
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contact_urgence_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email contact urgence</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="urgence@exemple.fr"
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Email pour notifications urgentes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Gestion des sinistres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Gestion Sinistres & Urgences
          </CardTitle>
          <CardDescription>
            Procédures en cas d'incident ou sinistre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="gestion_sinistres_urgences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procédure gestion des sinistres</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Qui contacter en premier, démarches assurance, gestion des locataires impactés..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Étapes à suivre en cas de sinistre
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="procedures_dommages_degradations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procédure dommages & dégradations</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Constats, photos, déclaration assurance, réparations d'urgence..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Que faire en cas de dommages causés par des locataires
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conditions_restitution_bien"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conditions restitution du bien</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="État de restitution requis, travaux à prévoir, délai de restitution..."
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Dans quel état doit être rendu le bien en fin de contrat
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Navigation supprimée - utilisation des boutons flottants globaux */}
    </div>
  )
}