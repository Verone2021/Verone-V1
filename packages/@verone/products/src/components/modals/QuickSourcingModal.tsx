'use client';

import { X, Sparkles } from 'lucide-react';

import { Button } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { SourcingQuickForm } from '@verone/products/components/sourcing/SourcingQuickForm';

interface QuickSourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal simplifiée pour créer rapidement un produit en sourcing
 * depuis la page /produits/sourcing/produits
 *
 * Affiche le formulaire rapide avec les 3 champs obligatoires :
 * - Nom du produit
 * - URL page fournisseur
 * - Prix d'achat HT
 */
export function QuickSourcingModal({
  open,
  onClose,
  onSuccess,
}: QuickSourcingModalProps) {
  const handleProductCreated = (_productId: string) => {
    // Rafraîchir la liste en appelant onSuccess
    onSuccess?.();
    // Fermer la modal
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-3xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Sourcer un nouveau produit
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          <SourcingQuickForm
            showHeader={false}
            onSuccess={handleProductCreated}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
