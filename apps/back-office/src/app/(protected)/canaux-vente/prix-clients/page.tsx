'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Plus } from 'lucide-react';

import { PrixClientsFilters } from './PrixClientsFilters';
import { PrixClientsStatsGrid } from './PrixClientsStats';
import { PrixClientsTable } from './PrixClientsTable';
import type { CustomerPricing, PrixClientsStats } from './types';
import { calculateStats } from './utils';

const EMPTY_STATS: PrixClientsStats = {
  total_pricing_rules: 0,
  active_rules: 0,
  customers_with_pricing: 0,
  avg_discount: 0,
  total_retrocession: 0,
};

export default function PrixClientsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [pricingRules, setPricingRules] = useState<CustomerPricing[]>([]);
  const [filteredRules, setFilteredRules] = useState<CustomerPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<PrixClientsStats>(EMPTY_STATS);

  const loadPricingRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: pricingData, error } = await supabase
        .from('customer_pricing')
        .select(
          'id, customer_id, customer_type, product_id, custom_price_ht, discount_rate, retrocession_rate, contract_reference, min_quantity, valid_from, valid_until, is_active, approval_status, notes, created_at'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!pricingData || pricingData.length === 0) {
        setPricingRules([]);
        setFilteredRules([]);
        setStats(calculateStats([]));
        return;
      }

      const customerIds = [
        ...new Set(pricingData.map(p => p.customer_id).filter(Boolean)),
      ];
      const productIds = [
        ...new Set(pricingData.map(p => p.product_id).filter(Boolean)),
      ];

      const { data: orgsData } = await supabase
        .from('organisations')
        .select('id, trade_name, legal_name')
        .in('id', customerIds)
        .returns<{ id: string; trade_name: string; legal_name: string }[]>();

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds)
        .returns<{ id: string; name: string }[]>();

      const orgsMap = new Map(orgsData?.map(o => [o.id, o]) ?? []);
      const productsMap = new Map(productsData?.map(p => [p.id, p]) ?? []);

      const transformedData: CustomerPricing[] = pricingData.map(item => {
        const org = orgsMap.get(item.customer_id);
        const product = productsMap.get(item.product_id);
        return {
          ...item,
          customer_name:
            org?.trade_name ??
            org?.legal_name ??
            `Client ${item.customer_id?.slice(0, 8)}`,
          product_name:
            product?.name ?? `Produit ${item.product_id?.slice(0, 8)}`,
        } as CustomerPricing;
      });

      setPricingRules(transformedData);
      setFilteredRules(transformedData);
      setStats(calculateStats(transformedData));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur chargement prix clients';
      console.error('[PrixClientsPage]:', message);
      setPricingRules([]);
      setFilteredRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadPricingRules().catch(error => {
      console.error('[PrixClientsPage] loadPricingRules failed:', error);
    });
  }, [loadPricingRules]);

  useEffect(() => {
    let filtered = pricingRules;

    if (searchQuery) {
      /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR for filter conditions */
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
      /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(rule => rule.customer_type === customerFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(rule => rule.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(rule => !rule.is_active);
    }

    setFilteredRules(filtered);
  }, [searchQuery, customerFilter, statusFilter, pricingRules]);

  const handleReset = () => {
    setSearchQuery('');
    setCustomerFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
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
                alert('Fonctionnalité à venir: Créer un nouveau prix client');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Prix
            </ButtonV2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <PrixClientsStatsGrid stats={stats} />

        <PrixClientsFilters
          searchQuery={searchQuery}
          customerFilter={customerFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onCustomerFilterChange={setCustomerFilter}
          onStatusFilterChange={setStatusFilter}
          onReset={handleReset}
        />

        <PrixClientsTable
          rules={filteredRules}
          allRulesCount={pricingRules.length}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
