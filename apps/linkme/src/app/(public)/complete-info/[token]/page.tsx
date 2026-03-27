'use client';

/**
 * Public page: Complete missing information for a LinkMe order
 *
 * Wizard-based form accessible via unique token sent by email.
 * Each section (responsable, facturation, livraison, entreprise) is one step.
 * Steps already complete are skipped. AddressAutocomplete for addresses.
 */

import { useState, useEffect, useCallback } from 'react';

import { useParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Package, Building2, Mail, User, FileText, Truck } from 'lucide-react';

import type {
  RequestedField,
  InfoRequestData,
  OrderSummary,
  WizardStepConfig,
} from './components/types';
import { WizardHeader } from './components/WizardHeader';
import { WizardFooter } from './components/WizardFooter';
import { StepResponsable } from './components/StepResponsable';
import { StepFacturation } from './components/StepFacturation';
import { StepLivraison } from './components/StepLivraison';
import { StepEntreprise } from './components/StepEntreprise';
import {
  LoadingScreen,
  InvalidScreen,
  ExpiredScreen,
  CompletedScreen,
  CancelledScreen,
  SuccessScreen,
} from './components/StatusScreens';

// ============================================
// TYPES
// ============================================

interface ApiResponse {
  infoRequest: InfoRequestData;
  order: OrderSummary | null;
  existingData: Record<string, string | null>;
  error?: string;
  code?: string;
  completedByEmail?: string;
}

type PageState =
  | { type: 'loading' }
  | { type: 'invalid'; message: string }
  | { type: 'expired' }
  | { type: 'completed'; completedBy?: string }
  | { type: 'cancelled' }
  | {
      type: 'form';
      infoRequest: InfoRequestData;
      order: OrderSummary;
      existingData: Record<string, string | null>;
    }
  | { type: 'success' };

// ============================================
// STEP DEFINITIONS
// ============================================

const STEP_DEFS = [
  { id: 'responsable', label: 'Responsable', icon: User },
  { id: 'billing', label: 'Facturation', icon: FileText },
  { id: 'delivery', label: 'Livraison', icon: Truck },
  { id: 'organisation', label: 'Entreprise', icon: Building2 },
] as const;

/** Map section field keys to their human labels */
const FIELD_LABELS: Record<string, string> = {
  requester_name: 'Nom',
  requester_email: 'Email',
  requester_phone: 'Telephone',
  requester_position: 'Fonction',
  billing_name: 'Nom',
  billing_email: 'Email',
  billing_phone: 'Telephone',
  delivery_contact_name: 'Contact',
  delivery_contact_email: 'Email',
  delivery_contact_phone: 'Telephone',
  delivery_address: 'Adresse',
  delivery_postal_code: 'Code postal',
  delivery_city: 'Ville',
  mall_email: 'Email centre commercial',
  organisation_siret: 'SIRET',
  organisation_vat_number: 'N° TVA intracommunautaire',
  organisation_legal_name: 'Raison sociale',
  organisation_billing_address: 'Adresse de facturation',
  organisation_billing_postal_code: 'Code postal facturation',
  organisation_billing_city: 'Ville facturation',
};

// ============================================
// HELPERS
// ============================================

function computeWizardSteps(
  requestedFields: RequestedField[],
  existingData: Record<string, string | null>
): WizardStepConfig[] {
  const steps: WizardStepConfig[] = [];

  for (const def of STEP_DEFS) {
    const stepRequestedFields = requestedFields.filter(
      f => f.category === def.id
    );

    if (stepRequestedFields.length === 0) continue;

    const missingFields = stepRequestedFields.filter(f => !existingData[f.key]);
    const existingFields = stepRequestedFields
      .filter(f => existingData[f.key])
      .map(f => ({
        key: f.key,
        label: FIELD_LABELS[f.key] ?? f.label,
        value: existingData[f.key]!,
      }));

    steps.push({
      id: def.id,
      label: def.label,
      icon: def.icon,
      missingFields,
      existingFields,
      hasFieldsToFill: missingFields.length > 0,
    });
  }

  return steps;
}

function isStepValid(
  step: WizardStepConfig,
  formValues: Record<string, string>
): boolean {
  return step.missingFields.every(f => formValues[f.key]?.trim());
}

// ============================================
// STEP RENDERER
// ============================================

