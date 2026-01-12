'use client';

/**
 * OrganisationDetailSheet
 *
 * Fiche détaillée d'une organisation avec onglets :
 * - Infos : Adresses livraison/facturation
 * - Contacts : Téléphone, emails, site web
 * - Activité : Stats + 5 dernières commandes
 *
 * Mode view : Lecture seule (pour /reseau)
 * Mode edit : Avec bouton "Modifier" (pour /organisations)
 *
 * @module OrganisationDetailSheet
 * @since 2026-01-12
 */

import { useMemo } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  Skeleton,
} from '@verone/ui';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Euro,
  Coins,
  Package,
  Calendar,
  Edit,
  FileText,
  User,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

import {
  useOrganisationContacts,
  type OrganisationContact,
} from '../../lib/hooks/use-organisation-contacts';
import {
  useOrganisationDetail,
  type OrganisationOrder,
} from '../../lib/hooks/use-organisation-detail';

// =====================================================================
// TYPES
// =====================================================================

interface OrganisationDetailSheetProps {
  organisationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
  onEdit?: () => void;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
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

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function AddressCard({
  title,
  address,
  icon: Icon,
}: {
  title: string;
  address: string | null;
  icon: React.ElementType;
}) {
  if (!address) return null;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-sm text-gray-900 whitespace-pre-line">{address}</p>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;

  const content = (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-gray-900 truncate">{value}</p>
      </div>
      {href && <ExternalLink className="h-4 w-4 text-gray-400" />}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

function ContactCard({ contact }: { contact: OrganisationContact }) {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const roles: string[] = [];
  if (contact.isPrimaryContact) roles.push('Principal');
  if (contact.isBillingContact) roles.push('Facturation');
  if (contact.isCommercialContact) roles.push('Commercial');
  if (contact.isTechnicalContact) roles.push('Technique');

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      {/* Header avec nom et rôles */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-linkme-turquoise/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-linkme-turquoise" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{fullName}</p>
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'turquoise' | 'green' | 'purple';
}) {
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

function OrderRow({ order }: { order: OrganisationOrder }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
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
    </div>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export function OrganisationDetailSheet({
  organisationId,
  open,
  onOpenChange,
  mode,
  onEdit,
}: OrganisationDetailSheetProps) {
  const { data, isLoading, error } = useOrganisationDetail(
    open ? organisationId : null
  );

  // Hook pour les contacts de l'organisation
  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContacts(open ? organisationId : null);

  // Adresses formatées
  const shippingAddress = useMemo(() => {
    if (!data?.organisation) return null;
    const org = data.organisation;
    const parts = [
      org.shipping_address_line1,
      org.shipping_address_line2,
      [org.shipping_postal_code, org.shipping_city].filter(Boolean).join(' '),
      org.shipping_country && org.shipping_country !== 'France'
        ? org.shipping_country
        : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }, [data?.organisation]);

  const billingAddress = useMemo(() => {
    if (!data?.organisation) return null;
    const org = data.organisation;
    const parts = [
      org.billing_address_line1,
      org.billing_address_line2,
      [org.billing_postal_code, org.billing_city].filter(Boolean).join(' '),
      org.billing_country && org.billing_country !== 'France'
        ? org.billing_country
        : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }, [data?.organisation]);

  const displayName =
    data?.organisation?.trade_name || data?.organisation?.legal_name || '';

  const ownershipType = data?.organisation?.ownership_type;
  const isPropre = ownershipType === 'propre' || ownershipType === 'succursale';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            {/* Logo ou icône */}
            {data?.organisation?.logo_url ? (
              <img
                src={data.organisation.logo_url}
                alt={displayName}
                className="w-14 h-14 rounded-xl object-cover border"
              />
            ) : (
              <div className="w-14 h-14 bg-linkme-turquoise/10 rounded-xl flex items-center justify-center">
                <Building2 className="h-7 w-7 text-linkme-turquoise" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">
                {displayName}
              </SheetTitle>
              {data?.organisation?.trade_name &&
                data.organisation.trade_name !==
                  data.organisation.legal_name && (
                  <p className="text-sm text-gray-500 truncate">
                    {data.organisation.legal_name}
                  </p>
                )}
              {ownershipType && (
                <Badge
                  variant={isPropre ? 'default' : 'secondary'}
                  className={`mt-1 ${isPropre ? 'bg-blue-500' : 'bg-orange-500'}`}
                >
                  {isPropre ? 'Restaurant propre' : 'Franchise'}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="py-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-6 text-center text-red-500">
            <p>Erreur lors du chargement</p>
          </div>
        )}

        {/* Content */}
        {data && !isLoading && (
          <Tabs defaultValue="infos" className="mt-4">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100">
              <TabsTrigger
                value="infos"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Infos
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Contacts
              </TabsTrigger>
              <TabsTrigger
                value="activite"
                className="data-[state=active]:bg-linkme-turquoise data-[state=active]:text-white"
              >
                Activite
              </TabsTrigger>
            </TabsList>

            {/* Onglet Infos */}
            <TabsContent value="infos" className="mt-4 space-y-3">
              <AddressCard
                title="Adresse de livraison"
                address={shippingAddress}
                icon={MapPin}
              />
              <AddressCard
                title="Adresse de facturation"
                address={billingAddress}
                icon={MapPin}
              />

              {/* Infos légales */}
              {(data.organisation.siren ||
                data.organisation.siret ||
                data.organisation.vat_number) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Informations legales
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    {data.organisation.siren && (
                      <p>
                        <span className="text-gray-500">SIREN :</span>{' '}
                        {data.organisation.siren}
                      </p>
                    )}
                    {data.organisation.siret && (
                      <p>
                        <span className="text-gray-500">SIRET :</span>{' '}
                        {data.organisation.siret}
                      </p>
                    )}
                    {data.organisation.vat_number && (
                      <p>
                        <span className="text-gray-500">TVA :</span>{' '}
                        {data.organisation.vat_number}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Onglet Contacts */}
            <TabsContent value="contacts" className="mt-4 space-y-3">
              {/* Loading state for contacts */}
              {contactsLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {/* Liste des contacts */}
              {!contactsLoading &&
                contactsData?.contacts &&
                contactsData.contacts.length > 0 && (
                  <div className="space-y-2">
                    {contactsData.contacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                )}

              {/* Aucun contact */}
              {!contactsLoading &&
                (!contactsData?.contacts ||
                  contactsData.contacts.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun contact renseigne</p>
                  </div>
                )}
            </TabsContent>

            {/* Onglet Activité */}
            <TabsContent value="activite" className="mt-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <StatCard
                  icon={Euro}
                  label="CA HT"
                  value={formatCurrency(data.stats.totalRevenueHT)}
                  color="turquoise"
                />
                <StatCard
                  icon={Coins}
                  label="Commissions"
                  value={formatCurrency(data.stats.totalCommissionsHT)}
                  color="green"
                />
                <StatCard
                  icon={Package}
                  label="Commandes"
                  value={data.stats.orderCount}
                  color="purple"
                />
              </div>

              {/* Dernières commandes */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Dernieres commandes
                </p>
                {data.recentOrders.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-2">
                    {data.recentOrders.map(order => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune commande</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer avec bouton Modifier (mode edit uniquement) */}
        {mode === 'edit' && data && !isLoading && onEdit && (
          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={onEdit}
              className="w-full bg-linkme-turquoise hover:bg-linkme-turquoise/90 text-white"
              size="lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default OrganisationDetailSheet;
