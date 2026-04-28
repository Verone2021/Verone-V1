import {
  Home,
  Users,
  User,
  Activity,
  BookOpen,
  Package,
  Target,
  ShoppingBag,
  Store,
  Truck,
  Building2,
  Settings,
  Tags,
  Layers,
  MessageCircle,
  FileText,
  Globe,
  Link2,
  Calculator,
  LayoutDashboard,
  Grid3x3,
  BookOpenCheck,
  Landmark,
  FolderArchive,
  Receipt,
  Monitor,
  CalendarClock,
} from 'lucide-react';

// Interface pour les éléments de navigation
export interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: number;
  badgeVariant?: 'default' | 'urgent';
  children?: NavItem[];
}

/**
 * Top-level sidebar entries visible to a back-office `catalog_manager`.
 * Strict whitelist — anything not listed is hidden so the user never clicks
 * on something that would crash, redirect, or expose sensitive data.
 *
 * Matrix validated by Romeo (2026-04-27/28):
 * - Produits  : sourcing + catalogue + variantes + collections + categories
 * - Stocks    : read-only (granular UI locks scoped to BO-RBAC-CATALOG-MGR-002)
 * - Paramètres: needed to reach /parametres/outils (Chrome extension download)
 *
 * Hidden for catalog_manager:
 * - Dashboard (exposes financial KPIs)
 * - Messages (commercial)
 * - Organisations & Contacts (sensitive)
 * - Ventes / Achats (orders, invoices, suppliers commands)
 * - Canaux de Vente (publication interdite)
 * - Finance (interdit)
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */
const CATALOG_MANAGER_TOP_LEVEL_WHITELIST = new Set<string>([
  'Produits',
  'Stocks',
  'Paramètres',
]);

/**
 * Filters the full navigation tree based on the back-office role.
 * - owner / admin / null (loading) → return everything
 * - catalog_manager → return only the whitelisted top-level entries
 * - any other role → conservative default = same restriction as catalog_manager
 */
export function filterNavItemsForRole(
  items: NavItem[],
  role: 'owner' | 'admin' | 'catalog_manager' | string | null | undefined
): NavItem[] {
  if (role === 'owner' || role === 'admin' || role == null) {
    return items;
  }
  return items.filter(item =>
    CATALOG_MANAGER_TOP_LEVEL_WHITELIST.has(item.title)
  );
}

