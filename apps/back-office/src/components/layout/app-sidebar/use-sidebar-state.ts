'use client';

import { useState, useRef } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import type { NavItem } from './sidebar-nav-items';

/**
 * Hook personnalisé pour gérer l'expansion au hover
 * Pattern 2026: Linear/Vercel/Stripe sidebar UX
 * - Expand après delay au mouseEnter
 * - Collapse immédiat au mouseLeave
 * - Support keyboard focus pour accessibilité
 */
export function useHoverExpand(delay: number = 150) {
  const [isExpanded, setExpanded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const onMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setExpanded(true), delay);
  };

  const onMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setExpanded(false);
  };

  const onFocus = () => {
    // Keyboard navigation expand sidebar (accessibilité)
    setExpanded(true);
  };

  return { isExpanded, onMouseEnter, onMouseLeave, onFocus };
}

/**
 * Hook pour gérer l'état local de la sidebar :
 * - expandedItems (accordion)
 * - toggleExpanded
 * - isHrefActive (pathname + searchParams)
 * - isActiveOrHasActiveChild (récursif)
 * - getModuleName (mapping title → module key)
 */
export function useSidebarState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State local pour les items expandés (pas besoin de persistence cross-tab)
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'Administration',
  ]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isHrefActive = (href: string): boolean => {
    // Split href into path and query params
    const [hrefPath, hrefQuery] = href.split('?');
    // Match pathname
    const pathMatches =
      pathname === hrefPath ||
      (hrefPath !== '/dashboard' && pathname.startsWith(hrefPath));
    if (!pathMatches) return false;
    // If href has query params, also check them (e.g. ?tab=devis)
    if (hrefQuery) {
      const hrefParams = new URLSearchParams(hrefQuery);
      for (const [key, value] of hrefParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
    }
    return true;
  };

  const isActiveOrHasActiveChild = (item: NavItem): boolean => {
    if (item.href && isHrefActive(item.href)) {
      return true;
    }
    if (item.children) {
      return item.children.some(child => isActiveOrHasActiveChild(child));
    }
    return false;
  };

  const getModuleName = (title: string): string => {
    const moduleMap: Record<string, string> = {
      Produits: 'catalogue',
      Catalogue: 'catalogue',
      Stocks: 'stocks',
      Sourcing: 'sourcing',
      Ventes: 'interactions',
      Achats: 'commandes',
      Comptabilité: 'finance',
      Finance: 'finance',
      Pilotage: 'finance',
      Documents: 'finance',
      Bibliothèque: 'finance',
      'Clôture exercice': 'finance',
      Facturation: 'factures',
      Factures: 'factures',
      Devis: 'factures',
      Avoirs: 'factures',
      Trésorerie: 'tresorerie',
      Organisation: 'contacts',
    };
    return moduleMap[title] ?? title.toLowerCase();
  };

  return {
    expandedItems,
    toggleExpanded,
    isHrefActive,
    isActiveOrHasActiveChild,
    getModuleName,
  };
}
