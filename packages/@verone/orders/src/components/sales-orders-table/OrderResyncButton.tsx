'use client';

/**
 * Bouton "Synchroniser devis/facture" sur la liste commandes.
 *
 * [BO-RLS-PERF-002 — révision 2026-05-07]
 * Au clic, ouvre le modal de création de devis ou de facture brouillon depuis
 * la commande (modaux existants `QuoteCreateFromOrderModal` /
 * `InvoiceCreateFromOrderModal`), pré-rempli avec les données de la commande.
 * L'utilisateur clique "Valider" → le devis/facture est régénéré côté Qonto +
 * la trace locale est créée propre.
 *
 * Comportement:
 * - Si seul devis désync → "Synchroniser devis"
 * - Si seule facture brouillon désync → "Synchroniser facture brouillon"
 * - Si les deux désync → "Synchroniser devis et facture brouillon" (modal
 *   devis ouvert d'abord, puis modal facture brouillon après succès)
 *
 * Les modals appellent les routes existantes /api/qonto/quotes (POST) ou
 * /api/qonto/invoices (POST) qui gèrent l'écrasement du draft existant
 * (auto-overwrite via duplicate-guard) et la création de l'entrée locale.
 */

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import {
  QuoteCreateFromOrderModal,
  InvoiceCreateFromOrderModal,
} from '@verone/finance/components';
import { useToast } from '@verone/common/hooks';

import type { SalesOrder } from '../../hooks/use-sales-orders';

interface OrderResyncButtonProps {
  order: SalesOrder;
  onResynced?: () => void;
}

export function OrderResyncButton({
  order,
  onResynced,
}: OrderResyncButtonProps): React.ReactNode {
  const { toast } = useToast();
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [proformaModalOpen, setProformaModalOpen] = useState(false);
  const [pendingProforma, setPendingProforma] = useState(false);

  if (!order.has_desync_draft) return null;

  const needQuote = order.desync_quote === true;
  const needProforma = order.desync_proforma === true;

  // Label compact: juste le type du document à synchroniser
  let label = 'Synchroniser';
  if (needQuote && needProforma) label = 'Devis + facture';
  else if (needQuote) label = 'Devis';
  else if (needProforma) label = 'Facture brouillon';

  // Descriptif d'écart à afficher à côté du bouton
  const orderTotal = order.total_ttc ?? null;
  const fmt = (n: number): string =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(n);
  const diffParts: string[] = [];
  if (
    needQuote &&
    order.desync_quote_doc_total !== null &&
    order.desync_quote_doc_total !== undefined &&
    orderTotal !== null
  ) {
    const diff = Number(order.desync_quote_doc_total) - Number(orderTotal);
    const sign = diff > 0 ? '+' : '';
    diffParts.push(
      `Devis ${fmt(Number(order.desync_quote_doc_total))} (${sign}${fmt(diff)})`
    );
  } else if (needQuote) {
    diffParts.push('Devis sans trace locale');
  }
  if (
    needProforma &&
    order.desync_proforma_doc_total !== null &&
    order.desync_proforma_doc_total !== undefined &&
    orderTotal !== null
  ) {
    const diff = Number(order.desync_proforma_doc_total) - Number(orderTotal);
    const sign = diff > 0 ? '+' : '';
    diffParts.push(
      `Facture ${fmt(Number(order.desync_proforma_doc_total))} (${sign}${fmt(diff)})`
    );
  } else if (needProforma) {
    diffParts.push('Facture sans trace locale');
  }
  const description = diffParts.join(' · ');

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (needQuote) {
      setPendingProforma(needProforma);
      setQuoteModalOpen(true);
    } else if (needProforma) {
      setProformaModalOpen(true);
    }
  };

  // SalesOrder contient les champs requis (id, order_number, total_*, billing_*,
  // organisations, sales_order_items, etc.). Cast structurel via unknown.
  const orderForModal = order as unknown as Parameters<
    typeof QuoteCreateFromOrderModal
  >[0]['order'];

  const handleQuoteSuccess = (): void => {
    setQuoteModalOpen(false);
    toast({
      title: 'Devis régénéré',
      description: `Devis aligné avec la commande ${order.order_number}.`,
    });
    if (pendingProforma) {
      setPendingProforma(false);
      // Petite latence pour laisser le 1er modal se fermer proprement
      setTimeout(() => setProformaModalOpen(true), 200);
    } else {
      onResynced?.();
    }
  };

  const handleProformaSuccess = (): void => {
    setProformaModalOpen(false);
    toast({
      title: 'Facture brouillon régénérée',
      description: `Facture alignée avec la commande ${order.order_number}.`,
    });
    onResynced?.();
  };

  const isLoading = quoteModalOpen || proformaModalOpen;

  return (
    <>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-50 px-1.5 py-0 text-[10px] leading-4 font-medium text-amber-800 hover:bg-amber-100 hover:border-amber-500 disabled:opacity-60 disabled:cursor-wait transition-colors"
          title={`Cliquer pour ouvrir le modal pré-rempli depuis la commande ${order.order_number}.`}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {label}
        </button>
        {description && (
          <span className="text-[10px] text-amber-700/80 truncate">
            {description}
          </span>
        )}
      </span>

      {needQuote && quoteModalOpen && (
        <QuoteCreateFromOrderModal
          order={orderForModal}
          open={quoteModalOpen}
          onOpenChange={open => {
            if (!open) {
              setQuoteModalOpen(false);
              setPendingProforma(false);
            }
          }}
          onSuccess={handleQuoteSuccess}
        />
      )}

      {needProforma && proformaModalOpen && (
        <InvoiceCreateFromOrderModal
          order={orderForModal}
          open={proformaModalOpen}
          onOpenChange={open => {
            if (!open) setProformaModalOpen(false);
          }}
          onSuccess={handleProformaSuccess}
        />
      )}
    </>
  );
}
