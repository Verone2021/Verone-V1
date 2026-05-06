'use client';

import { useState } from 'react';

import { RapprochementModal } from '@verone/finance/components';
import { QuickPurchaseOrderModal } from '@verone/orders/components/modals';
import {
  AlertTriangle,
  EyeOff,
  Link2,
  Loader2,
  Package,
  Truck,
} from 'lucide-react';

import { MessagesTabsBar } from '@/components/messages-tabs-bar';

import {
  CategoryCard,
  EmptyState,
  MoreItemsLink,
} from './components/category-card';
import {
  CATEGORIES,
  formatDate,
  formatCurrency,
  formatDateWithYear,
} from './components/constants';
import { ItemRow } from './components/item-row';
import { useMessagesItems } from './hooks/use-messages-items';

export default function MessagesHubPage() {
  const items = useMessagesItems();

  // Modal rapprochement paiements
  const [rapData, setRapData] = useState({
    open: false,
    transactionId: '',
    label: '',
    amount: 0,
    counterpartyName: '',
  });

  // Modal commande fournisseur (stock)
  const [poModal, setPoModal] = useState({
    open: false,
    productId: '',
    shortageQuantity: 0,
  });

  if (items.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  const totalToTreat =
    items.paiements.count +
    items.commandes.count +
    items.expeditions.count +
    items.stock.count +
    items.approbations.count +
    items.sourcing.count +
    items.consultations.count +
    items.formulaires.count +
    items.finance.count +
    items.organisations.count;

  const catConfig = (key: string) => CATEGORIES.find(c => c.key === key)!;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <MessagesTabsBar />
      <div className="w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Centre de traitement
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Actions en attente — donnees en temps reel
          </p>
        </div>

        {totalToTreat > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-900">
              {totalToTreat} action{totalToTreat > 1 ? 's' : ''} a traiter
            </span>
          </div>
        )}

        {/* Grille 10 categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Paiements ── */}
          <CategoryCard
            config={catConfig('paiements')}
            count={items.paiements.count}
          >
            {items.paiements.items.length === 0 ? (
              <EmptyState config={catConfig('paiements')} />
            ) : (
              items.paiements.items.map(tx => (
                <ItemRow
                  key={tx.id}
                  href={`/finance/transactions/${tx.id}`}
                  title={tx.counterparty_name ?? tx.label ?? 'Transaction'}
                  subtitle={`${tx.side === 'credit' ? '+' : '-'}${formatCurrency(tx.amount)}`}
                  meta={formatDateWithYear(tx.emitted_at)}
                  borderColor={
                    tx.side === 'credit' ? 'border-green-300' : 'border-red-300'
                  }
                  actions={
                    <>
                      <button
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        onClick={e => {
                          e.stopPropagation();
                          setRapData({
                            open: true,
                            transactionId: tx.id,
                            label: tx.label ?? '',
                            amount: tx.amount,
                            counterpartyName: tx.counterparty_name ?? '',
                          });
                        }}
                        title="Rapprocher"
                      >
                        <Link2 className="h-3 w-3" /> Rapprocher
                      </button>
                      <button
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                        onClick={e => {
                          e.stopPropagation();
                          void items
                            .ignoreTransaction(tx.id)
                            .catch(console.error);
                        }}
                        title="Ignorer cette transaction"
                      >
                        <EyeOff className="h-3 w-3" /> Ignorer
                      </button>
                    </>
                  }
                />
              ))
            )}
            <MoreItemsLink
              count={items.paiements.count}
              href="/finance/transactions?reconciled=false"
            />
          </CategoryCard>

          {/* ── Commandes (draft) ── */}
          <CategoryCard
            config={catConfig('commandes')}
            count={items.commandes.count}
          >
            {items.commandes.items.length === 0 ? (
              <EmptyState config={catConfig('commandes')} />
            ) : (
              items.commandes.items.map(o => (
                <ItemRow
                  key={o.id}
                  href={`/commandes/clients/${o.id}`}
                  title={`${o.order_number} — ${formatCurrency(o.total_ttc)}`}
                  subtitle={o.customer_name ?? 'Client'}
                  meta={formatDate(o.created_at)}
                  borderColor="border-blue-300"
                />
              ))
            )}
            <MoreItemsLink
              count={items.commandes.count}
              href="/commandes/clients"
            />
          </CategoryCard>

          {/* ── Expeditions ── */}
          <CategoryCard
            config={catConfig('expeditions')}
            count={items.expeditions.count}
          >
            {items.expeditions.items.length === 0 ? (
              <EmptyState config={catConfig('expeditions')} />
            ) : (
              items.expeditions.items.map(o => (
                <ItemRow
                  key={o.id}
                  href={`/stocks/expeditions`}
                  title={`${o.order_number} — ${o.customer_name ?? 'Client'}`}
                  subtitle={
                    o.status === 'validated'
                      ? 'A expedier'
                      : 'Partiellement expediee'
                  }
                  meta={formatDate(o.created_at)}
                  borderColor="border-indigo-300"
                  actions={
                    <a
                      href="/stocks/expeditions"
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <Truck className="h-3 w-3" /> Expedier
                    </a>
                  }
                />
              ))
            )}
            <MoreItemsLink
              count={items.expeditions.count}
              href="/stocks/expeditions"
            />
          </CategoryCard>

          {/* ── Stock ── */}
          <CategoryCard config={catConfig('stock')} count={items.stock.count}>
            {items.stock.items.length === 0 ? (
              <EmptyState config={catConfig('stock')} />
            ) : (
              items.stock.items.map(a => (
                <ItemRow
                  key={a.id}
                  href={`/stocks/alertes?product=${a.product_id}`}
                  title={a.product_name}
                  subtitle={`${a.sku} — Stock: ${a.stock_real}`}
                  borderColor={
                    a.alert_type === 'out_of_stock'
                      ? 'border-red-400'
                      : a.alert_type === 'critical'
                        ? 'border-orange-400'
                        : 'border-yellow-400'
                  }
                  actions={
                    <button
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      onClick={e => {
                        e.stopPropagation();
                        setPoModal({
                          open: true,
                          productId: a.product_id,
                          shortageQuantity: a.shortage_quantity ?? 1,
                        });
                      }}
                      title="Commander chez le fournisseur"
                    >
                      <Package className="h-3 w-3" /> Commander
                    </button>
                  }
                />
              ))
            )}
            <MoreItemsLink count={items.stock.count} href="/stocks/alertes" />
          </CategoryCard>

          {/* ── Approbations LinkMe ── */}
          <CategoryCard
            config={catConfig('approbations')}
            count={items.approbations.count}
          >
            {items.approbations.items.length === 0 ? (
              <EmptyState config={catConfig('approbations')} />
            ) : (
              items.approbations.items.map(o => (
                <ItemRow
                  key={o.id}
                  href={`/canaux-vente/linkme/commandes/${o.id}`}
                  title={`${o.order_number} — ${formatCurrency(o.total_ttc)}`}
                  subtitle={o.customer_name ?? 'Affilie'}
                  meta={formatDate(o.created_at)}
                  borderColor="border-red-300"
                />
              ))
            )}
            <MoreItemsLink
              count={items.approbations.count}
              href="/canaux-vente/linkme/approbations"
            />
          </CategoryCard>

          {/* ── Sourcing Produit ── */}
          <CategoryCard
            config={catConfig('sourcing')}
            count={items.sourcing.count}
          >
            {items.sourcing.items.length === 0 ? (
              <EmptyState config={catConfig('sourcing')} />
            ) : (
              items.sourcing.items.map(p => (
                <ItemRow
                  key={p.id}
                  href={`/produits/sourcing/produits/${p.id}`}
                  title={p.name}
                  subtitle={`${p.sku} — ${p.product_status === 'draft' ? 'En recherche' : 'Echantillon commande'}${!p.supplier_id ? ' — Fournisseur manquant' : ''}`}
                  meta={formatDate(p.created_at)}
                  borderColor={
                    !p.supplier_id ? 'border-red-300' : 'border-violet-300'
                  }
                />
              ))
            )}
            <MoreItemsLink
              count={items.sourcing.count}
              href="/produits/sourcing"
            />
          </CategoryCard>

          {/* ── Consultations Client ── */}
          <CategoryCard
            config={catConfig('consultations')}
            count={items.consultations.count}
          >
            {items.consultations.items.length === 0 ? (
              <EmptyState config={catConfig('consultations')} />
            ) : (
              items.consultations.items.map(c => {
                const clientName =
                  c.organisation?.trade_name ??
                  c.organisation?.legal_name ??
                  c.client_email;
                return (
                  <ItemRow
                    key={c.id}
                    href={`/consultations/${c.id}`}
                    title={clientName}
                    subtitle={
                      c.descriptif.length > 60
                        ? `${c.descriptif.slice(0, 60)}...`
                        : c.descriptif
                    }
                    meta={formatDate(c.created_at)}
                    borderColor={
                      c.status === 'en_attente'
                        ? 'border-orange-300'
                        : 'border-cyan-300'
                    }
                  />
                );
              })
            )}
            <MoreItemsLink
              count={items.consultations.count}
              href="/consultations?status=en_attente,en_cours"
            />
          </CategoryCard>

          {/* ── Formulaires ── */}
          <CategoryCard
            config={catConfig('formulaires')}
            count={items.formulaires.count}
          >
            {items.formulaires.items.length === 0 ? (
              <EmptyState config={catConfig('formulaires')} />
            ) : (
              items.formulaires.items.map(f => (
                <ItemRow
                  key={f.id}
                  href={
                    f.source_type === 'form'
                      ? `/prises-contact/${f.id}`
                      : `/canaux-vente/linkme/commandes`
                  }
                  title={f.name || f.email}
                  subtitle={f.subject}
                  meta={formatDate(f.created_at)}
                  borderColor="border-teal-300"
                />
              ))
            )}
            <MoreItemsLink
              count={items.formulaires.count}
              href="/prises-contact"
            />
          </CategoryCard>

          {/* ── Finance ── */}
          <CategoryCard
            config={catConfig('finance')}
            count={items.finance.count}
          >
            {items.finance.items.length === 0 ? (
              <EmptyState config={catConfig('finance')} />
            ) : (
              items.finance.items.map(d => (
                <ItemRow
                  key={d.id}
                  href={`/factures`}
                  title={`${d.document_number ?? 'Brouillon'} — ${d.partner_name}`}
                  subtitle={`${formatCurrency(d.total_ttc)} — ${d.document_type === 'customer_invoice' ? 'Facture client' : d.document_type === 'supplier_invoice' ? 'Facture fournisseur' : 'Document'}`}
                  meta={
                    d.is_overdue
                      ? `${d.days_overdue}j retard`
                      : d.status === 'draft'
                        ? 'Brouillon'
                        : 'En cours'
                  }
                  borderColor={
                    d.is_overdue
                      ? 'border-red-400'
                      : d.status === 'draft'
                        ? 'border-amber-300'
                        : 'border-amber-200'
                  }
                  actions={
                    d.is_overdue ? (
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                        {d.days_overdue}j en retard
                      </span>
                    ) : undefined
                  }
                />
              ))
            )}
            <MoreItemsLink count={items.finance.count} href="/factures" />
          </CategoryCard>

          {/* ── Organisations ── */}
          <CategoryCard
            config={catConfig('organisations')}
            count={items.organisations.count}
          >
            {items.organisations.items.length === 0 ? (
              <EmptyState config={catConfig('organisations')} />
            ) : (
              items.organisations.items.map(o => (
                <ItemRow
                  key={o.id}
                  href={`/canaux-vente/linkme/organisations/${o.id}`}
                  title={o.trade_name ?? o.legal_name}
                  subtitle={`${o.type} — En attente validation`}
                  meta={formatDate(o.created_at)}
                  borderColor="border-purple-300"
                />
              ))
            )}
            <MoreItemsLink
              count={items.organisations.count}
              href="/canaux-vente/linkme/organisations"
            />
          </CategoryCard>
        </div>
      </div>

      {/* Modal rapprochement */}
      <RapprochementModal
        open={rapData.open}
        onOpenChange={open => setRapData(prev => ({ ...prev, open }))}
        transactionId={rapData.transactionId}
        label={rapData.label}
        amount={rapData.amount}
        counterpartyName={rapData.counterpartyName}
        onSuccess={() => {
          setRapData(prev => ({ ...prev, open: false }));
          void items.refetch().catch(console.error);
        }}
      />

      {/* Modal commande fournisseur */}
      <QuickPurchaseOrderModal
        open={poModal.open}
        onClose={() => setPoModal(prev => ({ ...prev, open: false }))}
        productId={poModal.productId}
        shortageQuantity={poModal.shortageQuantity}
        onSuccess={() => {
          setPoModal(prev => ({ ...prev, open: false }));
          void items.refetch().catch(console.error);
        }}
      />
    </div>
  );
}
