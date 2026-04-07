import { Input, Label, Button, Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Copy, Check, AlertCircle, Users } from 'lucide-react';

interface PricingSellingPriceSectionProps {
  customPriceHt: number | null | undefined;
  channelCommissionRate: number | null | undefined;
  isPriceValid: boolean;
  formattedMinPrice: string | null;
  customerPriceHT: number | null;
  isAffiliateProduct: boolean;
  onSellingPriceChange: (value: string) => void;
  onCopyMinPrice: () => void;
}

export function PricingSellingPriceSection({
  customPriceHt,
  channelCommissionRate,
  isPriceValid,
  formattedMinPrice,
  customerPriceHT,
  isAffiliateProduct: _isAffiliateProduct,
  onSellingPriceChange,
  onCopyMinPrice,
}: PricingSellingPriceSectionProps) {
  return (
    <>
      {/* Prix de vente HT LinkMe */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="selling-price"
            className="font-medium flex items-center gap-2"
          >
            Prix de vente HT (LinkMe)
            {isPriceValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </Label>
          {!isPriceValid && formattedMinPrice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyMinPrice}
              className="h-7 text-xs text-purple-600 hover:text-purple-700"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copier prix minimum ({formattedMinPrice}€)
            </Button>
          )}
        </div>

        {!isPriceValid && formattedMinPrice && (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-medium">
              Prix minimum de vente calculé :
            </p>
            <p className="text-lg font-mono font-semibold text-gray-700">
              {formattedMinPrice} € HT
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formule: (prix d&apos;achat + éco-taxe) × (1 + marge%)
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            id="selling-price"
            type="number"
            step="0.01"
            min="0"
            value={customPriceHt ?? ''}
            onChange={e => onSellingPriceChange(e.target.value)}
            className={cn(
              'font-mono text-lg',
              !isPriceValid && 'border-amber-300 focus:border-amber-500'
            )}
            placeholder="Prix de vente..."
          />
          <span className="text-muted-foreground">€</span>
        </div>
        {!isPriceValid && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Non validé - Copiez ou saisissez un prix de vente
          </p>
        )}
      </div>

      {/* Prix client LinkMe (calculé) */}
      <div className="space-y-2">
        <Label className="font-medium flex items-center gap-2 text-purple-700">
          <Users className="h-4 w-4" />
          Prix client LinkMe (calculé)
          <Badge
            variant="outline"
            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
          >
            Auto
          </Badge>
        </Label>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          {customerPriceHT !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-purple-700">
                  {customerPriceHT.toFixed(2)} €
                </span>
                <span className="text-sm text-purple-600">HT</span>
              </div>
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Prix affilié ({customPriceHt?.toFixed(2)}€) + Commission LinkMe
                ({channelCommissionRate ?? 0}%)
              </p>
            </>
          ) : (
            <p className="text-sm text-purple-500">
              Renseignez un prix de vente pour voir le prix client
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          C&apos;est ce prix que le client final paiera. La marge disponible est
          calculée entre ce prix et le tarif public.
        </p>
      </div>
    </>
  );
}
