'use client';

import Link from 'next/link';

import type { DatabaseNotification } from '@verone/notifications';

import type { CategoryConfig } from './constants';
import { NotificationCard } from './notification-card';

interface CategorySectionProps {
  config: CategoryConfig;
  notifications: DatabaseNotification[];
  onTreat: (id: string, title: string) => void;
  onRapprocher?: (transactionId: string, message: string) => void;
}

export function CategorySection({
  config,
  notifications,
  onTreat,
  onRapprocher,
}: CategorySectionProps) {
  const Icon = config.icon;
  const count = notifications.length;

  // Ne pas afficher la categorie si aucune notification a traiter
  if (count === 0) return null;

  // Montrer les 4 dernieres
  const recent = notifications.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <h2 className="text-sm font-semibold text-gray-900">
            {config.label}
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
            {count}
          </span>
        </div>
        <Link
          href={`/messages/${config.key}`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Voir tout &rarr;
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {recent.map(n => (
          <NotificationCard
            key={n.id}
            notification={n}
            onTreat={onTreat}
            onRapprocher={config.key === 'paiements' ? onRapprocher : undefined}
          />
        ))}
        {count > 4 && (
          <Link
            href={`/messages/${config.key}`}
            className="block px-4 py-2 text-center text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          >
            + {count - 4} autre{count - 4 > 1 ? 's' : ''}
          </Link>
        )}
      </div>
    </div>
  );
}
