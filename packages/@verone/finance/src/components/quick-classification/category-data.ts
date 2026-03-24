import {
  Coffee,
  Monitor,
  CreditCard,
  Megaphone,
  FileText,
  Shield,
  Wifi,
  Plane,
  Package,
  Building2,
  Wrench,
  Users,
  Receipt,
  Sparkles,
  Truck,
} from 'lucide-react';

import type { CategoryShortcut } from './types';

// Categories populaires avec icones et couleurs
export const POPULAR_CATEGORIES: CategoryShortcut[] = [
  {
    code: '6256',
    label: 'Hotel & Repas',
    description: 'Missions, deplacements',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    code: '651',
    label: 'Logiciels SaaS',
    description: 'Abonnements, licences',
    icon: Monitor,
    color:
      'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
    iconColor: 'text-purple-600',
  },
  {
    code: '6278',
    label: 'Frais Bancaires',
    description: 'Commissions, tenue compte',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    code: '623',
    label: 'Marketing & Pub',
    description: 'Publicite, communication',
    icon: Megaphone,
    color: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
    iconColor: 'text-pink-600',
  },
  {
    code: '6226',
    label: 'Honoraires',
    description: 'Comptable, avocat',
    icon: FileText,
    color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    iconColor: 'text-slate-600',
  },
  {
    code: '616',
    label: 'Assurances',
    description: 'Toutes assurances pro',
    icon: Shield,
    color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    iconColor: 'text-green-600',
  },
  {
    code: '6262',
    label: 'Telecom & Internet',
    description: 'Forfaits, abonnements',
    icon: Wifi,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200',
    iconColor: 'text-cyan-600',
  },
  {
    code: '6251',
    label: 'Transport',
    description: 'Train, avion, carburant',
    icon: Plane,
    color:
      'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
    iconColor: 'text-indigo-600',
  },
];

// Plus de categories pour la vue complete
export const MORE_CATEGORIES: CategoryShortcut[] = [
  {
    code: '607',
    label: 'Achats Marchandises',
    description: 'Produits pour revente',
    icon: Package,
    color:
      'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
    iconColor: 'text-yellow-600',
  },
  {
    code: '6132',
    label: 'Loyer Bureaux',
    description: 'Locations immobilieres',
    icon: Building2,
    color:
      'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    code: '6257',
    label: 'Repas Affaires',
    description: 'Receptions clients',
    icon: Coffee,
    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
    iconColor: 'text-rose-600',
  },
  {
    code: '615',
    label: 'Entretien & Reparations',
    description: 'Maintenance, reparations',
    icon: Wrench,
    color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
    iconColor: 'text-teal-600',
  },
  {
    code: '624',
    label: 'Livraisons',
    description: 'Frais de port, transport',
    icon: Truck,
    color:
      'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    code: '641',
    label: 'Salaires',
    description: 'Remunerations personnel',
    icon: Users,
    color:
      'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
    iconColor: 'text-violet-600',
  },
  {
    code: '6064',
    label: 'Fournitures Bureau',
    description: 'Papeterie, consommables',
    icon: FileText,
    color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
    iconColor: 'text-gray-600',
  },
  {
    code: '658',
    label: 'Charges Diverses',
    description: 'Autres charges de gestion',
    icon: Receipt,
    color:
      'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200',
    iconColor: 'text-neutral-600',
  },
];

// Categories populaires pour les ENTREES (classe 7)
export const POPULAR_INCOME_CATEGORIES: CategoryShortcut[] = [
  {
    code: '706',
    label: 'Prestations Services',
    description: 'Services clients, conseil',
    icon: Users,
    color:
      'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    code: '707',
    label: 'Ventes Marchandises',
    description: 'Mobilier, produits',
    icon: Package,
    color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
    iconColor: 'text-teal-600',
  },
  {
    code: '708',
    label: 'Activites Annexes',
    description: 'Revenus secondaires',
    icon: Sparkles,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200',
    iconColor: 'text-cyan-600',
  },
  {
    code: '758',
    label: 'Produits Divers',
    description: 'Remboursements, divers',
    icon: Receipt,
    color: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200',
    iconColor: 'text-sky-600',
  },
  {
    code: '768',
    label: 'Produits Financiers',
    description: 'Interets, dividendes',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    code: '74',
    label: 'Subventions',
    description: "Aides, subventions d'exploitation",
    icon: Building2,
    color:
      'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
    iconColor: 'text-indigo-600',
  },
];
