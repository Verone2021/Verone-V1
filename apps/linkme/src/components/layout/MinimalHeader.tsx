'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Menu, ShoppingCart } from 'lucide-react';

import { UserMenu } from '@/components/auth/UserMenu';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';

import { useSidebar } from './SidebarProvider';

export function MinimalHeader() {
  const { toggle, isMobile } = useSidebar();
  const { items, openCart } = useCart();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={toggle}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-linkme-marine" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo-linkme.png"
            alt="LinkMe"
            width={160}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Right: Cart + User */}
      <div className="flex items-center gap-2">
        {/* Cart Button */}
        <button
          onClick={openCart}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Ouvrir le panier"
        >
          <ShoppingCart className="h-5 w-5 text-linkme-marine" />
          {itemCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full',
                'bg-linkme-turquoise text-white text-xs font-medium'
              )}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
