'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { TableCell, TableRow } from '@verone/ui';
import {
  Briefcase,
  CheckCircle,
  Edit,
  Store,
  Trash2,
  XCircle,
} from 'lucide-react';

import { statusConfig, typeConfig } from './config';
import type { Affiliate } from './types';

interface AffiliateTableRowProps {
  affiliate: Affiliate;
  onEdit: (affiliate: Affiliate) => void;
  onStatusChange: (
    affiliateId: string,
    newStatus: 'active' | 'suspended'
  ) => Promise<void>;
  onDelete: (affiliateId: string) => Promise<void>;
}

export function AffiliateTableRow({
  affiliate,
  onEdit,
  onStatusChange,
  onDelete,
}: AffiliateTableRowProps) {
  const typeInfo =
    typeConfig[
      (affiliate.affiliate_type || 'enseigne') as keyof typeof typeConfig
    ];
  const statusInfo =
    statusConfig[(affiliate.status ?? 'pending') as keyof typeof statusConfig];
  const linkedEntityName =
    affiliate.organisation_name ?? affiliate.enseigne_name;
  const linkedEntityType = affiliate.enseigne_id
    ? 'enseigne'
    : affiliate.organisation_id
      ? 'organisation'
      : null;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${typeInfo.bgColor}`}>
            <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
          </div>
          <div>
            <div className="font-medium">{affiliate.display_name}</div>
            <div className="text-sm text-muted-foreground">
              Créé le{' '}
              {affiliate.created_at
                ? new Date(affiliate.created_at).toLocaleDateString('fr-FR')
                : '-'}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {linkedEntityName ? (
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded ${linkedEntityType === 'enseigne' ? 'bg-purple-100' : 'bg-blue-100'}`}
            >
              {linkedEntityType === 'enseigne' ? (
                <Store className="h-3 w-3 text-purple-600" />
              ) : (
                <Briefcase className="h-3 w-3 text-blue-600" />
              )}
            </div>
            <span className="text-sm">{linkedEntityName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Badge variant="outline">{typeInfo.label}</Badge>
      </TableCell>
      <TableCell className="hidden xl:table-cell font-mono text-sm">
        /{affiliate.slug}
      </TableCell>
      <TableCell>
        <Badge variant={statusInfo.variant}>
          <statusInfo.icon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {affiliate.status === 'pending' && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                void onStatusChange(affiliate.id, 'active').catch(error => {
                  console.error('[Affiliates] Status change failed:', error);
                });
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Valider
            </ButtonV2>
          )}
          {affiliate.status === 'active' && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                void onStatusChange(affiliate.id, 'suspended').catch(error => {
                  console.error('[Affiliates] Status change failed:', error);
                });
              }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Suspendre
            </ButtonV2>
          )}
          {affiliate.status === 'suspended' && (
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                void onStatusChange(affiliate.id, 'active').catch(error => {
                  console.error('[Affiliates] Status change failed:', error);
                });
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Réactiver
            </ButtonV2>
          )}
          <ButtonV2 variant="ghost" size="sm" onClick={() => onEdit(affiliate)}>
            <Edit className="h-4 w-4" />
          </ButtonV2>
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={() => {
              void onDelete(affiliate.id).catch(error => {
                console.error('[Affiliates] Delete failed:', error);
              });
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </ButtonV2>
        </div>
      </TableCell>
    </TableRow>
  );
}
