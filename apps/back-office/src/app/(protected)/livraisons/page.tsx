'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
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
import { Eye, Package, RefreshCw, Truck } from 'lucide-react';

interface DeliveryNote {
  id: string;
  shipped_at: string;
  shipped_by: string;
  tracking_number: string | null;
  notes: string | null;
  quantity_shipped: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
  order: {
    id: string;
    order_number: string;
    shipping_address: unknown;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    type: string;
  } | null;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function LivraisonsPage(): React.ReactNode {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryNotes = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/delivery-notes?limit=100');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch delivery notes');
      }

      setDeliveryNotes(data.delivery_notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDeliveryNotes();
  }, []);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bons de livraison</h1>
          <p className="text-muted-foreground">
            Suivi des expéditions et bons de livraison
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void fetchDeliveryNotes().catch(error => {
              console.error(
                '[LivraisonsPage] fetchDeliveryNotes failed:',
                error
              );
            });
          }}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Liste des expéditions
          </CardTitle>
          <CardDescription>
            Les bons de livraison sont générés automatiquement depuis les
            expéditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          ) : deliveryNotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucune expédition</p>
              <p className="text-sm">
                Les expéditions apparaîtront ici une fois créées depuis les
                commandes
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead>N° Suivi</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryNotes.map(note => (
                  <TableRow key={note.id}>
                    <TableCell className="text-sm">
                      {formatDate(note.shipped_at)}
                    </TableCell>
                    <TableCell>
                      {note.order ? (
                        <Link
                          href={`/commandes/clients/${note.order.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {note.order.order_number}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {note.customer?.name || '-'}
                      {note.customer?.type === 'organisation' && (
                        <Badge variant="outline" className="ml-2">
                          Entreprise
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {note.product?.name || 'Produit'}
                        </p>
                        {note.product?.sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {note.product.sku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {note.quantity_shipped}
                    </TableCell>
                    <TableCell>
                      {note.tracking_number ? (
                        <Badge variant="secondary">
                          {note.tracking_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/livraisons/${note.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
