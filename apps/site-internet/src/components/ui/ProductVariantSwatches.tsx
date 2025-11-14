import { cn } from '@verone/utils';

/**
 * ProductVariantSwatches - Design System Vérone (WestWing-style)
 *
 * Affiche les swatches de variantes produit (couleurs, textures)
 * - Max 4 swatches visibles + indicateur "+N"
 * - Hover scale effect
 * - Support couleur solide ou image texture
 * - Taille configurable (sm: 20px, md: 28px)
 */

export interface ProductVariant {
  id: string;
  name: string;
  color?: string; // Couleur hex (#FFFFFF) ou CSS (rgb, hsl)
  imageUrl?: string; // Image texture/pattern
}

export interface ProductVariantSwatchesProps {
  variants: ProductVariant[];
  maxVisible?: number; // Nombre max swatches visibles (défaut: 4)
  size?: 'sm' | 'md'; // Taille swatches (défaut: sm)
  className?: string;
}

export function ProductVariantSwatches({
  variants,
  maxVisible = 4,
  size = 'sm',
  className,
}: ProductVariantSwatchesProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Tailles selon size prop
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  // Limiter nombre de swatches visibles
  const visibleVariants = variants.slice(0, maxVisible);
  const remaining = Math.max(0, variants.length - maxVisible);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {visibleVariants.map(variant => (
        <div
          key={variant.id}
          className={cn(
            sizeClasses,
            'rounded-full border border-verone-gray-300',
            'hover:scale-110 transition-transform duration-200 cursor-pointer',
            'flex-shrink-0' // Empêcher rétrécissement dans flex container
          )}
          style={{
            backgroundColor: variant.color || '#E5E5E5',
            backgroundImage: variant.imageUrl
              ? `url(${variant.imageUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          title={variant.name}
          aria-label={`Variante: ${variant.name}`}
        />
      ))}

      {/* Indicateur "+N" si plus de variantes */}
      {remaining > 0 && (
        <span className="text-xs text-verone-gray-500 ml-0.5 flex-shrink-0">
          +{remaining}
        </span>
      )}
    </div>
  );
}
