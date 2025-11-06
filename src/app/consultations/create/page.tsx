"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Upload, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Combobox } from '../../../components/ui/combobox'
import { CreateOrganisationModal } from '../../../components/business/create-organisation-modal'
import { useConsultations } from '@/shared/modules/consultations/hooks'
import { useOrganisations } from '@/shared/modules/organisations/hooks'
import { useToast } from '@/shared/modules/common/hooks'
import { getOrganisationDisplayName } from '../../../lib/utils/organisation-helpers'
import type { CreateConsultationData } from '@/shared/modules/consultations/hooks'
import { createConsultation as createConsultationAction } from '../../actions/consultations'
import { createClient } from '../../../lib/supabase/client'

// Interface pour le formulaire (utilise organisation_id pour le sélecteur)
interface ConsultationFormData {
  organisation_id: string
  client_email: string
  client_phone?: string
  descriptif: string
  image_url?: string
  tarif_maximum?: number
  priority_level: number
  source_channel: 'website' | 'email' | 'phone' | 'other'
  estimated_response_date?: string
}

export default function CreateConsultationPage() {
  const router = useRouter()
  const supabase = createClient()
  const { organisations, loading: loadingOrgs, refetch } = useOrganisations({
    type: 'customer',
    is_active: true
  })
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ConsultationFormData>({
    organisation_id: '',
    client_email: '',
    client_phone: '',
    descriptif: '',
    image_url: '',
    tarif_maximum: undefined,
    priority_level: 2,
    source_channel: 'website',
    estimated_response_date: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Options pour le Combobox
  const organisationOptions = organisations.map(org => ({
    value: org.id,
    label: getOrganisationDisplayName(org)
  }))

  const handleInputChange = (field: keyof ConsultationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handler pour la création d'organisation depuis le modal
  const handleOrganisationCreated = async (organisationId: string, organisationName: string) => {
    // Rafraîchir la liste des organisations
    await refetch()

    // Auto-sélectionner la nouvelle organisation
    setFormData(prev => ({ ...prev, organisation_id: organisationId }))

    toast({
      title: "✅ Client créé et sélectionné",
      description: `${organisationName} a été créé et sélectionné automatiquement.`
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.organisation_id.trim()) {
      newErrors.organisation_id = 'L\'organisation cliente est requise'
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = 'L\'email client est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Email invalide'
    }

    if (!formData.descriptif.trim()) {
      newErrors.descriptif = 'La description du projet est requise'
    }

    // Validation des champs optionnels
    if (formData.client_phone && formData.client_phone.trim() && !/^[+]?[\d\s\-()]{8,}$/.test(formData.client_phone)) {
      newErrors.client_phone = 'Numéro de téléphone invalide'
    }

    if (formData.tarif_maximum && formData.tarif_maximum < 0) {
      newErrors.tarif_maximum = 'Le budget doit être positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié')
      }

      // Récupérer le nom de l'organisation sélectionnée
      const selectedOrg = organisations.find(o => o.id === formData.organisation_id)
      if (!selectedOrg) {
        throw new Error('Organisation non trouvée')
      }
      const orgName = getOrganisationDisplayName(selectedOrg)

      // Préparer les données en supprimant les champs vides optionnels
      const dataToSubmit: CreateConsultationData = {
        organisation_name: orgName,  // ✅ FIX Bug #9: Utiliser organisation_name au lieu de organisation_id
        client_email: formData.client_email.trim(),
        descriptif: formData.descriptif.trim(),
        priority_level: formData.priority_level || 2,
        source_channel: formData.source_channel || 'website'
      }

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.client_phone?.trim()) {
        dataToSubmit.client_phone = formData.client_phone.trim()
      }

      if (formData.image_url?.trim()) {
        dataToSubmit.image_url = formData.image_url.trim()
      }

      if (formData.tarif_maximum && formData.tarif_maximum > 0) {
        dataToSubmit.tarif_maximum = formData.tarif_maximum
      }

      if (formData.estimated_response_date) {
        dataToSubmit.estimated_response_date = formData.estimated_response_date
      }

      // Appeler la Server Action qui bypass RLS
      const result = await createConsultationAction(dataToSubmit, user.id)

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création')
      }

      toast({
        title: "Consultation créée",
        description: `Nouvelle consultation pour ${orgName}`
      })
      router.push('/consultations')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la consultation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-black">Nouvelle Consultation</h1>
              <p className="text-gray-600 mt-1">
                Créer une nouvelle consultation client
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Informations de la consultation</span>
              </CardTitle>
              <CardDescription>
                Saisissez les détails de la demande client pour créer une nouvelle consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations client */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black">Informations Client</h3>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Sélection organisation client + Création */}
                    <div className="space-y-2">
                      <Label htmlFor="organisation_id">
                        Client Professionnel <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Combobox
                            options={organisationOptions}
                            value={formData.organisation_id}
                            onValueChange={(value) => handleInputChange('organisation_id', value)}
                            placeholder={loadingOrgs ? "Chargement..." : "Sélectionner un client..."}
                            searchPlaceholder="Rechercher un client..."
                            emptyMessage="Aucun client trouvé."
                            disabled={loadingOrgs}
                            className={errors.organisation_id ? 'border-red-500' : ''}
                          />
                        </div>
                        <CreateOrganisationModal
                          onOrganisationCreated={handleOrganisationCreated}
                          defaultType="customer"
                        />
                      </div>
                      {errors.organisation_id && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.organisation_id}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email">
                        Email client <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => handleInputChange('client_email', e.target.value)}
                        placeholder="contact@entreprise.com"
                        className={`border-black ${errors.client_email ? 'border-red-500' : ''}`}
                      />
                      {errors.client_email && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.client_email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_phone">Téléphone client</Label>
                    <Input
                      id="client_phone"
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className={`border-black ${errors.client_phone ? 'border-red-500' : ''}`}
                    />
                    {errors.client_phone && (
                      <p className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.client_phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description du projet */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black">Description du Projet</h3>

                  <div className="space-y-2">
                    <Label htmlFor="descriptif">
                      Description détaillée <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="descriptif"
                      value={formData.descriptif}
                      onChange={(e) => handleInputChange('descriptif', e.target.value)}
                      placeholder="Décrivez les besoins, le contexte et les attentes du client..."
                      rows={4}
                      className={`border-black resize-none ${errors.descriptif ? 'border-red-500' : ''}`}
                    />
                    {errors.descriptif && (
                      <p className="text-xs text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.descriptif}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">
                      <Upload className="h-4 w-4 inline mr-1" />
                      URL d'image (optionnel)
                    </Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="border-black"
                    />
                  </div>
                </div>

                {/* Paramètres de la consultation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black">Paramètres</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tarif_maximum">Budget maximum (€)</Label>
                      <Input
                        id="tarif_maximum"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.tarif_maximum || ''}
                        onChange={(e) => handleInputChange('tarif_maximum', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="10000"
                        className={`border-black ${errors.tarif_maximum ? 'border-red-500' : ''}`}
                      />
                      {errors.tarif_maximum && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.tarif_maximum}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority_level">Priorité</Label>
                      <Select
                        value={formData.priority_level?.toString()}
                        onValueChange={(value) => handleInputChange('priority_level', parseInt(value))}
                      >
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Basse</SelectItem>
                          <SelectItem value="2">Normale</SelectItem>
                          <SelectItem value="3">Élevée</SelectItem>
                          <SelectItem value="4">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source_channel">Canal d'origine</Label>
                      <Select
                        value={formData.source_channel}
                        onValueChange={(value) => handleInputChange('source_channel', value)}
                      >
                        <SelectTrigger className="border-black">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Site web</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Téléphone</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_response_date">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date de réponse estimée
                    </Label>
                    <Input
                      id="estimated_response_date"
                      type="date"
                      value={formData.estimated_response_date}
                      onChange={(e) => handleInputChange('estimated_response_date', e.target.value)}
                      className="border-black"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    )}
                    <Send className="h-4 w-4 mr-2" />
                    Créer la consultation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}