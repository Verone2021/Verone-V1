// TEMPORARY — to remove before merge (BO-UI-001)
'use client';

import { Badge } from '@verone/ui';
import { ResponsiveDataTable } from '@verone/ui';
import type { ResponsiveColumn } from '@verone/ui';

// ---------------------------------------------------------------------------
// Mock types
// ---------------------------------------------------------------------------

interface MockInvoice {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'draft';
  amount: number;
}

interface MockOrder {
  id: string;
  ref: string;
  customer: string;
  createdAt: string;
  total: number;
  items: number;
  state: 'confirmed' | 'pending' | 'shipped';
}

interface MockProduct {
  id: string;
  sku: string;
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const INVOICES: MockInvoice[] = [
  {
    id: '1',
    number: 'F-2026-001',
    client: 'Maison Lumière SARL',
    issueDate: '2026-03-01',
    dueDate: '2026-04-01',
    status: 'paid',
    amount: 1250.0,
  },
  {
    id: '2',
    number: 'F-2026-002',
    client: 'Déco & Co SAS',
    issueDate: '2026-03-15',
    dueDate: '2026-04-15',
    status: 'unpaid',
    amount: 890.5,
  },
  {
    id: '3',
    number: 'F-2026-003',
    client: 'Particulier Martin',
    issueDate: '2026-04-01',
    dueDate: '2026-05-01',
    status: 'draft',
    amount: 340.0,
  },
];

const ORDERS: MockOrder[] = [
  {
    id: 'o1',
    ref: 'SO-2026-0042',
    customer: 'Boutique Chic Paris',
    createdAt: '2026-04-10',
    total: 3400,
    items: 12,
    state: 'confirmed',
  },
  {
    id: 'o2',
    ref: 'SO-2026-0043',
    customer: 'Concept Store Lyon',
    createdAt: '2026-04-12',
    total: 1200,
    items: 5,
    state: 'shipped',
  },
  {
    id: 'o3',
    ref: 'SO-2026-0044',
    customer: 'Atelier Design Nantes',
    createdAt: '2026-04-14',
    total: 760,
    items: 3,
    state: 'pending',
  },
];

const PRODUCTS: MockProduct[] = [
  {
    id: 'p1',
    sku: 'VRN-LAMP-001',
    name: 'Lampe Arco Travertino',
    stock: 8,
    costPrice: 245,
    salePrice: 490,
  },
  {
    id: 'p2',
    sku: 'VRN-CHSE-014',
    name: 'Chaise Shell Hay',
    stock: 0,
    costPrice: 180,
    salePrice: 420,
  },
  {
    id: 'p3',
    sku: 'VRN-MIR-007',
    name: 'Miroir Ovale Laiton',
    stock: 3,
    costPrice: 95,
    salePrice: 210,
  },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const invoiceColumns: ResponsiveColumn<MockInvoice>[] = [
  {
    id: 'number',
    header: 'N° Facture',
    width: 110,
    cell: row => <span className="font-mono">{row.number}</span>,
  },
  {
    id: 'client',
    header: 'Client',
    minWidth: 180,
    cell: row => row.client,
  },
  {
    id: 'issueDate',
    header: 'Date',
    width: 90,
    hideBelow: 'xl',
    cell: row =>
      new Intl.DateTimeFormat('fr-FR').format(new Date(row.issueDate)),
  },
  {
    id: 'dueDate',
    header: 'Échéance',
    width: 90,
    hideBelow: 'lg',
    cell: row => new Intl.DateTimeFormat('fr-FR').format(new Date(row.dueDate)),
  },
  {
    id: 'status',
    header: 'Statut',
    width: 100,
    cell: row => {
      const map = {
        paid: 'bg-green-100 text-green-700',
        unpaid: 'bg-amber-100 text-amber-700',
        draft: 'bg-gray-100 text-gray-600',
      } as const;
      return (
        <Badge className={map[row.status]}>
          {row.status === 'paid'
            ? 'Payée'
            : row.status === 'unpaid'
              ? 'Non payée'
              : 'Brouillon'}
        </Badge>
      );
    },
  },
  {
    id: 'amount',
    header: 'Montant',
    width: 110,
    align: 'right',
    cell: row =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(row.amount),
  },
];

const orderColumns: ResponsiveColumn<MockOrder>[] = [
  { id: 'ref', header: 'Référence', width: 120, cell: row => row.ref },
  {
    id: 'customer',
    header: 'Client',
    minWidth: 160,
    cell: row => row.customer,
  },
  {
    id: 'createdAt',
    header: 'Date',
    width: 90,
    hideBelow: 'lg',
    cell: row =>
      new Intl.DateTimeFormat('fr-FR').format(new Date(row.createdAt)),
  },
  {
    id: 'items',
    header: 'Articles',
    width: 80,
    align: 'right',
    cell: row => row.items,
  },
  {
    id: 'total',
    header: 'Total',
    width: 110,
    align: 'right',
    cell: row =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(row.total),
  },
  {
    id: 'state',
    header: 'Statut',
    width: 100,
    hideBelow: 'md',
    cell: row => {
      const map = {
        confirmed: 'bg-blue-100 text-blue-700',
        pending: 'bg-yellow-100 text-yellow-700',
        shipped: 'bg-green-100 text-green-700',
      } as const;
      return <Badge className={map[row.state]}>{row.state}</Badge>;
    },
  },
];

const productColumns: ResponsiveColumn<MockProduct>[] = [
  {
    id: 'sku',
    header: 'SKU',
    width: 130,
    cell: row => <span className="font-mono text-xs">{row.sku}</span>,
  },
  { id: 'name', header: 'Produit', minWidth: 200, cell: row => row.name },
  {
    id: 'stock',
    header: 'Stock',
    width: 70,
    align: 'right',
    cell: row => (
      <span className={row.stock === 0 ? 'text-red-600 font-semibold' : ''}>
        {row.stock}
      </span>
    ),
  },
  {
    id: 'costPrice',
    header: 'Prix achat',
    width: 100,
    align: 'right',
    hideBelow: 'xl',
    cell: row =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(row.costPrice),
  },
  {
    id: 'salePrice',
    header: 'Prix vente',
    width: 100,
    align: 'right',
    cell: row =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(row.salePrice),
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResponsiveDemoPage() {
  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          Démo ResponsiveDataTable
        </h1>
        <p className="text-sm text-muted-foreground">
          Page temporaire BO-UI-001 — QA visuel à 1280/1440/1920px. Suppression
          avant merge.
        </p>
      </div>

      {/* Table 1 — Factures — density compact (défaut) */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">
          1. Factures — density compact (défaut)
        </h2>
        <p className="text-xs text-muted-foreground">
          Date cachée sous xl · Échéance cachée sous lg · Actions sticky
        </p>
        <ResponsiveDataTable<MockInvoice>
          columns={invoiceColumns}
          data={INVOICES}
          rowKey={row => row.id}
          actions={row => (
            <div className="flex gap-1 justify-end">
              <button className="text-xs text-primary hover:underline">
                Voir
              </button>
              <button className="text-xs text-muted-foreground hover:underline">
                PDF
              </button>
            </div>
          )}
          actionsWidth={80}
          density="compact"
        />
      </section>

      {/* Table 2 — Commandes — density normal */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">2. Commandes — density normal</h2>
        <p className="text-xs text-muted-foreground">
          Date cachée sous lg · Statut caché sous md · Actions sticky
        </p>
        <ResponsiveDataTable<MockOrder>
          columns={orderColumns}
          data={ORDERS}
          rowKey={row => row.id}
          actions={row => (
            <div className="flex gap-1 justify-end">
              <button className="text-xs text-primary hover:underline">
                Ouvrir
              </button>
            </div>
          )}
          actionsWidth={70}
          density="normal"
        />
      </section>

      {/* Table 3 — Produits — loading + empty states */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">3. Produits — density compact</h2>
        <p className="text-xs text-muted-foreground">
          Prix achat caché sous xl · Stock en rouge si 0
        </p>
        <ResponsiveDataTable<MockProduct>
          columns={productColumns}
          data={PRODUCTS}
          rowKey={row => row.id}
          density="compact"
        />
      </section>

      {/* Table 4 — Loading skeleton */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">4. État loading (skeleton)</h2>
        <ResponsiveDataTable<MockProduct>
          columns={productColumns}
          data={[]}
          rowKey={row => row.id}
          loading={true}
          skeletonRows={4}
          density="compact"
        />
      </section>

      {/* Table 5 — Empty state */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">
          5. État vide (emptyState custom)
        </h2>
        <ResponsiveDataTable<MockProduct>
          columns={productColumns}
          data={[]}
          rowKey={row => row.id}
          loading={false}
          emptyState={
            <span className="text-muted-foreground text-sm">
              Aucun produit dans ce catalogue.
            </span>
          }
          density="compact"
        />
      </section>
    </div>
  );
}
