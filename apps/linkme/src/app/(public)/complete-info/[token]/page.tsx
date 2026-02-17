'use client';

/**
 * Public page: Complete missing information for a LinkMe order
 *
 * Accessible via unique token sent by email.
 * Shows ALL sections with existing data greyed out and missing fields editable.
 */

import { useState, useEffect, useCallback } from 'react';

import { useParams } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Package,
  Building2,
  FileText,
  Truck,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface RequestedField {
  key: string;
  label: string;
  category: string;
  inputType: 'text' | 'email' | 'tel' | 'date';
}

interface InfoRequestData {
  id: string;
  requestedFields: RequestedField[];
  customMessage: string | null;
  recipientName: string | null;
  recipientEmail: string;
  recipientType: string;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalTtc: number;
  organisationName: string | null;
}

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
// SECTION DEFINITIONS
// ============================================

interface SectionField {
  key: string;
  label: string;
  inputType: 'text' | 'email' | 'tel';
}

interface SectionDef {
  id: string;
  label: string;
  icon: typeof User;
  fields: SectionField[];
}

const SECTIONS: SectionDef[] = [
  {
    id: 'responsable',
    label: 'Responsable',
    icon: User,
    fields: [
      { key: 'requester_name', label: 'Nom', inputType: 'text' },
      { key: 'requester_email', label: 'Email', inputType: 'email' },
      {
        key: 'requester_phone',
        label: 'T\u00e9l\u00e9phone',
        inputType: 'tel',
      },
      { key: 'requester_position', label: 'Fonction', inputType: 'text' },
    ],
  },
  {
    id: 'billing',
    label: 'Facturation',
    icon: FileText,
    fields: [
      { key: 'billing_name', label: 'Nom', inputType: 'text' },
      { key: 'billing_email', label: 'Email', inputType: 'email' },
      { key: 'billing_phone', label: 'T\u00e9l\u00e9phone', inputType: 'tel' },
    ],
  },
  {
    id: 'delivery',
    label: 'Livraison',
    icon: Truck,
    fields: [
      { key: 'delivery_contact_name', label: 'Contact', inputType: 'text' },
      { key: 'delivery_contact_email', label: 'Email', inputType: 'email' },
      {
        key: 'delivery_contact_phone',
        label: 'T\u00e9l\u00e9phone',
        inputType: 'tel',
      },
      { key: 'delivery_address', label: 'Adresse', inputType: 'text' },
      { key: 'delivery_postal_code', label: 'Code postal', inputType: 'text' },
      { key: 'delivery_city', label: 'Ville', inputType: 'text' },
    ],
  },
  {
    id: 'organisation',
    label: 'Entreprise',
    icon: Building2,
    fields: [{ key: 'organisation_siret', label: 'SIRET', inputType: 'text' }],
  },
];

// ============================================
// HELPERS
// ============================================

