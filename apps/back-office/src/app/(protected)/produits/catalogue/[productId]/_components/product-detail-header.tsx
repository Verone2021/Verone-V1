'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Badge, ButtonUnified } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowLeft,
  Share2,
  Building2,
  Package,
  UserCircle2,
} from 'lucide-react';

import type { Product, SourcingInfo } from './types';

interface ProductDetailHeaderProps {
  product: Product;
  breadcrumbParts: string[];
  completionPercentage: number;
  primaryImageUrl: string | null;
  sourcing: SourcingInfo;
  onBack: () => void;
  onShare: () => void;
  onImageClick: () => void;
}

export function ProductDetailHeader({
  product,
  breadcrumbParts,
  completionPercentage,
  primaryImageUrl,
  sourcing,
  onBack,
  onShare,
  onImageClick,
}: ProductDetailHeaderProps) {
  const completionColor =
    completionPercentage < 30
      ? 'bg-red-500'
      : completionPercentage < 70
        ? 'bg-orange-500'
        : 'bg-green-500';

  const completionTextColor =
    completionPercentage < 30
      ? 'text-red-700'
      : completionPercentage < 70
        ? 'text-orange-700'
        : 'text-green-700';

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="max-w-[1800px] mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Thumbnail clickable */}
          <button
            onClick={onImageClick}
            className="relative h-[100px] w-[100px] flex-shrink-0 rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition-colors bg-neutral-50"
          >
            {primaryImageUrl ? (
              <Image
                src={primaryImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="100px"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-neutral-400">
                <Package className="h-8 w-8" />
              </div>
            )}
          </button>

          {/* Info section */}
          <div className="flex-1 min-w-0">
            {/* Top row: Back + Breadcrumb */}
            <div className="flex items-center gap-2 mb-1">
              <ButtonUnified
                variant="outline"
                size="sm"
                onClick={onBack}
                icon={ArrowLeft}
                iconPosition="left"
              >
                Retour
              </ButtonUnified>
              <div className="h-4 w-px bg-neutral-200" />
              <nav className="text-xs text-neutral-500 truncate">
                {breadcrumbParts.join(' › ')}
              </nav>
            </div>

            {/* Product name + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-neutral-900 truncate">
                {product.name}
              </h1>

              {/* Status badge */}
              {product.product_status && (
                <Badge variant="outline" className="text-xs">
                  {product.product_status}
                </Badge>
              )}

              {/* Sourcing badge */}
              {sourcing.type === 'affiliate' ? (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-purple-50 border-purple-300 text-purple-700"
                >
                  <UserCircle2 className="h-3 w-3" />
                  Produit affilié ({sourcing.affiliateName})
                </Badge>
              ) : sourcing.type === 'client' && sourcing.clientId ? (
                <Link
                  href={
                    sourcing.clientType === 'enseigne'
                      ? `/contacts-organisations/enseignes/${sourcing.clientId}`
                      : `/contacts-organisations/customers/${sourcing.clientId}`
                  }
                >
                  <Badge
                    variant="customer"
                    className="flex items-center gap-1 cursor-pointer hover:bg-purple-200 transition-colors"
                  >
                    <Building2 className="h-3 w-3" />
                    Client: {sourcing.clientName}
                  </Badge>
                </Link>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Sourcing interne
                </Badge>
              )}
            </div>

            {/* Completion bar */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 max-w-xs h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    completionColor
                  )}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className={cn('text-xs font-medium', completionTextColor)}>
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Share button */}
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={onShare}
            icon={Share2}
            iconPosition="left"
            className="flex-shrink-0"
          >
            Partager
          </ButtonUnified>
        </div>
      </div>
    </div>
  );
}
