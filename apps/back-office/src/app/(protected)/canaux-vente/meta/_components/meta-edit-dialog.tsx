'use client';

import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { useUpdateMetaMetadata, useUpdateMetaPrice } from '@verone/channels';
import type { MetaCommerceProduct } from '@verone/channels/hooks/use-meta-commerce-products';
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

export function MetaEditDialog({ product, onClose }: MetaEditDialogProps) {
  const updateMetadata = useUpdateMetaMetadata();
  const updatePrice = useUpdateMetaPrice();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.custom_title ?? product.product_name);
      setDescription(product.custom_description ?? product.description ?? '');
      setPrice(
        String(product.custom_price_ht ?? (product.cost_price * 2.5).toFixed(2))
      );
    }
  }, [product]);

  function handleSave() {
    if (!product) return;
    const priceNum = parseFloat(price);
    const promises: Promise<void>[] = [];

    const titleChanged =
      title !== (product.custom_title ?? product.product_name);
    const descChanged =
      description !== (product.custom_description ?? product.description ?? '');

    if (titleChanged || descChanged) {
      promises.push(
        updateMetadata.mutateAsync({
          productId: product.product_id,
          customTitle: title,
          customDescription: description,
        })
      );
    }

    if (
      !isNaN(priceNum) &&
      priceNum > 0 &&
      priceNum !== product.custom_price_ht
    ) {
      promises.push(
        updatePrice.mutateAsync({
          productId: product.product_id,
          priceHt: priceNum,
        })
      );
    }

    if (promises.length === 0) {
      onClose();
      return;
    }

    void Promise.all(promises)
      .then(() => {
        toast.success(`${product.product_name} mis a jour`);
        onClose();
      })
      .catch((err: unknown) => {
        console.error('[MetaEditDialog] Save failed:', err);
        toast.error('Erreur lors de la mise a jour');
      });
  }

  return (
    <Dialog open={!!product} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier — {product?.product_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Titre Meta (custom)</Label>
            <Input
              id="meta-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre affiche sur Facebook/Instagram"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-desc">Description Meta (custom)</Label>
            <Textarea
              id="meta-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description affichee sur Facebook/Instagram"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-price">Prix HT Meta (EUR)</Label>
            <Input
              id="meta-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Prix TTC = {(parseFloat(price || '0') * 1.2).toFixed(2)} EUR (TVA
              20%)
            </p>
          </div>
        </div>
        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose}>
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={handleSave}
            disabled={updateMetadata.isPending || updatePrice.isPending}
          >
            {updateMetadata.isPending || updatePrice.isPending
              ? 'Enregistrement...'
              : 'Enregistrer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
