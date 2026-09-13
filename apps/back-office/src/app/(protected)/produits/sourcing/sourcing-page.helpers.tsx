import type { SourcingProduct } from '@verone/products';
import {
  SOURCING_STAGE_LABELS,
  SOURCING_STATE_LABELS,
  stageOfStatus,
} from '@verone/products/utils';
import { Badge } from '@verone/ui';
import { colors } from '@verone/ui/design-system';

export interface ProductImage {
  public_url: string | null;
  cloudflare_image_id?: string | null;
  is_primary: boolean;
}

export interface ProductWithImages {
  id: string;
  name: string;
  product_images?: ProductImage[];
}

export interface PrimaryImageRefs {
  cloudflareId: string | null;
  publicUrl: string | null;
}

const STATE_BADGE_VARIANT = {
  on_hold: 'warning',
  refused: 'danger',
  validated: 'success',
} as const;

/** Étape du sourcing (4 étapes) ou état hors parcours, plus « Retiré ». */
export function SourcingStateBadges({ product }: { product: SourcingProduct }) {
  const { stage, group } = stageOfStatus(product.sourcing_status);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {group === 'in_progress' && stage ? (
        <Badge variant="outline">{SOURCING_STAGE_LABELS[stage]}</Badge>
      ) : null}
      {group !== 'in_progress' ? (
        <Badge variant={STATE_BADGE_VARIANT[group]}>
          {SOURCING_STATE_LABELS[group]}
        </Badge>
      ) : null}
      {product.archived_at ? <Badge variant="default">Retiré</Badge> : null}
    </div>
  );
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

export function getPrimaryImage(product: SourcingProduct): PrimaryImageRefs {
  const images = product.product_images as ProductImage[] | undefined;
  if (!images || images.length === 0) {
    return { cloudflareId: null, publicUrl: null };
  }
  const primary = images.find(img => img.is_primary) ?? images[0];
  return {
    cloudflareId: primary?.cloudflare_image_id ?? null,
    publicUrl: primary?.public_url ?? null,
  };
}
