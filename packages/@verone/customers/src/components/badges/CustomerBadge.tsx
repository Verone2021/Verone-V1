/**
 * Composant: CustomerBadge
 * Description: Badge compact pour afficher nom client (B2B/B2C)
 *
 * Features:
 * - B2B: legal_name ou trade_name + icône Building2
 * - B2C: first_name + last_name + icône User
 * - Tooltip avec infos complètes au hover
 * - Variant colors: B2B (blue), B2C (purple)
 */

import { Building2, User } from 'lucide-react';

import { Badge } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';

// =====================================================================
// TYPES
// =====================================================================

export interface CustomerBadgeProps {
  // B2B Organisation
  organisationId?: string | null;
  organisationLegalName?: string | null;
  organisationTradeName?: string | null;

  // B2C Individual
  individualId?: string | null;
  individualFirstName?: string | null;
  individualLastName?: string | null;
  individualEmail?: string | null;

  // Optional
  showIcon?: boolean;
  compact?: boolean;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function CustomerBadge({
  organisationId,
  organisationLegalName,
  organisationTradeName,
  individualId,
  individualFirstName,
  individualLastName,
  individualEmail,
  showIcon = true,
  compact = false,
}: CustomerBadgeProps) {
  // Déterminer le type client
  const isB2B = !!organisationId;
  const isB2C = !!individualId;

  // Si aucun client, retourner null
  if (!isB2B && !isB2C) {
    return null;
  }

  // Display name (compact)
  let displayName = '';
  let fullName = '';
  let customerType = '';

  if (isB2B) {
    displayName =
      organisationTradeName || organisationLegalName || 'Organisation inconnue';
    fullName = `${organisationLegalName}${organisationTradeName ? ` (${organisationTradeName})` : ''}`;
    customerType = 'B2B';
  } else if (isB2C) {
    displayName = `${individualFirstName} ${individualLastName}`;
    fullName = displayName;
    customerType = 'B2C';
  }

  // Truncate si trop long (compact mode)
  const truncatedName =
    compact && displayName.length > 25
      ? `${displayName.substring(0, 25)}...`
      : displayName;

  // Icon
  const Icon = isB2B ? Building2 : User;

  // Badge variant
  const variant = isB2B ? 'default' : 'secondary';

  // Tooltip content
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{fullName}</div>
      <div className="text-xs text-muted-foreground">Type: {customerType}</div>
      {isB2C && individualEmail && (
        <div className="text-xs text-muted-foreground">
          Email: {individualEmail}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={`
              cursor-pointer transition-all
              ${isB2B ? 'bg-blue-100 text-blue-900 hover:bg-blue-200' : 'bg-purple-100 text-purple-900 hover:bg-purple-200'}
            `}
          >
            {showIcon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
            <span className="text-xs font-medium">{truncatedName}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =====================================================================
// HELPER: Extraire props depuis CustomerSample
// =====================================================================

export function customerBadgePropsFromSample(sample: {
  customer_org_id?: string | null;
  customer_org_legal_name?: string | null;
  customer_org_trade_name?: string | null;
  customer_ind_id?: string | null;
  customer_ind_first_name?: string | null;
  customer_ind_last_name?: string | null;
  customer_ind_email?: string | null;
}): CustomerBadgeProps {
  return {
    organisationId: sample.customer_org_id,
    organisationLegalName: sample.customer_org_legal_name,
    organisationTradeName: sample.customer_org_trade_name,
    individualId: sample.customer_ind_id,
    individualFirstName: sample.customer_ind_first_name,
    individualLastName: sample.customer_ind_last_name,
    individualEmail: sample.customer_ind_email,
  };
}
