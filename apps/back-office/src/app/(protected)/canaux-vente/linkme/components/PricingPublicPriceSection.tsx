import { Input, Label } from '@verone/ui';
import { cn } from '@verone/utils';
import { Tag, Check, AlertCircle } from 'lucide-react';

interface PricingPublicPriceSectionProps {
  publicPriceTtc: number | null;
  publicPriceHt: number | null | undefined;
  isPublicPriceValid: boolean;
  onTtcChange: (value: string) => void;
  onHtChange: (value: string) => void;
}

export function PricingPublicPriceSection({
  publicPriceTtc,
  publicPriceHt,
  isPublicPriceValid,
  onTtcChange,
  onHtChange,
}: PricingPublicPriceSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Tarif Public
        {isPublicPriceValid ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
      </Label>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label
            htmlFor="public-price-ttc"
            className="text-xs text-muted-foreground"
          >
            TTC
          </Label>
          <div className="relative">
            <Input
              id="public-price-ttc"
              type="number"
              step="0.01"
              min="0"
              value={publicPriceTtc !== null ? publicPriceTtc.toFixed(2) : ''}
              onChange={e => onTtcChange(e.target.value)}
              className={cn(
                'font-mono text-lg font-semibold pr-8',
                !isPublicPriceValid && 'border-amber-300 focus:border-amber-500'
              )}
              placeholder="TTC..."
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="public-price-ht"
            className="text-xs text-muted-foreground"
          >
            HT
          </Label>
          <div className="relative">
            <Input
              id="public-price-ht"
              type="number"
              step="0.01"
              min="0"
              value={
                publicPriceHt !== null && publicPriceHt !== undefined
                  ? publicPriceHt.toFixed(2)
                  : ''
              }
              onChange={e => onHtChange(e.target.value)}
              className={cn(
                'font-mono text-lg font-semibold pr-8',
                !isPublicPriceValid && 'border-amber-300 focus:border-amber-500'
              )}
              placeholder="HT..."
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              €
            </span>
          </div>
        </div>
      </div>

      {!isPublicPriceValid ? (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Non validé - Saisissez un tarif public
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Prix public conseillé (TVA 20%). Modifiez TTC ou HT, l&apos;autre se
          met à jour.
        </p>
      )}
    </div>
  );
}
