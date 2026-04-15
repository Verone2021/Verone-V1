'use client';

import { useState } from 'react';

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
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Calendar,
  AlertCircle,
  Users,
  X,
  Check,
  User,
  FileText,
  Eye,
} from 'lucide-react';

import { useCreateConsultation, MAX_IMAGES } from './use-create-consultation';

const STEPS = [
  { id: 1, label: 'Client', icon: User },
  { id: 2, label: 'Demande', icon: FileText },
  { id: 3, label: 'Confirmation', icon: Eye },
] as const;

export default function CreateConsultationPage() {
  const [step, setStep] = useState(1);

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

  // Validation par étape
  const canGoToStep2 =
    (formData.enseigne_id || formData.organisation_id) &&
    formData.client_email.includes('@');

  const canGoToStep3 = canGoToStep2 && formData.descriptif.trim().length >= 3;

  const goNext = () => {
    if (step === 1 && !canGoToStep2) return;
    if (step === 2 && !canGoToStep3) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

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
              <p className="text-gray-600 mt-1">Étape {step} sur 3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between px-4">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : isCurrent
                            ? 'bg-black border-black text-white'
                            : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium ${
                        isCurrent
                          ? 'text-black'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 mt-[-16px] ${
                        step > s.id ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Client */}
          {step === 1 && (
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informations Client</span>
                </CardTitle>
                <CardDescription>
                  Sélectionnez le client et ses coordonnées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <ClientOrEnseigneSelector
                    enseigneId={formData.enseigne_id}
                    organisationId={formData.organisation_id}
                    onEnseigneChange={handleEnseigneChange}
                    onOrganisationChange={handleOrganisationChange}
                    label="Client (enseigne ou organisation) *"
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
                      Cliquez sur un contact pour pré-remplir email et téléphone
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
                    className={errors.client_email ? 'border-red-500' : ''}
                  />
                  {errors.client_email && (
                    <p className="text-xs text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.client_email}
                    </p>
                  )}
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
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <ButtonUnified onClick={goNext} disabled={!canGoToStep2}>
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </ButtonUnified>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Demande */}
          {step === 2 && (
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Description de la demande</span>
                </CardTitle>
                <CardDescription>
                  Décrivez le besoin du client et les paramètres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    rows={5}
                    className={errors.descriptif ? 'border-red-500' : ''}
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
                    helperText="Glissez-déposez une image ou cliquez pour sélectionner"
                    acceptedFormats={{
                      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
                    }}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select
                      value={formData.priority_level?.toString()}
                      onValueChange={value =>
                        handleInputChange('priority_level', parseInt(value))
                      }
                    >
                      <SelectTrigger>
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
                    <Label>Canal d&apos;origine</Label>
                    <Select
                      value={formData.source_channel}
                      onValueChange={value =>
                        handleInputChange('source_channel', value)
                      }
                    >
                      <SelectTrigger>
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
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes_internes">Notes internes</Label>
                  <Textarea
                    id="notes_internes"
                    value={formData.notes_internes ?? ''}
                    onChange={e =>
                      handleInputChange('notes_internes', e.target.value)
                    }
                    placeholder="Notes visibles uniquement par l'équipe..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <ButtonUnified variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </ButtonUnified>
                  <ButtonUnified onClick={goNext} disabled={!canGoToStep3}>
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </ButtonUnified>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Récapitulatif</span>
                </CardTitle>
                <CardDescription>
                  Vérifiez les informations avant de créer la consultation
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
                  className="space-y-4"
                >
                  {/* Recap Client */}
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">
                      Client
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Email :</span>{' '}
                        <span className="font-medium">
                          {formData.client_email}
                        </span>
                      </div>
                      {formData.client_phone && (
                        <div>
                          <span className="text-gray-500">Tél :</span>{' '}
                          <span className="font-medium">
                            {formData.client_phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recap Demande */}
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider">
                      Demande
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {formData.descriptif}
                    </p>
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {uploadedImages.map(img => (
                          <div
                            key={img.publicUrl}
                            className="relative w-16 h-16 rounded overflow-hidden border"
                          >
                            <Image
                              src={img.publicUrl}
                              alt={img.fileName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recap Paramètres */}
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-2">
                      Paramètres
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {formData.tarif_maximum && (
                        <div>
                          <span className="text-gray-500">Budget :</span>{' '}
                          <span className="font-medium">
                            {formData.tarif_maximum}€
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Priorité :</span>{' '}
                        <span className="font-medium">
                          {formData.priority_level}/5
                        </span>
                      </div>
                      {formData.source_channel && (
                        <div>
                          <span className="text-gray-500">Canal :</span>{' '}
                          <span className="font-medium">
                            {formData.source_channel}
                          </span>
                        </div>
                      )}
                      {formData.estimated_response_date && (
                        <div>
                          <span className="text-gray-500">Réponse :</span>{' '}
                          <span className="font-medium">
                            {formData.estimated_response_date}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <ButtonUnified
                      variant="outline"
                      onClick={goBack}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Modifier
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
          )}
        </div>
      </div>
    </div>
  );
}