function getFieldIcon(inputType: string) {
  switch (inputType) {
    case 'email':
      return Mail;
    case 'tel':
      return Phone;
    default:
      return User;
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
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

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
        setPageState({ type: 'invalid', message: 'Commande non trouv\u00e9e' });
        return;
      }

      // Build the set of requested field keys
      const requestedKeys = new Set(
        data.infoRequest.requestedFields.map(f => f.key)
      );

      // Initialize form values for missing requested fields only
      const initial: Record<string, string> = {};
      for (const field of data.infoRequest.requestedFields) {
        if (!data.existingData[field.key]) {
          initial[field.key] = '';
        }
      }
      setFormValues(initial);

      // Compute which sections are complete (collapse them)
      const collapsed: Record<string, boolean> = {};
      for (const section of SECTIONS) {
        const sectionRequestedFields = section.fields.filter(f =>
          requestedKeys.has(f.key)
        );
        const sectionHasExistingOnly = section.fields.some(
          f => data.existingData[f.key]
        );
        const hasMissingRequested = sectionRequestedFields.some(
          f => !data.existingData[f.key]
        );

        // Collapse if section has data but no missing requested fields
        collapsed[section.id] = sectionHasExistingOnly && !hasMissingRequested;
      }
      setCollapsedSections(collapsed);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pageState.type !== 'form') return;

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

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // ========== RENDER STATES ==========

  // Loading
  if (pageState.type === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (pageState.type === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-red-700">Lien invalide</CardTitle>
            <CardDescription>{pageState.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Expired
  if (pageState.type === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Clock className="h-16 w-16 text-orange-500" />
            </div>
            <CardTitle className="text-orange-700">Lien expir&#233;</CardTitle>
            <CardDescription>
              Ce lien n&apos;est plus valide. Veuillez contacter
              l&apos;&#233;quipe Verone pour obtenir un nouveau lien.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already completed
  if (pageState.type === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              Informations d&#233;j&#224; soumises
            </CardTitle>
            <CardDescription>
              Ces informations ont d&#233;j&#224; &#233;t&#233;
              compl&#233;t&#233;es
              {pageState.completedBy ? ` par ${pageState.completedBy}` : ''}.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Cancelled
  if (pageState.type === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              D&#233;j&#224; compl&#233;t&#233;
            </CardTitle>
            <CardDescription>
              Ces informations ont d&#233;j&#224; &#233;t&#233; fournies par
              quelqu&apos;un d&apos;autre. Aucune action n&apos;est
              n&#233;cessaire de votre part.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success
  if (pageState.type === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              Informations enregistr&#233;es
            </CardTitle>
            <CardDescription>
              Merci ! Vos informations ont &#233;t&#233; transmises &#224; notre
              &#233;quipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800">
                Votre commande va &#234;tre trait&#233;e dans les meilleurs
                d&#233;lais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== FORM STATE ==========
  const { infoRequest, order, existingData } = pageState;
  const requestedKeys = new Set(infoRequest.requestedFields.map(f => f.key));

  // Check if all requested missing fields are filled
  const allFieldsFilled = infoRequest.requestedFields
    .filter(f => !existingData[f.key])
    .every(f => formValues[f.key]?.trim());

  // Filter sections: only show sections that have at least one field with existing data or requested
  const visibleSections = SECTIONS.filter(section =>
    section.fields.some(f => existingData[f.key] || requestedKeys.has(f.key))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Informations compl&#233;mentaires
          </h1>
          <p className="text-gray-600 mt-1">Commande {order.orderNumber}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">
                R&#233;sum&#233; de la commande
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.organisationName && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Restaurant</span>
                </div>
                <span className="font-medium">{order.organisationName}</span>
              </div>
            )}
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
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-900">
                  Message de notre &#233;quipe
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

        {/* Form */}
        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[CompleteInfo] Submit failed:', error);
            });
          }}
        >
          {visibleSections.map(section => {
            const Icon = section.icon;
            const isCollapsed = collapsedSections[section.id] ?? false;

            // Determine section status
            const sectionRequestedFields = section.fields.filter(f =>
              requestedKeys.has(f.key)
            );
            const hasMissingRequested = sectionRequestedFields.some(
              f => !existingData[f.key]
            );
            const isComplete = !hasMissingRequested;

            return (
              <Card key={section.id} className="mb-4 overflow-hidden">
                {/* Clickable header */}
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => toggleSection(section.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-lg">
                          {section.label}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="h-3 w-3" />
                            Complet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <AlertTriangle className="h-3 w-3" />
                            &#192; compl&#233;ter
                          </span>
                        )}
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Collapsible content */}
                {!isCollapsed && (
                  <CardContent className="space-y-4 pt-0">
                    {section.fields.map(field => {
                      const existingValue = existingData[field.key];
                      const isRequested = requestedKeys.has(field.key);
                      const isMissing = !existingValue && isRequested;
                      const FieldIcon = getFieldIcon(field.inputType);

                      // Skip fields that have no data and are not requested
                      if (!existingValue && !isRequested) return null;

                      if (existingValue) {
                        // Read-only field with existing data
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="flex items-center gap-1 text-gray-500 text-sm">
                              <FieldIcon className="h-3.5 w-3.5" />
                              {field.label}
                            </Label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 text-sm">
                                {existingValue}
                              </div>
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      }

                      if (isMissing) {
                        // Editable field
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <Label
                              htmlFor={field.key}
                              className="flex items-center gap-1 text-orange-700 font-medium text-sm"
                            >
                              <FieldIcon className="h-3.5 w-3.5" />
                              {field.label} *
                            </Label>
                            <Input
                              id={field.key}
                              type={field.inputType}
                              value={formValues[field.key] ?? ''}
                              onChange={e =>
                                setFormValues(prev => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              required
                              className="border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                              placeholder={`Saisir ${field.label.toLowerCase()}`}
                            />
                          </div>
                        );
                      }

                      return null;
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !allFieldsFilled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer les informations'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
