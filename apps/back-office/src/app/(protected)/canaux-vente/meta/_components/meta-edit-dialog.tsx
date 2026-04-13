'use client';

import { useState, useEffect } from 'react';

import { Copy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateMetaMetadata } from '@verone/channels';
import type { MetaCommerceProduct } from '@verone/channels/hooks/use-meta-commerce-products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';

interface MetaEditDialogProps {
  product: MetaCommerceProduct | null;
  onClose: () => void;
}

/**
 * Dialog for editing Meta Commerce product metadata (title + description).
 *
 * IMPORTANT: Price is NOT editable here. The price on Meta/Google Merchant
 * is ALWAYS the same as the site-internet price. The site is the single
 * source of truth for pricing — customers checkout on veronecollections.fr.
 */
export function MetaEditDialog({ product, onClose }: MetaEditDialogProps) {
  const updateMetadata = useUpdateMetaMetadata();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const originalTitle = product?.product_name ?? '';
  const originalDescription = product?.description ?? '';

  useEffect(() => {
    if (product) {
      setTitle(product.custom_title ?? product.product_name);
      setDescription(product.custom_description ?? product.description ?? '');
    }
  }, [product]);

  function resetToOriginal(field: 'title' | 'description') {
    if (field === 'title') {
      setTitle(originalTitle);
    } else {
      setDescription(originalDescription);
    }
  }

  function handleSave() {
    if (!product) return;

    const titleChanged =
      title !== (product.custom_title ?? product.product_name);
    const descChanged =
      description !== (product.custom_description ?? product.description ?? '');

    if (!titleChanged && !descChanged) {
      onClose();
      return;
    }

    void updateMetadata
      .mutateAsync({
        productId: product.product_id,
        customTitle: title,
        customDescription: description,
      })
      .then(() => {
        toast.success(`${product.product_name} mis a jour`);
        onClose();
      })
      .catch((err: unknown) => {
        console.error('[MetaEditDialog] Save failed:', err);
        toast.error('Erreur lors de la mise a jour');
      });
  }

  const priceTtc = product
    ? ((product.custom_price_ht ?? product.cost_price * 2.5) * 1.2).toFixed(2)
    : '0.00';

  return (
    <Dialog open={!!product} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier — {product?.product_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Titre */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta-title">Titre Meta</Label>
              <div className="flex items-center gap-2">
                {title !== originalTitle && (
                  <>
                    <Badge variant="outline" className="text-[10px]">
                      Personnalise
                    </Badge>
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => resetToOriginal('title')}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Original
                    </ButtonV2>
                  </>
                )}
              </div>
            </div>
            <Input
              id="meta-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre affiche sur Facebook/Instagram"
            />
            {title === originalTitle && (
              <p className="text-xs text-muted-foreground">
                Utilise le titre du produit. Modifiez pour personnaliser.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta-desc">Description Meta</Label>
              <div className="flex items-center gap-2">
                {description !== originalDescription && originalDescription && (
                  <>
                    <Badge variant="outline" className="text-[10px]">
                      Personnalisee
                    </Badge>
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => resetToOriginal('description')}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Original
                    </ButtonV2>
                  </>
                )}
                {!description && originalDescription && (
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setDescription(originalDescription)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier depuis le produit
                  </ButtonV2>
                )}
              </div>
            </div>
            <Textarea
              id="meta-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description affichee sur Facebook/Instagram"
              rows={4}
            />
            {description === originalDescription && originalDescription ? (
              <p className="text-xs text-muted-foreground">
                Utilise la description du produit. Modifiez pour personnaliser.
              </p>
            ) : !description ? (
              <p className="text-xs text-amber-600">
                Aucune description. Cliquez &quot;Copier depuis le produit&quot;
                ou ecrivez-en une.
              </p>
            ) : null}
          </div>

          {/* Prix — lecture seule */}
          <div className="space-y-1 rounded-md bg-muted/50 p-3">
            <p className="text-sm font-medium">Prix : {priceTtc} EUR TTC</p>
            <p className="text-xs text-muted-foreground">
              Le prix est synchronise depuis le site internet
              (veronecollections.fr). Pour modifier le prix, changez-le dans la
              fiche produit du catalogue.
            </p>
          </div>
        </div>
        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose}>
            Annuler
          </ButtonV2>
          <ButtonV2 onClick={handleSave} disabled={updateMetadata.isPending}>
            {updateMetadata.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
