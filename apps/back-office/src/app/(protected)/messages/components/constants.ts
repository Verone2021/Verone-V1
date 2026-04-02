import {
  CheckCircle,
  CreditCard,
  FileText,
  Link2,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';

export type NotifCategory =
  | 'paiements'
  | 'commandes'
  | 'expeditions'
  | 'stock'
  | 'approbations'
  | 'sourcing'
  | 'consultations'
  | 'formulaires'
  | 'finance'
  | 'organisations';

export interface CategoryConfig {
  key: NotifCategory;
  label: string;
  icon: typeof CreditCard;
  color: string;
  actionUrl: string;
  description: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'paiements',
    label: 'Paiements',
    icon: CreditCard,
    color: 'text-green-600',
    actionUrl: '/finance/transactions?reconciled=false',
    description: 'Transactions bancaires a rapprocher',
  },
  {
    key: 'commandes',
    label: 'Commandes',
    icon: ShoppingBag,
    color: 'text-blue-600',
    actionUrl: '/commandes/clients',
    description: 'Commandes en attente de traitement',
  },
  {
    key: 'expeditions',
    label: 'Expeditions',
    icon: Truck,
    color: 'text-indigo-600',
    actionUrl: '/stocks/expeditions',
    description: 'Commandes a expedier',
  },
  {
    key: 'stock',
    label: 'Stock',
    icon: Package,
    color: 'text-orange-600',
    actionUrl: '/stocks/alertes',
    description: 'Alertes stock — ruptures et seuils critiques',
  },
  {
    key: 'approbations',
    label: 'Approbations',
    icon: CheckCircle,
    color: 'text-red-600',
    actionUrl: '/canaux-vente/linkme/approbations',
    description: 'Commandes LinkMe a valider',
  },
  {
    key: 'sourcing',
    label: 'Sourcing',
    icon: Search,
    color: 'text-violet-600',
    actionUrl: '/produits/sourcing',
    description: 'Produits en sourcing a valider',
  },
  {
    key: 'consultations',
    label: 'Consultations',
    icon: MessageCircle,
    color: 'text-cyan-600',
    actionUrl: '/consultations?status=en_attente,en_cours',
    description: 'Demandes clients en attente de traitement',
  },
  {
    key: 'formulaires',
    label: 'Formulaires',
    icon: FileText,
    color: 'text-teal-600',
    actionUrl: '/prises-contact',
    description: 'Demandes de contact et infos LinkMe',
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Wallet,
    color: 'text-amber-600',
    actionUrl: '/factures',
    description: 'Factures en brouillon ou en attente de paiement',
  },
  {
    key: 'organisations',
    label: 'Organisations',
    icon: Link2,
    color: 'text-purple-600',
    actionUrl: '/canaux-vente/linkme/organisations',
    description: 'Organisations en attente de validation',
  },
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function formatDateWithYear(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

// ─── Legacy helpers (used by [categorie] sub-page and notification-card) ────

export function categorize(n: {
  title?: string | null;
  action_url?: string | null;
}): NotifCategory {
  const t = (n.title ?? '').toLowerCase();
  const url = (n.action_url ?? '').toLowerCase();

  if (t.includes('paiement')) return 'paiements';
  if (t.includes('expedi') || t.includes('reception')) return 'expeditions';
  if (t.includes('a valider') || t.includes('a approuver'))
    return 'approbations';
  if (t.includes('echantillon') || t.includes('sourcing')) return 'sourcing';
  if (t.includes('consultation')) return 'consultations';
  if (t.includes('stock') || t.includes('rupture')) return 'stock';
  if (
    t.includes('formulaire') ||
    t.includes('nouveau:') ||
    url.includes('prises-contact')
  )
    return 'formulaires';
  if (
    t.includes('facture') ||
    t.includes('commission') ||
    t.includes('depense')
  )
    return 'finance';
  if (t.includes('organisation') || t.includes('contact facturation'))
    return 'organisations';
  if (t.includes('commande')) return 'commandes';

  return 'commandes';
}

export function extractTransactionId(actionUrl: string): string | null {
  const match = actionUrl.match(/transaction=([a-f0-9-]+)/);
  return match?.[1] ?? null;
}

export function parsePaymentMessage(message: string): {
  amount: number;
  counterpartyName: string;
  label: string;
} {
  const amountMatch = message.match(/[+-]\s*([\d.]+)\s*E/);
  const counterpartyMatch = message.match(/--\s*(.+?)\s*\|/);
  return {
    amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
    counterpartyName: counterpartyMatch?.[1]?.trim() ?? '',
    label: message.split('|')[0]?.trim() ?? '',
  };
}
