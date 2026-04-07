'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { Badge, IconButton } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Briefcase, Eye, Archive, ArchiveRestore } from 'lucide-react';

import type { OrganisationIndependante } from './types';

interface OrganisationCardProps {
  org: OrganisationIndependante;
  getLogoUrl: (logoPath: string | null) => string | null;
}

export function OrganisationCard({ org, getLogoUrl }: OrganisationCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() =>
        router.push(`/canaux-vente/linkme/organisations/${org.id}`)
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Logo */}
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
            {org.logo_url ? (
              <Image
                src={getLogoUrl(org.logo_url) ?? ''}
                alt={org.trade_name ?? org.legal_name}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <Briefcase className="h-8 w-8 text-gray-400" />
            )}
          </div>
          {/* Status badge */}
          <Badge variant={org.is_linkme_active ? 'default' : 'secondary'}>
            {org.is_linkme_active ? 'Active' : 'Archivée'}
          </Badge>
        </div>

        {/* Name + Location */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg">
            {org.trade_name ?? org.legal_name}
          </h3>
          {org.city && (
            <span className="text-sm text-muted-foreground">
              {org.city}
              {org.postal_code && ` (${org.postal_code})`}
            </span>
          )}
        </div>

        {/* Actions - Voir détails + Archiver (comme enseignes) */}
        <div
          className="flex items-center gap-2 pt-4 border-t"
          onClick={e => e.stopPropagation()}
        >
          <IconButton
            icon={Eye}
            label="Voir les détails"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/canaux-vente/linkme/organisations/${org.id}`)
            }
          />
          <IconButton
            icon={org.is_linkme_active ? Archive : ArchiveRestore}
            label={org.is_linkme_active ? 'Archiver' : 'Restaurer'}
            variant={org.is_linkme_active ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              // TODO: Implémenter toggle is_linkme_active sur organisations
              toast({
                title: 'Fonctionnalité en cours',
                description:
                  "L'archivage des organisations sera disponible prochainement",
              });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
