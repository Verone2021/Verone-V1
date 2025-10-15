"use client"

import { useState } from 'react'
import { Plus, Building2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useOrganisations, type CreateOrganisationData } from '@/hooks/use-organisations'
import { useToast } from '@/hooks/use-toast'

interface CreateOrganisationModalProps {
  onOrganisationCreated?: (organisationId: string, organisationName: string) => void
  trigger?: React.ReactNode
  defaultType?: 'supplier' | 'customer' | 'partner' | 'internal'
  buttonLabel?: string
}

export function CreateOrganisationModal({
  onOrganisationCreated,
  trigger,
  defaultType = 'customer',
  buttonLabel
}: CreateOrganisationModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateOrganisationData>>({
    type: defaultType,
    is_active: true,
    has_different_shipping_address: false,
    customer_type: 'professional',
    prepayment_required: false
  })

  const { createOrganisation, loading } = useOrganisations()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation champs obligatoires
    if (!formData.name || !formData.type) {
      toast({
        title: "Erreur de validation",
        description: "Le nom et le type sont obligatoires.",
        variant: "destructive"
      })
      return
    }

    try {
      const newOrganisation = await createOrganisation(formData as CreateOrganisationData)

      toast({
        title: "✅ Organisation créée",
        description: `${formData.name} a été créée avec succès.`
      })

      // Callback avec l'ID et le nom de l'organisation
      if (onOrganisationCreated && newOrganisation) {
        onOrganisationCreated(newOrganisation.id, newOrganisation.name)
      }

      // Reset form et fermer modal
      setFormData({
        type: defaultType,
        is_active: true,
        has_different_shipping_address: false,
        customer_type: 'professional',
        prepayment_required: false
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: "❌ Erreur création organisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      })
    }
  }

  const handleInputChange = (field: keyof CreateOrganisationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Label par défaut basé sur le type
  const getDefaultLabel = () => {
    if (buttonLabel) return buttonLabel
    switch (defaultType) {
      case 'supplier':
        return 'Nouveau fournisseur'
      case 'customer':
        return 'Nouveau client'
      case 'partner':
        return 'Nouveau partenaire'
      case 'internal':
        return 'Nouvelle organisation interne'
      default:
        return 'Nouvelle organisation'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <ButtonV2 variant="outline" size="sm" className="border-black">
            <Plus className="h-4 w-4 mr-2" />
            {getDefaultLabel()}
          </ButtonV2>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Créer une nouvelle organisation
          </DialogTitle>
          <DialogDescription>
            Remplissez les champs obligatoires (*) et les informations complémentaires si disponibles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="addresses">Adresses</TabsTrigger>
              <TabsTrigger value="legal">Juridique</TabsTrigger>
              <TabsTrigger value="commercial">Commercial</TabsTrigger>
            </TabsList>

            {/* TAB 1: Informations générales */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Nom (obligatoire) */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nom de l'organisation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Entreprise SARL"
                      className="border-black"
                      required
                    />
                  </div>

                  {/* Type (obligatoire) */}
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger className="border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Client</SelectItem>
                        <SelectItem value="supplier">Fournisseur</SelectItem>
                        <SelectItem value="partner">Partenaire</SelectItem>
                        <SelectItem value="internal">Interne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email principal</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@entreprise.fr"
                      className="border-black"
                    />
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="border-black"
                    />
                  </div>

                  {/* Site web */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.entreprise.fr"
                      className="border-black"
                    />
                  </div>

                  {/* Pays */}
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="France"
                      className="border-black"
                    />
                  </div>

                  {/* Actif */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Organisation active
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Adresses */}
            <TabsContent value="addresses" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-sm">Adresse de facturation</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="billing_address_line1">Adresse ligne 1</Label>
                      <Input
                        id="billing_address_line1"
                        value={formData.billing_address_line1 || ''}
                        onChange={(e) => handleInputChange('billing_address_line1', e.target.value)}
                        placeholder="12 rue de la Paix"
                        className="border-black"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="billing_address_line2">Adresse ligne 2</Label>
                      <Input
                        id="billing_address_line2"
                        value={formData.billing_address_line2 || ''}
                        onChange={(e) => handleInputChange('billing_address_line2', e.target.value)}
                        placeholder="Bâtiment A, 3ème étage"
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_postal_code">Code postal</Label>
                      <Input
                        id="billing_postal_code"
                        value={formData.billing_postal_code || ''}
                        onChange={(e) => handleInputChange('billing_postal_code', e.target.value)}
                        placeholder="75001"
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_city">Ville</Label>
                      <Input
                        id="billing_city"
                        value={formData.billing_city || ''}
                        onChange={(e) => handleInputChange('billing_city', e.target.value)}
                        placeholder="Paris"
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_region">Région</Label>
                      <Input
                        id="billing_region"
                        value={formData.billing_region || ''}
                        onChange={(e) => handleInputChange('billing_region', e.target.value)}
                        placeholder="Île-de-France"
                        className="border-black"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_country">Pays</Label>
                      <Input
                        id="billing_country"
                        value={formData.billing_country || ''}
                        onChange={(e) => handleInputChange('billing_country', e.target.value)}
                        placeholder="France"
                        className="border-black"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox
                      id="has_different_shipping_address"
                      checked={formData.has_different_shipping_address}
                      onCheckedChange={(checked) => handleInputChange('has_different_shipping_address', checked)}
                    />
                    <Label htmlFor="has_different_shipping_address" className="cursor-pointer">
                      Adresse de livraison différente
                    </Label>
                  </div>

                  {formData.has_different_shipping_address && (
                    <>
                      <h3 className="font-semibold text-sm pt-4">Adresse de livraison</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="shipping_address_line1">Adresse ligne 1</Label>
                          <Input
                            id="shipping_address_line1"
                            value={formData.shipping_address_line1 || ''}
                            onChange={(e) => handleInputChange('shipping_address_line1', e.target.value)}
                            placeholder="15 avenue des Champs"
                            className="border-black"
                          />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="shipping_address_line2">Adresse ligne 2</Label>
                          <Input
                            id="shipping_address_line2"
                            value={formData.shipping_address_line2 || ''}
                            onChange={(e) => handleInputChange('shipping_address_line2', e.target.value)}
                            placeholder="Entrepôt B"
                            className="border-black"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shipping_postal_code">Code postal</Label>
                          <Input
                            id="shipping_postal_code"
                            value={formData.shipping_postal_code || ''}
                            onChange={(e) => handleInputChange('shipping_postal_code', e.target.value)}
                            placeholder="75008"
                            className="border-black"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shipping_city">Ville</Label>
                          <Input
                            id="shipping_city"
                            value={formData.shipping_city || ''}
                            onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                            placeholder="Paris"
                            className="border-black"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shipping_region">Région</Label>
                          <Input
                            id="shipping_region"
                            value={formData.shipping_region || ''}
                            onChange={(e) => handleInputChange('shipping_region', e.target.value)}
                            placeholder="Île-de-France"
                            className="border-black"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shipping_country">Pays</Label>
                          <Input
                            id="shipping_country"
                            value={formData.shipping_country || ''}
                            onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                            placeholder="France"
                            className="border-black"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Informations juridiques */}
            <TabsContent value="legal" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      value={formData.siret || ''}
                      onChange={(e) => handleInputChange('siret', e.target.value)}
                      placeholder="123 456 789 00012"
                      className="border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vat_number">Numéro TVA</Label>
                    <Input
                      id="vat_number"
                      value={formData.vat_number || ''}
                      onChange={(e) => handleInputChange('vat_number', e.target.value)}
                      placeholder="FR12345678901"
                      className="border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_form">Forme juridique</Label>
                    <Input
                      id="legal_form"
                      value={formData.legal_form || ''}
                      onChange={(e) => handleInputChange('legal_form', e.target.value)}
                      placeholder="SARL, SAS, SA..."
                      className="border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry_sector">Secteur d'activité</Label>
                    <Input
                      id="industry_sector"
                      value={formData.industry_sector || ''}
                      onChange={(e) => handleInputChange('industry_sector', e.target.value)}
                      placeholder="Décoration, Mobilier..."
                      className="border-black"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Informations commerciales */}
            <TabsContent value="commercial" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Conditions de paiement</Label>
                    <Input
                      id="payment_terms"
                      value={formData.payment_terms || ''}
                      onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                      placeholder="30 jours fin de mois"
                      className="border-black"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prepayment_required"
                      checked={formData.prepayment_required}
                      onCheckedChange={(checked) => handleInputChange('prepayment_required', checked)}
                    />
                    <Label htmlFor="prepayment_required" className="cursor-pointer">
                      Acompte requis
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes internes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Informations complémentaires..."
                      className="border-black min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 pt-4">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              className="bg-black hover:bg-gray-800 text-white"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer l\'organisation'}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
