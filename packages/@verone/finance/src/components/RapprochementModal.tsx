'use client';

/**
 * RapprochementModal - Modal pour le rapprochement bancaire
 *
 * Permet de lier une transaction bancaire à un document ou une commande.
 * Propose automatiquement des suggestions basées sur:
 * - Montant similaire (tolérance 5%)
 * - Date proche (±30 jours)
 * - Organisation/client correspondant
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@verone/ui';
import { FileText, Package, Building2 } from 'lucide-react';

import { DocumentsTab } from './rapprochement-modal/DocumentsTab';
import { ExistingLinksPanel } from './rapprochement-modal/ExistingLinksPanel';
import { OrdersTab } from './rapprochement-modal/OrdersTab';
import { PurchaseOrdersTab } from './rapprochement-modal/PurchaseOrdersTab';
import { SuccessScreen } from './rapprochement-modal/SuccessScreen';
import { SuggestionsPanel } from './rapprochement-modal/SuggestionsPanel';
import { TransactionInfoPanel } from './rapprochement-modal/TransactionInfoPanel';
import { useRapprochementModal } from './rapprochement-modal/use-rapprochement-modal';
import type { RapprochementModalProps } from './rapprochement-modal/types';

export function RapprochementModal({
  open,
  onOpenChange,
  transactionId,
  transactionQontoId,
  label,
  amount,
  counterpartyName,
  organisationName,
  organisationId,
  onSuccess,
}: RapprochementModalProps) {
  const s = useRapprochementModal({
    open,
    transactionId,
    transactionQontoId,
    amount,
    counterpartyName,
    organisationId,
    onSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Rapprocher Commande
          </DialogTitle>
          <DialogDescription>
            Liez cette transaction à une commande ou un document
          </DialogDescription>
        </DialogHeader>

        {s.linkSuccess ? (
          <SuccessScreen
            linkSuccess={s.linkSuccess}
            remainingAmount={s.remainingAmount}
            onAddAnother={() => {
              s.setLinkSuccess(null);
              s.setSelectedDocumentId(null);
              s.setSelectedOrderId(null);
              s.setSelectedPurchaseOrderId(null);
              s.setAllocatedAmount('');
              void s.fetchAvailableItems();
            }}
            onClose={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        ) : (
          <>
            <TransactionInfoPanel
              label={label}
              amount={amount}
              counterpartyName={counterpartyName}
              organisationName={organisationName}
            />

            <ExistingLinksPanel
              existingLinks={s.existingLinks}
              totalAllocated={s.totalAllocated}
              remainingAmount={s.remainingAmount}
              onUnlink={linkId => {
                void s.handleUnlink(linkId).catch(err => {
                  console.error('[RapprochementModal] Unlink failed:', err);
                });
              }}
            />

            <SuggestionsPanel
              suggestions={s.suggestions}
              selectedOrderId={s.selectedOrderId}
              onQuickLink={orderId => {
                void s.handleQuickLink(orderId);
              }}
            />

            <Tabs
              value={s.activeTab}
              onValueChange={v =>
                s.setActiveTab(v as 'orders' | 'purchase_orders' | 'documents')
              }
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="orders" className="gap-1 text-xs px-2">
                  <Package className="h-3 w-3" />
                  Clients
                </TabsTrigger>
                <TabsTrigger
                  value="purchase_orders"
                  className="gap-1 text-xs px-2"
                >
                  <Building2 className="h-3 w-3" />
                  Fournisseurs
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1 text-xs px-2">
                  <FileText className="h-3 w-3" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="flex-1 min-h-0 mt-4">
                <DocumentsTab
                  isLoading={s.isLoading}
                  filteredDocuments={s.filteredDocuments}
                  selectedDocumentId={s.selectedDocumentId}
                  allocatedAmount={s.allocatedAmount}
                  remainingAmount={s.remainingAmount}
                  searchQuery={s.searchQuery}
                  isLinking={s.isLinking}
                  onSelectDocument={(id, amt) => {
                    s.setSelectedDocumentId(id);
                    s.setAllocatedAmount(String(amt.toFixed(2)));
                  }}
                  onSearchChange={s.setSearchQuery}
                  onAllocatedAmountChange={s.setAllocatedAmount}
                  onLink={() => {
                    void s.handleLinkDocument().catch(err => {
                      console.error(
                        '[RapprochementModal] Link document failed:',
                        err
                      );
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="orders" className="flex-1 min-h-0 mt-4">
                <OrdersTab
                  isLoading={s.isLoading}
                  filteredOrders={s.filteredOrders}
                  selectedOrderId={s.selectedOrderId}
                  allocatedAmount={s.allocatedAmount}
                  remainingAmount={s.remainingAmount}
                  searchQuery={s.searchQuery}
                  isLinking={s.isLinking}
                  onSelectOrder={(id, amt) => {
                    s.setSelectedOrderId(id);
                    s.setAllocatedAmount(String(amt.toFixed(2)));
                  }}
                  onSearchChange={s.setSearchQuery}
                  onAllocatedAmountChange={s.setAllocatedAmount}
                  onLink={() => {
                    void s.handleLinkOrder().catch(err => {
                      console.error(
                        '[RapprochementModal] Link order failed:',
                        err
                      );
                    });
                  }}
                />
              </TabsContent>

              <TabsContent
                value="purchase_orders"
                className="flex-1 min-h-0 mt-4"
              >
                <PurchaseOrdersTab
                  isLoading={s.isLoading}
                  filteredPurchaseOrders={s.filteredPurchaseOrders}
                  purchaseOrderSuggestions={s.purchaseOrderSuggestions}
                  selectedPurchaseOrderId={s.selectedPurchaseOrderId}
                  allocatedAmount={s.allocatedAmount}
                  remainingAmount={s.remainingAmount}
                  searchQuery={s.searchQuery}
                  isLinking={s.isLinking}
                  onSelectPurchaseOrder={(id, amt) => {
                    s.setSelectedPurchaseOrderId(id);
                    s.setAllocatedAmount(String(amt.toFixed(2)));
                  }}
                  onSearchChange={s.setSearchQuery}
                  onAllocatedAmountChange={s.setAllocatedAmount}
                  onLink={() => {
                    void s.handleLinkPurchaseOrder().catch(err => {
                      console.error(
                        '[RapprochementModal] Link PO failed:',
                        err
                      );
                    });
                  }}
                  onQuickLink={id => {
                    void s.handleQuickLinkPurchaseOrder(id);
                  }}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
