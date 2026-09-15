'use client';

/**
 * useProductDetailDerived — valeurs dérivées de la fiche produit :
 * breadcrumb, champs manquants, complétion, sourcing, URL image,
 * badges des onglets, liste des onglets.
 *
 * Séparé de useProductDetail pour maintenir chaque fichier < 400 lignes.
 */

import { useMemo } from 'react';

import {
  Info,
  FileText,
  DollarSign,
  Boxes,
  Settings,
  ImageIcon,
  Globe,
} from 'lucide-react';

import {
  calculateAllMissingFields,
  calculateCompletionPercentage,
} from '../types';
import type { Product } from '../types';

interface ProductImageRef {
  public_url?: string | null;
}

interface UseProductDetailDerivedArgs {
  product: Product | null;
  productImages: ProductImageRef[];
  _primaryImage: ProductImageRef | null | undefined;
}

export function useProductDetailDerived({
  product,
  productImages,
  _primaryImage,
}: UseProductDetailDerivedArgs) {
  const breadcrumbParts = useMemo(() => {
    if (!product) return [];
    const parts: string[] = [];
    if (product.subcategory?.category?.family) {
      parts.push(product.subcategory.category.family.name);
    }
    if (product.subcategory?.category) {
      parts.push(product.subcategory.category.name);
    }
    if (product.subcategory) {
      parts.push(product.subcategory.name);
    }
    parts.push(product.name);
    return parts;
  }, [product]);

  const missingFields = useMemo(
    () => calculateAllMissingFields(product),
    [product]
  );

  const completionPercentage = useMemo(
    () => calculateCompletionPercentage(missingFields),
    [missingFields]
  );

  const sourcing = useMemo(() => {
    if (product?.created_by_affiliate) {
      return {
        type: 'affiliate' as const,
        affiliateName:
          product.affiliate_creator?.enseigne?.name ??
          product.affiliate_creator?.organisation?.trade_name ??
          product.affiliate_creator?.organisation?.legal_name ??
          'Affilié inconnu',
        affiliateDisplayName:
          product.affiliate_creator?.display_name ?? undefined,
      };
    }
    if (product?.enseigne) {
      return {
        type: 'client' as const,
        clientType: 'enseigne' as const,
        clientName: product.enseigne.name,
        clientId: product.enseigne.id,
      };
    }
    if (product?.assigned_client) {
      return {
        type: 'client' as const,
        clientType: 'organisation' as const,
        clientName:
          product.assigned_client.trade_name ??
          product.assigned_client.legal_name,
        clientId: product.assigned_client.id,
      };
    }
    return { type: 'interne' as const };
  }, [
    product?.created_by_affiliate,
    product?.affiliate_creator,
    product?.enseigne,
    product?.assigned_client,
  ]);

  const primaryImageUrl = useMemo(() => {
    if (_primaryImage?.public_url) return _primaryImage.public_url;
    if (productImages.length > 0 && productImages[0].public_url)
      return productImages[0].public_url;
    return null;
  }, [_primaryImage, productImages]);

  const tabBadges = useMemo(() => {
    const generalMissing =
      missingFields.infosGenerales +
      missingFields.categorisation +
      missingFields.fournisseur +
      missingFields.identifiants;
    return {
      general: generalMissing > 0 ? generalMissing : undefined,
      descriptions:
        missingFields.descriptions > 0 ? missingFields.descriptions : undefined,
      pricing:
        missingFields.tarification > 0 ? missingFields.tarification : undefined,
      stock: missingFields.stock > 0 ? missingFields.stock : undefined,
      characteristics:
        missingFields.caracteristiques > 0
          ? missingFields.caracteristiques
          : undefined,
    };
  }, [missingFields]);

  const tabs = useMemo(
    () => [
      {
        id: 'general',
        label: 'Général',
        icon: <Info className="h-4 w-4" />,
        badge: tabBadges.general,
      },
      {
        id: 'descriptions',
        label: 'Descriptions',
        icon: <FileText className="h-4 w-4" />,
        badge: tabBadges.descriptions,
      },
      {
        id: 'pricing',
        label: 'Tarification',
        icon: <DollarSign className="h-4 w-4" />,
        badge: tabBadges.pricing,
      },
      {
        id: 'stock',
        label: 'Stock',
        icon: <Boxes className="h-4 w-4" />,
        badge: tabBadges.stock,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        icon: <Settings className="h-4 w-4" />,
        badge: tabBadges.characteristics,
      },
      {
        id: 'images',
        label: 'Images',
        icon: <ImageIcon className="h-4 w-4" />,
        badge: productImages.length > 0 ? productImages.length : undefined,
      },
      {
        id: 'publication',
        label: 'Publication',
        icon: <Globe className="h-4 w-4" />,
      },
    ],
    [tabBadges, productImages.length]
  );

  return {
    breadcrumbParts,
    missingFields,
    completionPercentage,
    sourcing,
    primaryImageUrl,
    tabBadges,
    tabs,
  };
}
