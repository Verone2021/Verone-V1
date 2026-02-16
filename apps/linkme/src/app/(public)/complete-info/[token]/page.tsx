'use client';

/**
 * Page publique: Compléter les informations manquantes d'une commande LinkMe
 *
 * Accessible via token unique envoyé par email.
 * Rendu dynamique des champs basé sur requested_fields.
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
  Separator,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Building2,
  FileText,
  Truck,
  Loader2,
  Clock,
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
  | { type: 'form'; infoRequest: InfoRequestData; order: OrderSummary }
  | { type: 'success' };

// ============================================
// HELPERS
// ============================================

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof User }> = {
  responsable: { label: 'Responsable', icon: User },
  billing: { label: 'Facturation', icon: FileText },
  delivery: { label: 'Livraison', icon: Truck },
  organisation: { label: 'Entreprise', icon: Building2 },
};

function groupFieldsByCategory(fields: RequestedField[]) {
  const groups: Record<string, RequestedField[]> = {};
  for (const field of fields) {
    const cat = field.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(field);
  }
  return groups;
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
        setPageState({ type: 'invalid', message: 'Commande non trouvée' });
        return;
      }

      // Initialize form values
      const initial: Record<string, string> = {};
      for (const field of data.infoRequest.requestedFields) {
        initial[field.key] = '';
      }
      setFormValues(initial);

      setPageState({
        type: 'form',
        infoRequest: data.infoRequest,
        order: data.order,
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
            <CardTitle className="text-orange-700">Lien expiré</CardTitle>
            <CardDescription>
              Ce lien n&apos;est plus valide. Veuillez contacter l&apos;équipe
              Verone pour obtenir un nouveau lien.
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
              Informations déjà soumises
            </CardTitle>
            <CardDescription>
              Ces informations ont déjà été complétées
              {pageState.completedBy ? ` par ${pageState.completedBy}` : ''}.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Cancelled (completed by another person)
  if (pageState.type === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">Déjà complété</CardTitle>
            <CardDescription>
              Ces informations ont déjà été fournies par quelqu&apos;un
              d&apos;autre. Aucune action n&apos;est nécessaire de votre part.
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
              Informations enregistrées
            </CardTitle>
            <CardDescription>
              Merci ! Vos informations ont été transmises à notre équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800">
                Votre commande va être traitée dans les meilleurs délais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== FORM STATE ==========
  const { infoRequest, order } = pageState;
  const fieldGroups = groupFieldsByCategory(infoRequest.requestedFields);
  const allFieldsFilled = infoRequest.requestedFields.every(f =>
    formValues[f.key]?.trim()
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Informations complémentaires
          </h1>
          <p className="text-gray-600 mt-1">Commande {order.orderNumber}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Résumé de la commande</CardTitle>
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
                  Message de notre équipe
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
          {Object.entries(fieldGroups).map(([category, fields]) => {
            const config = CATEGORY_CONFIG[category] ?? {
              label: category,
              icon: FileText,
            };
            const Icon = config.icon;

            return (
              <Card key={category} className="mb-4">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label
                        htmlFor={field.key}
                        className="flex items-center gap-1"
                      >
                        {field.inputType === 'email' && (
                          <Mail className="h-4 w-4" />
                        )}
                        {field.inputType === 'tel' && (
                          <Phone className="h-4 w-4" />
                        )}
                        {field.inputType === 'date' && (
                          <Calendar className="h-4 w-4" />
                        )}
                        {field.inputType === 'text' && (
                          <User className="h-4 w-4" />
                        )}
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
                        min={
                          field.inputType === 'date'
                            ? new Date().toISOString().split('T')[0]
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Separator className="my-4" />

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
