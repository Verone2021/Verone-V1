'use client';

import Image from 'next/image';

import { Badge, ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Store, Users, Layers, Archive, ArchiveRestore } from 'lucide-react';

import {
  useLinkMeEnseigneOrganisations,
  type EnseigneWithStats,
} from '../../hooks/use-linkme-enseignes';

interface EnseigneDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigne: EnseigneWithStats | null;
  getLogoUrl: (logoPath: string | null) => string | null;
  onToggleActive: (enseigne: EnseigneWithStats) => Promise<void>;
}

export function EnseigneDetailModal({
  open,
  onOpenChange,
  enseigne,
  getLogoUrl,
  onToggleActive,
}: EnseigneDetailModalProps) {
  const { data: selectedEnseigneOrgs } = useLinkMeEnseigneOrganisations(
    open ? (enseigne?.id ?? null) : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {enseigne?.logo_url && (
              <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden border">
                <Image
                  src={getLogoUrl(enseigne.logo_url) ?? ''}
                  alt={enseigne.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            )}
            {enseigne?.name}
            <Badge variant={enseigne?.is_active ? 'default' : 'secondary'}>
              {enseigne?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {enseigne?.description ?? 'Aucune description'}
          </DialogDescription>
        </DialogHeader>

        {enseigne && (
          <div className="space-y-6 py-4">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {enseigne.organisations_count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Organisations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {enseigne.affiliates_count}
                      </p>
                      <p className="text-xs text-muted-foreground">Affiliés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {enseigne.selections_count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sélections
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Organisations list */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Organisations rattachées
              </h4>
              {selectedEnseigneOrgs && selectedEnseigneOrgs.length > 0 ? (
                <div className="space-y-2">
                  {selectedEnseigneOrgs.map(org => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <Image
                            src={getLogoUrl(org.logo_url) ?? ''}
                            alt={org.name}
                            width={32}
                            height={32}
                            className="rounded-md object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
                            <Store className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{org.name}</p>
                          {org.is_enseigne_parent && (
                            <Badge variant="outline" className="text-xs">
                              Siège
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={org.is_active ? 'default' : 'secondary'}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucune organisation rattachée
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <ButtonV2
            variant={enseigne?.is_active ? 'secondary' : 'default'}
            onClick={() => {
              if (enseigne) {
                void Promise.resolve(onToggleActive(enseigne)).catch(error => {
                  console.error(
                    '[EnseigneDetailModal] onToggleActive failed:',
                    error
                  );
                });
              }
            }}
            icon={enseigne?.is_active ? Archive : ArchiveRestore}
          >
            {enseigne?.is_active ? 'Archiver' : 'Restaurer'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
