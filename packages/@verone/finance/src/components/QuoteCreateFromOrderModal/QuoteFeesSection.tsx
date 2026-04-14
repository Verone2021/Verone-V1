'use client';

import {
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
} from '@verone/ui';
import { Truck } from 'lucide-react';

import type { IQuoteFeesState } from './types';

interface IQuoteFeesSectionProps {
  fees: IQuoteFeesState;
  onFeesChange: (fees: IQuoteFeesState) => void;
}

export function QuoteFeesSection({
  fees,
  onFeesChange,
}: IQuoteFeesSectionProps): React.ReactNode {
  const { shippingCostHt, handlingCostHt, insuranceCostHt, feesVatRate } = fees;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Frais de service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Livraison HT</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={shippingCostHt}
              onChange={e =>
                onFeesChange({
                  ...fees,
                  shippingCostHt: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Manutention HT</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={handlingCostHt}
              onChange={e =>
                onFeesChange({
                  ...fees,
                  handlingCostHt: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Assurance HT</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={insuranceCostHt}
              onChange={e =>
                onFeesChange({
                  ...fees,
                  insuranceCostHt: parseFloat(e.target.value) || 0,
                })
              }
              className="h-8"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">TVA sur les frais</Label>
          <Select
            value={String(feesVatRate)}
            onValueChange={v =>
              onFeesChange({ ...fees, feesVatRate: parseFloat(v) })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.2">20%</SelectItem>
              <SelectItem value="0.1">10%</SelectItem>
              <SelectItem value="0.055">5,5%</SelectItem>
              <SelectItem value="0">0%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
