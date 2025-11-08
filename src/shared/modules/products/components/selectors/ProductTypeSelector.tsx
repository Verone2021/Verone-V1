'use client';

import { Package, Wrench, Info } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@verone/utils';

interface ProductTypeSelectorProps {
  value: 'standard' | 'custom';
  onChange: (type: 'standard' | 'custom') => void;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  showDescriptions?: boolean;
}

export function ProductTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  showLabels = true,
  showDescriptions = true,
}: ProductTypeSelectorProps) {
  const options = [
    {
      id: 'standard',
      label: 'Produit Standard',
      icon: Package,
      description: 'Produit destiné au catalogue général',
      features: [
        'Visible par tous les clients',
        'Prix de vente public',
        'Stock centralisé',
      ],
    },
    {
      id: 'custom',
      label: 'Produit Sur-Mesure',
      icon: Wrench,
      description: 'Produit spécialement conçu pour un client',
      features: [
        'Visible uniquement par le client assigné',
        'Tarification personnalisée',
        'Spécifications dédiées',
      ],
    },
  ] as const;

  return (
    <div className={cn('space-y-3', className)}>
      {showLabels && (
        <Label className="text-sm font-medium">Type de produit</Label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(option => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <div
              key={option.id}
              className={cn(
                'relative border-2 rounded-lg p-4 cursor-pointer transition-all',
                'hover:shadow-md',
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && onChange(option.id)}
            >
              {/* Radio button hidden */}
              <input
                type="radio"
                name="product-type"
                value={option.id}
                checked={isSelected}
                onChange={() => onChange(option.id)}
                disabled={disabled}
                className="sr-only"
              />

              {/* Contenu */}
              <div className="space-y-3">
                {/* Header avec icône et titre */}
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      'p-2 rounded-md',
                      isSelected ? 'bg-white/20' : 'bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-white' : 'text-gray-600'
                      )}
                    />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        'font-medium',
                        isSelected ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {option.label}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {showDescriptions && (
                  <>
                    <p
                      className={cn(
                        'text-sm',
                        isSelected ? 'text-white/80' : 'text-gray-600'
                      )}
                    >
                      {option.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-1">
                      {option.features.map((feature, index) => (
                        <li
                          key={index}
                          className={cn(
                            'text-xs flex items-start',
                            isSelected ? 'text-white/70' : 'text-gray-500'
                          )}
                        >
                          <span className="mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Indicateur sélection */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info supplémentaire pour produits sur-mesure */}
      {value === 'custom' && showDescriptions && (
        <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Attention :</p>
            <p>
              Les produits sur-mesure nécessitent l'assignation d'un client
              spécifique. Ils ne seront visibles que par ce client et les
              administrateurs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
