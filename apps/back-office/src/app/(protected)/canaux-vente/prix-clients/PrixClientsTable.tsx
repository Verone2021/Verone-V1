'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Package, Plus, Edit2, Trash2 } from 'lucide-react';

import type { CustomerPricing } from './types';
import { formatPrice } from './utils';

interface PrixClientsTableProps {
  rules: CustomerPricing[];
  allRulesCount: number;
  isLoading: boolean;
}

function getStatusBadge(rule: CustomerPricing) {
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
}

function EmptyState({ hasRules }: { hasRules: boolean }) {
  return (
    <div className="text-center py-12">
      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {hasRules ? 'Aucun résultat' : 'Aucun prix client configuré'}
      </h3>
      <p className="text-gray-600 mb-6">
        {hasRules
          ? 'Essayez de modifier vos filtres de recherche.'
          : 'Commencez par créer votre premier prix personnalisé pour un client.'}
      </p>
      {!hasRules && (
        <ButtonV2
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => alert('Fonctionnalité à venir')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un prix client
        </ButtonV2>
      )}
    </div>
  );
}

function RulesTable({ rules }: { rules: CustomerPricing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Client', 'Produit', 'Type'].map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col}
              </th>
            ))}
            {['Prix HT', 'Remise', 'Ristourne', 'Qté min'].map(col => (
              <th
                key={col}
                className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
              >
                {col}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Statut
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rules.map(rule => (
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
                {rule.custom_price_ht ? formatPrice(rule.custom_price_ht) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-purple-600 font-medium">
                {rule.discount_rate ? `${rule.discount_rate.toFixed(1)}%` : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-orange-600 font-semibold">
                {rule.retrocession_rate
                  ? `${rule.retrocession_rate.toFixed(1)}%`
                  : '0%'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {rule.min_quantity ?? 1}
              </td>
              <td className="px-4 py-3 text-sm">{getStatusBadge(rule)}</td>
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
  );
}

export function PrixClientsTable({
  rules,
  allRulesCount,
  isLoading,
}: PrixClientsTableProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="text-black">Tarifs Personnalisés</CardTitle>
        <CardDescription>
          {rules.length} prix configuré{rules.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
            <p className="text-gray-600 mt-4">Chargement des prix clients...</p>
          </div>
        ) : rules.length === 0 ? (
          <EmptyState hasRules={allRulesCount > 0} />
        ) : (
          <RulesTable rules={rules} />
        )}
      </CardContent>
    </Card>
  );
}
