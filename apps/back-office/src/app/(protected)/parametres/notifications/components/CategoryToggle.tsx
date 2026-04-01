'use client';

import type { NotificationPreferences } from '../actions';
import {
  Briefcase,
  Settings2,
  Package,
  ShieldAlert,
  BarChart3,
  Wrench,
} from 'lucide-react';

export interface NotificationCategory {
  key: keyof Pick<
    NotificationPreferences,
    | 'notify_business'
    | 'notify_operations'
    | 'notify_system'
    | 'notify_catalog'
    | 'notify_performance'
    | 'notify_maintenance'
  >;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export const CATEGORIES: NotificationCategory[] = [
  {
    key: 'notify_business',
    label: 'Business',
    description: 'Commandes, clients, ventes, factures',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    key: 'notify_operations',
    label: 'Operations',
    description: 'Stock, expeditions, livraisons, approvisionnement',
    icon: Settings2,
    color: 'text-orange-600 bg-orange-100',
  },
  {
    key: 'notify_catalog',
    label: 'Catalogue',
    description: 'Produits, fiches incompletes, prix',
    icon: Package,
    color: 'text-purple-600 bg-purple-100',
  },
  {
    key: 'notify_system',
    label: 'Systeme',
    description: 'Securite, connexions, erreurs',
    icon: ShieldAlert,
    color: 'text-red-600 bg-red-100',
  },
  {
    key: 'notify_performance',
    label: 'Performance',
    description: 'KPIs, objectifs, alertes seuils',
    icon: BarChart3,
    color: 'text-green-600 bg-green-100',
  },
  {
    key: 'notify_maintenance',
    label: 'Maintenance',
    description: 'Sauvegardes, mises a jour, nettoyage',
    icon: Wrench,
    color: 'text-gray-600 bg-gray-100',
  },
];

interface CategoryToggleProps {
  category: NotificationCategory;
  enabled: boolean;
  disabled: boolean;
  onToggle: (value: boolean) => void;
}

export function CategoryToggle({
  category,
  enabled,
  disabled,
  onToggle,
}: CategoryToggleProps) {
  const Icon = category.icon;
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${category.color}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{category.label}</p>
          <p className="text-xs text-gray-500">{category.description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
