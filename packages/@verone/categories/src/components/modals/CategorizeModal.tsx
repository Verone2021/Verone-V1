'use client';

import { useState } from 'react';

import { Button } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';

import { CategoryHierarchySelector } from '../selectors/CategoryHierarchySelector';

interface CategoryHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onUpdate: (updatedProduct: any) => void;
}

export function CategoryHierarchyModal({
  isOpen,
  onClose,
  product,
  onUpdate,
}: CategoryHierarchyModalProps) {
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(product.subcategory_id);

  const handleSave = () => {
    onUpdate({
      ...product,
      subcategory_id: selectedSubcategoryId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Catégoriser le produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <CategoryHierarchySelector
            value={selectedSubcategoryId || undefined}
            onChange={subcategoryId => setSelectedSubcategoryId(subcategoryId)}
            placeholder="Sélectionner une sous-catégorie"
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export alias for backward compatibility
export { CategoryHierarchyModal as CategorizeModal };
