'use client';

import { Label } from '@verone/ui/components/ui/label';
import { Textarea } from '@verone/ui/components/ui/textarea';

export interface ProductInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProductInput({ value, onChange, disabled }: ProductInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt-product">
        Description du produit
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          (forme, matière, couleur, dimensions — en anglais de préférence)
        </span>
      </Label>
      <Textarea
        id="prompt-product"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="ex: ceramic vase 35cm height, matte off-white finish, organic curved shape"
        className="min-h-[80px] resize-y"
        rows={3}
      />
    </div>
  );
}
