export type { VariantProduct, VariantGroup, VariantType } from '@verone/types';

import type { VariantProduct } from '@verone/types';

export type VariantProductWithSupplier = VariantProduct & {
  supplier?: { name?: string };
};

export interface GroupDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
  unit: string;
}
