'use client';

import { useState } from 'react';

import { Card, Badge } from '@tremor/react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Archive,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';

import type { AffiliateCustomer } from '@/lib/hooks/use-affiliate-orders';

interface NetworkCardProps {
  organisation: AffiliateCustomer;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  isArchived?: boolean;
  isLoading?: boolean;
}

export function NetworkCard({
  organisation,
  onArchive,
  onRestore,
  isArchived = false,
  isLoading = false,
}: NetworkCardProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleArchive = () => {
    onArchive?.(organisation.id);
    setShowArchiveDialog(false);
  };

  const handleRestore = () => {
    onRestore?.(organisation.id);
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        {/* Header avec nom et badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {organisation.name}
              </h3>
              <Badge
                color={organisation.is_franchisee ? 'purple' : 'blue'}
                size="xs"
              >
                {organisation.is_franchisee ? 'Franchise' : 'Propre'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Détails */}
        <div className="space-y-1.5 text-sm text-gray-600">
          {organisation.city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {organisation.postal_code} {organisation.city}
              </span>
            </div>
          )}
          {organisation.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{organisation.email}</span>
            </div>
          )}
          {organisation.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{organisation.phone}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t flex justify-end">
          {isArchived ? (
            <button
              onClick={handleRestore}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurer
            </button>
          ) : (
            <button
              onClick={() => setShowArchiveDialog(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              Archiver
            </button>
          )}
        </div>
      </Card>

      {/* Dialog de confirmation d'archivage */}
      {showArchiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowArchiveDialog(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            {/* Close button */}
            <button
              onClick={() => setShowArchiveDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Archiver cette organisation ?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
                    {organisation.name}
                  </span>{' '}
                  sera archivée. L&apos;équipe Vérone sera notifiée et pourra
                  décider de la supprimer définitivement si nécessaire.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowArchiveDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
