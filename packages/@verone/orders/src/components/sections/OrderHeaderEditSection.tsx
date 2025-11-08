'use client';

import { Calendar, MapPin, FileText } from 'lucide-react';

import { EcoTaxVatInput } from '@/components/forms/eco-tax-vat-input';
import { Card, CardContent } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';

interface OrderHeaderEditSectionProps {
  orderType: 'sales' | 'purchase';
  data: {
    billing_address?: string | null;
    shipping_address?: string | null;
    delivery_address?: string | null;
    expected_delivery_date?: string | null;
    payment_terms?: string | null;
    eco_tax_vat_rate?: number | null;
    tax_rate?: number;
  };
  customerName?: string;
  supplierName?: string;
  onChange: (field: string, value: string | number | null) => void;
  readonly?: boolean;
}

export function OrderHeaderEditSection({
  orderType,
  data,
  customerName,
  supplierName,
  onChange,
  readonly = false,
}: OrderHeaderEditSectionProps) {
  // Validation JSONB basique
  const validateJSONB = (value: string): boolean => {
    if (!value.trim()) return true; // Vide accepté
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Client/Fournisseur - READ ONLY */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              {orderType === 'sales' ? 'Client' : 'Fournisseur'}
            </Label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
              {orderType === 'sales' ? customerName : supplierName}
            </div>
          </div>

          {/* Date souhaitée réception */}
          <div>
            <Label
              htmlFor="expected_delivery_date"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Date souhaitée de réception
            </Label>
            <Input
              id="expected_delivery_date"
              type="date"
              value={formatDate(data.expected_delivery_date || null)}
              onChange={e =>
                onChange('expected_delivery_date', e.target.value || null)
              }
              disabled={readonly}
              className="mt-1"
            />
          </div>
        </div>

        {/* Adresses selon type commande */}
        {orderType === 'sales' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Adresse facturation */}
            <div>
              <Label
                htmlFor="billing_address"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Adresse de facturation
              </Label>
              <Textarea
                id="billing_address"
                value={data.billing_address || ''}
                onChange={e => {
                  const value = e.target.value;
                  onChange('billing_address', value || null);
                }}
                disabled={readonly}
                placeholder='Format JSONB: {"street": "...", "city": "...", "zip": "..."}'
                className="mt-1 font-mono text-sm"
                rows={4}
              />
              {data.billing_address && !validateJSONB(data.billing_address) && (
                <p className="text-xs text-red-600 mt-1">
                  Format JSONB invalide
                </p>
              )}
            </div>

            {/* Adresse livraison */}
            <div>
              <Label
                htmlFor="shipping_address"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Adresse de livraison
              </Label>
              <Textarea
                id="shipping_address"
                value={data.shipping_address || ''}
                onChange={e => {
                  const value = e.target.value;
                  onChange('shipping_address', value || null);
                }}
                disabled={readonly}
                placeholder='Format JSONB: {"street": "...", "city": "...", "zip": "..."}'
                className="mt-1 font-mono text-sm"
                rows={4}
              />
              {data.shipping_address &&
                !validateJSONB(data.shipping_address) && (
                  <p className="text-xs text-red-600 mt-1">
                    Format JSONB invalide
                  </p>
                )}
            </div>
          </div>
        )}

        {orderType === 'purchase' && (
          <div>
            {/* Adresse livraison (purchase_orders utilise delivery_address) */}
            <Label
              htmlFor="delivery_address"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Adresse de livraison
            </Label>
            <Textarea
              id="delivery_address"
              value={data.delivery_address || ''}
              onChange={e => {
                const value = e.target.value;
                onChange('delivery_address', value || null);
              }}
              disabled={readonly}
              placeholder='Format JSONB: {"street": "...", "city": "...", "zip": "..."}'
              className="mt-1 font-mono text-sm"
              rows={4}
            />
            {data.delivery_address && !validateJSONB(data.delivery_address) && (
              <p className="text-xs text-red-600 mt-1">Format JSONB invalide</p>
            )}
          </div>
        )}

        {/* TVA Éco-taxe */}
        <div>
          <EcoTaxVatInput
            value={data.eco_tax_vat_rate ?? null}
            onChange={value => onChange('eco_tax_vat_rate', value)}
            defaultTaxRate={data.tax_rate ? data.tax_rate * 100 : 20}
            disabled={readonly}
          />
        </div>

        {/* Conditions de paiement */}
        <div>
          <Label htmlFor="payment_terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Conditions de paiement
          </Label>
          <Input
            id="payment_terms"
            value={data.payment_terms || ''}
            onChange={e => onChange('payment_terms', e.target.value || null)}
            disabled={readonly}
            placeholder="Ex: Net 30 jours, Comptant, etc."
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
