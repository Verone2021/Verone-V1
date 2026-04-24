'use client';

import { Fragment, useState } from 'react';

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
  Textarea,
} from '@verone/ui';
import { ChevronUp, MessageSquarePlus } from 'lucide-react';

import type { IOrderForDocument } from '../OrderSelectModal';
import { formatAmount } from './quote-utils';

interface IQuoteItemsTableProps {
  order: IOrderForDocument;
  itemComments: Record<string, string>;
  onItemCommentsChange: (comments: Record<string, string>) => void;
}

export function QuoteItemsTable({
  order,
  itemComments,
  onItemCommentsChange,
}: IQuoteItemsTableProps): React.ReactNode {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string): void => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleCommentChange = (itemId: string, value: string): void => {
    onItemCommentsChange({ ...itemComments, [itemId]: value });
  };

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
              <TableHead className="text-right hidden md:table-cell">
                Prix HT
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                TVA
              </TableHead>
              <TableHead className="text-right">Total HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.sales_order_items?.map(item => (
              <Fragment key={item.id}>
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span>{item.products?.name ?? 'Article'}</span>
                      {!expandedItems.has(item.id) && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                          <MessageSquarePlus className="h-3 w-3" />
                          {itemComments[item.id]
                            ? 'Modifier le commentaire'
                            : '+ Ajouter un commentaire'}
                        </button>
                      )}
                      {expandedItems.has(item.id) && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                        >
                          <ChevronUp className="h-3 w-3" />
                          Masquer
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatAmount(item.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                    {Math.round((item.tax_rate || 0) * 100)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(item.quantity * item.unit_price_ht)}
                  </TableCell>
                </TableRow>
                {expandedItems.has(item.id) && (
                  <TableRow>
                    <TableCell colSpan={5} className="pt-0 pb-2">
                      <Textarea
                        value={itemComments[item.id] ?? ''}
                        onChange={e =>
                          handleCommentChange(item.id, e.target.value)
                        }
                        placeholder="Commentaire pour cet article (optionnel)..."
                        rows={2}
                        maxLength={500}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(itemComments[item.id] ?? '').length}/500 caractères
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
