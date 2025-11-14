'use client';

import Link from 'next/link';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navigationLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/collections', label: 'Collections' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
  { href: '/compte', label: 'Mon compte' },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-verone-black/60 backdrop-blur-sm md:hidden animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-verone-white shadow-luxury-xl md:hidden animate-slide-in-right">
          <div className="flex items-center justify-between p-6 border-b border-verone-gray-200">
            <Dialog.Title className="font-playfair text-2xl font-bold text-verone-black tracking-tight">
              Menu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col p-6 space-y-1">
            {navigationLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-3.5 text-base font-medium text-verone-gray-700 hover:text-verone-black hover:bg-verone-gray-50 rounded-lg transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
