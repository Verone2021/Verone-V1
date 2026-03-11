'use client';

import { useState, useCallback } from 'react';

import { Button, Card, Input } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Loader2, Save, Check, Plus, X } from 'lucide-react';

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

  // Show extra fee rows if they have a value, or user explicitly added them
  const [showHandling, setShowHandling] = useState<boolean>(
    initialHandling > 0
  );
  const [showInsurance, setShowInsurance] = useState<boolean>(
    initialInsurance > 0
  );

  const totalFeesHt: number = shippingCostHt + handlingCostHt + insuranceCostHt;
  const totalFeesTva: number = totalFeesHt * feesVatRate;
  const totalFeesTtc: number = totalFeesHt + totalFeesTva;

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

  const onSaveClick = (): void => {
    void handleSave();
  };

  const canAddMore = !showHandling || !showInsurance;

  return (
    <Card>
      <div className="p-3 space-y-2">
        {/* Header compact */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Frais de service
          </span>
          <div className="flex items-center gap-1">
            {/* TVA pills — compact */}
            {VAT_RATE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFeesVatRate(option.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  feesVatRate === option.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shipping — always visible */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 w-20 flex-shrink-0">
            Livraison
          </span>
          <div className="relative flex-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={shippingCostHt}
              onChange={e => setShippingCostHt(parseFloat(e.target.value) || 0)}
              className="h-7 text-xs pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              €
            </span>
          </div>
        </div>

        {/* Handling — shown on demand */}
        {showHandling && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 flex-shrink-0">
              Manutention
            </span>
            <div className="relative flex-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={handlingCostHt}
                onChange={e =>
                  setHandlingCostHt(parseFloat(e.target.value) || 0)
                }
                className="h-7 text-xs pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                €
              </span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-red-500 flex-shrink-0"
              onClick={() => {
                setShowHandling(false);
                setHandlingCostHt(0);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Insurance — shown on demand */}
        {showInsurance && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 flex-shrink-0">
              Assurance
            </span>
            <div className="relative flex-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={insuranceCostHt}
                onChange={e =>
                  setInsuranceCostHt(parseFloat(e.target.value) || 0)
                }
                className="h-7 text-xs pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                €
              </span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-red-500 flex-shrink-0"
              onClick={() => {
                setShowInsurance(false);
                setInsuranceCostHt(0);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Add more fees + save */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {canAddMore && (
              <>
                {!showHandling && (
                  <button
                    type="button"
                    className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800"
                    onClick={() => setShowHandling(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Manutention
                  </button>
                )}
                {!showInsurance && (
                  <button
                    type="button"
                    className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800"
                    onClick={() => setShowInsurance(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Assurance
                  </button>
                )}
              </>
            )}
          </div>
          {hasChanges && (
            <Button
              size="sm"
              className="h-6 text-xs px-2"
              onClick={onSaveClick}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saveSuccess ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  OK
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Sauver
                </>
              )}
            </Button>
          )}
        </div>

        {/* Totals — only if fees > 0 */}
        {totalFeesHt > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              Total frais : {formatCurrency(totalFeesHt)} HT
              {' + '}
              {formatCurrency(totalFeesTva)} TVA
            </span>
            <span className="font-semibold">
              {formatCurrency(totalFeesTtc)} TTC
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