function renderStep(
  step: WizardStepConfig,
  formValues: Record<string, string>,
  onFieldChange: (key: string, value: string) => void
) {
  const props = { step, formValues, onFieldChange };
  switch (step.id) {
    case 'responsable':
      return <StepResponsable {...props} />;
    case 'billing':
      return <StepFacturation {...props} />;
    case 'delivery':
      return <StepLivraison {...props} />;
    case 'organisation':
      return <StepEntreprise {...props} />;
    default:
      return null;
  }
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function CompleteInfoPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>({ type: 'loading' });
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Wizard state
  const [wizardSteps, setWizardSteps] = useState<WizardStepConfig[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Fetch and validate token
  const validateToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/complete-info/${token}`);
      const data: ApiResponse = (await res.json()) as ApiResponse;

      if (!res.ok) {
        if (data.code === 'EXPIRED') {
          setPageState({ type: 'expired' });
        } else if (data.code === 'ALREADY_COMPLETED') {
          setPageState({
            type: 'completed',
            completedBy: data.completedByEmail,
          });
        } else if (data.code === 'CANCELLED') {
          setPageState({ type: 'cancelled' });
        } else {
          setPageState({
            type: 'invalid',
            message: data.error ?? 'Lien invalide',
          });
        }
        return;
      }

      if (!data.order) {
        setPageState({ type: 'invalid', message: 'Commande non trouvee' });
        return;
      }

      // Compute wizard steps
      const steps = computeWizardSteps(
        data.infoRequest.requestedFields,
        data.existingData
      );
      setWizardSteps(steps);

      // Initialize form values for missing fields
      const initial: Record<string, string> = {};
      for (const step of steps) {
        for (const field of step.missingFields) {
          initial[field.key] = '';
        }
      }
      setFormValues(initial);

      // Start at first step that has missing fields
      const firstIncompleteIdx = steps.findIndex(s => s.hasFieldsToFill);
      setCurrentStepIndex(firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0);

      // Mark steps without missing fields as already completed
      const preCompleted = new Set<string>();
      for (const step of steps) {
        if (!step.hasFieldsToFill) {
          preCompleted.add(step.id);
        }
      }
      setCompletedSteps(preCompleted);

      setPageState({
        type: 'form',
        infoRequest: data.infoRequest,
        order: data.order,
        existingData: data.existingData,
      });
    } catch (err) {
      console.error('[CompleteInfo] Validation error:', err);
      setPageState({ type: 'invalid', message: 'Erreur de connexion' });
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void validateToken();
    }
  }, [token, validateToken]);

  // Navigation
  const handleNext = () => {
    const currentStep = wizardSteps[currentStepIndex];
    if (!currentStep) return;

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));

    // Find next step with missing fields (or just go to next)
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < wizardSteps.length) {
      setCurrentStepIndex(nextIdx);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  // Submit
  const handleSubmit = async () => {
    if (pageState.type !== 'form') return;

    // Mark last step as completed
    const lastStep = wizardSteps[currentStepIndex];
    if (lastStep) {
      setCompletedSteps(prev => new Set([...prev, lastStep.id]));
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/complete-info/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: formValues,
          submitterEmail: pageState.infoRequest.recipientEmail,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Erreur lors de la soumission');
      }

      setPageState({ type: 'success' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erreur lors de la soumission'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== RENDER STATES ==========
  if (pageState.type === 'loading') return <LoadingScreen />;
  if (pageState.type === 'invalid')
    return <InvalidScreen message={pageState.message} />;
  if (pageState.type === 'expired') return <ExpiredScreen />;
  if (pageState.type === 'completed')
    return <CompletedScreen completedBy={pageState.completedBy} />;
  if (pageState.type === 'cancelled') return <CancelledScreen />;
  if (pageState.type === 'success') return <SuccessScreen />;

  // ========== FORM STATE ==========
  const { infoRequest, order } = pageState;
  const currentStep = wizardSteps[currentStepIndex];
  const isLastStep = currentStepIndex === wizardSteps.length - 1;
  const canProceed = currentStep ? isStepValid(currentStep, formValues) : false;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Informations complementaires
          </h1>
          <p className="text-gray-600 mt-1">Commande {order.orderNumber}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Resume de la commande</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC</span>
              <span className="text-green-600">
                {formatCurrency(order.totalTtc)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Custom message from admin */}
        {infoRequest.customMessage && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-900">
                  Message de notre equipe
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 whitespace-pre-wrap">
                {infoRequest.customMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wizard */}
        {wizardSteps.length > 0 && currentStep && (
          <Card>
            <CardHeader className="pb-4">
              <WizardHeader
                steps={wizardSteps}
                currentStepIndex={currentStepIndex}
                completedSteps={completedSteps}
              />
            </CardHeader>

            <CardContent>
              {/* Step title */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <currentStep.icon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">{currentStep.label}</h2>
              </div>

              {/* Step content */}
              {renderStep(currentStep, formValues, handleFieldChange)}

              {/* Error */}
              {submitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              {/* Footer */}
              <WizardFooter
                currentStepIndex={currentStepIndex}
                totalSteps={wizardSteps.length}
                isLastStep={isLastStep}
                isSubmitting={isSubmitting}
                canProceed={canProceed}
                onBack={handleBack}
                onNext={handleNext}
                onSubmit={() => {
                  void handleSubmit().catch(error => {
                    console.error('[CompleteInfo] Submit failed:', error);
                  });
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
