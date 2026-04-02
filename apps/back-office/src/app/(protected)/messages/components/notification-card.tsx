'use client';

import { Check, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { DatabaseNotification } from '@verone/notifications';

import { extractTransactionId, formatDate } from './constants';

interface NotificationCardProps {
  notification: DatabaseNotification;
  onTreat: (id: string, title: string) => void;
  onRapprocher?: (transactionId: string, message: string) => void;
  showDate?: boolean;
  variant?: 'active' | 'history';
}

export function NotificationCard({
  notification: n,
  onTreat,
  onRapprocher,
  showDate = true,
  variant = 'active',
}: NotificationCardProps) {
  const router = useRouter();
  const isHistory = variant === 'history';
  const isNonRapproche = (n.message ?? '').includes('Non rapproche');
  const transactionId = extractTransactionId(n.action_url ?? '');

  const handleClick = () => {
    if (n.action_url) {
      router.push(n.action_url);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 group ${
        isHistory ? 'opacity-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Clic sur le contenu → naviguer */}
      <button
        className="flex items-start gap-3 flex-1 text-left min-w-0"
        onClick={handleClick}
        disabled={isHistory}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
            isHistory ? 'bg-gray-300' : 'bg-red-500'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm truncate ${
              isHistory ? 'text-gray-400' : 'font-medium text-gray-900'
            }`}
          >
            {n.title}
          </p>
          <p className="text-xs text-gray-500 truncate">{n.message}</p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Bouton rapprocher (meme icone Link2 que page commandes) */}
        {!isHistory && isNonRapproche && transactionId && onRapprocher && (
          <button
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            onClick={e => {
              e.stopPropagation();
              onRapprocher(transactionId, n.message ?? '');
            }}
            title="Lier transaction"
          >
            <Link2 className="h-3 w-3" />
          </button>
        )}

        {/* Bouton traiter (coche) */}
        {!isHistory && (
          <button
            className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => {
              e.stopPropagation();
              onTreat(n.id, n.title ?? '');
            }}
            title="Marquer comme traite"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}

        {showDate && (
          <span className="text-xs text-gray-400 ml-1 min-w-[50px] text-right">
            {formatDate(n.created_at ?? '')}
          </span>
        )}
      </div>
    </div>
  );
}
