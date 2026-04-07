'use client';

import { Badge, Button, cn } from '@verone/ui';
import {
  AlertCircle,
  Calendar,
  Edit,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  Smartphone,
  Trash2,
  User,
  X,
} from 'lucide-react';

import type { OrganisationContact } from '../../../lib/hooks/use-organisation-contacts';
import type { OrganisationOrder } from '../../../lib/hooks/use-organisation-detail';

// ============================================================================
// HELPERS
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function getStatusBadge(status: string) {
  const statusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' }
  > = {
    draft: { label: 'Brouillon', variant: 'secondary' },
    pending: { label: 'En attente', variant: 'outline' },
    confirmed: { label: 'Confirmée', variant: 'default' },
    shipped: { label: 'Expédiée', variant: 'default' },
    delivered: { label: 'Livrée', variant: 'success' },
    cancelled: { label: 'Annulée', variant: 'secondary' },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: 'secondary' as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ============================================================================
// EDITABLE SECTION
// ============================================================================

interface EditableSectionProps {
  title: string;
  icon?: React.ElementType;
  isIncomplete?: boolean;
  children: React.ReactNode;
  editContent: React.ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  mode: 'view' | 'edit';
}

export function EditableSection({
  title,
  icon: Icon,
  isIncomplete,
  children,
  editContent,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving,
  mode,
}: EditableSectionProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-colors',
        isIncomplete
          ? 'bg-orange-50/50 border-orange-200'
          : 'bg-gray-50 border-gray-200'
      )}
    >
      {/* Header de la section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-500" />}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {isIncomplete && (
            <Badge
              variant="outline"
              className="text-xs bg-orange-100 text-orange-700 border-orange-300"
            >
              <AlertCircle className="h-3 w-3 mr-1" />À compléter
            </Badge>
          )}
        </div>

        {/* Boutons d'action - seulement en mode edit */}
        {mode === 'edit' && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
            ) : (
              <>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Annuler
                </Button>
                <Button
                  onClick={onSave}
                  size="sm"
                  className="h-7 px-2 bg-linkme-turquoise hover:bg-linkme-turquoise/90 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contenu de la section */}
      <div className="space-y-3">{isEditing ? editContent : children}</div>
    </div>
  );
}

// ============================================================================
// CONTACT CARD
// ============================================================================

interface ContactCardProps {
  contact: OrganisationContact;
  onEdit?: (contact: OrganisationContact) => void;
  onDelete?: (contact: OrganisationContact) => void;
  mode: 'view' | 'edit';
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  mode,
}: ContactCardProps) {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const roles: string[] = [];
  if (contact.isPrimaryContact) roles.push('Responsable');
  if (contact.isBillingContact) roles.push('Facturation');
  if (contact.isTechnicalContact) roles.push('Technique');

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      {/* Header avec nom et rôles */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-linkme-turquoise/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-linkme-turquoise" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate flex-1">
              {fullName}
            </p>
            {mode === 'edit' && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onEdit?.(contact)}
                  className="p-1 text-gray-400 hover:text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded transition-colors"
                  title="Modifier"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete?.(contact)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {contact.isUser && (
              <Badge className="text-xs bg-blue-500 text-white">
                Utilisateur
              </Badge>
            )}
          </div>
          {contact.title && (
            <p className="text-xs text-gray-500 truncate">{contact.title}</p>
          )}
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {roles.map(role => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="text-xs bg-linkme-turquoise/10 text-linkme-turquoise"
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coordonnées */}
      <div className="pl-13 space-y-1">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-linkme-turquoise transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-linkme-turquoise transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>{contact.phone}</span>
          </a>
        )}
        {contact.mobile && (
          <a
            href={`tel:${contact.mobile}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-linkme-turquoise transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>{contact.mobile}</span>
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'turquoise' | 'green' | 'purple';
}

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    turquoise: {
      bg: 'bg-linkme-turquoise/10',
      icon: 'text-linkme-turquoise',
      label: 'text-linkme-turquoise',
      value: 'text-gray-900',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      label: 'text-green-600',
      value: 'text-green-900',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      label: 'text-purple-600',
      value: 'text-purple-900',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} rounded-lg p-3 text-center`}>
      <Icon className={`h-5 w-5 ${classes.icon} mx-auto mb-1`} />
      <p className={`text-xs ${classes.label} font-medium mb-1`}>{label}</p>
      <p className={`text-lg font-bold ${classes.value}`}>{value}</p>
    </div>
  );
}

// ============================================================================
// ORDER ROW
// ============================================================================

interface OrderRowProps {
  order: OrganisationOrder;
}

export function OrderRow({ order }: OrderRowProps) {
  return (
    <a
      href={`/commandes?detail=${order.id}`}
      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-100 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{order.reference}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {formatCurrency(order.total_ht)}
        </p>
        {getStatusBadge(order.status)}
      </div>
    </a>
  );
}
