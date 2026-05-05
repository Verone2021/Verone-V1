'use client';

/**
 * EmailDetailDrawer — Drawer latéral pour afficher le détail d'un email.
 * Sanitize le HTML avec une approche serveur-safe (strip tags côté client si DOMPurify absent).
 * Note : DOMPurify nécessite un browser — on utilise une iframe sandboxed pour l'HTML.
 */

import { useCallback } from 'react';

import Link from 'next/link';

import {
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@verone/ui';
import { ExternalLink, Mail, Paperclip } from 'lucide-react';

import type { EmailMessage } from './types';

interface EmailDetailDrawerProps {
  email: EmailMessage | null;
  open: boolean;
  onClose: () => void;
  onToggleRead: (email: EmailMessage) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EmailDetailDrawer({
  email,
  open,
  onClose,
  onToggleRead,
}: EmailDetailDrawerProps) {
  const handleToggleRead = useCallback(() => {
    if (email) onToggleRead(email);
  }, [email, onToggleRead]);

  if (!email) return null;

  return (
    <Sheet open={open} onOpenChange={open ? onClose : undefined}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col h-screen overflow-hidden p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-base font-semibold leading-tight line-clamp-2">
              {email.subject ?? '(sans objet)'}
            </SheetTitle>
            <Badge
              variant={email.brand === 'verone' ? 'default' : 'info'}
              size="sm"
              className="flex-shrink-0"
            >
              {email.brand === 'verone' ? 'Vérone' : 'LinkMe'}
            </Badge>
          </div>
        </SheetHeader>

        {/* Méta */}
        <div className="px-6 py-3 border-b flex-shrink-0 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">
              {email.from_name ? `${email.from_name}` : email.from_email}
            </span>
            {email.from_name && (
              <span className="text-gray-500">&lt;{email.from_email}&gt;</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-xs">À :</span>
            <span className="text-xs">{email.to_address}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatDate(email.received_at)}
            </span>
            <div className="flex items-center gap-2">
              {email.has_attachments && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
              {email.linked_order_number && email.linked_order_id && (
                <Link
                  href={`/commandes/clients/${email.linked_order_id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {email.linked_order_number}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Corps du message — scroll interne */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {email.body_html ? (
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;font-size:14px;color:#111;line-height:1.6;margin:0;padding:0}a{color:#2563eb}img{max-width:100%;height:auto}</style></head><body>${email.body_html}</body></html>`}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="w-full min-h-[400px] border-0"
              title="Contenu de l'email"
            />
          ) : email.body_text ? (
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
              {email.body_text}
            </pre>
          ) : email.snippet ? (
            <p className="text-sm text-gray-600 italic">{email.snippet}</p>
          ) : (
            <p className="text-sm text-gray-400">Aucun contenu disponible.</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-end gap-2">
          <button
            onClick={handleToggleRead}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Marquer comme {email.is_read ? 'non-lu' : 'lu'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
