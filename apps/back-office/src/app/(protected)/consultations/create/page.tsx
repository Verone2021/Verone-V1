'use client';

import Image from 'next/image';

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
import { ContactCardBO } from '@verone/orders';
import { ArrowLeft, Send, Calendar, AlertCircle, Users, X } from 'lucide-react';

import { useCreateConsultation, MAX_IMAGES } from './use-create-consultation';

export default function CreateConsultationPage() {
  const {
    loading,
    formData,
    errors,
    uploadedImages,
    selectedContactId,
    contacts,
    handleContactSelect,
    handleInputChange,
    handleImageUploadSuccess,
    handleRemoveImage,
    handleEnseigneChange,
    handleOrganisationChange,
    handleSubmit,
    handleNavigateBack,
    toast,
  } = useCreateConsultation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <ButtonUnified
              variant="ghost"
              onClick={handleNavigateBack}
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
                          <SelectItem value="5">Très urgent (5)</SelectItem>
                          <SelectItem value="4">Urgent (4)</SelectItem>
                          <SelectItem value="3">Normal+ (3)</SelectItem>
                          <SelectItem value="2">Normal (2)</SelectItem>
                          <SelectItem value="1">Faible (1)</SelectItem>
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
                    onClick={handleNavigateBack}
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
