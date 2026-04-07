'use client';

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
import { Package, Building2, FileText } from 'lucide-react';

import { useRapprochement } from './use-rapprochement';
import { SuccessScreen } from './SuccessScreen';
import { TransactionHeader } from './TransactionHeader';
import { ExistingLinksPanel } from './ExistingLinksPanel';
import { DocumentsTab } from './DocumentsTab';
import { OrdersTab } from './OrdersTab';
import { PurchaseOrdersTab } from './PurchaseOrdersTab';
import type { RapprochementModalProps } from './types';

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
  const r = useRapprochement({
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

        {/* Success confirmation screen */}
        {r.linkSuccess ? (
          <SuccessScreen
            linkSuccess={r.linkSuccess}
            remainingAmount={r.remainingAmount}
            onAddAnother={() => {
              r.setLinkSuccess(null);
              r.setSelectedDocumentId(null);
              r.setSelectedOrderId(null);
              r.setSelectedPurchaseOrderId(null);
              r.setAllocatedAmount('');
              void r.fetchAvailableItems();
            }}
            onClose={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        ) : (
          <>
            <TransactionHeader
              label={label}
              amount={amount}
              counterpartyName={counterpartyName}
              organisationName={organisationName}
            />

            <ExistingLinksPanel
              existingLinks={r.existingLinks}
              totalAllocated={r.totalAllocated}
              remainingAmount={r.remainingAmount}
              onUnlink={r.handleUnlink}
            />

            {/* Tabs */}
            <Tabs
              value={r.activeTab}
              onValueChange={v =>
                r.setActiveTab(v as 'orders' | 'purchase_orders' | 'documents')
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
                  filteredDocuments={r.filteredDocuments}
                  isLoading={r.isLoading}
                  selectedDocumentId={r.selectedDocumentId}
                  searchQuery={r.searchQuery}
                  onSearchChange={r.setSearchQuery}
                  onSelectDocument={(docId, remaining) => {
                    r.setSelectedDocumentId(docId);
                    const defaultAmt = Math.min(r.remainingAmount, remaining);
                    r.setAllocatedAmount(String(defaultAmt.toFixed(2)));
                  }}
                  remainingAmount={r.remainingAmount}
                  allocatedAmount={r.allocatedAmount}
                  onAllocatedAmountChange={r.setAllocatedAmount}
                  isLinking={r.isLinking}
                  onLink={() => void r.handleLinkDocument()}
                />
              </TabsContent>

              <TabsContent value="orders" className="flex-1 min-h-0 mt-4">
                <OrdersTab
                  filteredOrders={r.filteredOrders}
                  suggestions={r.suggestions}
                  isLoading={r.isLoading}
                  selectedOrderId={r.selectedOrderId}
                  searchQuery={r.searchQuery}
                  onSearchChange={r.setSearchQuery}
                  onSelectOrder={(orderId, remaining) => {
                    r.setSelectedOrderId(orderId);
                    const defaultAmt = Math.min(r.remainingAmount, remaining);
                    r.setAllocatedAmount(String(defaultAmt.toFixed(2)));
                  }}
                  onQuickLink={r.handleQuickLink}
                  remainingAmount={r.remainingAmount}
                  allocatedAmount={r.allocatedAmount}
                  onAllocatedAmountChange={r.setAllocatedAmount}
                  isLinking={r.isLinking}
                  onLink={() => void r.handleLinkOrder()}
                />
              </TabsContent>

              <TabsContent
                value="purchase_orders"
                className="flex-1 min-h-0 mt-4"
              >
                <PurchaseOrdersTab
                  filteredPurchaseOrders={r.filteredPurchaseOrders}
                  purchaseOrderSuggestions={r.purchaseOrderSuggestions}
                  isLoading={r.isLoading}
                  selectedPurchaseOrderId={r.selectedPurchaseOrderId}
                  searchQuery={r.searchQuery}
                  onSearchChange={r.setSearchQuery}
                  onSelectPurchaseOrder={(poId, totalTtc) => {
                    r.setSelectedPurchaseOrderId(poId);
                    const defaultAmt = Math.min(r.remainingAmount, totalTtc);
                    r.setAllocatedAmount(String(defaultAmt.toFixed(2)));
                  }}
                  onQuickLinkPurchaseOrder={r.handleQuickLinkPurchaseOrder}
                  remainingAmount={r.remainingAmount}
                  allocatedAmount={r.allocatedAmount}
                  onAllocatedAmountChange={r.setAllocatedAmount}
                  isLinking={r.isLinking}
                  onLink={() => void r.handleLinkPurchaseOrder()}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
