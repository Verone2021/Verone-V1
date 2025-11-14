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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl md:hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-xl font-bold">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col p-4 space-y-2">
            {navigationLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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
