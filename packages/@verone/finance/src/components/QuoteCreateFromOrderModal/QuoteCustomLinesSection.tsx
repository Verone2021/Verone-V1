'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Plus, Trash2 } from 'lucide-react';

import type { ICustomLine } from '../OrderSelectModal';
import { formatAmount } from './quote-utils';

interface IQuoteCustomLinesSectionProps {
  customLines: ICustomLine[];
  onCustomLinesChange: (lines: ICustomLine[]) => void;
}

export function QuoteCustomLinesSection({
  customLines,
  onCustomLinesChange,
}: IQuoteCustomLinesSectionProps): React.ReactNode {
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLineTitle, setNewLineTitle] = useState('');
  const [newLineQty, setNewLineQty] = useState(1);
  const [newLinePriceHt, setNewLinePriceHt] = useState(0);
  const [newLineVatRate, setNewLineVatRate] = useState(0.2);

  const handleAddLine = (): void => {
    onCustomLinesChange([
      ...customLines,
      {
        id: crypto.randomUUID(),
        title: newLineTitle,
        quantity: newLineQty,
        unit_price_ht: newLinePriceHt,
        vat_rate: newLineVatRate,
      },
    ]);
    setNewLineTitle('');
    setNewLineQty(1);
    setNewLinePriceHt(0);
    setShowAddLine(false);
  };

  const handleRemoveLine = (id: string): void => {
    onCustomLinesChange(customLines.filter(l => l.id !== id));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Lignes personnalisées</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddLine(!showAddLine)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddLine && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/50">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Libellé</Label>
                <Input
                  value={newLineTitle}
                  onChange={e => setNewLineTitle(e.target.value)}
                  placeholder="Ex: Frais de conseil"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={newLineQty}
                  onChange={e => setNewLineQty(parseInt(e.target.value) || 1)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prix unitaire HT</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLinePriceHt}
                  onChange={e =>
                    setNewLinePriceHt(parseFloat(e.target.value) || 0)
                  }
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Select
                value={String(newLineVatRate)}
                onValueChange={v => setNewLineVatRate(parseFloat(v))}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.2">20%</SelectItem>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.055">5,5%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={!newLineTitle || newLinePriceHt <= 0}
                onClick={handleAddLine}
              >
                Ajouter la ligne
              </Button>
            </div>
          </div>
        )}

        {customLines.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right">Prix HT</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customLines.map(line => (
                <TableRow key={line.id}>
                  <TableCell>{line.title}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(line.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Math.round(line.vat_rate * 100)}%
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLine(line.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {customLines.length === 0 && !showAddLine && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucune ligne personnalisée
          </p>
        )}
      </CardContent>
    </Card>
  );
}
