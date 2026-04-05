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

interface IInvoiceFeesSectionProps {
  shippingCostHt: number;
  setShippingCostHt: (v: number) => void;
  handlingCostHt: number;
  setHandlingCostHt: (v: number) => void;
  insuranceCostHt: number;
  setInsuranceCostHt: (v: number) => void;
  feesVatRate: number;
  setFeesVatRate: (v: number) => void;
}

export function InvoiceFeesSection({
  shippingCostHt,
  setShippingCostHt,
  handlingCostHt,
  setHandlingCostHt,
  insuranceCostHt,
  setInsuranceCostHt,
  feesVatRate,
  setFeesVatRate,
}: IInvoiceFeesSectionProps): React.ReactNode {
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
              onChange={e => setShippingCostHt(parseFloat(e.target.value) || 0)}
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
              onChange={e => setHandlingCostHt(parseFloat(e.target.value) || 0)}
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
                setInsuranceCostHt(parseFloat(e.target.value) || 0)
              }
              className="h-8"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">TVA sur les frais</Label>
          <Select
            value={String(feesVatRate)}
            onValueChange={v => setFeesVatRate(parseFloat(v))}
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
