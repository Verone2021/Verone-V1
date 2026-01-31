'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  MapPin,
  Package,
  Truck,
  User,
} from 'lucide-react';

interface DeliveryNoteDetail {
  id: string;
  delivery_number: string;
  shipped_at: string;
  shipped_by: string;
  tracking_number: string | null;
  notes: string | null;
  order: {
    id: string;
    order_number: string;
    shipping_address: {
      line1?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    } | null;
    notes: string | null;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: {
      line1: string | null;
      city: string | null;
      postal_code: string | null;
      country: string | null;
    } | null;
    type: string;
  } | null;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      sku: string | null;
    } | null;
    quantity_shipped: number;
    notes: string | null;
  }>;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function DeliveryNoteDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryNote = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/delivery-notes/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to fetch delivery note');
      }

      setDeliveryNote(data.delivery_note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void fetchDeliveryNote();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !deliveryNote) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error || 'Bon de livraison non trouvé'}
        </div>
      </div>
    );
  }

  const shippingAddress = deliveryNote.order?.shipping_address;
  const totalItems = deliveryNote.items.reduce(
    (sum, item) => sum + item.quantity_shipped,
    0
  );

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Truck className="h-6 w-6" />
              Bon de livraison {deliveryNote.delivery_number}
            </h1>
            <p className="text-muted-foreground">
              Expédié le {formatDate(deliveryNote.shipped_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {deliveryNote.order && (
            <Button variant="outline" asChild>
              <Link href={`/commandes/clients/${deliveryNote.order.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir la commande
              </Link>
            </Button>
          )}
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Tracking */}
      {deliveryNote.tracking_number && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Numéro de suivi:</span>
            <Badge variant="secondary" className="font-mono">
              {deliveryNote.tracking_number}
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Destinataire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{deliveryNote.customer?.name ?? '-'}</p>
            {deliveryNote.customer?.email && (
              <p className="text-sm text-muted-foreground">
                {deliveryNote.customer.email}
              </p>
            )}
            {deliveryNote.customer?.phone && (
              <p className="text-sm text-muted-foreground">
                {deliveryNote.customer.phone}
              </p>
            )}
            {deliveryNote.customer?.type === 'organisation' && (
              <Badge variant="outline">Entreprise</Badge>
            )}
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shippingAddress ? (
              <div className="space-y-1">
                {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
                <p>
                  {shippingAddress.postal_code} {shippingAddress.city}
                </p>
                {shippingAddress.country && <p>{shippingAddress.country}</p>}
              </div>
            ) : deliveryNote.customer?.address ? (
              <div className="space-y-1">
                {deliveryNote.customer.address.line1 && (
                  <p>{deliveryNote.customer.address.line1}</p>
                )}
                <p>
                  {deliveryNote.customer.address.postal_code}{' '}
                  {deliveryNote.customer.address.city}
                </p>
                {deliveryNote.customer.address.country && (
                  <p>{deliveryNote.customer.address.country}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Adresse non renseignée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles expédiés ({totalItems} article{totalItems > 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryNote.items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product?.name ?? 'Produit'}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.product?.sku ?? '-'}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.quantity_shipped}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {deliveryNote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{deliveryNote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Order reference */}
      {deliveryNote.order && (
        <div className="text-sm text-muted-foreground">
          Commande de référence:{' '}
          <Link
            href={`/commandes/clients/${deliveryNote.order.id}`}
            className="font-mono text-primary hover:underline"
          >
            {deliveryNote.order.order_number}
          </Link>
        </div>
      )}
    </div>
  );
}
