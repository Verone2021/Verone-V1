'use client';

import { useState } from 'react';

import { X, Sparkles } from 'lucide-react';

import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/shared/modules/common/hooks';

import { SourcingQuickForm } from './SourcingQuickForm';

interface SourcingProductModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
  onProductCreatedAndAdded: () => void;
}

export function SourcingProductModal({
  open,
  onClose,
  consultationId,
  onProductCreatedAndAdded,
}: SourcingProductModalProps) {
  const { toast } = useToast();
  const [isAddingToConsultation, setIsAddingToConsultation] = useState(false);

  // Callback quand le produit est créé avec succès
  const handleProductCreated = async (productId: string) => {
    setIsAddingToConsultation(true);

    try {
      // Récupérer les infos du produit créé pour obtenir le cost_price
      const productResponse = await fetch(`/api/products/${productId}`);
      if (!productResponse.ok) {
        throw new Error('Impossible de récupérer les infos du produit');
      }

      const product = await productResponse.json();

      // ÉTAPE 2: Ajouter automatiquement le produit à la consultation
      const consultationItemData = {
        consultation_id: consultationId,
        product_id: productId,
        quantity: 1,
        proposed_price: product.cost_price ? product.cost_price * 1.3 : 0, // Marge 30% par défaut
        is_free: false,
        notes: `Produit sourcé spécifiquement pour cette consultation`,
      };

      const itemResponse = await fetch('/api/consultations/associations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationItemData),
      });

      const itemResult = await itemResponse.json();

      if (!itemResponse.ok) {
        throw new Error(
          itemResult.error || "Erreur lors de l'ajout à la consultation"
        );
      }

      toast({
        title: '✅ Produit créé et ajouté',
        description: `Le produit a été créé et ajouté automatiquement à la consultation`,
      });

      onProductCreatedAndAdded();
      onClose();
    } catch (error) {
      console.error('Erreur ajout à consultation:', error);
      toast({
        title: '⚠️ Produit créé',
        description:
          error instanceof Error
            ? error.message
            : "Le produit a été créé mais n'a pas pu être ajouté à la consultation",
        variant: 'destructive',
      });

      // Fermer quand même le modal car le produit est créé
      onClose();
    } finally {
      setIsAddingToConsultation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Sourcer un nouveau produit
            </DialogTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </ButtonV2>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <SourcingQuickForm
            showHeader={false}
            onSuccess={handleProductCreated}
            onCancel={onClose}
          />
        </div>

        {isAddingToConsultation && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3" />
              <p className="text-sm text-gray-600">
                Ajout à la consultation...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
