'use client';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
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
import { Package, Truck, Users } from 'lucide-react';

import type { AffiliateReceptionMapped } from './types';

interface AffiliateReceptionsTableProps {
  receptions: AffiliateReceptionMapped[];
  loading: boolean;
  onOpenReception: (reception: AffiliateReceptionMapped) => void;
}

export function AffiliateReceptionsTable({
  receptions,
  loading,
  onOpenReception,
}: AffiliateReceptionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Réceptions produits affiliés
        </CardTitle>
        <CardDescription>
          {receptions.length} réception(s) en attente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : receptions.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune réception affilié en attente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Enseigne</TableHead>
                  <TableHead>Quantité attendue</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receptions.map(reception => (
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
                    <TableCell>{reception.enseigne_name}</TableCell>
                    <TableCell className="font-medium">
                      {reception.quantity_expected} unité(s)
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          reception.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {reception.status === 'pending'
                          ? 'En attente'
                          : 'Partielle'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenReception(reception)}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Recevoir
                      </ButtonV2>
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
