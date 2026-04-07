import {
  Building2,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
} from 'lucide-react';

export const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-600',
  },
  active: {
    label: 'Actif',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  suspended: {
    label: 'Suspendu',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

export const typeConfig = {
  enseigne: {
    label: 'Enseigne',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  client_professionnel: {
    label: 'Client Pro',
    icon: Briefcase,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  client_particulier: {
    label: 'Particulier',
    icon: User,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
};
