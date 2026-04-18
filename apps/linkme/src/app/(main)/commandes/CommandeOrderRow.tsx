'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  ChevronDown,
  ChevronRight,
  User,
  MapPin,
  Package,
  Pencil,
} from 'lucide-react';

import type { LinkMeOrder } from '../../../hooks/use-linkme-orders';
import { STATUS_LABELS, STATUS_COLORS } from './commandes.constants';

interface CommandeOrderRowProps {
  order: LinkMeOrder;
  isExpanded: boolean;
  canViewCommissions: boolean;
  onToggle: (id: string) => void;
  onOpenDetail: (order: LinkMeOrder, e: React.MouseEvent) => void;
}

export function CommandeOrderRow({
  order,
  isExpanded,
  canViewCommissions,
  onToggle,
  onOpenDetail,
}: CommandeOrderRowProps) {
  const statusColor = STATUS_COLORS[order.status] ?? STATUS_COLORS.draft;

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md hover:border-[#5DBEBB]/30 transition-all">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(order.id)}
      >
        {/* Ligne principale : identifiant + statut + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="text-gray-400 mt-0.5 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#183559] truncate">
                {order.linkme_display_number ?? order.order_number}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {/* Badge statut visible mobile */}
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
          </div>

          {/* Colonne droite : montants + actions */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total TTC</p>
              <p className="font-semibold text-gray-900 text-sm">
                {order.total_ttc.toFixed(2)} €
              </p>
            </div>
            {canViewCommissions && (
              <p className="font-semibold text-[#5DBEBB] text-sm">
                +{order.total_payout_ht.toFixed(2)} €
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {order.status === 'draft' && (
                <Link
                  href={`/commandes/${order.id}/modifier`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:text-white hover:bg-amber-500 border border-amber-400 rounded-lg transition-colors min-h-[36px]"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier
                </Link>
              )}
              <button
                onClick={e => onOpenDetail(order, e)}
                className="px-2.5 py-1.5 text-xs font-medium text-[#5DBEBB] hover:text-white hover:bg-[#5DBEBB] border border-[#5DBEBB] rounded-lg transition-colors min-h-[36px]"
              >
                Détails
              </button>
            </div>
          </div>
        </div>

        {/* Infos client — visible à partir de sm */}
        <div className="hidden sm:flex items-center gap-4 mt-3 pl-8 text-sm text-gray-600">
          <span>{order.customer_name}</span>
          {(order.status === 'pending_approval' ||
            order.status === 'draft') && (
            <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
              En attente validation Vérone
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-start gap-6 text-sm mb-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900">
                  {order.customer_name}
                </span>
                {order.customer_email && (
                  <span className="text-gray-500 ml-2">
                    {order.customer_email}
                  </span>
                )}
              </div>
            </div>
            {(Boolean(order.customer_address) ||
              Boolean(order.customer_city)) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">
                  {order.customer_address && `${order.customer_address}, `}
                  {order.customer_postal_code} {order.customer_city}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 ml-auto text-sm">
              <span className="text-gray-500">
                HT:{' '}
                <span className="text-gray-900 font-medium">
                  {order.total_ht.toFixed(2)} €
                </span>
              </span>
              <span className="text-gray-500">
                TTC:{' '}
                <span className="text-gray-900 font-semibold">
                  {order.total_ttc.toFixed(2)} €
                </span>
              </span>
              {canViewCommissions && (
                <span className="text-[#5DBEBB] font-semibold">
                  +{order.total_payout_ht.toFixed(2)} €
                </span>
              )}
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-xs text-gray-500">
                    <th className="px-3 py-2 text-left">Produit</th>
                    <th className="px-3 py-2 text-center w-16">Qté</th>
                    <th className="px-3 py-2 text-right w-24">Prix HT</th>
                    <th className="px-3 py-2 text-right w-24">Total HT</th>
                    {canViewCommissions && (
                      <th className="px-3 py-2 text-right w-24">Marge</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product_name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover w-10 h-10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">
                              {item.product_name}
                            </span>
                            {item.product_sku && (
                              <p className="text-gray-400 text-xs">
                                {item.product_sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {item.unit_price_ht.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {item.total_ht.toFixed(2)} €
                      </td>
                      {canViewCommissions && (
                        <td className="px-3 py-2 text-right font-medium text-[#5DBEBB]">
                          {item.affiliate_margin > 0
                            ? `+${item.affiliate_margin.toFixed(2)} €`
                            : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
