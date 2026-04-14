'use client';

import { Palette, Settings, Package, Layers } from 'lucide-react';

import { Badge } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';

const VARIANT_TEMPLATES = {
  color: {
    label: 'Couleur',
    icon: Palette,
    placeholder: 'ex: Blanc cassé, Bleu marine...',
    suggestions: [
      'Blanc',
      'Noir',
      'Gris',
      'Beige',
      'Marron',
      'Bleu',
      'Rouge',
      'Vert',
    ],
  },
  material: {
    label: 'Matériau',
    icon: Layers,
    placeholder: 'ex: Chêne massif, Métal brossé...',
    suggestions: [
      'Bois',
      'Métal',
      'Tissu',
      'Cuir',
      'Plastique',
      'Verre',
      'Céramique',
      'Marbre',
    ],
  },
  style: {
    label: 'Style',
    icon: Package,
    placeholder: 'ex: Moderne, Classique...',
    suggestions: [
      'Moderne',
      'Classique',
      'Industriel',
      'Scandinave',
      'Rustique',
      'Art déco',
    ],
  },
  finish: {
    label: 'Finition',
    icon: Settings,
    placeholder: 'ex: Vernis mat, Laqué brillant...',
    suggestions: ['Mat', 'Brillant', 'Satiné', 'Brossé', 'Poli', 'Texturé'],
  },
};

interface ProductVariantAttributesFormProps {
  variantAttributes: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
}

export function ProductVariantAttributesForm({
  variantAttributes,
  onAttributeChange,
}: ProductVariantAttributesFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-black flex items-center gap-2">
        <Palette className="h-5 w-5" />
        Caractéristiques principales
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(VARIANT_TEMPLATES).map(([key, template]) => {
          const Icon = template.icon;
          return (
            <div key={key} className="space-y-2">
              <Label
                htmlFor={key}
                className="text-sm font-medium flex items-center gap-2"
              >
                <Icon className="h-4 w-4 text-gray-600" />
                {template.label}
              </Label>
              <Input
                id={key}
                value={variantAttributes[key] ?? ''}
                onChange={e => onAttributeChange(key, e.target.value)}
                placeholder={template.placeholder}
                className="text-sm"
              />
              {template.suggestions && (
                <div className="flex flex-wrap gap-1">
                  {template.suggestions.slice(0, 4).map(suggestion => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-gray-100"
                      onClick={() => onAttributeChange(key, suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
