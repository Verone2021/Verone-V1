'use client';

import { useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import type { CreateConsultationData } from '@verone/consultations';
import type { ContactBO } from '@verone/orders';
import {
  ContactCardBO,
  useEnseigneContactsBO,
  useOrganisationContactsBO,
} from '@verone/orders';
import { ClientOrEnseigneSelector } from '@verone/products';
import { ButtonUnified, ImageUploadZone } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import Image from 'next/image';
import { ArrowLeft, Send, Calendar, AlertCircle, Users, X } from 'lucide-react';

import { createConsultation as createConsultationAction } from '@/app/actions/consultations';

const MAX_IMAGES = 5;

interface UploadedImage {
  publicUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
}

// Interface pour le formulaire
interface ConsultationFormData {
  enseigne_id: string | null;
  organisation_id: string | null;
  client_email: string;
  client_phone?: string;
  descriptif: string;
  tarif_maximum?: number;
  priority_level: number;
  source_channel: 'website' | 'email' | 'phone' | 'other';
  estimated_response_date?: string;
}

export default function CreateConsultationPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState<ConsultationFormData>({
    enseigne_id: null,
    organisation_id: null,
    client_email: '',
    client_phone: '',
    descriptif: '',
    tarif_maximum: undefined,
    priority_level: 2,
    source_channel: 'website',
    estimated_response_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  // Fetch contacts when enseigne or organisation is selected
  const { data: enseigneContacts } = useEnseigneContactsBO(
    formData.enseigne_id
  );
  const { data: orgContacts } = useOrganisationContactsBO(
    formData.organisation_id
  );

  const contacts: ContactBO[] =
    enseigneContacts?.contacts ?? orgContacts?.contacts ?? [];

  const handleContactSelect = useCallback(
    (contact: ContactBO) => {
      if (selectedContactId === contact.id) {
        // Deselect
        setSelectedContactId(null);
        setFormData(prev => ({
          ...prev,
          client_email: '',
          client_phone: '',
        }));
      } else {
        // Select and pre-fill
        setSelectedContactId(contact.id);
        setFormData(prev => ({
          ...prev,
          client_email: contact.email,
          client_phone: contact.phone ?? contact.mobile ?? '',
        }));
        // Clear email/phone errors
        setErrors(prev => ({
          ...prev,
          client_email: '',
          client_phone: '',
        }));
      }
    },
    [selectedContactId]
  );

  const handleInputChange = (
    field: keyof ConsultationFormData,
    value: ConsultationFormData[keyof ConsultationFormData]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handlers images multi-upload
  const handleImageUploadSuccess = useCallback(
    (
      publicUrl: string,
      fileName: string,
      storagePath?: string,
      fileSize?: number
    ) => {
      setUploadedImages(prev => [
        ...prev,
        {
          publicUrl,
          fileName,
          storagePath: storagePath ?? '',
          fileSize: fileSize ?? 0,
        },
      ]);
    },
    []
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const imageToRemove = uploadedImages[index];
      // Supprimer du storage Supabase
      if (imageToRemove?.storagePath) {
        void supabase.storage
          .from('product-images')
          .remove([imageToRemove.storagePath])
          .catch((err: unknown) => {
            console.error(
              '[CreateConsultation] Failed to delete image from storage:',
              err
            );
          });
      }
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    },
    [uploadedImages, supabase.storage]
  );

  // Handlers pour ClientOrEnseigneSelector
  const handleEnseigneChange = (
    enseigneId: string | null,
    _enseigneName: string | null,
    _parentOrgId: string | null
  ) => {
    setFormData(prev => ({
      ...prev,
      enseigne_id: enseigneId,
      client_email: '',
      client_phone: '',
    }));
    // Reset contact selection when client changes
    setSelectedContactId(null);
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const handleOrganisationChange = (
    organisationId: string | null,
    _organisationName: string | null
  ) => {
    setFormData(prev => ({
      ...prev,
      organisation_id: organisationId,
      client_email: '',
      client_phone: '',
    }));
    // Reset contact selection when client changes
    setSelectedContactId(null);
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required: au moins enseigne_id OU organisation_id
    if (!formData.enseigne_id && !formData.organisation_id) {
      newErrors.client =
        'Veuillez sélectionner une enseigne ou une organisation';
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = "L'email client est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Email invalide';
    }

    if (!formData.descriptif.trim()) {
      newErrors.descriptif = 'La description du projet est requise';
    }

    // Validation des champs optionnels
    if (
      formData.client_phone?.trim() &&
      !/^[+]?[\d\s\-()]{8,}$/.test(formData.client_phone)
    ) {
      newErrors.client_phone = 'Numéro de téléphone invalide';
    }

    if (formData.tarif_maximum && formData.tarif_maximum < 0) {
      newErrors.tarif_maximum = 'Le budget doit être positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Récupérer l'utilisateur courant
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      // Préparer les données avec enseigne_id et/ou organisation_id
      const dataToSubmit: CreateConsultationData = {
        enseigne_id: formData.enseigne_id ?? undefined,
        organisation_id: formData.organisation_id ?? undefined,
        client_email: formData.client_email.trim(),
        descriptif: formData.descriptif.trim(),
        priority_level: formData.priority_level ?? 2,
        source_channel: formData.source_channel ?? 'website',
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.client_phone?.trim()) {
        dataToSubmit.client_phone = formData.client_phone.trim();
      }

      // Ajouter les images uploadées
      if (uploadedImages.length > 0) {
        dataToSubmit.image_url = uploadedImages[0]?.publicUrl;
        dataToSubmit.images = uploadedImages;
      }

      if (formData.tarif_maximum && formData.tarif_maximum > 0) {
        dataToSubmit.tarif_maximum = formData.tarif_maximum;
      }

      if (formData.estimated_response_date) {
        dataToSubmit.estimated_response_date = formData.estimated_response_date;
      }

      // Appeler la Server Action qui bypass RLS
      const result = await createConsultationAction(dataToSubmit, user.id);

      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création');
      }

      toast({
        title: 'Consultation créée',
        description: 'La consultation a été créée avec succès',
      });
      router.push('/consultations');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de créer la consultation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <ButtonUnified
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </ButtonUnified>
            <div>
              <h1 className="text-3xl font-bold text-black">
                Nouvelle Consultation
              </h1>
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
                Saisissez les détails de la demande client pour créer une
                nouvelle consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  void handleSubmit(e).catch((submitError: unknown) => {
                    console.error(
                      '[CreateConsultationPage] Submit failed:',
                      submitError
                    );
                    toast({
                      title: 'Erreur',
                      description:
                        submitError instanceof Error
                          ? submitError.message
                          : "Une erreur inattendue s'est produite",
                      variant: 'destructive',
                    });
                  });
                }}
                className="space-y-6"
              >
                {/* Informations client */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-black">
                    Informations Client
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Sélection enseigne ou organisation */}
                    <div className="space-y-2">
                      <ClientOrEnseigneSelector
                        enseigneId={formData.enseigne_id}
                        organisationId={formData.organisation_id}
                        onEnseigneChange={handleEnseigneChange}
                        onOrganisationChange={handleOrganisationChange}
                        label="Client (enseigne ou organisation)"
                        required
                        className={errors.client ? 'border-red-500' : ''}
                      />
                      {errors.client && (
                        <p className="text-xs text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.client}
                        </p>
                      )}
                    </div>

                    {/* Contacts list when enseigne/org selected */}
                    {contacts.length > 0 && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          Contacts existants
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {contacts.map(contact => (
                            <ContactCardBO
                              key={contact.id}
                              contact={contact}
                              isSelected={selectedContactId === contact.id}
                              onClick={() => handleContactSelect(contact)}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cliquez sur un contact pour pré-remplir email et
                          téléphone
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="client_email">
                        Email client <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={e =>
                          handleInputChange('client_email', e.target.value)
                        }
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
                      onChange={e =>
                        handleInputChange('client_phone', e.target.value)
                      }
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
                  <h3 className="text-lg font-medium text-black">
                    Description du Projet
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="descriptif">
                      Description détaillée{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="descriptif"
                      value={formData.descriptif}
                      onChange={e =>
                        handleInputChange('descriptif', e.target.value)
                      }
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

                  {/* Images uploadées */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>
                        Images ajoutées ({uploadedImages.length}/{MAX_IMAGES})
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {uploadedImages.map((img, index) => (
                          <div
                            key={img.publicUrl}
                            className="relative group rounded-lg border border-green-200 bg-green-50 overflow-hidden"
                          >
                            <div className="relative aspect-square">
                              <Image
                                src={img.publicUrl}
                                alt={img.fileName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <p className="text-xs text-gray-600 truncate px-2 py-1">
                              {img.fileName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone upload (visible tant que < MAX_IMAGES) */}
                  {uploadedImages.length < MAX_IMAGES && (
                    <ImageUploadZone
                      key={`upload-zone-${uploadedImages.length}`}
                      bucket="product-images"
                      folder="consultations"
                      onUploadSuccess={handleImageUploadSuccess}
                      onUploadError={(error: Error) => {
                        console.error(
                          '[CreateConsultation] Image upload failed:',
                          error
                        );
                        toast({
                          title: 'Erreur upload',
                          description: error.message,
                          variant: 'destructive',
                        });
                      }}
                      label={
                        uploadedImages.length === 0
                          ? 'Images (optionnel, max 5)'
                          : 'Ajouter une image'
                      }
                      helperText="Glissez-déposez une image du projet ou cliquez pour sélectionner"
                      acceptedFormats={{
                        'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
                      }}
                    />
                  )}
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
                        value={formData.tarif_maximum ?? ''}
                        onChange={e =>
                          handleInputChange(
                            'tarif_maximum',
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
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
                        onValueChange={value =>
                          handleInputChange('priority_level', parseInt(value))
                        }
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
                        onValueChange={value =>
                          handleInputChange('source_channel', value)
                        }
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
                      onChange={e =>
                        handleInputChange(
                          'estimated_response_date',
                          e.target.value
                        )
                      }
                      className="border-black"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <ButtonUnified
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Annuler
                  </ButtonUnified>
                  <ButtonUnified
                    type="submit"
                    disabled={loading}
                    variant="success"
                    loading={loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Créer la consultation
                  </ButtonUnified>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
