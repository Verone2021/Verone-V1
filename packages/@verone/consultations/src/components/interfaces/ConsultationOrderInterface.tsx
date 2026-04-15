'use client';

import { useState, useEffect } from 'react';

import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { SourcingProductModal } from '@verone/products/components/sourcing/SourcingProductModal';
import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
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
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
} from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';
import { useConsultationItems } from '@verone/consultations/hooks';

interface ConsultationOrderInterfaceProps {
  consultationId: string;
  onItemsChanged?: () => void;
  onCreatePurchaseOrder?: (acceptedItems: ConsultationItem[]) => void;
}

export function ConsultationOrderInterface({
  consultationId,
  onItemsChanged,
  onCreatePurchaseOrder,
}: ConsultationOrderInterfaceProps) {
  const {
    consultationItems,
    loading,
    error,
    addItem,
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
  const [editShippingCost, setEditShippingCost] = useState('');
  const [editCostPriceOverride, setEditCostPriceOverride] = useState('');
  const [editIsSample, setEditIsSample] = useState(false);

  // Gérer le changement d'items — ne dépend PAS de onItemsChanged pour éviter les boucles
  const itemsCount = consultationItems.length;
  useEffect(() => {
    onItemsChanged?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onItemsChanged volontairement exclu pour éviter boucle infinie
  }, [itemsCount]);

  // Handler après ajout de produit via modal
  const handleProductAdded = () => {
    void fetchConsultationItems(consultationId);
    onItemsChanged?.();
  };

  // Commencer l'édition d'un item
  const startEditItem = (item: ConsultationItem) => {
    setEditingItem(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.unit_price?.toString() ?? '');
    setEditNotes(item.notes ?? '');
    setEditShippingCost(item.shipping_cost?.toString() ?? '0');
    setEditCostPriceOverride(item.cost_price_override?.toString() ?? '');
    setEditIsSample(item.is_sample ?? false);
  };

  // Sauvegarder l'édition d'un item
  const saveEditItem = async (itemId: string): Promise<void> => {
    const success = await updateItem(itemId, {
      quantity: editQuantity,
      unit_price: editPrice ? parseFloat(editPrice) : undefined,
      notes: editNotes || undefined,
      shipping_cost: editShippingCost ? parseFloat(editShippingCost) : 0,
      cost_price_override: editCostPriceOverride
        ? parseFloat(editCostPriceOverride)
        : undefined,
      is_sample: editIsSample,
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

  // Changer le statut d'une ligne (accepter/refuser)
  const changeLineStatus = async (itemId: string, status: string) => {
    await updateItem(itemId, { status });
  };

  // Compter les lignes acceptées
  const acceptedItems = consultationItems.filter(i => i.status === 'approved');
  const hasAcceptedItems = acceptedItems.length > 0;

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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3" />
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

  // Margin calculations
  const getItemCostPrice = (item: ConsultationItem): number =>
    item.cost_price_override ?? item.product?.cost_price ?? 0;

  const getItemCostTotal = (item: ConsultationItem): number => {
    if (item.is_free || item.is_sample)
      return getItemCostPrice(item) * item.quantity;
    return (getItemCostPrice(item) + item.shipping_cost) * item.quantity;
  };

  const getItemMargin = (item: ConsultationItem): number => {
    if (item.is_free || item.is_sample)
      return -(getItemCostPrice(item) * item.quantity);
    const costPerUnit = getItemCostPrice(item) + item.shipping_cost;
    return ((item.unit_price ?? 0) - costPerUnit) * item.quantity;
  };

  const getItemMarginPercent = (item: ConsultationItem): number => {
    const costPerUnit = getItemCostPrice(item) + item.shipping_cost;
    if (costPerUnit === 0 || item.is_free || item.is_sample) return 0;
    return (((item.unit_price ?? 0) - costPerUnit) / costPerUnit) * 100;
  };

  const totalCost = consultationItems.reduce(
    (sum, item) => sum + getItemCostTotal(item),
    0
  );
  const totalShipping = consultationItems.reduce(
    (sum, item) =>
      item.is_sample ? sum : sum + item.shipping_cost * item.quantity,
    0
  );
  const totalMargin = consultationItems.reduce(
    (sum, item) => sum + getItemMargin(item),
    0
  );
  const totalMarginPercent =
    totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

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
                  <tr className="text-left text-xs uppercase text-gray-500 tracking-wider">
                    <th className="p-3 font-medium">Produit</th>
                    <th className="p-3 font-medium text-center">Qté</th>
                    <th className="p-3 font-medium text-right">Prix achat</th>
                    <th className="p-3 font-medium text-right">Transport</th>
                    <th className="p-3 font-medium text-right">Prix vente</th>
                    <th className="p-3 font-medium text-center">Gratuit</th>
                    <th className="p-3 font-medium text-right">Marge</th>
                    <th className="p-3 font-medium text-right">Total</th>
                    <th className="p-3 font-medium text-center">Statut</th>
                    <th className="p-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultationItems.map(item => (
                    <tr
                      key={item.id}
                      className={`border-b hover:bg-gray-50 ${
                        item.status === 'approved'
                          ? 'bg-green-50/30 border-l-4 border-l-green-400'
                          : item.status === 'rejected'
                            ? 'bg-red-50/30 border-l-4 border-l-red-300 opacity-60'
                            : item.status === 'ordered'
                              ? 'bg-blue-50/30 border-l-4 border-l-blue-400'
                              : ''
                      }`}
                    >
                      {/* Produit */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.product?.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <a
                              href={`/produits/catalogue/${item.product_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              {item.product?.name}
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
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
                              onClick={() => void changeQuantity(item.id, -1)}
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
                              onClick={() => void changeQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>

                      {/* Prix achat */}
                      <td className="p-3 text-right">
                        {editingItem === item.id ? (
                          <div className="relative inline-block">
                            <Input
                              type="number"
                              step="0.01"
                              value={editCostPriceOverride}
                              onChange={e =>
                                setEditCostPriceOverride(e.target.value)
                              }
                              placeholder={
                                item.product?.cost_price?.toFixed(2) ?? '0'
                              }
                              className="w-24 pr-6 text-sm"
                            />
                            <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {getItemCostPrice(item).toFixed(2)}€
                            {item.cost_price_override != null && (
                              <span className="block text-[10px] text-orange-500">
                                modifié
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Transport */}
                      <td className="p-3 text-right">
                        {editingItem === item.id ? (
                          <div className="relative inline-block">
                            <Input
                              type="number"
                              step="0.01"
                              value={editShippingCost}
                              onChange={e =>
                                setEditShippingCost(e.target.value)
                              }
                              className="w-20 pr-6 text-sm"
                              disabled={editIsSample}
                            />
                            <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                          </div>
                        ) : item.is_sample ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {item.shipping_cost > 0
                              ? `${item.shipping_cost.toFixed(2)}€`
                              : '—'}
                          </span>
                        )}
                      </td>

                      {/* Prix vente (anciennement Prix unitaire) */}
                      <td className="p-3 text-right">
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
                              : `${item.unit_price?.toFixed(2) ?? '0.00'}€`}
                          </span>
                        )}
                      </td>

                      {/* Gratuit / Échantillon */}
                      <td className="p-3 text-center">
                        {editingItem === item.id ? (
                          <label className="flex items-center gap-1 text-xs justify-center cursor-pointer">
                            <Checkbox
                              checked={editIsSample}
                              onCheckedChange={checked =>
                                setEditIsSample(checked === true)
                              }
                            />
                            <span>Échant.</span>
                          </label>
                        ) : (
                          <div className="space-y-1">
                            <Checkbox
                              checked={item.is_free}
                              onCheckedChange={() =>
                                void toggleFreeItem(item.id)
                              }
                            />
                            {item.is_sample && (
                              <Badge variant="outline" className="text-[10px]">
                                Échant.
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Marge */}
                      <td className="p-3 text-right">
                        {item.is_free || item.is_sample ? (
                          <Badge
                            variant="outline"
                            className="text-red-600 border-red-200 text-xs"
                          >
                            -
                            {(getItemCostPrice(item) * item.quantity).toFixed(
                              2
                            )}
                            €
                          </Badge>
                        ) : (
                          <div className="text-sm">
                            <span
                              className={
                                getItemMargin(item) >= 0
                                  ? 'text-green-700 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {getItemMargin(item).toFixed(2)}€
                            </span>
                            <br />
                            <Badge
                              variant={
                                getItemMarginPercent(item) >= 30
                                  ? 'success'
                                  : getItemMarginPercent(item) >= 0
                                    ? 'warning'
                                    : 'danger'
                              }
                              className="text-xs"
                            >
                              {getItemMarginPercent(item).toFixed(1)}%
                            </Badge>
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="p-3 text-right">
                        <span className="font-medium">
                          {item.is_free ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              Gratuit
                            </Badge>
                          ) : (
                            `${((item.unit_price ?? 0) * item.quantity).toFixed(2)}€`
                          )}
                        </span>
                      </td>

                      {/* Statut ligne */}
                      <td className="p-3 text-center">
                        {item.status === 'approved' ? (
                          <Badge variant="success" className="text-xs">
                            Accepté
                          </Badge>
                        ) : item.status === 'rejected' ? (
                          <Badge variant="danger" className="text-xs">
                            Refusé
                          </Badge>
                        ) : item.status === 'ordered' ? (
                          <Badge variant="info" className="text-xs">
                            Commandé
                          </Badge>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void changeLineStatus(
                                  item.id,
                                  'approved'
                                ).catch(console.error)
                              }
                              className="text-green-600 hover:bg-green-50 border-green-200"
                              title="Accepter"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void changeLineStatus(
                                  item.id,
                                  'rejected'
                                ).catch(console.error)
                              }
                              className="text-red-600 hover:bg-red-50 border-red-200"
                              title="Refuser"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              size="sm"
                              onClick={() => void saveEditItem(item.id)}
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
                                void handleRemoveItem(
                                  item.id,
                                  item.product?.name ?? 'ce produit'
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

        {/* Footer KPI marges */}
        {consultationItems.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                <p className="text-xs text-blue-600 uppercase tracking-wider">
                  Chiffre d&apos;affaires
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {total.toFixed(2)}€
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-400">
                <p className="text-xs text-red-600 uppercase tracking-wider">
                  Coût total
                </p>
                <p className="text-lg font-bold text-red-900">
                  {totalCost.toFixed(2)}€
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                <p className="text-xs text-orange-600 uppercase tracking-wider">
                  Transport
                </p>
                <p className="text-lg font-bold text-orange-900">
                  {totalShipping.toFixed(2)}€
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                <p className="text-xs text-green-600 uppercase tracking-wider">
                  Bénéfice
                </p>
                <p
                  className={`text-lg font-bold ${totalMargin >= 0 ? 'text-green-900' : 'text-red-900'}`}
                >
                  {totalMargin.toFixed(2)}€
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                <p className="text-xs text-purple-600 uppercase tracking-wider">
                  Taux de marge
                </p>
                <p
                  className={`text-lg font-bold ${totalMarginPercent >= 30 ? 'text-green-900' : totalMarginPercent >= 0 ? 'text-orange-900' : 'text-red-900'}`}
                >
                  {totalMarginPercent.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4" />
                <span>
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>
                  {acceptedItems.length} accepté
                  {acceptedItems.length > 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>
                  {
                    consultationItems.filter(i => i.status === 'rejected')
                      .length
                  }{' '}
                  refusé
                  {consultationItems.filter(i => i.status === 'rejected')
                    .length > 1
                    ? 's'
                    : ''}
                </span>
                <span>•</span>
                <span>
                  {consultationItems.filter(i => i.status === 'pending').length}{' '}
                  en attente
                </span>
              </div>
              {hasAcceptedItems && onCreatePurchaseOrder && (
                <ButtonV2
                  onClick={() => onCreatePurchaseOrder(acceptedItems)}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Commander ({acceptedItems.length} produit
                  {acceptedItems.length > 1 ? 's' : ''})
                </ButtonV2>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <UniversalProductSelectorV2
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={async (products: SelectedProduct[]) => {
          for (const product of products) {
            await addItem({
              consultation_id: consultationId,
              product_id: product.id,
              quantity: product.quantity ?? 1,
              unit_price: product.unit_price ?? undefined,
              is_free: false,
            });
          }
          setShowAddModal(false);
        }}
        mode="multi"
        context="consultations"
        selectedProducts={[]}
        showQuantity
        showImages
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
