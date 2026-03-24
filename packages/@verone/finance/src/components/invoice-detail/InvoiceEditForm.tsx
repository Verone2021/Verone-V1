'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@verone/ui';
import { Calendar, MapPin, Plus, Trash2, Truck } from 'lucide-react';

import type {
  AddressData,
  EditableItem,
  EditState,
  InvoiceDetail,
} from './types';
import { formatAmount, generateTempId } from './utils';

interface InvoiceEditFormProps {
  invoice: InvoiceDetail;
  editState: EditState;
  onEditStateChange: (state: EditState) => void;
  editTotals: { totalHt: number; totalVat: number; totalTtc: number };
}

export function InvoiceEditForm({
  invoice,
  editState,
  onEditStateChange,
  editTotals,
}: InvoiceEditFormProps): React.ReactNode {
  // Handlers pour les items
  const handleItemChange = (
    index: number,
    field: keyof EditableItem,
    value: string | number
  ): void => {
    const newItems = [...editState.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onEditStateChange({ ...editState, items: newItems });
  };

  const handleAddItem = (): void => {
    const newItem: EditableItem = {
      id: generateTempId(),
      description: 'Nouvel article',
      quantity: 1,
      unit_price_ht: 0,
      tva_rate: 20,
      product_id: null,
    };
    onEditStateChange({ ...editState, items: [...editState.items, newItem] });
  };

  const handleRemoveItem = (index: number): void => {
    if (editState.items.length <= 1) return;
    const newItems = editState.items.filter((_, i) => i !== index);
    onEditStateChange({ ...editState, items: newItems });
  };

  // Handlers pour les adresses
  const handleAddressChange = (
    type: 'billing' | 'shipping',
    field: keyof AddressData,
    value: string
  ): void => {
    const addressKey =
      type === 'billing' ? 'billing_address' : 'shipping_address';
    onEditStateChange({
      ...editState,
      [addressKey]: { ...editState[addressKey], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      {/* Informations generales */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Date d echeance</Label>
              <Input
                id="due_date"
                type="date"
                value={editState.due_date}
                onChange={e =>
                  onEditStateChange({ ...editState, due_date: e.target.value })
                }
              />
            </div>
            {invoice.sales_order && (
              <div>
                <Label>Commande liee</Label>
                <p className="text-sm font-medium mt-2">
                  {invoice.sales_order.order_number}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adresse de facturation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse de facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="billing_street">Rue</Label>
              <Input
                id="billing_street"
                value={editState.billing_address.street ?? ''}
                onChange={e =>
                  handleAddressChange('billing', 'street', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="billing_postal_code">Code postal</Label>
              <Input
                id="billing_postal_code"
                value={editState.billing_address.postal_code ?? ''}
                onChange={e =>
                  handleAddressChange('billing', 'postal_code', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="billing_city">Ville</Label>
              <Input
                id="billing_city"
                value={editState.billing_address.city ?? ''}
                onChange={e =>
                  handleAddressChange('billing', 'city', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="billing_country">Pays</Label>
              <Input
                id="billing_country"
                value={editState.billing_address.country ?? 'FR'}
                onChange={e =>
                  handleAddressChange('billing', 'country', e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse de livraison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Adresse de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="shipping_street">Rue</Label>
              <Input
                id="shipping_street"
                value={editState.shipping_address.street ?? ''}
                onChange={e =>
                  handleAddressChange('shipping', 'street', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="shipping_postal_code">Code postal</Label>
              <Input
                id="shipping_postal_code"
                value={editState.shipping_address.postal_code ?? ''}
                onChange={e =>
                  handleAddressChange('shipping', 'postal_code', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="shipping_city">Ville</Label>
              <Input
                id="shipping_city"
                value={editState.shipping_address.city ?? ''}
                onChange={e =>
                  handleAddressChange('shipping', 'city', e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="shipping_country">Pays</Label>
              <Input
                id="shipping_country"
                value={editState.shipping_address.country ?? 'FR'}
                onChange={e =>
                  handleAddressChange('shipping', 'country', e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes de facture */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Lignes de facture</CardTitle>
          <Button size="sm" variant="outline" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-right w-20">Qte</TableHead>
                <TableHead className="text-right w-28">PU HT</TableHead>
                <TableHead className="text-right w-20">TVA %</TableHead>
                <TableHead className="text-right w-28">Total HT</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {editState.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={e =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      className="text-right"
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'quantity',
                          Number(e.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right"
                      value={item.unit_price_ht}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'unit_price_ht',
                          Number(e.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="text-right"
                      value={item.tva_rate}
                      onChange={e =>
                        handleItemChange(
                          index,
                          'tva_rate',
                          Number(e.target.value)
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(item.unit_price_ht * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      disabled={editState.items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Frais de service */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Frais de service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="shipping_cost">Livraison HT</Label>
              <Input
                id="shipping_cost"
                type="number"
                min="0"
                step="0.01"
                value={editState.shipping_cost_ht}
                onChange={e =>
                  onEditStateChange({
                    ...editState,
                    shipping_cost_ht: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="handling_cost">Manutention HT</Label>
              <Input
                id="handling_cost"
                type="number"
                min="0"
                step="0.01"
                value={editState.handling_cost_ht}
                onChange={e =>
                  onEditStateChange({
                    ...editState,
                    handling_cost_ht: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="insurance_cost">Assurance HT</Label>
              <Input
                id="insurance_cost"
                type="number"
                min="0"
                step="0.01"
                value={editState.insurance_cost_ht}
                onChange={e =>
                  onEditStateChange({
                    ...editState,
                    insurance_cost_ht: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="fees_vat">TVA frais (%)</Label>
              <Input
                id="fees_vat"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={editState.fees_vat_rate}
                onChange={e =>
                  onEditStateChange({
                    ...editState,
                    fees_vat_rate: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totaux calcules */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">
                  {formatAmount(editTotals.totalHt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total TVA</span>
                <span>{formatAmount(editTotals.totalVat)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total TTC</span>
                <span>{formatAmount(editTotals.totalTtc)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editState.notes}
            onChange={e =>
              onEditStateChange({ ...editState, notes: e.target.value })
            }
            placeholder="Notes internes..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
