'use client';

import { useState } from 'react';

import { ButtonUnified } from '@verone/ui';
import { ArrowLeft } from 'lucide-react';

import { useCreateConsultation } from './use-create-consultation';
import { StepIndicator } from './components/StepIndicator';
import { StepClient } from './components/StepClient';
import { StepDemande } from './components/StepDemande';
import { StepConfirmation } from './components/StepConfirmation';

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

  const canGoToStep2 =
    Boolean(formData.enseigne_id ?? formData.organisation_id) &&
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
              <p className="text-gray-600 mt-1">Etape {step} sur 3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <StepIndicator currentStep={step} />

          {step === 1 && (
            <StepClient
              formData={formData}
              errors={errors}
              contacts={contacts}
              selectedContactId={selectedContactId}
              canGoNext={canGoToStep2}
              onEnseigneChange={handleEnseigneChange}
              onOrganisationChange={handleOrganisationChange}
              onContactSelect={handleContactSelect}
              onInputChange={handleInputChange}
              onNext={goNext}
            />
          )}

          {step === 2 && (
            <StepDemande
              formData={formData}
              errors={errors}
              uploadedImages={uploadedImages}
              canGoNext={canGoToStep3}
              onInputChange={handleInputChange}
              onImageUploadSuccess={handleImageUploadSuccess}
              onRemoveImage={handleRemoveImage}
              onImageUploadError={(error: Error) => {
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
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {step === 3 && (
            <StepConfirmation
              formData={formData}
              uploadedImages={uploadedImages}
              loading={loading}
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
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
