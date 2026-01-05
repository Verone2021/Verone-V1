'use client';

/**
 * Page: Étape 4 - Informations de livraison (Post-approbation)
 *
 * Accessible via token unique envoyé par email après approbation.
 * Permet au contact propriétaire de compléter:
 * - Contact réception sur place
 * - Date de livraison confirmée
 * - Rappel CMR
 */

import { useState, useEffect } from 'react';

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
  Badge,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  FileText,
  Building2,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OrderWithDetails {
  id: string;
  order_number: string;
  total_ttc: number;
  status: string;
  expected_delivery_date: string | null;
  organisation: {
    trade_name: string | null;
    legal_name: string;
  } | null;
  linkmeDetails: {
    id: string;
    requester_name: string;
    requester_email: string;
    desired_delivery_date: string | null;
    step4_completed_at: string | null;
    reception_contact_name: string | null;
    reception_contact_email: string | null;
    reception_contact_phone: string | null;
    confirmed_delivery_date: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    } | null;
  }>;
}

interface TokenValidation {
  valid: boolean;
  expired: boolean;
  alreadyCompleted: boolean;
  order: OrderWithDetails | null;
  error?: string;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function DeliveryInfoPage() {
  const params = useParams();
  const token = params.token as string;

  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [receptionName, setReceptionName] = useState('');
  const [receptionEmail, setReceptionEmail] = useState('');
  const [receptionPhone, setReceptionPhone] = useState('');
  const [confirmedDate, setConfirmedDate] = useState('');

  // Validate token and fetch order
  useEffect(() => {
    async function validateToken() {
      setIsLoading(true);

      const supabase = createClient();

      try {
        // Find the linkme details with this token
        const { data: detailsData, error: detailsError } = await supabase
          .from('sales_order_linkme_details')
          .select(
            `
            id,
            sales_order_id,
            requester_name,
            requester_email,
            desired_delivery_date,
            step4_token_expires_at,
            step4_completed_at,
            reception_contact_name,
            reception_contact_email,
            reception_contact_phone,
            confirmed_delivery_date
          `
          )
          .eq('step4_token', token)
          .single();

        if (detailsError || !detailsData) {
          setValidation({
            valid: false,
            expired: false,
            alreadyCompleted: false,
            order: null,
            error: 'Lien invalide ou expiré',
          });
          return;
        }

        // Check if expired
        if (detailsData.step4_token_expires_at) {
          const expiresAt = new Date(detailsData.step4_token_expires_at);
          if (expiresAt < new Date()) {
            setValidation({
              valid: false,
              expired: true,
              alreadyCompleted: false,
              order: null,
              error: 'Ce lien a expiré',
            });
            return;
          }
        }

        // Check if already completed
        if (detailsData.step4_completed_at) {
          // Still show the order but mark as completed
          const { data: orderData } = await supabase
            .from('sales_orders')
            .select(
              `
              id,
              order_number,
              total_ttc,
              status,
              expected_delivery_date,
              organisations!sales_orders_customer_id_fkey (
                trade_name,
                legal_name
              ),
              sales_order_items (
                id,
                quantity,
                products (name)
              )
            `
            )
            .eq('id', detailsData.sales_order_id)
            .single();

          setValidation({
            valid: false,
            expired: false,
            alreadyCompleted: true,
            order: orderData
              ? {
                  id: orderData.id,
                  order_number: orderData.order_number,
                  total_ttc: orderData.total_ttc,
                  status: orderData.status,
                  expected_delivery_date: orderData.expected_delivery_date,
                  organisation: orderData.organisations as any,
                  linkmeDetails: detailsData as any,
                  items: (orderData.sales_order_items || []).map(
                    (item: any) => ({
                      id: item.id,
                      quantity: item.quantity,
                      product: item.products,
                    })
                  ),
                }
              : null,
          });
          return;
        }

        // Fetch full order details
        const { data: orderData, error: orderError } = await supabase
          .from('sales_orders')
          .select(
            `
            id,
            order_number,
            total_ttc,
            status,
            expected_delivery_date,
            organisations!sales_orders_customer_id_fkey (
              trade_name,
              legal_name
            ),
            sales_order_items (
              id,
              quantity,
              products (name)
            )
          `
          )
          .eq('id', detailsData.sales_order_id)
          .single();

        if (orderError || !orderData) {
          setValidation({
            valid: false,
            expired: false,
            alreadyCompleted: false,
            order: null,
            error: 'Commande non trouvée',
          });
          return;
        }

        // Pre-fill form if data exists
        if (detailsData.reception_contact_name) {
          setReceptionName(detailsData.reception_contact_name);
        }
        if (detailsData.reception_contact_email) {
          setReceptionEmail(detailsData.reception_contact_email);
        }
        if (detailsData.reception_contact_phone) {
          setReceptionPhone(detailsData.reception_contact_phone);
        }
        if (detailsData.confirmed_delivery_date) {
          setConfirmedDate(detailsData.confirmed_delivery_date);
        } else if (detailsData.desired_delivery_date) {
          setConfirmedDate(detailsData.desired_delivery_date);
        }

        setValidation({
          valid: true,
          expired: false,
          alreadyCompleted: false,
          order: {
            id: orderData.id,
            order_number: orderData.order_number,
            total_ttc: orderData.total_ttc,
            status: orderData.status,
            expected_delivery_date: orderData.expected_delivery_date,
            organisation: orderData.organisations as any,
            linkmeDetails: detailsData as any,
            items: (orderData.sales_order_items || []).map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              product: item.products,
            })),
          },
        });
      } catch (err) {
        console.error('Error validating token:', err);
        setValidation({
          valid: false,
          expired: false,
          alreadyCompleted: false,
          order: null,
          error: 'Erreur de validation',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation?.order) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('sales_order_linkme_details')
        .update({
          reception_contact_name: receptionName,
          reception_contact_email: receptionEmail,
          reception_contact_phone: receptionPhone || null,
          confirmed_delivery_date: confirmedDate || null,
          step4_completed_at: new Date().toISOString(),
        })
        .eq('id', validation.order.linkmeDetails.id);

      if (error) {
        throw new Error(error.message);
      }

      setSubmitSuccess(true);

      // TODO: Send confirmation email
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erreur lors de la soumission'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
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

  // Invalid/expired token
  if (!validation?.valid && !validation?.alreadyCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-red-700">
              {validation?.expired ? 'Lien expiré' : 'Lien invalide'}
            </CardTitle>
            <CardDescription>
              {validation?.error ||
                "Ce lien n'est plus valide. Veuillez contacter le support."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Already completed
  if (validation?.alreadyCompleted && validation.order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-green-700">
              Informations déjà soumises
            </CardTitle>
            <CardDescription>
              Les informations de livraison pour la commande{' '}
              <strong>{validation.order.order_number}</strong> ont déjà été
              complétées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Contact réception</span>
                <span className="font-medium">
                  {validation.order.linkmeDetails.reception_contact_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>
                  {validation.order.linkmeDetails.reception_contact_email}
                </span>
              </div>
              {validation.order.linkmeDetails.confirmed_delivery_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date confirmée</span>
                  <span>
                    {new Date(
                      validation.order.linkmeDetails.confirmed_delivery_date
                    ).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
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
              Merci ! Vos informations de livraison ont été transmises à notre
              équipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800">
                Vous recevrez une confirmation par email à{' '}
                <strong>{receptionEmail}</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = validation.order!;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Informations de livraison
          </h1>
          <p className="text-gray-600 mt-1">Commande {order.order_number}</p>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Résumé de la commande</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Restaurant</span>
              </div>
              <span className="font-medium">
                {order.organisation?.trade_name ||
                  order.organisation?.legal_name ||
                  '-'}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product?.name || 'Produit'}</span>
                  <Badge variant="outline">× {item.quantity}</Badge>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC</span>
              <span className="text-green-600">
                {formatCurrency(order.total_ttc)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CMR reminder */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">
                Rappel: Lettre de voiture (CMR)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 text-sm">
              Lors de la livraison, vous recevrez une lettre de voiture (CMR).
              Veuillez vérifier l&apos;état des marchandises et noter toute
              réserve <strong>avant de signer</strong>.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              En cas de dommage visible, notez-le clairement sur le document et
              prenez des photos.
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">
                Contact de réception sur place
              </CardTitle>
            </div>
            <CardDescription>
              Indiquez la personne qui réceptionnera la livraison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="receptionName"
                  className="flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  Nom complet *
                </Label>
                <Input
                  id="receptionName"
                  value={receptionName}
                  onChange={e => setReceptionName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="receptionEmail"
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="receptionEmail"
                  type="email"
                  value={receptionEmail}
                  onChange={e => setReceptionEmail(e.target.value)}
                  placeholder="jean.dupont@restaurant.fr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="receptionPhone"
                  className="flex items-center gap-1"
                >
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="receptionPhone"
                  type="tel"
                  value={receptionPhone}
                  onChange={e => setReceptionPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label
                  htmlFor="confirmedDate"
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  Date de livraison souhaitée
                </Label>
                <Input
                  id="confirmedDate"
                  type="date"
                  value={confirmedDate}
                  onChange={e => setConfirmedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                  Notre équipe vous confirmera la date finale par email.
                </p>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !receptionName || !receptionEmail}
              >
                {isSubmitting
                  ? 'Envoi en cours...'
                  : 'Confirmer les informations'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
