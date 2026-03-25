'use client';

import { Card, CardContent } from '@verone/ui';
import { User } from 'lucide-react';

import type { CreatedByProfile } from './types';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

interface DemandeurCardProps {
  createdByProfile: CreatedByProfile | null;
  linkmeDetails: LinkMeOrderDetails | null;
}

export function DemandeurCard({
  createdByProfile,
  linkmeDetails,
}: DemandeurCardProps) {
  if (!createdByProfile && !linkmeDetails?.requester_name) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Demandeur
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {(() => {
                if (createdByProfile) {
                  const name = [
                    createdByProfile.first_name,
                    createdByProfile.last_name,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return name.length > 0 ? name : 'Utilisateur inconnu';
                }
                return linkmeDetails?.requester_name ?? 'Visiteur anonyme';
              })()}
            </p>
            {(createdByProfile?.email ?? linkmeDetails?.requester_email) && (
              <p className="text-xs text-gray-500">
                {createdByProfile?.email ?? linkmeDetails?.requester_email}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
