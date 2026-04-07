'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Badge, IconButton } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Building2,
  Store,
  Users,
  Layers,
  Eye,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

import type { EnseigneWithStats } from '../../hooks/use-linkme-enseignes';

interface EnseigneCardProps {
  enseigne: EnseigneWithStats;
  getLogoUrl: (logoPath: string | null) => string | null;
  onToggleActive: (enseigne: EnseigneWithStats) => void;
}

export function EnseigneCard({
  enseigne,
  getLogoUrl,
  onToggleActive,
}: EnseigneCardProps) {
  const router = useRouter();

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() =>
        router.push(`/canaux-vente/linkme/enseignes/${enseigne.id}`)
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Logo */}
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
            {enseigne.logo_url ? (
              <Image
                src={getLogoUrl(enseigne.logo_url) ?? ''}
                alt={enseigne.name}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-gray-400" />
            )}
          </div>
          {/* Status badge */}
          <Badge variant={enseigne.is_active ? 'default' : 'secondary'}>
            {enseigne.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-lg mb-4">{enseigne.name}</h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Store className="h-4 w-4" />
            <span>{enseigne.organisations_count} shops</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{enseigne.affiliates_count} affiliés</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>{enseigne.selections_count} sélections</span>
          </div>
        </div>

        {/* Actions - Voir + Archiver (pas de Modifier/Supprimer - données CRM) */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <IconButton
            icon={Eye}
            label="Voir les détails"
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              router.push(`/canaux-vente/linkme/enseignes/${enseigne.id}`);
            }}
          />
          <IconButton
            icon={enseigne.is_active ? Archive : ArchiveRestore}
            label={enseigne.is_active ? 'Archiver' : 'Restaurer'}
            variant={enseigne.is_active ? 'secondary' : 'outline'}
            size="sm"
            onClick={e => {
              e.stopPropagation();
              void Promise.resolve(onToggleActive(enseigne)).catch(error => {
                console.error('[EnseigneCard] onToggleActive failed:', error);
              });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
