'use client';

import type { FinancialDocument } from '@verone/finance';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';

// =====================================================================
// TYPES
// =====================================================================

interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  sort_order: number;
}

interface ExpenseAmountsProps {
  document: FinancialDocument;
  documentItems: DocumentItem[];
  remaining: number;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ExpenseAmounts({
  document,
  documentItems,
  remaining,
}: ExpenseAmountsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Montants</CardTitle>
          {documentItems.length > 1 && (
            <Badge variant="outline" className="text-blue-600">
              TVA ventilée ({documentItems.length} lignes)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {documentItems.length > 1 && (
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600 mb-3">
              Ventilation TVA
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-center">Taux</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.total_ht.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.tva_rate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.tva_amount.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.total_ttc.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total HT</p>
            <p className="text-2xl font-bold">
              {document.total_ht.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">TVA</p>
            <p className="text-2xl font-bold">
              {document.tva_amount.toFixed(2)} €
            </p>
            {documentItems.length === 1 && documentItems[0]?.tva_rate && (
              <Badge variant="outline" className="mt-1">
                {documentItems[0].tva_rate}%
              </Badge>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Total TTC</p>
            <p className="text-2xl font-bold">
              {document.total_ttc.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Montant payé</p>
            <p className="text-2xl font-bold text-green-600">
              {document.amount_paid.toFixed(2)} €
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Restant dû</p>
            <p
              className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}`}
            >
              {remaining.toFixed(2)} €
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
