'use client';

import { cn } from '@verone/utils';
import {
  StockAlertsDropdown,
  ConsultationsDropdown,
  LinkmePendingDropdown,
  ProductsIncompleteDropdown,
  OrdersPendingDropdown,
  ExpeditionsPendingDropdown,
  TransactionsUnreconciledDropdown,
  LinkmeMissingInfoDropdown,
} from '@verone/notifications';

interface SidebarBadgeDropdownProps {
  title: string;
  count: number;
  className?: string;
}

/**
 * Badge avec dropdown interactif selon le module.
 * Click sur badge = ouvre dropdown avec liste détaillée.
 * Retourne null si count === 0.
 */
export function SidebarBadgeDropdown({
  title,
  count,
  className,
}: SidebarBadgeDropdownProps) {
  if (count === 0) return null;

  const badgeContent = (
    <span
      className={cn(
        'bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold cursor-pointer',
        'hover:bg-red-600 transition-colors',
        className
      )}
      aria-label={`${count} notification${count > 1 ? 's' : ''}`}
      onClick={e => e.stopPropagation()} // Prevent parent click
    >
      {count > 9 ? '9+' : count}
    </span>
  );

  // Wrapper avec dropdown selon module
  switch (title) {
    case 'Stocks':
    case 'Alertes':
      return (
        <StockAlertsDropdown side="right" align="start">
          {badgeContent}
        </StockAlertsDropdown>
      );
    case 'Expéditions':
      return (
        <ExpeditionsPendingDropdown side="right" align="start">
          {badgeContent}
        </ExpeditionsPendingDropdown>
      );
    case 'Produits':
    case 'Catalogue':
      return (
        <ProductsIncompleteDropdown side="right" align="start">
          {badgeContent}
        </ProductsIncompleteDropdown>
      );
    case 'Commandes':
    case 'Clients': // Sous-menu Commandes
      return (
        <OrdersPendingDropdown side="right" align="start">
          {badgeContent}
        </OrdersPendingDropdown>
      );
    case 'Consultations':
      return (
        <ConsultationsDropdown side="right" align="start">
          {badgeContent}
        </ConsultationsDropdown>
      );
    case 'Canaux de Vente':
    case 'LinkMe':
      return (
        <LinkmePendingDropdown side="right" align="start">
          {badgeContent}
        </LinkmePendingDropdown>
      );
    case 'Messages LinkMe':
      return (
        <LinkmeMissingInfoDropdown side="right" align="start">
          {badgeContent}
        </LinkmeMissingInfoDropdown>
      );
    case 'Finance':
    case 'Transactions':
      return (
        <TransactionsUnreconciledDropdown side="right" align="start">
          {badgeContent}
        </TransactionsUnreconciledDropdown>
      );
    default:
      return badgeContent;
  }
}
