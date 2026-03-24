'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';

import type { InvoiceItem } from './types';
import { formatAmount } from './utils';

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceItemsTable({
  items,
}: InvoiceItemsTableProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Lignes de facture</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-20">Qte</TableHead>
                <TableHead className="text-right w-28">PU HT</TableHead>
                <TableHead className="text-right w-20">TVA</TableHead>
                <TableHead className="text-right w-28">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {item.product?.name ?? item.description}
                      </p>
                      {item.product?.name &&
                        item.description !== item.product.name && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(item.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Math.round(item.tva_rate)}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(item.total_ttc)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <p>Aucune ligne de facture</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
