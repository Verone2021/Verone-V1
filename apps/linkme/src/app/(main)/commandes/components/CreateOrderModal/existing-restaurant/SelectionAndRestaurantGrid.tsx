'use client';

/**
 * SelectionAndRestaurantGrid - Section 1 du formulaire restaurant existant
 * Sélection de la sélection produits + sélection du restaurant
 *
 * @module SelectionAndRestaurantGrid
 * @since 2026-04-14
 */

import { Check, Loader2, Star, Store } from 'lucide-react';

interface Selection {
  id: string;
  name: string;
  products_count: number;
}

interface Customer {
  id: string;
  name: string;
  city?: string | null;
  email?: string | null;
  customer_type: 'organization' | 'individual';
}

interface SelectionAndRestaurantGridProps {
  selections: Selection[] | undefined;
  selectedSelectionId: string | null;
  onSelectionChange: (id: string) => void;
  customers: Customer[] | undefined;
  customersLoading: boolean;
  selectedCustomerId: string | null;
  onCustomerSelect: (id: string, type: 'organization' | 'individual') => void;
}

export function SelectionAndRestaurantGrid({
  selections,
  selectedSelectionId,
  onSelectionChange,
  customers,
  customersLoading,
  selectedCustomerId,
  onCustomerSelect,
}: SelectionAndRestaurantGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sélection */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">
              Sélection de produits
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {!selections || selections.length === 0 ? (
            <div className="text-center py-6">
              <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucune sélection</p>
            </div>
          ) : (
            selections.map(selection => (
              <button
                key={selection.id}
                onClick={() => onSelectionChange(selection.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedSelectionId === selection.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${selectedSelectionId === selection.id ? 'bg-blue-100' : 'bg-gray-100'}`}
                  >
                    <Star
                      className={`h-4 w-4 ${selectedSelectionId === selection.id ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {selection.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selection.products_count} produit
                      {selection.products_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {selectedSelectionId === selection.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Restaurant */}
      <div className="bg-white border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Restaurant</h3>
          </div>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {customersLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : customers && customers.length > 0 ? (
            customers.map(customer => (
              <button
                key={customer.id}
                onClick={() =>
                  onCustomerSelect(customer.id, customer.customer_type)
                }
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedCustomerId === customer.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${selectedCustomerId === customer.id ? 'bg-blue-100' : 'bg-gray-100'}`}
                  >
                    <Store
                      className={`h-4 w-4 ${selectedCustomerId === customer.id ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {customer.city ?? customer.email ?? 'Pas de détails'}
                    </p>
                  </div>
                </div>
                {selectedCustomerId === customer.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-6">
              <Store className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 text-sm">Aucun restaurant</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
