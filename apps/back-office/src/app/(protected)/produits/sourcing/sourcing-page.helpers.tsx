import type { SourcingProduct } from '@verone/products';
import { Badge } from '@verone/ui';
import { colors } from '@verone/ui/design-system';

export interface ProductImage {
  public_url: string | null;
  is_primary: boolean;
}

export interface ProductWithImages {
  id: string;
  name: string;
  product_images?: ProductImage[];
}

export function getStatusBadge(productStatus: string | undefined) {
  switch (productStatus) {
    case 'draft':
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-600">
          En sourcing
        </Badge>
      );
    case 'preorder':
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-600">
          Échantillon commandé
        </Badge>
      );
    case 'active':
      return (
        <Badge variant="outline" className="border-green-300 text-green-600">
          Au catalogue
        </Badge>
      );
    case 'discontinued':
      return (
        <Badge variant="outline" className="border-red-300 text-red-600">
          Discontinué
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          {productStatus ?? 'Inconnu'}
        </Badge>
      );
  }
}

export function getSourcingTypeBadge(
  sourcing_type: string | undefined,
  requires_sample: boolean
) {
  if (requires_sample) {
    return (
      <Badge
        variant="outline"
        className="text-xs"
        style={{ borderColor: colors.text.muted, color: colors.text.DEFAULT }}
      >
        Échantillon requis
      </Badge>
    );
  }
  switch (sourcing_type) {
    case 'client':
      return (
        <Badge
          variant="outline"
          className="border-blue-300 text-blue-600 text-xs"
        >
          Client
        </Badge>
      );
    case 'interne':
      return (
        <Badge
          variant="outline"
          className="text-xs"
          style={{ borderColor: colors.text.muted, color: colors.text.DEFAULT }}
        >
          Interne
        </Badge>
      );
    default:
      return null;
  }
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Non défini';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export function getPrimaryImage(product: SourcingProduct): string | null {
  const images = product.product_images as ProductImage[] | undefined;
  if (!images || images.length === 0) return null;
  const primary = images.find(img => img.is_primary);
  return primary?.public_url ?? images[0]?.public_url ?? null;
}
