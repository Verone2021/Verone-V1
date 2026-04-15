'use client';

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
} from '@verone/ui';
import { Plus, Trash2 } from 'lucide-react';

export interface IServiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface IInvoiceServiceItemsSectionProps {
  items: IServiceItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (
    id: string,
    field: keyof IServiceItem,
    value: string | number
  ) => void;
  disabled?: boolean;
}

export function InvoiceServiceItemsSection({
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
  disabled,
}: IInvoiceServiceItemsSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Prestations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            disabled={disabled}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Prestation {index + 1}
              </span>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              <Input
                placeholder="Titre de la prestation"
                value={item.title}
                onChange={e => onItemChange(item.id, 'title', e.target.value)}
                disabled={disabled}
              />
              <Input
                placeholder="Description (optionnel)"
                value={item.description}
                onChange={e =>
                  onItemChange(item.id, 'description', e.target.value)
                }
                disabled={disabled}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Quantité</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e =>
                      onItemChange(item.id, 'quantity', Number(e.target.value))
                    }
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prix HT (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={e =>
                      onItemChange(item.id, 'unitPrice', Number(e.target.value))
                    }
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className="text-xs">TVA</Label>
                  <Select
                    value={String(item.vatRate)}
                    onValueChange={v =>
                      onItemChange(item.id, 'vatRate', Number(v))
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="0.055">5.5%</SelectItem>
                      <SelectItem value="0.1">10%</SelectItem>
                      <SelectItem value="0.2">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
