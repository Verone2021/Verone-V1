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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Home,
  Scale
} from 'lucide-react'

import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'

interface AssurancesStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function AssurancesStep({ form, onNext, onPrev, isFirst, isLast }: AssurancesStepProps) {
  const watchedAttestationAssurance = form.watch('attestation_assurance')
  const watchedAssurancePertesExploitation = form.watch('assurance_pertes_exploitation')
  const watchedAssuranceOccupationIllicite = form.watch('assurance_occupation_illicite')
  const watchedProtectionJuridique = form.watch('protection_juridique')

  // Check if insurance form is complete
  const isInsuranceComplete = watchedAttestationAssurance && 
                             form.watch('nom_assureur') && 
                             form.watch('numero_police')

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Assurances & Protection Juridique
          </CardTitle>
          <CardDescription>
            Définissez les couvertures d'assurance et protections juridiques requises pour le contrat
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Réglementation française */}
      <Alert className="border-blue-200 bg-blue-50">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Réglementation française :</strong> Le bailleur doit souscrire une assurance PNO 
          (Propriétaire Non Occupant) couvrant les risques locatifs et sa responsabilité civile. 
          Les assurances complémentaires sont fortement recommandées pour la sous-location.
        </AlertDescription>
      </Alert>

      {/* Assurance principale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="w-5 h-5 text-[#D4841A]" />
            Assurance Propriétaire Non Occupant (PNO)
          </CardTitle>
          <CardDescription>
            Assurance obligatoire pour tout propriétaire bailleur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="attestation_assurance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Attestation d'assurance PNO
                  </FormLabel>
                  <FormDescription>
                    Je dispose d'une assurance PNO en cours de validité
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

          {watchedAttestationAssurance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <FormField
                control={form.control}
                name="nom_assureur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'assureur *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AXA, Allianz, MMA..."
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
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
                    <FormLabel>Numéro de police *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Numéro du contrat d'assurance"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
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
                      <Input
                        type="date"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Date de fin de couverture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {!watchedAttestationAssurance && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Attention :</strong> L'assurance PNO est obligatoire pour tous les bailleurs. 
                Sans cette couverture, vous ne pouvez pas mettre votre bien en location.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Assurances complémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#2D5A27]" />
            Assurances Complémentaires
          </CardTitle>
          <CardDescription>
            Protections recommandées pour la sous-location et gestion locative
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assurance pertes d'exploitation */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="assurance_pertes_exploitation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Assurance Pertes d'Exploitation
                    </FormLabel>
                    <FormDescription>
                      Couvre les pertes de revenus locatifs en cas de sinistre
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

            {watchedAssurancePertesExploitation && (
              <FormField
                control={form.control}
                name="assurance_pertes_exploitation_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détails couverture pertes d'exploitation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Plafond de garantie, durée de couverture, franchises..."
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Précisez les modalités de cette couverture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator />

          {/* Assurance occupation illicite */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="assurance_occupation_illicite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Assurance Occupation Illicite
                    </FormLabel>
                    <FormDescription>
                      Couvre les risques liés aux occupants sans titre ou indésirables
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

            {watchedAssuranceOccupationIllicite && (
              <FormField
                control={form.control}
                name="assurance_occupation_illicite_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détails couverture occupation illicite</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Prise en charge procédures d'expulsion, dégradations, pertes de loyers..."
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Précisez ce qui est couvert par cette assurance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Protection juridique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600" />
            Protection Juridique
          </CardTitle>
          <CardDescription>
            Assistance juridique pour les litiges locatifs et contentieux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="protection_juridique"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Protection Juridique Immobilière
                  </FormLabel>
                  <FormDescription>
                    Prise en charge des frais juridiques et accompagnement juridique
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

          {watchedProtectionJuridique && (
            <FormField
              control={form.control}
              name="protection_juridique_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Détails protection juridique</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Plafond de prise en charge, types de litiges couverts, cabinet d'avocats partenaire..."
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Précisez les modalités de cette protection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedProtectionJuridique && (
            <Alert className="border-purple-200 bg-purple-50">
              <Scale className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Conseil :</strong> La protection juridique est particulièrement recommandée 
                pour la sous-location, qui peut générer des situations complexes avec les 
                sous-locataires et les plateformes de réservation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Résumé des couvertures */}
      <Card className={`border-2 ${isInsuranceComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg flex items-center gap-2 ${isInsuranceComplete ? 'text-green-800' : 'text-gray-800'}`}>
            {isInsuranceComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Shield className="w-5 h-5 text-gray-600" />
            )}
            Résumé des Couvertures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchedAttestationAssurance ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${watchedAttestationAssurance ? 'text-green-800' : 'text-gray-600'}`}>
                  Assurance PNO {watchedAttestationAssurance ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchedAssurancePertesExploitation ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${watchedAssurancePertesExploitation ? 'text-green-800' : 'text-gray-600'}`}>
                  Pertes d'exploitation {watchedAssurancePertesExploitation ? '✓' : '✗'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchedAssuranceOccupationIllicite ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${watchedAssuranceOccupationIllicite ? 'text-green-800' : 'text-gray-600'}`}>
                  Occupation illicite {watchedAssuranceOccupationIllicite ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchedProtectionJuridique ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`text-sm ${watchedProtectionJuridique ? 'text-green-800' : 'text-gray-600'}`}>
                  Protection juridique {watchedProtectionJuridique ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {!isInsuranceComplete && (
            <Alert className="border-yellow-200 bg-yellow-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700">
                <strong>Attention :</strong> L'assurance PNO avec les informations de l'assureur 
                est obligatoire pour finaliser le contrat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation supprimée - utilisation des boutons flottants globaux */}
    </div>
  )
}