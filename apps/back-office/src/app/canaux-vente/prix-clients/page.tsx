'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { CustomerPricing } from '@verone/finance';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Euro,
  Users,
  Package,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  PercentIcon,
  Tag,
} from 'lucide-react';

import type { Database } from '@/types/supabase';

// Stats interface
interface Stats {
  total_pricing_rules: number;
  active_rules: number;
  customers_with_pricing: number;
  avg_discount: number;
  total_retrocession: number;
}

export default function PrixClientsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [pricingRules, setPricingRules] = useState<CustomerPricing[]>([]);
  const [filteredRules, setFilteredRules] = useState<CustomerPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [stats, setStats] = useState<Stats>({
    total_pricing_rules: 0,
    active_rules: 0,
    customers_with_pricing: 0,
    avg_discount: 0,
    total_retrocession: 0,
  });

  // Charger les prix clients
  useEffect(() => {
    loadPricingRules();
  }, []);

  const loadPricingRules = async () => {
    setIsLoading(true);
    try {
      // Requête customer_pricing seul (sans jointures pour MVP)
      const { data: pricingData, error } = await supabase
        .from('customer_pricing')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!pricingData || pricingData.length === 0) {
        setPricingRules([]);
        setFilteredRules([]);
        calculateStats([]);
        return;
      }

      // Récupérer les organisations et produits séparément
      const customerIds = [
        ...new Set(pricingData.map(p => p.customer_id).filter(Boolean)),
      ];
      const productIds = [
        ...new Set(pricingData.map(p => p.product_id).filter(Boolean)),
      ];

      // Fetch organisations
      const { data: orgsData } = await supabase
        .from('organisations')
        .select('id, trade_name, legal_name')
        .in('id', customerIds);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      // Créer des maps pour lookup rapide
      const orgsMap = new Map(orgsData?.map(o => [o.id, o]) || []);
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);

      // Transformer les données avec les noms
      const transformedData: CustomerPricing[] = pricingData.map(item => {
        const org = orgsMap.get(item.customer_id);
        const product = productsMap.get(item.product_id);

        return {
          ...item,
          customer_name:
            org?.trade_name ||
            org?.legal_name ||
            `Client ${item.customer_id?.slice(0, 8)}`,
          product_name:
            product?.name || `Produit ${item.product_id?.slice(0, 8)}`,
        } as CustomerPricing;
      });

      setPricingRules(transformedData);
      setFilteredRules(transformedData);
      calculateStats(transformedData);
    } catch (error) {
      console.error('Erreur chargement prix clients:', error);
      setPricingRules([]);
      setFilteredRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (data: CustomerPricing[]) => {
    const activeRules = data.filter(r => r.is_active);
    const uniqueCustomers = new Set(data.map(r => r.customer_id)).size;
    const avgDiscount =
      data.length > 0
        ? data.reduce((sum, r) => sum + (r.discount_rate || 0), 0) / data.length
        : 0;
    const totalRetrocession = data.reduce(
      (sum, r) => sum + (r.retrocession_rate || 0),
      0
    );

    setStats({
      total_pricing_rules: data.length,
      active_rules: activeRules.length,
      customers_with_pricing: uniqueCustomers,
      avg_discount: avgDiscount,
      total_retrocession: totalRetrocession,
    });
  };

  // Filtrer les prix clients
  useEffect(() => {
    let filtered = pricingRules;

    // Recherche textuelle
    if (searchQuery) {
      filtered = filtered.filter(
        rule =>
          rule.customer_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          rule.product_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          rule.contract_reference
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filtre customer_type
    if (customerFilter !== 'all') {
      filtered = filtered.filter(rule => rule.customer_type === customerFilter);
    }

    // Filtre statut
    if (statusFilter === 'active') {
      filtered = filtered.filter(rule => rule.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(rule => !rule.is_active);
    }

    setFilteredRules(filtered);
  }, [searchQuery, customerFilter, statusFilter, pricingRules]);

  // Formater le prix
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Badge statut
  const getStatusBadge = (rule: CustomerPricing) => {
    if (!rule.is_active) {
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Inactif
        </Badge>
      );
    }
    if (rule.approval_status === 'pending') {
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-600">
          En attente
        </Badge>
      );
    }
    if (rule.approval_status === 'approved') {
      return (
        <Badge variant="outline" className="border-green-300 text-green-600">
          Approuvé
        </Badge>
      );
    }
    if (rule.approval_status === 'rejected') {
      return (
        <Badge variant="outline" className="border-red-300 text-red-600">
          Rejeté
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Prix Clients</h1>
              <p className="text-gray-600 mt-1">
                Gestion des tarifs personnalisés et ristournes B2B
              </p>
            </div>
            <ButtonV2
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => {
                // TODO ÉTAPE 3: Modal/Page création prix client
                alert('Fonctionnalité à venir: Créer un nouveau prix client');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Prix
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prix configurés</p>
                  <p className="text-2xl font-bold text-black">
                    {stats.total_pricing_rules}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Règles actives</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.active_rules}
                  </p>
                </div>
                <Tag className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clients</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.customers_with_pricing}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Remise moyenne</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.avg_discount.toFixed(1)}%
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ristourne totale</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.total_retrocession.toFixed(1)}%
                  </p>
                </div>
                <PercentIcon className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et Recherche */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher client, produit..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="organization">Organisation</SelectItem>
                  <SelectItem value="individual">Individuel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              <ButtonV2
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCustomerFilter('all');
                  setStatusFilter('all');
                }}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Réinitialiser
              </ButtonV2>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Prix Clients */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Tarifs Personnalisés</CardTitle>
            <CardDescription>
              {filteredRules.length} prix configuré
              {filteredRules.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                <p className="text-gray-600 mt-4">
                  Chargement des prix clients...
                </p>
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {pricingRules.length === 0
                    ? 'Aucun prix client configuré'
                    : 'Aucun résultat'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {pricingRules.length === 0
                    ? 'Commencez par créer votre premier prix personnalisé pour un client.'
                    : 'Essayez de modifier vos filtres de recherche.'}
                </p>
                {pricingRules.length === 0 && (
                  <ButtonV2
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={() => alert('Fonctionnalité à venir')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un prix client
                  </ButtonV2>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Produit
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Prix HT
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Remise
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Ristourne
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Qté min
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-gray-900">
                            {rule.customer_name}
                          </p>
                          {rule.contract_reference && (
                            <p className="text-xs text-gray-500">
                              Contrat: {rule.contract_reference}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {rule.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            variant="outline"
                            className="border-blue-300 text-blue-600"
                          >
                            {rule.customer_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {rule.custom_price_ht
                            ? formatPrice(rule.custom_price_ht)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-purple-600 font-medium">
                          {rule.discount_rate
                            ? `${rule.discount_rate.toFixed(1)}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-600 font-semibold">
                          {rule.retrocession_rate
                            ? `${rule.retrocession_rate.toFixed(1)}%`
                            : '0%'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {rule.min_quantity || 1}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusBadge(rule)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <ButtonV2
                              variant="ghost"
                              size="sm"
                              onClick={() => alert('Édition à venir')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </ButtonV2>
                            <ButtonV2
                              variant="ghost"
                              size="sm"
                              onClick={() => alert('Suppression à venir')}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </ButtonV2>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
