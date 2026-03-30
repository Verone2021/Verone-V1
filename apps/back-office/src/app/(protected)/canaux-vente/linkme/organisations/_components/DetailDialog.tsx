import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Mail, MapPin, Phone } from 'lucide-react';

import type { PendingOrganisation } from '../../hooks/use-organisation-approvals';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation: PendingOrganisation | null;
}

export function DetailDialog({
  open,
  onOpenChange,
  organisation,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Details de l&apos;organisation</DialogTitle>
        </DialogHeader>
        {organisation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom commercial</p>
                <p className="font-medium">{organisation.trade_name ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Raison sociale</p>
                <p className="font-medium">{organisation.legal_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">SIRET</p>
                <p className="font-medium">{organisation.siret ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enseigne</p>
                <p className="font-medium">
                  {organisation.enseigne_name ?? '-'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">Contact</p>
              {organisation.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{organisation.email}</span>
                </div>
              )}
              {organisation.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{organisation.phone}</span>
                </div>
              )}
            </div>

            {/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Intentional boolean OR to check if any address field exists */}
            {(organisation.address_line1 ||
              organisation.city ||
              organisation.postal_code) && (
              /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </p>
                <p className="text-gray-600">
                  {organisation.address_line1}
                  {organisation.address_line2 && (
                    <>
                      <br />
                      {organisation.address_line2}
                    </>
                  )}
                  <br />
                  {organisation.postal_code} {organisation.city}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-gray-500">Creee le</p>
                <p className="font-medium">
                  {new Date(organisation.created_at).toLocaleDateString(
                    'fr-FR'
                  )}
                </p>
              </div>
              {organisation.approved_at && (
                <div>
                  <p className="text-sm text-gray-500">
                    {organisation.approval_status === 'approved'
                      ? 'Approuvee le'
                      : 'Rejetee le'}
                  </p>
                  <p className="font-medium">
                    {new Date(organisation.approved_at).toLocaleDateString(
                      'fr-FR'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
