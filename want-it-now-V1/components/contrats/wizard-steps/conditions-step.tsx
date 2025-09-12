'use client'

import { useEffect } from 'react'
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
  Euro, 
  ChevronRight, 
  ChevronLeft,
  Calculator,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react'

import { ContratWizardFormData } from '@/lib/validations/contrats-wizard'

interface ConditionsStepProps {
  form: UseFormReturn<ContratWizardFormData>
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function ConditionsStep({ form, onNext, onPrev, isFirst, isLast }: ConditionsStepProps) {
  const watchedTypeContrat = form.watch('type_contrat')
  const watchedCommission = form.watch('commission_pourcentage')
  const watchedUsageJours = form.watch('usage_proprietaire_jours_max')
  const watchedLoyerMensuel = form.watch('loyer_mensuel_ht')
  const watchedCharges = form.watch('charges_mensuelles')

  // Auto-set commission for variable contracts (business rule: 10%)
  useEffect(() => {
    if (watchedTypeContrat === 'variable') {
      form.setValue('commission_pourcentage', '10')
    }
  }, [watchedTypeContrat, form])

  // Calculate total monthly rent
  const calculateTotalRent = () => {
    const loyer = parseFloat(watchedLoyerMensuel || '0')
    const charges = parseFloat(watchedCharges || '0')
    return loyer + charges
  }

  // Calculate commission amount for variable contracts
  const calculateCommissionAmount = () => {
    if (watchedTypeContrat === 'variable') {
      // For variable contracts, commission is on estimated monthly revenue
      const estimation = parseFloat(form.watch('estimation_revenus_mensuels') || '0')
      return estimation * 0.1 // 10% commission
    } else {
      // For fixed contracts, commission is negotiable percentage
      const loyer = parseFloat(watchedLoyerMensuel || '0')
      const commission = parseFloat(watchedCommission || '0')
      return loyer * (commission / 100)
    }
  }

  const totalRent = calculateTotalRent()
  const commissionAmount = calculateCommissionAmount()

  return (
    <div className="space-y-6">
      {/* En-tête étape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4841A] rounded-lg flex items-center justify-center">
              <Euro className="w-4 h-4 text-white" />
            </div>
            Conditions Financières
          </CardTitle>
          <CardDescription>
            Définissez les modalités de paiement et commissions selon le type de contrat
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Business Rules Alerts */}
      <div className="space-y-3">
        {watchedTypeContrat === 'variable' && (
          <Alert className="border-[#D4841A]/20 bg-[#D4841A]/5">
            <TrendingUp className="h-4 w-4 text-[#D4841A]" />
            <AlertDescription className="text-[#D4841A]">
              <strong>Contrat Variable :</strong> Commission fixe de 10% sur revenus variables.
              Cette règle est obligatoire pour Want It Now.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Règle Want It Now :</strong> L'usage propriétaire est limité à 
            <strong> maximum 60 jours par an</strong> pour tous les contrats.
          </AlertDescription>
        </Alert>
      </div>

      {/* Conditions communes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#D4841A]" />
            Conditions Générales
          </CardTitle>
          <CardDescription>
            Applicables à tous types de contrats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="commission_pourcentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      step="0.1"
                      placeholder="10"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      readOnly={watchedTypeContrat === 'variable'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchedTypeContrat === 'variable' 
                      ? 'Fixé à 10% pour les contrats variables' 
                      : 'Commission négociable pour contrats fixes'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usage_proprietaire_jours_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usage propriétaire max (jours/an) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      placeholder="60"
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 60 jours par an (règle Want It Now)
                  </FormDescription>
                  <FormMessage />
                  {watchedUsageJours && parseInt(watchedUsageJours) > 60 && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ Ne peut pas dépasser 60 jours par an
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Calcul commission */}
          {commissionAmount > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-800">Commission calculée</h4>
              </div>
              <p className="text-green-700">
                <strong>{commissionAmount.toFixed(2)}€</strong> 
                {watchedTypeContrat === 'variable' 
                  ? ' par mois sur revenus estimés'
                  : ' par mois sur loyer hors charges'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditions spécifiques selon type de contrat */}
      {watchedTypeContrat === 'fixe' ? (
        /* Contrat Fixe */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#2D5A27]" />
              Conditions Contrat Fixe
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Loyers fixes
              </Badge>
            </CardTitle>
            <CardDescription>
              Loyer mensuel fixe avec charges et conditions de paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loyer_mensuel_ht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyer mensuel HT (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1500.00"
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
                name="charges_mensuelles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charges mensuelles (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="150.00"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Charges locatives récupérables
                    </FormDescription>
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
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="5"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Jour du mois pour le paiement
                    </FormDescription>
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
                        min="0"
                        step="0.01"
                        placeholder="1500.00"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Généralement 1-2 mois de loyer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total calculé */}
            {totalRent > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Total mensuel</h4>
                </div>
                <p className="text-blue-700">
                  Loyer + charges = <strong>{totalRent.toFixed(2)}€ TTC</strong>
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="charges_inclus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détail charges incluses</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Eau, électricité, internet, chauffage..."
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Listez les charges incluses dans le loyer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plafond_depannages_urgents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plafond dépannages urgents (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="500.00"
                          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Montant max sans accord préalable
                      </FormDescription>
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
                        <Input
                          type="number"
                          min="1"
                          max="90"
                          placeholder="30"
                          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Délai de règlement des factures
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : watchedTypeContrat === 'variable' ? (
        /* Contrat Variable */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4841A]" />
              Conditions Contrat Variable
              <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
                10% Commission
              </Badge>
            </CardTitle>
            <CardDescription>
              Revenus variables avec commission fixe de 10%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimation_revenus_mensuels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimation revenus mensuels (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="2000.00"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Base de calcul pour la commission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dates_paiement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence paiements</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mensuel le 5 du mois"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Périodicité des règlements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="methode_calcul_revenus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode de calcul des revenus</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                        <SelectValue placeholder="Choisir la méthode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="revenus_nets">Revenus nets après charges</SelectItem>
                      <SelectItem value="revenus_bruts">Revenus bruts</SelectItem>
                      <SelectItem value="revenus_effectifs">Revenus effectivement perçus</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Base de calcul pour la commission de 10%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Frais et équipements</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frais_abonnement_internet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais internet/wifi (€/mois)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="50.00"
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
                  name="frais_equipements_domotique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais domotique (€/mois)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="25.00"
                          className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Équipements connectés, serrures...
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="catalogue_equipements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catalogue équipements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Liste des équipements mis à disposition (mobilier, électroménager, high-tech...)"
                        className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Détail des équipements fournis
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Navigation supprimée - utilisation des boutons flottants globaux */}
    </div>
  )
}