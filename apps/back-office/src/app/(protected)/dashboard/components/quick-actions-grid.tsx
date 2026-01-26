/**
 * QuickActionsGrid Component
 * 8 quick access buttons to critical pages
 *
 * Grid layout: 4 cols desktop → 2 cols mobile
 */

import Link from 'next/link';
import { Button } from '@verone/ui/components/ui/button';
import {
  Package,
  ShoppingBag,
  Users,
  RefreshCw,
  Activity,
  Link2,
  MessageCircle,
  FileText,
} from 'lucide-react';

const quickActions = [
  {
    label: 'Nouveau Produit',
    href: '/produits/catalogue/nouveau',
    icon: Package,
    description: 'Créer produit catalogue',
  },
  {
    label: 'Nouvelle Commande',
    href: '/commandes/clients',
    icon: ShoppingBag,
    description: 'Créer commande client',
  },
  {
    label: 'Créer Contact',
    href: '/contacts-organisations',
    icon: Users,
    description: 'Ajouter organisation/contact',
  },
  {
    label: 'Ajustement Stock',
    href: '/stocks/ajustements/create',
    icon: RefreshCw,
    description: 'Ajuster inventaire',
  },
  {
    label: 'Voir Alertes Stock',
    href: '/stocks/alertes',
    icon: Activity,
    description: 'Liste alertes critiques',
  },
  {
    label: 'Approbations LinkMe',
    href: '/canaux-vente/linkme/approbations',
    icon: Link2,
    description: 'Commandes, produits & organisations',
  },
  {
    label: 'Consultations',
    href: '/consultations',
    icon: MessageCircle,
    description: 'Liste RFQ actives',
  },
  {
    label: 'Facturation',
    href: '/factures',
    icon: FileText,
    description: 'Accès factures',
  },
];

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.href}
            variant="outline"
            size="sm"
            asChild
            className="h-auto py-3 flex-col items-start gap-1 hover:bg-neutral-50"
          >
            <Link href={action.href}>
              <div className="flex items-center gap-2 w-full">
                <Icon size={16} className="text-neutral-600 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900">
                  {action.label}
                </span>
              </div>
              <span className="text-xs text-neutral-500 w-full text-left">
                {action.description}
              </span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
