'use client';

import { useState } from 'react';

import Image from 'next/image';

import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';

import { useLinkMeOrders } from '../../hooks/use-linkme-orders';
import { useUserAffiliate } from '../../lib/hooks/use-user-selection';

// Mapping des statuts DB → Labels utilisateur
const STATUS_LABELS: Record<string, string> = {
  draft: 'En attente',
  validated: 'Validé',
  shipped: 'Expédié',
  delivered: 'Livré',
  cancelled: 'Annulé',
  partially_shipped: 'Expédition partielle',
};

// Interface pour les sous-totaux TVA
interface ITaxSubtotal {
  rate: number; // Taux de TVA (0.2 = 20%)
  totalHT: number; // Total HT des items à ce taux
  totalTVA: number; // Montant TVA (totalHT * rate)
  totalTTC: number; // Total TTC (totalHT + totalTVA)
}

export default function VentesPage(): JSX.Element {
  // 1. Récupérer l'affilié connecté
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  // 2. Récupérer les commandes de l'affilié
  const {
    data: orders,
    isLoading: ordersLoading,
    error,
  } = useLinkMeOrders(affiliate?.id ?? null);

  // 3. État pour gérer les commandes expandées
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const isLoading = affiliateLoading || ordersLoading;

  // Toggle expand/collapse d'une commande
  const toggleOrder = (orderId: string): void => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold mb-1">Mes Commandes</h1>
        <p className="text-gray-600 text-sm">Toutes vos commandes clients</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="flex gap-3">
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>Toutes les périodes</option>
            <option>Ce mois</option>
            <option>Ce trimestre</option>
            <option>Cette année</option>
          </select>
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>Tous les statuts</option>
            <option>En cours</option>
            <option>Livrée</option>
            <option>Annulée</option>
          </select>
        </div>
      </div>

      {/* État de chargement */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            Erreur lors du chargement des commandes. Veuillez réessayer.
          </p>
        </div>
      )}

      {/* Aucune commande */}
      {!isLoading && !error && (!orders || orders.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Aucune commande pour le moment.</p>
        </div>
      )}

      {/* Liste commandes */}
      {!isLoading && !error && orders && orders.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {orders.map(order => {
            const isExpanded = expandedOrders.has(order.id);
            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                {/* Header de la commande - Design Dribbble ultra-moderne */}
                <div
                  className="p-2.5 cursor-pointer hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 last:border-0"
                  onClick={() => toggleOrder(order.id)}
                >
                  {/* Ligne unique: Tout sur une ligne comme Dribbble */}
                  <div className="flex items-center gap-3">
                    {/* Chevron */}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    )}

                    {/* Order Number */}
                    <span className="text-xs font-semibold text-gray-900 min-w-[90px]">
                      #{order.order_number}
                    </span>

                    {/* Status Badge */}
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>

                    {/* Client - petite taille */}
                    <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0">
                      {order.customer_name}
                    </span>

                    {/* Montants alignés à droite */}
                    <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
                      <span className="text-gray-600">
                        {order.total_ttc.toFixed(2)}€
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-green-600">
                        +{order.total_affiliate_margin.toFixed(2)}€
                      </span>
                    </div>

                    {/* Date compacte */}
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Détail des produits - visible uniquement si expanded */}
                {isExpanded && order.items && order.items.length > 0 && (
                  <div className="bg-gray-50 border-t px-4 py-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      Détail des produits
                    </h4>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div
                          key={item.id}
                          className="bg-white rounded border p-3 text-xs"
                        >
                          <div className="flex gap-3">
                            {/* Image produit */}
                            {item.product_image_url && (
                              <Image
                                src={item.product_image_url}
                                alt={item.product_name}
                                width={48}
                                height={48}
                                className="object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              {/* Nom produit */}
                              <div className="font-medium text-gray-900 truncate">
                                {item.product_name}
                              </div>
                              {/* SKU */}
                              {item.product_sku && (
                                <div className="text-gray-500 text-[10px] mt-0.5">
                                  SKU: {item.product_sku}
                                </div>
                              )}
                              {/* Quantité et prix unitaire */}
                              <div className="flex items-center gap-4 mt-1 text-gray-600">
                                <span>Qté: {item.quantity}</span>
                                <span>
                                  {item.unit_price_ht.toFixed(2)} € HT
                                </span>
                              </div>
                              {/* Taux de TVA */}
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                TVA: {(item.tax_rate * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-1">
                              {/* Totaux */}
                              <div>
                                <div className="text-[10px] text-gray-500">
                                  Total HT: {item.total_ht.toFixed(2)} €
                                </div>
                                <div className="text-xs font-semibold text-gray-900">
                                  Total TTC:{' '}
                                  {(
                                    item.total_ht *
                                    (1 + item.tax_rate)
                                  ).toFixed(2)}{' '}
                                  €
                                </div>
                              </div>
                              {/* Marges affilié */}
                              {item.affiliate_margin > 0 ? (
                                <div className="border-t pt-1">
                                  <div className="text-[10px] text-orange-500">
                                    Marge HT: {item.affiliate_margin.toFixed(2)}{' '}
                                    €
                                  </div>
                                  <div className="text-xs text-orange-600 font-medium">
                                    Marge TTC:{' '}
                                    {(
                                      item.affiliate_margin *
                                      (1 + item.tax_rate)
                                    ).toFixed(2)}{' '}
                                    €
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-[10px] border-t pt-1">
                                  Sans marge
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sous-totaux TVA par taux */}
                    {(() => {
                      // Grouper par tax_rate
                      const taxSubtotals = order.items.reduce(
                        (acc, item) => {
                          const rate = item.tax_rate;
                          acc[rate] ??= {
                            rate,
                            totalHT: 0,
                            totalTVA: 0,
                            totalTTC: 0,
                          };
                          acc[rate].totalHT += item.total_ht;
                          acc[rate].totalTVA += item.total_ht * rate;
                          acc[rate].totalTTC += item.total_ht * (1 + rate);
                          return acc;
                        },
                        {} as Record<number, ITaxSubtotal>
                      );

                      const subtotals = Object.values(taxSubtotals).sort(
                        (a, b) => b.rate - a.rate
                      );

                      return (
                        <div className="mt-4 pt-3 border-t border-gray-300">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">
                            Sous-totaux TVA
                          </h5>
                          {subtotals.map(sub => (
                            <div
                              key={sub.rate}
                              className="flex justify-between items-center text-xs mb-1"
                            >
                              <span className="text-gray-600">
                                TVA {(sub.rate * 100).toFixed(1)}%
                              </span>
                              <div className="flex gap-4">
                                <span className="text-gray-700">
                                  Base HT: {sub.totalHT.toFixed(2)} €
                                </span>
                                <span className="text-gray-700">
                                  TVA: {sub.totalTVA.toFixed(2)} €
                                </span>
                                <span className="font-semibold text-gray-900">
                                  TTC: {sub.totalTTC.toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
