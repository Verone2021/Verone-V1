'use client';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatDate } from '@verone/utils';
import { Package, Users } from 'lucide-react';

import type { AffiliateReceptionMapped } from './types';

interface AffiliateHistoryTableProps {
  history: AffiliateReceptionMapped[];
  loading: boolean;
}

export function AffiliateHistoryTable({
  history,
  loading,
}: AffiliateHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Historique réceptions affiliés
        </CardTitle>
        <CardDescription>
          {history.length} réception(s) complétée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              Aucune réception affilié dans l'historique
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead className="hidden lg:table-cell">Enseigne</TableHead>
                  <TableHead className="hidden lg:table-cell">Quantité reçue</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden xl:table-cell">Date réception</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(reception => (
                  <TableRow key={reception.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumbnail
                          src={reception.product_image_url}
                          alt={reception.product_name}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {reception.product_name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {reception.product_sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{reception.affiliate_name}</TableCell>
                    <TableCell className="hidden lg:table-cell">{reception.enseigne_name}</TableCell>
                    <TableCell className="hidden lg:table-cell font-medium">
                      {reception.quantity_received ?? 0} /{' '}
                      {reception.quantity_expected} unité(s)
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          reception.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-500 text-white'
                        }
                      >
                        {reception.status === 'completed'
                          ? 'Complétée'
                          : 'Annulée'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {reception.received_at
                        ? formatDate(reception.received_at)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
