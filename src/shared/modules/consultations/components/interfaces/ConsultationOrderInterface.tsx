'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Euro,
  Calculator,
  Edit,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useConsultationItems,
  ConsultationItem,
} from '@/shared/modules/common/hooks';
import { useToast } from '@/shared/modules/common/hooks';
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from './universal-product-selector-v2';
import { SourcingProductModal } from './sourcing-product-modal';
import { useProducts } from '@/shared/modules/products/hooks';

interface ConsultationOrderInterfaceProps {
  consultationId: string;
  onItemsChanged?: () => void;
}

export function ConsultationOrderInterface({
  consultationId,
  onItemsChanged,
}: ConsultationOrderInterfaceProps) {
  const { toast } = useToast();
  const {
    consultationItems,
    loading,
    error,
    updateItem,
    removeItem,
    toggleFreeItem,
    calculateTotal,
    getTotalItemsCount,
    fetchConsultationItems,
  } = useConsultationItems(consultationId);

  // État pour les modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSourcingModal, setShowSourcingModal] = useState(false);

  // État pour l'édition inline
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Récupérer tous les produits non archivés pour le modal
  const { products } = useProducts({
    // Note: On ne filtre pas par status pour permettre tous les produits non archivés
    // archived filter removed - not supported in ProductFilters
  });

  // Gérer le changement d'items
  useEffect(() => {
    onItemsChanged?.();
  }, [consultationItems, onItemsChanged]);

  // Handler après ajout de produit via modal
  const handleProductAdded = () => {
    fetchConsultationItems(consultationId);
    onItemsChanged?.();
  };

  // Commencer l'édition d'un item
  const startEditItem = (item: ConsultationItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price?.toString() || '');
    setEditNotes(item.notes || '');
  };

  // Sauvegarder l'édition d'un item
  const saveEditItem = async (itemId: string) => {
    const success = await updateItem(itemId, {
      quantity: editQuantity,
      unit_price: editPrice ? parseFloat(editPrice) : undefined,
      notes: editNotes || undefined,
    });

    if (success) {
      setEditingItem(null);
    }
  };

  // Annuler l'édition
  const cancelEditItem = () => {
    setEditingItem(null);
  };

  // Supprimer un item avec confirmation
  const handleRemoveItem = async (itemId: string, productName: string) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir retirer "${productName}" de la consultation ?`
      )
    ) {
      await removeItem(itemId);
    }
  };

  // Changer la quantité rapidement
  const changeQuantity = async (itemId: string, delta: number) => {
    const item = consultationItems.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);
    await updateItem(itemId, { quantity: newQuantity });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
            <span>Chargement des produits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const total = calculateTotal();
  const totalItems = getTotalItemsCount();

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Produits de la consultation
              </CardTitle>
              <CardDescription>
                {totalItems} article{totalItems > 1 ? 's' : ''} • Total:{' '}
                {total.toFixed(2)}€ HT
              </CardDescription>
            </div>

            {/* Boutons actions */}
            <div className="flex gap-2">
              <ButtonV2
                onClick={() => setShowAddModal(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </ButtonV2>

              <ButtonV2
                variant="outline"
                onClick={() => setShowSourcingModal(true)}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Sourcer un produit
              </ButtonV2>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardContent className="p-0">
          {consultationItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun produit dans cette consultation</p>
              <p className="text-sm">
                Utilisez le bouton "Ajouter un produit" pour commencer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Produit</th>
                    <th className="p-4 font-medium text-center">Quantité</th>
                    <th className="p-4 font-medium text-right">
                      Prix unitaire
                    </th>
                    <th className="p-4 font-medium text-center">Gratuit</th>
                    <th className="p-4 font-medium text-right">Total</th>
                    <th className="p-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultationItems.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      {/* Produit */}
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product?.sku}
                            {item.product?.supplier_name &&
                              ` • ${item.product.supplier_name}`}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-blue-600 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Quantité */}
                      <td className="p-4 text-center">
                        {editingItem === item.id ? (
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={e =>
                              setEditQuantity(parseInt(e.target.value) || 1)
                            }
                            className="w-20 mx-auto"
                          />
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => changeQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </ButtonV2>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => changeQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>

                      {/* Prix unitaire */}
                      <td className="p-4 text-right">
                        {editingItem === item.id ? (
                          <div className="relative inline-block">
                            <Input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className="w-24 pr-8"
                              disabled={item.is_free}
                            />
                            <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        ) : (
                          <span
                            className={
                              item.is_free ? 'text-gray-400' : 'font-medium'
                            }
                          >
                            {item.is_free
                              ? '-'
                              : `${item.unit_price?.toFixed(2) || '0.00'}€`}
                          </span>
                        )}
                      </td>

                      {/* Gratuit */}
                      <td className="p-4 text-center">
                        <Checkbox
                          checked={item.is_free}
                          onCheckedChange={() => toggleFreeItem(item.id)}
                          disabled={editingItem === item.id}
                        />
                      </td>

                      {/* Total */}
                      <td className="p-4 text-right">
                        <span className="font-medium">
                          {item.is_free ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Gratuit
                            </Badge>
                          ) : (
                            `${((item.unit_price || 0) * item.quantity).toFixed(2)}€`
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              size="sm"
                              onClick={() => saveEditItem(item.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={cancelEditItem}
                            >
                              <X className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() => startEditItem(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRemoveItem(
                                  item.id,
                                  item.product?.name || 'ce produit'
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Footer avec total */}
        {consultationItems.length > 0 && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calculator className="h-4 w-4 mr-1" />
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-600">
                  {consultationItems.filter(i => i.is_free).length} gratuit
                  {consultationItems.filter(i => i.is_free).length > 1
                    ? 's'
                    : ''}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total HT</p>
                <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <UniversalProductSelectorV2
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={async (products: SelectedProduct[]) => {
          // TODO: Implémenter ajout produits avec quantité dans consultation
          console.log('Produits sélectionnés pour consultation:', products);
          await handleProductAdded();
        }}
        mode="multi"
        context="consultations"
        selectedProducts={[]}
        showQuantity={true}
        showImages={true}
      />

      <SourcingProductModal
        open={showSourcingModal}
        onClose={() => setShowSourcingModal(false)}
        consultationId={consultationId}
        onProductCreatedAndAdded={handleProductAdded}
      />
    </div>
  );
}
