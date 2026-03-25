'use client';

import Link from 'next/link';
import {
  Badge,
  Card,
  CardContent,
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import { Send, Mail, Clock, RotateCcw, ExternalLink } from 'lucide-react';

import { CATEGORY_LABELS } from '../../utils/order-missing-fields';
import type {
  MissingFieldCategory,
  MissingFieldsResult,
} from '../../utils/order-missing-fields';
import type { OrderWithMissing, ClickableCategory } from './types';
import {
  CATEGORY_BADGE_COLORS,
  ORDER_STATUS_LABELS,
  DELIVERY_CONTACT_KEYS,
  DELIVERY_ADDRESS_KEYS,
  getInfoRequestStatus,
  formatTimeAgo,
} from './types';

// =============================================================================
// OrderStatusBadge
// =============================================================================

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_LABELS[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}

// =============================================================================
// CategoryBadges
// =============================================================================

interface CategoryBadgesProps {
  missingFields: MissingFieldsResult;
  onCategoryClick?: (category: ClickableCategory) => void;
}

export function CategoryBadges({
  missingFields,
  onCategoryClick,
}: CategoryBadgesProps) {
  const isClickable = !!onCategoryClick;

  // Build badge entries, splitting 'delivery' into contact + address
  const badges: Array<{
    key: string;
    label: string;
    color: string;
    count: number;
    fields: typeof missingFields.fields;
    clickCategory: ClickableCategory | null;
  }> = [];

  for (const [cat, fields] of Object.entries(missingFields.byCategory) as [
    MissingFieldCategory,
    typeof missingFields.fields,
  ][]) {
    if (fields.length === 0) continue;

    if (cat === 'delivery') {
      const contactFields = fields.filter(f =>
        DELIVERY_CONTACT_KEYS.includes(f.key)
      );
      const addressFields = fields.filter(f =>
        DELIVERY_ADDRESS_KEYS.includes(f.key)
      );

      if (contactFields.length > 0) {
        badges.push({
          key: 'delivery_contact',
          label: `Contact livraison (${contactFields.length})`,
          color: CATEGORY_BADGE_COLORS.delivery,
          count: contactFields.length,
          fields: contactFields,
          clickCategory: 'delivery_contact',
        });
      }
      if (addressFields.length > 0) {
        badges.push({
          key: 'delivery_address',
          label: `Adresse livraison (${addressFields.length})`,
          color: 'bg-teal-100 text-teal-700 border-teal-200',
          count: addressFields.length,
          fields: addressFields,
          clickCategory: 'delivery_address',
        });
      }
    } else {
      badges.push({
        key: cat,
        label: `${CATEGORY_LABELS[cat]} (${fields.length})`,
        color: CATEGORY_BADGE_COLORS[cat],
        count: fields.length,
        fields,
        clickCategory: cat as ClickableCategory,
      });
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 flex-wrap">
        {badges.map(badge => (
          <Tooltip key={badge.key}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  badge.color,
                  isClickable
                    ? 'cursor-pointer hover:opacity-80 transition-opacity'
                    : 'cursor-default'
                )}
                onClick={
                  isClickable && badge.clickCategory
                    ? () => onCategoryClick(badge.clickCategory!)
                    : undefined
                }
              >
                {badge.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <ul className="text-xs space-y-0.5">
                {badge.fields.map(f => (
                  <li key={f.key}>{f.label}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// =============================================================================
// OrderCard
// =============================================================================

interface OrderCardProps {
  order: OrderWithMissing;
  onSendRequest: () => void;
  onCategoryClick: (category: ClickableCategory) => void;
  variant: 'missing' | 'waiting';
}

export function OrderCard({
  order,
  onSendRequest,
  onCategoryClick,
  variant,
}: OrderCardProps) {
  const pendingReqs = order.infoRequests.filter(
    r => getInfoRequestStatus(r) === 'pending'
  );
  const latestPending = pendingReqs[0];

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Order info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg">{order.order_number}</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-gray-600">
                {order.organisationName ?? '-'}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="font-medium text-green-600">
                {formatCurrency(order.total_ttc)}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Category badges (clickable) */}
            <CategoryBadges
              missingFields={order.missingFields}
              onCategoryClick={onCategoryClick}
            />

            {/* Request status for waiting variant */}
            {variant === 'waiting' && latestPending && (
              <div className="flex items-center gap-2 text-sm bg-amber-50 rounded-lg p-2">
                <Mail className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-amber-700">
                  Envoye a <strong>{latestPending.recipient_email}</strong> (
                  {latestPending.recipient_type === 'requester'
                    ? 'demandeur'
                    : 'proprietaire'}
                  )
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(latestPending.sent_at)}
                </span>
              </div>
            )}

            {/* No request for missing variant */}
            {variant === 'missing' && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Mail className="h-3.5 w-3.5" />
                Aucune demande envoyee
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onSendRequest}>
              {variant === 'waiting' ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Relancer
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Envoyer demande
                </>
              )}
            </Button>
            <Link
              href={`/canaux-vente/linkme/commandes/${order.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Voir details
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
