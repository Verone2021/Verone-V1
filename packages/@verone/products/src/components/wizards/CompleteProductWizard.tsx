'use client';

import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import { GeneralInfoSection } from '@verone/products/components/wizards/sections/GeneralInfoSection';
import { ImagesSection } from '@verone/products/components/wizards/sections/ImagesSection';
import { PricingSection } from '@verone/products/components/wizards/sections/PricingSection';
import { StockSection } from '@verone/products/components/wizards/sections/StockSection';
import { SupplierSection } from '@verone/products/components/wizards/sections/SupplierSection';
import { TechnicalSection } from '@verone/products/components/wizards/sections/TechnicalSection';

import { WIZARD_SECTIONS } from './complete-product/types';
import { useCompleteProductWizard } from './complete-product/useCompleteProductWizard';
import { WizardProgressCard } from './complete-product/WizardProgressCard';
import { WizardNavigationCard } from './complete-product/WizardNavigationCard';

export type { WizardFormData } from './complete-product/types';

interface CompleteProductWizardProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  editMode?: boolean;
  draftId?: string;
}

export function CompleteProductWizard({
  onSuccess,
  onCancel,
  editMode = false,
  draftId,
}: CompleteProductWizardProps) {
  const {
    currentSection,
    setCurrentSection,
    formData,
    setFormData,
    selectedImages,
    setSelectedImages,
    isLoading,
    isSaving,
    draftIdState,
    progress,
    saveDraft,
    finalizeDraft,
    nextSection,
    prevSection,
  } = useCompleteProductWizard({ editMode, draftId, onSuccess });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du brouillon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardProgressCard
        editMode={editMode}
        progress={progress}
        isSaving={isSaving}
      />

      <Tabs value={WIZARD_SECTIONS[currentSection].id} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {WIZARD_SECTIONS.map((section, index) => {
            const Icon = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                onClick={() => setCurrentSection(index)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="general">
          <GeneralInfoSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="supplier">
          <SupplierSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="technical">
          <TechnicalSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="images">
          <ImagesSection
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            formData={formData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="stock">
          <StockSection
            formData={formData}
            setFormData={setFormData}
            onSave={() => {
              void saveDraft().catch(() => undefined);
            }}
          />
        </TabsContent>
      </Tabs>

      <WizardNavigationCard
        currentSection={currentSection}
        progress={progress}
        isLoading={isLoading}
        isSaving={isSaving}
        draftIdState={draftIdState}
        onPrev={prevSection}
        onNext={nextSection}
        onSave={() => {
          void saveDraft().catch(() => undefined);
        }}
        onCancel={onCancel}
        onFinalize={() => {
          void finalizeDraft().catch(() => undefined);
        }}
      />
    </div>
  );
}
