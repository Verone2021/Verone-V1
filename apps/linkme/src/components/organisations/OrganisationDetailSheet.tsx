'use client';

/**
 * OrganisationDetailSheet
 *
 * Fiche détaillée d'une organisation avec onglets :
 * - Infos : Toutes les informations avec édition section par section
 * - Contacts : Téléphone, emails, site web
 * - Activité : Stats + 5 dernières commandes
 *
 * Mode view : Lecture seule (pour /reseau)
 * Mode edit : Édition section par section avec bouton modifier inline
 *
 * @module OrganisationDetailSheet
 * @since 2026-01-12
 * @updated 2026-01-15 - Refonte édition section par section (LM-ORG-005)
 */

import { useMemo, useState, useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
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
  Input,
  Label,
  AddressAutocomplete,
  type AddressResult,
  RadioGroup,
  RadioGroupItem,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
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
  Save,
  X,
  Loader2,
  AlertCircle,
  Globe,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

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
  onEdit?: () => void; // Deprecated - kept for compatibility
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

/**
 * EditableSection: Wrapper pour section éditable avec son propre état
 */
function EditableSection({
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
}: {
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
}) {
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{fullName}</p>
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
}: OrganisationDetailSheetProps) {
  const { data, isLoading, error } = useOrganisationDetail(
    open ? organisationId : null
  );

  // Map ownership_type: 'propre' -> 'succursale' for compatibility
  const contactOwnershipType =
    data?.organisation?.ownership_type === 'propre'
      ? 'succursale'
      : (data?.organisation?.ownership_type as
          | 'succursale'
          | 'franchise'
          | null);

  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContacts(
      open ? organisationId : null,
      open ? data?.organisation?.enseigne_id : null,
      open ? contactOwnershipType : null
    );

  // États pour l'édition de chaque section
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // États des formulaires par section
  const [ownershipTypeForm, setOwnershipTypeForm] = useState<
    'succursale' | 'franchise' | null
  >(null);

  const [shippingForm, setShippingForm] = useState({
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'France',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [billingForm, setBillingForm] = useState({
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'France',
  });

  const [contactsForm, setContactsForm] = useState({
    phone: '',
    email: '',
    website: '',
  });

  const [legalForm, setLegalForm] = useState({
    siren: '',
    siret: '',
    vat_number: '',
  });

  const queryClient = useQueryClient();
  const supabase = createClient();

  // Mutation générique pour mettre à jour n'importe quel champ
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!organisationId) throw new Error('No organisation ID');

      const { error } = await supabase
        .from('organisations')
        .update(updates)
        .eq('id', organisationId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organisation-detail', organisationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      toast.success('Modifications enregistrées');
      setEditingSection(null);
    },
    onError: error => {
      console.error('Error updating organisation:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Initialiser les formulaires quand les données changent
  useEffect(() => {
    if (data?.organisation) {
      const org = data.organisation;
      // Mapper 'propre' vers 'succursale' (propre est obsolète)
      const mappedOwnershipType =
        org.ownership_type === 'propre' ? 'succursale' : org.ownership_type;
      setOwnershipTypeForm(mappedOwnershipType);
      setShippingForm({
        shipping_address_line1: org.shipping_address_line1 ?? '',
        shipping_address_line2: org.shipping_address_line2 ?? '',
        shipping_city: org.shipping_city ?? '',
        shipping_postal_code: org.shipping_postal_code ?? '',
        shipping_country: org.shipping_country ?? 'France',
        latitude: org.latitude,
        longitude: org.longitude,
      });
      setBillingForm({
        billing_address_line1: org.billing_address_line1 ?? '',
        billing_address_line2: org.billing_address_line2 ?? '',
        billing_city: org.billing_city ?? '',
        billing_postal_code: org.billing_postal_code ?? '',
        billing_country: org.billing_country ?? 'France',
      });
      setContactsForm({
        phone: org.phone ?? '',
        email: org.email ?? '',
        website: org.website ?? '',
      });
      setLegalForm({
        siren: org.siren ?? '',
        siret: org.siret ?? '',
        vat_number: org.vat_number ?? '',
      });
    }
  }, [data?.organisation]);

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setEditingSection(null);
    }
  }, [open]);

  // Handlers pour chaque section
  const handleSaveOwnershipType = () => {
    updateMutation.mutate({ ownership_type: ownershipTypeForm });
  };

  const handleSaveShipping = () => {
    updateMutation.mutate(shippingForm);
  };

  const handleSaveBilling = () => {
    updateMutation.mutate(billingForm);
  };

  const handleSaveContacts = () => {
    updateMutation.mutate(contactsForm);
  };

  const handleSaveLegal = () => {
    updateMutation.mutate(legalForm);
  };

  const handleShippingAddressSelect = (address: AddressResult) => {
    setShippingForm(prev => ({
      ...prev,
      shipping_address_line1: address.streetAddress,
      shipping_city: address.city,
      shipping_postal_code: address.postalCode,
      shipping_country: address.country || 'France',
      latitude: address.latitude,
      longitude: address.longitude,
    }));
  };

  const handleBillingAddressSelect = (address: AddressResult) => {
    setBillingForm(prev => ({
      ...prev,
      billing_address_line1: address.streetAddress,
      billing_city: address.city,
      billing_postal_code: address.postalCode,
      billing_country: address.country || 'France',
    }));
  };

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
    data?.organisation?.trade_name ?? data?.organisation?.legal_name ?? '';

  const ownershipType = data?.organisation?.ownership_type;
  const isPropre = ownershipType === 'succursale';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <OrganisationLogo
                logoUrl={data?.organisation?.logo_url}
                organisationName={displayName}
                size="lg"
                fallback="icon"
                className="rounded-xl"
              />
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
              </div>
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
                Activité
              </TabsTrigger>
            </TabsList>

            {/* Onglet Infos - Sections éditables */}
            <TabsContent value="infos" className="mt-4 space-y-3">
              {/* Section Type de propriété */}
              <EditableSection
                title="Type de propriété"
                icon={Building2}
                isIncomplete={!data.organisation.ownership_type}
                isEditing={editingSection === 'ownership_type'}
                onEdit={() => setEditingSection('ownership_type')}
                onSave={handleSaveOwnershipType}
                onCancel={() => {
                  // Mapper 'propre' vers 'succursale' (propre est obsolète)
                  const mappedOwnershipType =
                    data.organisation.ownership_type === 'propre'
                      ? 'succursale'
                      : data.organisation.ownership_type;
                  setOwnershipTypeForm(mappedOwnershipType);
                  setEditingSection(null);
                }}
                isSaving={updateMutation.isPending}
                mode={mode}
                editContent={
                  <RadioGroup
                    value={ownershipTypeForm ?? ''}
                    onValueChange={value =>
                      setOwnershipTypeForm(value as 'succursale' | 'franchise')
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="succursale" id="succursale" />
                      <Label
                        htmlFor="succursale"
                        className="font-normal cursor-pointer"
                      >
                        Succursale (Restaurant propre)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="franchise" id="franchise" />
                      <Label
                        htmlFor="franchise"
                        className="font-normal cursor-pointer"
                      >
                        Franchise
                      </Label>
                    </div>
                  </RadioGroup>
                }
              >
                {ownershipType ? (
                  <Badge
                    variant={isPropre ? 'default' : 'secondary'}
                    className={isPropre ? 'bg-blue-500' : 'bg-orange-500'}
                  >
                    {isPropre ? 'Succursale (Restaurant propre)' : 'Franchise'}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-500">Non défini</p>
                )}
              </EditableSection>

              {/* Section Adresse de livraison */}
              <EditableSection
                title="Adresse de livraison"
                icon={MapPin}
                isIncomplete={!data.organisation.shipping_address_line1}
                isEditing={editingSection === 'shipping'}
                onEdit={() => setEditingSection('shipping')}
                onSave={handleSaveShipping}
                onCancel={() => {
                  setShippingForm({
                    shipping_address_line1:
                      data.organisation.shipping_address_line1 ?? '',
                    shipping_address_line2:
                      data.organisation.shipping_address_line2 ?? '',
                    shipping_city: data.organisation.shipping_city ?? '',
                    shipping_postal_code:
                      data.organisation.shipping_postal_code ?? '',
                    shipping_country:
                      data.organisation.shipping_country ?? 'France',
                    latitude: data.organisation.latitude,
                    longitude: data.organisation.longitude,
                  });
                  setEditingSection(null);
                }}
                isSaving={updateMutation.isPending}
                mode={mode}
                editContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Adresse *</Label>
                      <AddressAutocomplete
                        value={shippingForm.shipping_address_line1}
                        onChange={value =>
                          setShippingForm(prev => ({
                            ...prev,
                            shipping_address_line1: value,
                          }))
                        }
                        onSelect={handleShippingAddressSelect}
                        defaultCountry="FR"
                        placeholder="Rechercher une adresse..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Complément</Label>
                      <Input
                        value={shippingForm.shipping_address_line2}
                        onChange={e =>
                          setShippingForm(prev => ({
                            ...prev,
                            shipping_address_line2: e.target.value,
                          }))
                        }
                        placeholder="Bâtiment, étage..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm">Ville *</Label>
                        <Input
                          value={shippingForm.shipping_city}
                          onChange={e =>
                            setShippingForm(prev => ({
                              ...prev,
                              shipping_city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Code postal *</Label>
                        <Input
                          value={shippingForm.shipping_postal_code}
                          onChange={e =>
                            setShippingForm(prev => ({
                              ...prev,
                              shipping_postal_code: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                }
              >
                {shippingAddress ? (
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {shippingAddress}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Non renseignée</p>
                )}
              </EditableSection>

              {/* Section Adresse de facturation */}
              <EditableSection
                title="Adresse de facturation"
                icon={CreditCard}
                isIncomplete={!data.organisation.billing_address_line1}
                isEditing={editingSection === 'billing'}
                onEdit={() => setEditingSection('billing')}
                onSave={handleSaveBilling}
                onCancel={() => {
                  setBillingForm({
                    billing_address_line1:
                      data.organisation.billing_address_line1 ?? '',
                    billing_address_line2:
                      data.organisation.billing_address_line2 ?? '',
                    billing_city: data.organisation.billing_city ?? '',
                    billing_postal_code:
                      data.organisation.billing_postal_code ?? '',
                    billing_country:
                      data.organisation.billing_country ?? 'France',
                  });
                  setEditingSection(null);
                }}
                isSaving={updateMutation.isPending}
                mode={mode}
                editContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Adresse *</Label>
                      <AddressAutocomplete
                        value={billingForm.billing_address_line1}
                        onChange={value =>
                          setBillingForm(prev => ({
                            ...prev,
                            billing_address_line1: value,
                          }))
                        }
                        onSelect={handleBillingAddressSelect}
                        defaultCountry="FR"
                        placeholder="Rechercher une adresse..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Complément</Label>
                      <Input
                        value={billingForm.billing_address_line2}
                        onChange={e =>
                          setBillingForm(prev => ({
                            ...prev,
                            billing_address_line2: e.target.value,
                          }))
                        }
                        placeholder="Bâtiment, étage..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm">Ville *</Label>
                        <Input
                          value={billingForm.billing_city}
                          onChange={e =>
                            setBillingForm(prev => ({
                              ...prev,
                              billing_city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Code postal *</Label>
                        <Input
                          value={billingForm.billing_postal_code}
                          onChange={e =>
                            setBillingForm(prev => ({
                              ...prev,
                              billing_postal_code: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                }
              >
                {billingAddress ? (
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {billingAddress}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Non renseignée</p>
                )}
              </EditableSection>

              {/* Section Coordonnées */}
              <EditableSection
                title="Coordonnées"
                icon={Phone}
                isIncomplete={
                  !data.organisation.phone && !data.organisation.email
                }
                isEditing={editingSection === 'contacts'}
                onEdit={() => setEditingSection('contacts')}
                onSave={handleSaveContacts}
                onCancel={() => {
                  setContactsForm({
                    phone: data.organisation.phone ?? '',
                    email: data.organisation.email ?? '',
                    website: data.organisation.website ?? '',
                  });
                  setEditingSection(null);
                }}
                isSaving={updateMutation.isPending}
                mode={mode}
                editContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Téléphone</Label>
                      <Input
                        type="tel"
                        value={contactsForm.phone}
                        onChange={e =>
                          setContactsForm(prev => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input
                        type="email"
                        value={contactsForm.email}
                        onChange={e =>
                          setContactsForm(prev => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="contact@restaurant.fr"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Site web</Label>
                      <Input
                        type="url"
                        value={contactsForm.website}
                        onChange={e =>
                          setContactsForm(prev => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://www.restaurant.fr"
                      />
                    </div>
                  </div>
                }
              >
                <div className="space-y-2">
                  {data.organisation.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {data.organisation.phone}
                      </span>
                    </div>
                  )}
                  {data.organisation.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {data.organisation.email}
                      </span>
                    </div>
                  )}
                  {data.organisation.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={data.organisation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-linkme-turquoise hover:underline"
                      >
                        {data.organisation.website}
                      </a>
                    </div>
                  )}
                  {!data.organisation.phone &&
                    !data.organisation.email &&
                    !data.organisation.website && (
                      <p className="text-sm text-gray-500">Non renseignées</p>
                    )}
                </div>
              </EditableSection>

              {/* Section Informations légales */}
              <EditableSection
                title="Informations légales"
                icon={FileText}
                isIncomplete={!data.organisation.siret}
                isEditing={editingSection === 'legal'}
                onEdit={() => setEditingSection('legal')}
                onSave={handleSaveLegal}
                onCancel={() => {
                  setLegalForm({
                    siren: data.organisation.siren ?? '',
                    siret: data.organisation.siret ?? '',
                    vat_number: data.organisation.vat_number ?? '',
                  });
                  setEditingSection(null);
                }}
                isSaving={updateMutation.isPending}
                mode={mode}
                editContent={
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">SIREN (9 chiffres)</Label>
                      <Input
                        value={legalForm.siren}
                        onChange={e =>
                          setLegalForm(prev => ({
                            ...prev,
                            siren: e.target.value,
                          }))
                        }
                        placeholder="123456789"
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">SIRET (14 chiffres)</Label>
                      <Input
                        value={legalForm.siret}
                        onChange={e =>
                          setLegalForm(prev => ({
                            ...prev,
                            siret: e.target.value,
                          }))
                        }
                        placeholder="12345678901234"
                        maxLength={14}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Numéro de TVA</Label>
                      <Input
                        value={legalForm.vat_number}
                        onChange={e =>
                          setLegalForm(prev => ({
                            ...prev,
                            vat_number: e.target.value,
                          }))
                        }
                        placeholder="FR12345678901"
                      />
                    </div>
                  </div>
                }
              >
                <div className="space-y-2 text-sm">
                  {data.organisation.siren && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SIREN :</span>
                      <span className="text-gray-900 font-medium">
                        {data.organisation.siren}
                      </span>
                    </div>
                  )}
                  {data.organisation.siret && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">SIRET :</span>
                      <span className="text-gray-900 font-medium">
                        {data.organisation.siret}
                      </span>
                    </div>
                  )}
                  {data.organisation.vat_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">TVA :</span>
                      <span className="text-gray-900 font-medium">
                        {data.organisation.vat_number}
                      </span>
                    </div>
                  )}
                  {!data.organisation.siren &&
                    !data.organisation.siret &&
                    !data.organisation.vat_number && (
                      <p className="text-gray-500">Non renseignées</p>
                    )}
                </div>
              </EditableSection>
            </TabsContent>

            {/* Onglet Contacts */}
            <TabsContent value="contacts" className="mt-4 space-y-3">
              {contactsLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {!contactsLoading &&
                contactsData?.contacts &&
                contactsData.contacts.length > 0 && (
                  <div className="space-y-2">
                    {contactsData.contacts.map(contact => (
                      <ContactCard key={contact.id} contact={contact} />
                    ))}
                  </div>
                )}

              {!contactsLoading &&
                (!contactsData?.contacts ||
                  contactsData.contacts.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun contact renseigné</p>
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
                  Dernières commandes
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
      </SheetContent>
    </Sheet>
  );
}

export default OrganisationDetailSheet;
