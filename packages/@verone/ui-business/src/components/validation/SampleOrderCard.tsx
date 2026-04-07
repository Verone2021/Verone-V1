'use client';

import {
  Badge,
  ButtonV2,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from '@verone/ui';
import {
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Euro,
  Eye,
  Package,
  Truck,
  X,
} from 'lucide-react';

import { getStatusBadge, formatDate } from './sample-order-validation.helpers';
import type { SampleOrder } from './sample-order-validation.types';
import { SampleOrderItemRow } from './SampleOrderItemRow';

interface SampleOrderCardProps {
  order: SampleOrder;
  selectedItems: string[];
  validationNotes: string;
  onValidationNotesChange: (value: string) => void;
  onToggleItem: (id: string, checked: boolean) => void;
  onApproveClick: (order: SampleOrder) => void;
  onMarkDelivered: (orderId: string) => void;
  onValidateSamples: (
    ids: string[],
    result: 'approved' | 'rejected',
    notes?: string
  ) => Promise<void>;
  onTransferToCatalog: (ids: string[]) => Promise<void>;
}

export function SampleOrderCard({
  order,
  selectedItems,
  validationNotes,
  onValidationNotesChange,
  onToggleItem,
  onApproveClick,
  onMarkDelivered,
  onValidateSamples,
  onTransferToCatalog,
}: SampleOrderCardProps) {
  const orderSelectedItems = selectedItems.filter(id =>
    order.sample_order_items.some(item => item.product_draft_id === id)
  );

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
      {/* En-tête commande */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Building className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-black text-lg">
              {order.supplier.name}
            </h3>
            {getStatusBadge(order.status)}
            <Badge variant="outline" className="text-xs">
              {order.sample_order_items.length} item(s)
            </Badge>
          </div>
          {order.supplier.contact_email && (
            <div className="text-sm text-gray-600">
              📧 {order.supplier.contact_email}
              {order.supplier.contact_phone &&
                ` • 📞 ${order.supplier.contact_phone}`}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <ButtonV2 variant="outline" size="sm" className="border-gray-300">
            <Eye className="h-4 w-4" />
          </ButtonV2>
          {order.status === 'pending_approval' && (
            <Dialog>
              <DialogTrigger asChild>
                <ButtonV2
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApproveClick(order)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </ButtonV2>
              </DialogTrigger>
            </Dialog>
          )}
          {order.status === 'approved' && (
            <ButtonV2
              size="sm"
              onClick={() => onMarkDelivered(order.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Truck className="h-4 w-4 mr-2" />
              Marquer livré
            </ButtonV2>
          )}
        </div>
      </div>

      {/* Informations commande */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Euro className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Coût estimé:</span>
          <span className="font-medium text-black">
            {order.estimated_total_cost}€
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Délai:</span>
          <span className="text-black">
            {order.expected_delivery_days} jours
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Créée le:</span>
          <span className="text-black">{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* Liste des items */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">
          Produits ({order.sample_order_items.length})
        </h4>
        {order.sample_order_items.map(item => (
          <SampleOrderItemRow
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.product_draft_id)}
            onToggle={onToggleItem}
          />
        ))}
      </div>

      {/* Actions validation échantillons */}
      {order.status === 'delivered' && orderSelectedItems.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
          <div className="text-sm text-gray-600">
            {orderSelectedItems.length} échantillon(s) sélectionné(s)
          </div>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <ButtonV2
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </ButtonV2>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejeter les échantillons</DialogTitle>
                  <DialogDescription>
                    Les échantillons sélectionnés seront marqués comme rejetés
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Raison du rejet..."
                  value={validationNotes}
                  onChange={e => onValidationNotesChange(e.target.value)}
                  className="border-black focus:ring-black"
                />
                <DialogFooter>
                  <ButtonV2
                    variant="outline"
                    onClick={() => onValidationNotesChange('')}
                  >
                    Annuler
                  </ButtonV2>
                  <ButtonV2
                    onClick={() => {
                      void onValidateSamples(
                        orderSelectedItems,
                        'rejected',
                        validationNotes
                      );
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmer Rejet
                  </ButtonV2>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <ButtonV2
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider & Transférer
                </ButtonV2>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Valider et transférer au catalogue</DialogTitle>
                  <DialogDescription>
                    Les échantillons seront validés et les produits ajoutés au
                    catalogue
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Notes de validation (optionnel)..."
                  value={validationNotes}
                  onChange={e => onValidationNotesChange(e.target.value)}
                  className="border-black focus:ring-black"
                />
                <DialogFooter>
                  <ButtonV2
                    variant="outline"
                    onClick={() => onValidationNotesChange('')}
                  >
                    Annuler
                  </ButtonV2>
                  <ButtonV2
                    onClick={() => {
                      void (async () => {
                        await onValidateSamples(
                          orderSelectedItems,
                          'approved',
                          validationNotes
                        );
                        await onTransferToCatalog(orderSelectedItems);
                      })();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Valider & Transférer
                  </ButtonV2>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}

export function SampleOrderEmptyState() {
  return (
    <div className="text-center py-8">
      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">
        Aucune commande d&apos;échantillons en cours
      </p>
      <p className="text-sm text-gray-500">
        Les nouvelles commandes apparaîtront ici
      </p>
    </div>
  );
}