// Navigation principale - Dashboard + Modules
// Structure optimisée 2026-01-22: 14 items top-level, max 2 niveaux
export const getNavItems = (
  stockAlertsCount: number,
  consultationsCount: number,
  linkmePendingCount: number,
  productsIncompleteCount: number,
  ordersPendingCount: number,
  expeditionsPendingCount: number,
  transactionsUnreconciledCount: number,
  _linkmeApprovalsCount: number,
  formSubmissionsCount: number,
  linkmeMissingInfoCount: number,
  unreadNotificationsCount: number
): NavItem[] => [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageCircle,
    badge:
      formSubmissionsCount + linkmeMissingInfoCount + unreadNotificationsCount,
    badgeVariant:
      formSubmissionsCount + linkmeMissingInfoCount + unreadNotificationsCount >
      0
        ? 'urgent'
        : undefined,
  },
  {
    title: 'Organisations & Contacts',
    href: '/contacts-organisations',
    icon: Building2,
    children: [
      {
        title: 'Enseignes',
        href: '/contacts-organisations/enseignes',
        icon: Building2,
      },
      {
        title: 'Organisations',
        href: '/contacts-organisations',
        icon: Users,
      },
      {
        title: 'Clients Particuliers',
        href: '/contacts-organisations/clients-particuliers',
        icon: User,
      },
    ],
  },
  // ============ MODULES ============
  {
    title: 'Produits',
    href: '/produits',
    icon: Package,
    badge: productsIncompleteCount,
    badgeVariant: productsIncompleteCount > 0 ? 'urgent' : undefined,
    children: [
      {
        title: 'Catalogue',
        href: '/produits/catalogue',
        icon: BookOpen,
        badge: productsIncompleteCount,
        badgeVariant: productsIncompleteCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Sourcing',
        href: '/produits/sourcing',
        icon: Target,
      },
      {
        title: 'Collections',
        href: '/produits/catalogue/collections',
        icon: Layers,
      },
      {
        title: 'Variantes',
        href: '/produits/catalogue/variantes',
        icon: Grid3x3,
      },
      {
        title: 'Catégories',
        href: '/produits/catalogue/categories',
        icon: Tags,
      },
    ],
  },
  {
    title: 'Stocks',
    href: '/stocks',
    icon: Layers,
    badge: stockAlertsCount,
    badgeVariant: stockAlertsCount > 0 ? 'urgent' : undefined,
    children: [
      {
        title: 'Alertes',
        href: '/stocks/alertes',
        icon: Activity,
        badge: stockAlertsCount,
        badgeVariant: stockAlertsCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Inventaire',
        href: '/stocks/inventaire',
        icon: Package,
      },
    ],
  },
  {
    title: 'Ventes',
    href: '/ventes',
    icon: Target,
    badge: ordersPendingCount + consultationsCount,
    badgeVariant:
      ordersPendingCount + consultationsCount > 0 ? 'urgent' : undefined,
    children: [
      {
        title: 'Consultations',
        href: '/consultations',
        icon: MessageCircle,
        badge: consultationsCount,
        badgeVariant: consultationsCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Commandes clients',
        href: '/commandes/clients',
        icon: Users,
        badge: ordersPendingCount,
        badgeVariant: ordersPendingCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Devis',
        href: '/factures?tab=devis',
        icon: FileText,
      },
      {
        title: 'Expéditions',
        href: '/stocks/expeditions',
        icon: Truck,
        badge: expeditionsPendingCount,
        badgeVariant: expeditionsPendingCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Factures',
        href: '/factures',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Achats',
    href: '/achats',
    icon: Building2,
    children: [
      {
        title: 'Commandes fournisseurs',
        href: '/commandes/fournisseurs',
        icon: Building2,
      },
      {
        title: 'Réceptions',
        href: '/stocks/receptions',
        icon: Truck,
      },
    ],
  },
  // ============ CANAUX DE VENTE ============
  {
    title: 'Canaux de Vente',
    href: '/canaux-vente',
    icon: Store,
    badge: linkmePendingCount + linkmeMissingInfoCount,
    badgeVariant:
      linkmePendingCount + linkmeMissingInfoCount > 0 ? 'urgent' : undefined,
    children: [
      {
        title: 'LinkMe',
        href: '/canaux-vente/linkme',
        icon: Link2,
        badge: linkmePendingCount,
        badgeVariant: linkmePendingCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Messages LinkMe',
        href: '/canaux-vente/linkme/messages',
        icon: MessageCircle,
        badge: linkmeMissingInfoCount,
        badgeVariant: linkmeMissingInfoCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Site Internet',
        href: '/canaux-vente/site-internet',
        icon: Globe,
      },
      {
        title: 'Google Merchant',
        href: '/canaux-vente/google-merchant',
        icon: ShoppingBag,
      },
      {
        title: 'Meta Commerce',
        href: '/canaux-vente/meta',
        icon: MessageCircle,
      },
    ],
  },
  // ============ FINANCE (Style Indy/Pennylane 2026) ============
  {
    title: 'Finance',
    href: '/finance',
    icon: Calculator,
    badge: transactionsUnreconciledCount,
    badgeVariant: transactionsUnreconciledCount > 0 ? 'urgent' : undefined,
    children: [
      {
        title: 'Pilotage',
        href: '/finance',
        icon: LayoutDashboard,
      },
      {
        title: 'Facturation',
        href: '/factures',
        icon: FileText,
      },
      {
        title: 'Banque',
        href: '/finance/transactions',
        icon: Landmark,
        badge: transactionsUnreconciledCount,
        badgeVariant: transactionsUnreconciledCount > 0 ? 'urgent' : undefined,
      },
      {
        title: 'Dépenses',
        href: '/finance/depenses',
        icon: Receipt,
      },
      {
        title: 'Immobilisations',
        href: '/finance/immobilisations',
        icon: Monitor,
      },
      {
        title: 'Bibliothèque',
        href: '/finance/bibliotheque',
        icon: FolderArchive,
      },
      {
        title: 'Documents',
        href: '/finance/documents',
        icon: BookOpenCheck,
      },
      {
        title: 'Échéancier',
        href: '/finance/echeancier',
        icon: CalendarClock,
      },
    ],
  },
  {
    title: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  },
];
