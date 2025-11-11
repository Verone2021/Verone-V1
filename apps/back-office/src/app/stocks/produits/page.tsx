'use client';

import React, { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { useStock } from '@verone/stock';
import { useStockMovements } from '@verone/stock';
import { useStockReservations } from '@verone/stock';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import {
  Package,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Eye,
  Edit,
  History,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  ArrowUpDown,
  X,
  ArrowLeft,
} from 'lucide-react';

interface StockFilters {
  search: string;
  status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  category: string;
  sortBy: 'name' | 'sku' | 'stock' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

interface StockMovementModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function StockMovementModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUST'>(
    'IN'
  );
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { createMovement } = useStockMovements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity) <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une quantité valide',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createMovement({
        product_id: product.id,
        movement_type: movementType,
        quantity_change: parseInt(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : undefined,
        reference_type: 'manual_entry',
        notes: notes,
      });

      onSuccess();
      onClose();
      setQuantity('');
      setUnitCost('');
      setNotes('');
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mouvement de stock - {product?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type de mouvement
            </label>
            <Select
              value={movementType}
              onValueChange={(value: any) => setMovementType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Entrée (+)</SelectItem>
                <SelectItem value="OUT">Sortie (-)</SelectItem>
                <SelectItem value="ADJUST">Ajustement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {movementType === 'ADJUST' ? 'Nouvelle quantité' : 'Quantité'}
            </label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={
                movementType === 'ADJUST'
                  ? 'Quantité finale souhaitée'
                  : 'Quantité du mouvement'
              }
              required
            />
            {product && (
              <p className="text-xs text-gray-500 mt-1">
                Stock actuel: {product.stock_quantity || 0} unités
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Coût unitaire (optionnel)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={e => setUnitCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Raison du mouvement..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="success"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductHistoryModal({
  product,
  isOpen,
  onClose,
}: {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getProductHistory } = useStockMovements();

  useEffect(() => {
    if (isOpen && product) {
      loadHistory();
    }
  }, [isOpen, product]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await getProductHistory(product.id);
      setMovements(history as any);
    } catch (error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historique des mouvements - {product?.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun mouvement trouvé
            </p>
          ) : (
            <div className="space-y-3">
              {movements.map((movement: any) => (
                <div key={movement.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          movement.movement_type === 'IN'
                            ? 'secondary'
                            : movement.movement_type === 'OUT'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {movement.movement_type}
                      </Badge>
                      <span className="font-medium">
                        {movement.quantity_change > 0 ? '+' : ''}
                        {movement.quantity_change}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(movement.performed_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Stock: {movement.quantity_before} →{' '}
                    {movement.quantity_after}
                  </div>
                  {movement.notes && (
                    <div className="mt-1 text-sm text-gray-500">
                      {movement.notes}
                    </div>
                  )}
                  {movement.user_profiles && (
                    <div className="mt-1 text-xs text-gray-400">
                      Par: {movement.user_profiles.first_name}{' '}
                      {movement.user_profiles.last_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StockInventairePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<StockFilters>({
    search: '',
    status: 'all',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const { toast } = useToast();
  const { fetchInventoryProducts } = useStock();
  const { stats: movementStats, fetchStats } = useStockMovements();
  const { fetchReservations, getAvailableStockForProduct } =
    useStockReservations();

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setProductsLoading(true);
    try {
      const [inventoryProducts] = await Promise.all([
        fetchInventoryProducts(),
        fetchStats(),
        // fetchReservations désactivé temporairement - erreur clé étrangère
      ]);
      setProducts(inventoryProducts);
    } finally {
      setProductsLoading(false);
    }
  };

  // Calculer les statistiques de stock
  const stockStats = useMemo(() => {
    if (!products) return { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };

    return products.reduce(
      (stats, product) => {
        stats.total++;
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock || 5;

        if (stock === 0) {
          stats.outOfStock++;
        } else if (stock <= minStock) {
          stats.lowStock++;
        } else {
          stats.inStock++;
        }

        return stats;
      },
      { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
    );
  }, [products]);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const filtered = products.filter(product => {
      // Filtre de recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtre de statut
      if (filters.status !== 'all') {
        const stock = product.stock_quantity || 0;
        const minStock = product.min_stock || 5;

        switch (filters.status) {
          case 'out_of_stock':
            if (stock > 0) return false;
            break;
          case 'low_stock':
            if (stock === 0 || stock > minStock) return false;
            break;
          case 'in_stock':
            if (stock <= minStock) return false;
            break;
        }
      }

      return true;
    });

    // Trier
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'sku':
          aValue = a.sku;
          bValue = b.sku;
          break;
        case 'stock':
          aValue = a.stock_quantity || 0;
          bValue = b.stock_quantity || 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (filters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    return filtered;
  }, [products, filters]);

  const getStockStatus = (product: any) => {
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock || 5;

    if (stock === 0) {
      return {
        label: 'Rupture',
        color: 'bg-red-100 text-red-800',
        icon: TrendingDown,
      };
    } else if (stock <= minStock) {
      return {
        label: 'Stock faible',
        color: 'bg-gray-100 text-gray-900',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'En stock',
        color: 'bg-green-100 text-green-800',
        icon: TrendingUp,
      };
    }
  };

  const handleMovementSuccess = () => {
    loadData();
  };

  const openMovementModal = (product: any) => {
    setSelectedProduct(product);
    setIsMovementModalOpen(true);
  };

  const openHistoryModal = (product: any) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="outline"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux Stocks
              </ButtonV2>
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-black" />
                <div>
                  <h1 className="text-2xl font-bold text-black">
                    Inventaire Détaillé
                  </h1>
                  <p className="text-gray-600">
                    Suivi temps réel des mouvements et réservations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ButtonV2
                variant="outline"
                onClick={loadData}
                disabled={productsLoading}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw
                  className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`}
                />
              </ButtonV2>
              <ButtonV2
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </ButtonV2>
              <ButtonV2 className="bg-black hover:bg-gray-800 text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapports
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stock summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-black p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total produits
                </p>
                <p className="text-2xl font-bold text-black">
                  {stockStats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-black p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {stockStats.inStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-black p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-gray-900" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Stock faible
                </p>
                <p className="text-2xl font-bold text-black">
                  {stockStats.lowStock}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-black p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ruptures</p>
                <p className="text-2xl font-bold text-red-600">
                  {stockStats.outOfStock}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg border border-black p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom, SKU..."
                  className="pl-10"
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value: any) =>
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="in_stock">En stock</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">Rupture</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value: any) =>
                setFilters(prev => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="updated_at">Mise à jour</SelectItem>
              </SelectContent>
            </Select>

            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
                }))
              }
              className="border-black text-black hover:bg-black hover:text-white"
            >
              <ArrowUpDown className="h-4 w-4" />
            </ButtonV2>

            {(filters.search || filters.status !== 'all') && (
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: '',
                    status: 'all',
                    category: 'all',
                    sortBy: 'name',
                    sortOrder: 'asc',
                  })
                }
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <X className="h-4 w-4" />
              </ButtonV2>
            )}
          </div>
        </div>

        {/* Products table */}
        <div className="bg-white rounded-lg border border-black overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Produit
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Stock
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Seuil min
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Prix
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Dernière MAJ
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Aucun produit trouvé
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const status = getStockStatus(product);
                    const StatusIcon = status.icon;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {product.product_image_url ? (
                              <Image
                                src={product.product_image_url}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover border border-gray-200 mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-black">
                                {product.name}
                              </span>
                              {product.stock_quantity === 0 && (
                                <Badge
                                  variant="destructive"
                                  className="ml-2 text-xs"
                                >
                                  Rupture
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-500 font-mono text-sm">
                            {product.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <StatusIcon className="h-4 w-4 mr-1" />
                            <span className="font-medium text-black">
                              {product.stock_quantity || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-500">
                            {product.min_stock || 5}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-black">
                            {formatPrice(product.cost_price)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-500 text-sm">
                            {new Date(product.updated_at).toLocaleDateString(
                              'fr-FR'
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => openHistoryModal(product)}
                              title="Voir l'historique"
                            >
                              <History className="h-4 w-4" />
                            </ButtonV2>
                            <ButtonV2
                              variant="success"
                              size="sm"
                              onClick={() => openMovementModal(product)}
                              title="Nouveau mouvement"
                            >
                              <Plus className="h-4 w-4" />
                            </ButtonV2>
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </ButtonV2>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Affichage de{' '}
            <span className="font-medium">{filteredProducts.length}</span>{' '}
            produit(s)
          </p>
          <div className="text-sm text-gray-500">
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>

        {/* Modals */}
        <StockMovementModal
          product={selectedProduct}
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          onSuccess={handleMovementSuccess}
        />

        <ProductHistoryModal
          product={selectedProduct}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      </div>
    </div>
  );
}
