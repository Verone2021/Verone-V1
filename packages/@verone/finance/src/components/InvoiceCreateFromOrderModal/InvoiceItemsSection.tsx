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

import type { IOrderForDocument } from '../OrderSelectModal';
import { formatAmount } from './utils';

interface IInvoiceItemsSectionProps {
  order: IOrderForDocument;
}

export function InvoiceItemsSection({
  order,
}: IInvoiceItemsSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Articles</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead className="text-right">Qté</TableHead>
              <TableHead className="text-right">Prix HT</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">Total HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.sales_order_items?.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.products?.name ?? 'Article'}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatAmount(item.unit_price_ht)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {Math.round((item.tax_rate || 0) * 100)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(item.quantity * item.unit_price_ht)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
