'use client';

/**
 * OrganisationDetailSheet
 *
 * Fiche détaillée d'une organisation avec onglets :
 * - Infos : Adresses livraison/facturation (éditable inline)
 * - Contacts : Téléphone, emails, site web
 * - Activité : Stats + 5 dernières commandes
 *
 * Mode view : Lecture seule (pour /reseau)
 * Mode edit : Édition inline avec formulaire (pour /organisations)
 *
 * @module OrganisationDetailSheet
 * @since 2026-01-12
 * @updated 2026-01-14 - Refonte avec édition inline
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  ExternalLink,
  Save,
  X,
  Loader2,
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

interface FormData {
  trade_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  latitude: number | null;
  longitude: number | null;
  ownership_type: 'propre' | 'succursale' | 'franchise' | null;
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
  onEdit,
}: OrganisationDetailSheetProps) {
  const { data, isLoading, error } = useOrganisationDetail(
    open ? organisationId : null
  );

  // Hook pour les contacts de l'organisation
  // Passe aussi l'enseigne_id et is_enseigne_parent pour afficher les contacts enseigne
  // uniquement pour la maison mère (is_enseigne_parent = true)
  const { data: contactsData, isLoading: contactsLoading } =
    useOrganisationContacts(
      open ? organisationId : null,
      open ? data?.organisation?.enseigne_id : null,
      open ? (data?.organisation?.is_enseigne_parent ?? false) : false
    );

  // États pour l'édition inline
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    trade_name: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'France',
    latitude: null,
    longitude: null,
    ownership_type: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // QueryClient pour invalidation
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Mutation pour sauvegarder les modifications
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<FormData>) => {
      if (!organisationId) throw new Error('No organisation ID');

      const { error } = await supabase
        .from('organisations')
        .update(updates)
        .eq('id', organisationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organisation-detail', organisationId],
      });
      queryClient.invalidateQueries({ queryKey: ['enseigne-organisations'] });
      toast.success('Organisation mise à jour avec succès');
      setIsEditing(false);
    },
    onError: error => {
      console.error('Error updating organisation:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Initialiser le formulaire quand les données changent
  useEffect(() => {
    if (data?.organisation && !isEditing) {
      setFormData({
        trade_name: data.organisation.trade_name || '',
        shipping_address_line1: data.organisation.shipping_address_line1 || '',
        shipping_address_line2: data.organisation.shipping_address_line2 || '',
        shipping_city: data.organisation.shipping_city || '',
        shipping_postal_code: data.organisation.shipping_postal_code || '',
        shipping_country: data.organisation.shipping_country || 'France',
        latitude: (data.organisation as any).latitude || null,
        longitude: (data.organisation as any).longitude || null,
        ownership_type: data.organisation.ownership_type || null,
      });
    }
  }, [data?.organisation, isEditing]);

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setErrors({});
    }
  }, [open]);

  // Validation simple
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.trade_name.trim()) {
      newErrors.trade_name = 'Le nom commercial est obligatoire';
    }

    if (!formData.shipping_address_line1.trim()) {
      newErrors.shipping_address_line1 =
        "L'adresse de livraison est obligatoire";
    }

    if (!formData.shipping_city.trim()) {
      newErrors.shipping_city = 'La ville est obligatoire';
    }

    if (!formData.shipping_postal_code.trim()) {
      newErrors.shipping_postal_code = 'Le code postal est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler pour sauvegarder
  const handleSave = async () => {
    if (!validateForm()) return;

    await updateMutation.mutateAsync(formData);
  };

  // Handler pour annuler
  const handleCancel = () => {
    if (data?.organisation) {
      setFormData({
        trade_name: data.organisation.trade_name || '',
        shipping_address_line1: data.organisation.shipping_address_line1 || '',
        shipping_address_line2: data.organisation.shipping_address_line2 || '',
        shipping_city: data.organisation.shipping_city || '',
        shipping_postal_code: data.organisation.shipping_postal_code || '',
        shipping_country: data.organisation.shipping_country || 'France',
        latitude: (data.organisation as any).latitude || null,
        longitude: (data.organisation as any).longitude || null,
        ownership_type: data.organisation.ownership_type || null,
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  // Handler pour AddressAutocomplete
  const handleAddressSelect = (address: AddressResult) => {
    setFormData(prev => ({
      ...prev,
      shipping_address_line1: address.streetAddress,
      shipping_city: address.city,
      shipping_postal_code: address.postalCode,
      shipping_country: address.country || 'France',
      latitude: address.latitude,
      longitude: address.longitude,
    }));
    // Clear errors
    if (errors.shipping_address_line1) {
      setErrors(prev => ({ ...prev, shipping_address_line1: '' }));
    }
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
    data?.organisation?.trade_name || data?.organisation?.legal_name || '';

  const ownershipType = data?.organisation?.ownership_type;
  const isPropre = ownershipType === 'propre' || ownershipType === 'succursale';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        {/* Header avec boutons d'action */}
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo avec composant unifié (gère les URLs Supabase Storage) */}
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

            {/* Boutons d'action (mode edit uniquement) */}
            {mode === 'edit' && data && !isLoading && (
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-linkme-turquoise hover:bg-linkme-turquoise/90 text-white shrink-0"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Enregistrer
                    </Button>
                  </>
                )}
              </div>
            )}
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

            {/* Onglet Infos - Mode lecture ou édition */}
            <TabsContent value="infos" className="mt-4 space-y-3">
              {!isEditing ? (
                <>
                  {/* Mode lecture */}
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
                </>
              ) : (
                <>
                  {/* Mode édition - Formulaire inline */}
                  <div className="space-y-4">
                    {/* Nom commercial */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="trade-name"
                        className="text-sm font-medium"
                      >
                        Nom commercial *
                      </Label>
                      <Input
                        id="trade-name"
                        value={formData.trade_name}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            trade_name: e.target.value,
                          }));
                          if (errors.trade_name) {
                            setErrors(prev => ({ ...prev, trade_name: '' }));
                          }
                        }}
                        placeholder="Nom affiché"
                        className={cn(
                          errors.trade_name &&
                            'border-red-300 focus:border-red-500'
                        )}
                      />
                      {errors.trade_name && (
                        <p className="text-xs text-red-600">
                          {errors.trade_name}
                        </p>
                      )}
                    </div>

                    {/* Type de propriété */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="ownership-type"
                        className="text-sm font-medium"
                      >
                        Type de propriété
                      </Label>
                      <Select
                        value={formData.ownership_type || ''}
                        onValueChange={value => {
                          setFormData(prev => ({
                            ...prev,
                            ownership_type: value as
                              | 'propre'
                              | 'succursale'
                              | 'franchise'
                              | null,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="propre">Propre</SelectItem>
                          <SelectItem value="succursale">Succursale</SelectItem>
                          <SelectItem value="franchise">Franchise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Adresse de livraison */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Adresse de livraison *
                      </Label>
                      <AddressAutocomplete
                        value={formData.shipping_address_line1}
                        onChange={value => {
                          setFormData(prev => ({
                            ...prev,
                            shipping_address_line1: value,
                          }));
                        }}
                        onSelect={handleAddressSelect}
                        defaultCountry="FR"
                        placeholder="Rechercher une adresse..."
                        error={errors.shipping_address_line1}
                      />
                    </div>

                    {/* Complément d'adresse */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="address-line2"
                        className="text-sm font-medium"
                      >
                        Complément d'adresse
                      </Label>
                      <Input
                        id="address-line2"
                        value={formData.shipping_address_line2}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            shipping_address_line2: e.target.value,
                          }))
                        }
                        placeholder="Bâtiment, étage, etc."
                      />
                    </div>

                    {/* Ville (affichée, non éditable directement - vient de l'autocomplete) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          Ville *
                        </Label>
                        <Input
                          id="city"
                          value={formData.shipping_city}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              shipping_city: e.target.value,
                            }));
                            if (errors.shipping_city) {
                              setErrors(prev => ({
                                ...prev,
                                shipping_city: '',
                              }));
                            }
                          }}
                          className={cn(
                            errors.shipping_city && 'border-red-300'
                          )}
                        />
                        {errors.shipping_city && (
                          <p className="text-xs text-red-600">
                            {errors.shipping_city}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="postal-code"
                          className="text-sm font-medium"
                        >
                          Code postal *
                        </Label>
                        <Input
                          id="postal-code"
                          value={formData.shipping_postal_code}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              shipping_postal_code: e.target.value,
                            }));
                            if (errors.shipping_postal_code) {
                              setErrors(prev => ({
                                ...prev,
                                shipping_postal_code: '',
                              }));
                            }
                          }}
                          className={cn(
                            errors.shipping_postal_code && 'border-red-300'
                          )}
                        />
                        {errors.shipping_postal_code && (
                          <p className="text-xs text-red-600">
                            {errors.shipping_postal_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
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
      </SheetContent>
    </Sheet>
  );
}

export default OrganisationDetailSheet;
