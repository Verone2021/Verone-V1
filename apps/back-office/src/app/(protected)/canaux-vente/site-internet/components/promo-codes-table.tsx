'use client';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Plus,
  Search,
  Tag,
  Pencil,
  Trash2,
  Percent,
  BadgeEuro,
  Truck,
  Zap,
} from 'lucide-react';

import type { PromoCode } from './promo-codes-types';

// ============================================
// Status Badge
// ============================================

function isExpired(validUntil: string) {
  return new Date(validUntil) < new Date();
}

interface PromoStatusBadgeProps {
  isActive: boolean;
  validUntil: string;
}

export function PromoStatusBadge({
  isActive,
  validUntil,
}: PromoStatusBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600">
        Inactif
      </Badge>
    );
  }
  if (isExpired(validUntil)) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        Expiré
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700">
      Actif
    </Badge>
  );
}

// ============================================
// Table Row
// ============================================

interface PromoTableRowProps {
  promo: PromoCode;
  onEdit: (promo: PromoCode) => void | Promise<void>;
  onDelete: (id: string, code: string) => void;
  isDeleting: boolean;
}

function PromoTableRow({
  promo,
  onEdit,
  onDelete,
  isDeleting,
}: PromoTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {promo.is_automatic && (
            <span title="Automatique">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            </span>
          )}
          {promo.code ? (
            <span className="font-mono font-bold">{promo.code}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">Auto</span>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">{promo.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {promo.discount_type === 'free_shipping' ? (
            <>
              <Truck className="h-3.5 w-3.5" />
              Livraison gratuite
            </>
          ) : promo.discount_type === 'percentage' ? (
            <>
              <Percent className="h-3.5 w-3.5" />
              {promo.discount_value}%
            </>
          ) : (
            <>
              <BadgeEuro className="h-3.5 w-3.5" />
              {promo.discount_value} EUR
            </>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
        {new Date(promo.valid_from).toLocaleDateString('fr-FR')} →{' '}
        {new Date(promo.valid_until).toLocaleDateString('fr-FR')}
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {promo.current_uses}
        {promo.max_uses_total ? ` / ${promo.max_uses_total}` : ''}
      </TableCell>
      <TableCell>
        <PromoStatusBadge
          isActive={promo.is_active}
          validUntil={promo.valid_until}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={() => {
              void Promise.resolve(onEdit(promo)).catch((err: unknown) => {
                console.error('[PromoTable] Edit error:', err);
              });
            }}
          >
            <Pencil className="h-4 w-4" />
          </ButtonV2>
          <ButtonV2
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(promo.id, promo.code ?? promo.name)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </ButtonV2>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================
// Table
// ============================================

export interface PromoTableProps {
  filtered: PromoCode[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onEdit: (promo: PromoCode) => void | Promise<void>;
  onDelete: (id: string, code: string) => void;
  isDeleting: boolean;
  onCreateClick: () => void;
}

export function PromoTable({
  filtered,
  isLoading,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  isDeleting,
  onCreateClick,
}: PromoTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Promotions
          </CardTitle>
          <ButtonV2 size="sm" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle promotion
          </ButtonV2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun code promo
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead className="hidden lg:table-cell">Nom</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead className="hidden lg:table-cell">Validité</TableHead>
                <TableHead className="hidden xl:table-cell">Utilisations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(promo => (
                <PromoTableRow
                  key={promo.id}
                  promo={promo}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
