'use client';

/**
 * Badge helpers for echantillons table
 */

import { Badge } from '@verone/ui';
import {
  Archive,
  CheckCircle,
  Clock,
  Package,
  AlertTriangle,
} from 'lucide-react';

export function getSampleTypeBadge(sampleType: 'internal' | 'customer') {
  if (sampleType === 'internal') {
    return (
      <Badge
        variant="outline"
        className="border-amber-500 text-amber-700 bg-amber-50"
      >
        Interne
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-purple-500 text-purple-700 bg-purple-50"
    >
      Client
    </Badge>
  );
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Brouillon
        </Badge>
      );
    case 'ordered':
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-600">
          Commande
        </Badge>
      );
    case 'received':
      return (
        <Badge variant="outline" className="border-green-300 text-green-600">
          Recu
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline" className="border-red-300 text-red-600">
          Archive
        </Badge>
      );
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'draft':
      return <Clock className="h-4 w-4 text-gray-600" />;
    case 'ordered':
      return <Package className="h-4 w-4 text-blue-600" />;
    case 'received':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'archived':
      return <Archive className="h-4 w-4 text-red-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
}
