'use client';

import { useState, useCallback } from 'react';

import { Button, Card, Input, Label } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Truck, Loader2, Save, Check } from 'lucide-react';

interface IFeesSectionProps {
  orderId: string;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
}

const VAT_RATE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0.2, label: '20%' },
  { value: 0.1, label: '10%' },
  { value: 0.055, label: '5,5%' },
  { value: 0, label: '0%' },
];

export function FeesSection(props: IFeesSectionProps): React.ReactNode {
  const {
    orderId,
    shippingCostHt: initialShipping,
    handlingCostHt: initialHandling,
    insuranceCostHt: initialInsurance,
    feesVatRate: initialVatRate,
  } = props;

  const [shippingCostHt, setShippingCostHt] = useState<number>(initialShipping);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(initialHandling);
  const [insuranceCostHt, setInsuranceCostHt] =
    useState<number>(initialInsurance);
  const [feesVatRate, setFeesVatRate] = useState<number>(initialVatRate);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Calcul des totaux
  const totalFeesHt: number = shippingCostHt + handlingCostHt + insuranceCostHt;
  const totalFeesTva: number = totalFeesHt * feesVatRate;
  const totalFeesTtc: number = totalFeesHt + totalFeesTva;

  // Vérifie si des modifications ont été faites
  const hasChanges: boolean =
    shippingCostHt !== initialShipping ||
    handlingCostHt !== initialHandling ||
    insuranceCostHt !== initialInsurance ||
    feesVatRate !== initialVatRate;

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sales_orders')
        .update({
          shipping_cost_ht: shippingCostHt,
          handling_cost_ht: handlingCostHt,
          insurance_cost_ht: insuranceCostHt,
          fees_vat_rate: feesVatRate,
        })
        .eq('id', orderId);

      if (error) {
        console.error('[FeesSection] Error saving fees:', error);
        throw new Error(error.message);
      }

      setSaveSuccess(true);
      // Reset success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('[FeesSection] Failed to save fees:', err);
    } finally {
      setIsSaving(false);
    }
  }, [orderId, shippingCostHt, handlingCostHt, insuranceCostHt, feesVatRate]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setShippingCostHt(parseFloat(e.target.value) || 0);
  };

  const handleHandlingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setHandlingCostHt(parseFloat(e.target.value) || 0);
  };

  const handleInsuranceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setInsuranceCostHt(parseFloat(e.target.value) || 0);
  };

  const handleVatRateChange = (value: number): void => {
    setFeesVatRate(value);
  };

  const onSaveClick = (): void => {
    void handleSave();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Frais de service</h2>
      </div>

      <div className="space-y-4">
        {/* Frais de livraison */}
        <div className="space-y-2">
          <Label htmlFor="shipping">Frais de livraison HT</Label>
          <div className="relative">
            <Input
              id="shipping"
              type="number"
              step="0.01"
              min="0"
              value={shippingCostHt}
              onChange={handleShippingChange}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
          </div>
        </div>

        {/* Frais de manutention */}
        <div className="space-y-2">
          <Label htmlFor="handling">Frais de manutention HT</Label>
          <div className="relative">
            <Input
              id="handling"
              type="number"
              step="0.01"
              min="0"
              value={handlingCostHt}
              onChange={handleHandlingChange}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
          </div>
        </div>

        {/* Frais d'assurance */}
        <div className="space-y-2">
          <Label htmlFor="insurance">Frais d&apos;assurance HT</Label>
          <div className="relative">
            <Input
              id="insurance"
              type="number"
              step="0.01"
              min="0"
              value={insuranceCostHt}
              onChange={handleInsuranceChange}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
          </div>
        </div>

        {/* TVA sur les frais */}
        <div className="space-y-2">
          <Label>TVA sur les frais</Label>
          <div className="flex gap-2">
            {VAT_RATE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleVatRateChange(option.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  feesVatRate === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Totaux calculés */}
        {totalFeesHt > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total frais HT</span>
              <span className="font-medium">{formatCurrency(totalFeesHt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                TVA ({(feesVatRate * 100).toFixed(1)}%)
              </span>
              <span className="font-medium">
                {formatCurrency(totalFeesTva)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total frais TTC</span>
              <span>{formatCurrency(totalFeesTtc)}</span>
            </div>
          </div>
        )}

        {/* Bouton sauvegarder */}
        {hasChanges && (
          <Button
            onClick={onSaveClick}
            disabled={isSaving}
            className="w-full mt-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enregistré
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les frais
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
