'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  ShoppingBag,
  Star,
  Package,
  ShoppingCart,
  Coins,
  User,
  LogOut,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { useSidebar } from './SidebarProvider';

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Catalogue', href: '/catalogue' },
  { icon: Star, label: 'Ma Sélection', href: '/ma-selection' },
  { icon: Package, label: 'Mes Produits', href: '/mes-produits' },
  { icon: ShoppingCart, label: 'Commandes', href: '/commandes' },
  { icon: Coins, label: 'Commissions', href: '/commissions' },
  { icon: User, label: 'Profil', href: '/profil' },
];

export function AppSidebar(): JSX.Element | null {
  const pathname = usePathname();
  const { isOpen, isMobile, close, setIsMobile } = useSidebar();
  const { user, signOut } = useAuth();

  // État pour le hover (desktop) - collapsible
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = (): void => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return (): void => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [setIsMobile]);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  const handleSignOut = useCallback((): void => {
    void signOut();
  }, [signOut]);

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!user) {
    return null;
  }

  // Mobile: comportement slide-in/out
  if (isMobile) {
    return (
      <>
        {/* Overlay for mobile */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={close}
          />
        )}

        {/* Mobile Sidebar - Full width */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out',
            !isOpen && '-translate-x-full'
          )}
        >
          {/* Header mobile avec bouton fermer */}
          <div className="h-16 flex items-center justify-end px-4 border-b border-gray-100">
            <button
              onClick={close}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map(link => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-linkme-turquoise/15 text-linkme-marine border-l-3 border-linkme-turquoise'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
                  )}
                >
                  <link.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-linkme-turquoise' : 'text-gray-400'
                    )}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop: Sidebar collapsible (icônes seules → expand on hover)
  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        'fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out',
        isExpanded ? 'w-56' : 'w-16'
      )}
    >
      {/* Spacer pour aligner avec header */}
      <div className="h-16 border-b border-gray-100" />

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {sidebarLinks.map(link => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              title={!isExpanded ? link.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-linkme-turquoise/15 text-linkme-marine'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
              )}
            >
              <link.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-linkme-turquoise' : 'text-gray-400'
                )}
              />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          title={!isExpanded ? 'Se déconnecter' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isExpanded && (
            <span className="whitespace-nowrap">Se déconnecter</span>
          )}
        </button>
      </div>
    </aside>
  );
}
