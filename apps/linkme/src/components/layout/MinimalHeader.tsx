'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Menu } from 'lucide-react';

import { UserMenu } from '@/components/auth/UserMenu';

import { useSidebar } from './SidebarProvider';

export function MinimalHeader(): JSX.Element {
  const { toggle, isMobile } = useSidebar();

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

      {/* Right: User Menu */}
      <UserMenu />
    </header>
  );
}
