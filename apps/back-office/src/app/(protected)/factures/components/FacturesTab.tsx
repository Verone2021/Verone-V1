'use client';

import { useState } from 'react';
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import type { Invoice, ApiResponse } from './types';
import { InvoicesTable } from './InvoicesTable';

interface FacturesTabProps {
  invoices: Invoice[];
  loading: boolean;
  statusFilter: string;
  onView: (id: string) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onOpenOrder: (orderId: string) => void;
  onOpenOrg: (orgId: string) => void;
  onRapprochement: (invoice: Invoice) => void;
  fetchInvoices: () => void;
}

export function FacturesTab({
  invoices,
  loading,
  statusFilter,
  onView,
  onDownloadPdf,
  onOpenOrder,
  onOpenOrg,
  onRapprochement,
  fetchInvoices,
}: FacturesTabProps) {
  const [invoiceView, setInvoiceView] = useState<
    'drafts' | 'finalized' | 'archived'
  >('finalized');

  return (
    <Tabs
      value={invoiceView}
      onValueChange={v =>
        setInvoiceView(v as 'drafts' | 'finalized' | 'archived')
      }
    >
      <TabsList>
        <TabsTrigger value="drafts">
          Brouillons
          <Badge variant="secondary" className="ml-2">
            {
              invoices.filter(inv => inv.status === 'draft' && !inv.deleted_at)
                .length
            }
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="finalized">
          Finalisees
          <Badge variant="secondary" className="ml-2">
            {
              invoices.filter(inv => inv.status !== 'draft' && !inv.deleted_at)
                .length
            }
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">
          Archives
          <Badge variant="secondary" className="ml-2">
            {invoices.filter(inv => inv.deleted_at).length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="drafts" className="mt-4">
        <InvoicesTable
          invoices={invoices.filter(
            inv =>
              inv.status === 'draft' &&
              !inv.deleted_at &&
              (statusFilter === 'all' || inv.status === statusFilter)
          )}
          loading={loading}
          onView={onView}
          onOpenOrder={orderId => {
            onOpenOrder(orderId);
          }}
          onOpenOrg={orgId => {
            onOpenOrg(orgId);
          }}
          onDownloadPdf={onDownloadPdf}
          isDraft
          onFinalize={async invoice => {
            try {
              const response = await fetch(
                `/api/qonto/invoices/${invoice.id}/finalize`,
                { method: 'POST' }
              );
              const data = (await response.json()) as ApiResponse<unknown>;
              if (!data.success) throw new Error(data.error);
              fetchInvoices();
            } catch (error) {
              console.error('Finalize error:', error);
            }
          }}
          onArchive={async invoice => {
            try {
              const response = await fetch(
                `/api/financial-documents/${invoice.id}/archive`,
                { method: 'POST' }
              );
              const data = (await response.json()) as ApiResponse<unknown>;
              if (!data.success) throw new Error(data.error);
              fetchInvoices();
            } catch (error) {
              console.error('Archive error:', error);
            }
          }}
        />
      </TabsContent>

      <TabsContent value="finalized" className="mt-4">
        <InvoicesTable
          invoices={invoices.filter(
            inv =>
              inv.status !== 'draft' &&
              !inv.deleted_at &&
              (statusFilter === 'all' || inv.status === statusFilter)
          )}
          loading={loading}
          onView={onView}
          onOpenOrder={orderId => {
            onOpenOrder(orderId);
          }}
          onOpenOrg={orgId => {
            onOpenOrg(orgId);
          }}
          onDownloadPdf={onDownloadPdf}
          onRapprochement={onRapprochement}
          isArchived={false}
          onArchive={async invoice => {
            try {
              const response = await fetch(
                `/api/financial-documents/${invoice.id}/archive`,
                { method: 'POST' }
              );
              const data = (await response.json()) as ApiResponse<unknown>;
              if (!data.success) throw new Error(data.error);
              fetchInvoices();
            } catch (error) {
              console.error('Archive error:', error);
            }
          }}
        />
      </TabsContent>

      <TabsContent value="archived" className="mt-4">
        <InvoicesTable
          invoices={invoices.filter(inv => inv.deleted_at)}
          loading={loading}
          onView={onView}
          onOpenOrder={orderId => {
            onOpenOrder(orderId);
          }}
          onOpenOrg={orgId => {
            onOpenOrg(orgId);
          }}
          onDownloadPdf={onDownloadPdf}
          isArchived
          onUnarchive={async invoice => {
            try {
              const response = await fetch(
                `/api/financial-documents/${invoice.id}/unarchive`,
                { method: 'POST' }
              );
              const data = (await response.json()) as ApiResponse<unknown>;
              if (!data.success) throw new Error(data.error);
              fetchInvoices();
            } catch (error) {
              console.error('Unarchive error:', error);
            }
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
